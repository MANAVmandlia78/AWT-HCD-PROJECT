const express = require('express');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
const jwt = require("jsonwebtoken"); // ✅ NEW
const db = require("./config/db");
const io = new Server({ cors: true });
const cors = require("cors");
const app = express();
const authRoutes = require("./routes/authRoutes");
require("dotenv").config();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(bodyParser.json());
app.use("/api/auth", authRoutes);

// 🔥 UPDATED MAPS
const socketToUserMapping = new Map(); // socketId -> userId
const socketToRoleMapping = new Map(); // socketId -> role
const socketToRoomMapping = new Map();

const rooms = new Map();

// helper
const getParticipantsPayload = (roomState) =>
  Array.from(roomState.participants.entries()).map(([socketId, userId]) => ({
    socketId,
    userId,
  }));

// 🔥 SOCKET CONNECTION
io.on('connection', (socket) => {

  // ✅ JOIN ROOM WITH JWT
  socket.on('join-room', (data) => {
    const { roomId, token } = data;

    if (!token) return;

    let user;
    try {
      user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return socket.emit("error", "Invalid token");
    }

    const userId = user.id;
    const role = user.role;

    console.log('User', userId, 'Joined Room', roomId);

    socketToUserMapping.set(socket.id, userId);
    socketToRoleMapping.set(socket.id, role);
    socketToRoomMapping.set(socket.id, roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, { participants: new Map(), currentSharerSocketId: null });
    }

    const roomState = rooms.get(roomId);
    roomState.participants.set(socket.id, userId);

    socket.join(roomId);

    socket.emit('joined-room', {
      roomId,
      participants: getParticipantsPayload(roomState),
      currentSharer: roomState.currentSharerSocketId
        ? {
            socketId: roomState.currentSharerSocketId,
            userId: roomState.participants.get(roomState.currentSharerSocketId),
          }
        : null,
    });

    socket.broadcast.to(roomId).emit('participant-joined', {
      socketId: socket.id,
      userId
    });

    io.to(roomId).emit('participants-update', {
      participants: getParticipantsPayload(roomState)
    });
  });

  // ✅ GET ROOM STATE
  socket.on('get-room-state', () => {
    const roomId = socketToRoomMapping.get(socket.id);
    if (!roomId) return;

    const roomState = rooms.get(roomId);
    if (!roomState) return;

    socket.emit('room-state', {
      roomId,
      participants: getParticipantsPayload(roomState),
      currentSharer: roomState.currentSharerSocketId
        ? {
            socketId: roomState.currentSharerSocketId,
            userId: roomState.participants.get(roomState.currentSharerSocketId),
          }
        : null,
    });
  });

  // 🔥 ROLE-BASED SCREEN SHARE
  socket.on('request-screen-share', () => {
    const roomId = socketToRoomMapping.get(socket.id);
    if (!roomId) return;

    const role = socketToRoleMapping.get(socket.id);

    // ✅ ONLY TEACHER CAN SHARE
    if (role !== "teacher") {
      return socket.emit('screen-share-denied', {
        message: "Only teacher can share screen"
      });
    }

    const roomState = rooms.get(roomId);
    if (!roomState) return;

    if (roomState.currentSharerSocketId && roomState.currentSharerSocketId !== socket.id) {
      return socket.emit('screen-share-denied', {
        sharerSocketId: roomState.currentSharerSocketId,
      });
    }

    roomState.currentSharerSocketId = socket.id;

    io.to(roomId).emit('screen-share-started', {
      sharerSocketId: socket.id,
      userId: roomState.participants.get(socket.id),
    });
  });

  socket.on('stop-screen-share', () => {
    const roomId = socketToRoomMapping.get(socket.id);
    if (!roomId) return;

    const roomState = rooms.get(roomId);
    if (!roomState) return;

    if (roomState.currentSharerSocketId !== socket.id) return;

    roomState.currentSharerSocketId = null;

    io.to(roomId).emit('screen-share-stopped');
  });

  // ✅ WEBRTC EVENTS (UNCHANGED)
  socket.on('webrtc-offer', data => {
    const { to, offer } = data;
    if (!to || !offer) return;

    socket.to(to).emit('webrtc-offer', {
      from: socket.id,
      fromUser: socketToUserMapping.get(socket.id),
      offer
    });
  });

  socket.on('webrtc-answer', data => {
    const { to, answer } = data;
    if (!to || !answer) return;

    socket.to(to).emit('webrtc-answer', {
      from: socket.id,
      answer
    });
  });

  socket.on('webrtc-ice-candidate', data => {
    const { to, candidate } = data;
    if (!to || !candidate) return;

    socket.to(to).emit('webrtc-ice-candidate', {
      from: socket.id,
      candidate
    });
  });

  // 🔴 DISCONNECT
  socket.on('disconnect', () => {
    const roomId = socketToRoomMapping.get(socket.id);
    const userId = socketToUserMapping.get(socket.id);

    socketToRoomMapping.delete(socket.id);
    socketToUserMapping.delete(socket.id);
    socketToRoleMapping.delete(socket.id);

    if (!roomId) return;

    const roomState = rooms.get(roomId);
    if (!roomState) return;

    roomState.participants.delete(socket.id);

    if (roomState.currentSharerSocketId === socket.id) {
      roomState.currentSharerSocketId = null;
      io.to(roomId).emit('screen-share-stopped');
    }

    socket.to(roomId).emit('participant-left', {
      socketId: socket.id,
      userId
    });

    io.to(roomId).emit('participants-update', {
      participants: getParticipantsPayload(roomState)
    });

    if (roomState.participants.size === 0) {
      rooms.delete(roomId);
    }
  });

});

// SERVER
const server = app.listen(8000, '0.0.0.0', () => {
  console.log('HTTP server running at PORT 8000');
});

io.attach(server);
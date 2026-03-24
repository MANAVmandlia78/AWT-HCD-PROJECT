const express = require('express');
const bodyParser = require('body-parser');
const {Server, Socket} = require('socket.io')

const io = new Server({cors: true});
const app = express();

app.use(bodyParser.json());

const socketToEmailMapping = new Map();
const socketToRoomMapping = new Map();
const rooms = new Map(); // roomId -> { participants: Map<socketId, email>, currentSharerSocketId: string | null }

const getParticipantsPayload = (roomState) =>
  Array.from(roomState.participants.entries()).map(([socketId, emailId]) => ({
    socketId,
    emailId,
  }));

io.on('connection',socket =>{
socket.on('join-room',data=>{
    const {roomId, emailId} = data;
    console.log('User',emailId,'Joined Room',roomId)

    const existingRoomId = socketToRoomMapping.get(socket.id);
    if (existingRoomId === roomId && rooms.has(roomId) && rooms.get(roomId).participants.has(socket.id)) {
      const roomState = rooms.get(roomId);
      socket.emit('joined-room',{
        roomId,
        participants: getParticipantsPayload(roomState),
        currentSharer: roomState.currentSharerSocketId
          ? {
              socketId: roomState.currentSharerSocketId,
              emailId: roomState.participants.get(roomState.currentSharerSocketId),
            }
          : null,
      });
      return;
    }

    socketToEmailMapping.set(socket.id,emailId);
    socketToRoomMapping.set(socket.id,roomId);

    if (!rooms.has(roomId)) {
        rooms.set(roomId, { participants: new Map(), currentSharerSocketId: null });
    }
    const roomState = rooms.get(roomId);
    roomState.participants.set(socket.id, emailId);

    socket.join(roomId);
    socket.emit('joined-room',{
      roomId,
      participants: getParticipantsPayload(roomState),
      currentSharer: roomState.currentSharerSocketId
        ? {
            socketId: roomState.currentSharerSocketId,
            emailId: roomState.participants.get(roomState.currentSharerSocketId),
          }
        : null,
    });
    socket.broadcast.to(roomId).emit('participant-joined',{socketId: socket.id, emailId})
    io.to(roomId).emit('participants-update', { participants: getParticipantsPayload(roomState) });
}),

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
            emailId: roomState.participants.get(roomState.currentSharerSocketId),
          }
        : null,
    });
});

socket.on('request-screen-share', () => {
    const roomId = socketToRoomMapping.get(socket.id);
    if (!roomId) return;
    const roomState = rooms.get(roomId);
    if (!roomState) return;

    if (roomState.currentSharerSocketId && roomState.currentSharerSocketId !== socket.id) {
      socket.emit('screen-share-denied', {
        sharerSocketId: roomState.currentSharerSocketId,
        sharerEmail: roomState.participants.get(roomState.currentSharerSocketId),
      });
      return;
    }

    roomState.currentSharerSocketId = socket.id;
    io.to(roomId).emit('screen-share-started', {
      sharerSocketId: socket.id,
      sharerEmail: roomState.participants.get(socket.id),
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

socket.on('webrtc-offer', data => {
    const {to, offer} = data;
    if (!to || !offer) return;
    socket.to(to).emit('webrtc-offer', {
      from: socket.id,
      fromEmail: socketToEmailMapping.get(socket.id),
      offer
    });
});

socket.on('webrtc-answer', data => {
    const {to, answer} = data;
    if (!to || !answer) return;
    socket.to(to).emit('webrtc-answer', {
      from: socket.id,
      answer
    });
});

socket.on('webrtc-ice-candidate', data => {
    const {to, candidate} = data;
    if (!to || !candidate) return;
    socket.to(to).emit('webrtc-ice-candidate', {
      from: socket.id,
      candidate
    });
});

socket.on('disconnect', () => {
    const roomId = socketToRoomMapping.get(socket.id);
    const emailId = socketToEmailMapping.get(socket.id);

    socketToRoomMapping.delete(socket.id);
    socketToEmailMapping.delete(socket.id);

    if (!roomId) return;

    const roomState = rooms.get(roomId);
    if (!roomState) return;

    roomState.participants.delete(socket.id);
    if (roomState.currentSharerSocketId === socket.id) {
      roomState.currentSharerSocketId = null;
      io.to(roomId).emit('screen-share-stopped');
    }

    socket.to(roomId).emit('participant-left', { socketId: socket.id, emailId });
    io.to(roomId).emit('participants-update', { participants: getParticipantsPayload(roomState) });

    if (roomState.participants.size === 0) {
      rooms.delete(roomId);
    }
});
});

const server = app.listen(8000, '0.0.0.0', () => {
  console.log('HTTP server running at PORT 8000');
});

io.attach(server);
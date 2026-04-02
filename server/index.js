const express = require('express');
const bodyParser = require('body-parser');
require("dotenv").config();
const { Server } = require('socket.io');
const jwt = require("jsonwebtoken"); // ✅ NEW
const db = require("./config/db");
const io = new Server({ cors: true });
const cors = require("cors");
const app = express();
const authRoutes = require("./routes/authRoutes");

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(bodyParser.json());
app.use("/api/auth", authRoutes);
app.get("/api/assignments", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const user = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 Only students (optional but recommended)
    if (user.role !== "student" && user.role !== "teacher") {
      return res.status(403).json({ message: "Access denied" });
    }

    const query = `
      SELECT assignments.*, users.name AS teacher_name
      FROM assignments
      JOIN users ON assignments.teacher_id = users.id
      WHERE assignments.department_id = ?
      ORDER BY assignments.created_at DESC
    `;

    db.query(query, [user.department_id], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      res.json(result);
    });

  } catch (err) {
    console.log(err);
    res.status(401).json({ message: "Invalid token" });
  }
});
app.post("/api/submissions", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const user = jwt.verify(token, process.env.JWT_SECRET);

    if (user.role !== "student") {
      return res.status(403).json({ message: "Only students can submit" });
    }

    const { assignment_id, file_url } = req.body;

    if (!assignment_id || !file_url) {
      return res.status(400).json({ message: "Assignment ID and file URL required" });
    }

    const query = `
      INSERT INTO submissions (assignment_id, student_id, file_url)
      VALUES (?, ?, ?)
    `;

    db.query(
      query,
      [assignment_id, user.id, file_url],
      (err, data) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
              message: "You already submitted this assignment",
            });
          }

          return res.status(500).json(err);
        }

        res.json({
          message: "Assignment submitted successfully",
          fileUrl: file_url,
        });
      }
    );

  } catch (err) {
    console.log(err);
    res.status(401).json({ message: "Invalid token" });
  }
});
app.put("/api/submissions/:id", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const user = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Only teacher allowed
    if (user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can grade" });
    }

    const submissionId = req.params.id;
    const { grade, feedback } = req.body;

    const query = `
      UPDATE submissions
      SET grade = ?, feedback = ?
      WHERE id = ?
    `;

    db.query(query, [grade, feedback, submissionId], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      res.json({
        message: "Submission graded successfully",
      });
    });

  } catch (err) {
    console.log(err);
    res.status(401).json({ message: "Invalid token" });
  }
});
const path = require("path");
app.get("/api/submissions/:id", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const user = jwt.verify(token, process.env.JWT_SECRET);

    const assignmentId = req.params.id;

    console.log("Fetching submissions for:", assignmentId); // 🔥 debug

    const query = `
      SELECT 
        submissions.*, 
        users.name AS student_name, 
        users.enrollment_no
      FROM submissions
      JOIN users ON submissions.student_id = users.id
      WHERE submissions.assignment_id = ?
    `;

    db.query(query, [assignmentId], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      console.log("RESULT:", result); // 🔥 debug

      res.json(result);
    });

  } catch (err) {
    console.log(err);
    res.status(401).json({ message: "Invalid token" });
  }
});

app.post("/api/quizzes", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const user = jwt.verify(token, process.env.JWT_SECRET);

    if (user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can create quiz" });
    }

    const { title, questions } = req.body;

    if (!title || !questions || questions.length < 10) {
      return res.status(400).json({ message: "Invalid data" });
    }

    // 🔥 Insert quiz
    const quizQuery = `
      INSERT INTO quizzes (title, teacher_id, total_questions)
      VALUES (?, ?, ?)
    `;

    db.query(
      quizQuery,
      [title, user.id, questions.length],
      (err, quizResult) => {
        if (err) return res.status(500).json(err);

        const quizId = quizResult.insertId;

        // 🔥 Prepare bulk insert for questions
        const questionValues = questions.map((q) => [
          quizId,
          q.question,
          q.optionA,
          q.optionB,
          q.optionC,
          q.optionD,
          q.correct,
        ]);

        const questionQuery = `
          INSERT INTO questions
          (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option)
          VALUES ?
        `;

        db.query(questionQuery, [questionValues], (err2) => {
          if (err2) return res.status(500).json(err2);

          res.json({
            message: "Quiz created successfully",
            quizId,
          });
        });
      }
    );
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: "Invalid token" });
  }
});

app.get("/api/quizzes/:id", (req, res) => {
  const quizId = req.params.id;

  const query = `
    SELECT 
      id,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d
    FROM questions
    WHERE quiz_id = ?
  `;

  db.query(query, [quizId], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json(result);
  });
});

app.post("/api/quizzes/submit", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const user = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 safer role check
    if (user.role?.toLowerCase().trim() !== "student") {
      return res.status(403).json({ message: "Only students can submit" });
    }

    const { quiz_id, answers } = req.body;

    if (!quiz_id || !answers) {
      return res.status(400).json({ message: "Invalid data" });
    }

    // 🔥 Get correct answers
    const query = `
      SELECT id, correct_option 
      FROM questions 
      WHERE quiz_id = ?
    `;

    db.query(query, [quiz_id], (err, questions) => {
      if (err) {
        console.log("FETCH ERROR:", err);
        return res.status(500).json(err);
      }

      let score = 0;

      questions.forEach((q) => {
        if (answers[q.id] === q.correct_option) {
          score++;
        }
      });

      // 🔥 INSERT INTO NEW TABLE (IMPORTANT FIX)
      const insertQuery = `
        INSERT INTO quiz_submissions (quiz_id, student_id, score)
        VALUES (?, ?, ?)
      `;

      db.query(insertQuery, [quiz_id, user.id, score], (err2) => {
        if (err2) {
          console.log("INSERT ERROR:", err2); // 🔥 debug
          return res.status(500).json(err2);
        }

        res.json({
          message: "Quiz submitted successfully",
          score,
        });
      });
    });

  } catch (err) {
    console.log("JWT ERROR:", err);
    res.status(401).json({ message: "Invalid token" });
  }
});
app.get("/api/quizzes", (req, res) => {
  const query = `
    SELECT quizzes.*, users.name AS teacher_name
    FROM quizzes
    JOIN users ON quizzes.teacher_id = users.id
    ORDER BY quizzes.created_at DESC
  `;

  db.query(query, (err, result) => {
    if (err) return res.status(500).json(err);

    res.json(result);
  });
});
app.get("/api/quizzes/:id/result", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const user = jwt.verify(token, process.env.JWT_SECRET);

    const quizId = req.params.id;

    const query = `
      SELECT score 
      FROM quiz_submissions
      WHERE quiz_id = ? AND student_id = ?
    `;

    db.query(query, [quizId, user.id], (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.length > 0) {
        return res.json({
          attempted: true,
          score: result[0].score,
        });
      } else {
        return res.json({
          attempted: false,
        });
      }
    });

  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});
app.post("/api/assignments", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const user = jwt.verify(token, process.env.JWT_SECRET);

    if (user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can create assignments" });
    }

    const { title, description, due_date, file_url } = req.body;

    if (!title || !file_url) {
      return res.status(400).json({ message: "Title and file required" });
    }

    const query = `
      INSERT INTO assignments (title, description, file_url, teacher_id, department_id, due_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
      query,
      [title, description, file_url, user.id, user.department_id, due_date],
      (err, result) => {
        if (err) return res.status(500).json(err);

        res.json({
          message: "Assignment created successfully",
          assignmentId: result.insertId,
          fileUrl: file_url,
        });
      }
    );

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create assignment" });
  }
});
app.get("/api/auth/me", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const query = `
      SELECT users.id, users.name, users.email, users.role,
             users.enrollment_no,  -- ✅ ADD THIS
             users.gender, 
             colleges.name AS college,
             departments.name AS department
      FROM users
      LEFT JOIN colleges ON users.college_id = colleges.id
      LEFT JOIN departments ON users.department_id = departments.id
      WHERE users.id = ?
    `;

    db.query(query, [decoded.id], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      res.json(result[0]);
    });

  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
});

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
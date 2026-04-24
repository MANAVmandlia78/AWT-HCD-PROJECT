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
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // 🔥 important

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(bodyParser.json());
app.use("/api/auth", authRoutes);
app.get("/api/assignments/:courseId", verifyToken, (req, res) => {
  const user = req.user; // ✅ from middleware
  const courseId = req.params.courseId;

  const query = `
    SELECT assignments.*, users.name AS teacher_name
    FROM assignments
    JOIN users ON assignments.teacher_id = users.id
    WHERE assignments.course_id = ?
    ORDER BY assignments.created_at DESC
  `;

  db.query(query, [courseId], (err, result) => {
    if (err) return res.status(500).json(err);

    console.log("Assignments fetched:", result); // 🔥 debug
    res.json(result);
  });
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

    // 🔥 Get course_id of assignment
    const getCourseQuery = `
      SELECT course_id FROM assignments WHERE id = ?
    `;

    db.query(getCourseQuery, [assignment_id], (err, result) => {
      if (err) return res.status(500).json(err);

      const courseId = result[0].course_id;

      // 🔥 Check student enrolled
      const checkEnrollQuery = `
        SELECT * FROM course_enrollments 
        WHERE student_id = ? AND course_id = ?
      `;

      db.query(checkEnrollQuery, [user.id, courseId], (err2, enrollResult) => {
        if (err2) return res.status(500).json(err2);

        if (enrollResult.length === 0) {
          return res.status(403).json({ message: "Not enrolled in this course" });
        }

        const insertQuery = `
          INSERT INTO submissions (assignment_id, student_id, file_url)
          VALUES (?, ?, ?)
        `;

        db.query(insertQuery, [assignment_id, user.id, file_url], (err3) => {
          if (err3) {
            if (err3.code === "ER_DUP_ENTRY") {
              return res.status(400).json({
                message: "You already submitted this assignment",
              });
            }

            return res.status(500).json(err3);
          }

          res.json({
            message: "Assignment submitted successfully",
            fileUrl: file_url,
          });
        });
      });
    });

  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});
const crypto = require("crypto");

function generateId() {
  return crypto.randomBytes(6).toString("hex"); // e.g. "a1b2c3d4e5f6"
}

app.post("/api/courses", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const user = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Only teacher
    if (user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can create courses" });
    }

    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title required" });
    }

    // 🔥 Generate unique enrollment code
    const enrollment_code = crypto.randomBytes(3).toString("hex");
    // Example: a1b2c3

    const query = `
      INSERT INTO courses (title, description, teacher_id, enrollment_code)
      VALUES (?, ?, ?, ?)
    `;

    db.query(
      query,
      [title, description, user.id, enrollment_code],
      (err, result) => {
        if (err) return res.status(500).json(err);

        res.json({
          message: "Course created successfully",
          courseId: result.insertId,
          enrollment_code,
        });
      }
    );

  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});
app.get("/api/courses", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const user = jwt.verify(token, process.env.JWT_SECRET);

    let query;
    let params;

    if (user.role === "teacher") {
      // Teacher sees their courses
      query = `SELECT * FROM courses WHERE teacher_id = ?`;
      params = [user.id];
    } else {
      // Student sees enrolled courses ONLY
      query = `
        SELECT c.*
        FROM courses c
        JOIN course_enrollments ce ON c.id = ce.course_id
        WHERE ce.student_id = ?
      `;
      params = [user.id];
    }

    db.query(query, params, (err, result) => {
      if (err) return res.status(500).json(err);

      res.json(result);
    });

  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});
app.post("/api/courses/enroll", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const user = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Only students can enroll
    if (user.role !== "student") {
      return res.status(403).json({ message: "Only students can enroll" });
    }

    const { enrollment_code } = req.body;

    if (!enrollment_code) {
      return res.status(400).json({ message: "Enrollment code required" });
    }

    // 🔥 Step 1: Find course
    const findCourseQuery = `SELECT id FROM courses WHERE enrollment_code = ?`;

    db.query(findCourseQuery, [enrollment_code], (err, courseResult) => {
      if (err) return res.status(500).json(err);

      if (courseResult.length === 0) {
        return res.status(404).json({ message: "Invalid course code" });
      }

      const courseId = courseResult[0].id;

      // 🔥 Step 2: Insert enrollment
      const enrollQuery = `
        INSERT INTO course_enrollments (student_id, course_id)
        VALUES (?, ?)
      `;

      db.query(enrollQuery, [user.id, courseId], (err2) => {
        if (err2) {
          if (err2.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ message: "Already enrolled" });
          }

          return res.status(500).json(err2);
        }

        res.json({
          message: "Enrolled successfully",
          courseId,
        });
      });
    });

  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});
app.get("/api/courses/:id", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const user = jwt.verify(token, process.env.JWT_SECRET);

    const courseId = req.params.id;

    const query = `
      SELECT 
        courses.*,
        users.name AS teacher_name
      FROM courses
      JOIN users ON courses.teacher_id = users.id
      WHERE courses.id = ?
    `;

    db.query(query, [courseId], (err, result) => {
      if (err) return res.status(500).json(err);

      res.json(result[0]);
    });

  } catch (err) {
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

    const { title, questions, course_id } = req.body;

    if (!title || !questions || questions.length < 10 || !course_id) {
      return res.status(400).json({ message: "Invalid data" });
    }

    // 🔥 CHECK: teacher owns course
    const checkCourseQuery = `
      SELECT * FROM courses WHERE id = ? AND teacher_id = ?
    `;

    db.query(checkCourseQuery, [course_id, user.id], (err, courseResult) => {
      if (err) return res.status(500).json(err);

      if (courseResult.length === 0) {
        return res.status(403).json({ message: "You don't own this course" });
      }

      // 🔥 Insert quiz with course_id
      const quizQuery = `
        INSERT INTO quizzes (title, teacher_id, course_id, total_questions)
        VALUES (?, ?, ?, ?)
      `;

      db.query(
        quizQuery,
        [title, user.id, course_id, questions.length],
        (err, quizResult) => {
          if (err) return res.status(500).json(err);

          const quizId = quizResult.insertId;

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
    });

  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});

// app.get("/api/quizzes/:courseId", (req, res) => {
//   try {
//     const token = req.headers.authorization?.split(" ")[1];
//     const user = jwt.verify(token, process.env.JWT_SECRET);

//     const courseId = req.params.courseId;

//     const query = `
//       SELECT quizzes.*, users.name AS teacher_name
//       FROM quizzes
//       JOIN users ON quizzes.teacher_id = users.id
//       WHERE quizzes.course_id = ?
//       ORDER BY quizzes.created_at DESC
//     `;

//     db.query(query, [courseId], (err, result) => {
//       if (err) return res.status(500).json(err);

//       res.json(result);
//     });

//   } catch (err) {
//     res.status(401).json({ message: "Invalid token" });
//   }
// });

// ✅ GET questions of a quiz
// app.get("/api/quizzes/:quizId", (req, res) => {
//   const quizId = req.params.quizId;

//   const query = `
//     SELECT 
//       id,
//       question_text,
//       option_a,
//       option_b,
//       option_c,
//       option_d
//     FROM questions
//     WHERE quiz_id = ?
//   `;

//   db.query(query, [quizId], (err, result) => {
//     if (err) return res.status(500).json(err);
//     res.json(result);
//   });
// });

// app.get("/api/quizzes/:id", (req, res) => {
//   const quizId = req.params.id;

//   const query = `
//     SELECT 
//       id,
//       question_text,
//       option_a,
//       option_b,
//       option_c,
//       option_d
//     FROM questions
//     WHERE quiz_id = ?
//   `;

//   db.query(query, [quizId], (err, result) => {
//     if (err) return res.status(500).json(err);

//     res.json(result);
//   });
// });
// ✅ 1. GET quizzes by course
// ✅ 1. GET quizzes by course
app.get("/api/quizzes/course/:courseId", (req, res) => {
  const courseId = req.params.courseId;

  const query = `
    SELECT quizzes.*, users.name AS teacher_name
    FROM quizzes
    JOIN users ON quizzes.teacher_id = users.id
    WHERE quizzes.course_id = ?
    ORDER BY quizzes.created_at DESC
  `;

  db.query(query, [courseId], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});


// ✅ 2. GET quiz questions
app.get("/api/quizzes/:quizId", (req, res) => {
  const quizId = req.params.quizId;

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


// ✅ 3. GET result
app.get("/api/quizzes/:quizId/result", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const user = jwt.verify(token, process.env.JWT_SECRET);

    const quizId = req.params.quizId;

    const query = `
      SELECT score 
      FROM quiz_submissions
      WHERE quiz_id = ? AND student_id = ?
    `;

    db.query(query, [quizId, user.id], (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.length > 0) {
        res.json({ attempted: true, score: result[0].score });
      } else {
        res.json({ attempted: false });
      }
    });

  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});
app.post("/api/quizzes/submit", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const user = jwt.verify(token, process.env.JWT_SECRET);

    if (user.role?.toLowerCase().trim() !== "student") {
      return res.status(403).json({ message: "Only students can submit" });
    }

    const { quiz_id, answers } = req.body;

    // 🔥 Get course_id of quiz
    const getCourseQuery = `
      SELECT course_id FROM quizzes WHERE id = ?
    `;

    db.query(getCourseQuery, [quiz_id], (err, quizResult) => {
      if (err) return res.status(500).json(err);

      const courseId = quizResult[0].course_id;

      // 🔥 Check enrollment
      const checkEnrollQuery = `
        SELECT * FROM course_enrollments 
        WHERE student_id = ? AND course_id = ?
      `;

      db.query(checkEnrollQuery, [user.id, courseId], (err2, enrollResult) => {
        if (err2) return res.status(500).json(err2);

        if (enrollResult.length === 0) {
          return res.status(403).json({ message: "Not enrolled in this course" });
        }

        // 🔥 Continue original logic
        const query = `
          SELECT id, correct_option 
          FROM questions 
          WHERE quiz_id = ?
        `;

        db.query(query, [quiz_id], (err3, questions) => {
          if (err3) return res.status(500).json(err3);

          let score = 0;

          questions.forEach((q) => {
            if (answers[q.id] === q.correct_option) {
              score++;
            }
          });

          const insertQuery = `
            INSERT INTO quiz_submissions (quiz_id, student_id, score)
            VALUES (?, ?, ?)
          `;

          db.query(insertQuery, [quiz_id, user.id, score], (err4) => {
            if (err4) return res.status(500).json(err4);

            res.json({
              message: "Quiz submitted successfully",
              score,
            });
          });
        });
      });
    });

  } catch (err) {
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
app.get("/api/student/assignments", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const user = jwt.verify(token, process.env.JWT_SECRET);

    const query = `
      SELECT 
        a.id,
        a.title,
        a.due_date,
        c.title AS course_name
      FROM assignments a
      JOIN course_enrollments ce 
        ON ce.course_id = a.course_id
      JOIN courses c 
        ON c.id = a.course_id
      WHERE ce.student_id = ?
        AND a.course_id IS NOT NULL   -- 🔥 IMPORTANT FIX
      ORDER BY a.due_date ASC
    `;

    db.query(query, [user.id], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      console.log("Assignments API:", result); // 🔥 DEBUG
      res.json(result);
    });

  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
});

app.post("/api/announcements", verifyToken, (req, res) => {
  const user = req.user;

  if (user.role !== "teacher") {
    return res.status(403).json({ message: "Only teachers can post" });
  }

  const { title, message, course_id } = req.body;

  const query = `
    INSERT INTO announcements (title, message, teacher_id, course_id)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    query,
    [title, message, user.id, course_id],
    (err, result) => {
      if (err) return res.status(500).json(err);

      res.json({ message: "Announcement created successfully" });
    }
  );
});

app.get("/api/announcements", verifyToken, (req, res) => {
  const user = req.user;

  let query;

  // 👨‍🎓 STUDENT
  if (user.role === "student") {
    query = `
      SELECT a.*, u.name AS teacher_name, c.title AS course_name
      FROM announcements a
      JOIN users u ON a.teacher_id = u.id
      JOIN courses c ON a.course_id = c.id
      JOIN course_enrollments ce ON ce.course_id = c.id
      WHERE ce.student_id = ?
      ORDER BY a.created_at DESC
    `;

    db.query(query, [user.id], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    });
  }

  // 👨‍🏫 TEACHER
  else if (user.role === "teacher") {
    query = `
      SELECT a.*, c.title AS course_name
      FROM announcements a
      JOIN courses c ON a.course_id = c.id
      WHERE a.teacher_id = ?
      ORDER BY a.created_at DESC
    `;

    db.query(query, [user.id], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    });
  }

  else {
    res.status(403).json({ message: "Unauthorized" });
  }
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

    const { title, description, due_date, file_url, course_id } = req.body;

    if (!title || !file_url || !course_id) {
      return res.status(400).json({ message: "Title, file and course_id required" });
    }

    // 🔥 CHECK: teacher owns course
    const checkCourseQuery = `
      SELECT * FROM courses WHERE id = ? AND teacher_id = ?
   `;

    db.query(checkCourseQuery, [course_id, user.id], (err, courseResult) => {
      if (err) return res.status(500).json(err);

      if (courseResult.length === 0) {
        return res.status(403).json({ message: "You don't own this course" });
      }

      const insertQuery = `
        INSERT INTO assignments 
        (title, description, file_url, teacher_id, course_id, due_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertQuery,
        [title, description, file_url, user.id, course_id, due_date],
        (err2, result) => {
          if (err2) return res.status(500).json(err2);

          res.json({
            message: "Assignment created successfully",
            assignmentId: result.insertId,
            fileUrl: file_url,
          });
        }
      );
    });

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

    rooms.set(roomId, {
      participants: new Map(),
      currentSharerSocketId: null,
      clipboardItems: [],
    });

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

    socket.emit("clipboard-init", {
      items: roomState.clipboardItems,
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

  // ── CLIPBOARD: POST ITEM ─────────────────────────────────────────────────────
  socket.on("clipboard-add", (data) => {
    const roomId = socketToRoomMapping.get(socket.id);
    if (!roomId) return;

    const role = socketToRoleMapping.get(socket.id);
    if (role !== "teacher") {
      return socket.emit("clipboard-error", {
        message: "Only teachers can post to the clipboard",
      });
    }

    const roomState = rooms.get(roomId);
    if (!roomState) return;

    const { type, title, content, lang, dataUrl, ext, size } = data;

    if (!type || !title || !["text", "file"].includes(type)) return;
    if (type === "text" && !content) return;
    if (type === "file" && !dataUrl) return;

    const item = {
      id: generateId(),
      type,
      title: String(title).slice(0, 120),
      content: type === "text" ? String(content).slice(0, 8000) : "",
      lang: lang || "plain",
      dataUrl: type === "file" ? dataUrl : null,
      ext: ext || "FILE",
      size: size || "",
      time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      authorId: socketToUserMapping.get(socket.id),
    };

    roomState.clipboardItems.unshift(item);

    // ✅ io.in includes the sender — teacher sees their own post
    io.in(roomId).emit("clipboard-update", {
      items: roomState.clipboardItems,
    });
  });


  // ── CLIPBOARD: DELETE ITEM ───────────────────────────────────────────────────
  socket.on("clipboard-delete", (data) => {
    const roomId = socketToRoomMapping.get(socket.id);
    if (!roomId) return;

    const role = socketToRoleMapping.get(socket.id);
    if (role !== "teacher") return;

    const roomState = rooms.get(roomId);
    if (!roomState) return;

    const { id } = data;
    if (!id) return;

    roomState.clipboardItems = roomState.clipboardItems.filter(
      (item) => item.id !== id
    );

    // ✅ io.in includes the sender
    io.in(roomId).emit("clipboard-update", {
      items: roomState.clipboardItems,
    });
  });


  // ── CLIPBOARD: EDIT ITEM ─────────────────────────────────────────────────────
  socket.on("clipboard-edit", (data) => {
    const roomId = socketToRoomMapping.get(socket.id);
    if (!roomId) return;

    const role = socketToRoleMapping.get(socket.id);
    if (role !== "teacher") return;

    const roomState = rooms.get(roomId);
    if (!roomState) return;

    const { id, title, content } = data;
    if (!id || !title || !content) return;

    const item = roomState.clipboardItems.find((i) => i.id === id);

    if (item && item.type === "text") {
      item.title = String(title).slice(0, 120);
      item.content = String(content).slice(0, 8000);

      // ✅ io.in includes the sender
      io.in(roomId).emit("clipboard-update", {
        items: roomState.clipboardItems,
      });
    }
  });

  // NOTE: No changes needed to the disconnect handler.
  // When all participants leave, rooms.delete(roomId) already runs (line 1044),
  // which removes the entire room state including clipboardItems.
  // Session cleanup is automatic — no extra code required.

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
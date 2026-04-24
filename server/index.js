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
            q.image_url || null, 
          ]);

          const questionQuery = `
  INSERT INTO questions
  (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, image_url)
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
  SELECT id, question_text, option_a, option_b, option_c, option_d, image_url
  FROM questions WHERE quiz_id = ?
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
const nodemailer = require("nodemailer");

// Create transporter (configure with your email provider)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,       // your Gmail address
    pass: process.env.EMAIL_PASS,       // Gmail App Password (not regular password)
  },
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

    const getCourseQuery = `SELECT course_id FROM quizzes WHERE id = ?`;
    db.query(getCourseQuery, [quiz_id], (err, quizResult) => {
      if (err) return res.status(500).json(err);
      const courseId = quizResult[0].course_id;

      const checkEnrollQuery = `
        SELECT * FROM course_enrollments 
        WHERE student_id = ? AND course_id = ?
      `;
      db.query(checkEnrollQuery, [user.id, courseId], (err2, enrollResult) => {
        if (err2) return res.status(500).json(err2);
        if (enrollResult.length === 0) {
          return res.status(403).json({ message: "Not enrolled in this course" });
        }

        const query = `SELECT id, correct_option FROM questions WHERE quiz_id = ?`;
        db.query(query, [quiz_id], (err3, questions) => {
          if (err3) return res.status(500).json(err3);

          let score = 0;
          questions.forEach((q) => {
            if (answers[q.id] === q.correct_option) score++;
          });

          const total = questions.length;

          const insertQuery = `
            INSERT INTO quiz_submissions (quiz_id, student_id, score)
            VALUES (?, ?, ?)
          `;
          db.query(insertQuery, [quiz_id, user.id, score], (err4) => {
            if (err4) return res.status(500).json(err4);

            // ✅ Respond immediately — don't wait for email
            res.json({ message: "Quiz submitted successfully", score });

            // 📧 Fetch student info to send email
            const getUserQuery = `
              SELECT u.name, u.email, q.title 
              FROM users u, quizzes q 
              WHERE u.id = ? AND q.id = ?
            `;
            db.query(getUserQuery, [user.id, quiz_id], (err5, userResult) => {
              if (err5 || userResult.length === 0) return;

              const { name, email, title } = userResult[0];
              const percentage = Math.round((score / total) * 100);

              let grade = "F";
              let gradeColor = "#e74c3c";
              if (percentage >= 90) { grade = "A+"; gradeColor = "#27ae60"; }
              else if (percentage >= 80) { grade = "A";  gradeColor = "#2ecc71"; }
              else if (percentage >= 70) { grade = "B";  gradeColor = "#3498db"; }
              else if (percentage >= 60) { grade = "C";  gradeColor = "#f39c12"; }
              else if (percentage >= 50) { grade = "D";  gradeColor = "#e67e22"; }

              const emoji = percentage >= 70 ? "🎉" : percentage >= 50 ? "📚" : "💪";
              const message =
                percentage >= 70
                  ? "Excellent work! You've demonstrated strong understanding."
                  : percentage >= 50
                  ? "Good effort! Keep practicing to improve further."
                  : "Don't give up! Review the material and try again.";

              const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Quiz Result</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 40px 30px;text-align:center;">
              <div style="font-size:48px;margin-bottom:8px;">🎓</div>
              <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Quiz Result</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">${title}</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 40px 0;">
              <p style="margin:0;font-size:17px;color:#2d3748;">
                Hi <strong>${name}</strong>, ${emoji}
              </p>
              <p style="margin:10px 0 0;font-size:15px;color:#718096;line-height:1.6;">
                Your quiz has been submitted successfully. Here's your performance summary:
              </p>
            </td>
          </tr>

          <!-- Score Card -->
          <tr>
            <td style="padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7fafc;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
                
                <!-- Score Circle Row -->
                <tr>
                  <td style="padding:32px;text-align:center;">
                    <div style="display:inline-block;width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg,${gradeColor},${gradeColor}cc);display:inline-flex;align-items:center;justify-content:center;">
                      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                        <tr><td style="text-align:center;">
                          <div style="font-size:36px;font-weight:800;color:#fff;line-height:1;">${score}</div>
                          <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:2px;">out of ${total}</div>
                        </td></tr>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- Stats Row -->
                <tr>
                  <td style="padding:0 24px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <!-- Score -->
                        <td width="33%" style="text-align:center;padding:16px 8px;background:#fff;border-radius:10px;margin:4px;">
                          <div style="font-size:22px;font-weight:700;color:#2d3748;">${score}/${total}</div>
                          <div style="font-size:12px;color:#a0aec0;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Score</div>
                        </td>
                        <!-- Spacer -->
                        <td width="4%"></td>
                        <!-- Percentage -->
                        <td width="30%" style="text-align:center;padding:16px 8px;background:#fff;border-radius:10px;">
                          <div style="font-size:22px;font-weight:700;color:#2d3748;">${percentage}%</div>
                          <div style="font-size:12px;color:#a0aec0;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Percentage</div>
                        </td>
                        <!-- Spacer -->
                        <td width="4%"></td>
                        <!-- Grade -->
                        <td width="29%" style="text-align:center;padding:16px 8px;background:#fff;border-radius:10px;">
                          <div style="font-size:22px;font-weight:700;color:${gradeColor};">${grade}</div>
                          <div style="font-size:12px;color:#a0aec0;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Grade</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Progress Bar -->
                <tr>
                  <td style="padding:0 24px 24px;">
                    <div style="background:#e2e8f0;border-radius:99px;height:10px;overflow:hidden;">
                      <div style="width:${percentage}%;height:100%;background:linear-gradient(90deg,${gradeColor},${gradeColor}99);border-radius:99px;"></div>
                    </div>
                    <p style="margin:8px 0 0;font-size:12px;color:#a0aec0;text-align:right;">${percentage}% completed correctly</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="background:linear-gradient(135deg,${gradeColor}15,${gradeColor}08);border-left:4px solid ${gradeColor};border-radius:0 8px 8px 0;padding:16px 20px;">
                <p style="margin:0;font-size:15px;color:#2d3748;line-height:1.6;">${message}</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f7fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#a0aec0;">
                This is an automated message from <strong style="color:#667eea;">ClassConnect</strong>
              </p>
              <p style="margin:6px 0 0;font-size:12px;color:#cbd5e0;">
                Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
              `;

              transporter.sendMail({
                from: `"ClassConnect" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: `📊 Your Quiz Result — ${title}`,
                html: htmlEmail,
              }, (mailErr) => {
                if (mailErr) console.error("Email send failed:", mailErr.message);
                else console.log(`✅ Result email sent to ${email}`);
              });
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
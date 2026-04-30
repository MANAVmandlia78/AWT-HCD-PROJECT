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

    if (user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can grade" });
    }

    const submissionId = req.params.id;
    const { grade, feedback } = req.body;

    const updateQuery = `
      UPDATE submissions
      SET grade = ?, feedback = ?
      WHERE id = ?
    `;

    db.query(updateQuery, [grade, feedback, submissionId], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      // ✅ Respond immediately — don't wait for email
      res.json({ message: "Submission graded successfully" });

      // 📧 Fetch student + assignment info to send email
      const infoQuery = `
        SELECT 
          users.name AS student_name,
          users.email AS student_email,
          assignments.title AS assignment_title,
          assignments.description AS assignment_desc,
          courses.title AS course_name,
          teacher.name AS teacher_name
        FROM submissions
        JOIN users ON submissions.student_id = users.id
        JOIN assignments ON submissions.assignment_id = assignments.id
        LEFT JOIN courses ON assignments.course_id = courses.id
        LEFT JOIN users AS teacher ON assignments.teacher_id = teacher.id
        WHERE submissions.id = ?
      `;

      db.query(infoQuery, [submissionId], (err2, infoResult) => {
        if (err2 || infoResult.length === 0) {
          console.error("Failed to fetch info for grading email:", err2);
          return;
        }

        const {
          student_name,
          student_email,
          assignment_title,
          assignment_desc,
          course_name,
          teacher_name,
        } = infoResult[0];

        // Grade colour mapping
        const gradeColors = {
          "A+": "#6bddaa", A: "#6bddaa", B: "#6b8eff",
          C: "#ffc96b",    D: "#ffc96b", F: "#ff6b9d",
        };
        const gradeColor = gradeColors[grade?.toUpperCase()] || "#888888";

        const gradeEmoji =
          ["A+", "A"].includes(grade?.toUpperCase()) ? "🎉" :
          grade?.toUpperCase() === "B" ? "👍" :
          grade?.toUpperCase() === "C" ? "📚" : "💪";

        const gradeMessage =
          ["A+", "A"].includes(grade?.toUpperCase())
            ? "Outstanding work! You've done an excellent job on this assignment."
            : grade?.toUpperCase() === "B"
            ? "Good work! Keep pushing to reach the top."
            : grade?.toUpperCase() === "C"
            ? "Decent effort. Review the feedback and aim higher next time."
            : "Don't give up! Use the feedback to improve.";

        const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Assignment Graded — ${assignment_title}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:3px solid #000000;border-radius:16px;overflow:hidden;box-shadow:8px 8px 0 #000000;">

          <!-- ── TOP COLOUR STRIPE ── -->
          <tr>
            <td height="6" style="background:linear-gradient(90deg,#ff6b9d 0%,#6b8eff 25%,#ffc96b 50%,#6bddaa 75%,#b06bff 100%);font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- ── HEADER ── -->
          <tr>
            <td style="background:#ffffff;padding:32px 36px 24px;border-bottom:2px solid #000000;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:10px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:#888888;">ClassConnect</p>
                    <h1 style="margin:0;font-size:22px;font-weight:900;color:#000000;letter-spacing:-0.5px;">Assignment Graded</h1>
                    <p style="margin:6px 0 0;font-size:13px;font-weight:700;color:#555555;">${assignment_title}</p>
                  </td>
                  <td align="right" valign="top">
                    <div style="font-size:36px;line-height:1;">📝</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── GREETING ── -->
          <tr>
            <td style="padding:28px 36px 0;">
              <p style="margin:0;font-size:15px;font-weight:700;color:#000000;">
                Hi <strong>${student_name}</strong>,
              </p>
              <p style="margin:8px 0 0;font-size:13px;font-weight:600;color:#555555;line-height:1.6;">
                Your assignment has been reviewed and graded by your teacher. Here are the details:
              </p>
            </td>
          </tr>

          <!-- ── GRADE CARD ── -->
          <tr>
            <td style="padding:24px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #000000;border-radius:12px;overflow:hidden;box-shadow:4px 4px 0 #000000;">

                <!-- Card topbar -->
                <tr>
                  <td style="background:#f5f7ff;border-bottom:2px solid #000000;padding:12px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ff6b9d;border:1.5px solid #000000;vertical-align:middle;margin-right:8px;"></span>
                          <span style="font-size:10px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:#000000;vertical-align:middle;">Grade Summary</span>
                        </td>
                        ${course_name ? `
                        <td align="right">
                          <span style="font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;padding:4px 10px;border-radius:5px;border:1.5px solid #6b8eff;background:#f5f7ff;color:#3a52cc;">${course_name}</span>
                        </td>` : ""}
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Grade box -->
                <tr>
                  <td style="padding:20px;background:#ffffff;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>

                        <!-- Grade -->
                        <td width="45%" style="text-align:center;padding:20px 8px;border:2px solid #000000;border-radius:10px;box-shadow:3px 3px 0 #000000;background:#f9f9f9;">
                          <div style="font-size:48px;font-weight:900;color:#000000;line-height:1;">${grade || "—"}</div>
                          <div style="font-size:9px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#888888;margin-top:6px;">Your Grade</div>
                        </td>

                        <td width="10%"></td>

                        <!-- Status pill -->
                        <td width="45%" style="text-align:center;padding:20px 8px;border:2px solid ${gradeColor};border-radius:10px;box-shadow:3px 3px 0 ${gradeColor};background:#ffffff;">
                          <div style="font-size:32px;line-height:1;">${gradeEmoji}</div>
                          <div style="font-size:12px;font-weight:800;color:#000000;margin-top:8px;">
                            ${["A+", "A"].includes(grade?.toUpperCase()) ? "Excellent" :
                              grade?.toUpperCase() === "B" ? "Good Work" :
                              grade?.toUpperCase() === "C" ? "Satisfactory" : "Needs Work"}
                          </div>
                          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#888888;margin-top:3px;">Performance</div>
                        </td>

                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- ── INFO ROWS ── -->
          <tr>
            <td style="padding:0 36px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">

                <!-- Assignment title -->
                <tr>
                  <td style="border:2px solid #000000;border-radius:10px;padding:0;box-shadow:3px 3px 0 #000000;overflow:hidden;background:#ffffff;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="4" style="background:#ff6b9d;font-size:0;line-height:0;">&nbsp;</td>
                        <td style="padding:12px 16px;">
                          <div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#888888;margin-bottom:3px;">Assignment</div>
                          <div style="font-size:14px;font-weight:800;color:#000000;">${assignment_title}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr><td height="10"></td></tr>

                ${course_name ? `
                <!-- Course -->
                <tr>
                  <td style="border:2px solid #000000;border-radius:10px;padding:0;box-shadow:3px 3px 0 #000000;overflow:hidden;background:#ffffff;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="4" style="background:#6b8eff;font-size:0;line-height:0;">&nbsp;</td>
                        <td style="padding:12px 16px;">
                          <div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#888888;margin-bottom:3px;">Course</div>
                          <div style="font-size:14px;font-weight:800;color:#000000;">${course_name}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td height="10"></td></tr>` : ""}

                ${teacher_name ? `
                <!-- Graded by -->
                <tr>
                  <td style="border:2px solid #000000;border-radius:10px;padding:0;box-shadow:3px 3px 0 #000000;overflow:hidden;background:#ffffff;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="4" style="background:#ffc96b;font-size:0;line-height:0;">&nbsp;</td>
                        <td style="padding:12px 16px;">
                          <div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#888888;margin-bottom:3px;">Graded By</div>
                          <div style="font-size:14px;font-weight:800;color:#000000;">${teacher_name}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td height="10"></td></tr>` : ""}

                ${feedback ? `
                <!-- Feedback -->
                <tr>
                  <td style="border:2px solid #000000;border-radius:10px;padding:0;box-shadow:3px 3px 0 #000000;overflow:hidden;background:#ffffff;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="4" style="background:#6bddaa;font-size:0;line-height:0;">&nbsp;</td>
                        <td style="padding:12px 16px;">
                          <div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#888888;margin-bottom:3px;">Teacher's Feedback</div>
                          <div style="font-size:14px;font-weight:700;color:#333333;line-height:1.5;">${feedback}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td height="10"></td></tr>` : ""}

              </table>
            </td>
          </tr>

          <!-- ── MOTIVATIONAL MESSAGE ── -->
          <tr>
            <td style="padding:0 36px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #000000;border-radius:10px;overflow:hidden;box-shadow:3px 3px 0 #000000;">
                <tr>
                  <td style="background:#f0fdf8;border-bottom:2px solid #000000;padding:10px 16px;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#6bddaa;border:1.5px solid #000000;vertical-align:middle;margin-right:8px;"></span>
                    <span style="font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#000000;vertical-align:middle;">Message</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;background:#ffffff;">
                    <p style="margin:0;font-size:14px;font-weight:700;color:#333333;line-height:1.6;">${gradeEmoji} &nbsp;${gradeMessage}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background:#f9f9f9;border-top:2px solid #000000;padding:20px 36px;text-align:center;">
              <p style="margin:0;font-size:12px;font-weight:700;color:#888888;letter-spacing:0.04em;">
                Automated message from <strong style="color:#000000;">ClassConnect</strong> &nbsp;·&nbsp; Do not reply
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
          to: student_email,
          subject: `📝 Assignment Graded — ${assignment_title} (${grade})`,
          html: htmlEmail,
        }, (mailErr) => {
          if (mailErr) console.error("Grading email failed:", mailErr.message);
          else console.log(`✅ Grading email sent to ${student_email}`);
        });
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

  // Replace the htmlEmail variable in your app.post("/api/quizzes/submit") route with this:

const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Quiz Result — ${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:3px solid #000000;border-radius:16px;overflow:hidden;box-shadow:8px 8px 0 #000000;">

          <!-- ── TOP COLOUR STRIPE ── -->
          <tr>
            <td height="6" style="background:linear-gradient(90deg,#ff6b9d 0%,#6b8eff 25%,#ffc96b 50%,#6bddaa 75%,#b06bff 100%);font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- ── HEADER ── -->
          <tr>
            <td style="background:#ffffff;padding:32px 36px 24px;border-bottom:2px solid #000000;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:10px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:#888888;">ClassConnect</p>
                    <h1 style="margin:0;font-size:22px;font-weight:900;color:#000000;letter-spacing:-0.5px;">Quiz Result</h1>
                    <p style="margin:6px 0 0;font-size:13px;font-weight:700;color:#555555;">${title}</p>
                  </td>
                  <td align="right" valign="top">
                    <div style="display:inline-block;font-size:36px;line-height:1;">📋</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── GREETING ── -->
          <tr>
            <td style="padding:28px 36px 0;">
              <p style="margin:0;font-size:15px;font-weight:700;color:#000000;">
                Hi <strong>${name}</strong>,
              </p>
              <p style="margin:8px 0 0;font-size:13px;font-weight:600;color:#555555;line-height:1.6;">
                Your quiz has been submitted successfully. Here's your result:
              </p>
            </td>
          </tr>

          <!-- ── SCORE CARD ── -->
          <tr>
            <td style="padding:24px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #000000;border-radius:12px;overflow:hidden;box-shadow:4px 4px 0 #000000;">

                <!-- Card topbar -->
                <tr>
                  <td style="background:#f5f7ff;border-bottom:2px solid #000000;padding:12px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#6b8eff;border:1.5px solid #000000;vertical-align:middle;margin-right:8px;"></span>
                          <span style="font-size:10px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:#000000;vertical-align:middle;">Your Score</span>
                        </td>
                        <td align="right">
                          <span style="font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;padding:4px 10px;border-radius:5px;border:1.5px solid #6b8eff;background:#f5f7ff;color:#3a52cc;">${title}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Three stat boxes -->
                <tr>
                  <td style="padding:20px;background:#ffffff;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>

                        <!-- Score -->
                        <td width="30%" style="text-align:center;padding:16px 8px;border:2px solid #000000;border-radius:10px;box-shadow:3px 3px 0 #000000;background:#fff5f9;">
                          <div style="font-size:28px;font-weight:900;color:#000000;line-height:1;">${score}</div>
                          <div style="font-size:9px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#888888;margin-top:4px;">Score</div>
                          <div style="font-size:11px;font-weight:700;color:#555555;margin-top:2px;">out of ${total}</div>
                        </td>

                        <td width="5%"></td>

                        <!-- Percentage -->
                        <td width="30%" style="text-align:center;padding:16px 8px;border:2px solid #000000;border-radius:10px;box-shadow:3px 3px 0 #000000;background:#f5f7ff;">
                          <div style="font-size:28px;font-weight:900;color:#000000;line-height:1;">${percentage}%</div>
                          <div style="font-size:9px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#888888;margin-top:4px;">Percentage</div>
                          <div style="font-size:11px;font-weight:700;color:#555555;margin-top:2px;">correct</div>
                        </td>

                        <td width="5%"></td>

                        <!-- Grade -->
                        <td width="30%" style="text-align:center;padding:16px 8px;border:2px solid #000000;border-radius:10px;box-shadow:3px 3px 0 #000000;background:#fffbf0;">
                          <div style="font-size:28px;font-weight:900;color:#000000;line-height:1;">${grade}</div>
                          <div style="font-size:9px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#888888;margin-top:4px;">Grade</div>
                          <div style="font-size:11px;font-weight:700;color:#555555;margin-top:2px;">&nbsp;</div>
                        </td>

                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Progress bar -->
                <tr>
                  <td style="padding:0 20px 20px;background:#ffffff;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #000000;border-radius:8px;overflow:hidden;box-shadow:2px 2px 0 #000000;">
                      <tr>
                        <td width="${percentage}%" height="14" style="background:#6b8eff;font-size:0;line-height:0;">&nbsp;</td>
                        <td style="background:#f0f0f0;font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>
                    <p style="margin:6px 0 0;font-size:10px;font-weight:700;color:#aaaaaa;text-align:right;letter-spacing:0.04em;">${percentage}% answered correctly</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- ── QUIZ DETAILS INFO ROWS ── -->
          <tr>
            <td style="padding:0 36px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">

                <!-- Quiz Name row -->
                <tr>
                  <td style="border:2px solid #000000;border-radius:10px;padding:12px 16px;margin-bottom:10px;display:block;box-shadow:3px 3px 0 #000000;background:#ffffff;position:relative;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="4" style="background:#ff6b9d;border-radius:4px;font-size:0;line-height:0;">&nbsp;</td>
                        <td width="12">&nbsp;</td>
                        <td>
                          <div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#888888;margin-bottom:3px;">Quiz Name</div>
                          <div style="font-size:14px;font-weight:800;color:#000000;">${title}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr><td height="10"></td></tr>

                <!-- Student row -->
                <tr>
                  <td style="border:2px solid #000000;border-radius:10px;padding:12px 16px;box-shadow:3px 3px 0 #000000;background:#ffffff;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="4" style="background:#6b8eff;border-radius:4px;font-size:0;line-height:0;">&nbsp;</td>
                        <td width="12">&nbsp;</td>
                        <td>
                          <div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#888888;margin-bottom:3px;">Student</div>
                          <div style="font-size:14px;font-weight:800;color:#000000;">${name}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr><td height="10"></td></tr>

                <!-- Score breakdown row -->
                <tr>
                  <td style="border:2px solid #000000;border-radius:10px;padding:12px 16px;box-shadow:3px 3px 0 #000000;background:#ffffff;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="4" style="background:#ffc96b;border-radius:4px;font-size:0;line-height:0;">&nbsp;</td>
                        <td width="12">&nbsp;</td>
                        <td>
                          <div style="font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#888888;margin-bottom:3px;">Score Breakdown</div>
                          <div style="font-size:14px;font-weight:800;color:#000000;">${score} correct &nbsp;·&nbsp; ${total - score} incorrect &nbsp;·&nbsp; ${total} total questions</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- ── FEEDBACK MESSAGE ── -->
          <tr>
            <td style="padding:0 36px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #000000;border-radius:10px;overflow:hidden;box-shadow:3px 3px 0 #000000;">
                <tr>
                  <td style="background:#f0fdf8;border-bottom:2px solid #000000;padding:10px 16px;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#6bddaa;border:1.5px solid #000000;vertical-align:middle;margin-right:8px;"></span>
                    <span style="font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#000000;vertical-align:middle;">Feedback</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;background:#ffffff;">
                    <p style="margin:0;font-size:14px;font-weight:700;color:#333333;line-height:1.6;">${emoji} &nbsp;${message}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background:#f9f9f9;border-top:2px solid #000000;padding:20px 36px;text-align:center;">
              <p style="margin:0;font-size:12px;font-weight:700;color:#888888;letter-spacing:0.04em;">
                Automated message from <strong style="color:#000000;">ClassConnect</strong> &nbsp;·&nbsp; Do not reply
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
  const courseId = req.query.course_id; // 👈 THIS IS THE KEY

  let query;

  if (user.role === "student") {
    query = `
      SELECT a.*, u.name AS teacher_name, c.title AS course_name
      FROM announcements a
      JOIN users u ON a.teacher_id = u.id
      JOIN courses c ON a.course_id = c.id
      JOIN course_enrollments ce ON ce.course_id = c.id
      WHERE ce.student_id = ?
      ${courseId ? "AND c.id = ?" : ""}
      ORDER BY a.created_at DESC
    `;

    const params = courseId ? [user.id, courseId] : [user.id];

    db.query(query, params, (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    });
  }

  else if (user.role === "teacher") {
    query = `
      SELECT a.*, c.title AS course_name
      FROM announcements a
      JOIN courses c ON a.course_id = c.id
      WHERE a.teacher_id = ?
      ${courseId ? "AND c.id = ?" : ""}
      ORDER BY a.created_at DESC
    `;

    const params = courseId ? [user.id, courseId] : [user.id];

    db.query(query, params, (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    });
  }

  else {
    res.status(403).json({ message: "Unauthorized" });
  }
});

// ─── ADD THESE ROUTES TO YOUR EXPRESS APP ───────────────────────────────────

// POST /api/materials — teacher uploads a material
app.post("/api/materials", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const user = jwt.verify(token, process.env.JWT_SECRET);

    if (user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can upload materials" });
    }

    const { title, description, file_url, file_name, file_type, course_id } = req.body;

    if (!title || !file_url || !course_id) {
      return res.status(400).json({ message: "Title, file and course_id required" });
    }

    // Check teacher owns the course
    const checkCourseQuery = `SELECT * FROM courses WHERE id = ? AND teacher_id = ?`;

    db.query(checkCourseQuery, [course_id, user.id], (err, courseResult) => {
      if (err) return res.status(500).json(err);
      if (courseResult.length === 0) {
        return res.status(403).json({ message: "You don't own this course" });
      }

      const insertQuery = `
        INSERT INTO course_materials (title, description, file_url, file_name, file_type, teacher_id, course_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertQuery,
        [title, description || null, file_url, file_name || null, file_type || null, user.id, course_id],
        (err2, result) => {
          if (err2) return res.status(500).json(err2);
          res.json({ message: "Material uploaded successfully", materialId: result.insertId });
        }
      );
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to upload material" });
  }
});

// GET /api/materials/:courseId — get all materials for a course (teacher + student)
app.get("/api/materials/:courseId", verifyToken, (req, res) => {
  const courseId = req.params.courseId;

  const query = `
    SELECT course_materials.*, users.name AS teacher_name
    FROM course_materials
    JOIN users ON course_materials.teacher_id = users.id
    WHERE course_materials.course_id = ?
    ORDER BY course_materials.created_at DESC
  `;

  db.query(query, [courseId], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// DELETE /api/materials/:id — teacher deletes a material
app.delete("/api/materials/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can delete materials" });
    }

    const query = `DELETE FROM course_materials WHERE id = ? AND teacher_id = ?`;

    db.query(query, [req.params.id, user.id], (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Material not found or not yours" });
      }
      res.json({ message: "Deleted successfully" });
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete" });
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
app.get("/api/assignments/detail/:id", verifyToken, (req, res) => {
  const userId = req.user.id; // from token

  const query = `
    SELECT 
      assignments.*, 
      users.name AS teacher_name, 
      courses.title AS course_name,
      submissions.id AS submission_id
    FROM assignments
    JOIN users ON assignments.teacher_id = users.id
    JOIN courses ON assignments.course_id = courses.id
    LEFT JOIN submissions 
      ON submissions.assignment_id = assignments.id 
      AND submissions.student_id = ?
    WHERE assignments.id = ?
  `;

  db.query(query, [userId, req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (!result[0]) return res.status(404).json({ message: "Not found" });

    res.json({
      ...result[0],
      alreadySubmitted: !!result[0].submission_id
    });
  });
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
 
    // ✅ FIXED: Only create the room if it doesn't already exist.
    // Previously rooms.set() ran unconditionally, wiping all participants
    // and the currentSharer every time anyone joined — breaking WebRTC
    // and participant counts for everyone already in the room.
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        participants: new Map(),
        currentSharerSocketId: null,
        clipboardItems: [],
      });
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
 
      io.in(roomId).emit("clipboard-update", {
        items: roomState.clipboardItems,
      });
    }
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
const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP server running at PORT ${PORT}`);
});
 
io.attach(server);
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "../Styles/Submissions.css";
import Sidebar from "../Components/Sidebar";

const COLORS = [
  { topbar: "linear-gradient(135deg, #fff5f9, #ffe8f0)", dot: "#ff6b9d", border: "#ff6b9d", badge: "#fff0f6" },
  { topbar: "linear-gradient(135deg, #f5f7ff, #eaedff)", dot: "#6b8eff", border: "#6b8eff", badge: "#f0f3ff" },
  { topbar: "linear-gradient(135deg, #fffbf0, #fff3d6)", dot: "#ffc96b", border: "#ffc96b", badge: "#fffbf0" },
  { topbar: "linear-gradient(135deg, #f0fdf8, #e0faf0)", dot: "#6bddaa", border: "#6bddaa", badge: "#f0fdf8" },
  { topbar: "linear-gradient(135deg, #faf5ff, #f0e8ff)", dot: "#b06bff", border: "#b06bff", badge: "#f8f0ff" },
];

const Submissions = () => {
  const { id } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [gradeMap, setGradeMap] = useState({});
  const [feedbackMap, setFeedbackMap] = useState({});
  const [gradedSet, setGradedSet] = useState(new Set());
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    const res = await axios.get(
      `http://localhost:8000/api/submissions/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setSubmissions(res.data);
  };

  const handleGrade = async (submissionId) => {
    const grade = gradeMap[submissionId] || "";
    const feedback = feedbackMap[submissionId] || "";

    await axios.put(
      `http://localhost:8000/api/submissions/${submissionId}`,
      { grade, feedback },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setGradedSet((prev) => new Set([...prev, submissionId]));
    fetchSubmissions();
  };

  return (
    <div>
      <div className="submissions-container">

        {/* Background blobs */}
        <div className="sub-blob sub-blob-1" />
        <div className="sub-blob sub-blob-2" />
        <div className="sub-blob sub-blob-3" />

        {/* Page label */}
        <span className="submissions-page-label">Submissions</span>

        {/* Stats bar */}
        <div className="submissions-stats-bar">
          <div className="submissions-stat-item">
            <span className="submissions-stat-number">{submissions.length}</span>
            <span className="submissions-stat-label">Total</span>
          </div>
          <div className="submissions-stat-divider" />
          <div className="submissions-stat-item">
            <span className="submissions-stat-number graded">{submissions.filter((s) => s.grade).length}</span>
            <span className="submissions-stat-label">Graded</span>
          </div>
          <div className="submissions-stat-divider" />
          <div className="submissions-stat-item">
            <span className="submissions-stat-number pending">{submissions.filter((s) => !s.grade).length}</span>
            <span className="submissions-stat-label">Pending</span>
          </div>
        </div>

        {/* Submissions list */}
        {submissions.length === 0 ? (
          <div className="submissions-empty">
            No submissions yet for this assignment.
          </div>
        ) : (
          <div className="submissions-list">
            {submissions.map((s, index) => {
              const color = COLORS[index % COLORS.length];
              return (
                <div
                  key={s.id}
                  className="submission-card"
                  style={{
                    "--card-dot": color.dot,
                    "--card-border": color.border,
                    "--card-badge-bg": color.badge,
                  }}
                >
                  {/* Topbar */}
                  <div className="submission-card-topbar" style={{ background: color.topbar }}>
                    <span className="submission-card-dot" />
                    <span className="submission-card-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="submission-card-label">Student Submission</span>
                    {s.grade ? (
                      <span className="submission-graded-pill" style={{ borderColor: color.dot, color: color.dot, background: color.badge }}>
                        ✓ Graded · {s.grade}
                      </span>
                    ) : (
                      <span className="submission-pending-pill">Pending</span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="submission-card-body">

                    {/* Left: student info */}
                    <div className="submission-info-col">
                      <div className="submission-avatar" style={{ background: color.topbar, borderColor: color.dot }}>
                        {s.student_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="submission-info-text">
                        <p className="submission-student-name">{s.student_name}</p>
                        <p className="submission-enrollment">
                          <span className="enrollment-chip" style={{ borderColor: color.dot, color: color.dot, background: color.badge }}>Enroll</span>
                          {s.enrollment_no}
                        </p>
                      </div>
                      <a
                        href={s.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="submission-file-btn"
                        style={{ borderColor: color.dot, color: color.dot }}
                      >
                        ↗ View File
                      </a>
                    </div>

                    {/* Vertical divider */}
                    <div className="submission-vert-divider" />

                    {/* Right: grading */}
                    <div className="submission-grade-col">
                      <p className="submission-grade-col-label">Grade & Feedback</p>
                      <input
                        className="submission-input"
                        placeholder="Enter grade (e.g. A, 95)"
                        value={gradeMap[s.id] || ""}
                        style={{ "--focus-color": color.dot }}
                        onChange={(e) =>
                          setGradeMap((prev) => ({ ...prev, [s.id]: e.target.value }))
                        }
                      />
                      <textarea
                        className="submission-textarea"
                        placeholder="Write feedback for the student..."
                        rows={3}
                        value={feedbackMap[s.id] || ""}
                        style={{ "--focus-color": color.dot }}
                        onChange={(e) =>
                          setFeedbackMap((prev) => ({ ...prev, [s.id]: e.target.value }))
                        }
                      />
                      <button
                        className="submission-grade-btn"
                        style={{ background: color.dot }}
                        onClick={() => handleGrade(s.id)}
                      >
                        {gradedSet.has(s.id) ? "✓ Submitted" : "Submit Grade"}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Submissions;
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "../Styles/Submissions.css";
import Sidebar from '../Components/Sidebar'

const Submissions = () => {
  const { id } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [gradeMap, setGradeMap] = useState({});
  const [feedbackMap, setFeedbackMap] = useState({});
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

    alert("Graded ✅");
    fetchSubmissions();
  };

  return (
    <div>
      <Sidebar></Sidebar>
    <div className="submissions-container">
      <h2 className="title">Submissions</h2>

      <div className="submissions-list-section">
        <div className="section-header">Student Submissions</div>

        {submissions.length === 0 ? (
          <p className="empty-state">No submissions yet for this assignment.</p>
        ) : (
          submissions.map((s) => (
            <div key={s.id} className="submission-row">

              {/* INFO */}
              <div className="submission-info">
                <h4>{s.student_name}</h4>
                <p>Enrollment: {s.enrollment_no}</p>
                {s.grade && (
                  <span className="grade-badge">Grade: {s.grade}</span>
                )}
              </div>

              {/* ACTIONS */}
              <div className="submission-actions">
                <a href={s.file_url} target="_blank" rel="noreferrer">
                  📄 View File
                </a>

                <div className="grade-row">
                  <input
                    placeholder="Grade"
                    value={gradeMap[s.id] || ""}
                    onChange={(e) =>
                      setGradeMap((prev) => ({ ...prev, [s.id]: e.target.value }))
                    }
                  />
                  <textarea
                    placeholder="Feedback"
                    value={feedbackMap[s.id] || ""}
                    onChange={(e) =>
                      setFeedbackMap((prev) => ({ ...prev, [s.id]: e.target.value }))
                    }
                  />
                  <button
                    className="btn-grade"
                    onClick={() => handleGrade(s.id)}
                  >
                    Grade
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
    </div>
  );
};

export default Submissions;
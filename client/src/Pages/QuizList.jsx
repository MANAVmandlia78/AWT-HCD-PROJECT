import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../Styles/quizlist.css";

const QuizList = () => {
  const [quizzes, setQuizzes] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/quizzes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setQuizzes(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="quizlist-container">
      <span className="quizlist-title">Available Quizzes</span>

      {quizzes.length === 0 ? (
        <p className="quizlist-empty">No quizzes available</p>
      ) : (
        <div className="quizlist-grid">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-card">

              {/* ── Topbar ── */}
              <div className="quiz-card-topbar">
                <span className="quiz-card-label">Quiz</span>
              </div>

              {/* ── Body ── */}
              <div className="quiz-card-body">
                <h3 className="quiz-card-title">{quiz.title}</h3>

                <div className="quiz-info-row">
                  <span className="quiz-info-label">Teacher</span>
                  <p className="quiz-info-value">{quiz.teacher_name}</p>
                </div>

                <div className="quiz-info-row">
                  <span className="quiz-info-label">Questions</span>
                  <p className="quiz-info-value">{quiz.total_questions}</p>
                </div>
              </div>

              {/* ── Footer ── */}
              <div className="quiz-card-footer">
                <button
                  className="quiz-attempt-btn"
                  onClick={() => navigate(`/quiz/${quiz.id}`)}
                >
                  Attempt Quiz
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizList;
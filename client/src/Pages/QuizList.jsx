import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "../Styles/quizlist.css";

const QuizList = () => {
  const { id } = useParams();
  const [quizzes, setQuizzes] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchQuizzes();
  }, [id]);

  const fetchQuizzes = async () => {
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/quizzes/course/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setQuizzes(res.data);
  } catch (err) {
    console.log(err);
  }
};

  return (
    <div className="quizlist-container">

      {/* Ambient gradient blob */}
      <div className="gradient-mid" />

      <span className="quizlist-title">Available Quizzes</span>

      {quizzes.length === 0 ? (
        <p className="quizlist-empty">No quizzes available</p>
      ) : (
        <div className="quizlist-grid">
          <button
        className="back-btn"
        onClick={() => navigate(-1)}
      >
        ⬅ Back
      </button>
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-card">

              <div className="quiz-card-topbar">
                <span className="quiz-card-label">Quiz</span>
              </div>

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
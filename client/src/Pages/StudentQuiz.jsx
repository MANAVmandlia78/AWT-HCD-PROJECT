import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "../Styles/studentquiz.css";


const StudentQuiz = () => {
  const { id } = useParams();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [attempted, setAttempted] = useState(false);
  const [score, setScore] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (id) checkSubmission();
  }, [id]);

  const checkSubmission = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/api/quizzes/${id}/result`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.attempted) {
        setAttempted(true);
        setScore(res.data.score);
        setLoading(false);
      } else {
        fetchQuiz(id);
      }
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  const fetchQuiz = async (quizId) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/quizzes/${quizId}`);
      setQuestions(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    try {
      const res = await axios.post(
        "http://localhost:8000/api/quizzes/submit",
        { quiz_id: id, answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAttempted(true);
      setScore(res.data.score);
    } catch (err) {
      console.log(err);
      alert("Submission failed ❌");
    }
  };

  return (
      <div className="studentquiz-container">
        {/* Ambient gradient blob */}
        <div className="gradient-mid" />

        <span className="studentquiz-title">Quiz</span>

        {/* ── Already attempted ── */}
        {attempted ? (
          <div className="studentquiz-result">
            <div className="studentquiz-result-topbar">
              <span className="studentquiz-result-topbar-label">Quiz Completed</span>
            </div>
            <div className="studentquiz-result-body">
              <p className="studentquiz-score-label">Your Score</p>
              <div className="studentquiz-score-tag">{score}</div>
              <p className="studentquiz-result-heading">Well done! Quiz has been submitted.</p>
            </div>
          </div>

        ) : loading ? (
          <div className="studentquiz-state">Loading quiz...</div>

        ) : questions.length === 0 ? (
          <div className="studentquiz-state">No questions found</div>

        ) : (
          <>
            <div className="studentquiz-questions">
              {questions.map((q, index) => (
                <div key={q.id} className="studentquiz-card">

                  <div className="studentquiz-card-topbar">
                    <span className="studentquiz-card-label">Question {index + 1}</span>
                  </div>

                  <div className="studentquiz-card-body">
                    <p className="studentquiz-question-text">{q.question_text}</p>

                    <div className="studentquiz-options">
                      {["A", "B", "C", "D"].map((opt) => (
                        <label
                          key={opt}
                          className={`studentquiz-option ${answers[q.id] === opt ? "selected" : ""}`}
                          onClick={() => handleSelect(q.id, opt)}
                        >
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={() => handleSelect(q.id, opt)}
                          />
                          <span className="option-letter">{opt}</span>
                          <span className="option-text">
                            {q[`option_${opt.toLowerCase()}`]}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                </div>
              ))}
            </div>

            <button className="studentquiz-submit" onClick={handleSubmit}>
              Submit Quiz
            </button>
          </>
        )}

      </div>
  );
};

export default StudentQuiz;
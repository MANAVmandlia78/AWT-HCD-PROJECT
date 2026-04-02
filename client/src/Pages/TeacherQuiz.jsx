import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Styles/teacherquiz.css";

const TeacherQuiz = () => {
  const [title, setTitle] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [questions, setQuestions] = useState([]);

  const handleNumChange = (value) => {
    const count = parseInt(value);
    setNumQuestions(count);
    const newQuestions = Array.from({ length: count }, () => ({
      question: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correct: "A",
    }));
    setQuestions(newQuestions);
  };

  useEffect(() => {
    handleNumChange(10);
  }, []);

  const handleChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:8000/api/quizzes",
        { title, questions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Quiz created successfully ✅");
    } catch (err) {
      console.log(err);
      alert("Failed to create quiz ❌");
    }
  };

  return (
    <div className="teacherquiz-container">
      <span className="teacherquiz-title">Create Quiz</span>

      {/* ── Config Card ── */}
      <div className="teacherquiz-config">
        <div className="teacherquiz-config-topbar">
          <span className="teacherquiz-config-label">Quiz Settings</span>
        </div>

        <div className="teacherquiz-config-body">
          {/* Title */}
          <div className="teacherquiz-field">
            <label className="teacherquiz-field-label">Quiz Title</label>
            <input
              className="teacherquiz-input"
              placeholder="Enter quiz title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Number of questions */}
          <div className="teacherquiz-field">
            <label className="teacherquiz-field-label">Number of Questions</label>
            <select
              className="teacherquiz-select"
              value={numQuestions}
              onChange={(e) => handleNumChange(e.target.value)}
            >
              <option value={10}>10 Questions</option>
              <option value={20}>20 Questions</option>
              <option value={30}>30 Questions</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Question Cards ── */}
      <div className="teacherquiz-questions">
        {questions.map((q, index) => (
          <div key={index} className="question-card">

            {/* Topbar */}
            <div className="question-card-topbar">
              <span className="question-card-label">Question {index + 1}</span>
            </div>

            {/* Body */}
            <div className="question-card-body">

              {/* Question text */}
              <div className="question-field">
                <label className="question-field-label">Question</label>
                <input
                  placeholder="Enter question"
                  value={q.question}
                  onChange={(e) => handleChange(index, "question", e.target.value)}
                />
              </div>

              {/* Options grid */}
              <div className="options-grid">
                {["A", "B", "C", "D"].map((opt) => (
                  <div className="question-field" key={opt}>
                    <label className="question-field-label">Option {opt}</label>
                    <input
                      placeholder={`Option ${opt}`}
                      value={q[`option${opt}`]}
                      onChange={(e) =>
                        handleChange(index, `option${opt}`, e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>

              {/* Correct answer */}
              <div className="question-field correct-field">
                <label className="question-field-label">Correct Answer</label>
                <select
                  value={q.correct}
                  onChange={(e) => handleChange(index, "correct", e.target.value)}
                >
                  {["A", "B", "C", "D"].map((opt) => (
                    <option key={opt} value={opt}>Option {opt}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* ── Submit ── */}
      <button className="teacherquiz-submit" onClick={handleSubmit}>
        Create Quiz
      </button>
    </div>
  );
};

export default TeacherQuiz;
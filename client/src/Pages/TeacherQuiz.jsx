import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom"; // 🔥 IMPORTANT

import "../Styles/teacherquiz.css";

const TeacherQuiz = () => {
  const { id } = useParams(); // 🔥 courseId

  const [title, setTitle] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [questions, setQuestions] = useState([]);

  const token = localStorage.getItem("token");

  // 🔥 initialize questions
  useEffect(() => {
    handleNumChange(10);
  }, []);

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

  const handleChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  // ✅ FIXED SUBMIT
  const handleSubmit = async () => {
    try {
      if (!title || questions.length === 0) {
        alert("Please fill all required fields");
        return;
      }

      await axios.post(
        "http://localhost:8000/api/quizzes",
        {
          title,
          questions,
          course_id: id, // 🔥 VERY IMPORTANT
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Quiz created successfully ✅");

      // 🔥 reset
      setTitle("");
      handleNumChange(10);

    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Failed to create quiz ❌");
    }
  };

  return (
    <div className="teacherquiz-container">

      <div className="gradient-mid" />

      <span className="teacherquiz-title">Create Quiz</span>

      {/* CONFIG */}
      <div className="teacherquiz-config">
        <div className="teacherquiz-config-topbar">
          <span className="teacherquiz-config-label">Quiz Settings</span>
        </div>

        <div className="teacherquiz-config-body">
          <div className="teacherquiz-field">
            <label className="teacherquiz-field-label">Quiz Title</label>
            <input
              className="teacherquiz-input"
              placeholder="Enter quiz title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="teacherquiz-field">
            <label className="teacherquiz-field-label">
              Number of Questions
            </label>
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

      {/* QUESTIONS */}
      <div className="teacherquiz-questions">
        {questions.map((q, index) => (
          <div key={index} className="question-card">

            <div className="question-card-topbar">
              <span className="question-card-label">
                Question {index + 1}
              </span>
            </div>

            <div className="question-card-body">

              <div className="question-field">
                <label className="question-field-label">Question</label>
                <input
                  placeholder="Enter question"
                  value={q.question}
                  onChange={(e) =>
                    handleChange(index, "question", e.target.value)
                  }
                />
              </div>

              <div className="options-grid">
                {["A", "B", "C", "D"].map((opt) => (
                  <div className="question-field" key={opt}>
                    <label className="question-field-label">
                      Option {opt}
                    </label>
                    <input
                      placeholder={`Option ${opt}`}
                      value={q[`option${opt}`]}
                      onChange={(e) =>
                        handleChange(
                          index,
                          `option${opt}`,
                          e.target.value
                        )
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="question-field correct-field">
                <label className="question-field-label">
                  Correct Answer
                </label>
                <select
                  value={q.correct}
                  onChange={(e) =>
                    handleChange(index, "correct", e.target.value)
                  }
                >
                  {["A", "B", "C", "D"].map((opt) => (
                    <option key={opt} value={opt}>
                      Option {opt}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* SUBMIT */}
      <button className="teacherquiz-submit" onClick={handleSubmit}>
        Create Quiz
      </button>

    </div>
  );
};

export default TeacherQuiz;
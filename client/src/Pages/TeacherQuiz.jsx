import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import katex from "katex";
import "katex/dist/katex.min.css";
import "../Styles/teacherquiz.css";

/* ─────────────────────────────────────────
   Inline LaTeX preview component
   Supports: $inline$ and $$block$$
───────────────────────────────────────── */
const LatexPreview = ({ text }) => {
  const spanRef = useRef(null);

  useEffect(() => {
    if (!spanRef.current) return;
    if (!text) { spanRef.current.innerHTML = ""; return; }

    const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);
    const html = parts
      .map((part) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          try {
            return katex.renderToString(part.slice(2, -2), {
              displayMode: true,
              throwOnError: false,
            });
          } catch { return `<span style="color:red">${part}</span>`; }
        }
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          try {
            return katex.renderToString(part.slice(1, -1), { throwOnError: false });
          } catch { return `<span style="color:red">${part}</span>`; }
        }
        return part.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      })
      .join("");

    spanRef.current.innerHTML = html;
  }, [text]);

  if (!text) return null;
  return <span ref={spanRef} className="latex-preview-span" />;
};

/* ─────────────────────────────────────────
   Empty question factory
───────────────────────────────────────── */
const makeQuestion = () => ({
  question: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correct: "A",
  imageFile: null,
  imagePreview: null,
  imageUrl: "",
  uploading: false,
});

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
const TeacherQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate(); // ✅ FIXED: moved inside the component

  const [title, setTitle] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => { handleNumChange(10); }, []);

  /* ── Number of questions changed ── */
  const handleNumChange = (value) => {
    const count = parseInt(value);
    setNumQuestions(count);
    setQuestions(Array.from({ length: count }, makeQuestion));
  };

  /* ── Generic field change ── */
  const handleChange = (index, field, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  /* ── Image selected: preview immediately, upload to Firebase ── */
  const handleImageSelect = async (index, file) => {
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], imageFile: file, imagePreview: preview, uploading: true, imageUrl: "" };
      return updated;
    });

    try {
      const storageRef = ref(storage, `quiz-images/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setQuestions((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], imageUrl: url, uploading: false };
        return updated;
      });
    } catch (err) {
      console.error("Image upload failed", err);
      setQuestions((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], uploading: false };
        return updated;
      });
      alert("Image upload failed ❌");
    }
  };

  /* ── Remove image ── */
  const handleRemoveImage = (index) => {
    setQuestions((prev) => {
      const updated = [...prev];
      if (updated[index].imagePreview) URL.revokeObjectURL(updated[index].imagePreview);
      updated[index] = { ...updated[index], imageFile: null, imagePreview: null, imageUrl: "", uploading: false };
      return updated;
    });
  };

  /* ── Submit quiz ── */
  const handleSubmit = async () => {
    if (!title) { alert("Please enter a quiz title"); return; }
    if (questions.some((q) => q.uploading)) { alert("Please wait — images are still uploading..."); return; }

    const payload = questions.map((q) => ({
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correct: q.correct,
      image_url: q.imageUrl || null,
    }));

    try {
      setSubmitting(true);
      await axios.post(
  `${import.meta.env.VITE_API_URL}/api/quizzes`,
  { title, questions: payload, course_id: id },
  { headers: { Authorization: `Bearer ${token}` } }
);
      alert("Quiz created successfully ✅");
      setTitle("");
      handleNumChange(10);
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Failed to create quiz ❌");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="teacherquiz-container">
      {/* ✅ Back button — navigate(-1) goes to the previous page */}
      <button
        className="back-btn"
        onClick={() => navigate(-1)}
      >
        ⬅ Back
      </button>

      <div className="gradient-mid" />
      <span className="teacherquiz-title">Create Quiz</span>

      {/* ── Quiz Settings ── */}
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

          {/* LaTeX hint box */}
          <div className="latex-hint-box">
            <span className="latex-hint-icon">∑</span>
            <div className="latex-hint-text">
              <strong>Equation support:</strong> Wrap inline math in{" "}
              <code>$...$</code> and block equations in <code>$$...$$</code>.
              Example: <code>$x^2 + y^2 = r^2$</code> or{" "}
              <code>$\frac{"{a}"}{"{b}"}$</code>. Click{" "}
              <em>∑ Preview</em> on any question to see it rendered.
            </div>
          </div>
        </div>
      </div>

      {/* ── Questions ── */}
      <div className="teacherquiz-questions">
        {questions.map((q, index) => (
          <div key={index} className="question-card">

            <div className="question-card-topbar">
              <span className="question-card-label">Question {index + 1}</span>
              <button
                className="preview-toggle-btn"
                onClick={() => setPreviewIndex(previewIndex === index ? null : index)}
              >
                {previewIndex === index ? "✕ Close" : "∑ Preview"}
              </button>
            </div>

            <div className="question-card-body">

              {/* ── LaTeX Preview Panel ── */}
              {previewIndex === index && (
                <div className="latex-preview-panel">
                  <p className="latex-preview-label">Rendered Preview</p>
                  <div className="latex-preview-question">
                    <LatexPreview text={q.question || "No question text yet..."} />
                  </div>
                  {q.imagePreview && (
                    <img src={q.imagePreview} alt="Reference" className="latex-preview-image" />
                  )}
                  <div className="latex-preview-options">
                    {["A", "B", "C", "D"].map((opt) => (
                      <div key={opt} className="latex-preview-option">
                        <span className="latex-preview-option-letter">{opt}</span>
                        <LatexPreview text={q[`option${opt}`] || `Option ${opt} (empty)`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Question Text ── */}
              <div className="question-field">
                <label className="question-field-label">
                  Question
                  <span className="latex-badge">∑ LaTeX</span>
                </label>
                <textarea
                  rows={3}
                  placeholder={"e.g. Find the roots of $x^2 - 5x + 6 = 0$"}
                  value={q.question}
                  onChange={(e) => handleChange(index, "question", e.target.value)}
                />
              </div>

              {/* ── Options ── */}
              <div className="options-grid">
                {["A", "B", "C", "D"].map((opt) => (
                  <div className="question-field" key={opt}>
                    <label className="question-field-label">Option {opt}</label>
                    <input
                      placeholder={`Option ${opt}  (use $...$ for math)`}
                      value={q[`option${opt}`]}
                      onChange={(e) => handleChange(index, `option${opt}`, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              {/* ── Correct Answer ── */}
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

              {/* ── Reference Image ── */}
              <div className="question-field">
                <label className="question-field-label">
                  Reference Image
                  <span className="optional-badge">Optional</span>
                </label>

                {q.imagePreview ? (
                  <div className="image-preview-wrapper">
                    <img
                      src={q.imagePreview}
                      alt="Reference preview"
                      className="question-image-preview"
                    />
                    <div className="image-preview-footer">
                      {q.uploading ? (
                        <span className="upload-status uploading">⏳ Uploading to Firebase...</span>
                      ) : (
                        <span className="upload-status done">✅ Upload complete</span>
                      )}
                      <button className="remove-image-btn" onClick={() => handleRemoveImage(index)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="image-upload-label">
                    🖼️ Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleImageSelect(index, e.target.files[0])}
                    />
                  </label>
                )}
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* ── Submit ── */}
      <button className="teacherquiz-submit" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Creating..." : "Create Quiz"}
      </button>
    </div>
  );
};

export default TeacherQuiz;
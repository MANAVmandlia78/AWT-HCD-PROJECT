import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { storage } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import "../Styles/assignmentDetail.css";

const AssignmentDetail = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [assignment, setAssignment] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

  const fetchAssignment = async () => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/assignments/detail/${assignmentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setAssignment(res.data);

    if (res.data.alreadySubmitted) {
      setSubmitted(true);
      setStarted(true); // optional: skip start button
    }

  } catch (err) {
    console.log(err);
  }
};

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);

    try {
      const storageRef = ref(storage, `submissions/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const pct = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setProgress(pct);
        },
        (error) => {
          console.log(error);
          alert("Upload failed ❌");
          setUploading(false);
        },
        async () => {
          const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
          await axios.post(`${import.meta.env.VITE_API_URL}/api/submissions`,
            { assignment_id: assignmentId, file_url: fileUrl },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setUploading(false);
          setSuccessAnim(true);
          setTimeout(() => setSubmitted(true), 500);
        }
      );
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Submission failed ❌");
      setUploading(false);
    }
  };

  if (!assignment) {
    return (
      <div className="assignment-detail-container">
        <div className="gradient-mid" />
        <div className="detail-state">Loading assignment...</div>
      </div>
    );
  }

  return (
    <div className="assignment-detail-container">
      <div className="gradient-mid" />

      {/* Back button */}
      <button className="detail-back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      {/* Main card */}
      <div className="detail-card">

        {/* Topbar */}
        <div className="detail-topbar">
          <span className="detail-topbar-label">Assignment</span>
          {assignment.due_date && (
            <span className="detail-due-badge">
              📅 Due:{" "}
              {new Date(assignment.due_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="detail-body">

          <h1 className="detail-title">{assignment.title}</h1>

          {/* Meta pills */}
          <div className="detail-meta">
            {assignment.teacher_name && (
              <span className="detail-meta-pill blue">Teacher : {assignment.teacher_name}</span>
            )}
            {assignment.course_name && (
              <span className="detail-meta-pill teal">Subject : {assignment.course_name}</span>
            )}
            <span className="detail-meta-pill purple">Type : File Upload</span>
          </div>

          {/* Description */}
          {assignment.description && (
            <div className="detail-desc-box">
              <span className="detail-desc-label">Description</span>
              <p className="detail-desc-text">{assignment.description}</p>
            </div>
          )}

          {/* View PDF */}
          {assignment.file_url && (
            <a className="detail-view-btn" href={assignment.file_url} target="_blank" rel="noreferrer">
              📄 View Assignment PDF
            </a>
          )}

          <div className="detail-divider" />

          {/* Submit section */}
          <div className="detail-upload-section">
            <p className="detail-upload-heading">Submit Your Work</p>

            {submitted ? (
              <div className="detail-success">
                <div className="detail-success-check">
                  <svg viewBox="0 0 52 52" fill="none">
                    <circle className="check-circle" cx="26" cy="26" r="25" stroke="#6bddaa" strokeWidth="2" />
                    <path className="check-mark" d="M14 27l8 8 16-16" stroke="#6bddaa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="detail-success-text">Assignment Submitted!</p>
                  <p className="detail-success-sub">Your work has been received successfully.</p>
                </div>
              </div>

            ) : !started ? (
              <button className="detail-start-btn" onClick={() => setStarted(true)}>
                Start Assignment →
              </button>

            ) : (
              <div className="detail-upload-panel">

                {/* Dropzone */}
                <div
                  className={`detail-dropzone ${dragOver ? "drag-over" : ""} ${file ? "has-file" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    style={{ display: "none" }}
                  />
                  {file ? (
                    <>
                      <div className="detail-dropzone-icon">📄</div>
                      <p className="detail-dropzone-filename">{file.name}</p>
                      <p className="detail-dropzone-sub">Click to change file</p>
                    </>
                  ) : (
                    <>
                      <div className="detail-dropzone-icon">🚀</div>
                      <p className="detail-dropzone-text">Drag & drop your file here</p>
                      <p className="detail-dropzone-sub">PDF, DOC, DOCX, PNG, JPG — click to browse</p>
                    </>
                  )}
                </div>

                {/* Progress */}
                {uploading && (
                  <div className="detail-upload-progress">
                    <div className="detail-progress-header">
                      <span className="detail-progress-label">
                        <span className="detail-progress-dot" />
                        Uploading...
                      </span>
                      <span className="detail-progress-pct">{progress}%</span>
                    </div>
                    <div className="detail-progress-track">
                      <div className="detail-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    {/* Flying papers animation */}
                    <div className="detail-papers-wrap">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className={`detail-paper detail-paper-${i}`}>
                          <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
                            <rect x="1" y="1" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
                            <line x1="4" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="1.5" />
                            <line x1="4" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1.5" />
                            <line x1="4" y1="14" x2="10" y2="14" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        </div>
                      ))}
                      <div className="detail-rocket-anim">🚀</div>
                    </div>
                  </div>
                )}

                <button
                  className={`detail-submit-btn ${successAnim ? "success-flash" : ""}`}
                  onClick={handleSubmit}
                  disabled={!file || uploading}
                >
                  {uploading ? `Uploading ${progress}%...` : successAnim ? "Submitted! ✓" : "Submit Assignment"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;
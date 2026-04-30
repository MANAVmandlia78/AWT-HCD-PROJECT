import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import "../Styles/TeacherAssignments.css";

const TeacherAssignments = () => {
  const { id } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [dueDate, setDueDate] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => { fetchAssignments(); }, [id]);
const fetchAssignments = async () => {
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/assignments/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setAssignments(res.data);
  } catch (err) { 
    console.log(err); 
  }
};

const handleCreateAssignment = async () => {
  try {
    if (!title || !file) { 
      alert("Title and file required"); 
      return; 
    }

    const storageRef = ref(storage, `assignments/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const fileUrl = await getDownloadURL(storageRef);

    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/assignments`,
      { title, description, file_url: fileUrl, due_date: dueDate, course_id: id },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert("Assignment created ✅");
    setTitle(""); 
    setDescription(""); 
    setFile(null); 
    setDueDate("");
    
    fetchAssignments();
  } catch (err) {
    console.log(err);
    alert("Failed to create assignment ❌");
  }
};

  return (
    <div className="teacher-assignments-container">

      {/* Ambient gradient blob */}
      <div className="gradient-mid" />
      <button
        className="back-btn"
        onClick={() => navigate(-1)}
      >
        ⬅ Back
      </button>

      <h2 className="title">Your Assignments</h2>

      {/* ── Create Form Card ── */}
      <div className="create-assignment-card">
        <div className="card-header">Create Assignment</div>

        <div className="card-body">
          <div className="ta-field">
            <label>Title</label>
            <input
              type="text"
              placeholder="Enter assignment title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="ta-field">
            <label>Description</label>
            <textarea
              rows={3}
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="ta-field">
            <label>Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="file-input-wrapper">
            <label className="file-input-label">
              📎 Choose PDF
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </label>
            <span className="file-name-display">
              {file ? file.name : "No file chosen"}
            </span>
          </div>

          <button className="btn-create" onClick={handleCreateAssignment}>
            Create Assignment
          </button>
        </div>
      </div>

      {/* ── Assignments List ── */}
      <div className="assignments-list-section">
        <div className="section-header">All Assignments</div>

        {assignments.length === 0 ? (
          <p className="empty-state">No assignments yet. Create one above!</p>
        ) : (
          assignments.map((a) => (
            <div key={a.id} className="teacher-assignment-row">
              <div className="teacher-assignment-info">
                <h4>{a.title}</h4>
                {a.description && <p>{a.description}</p>}
                {a.due_date && (
                  <p className="due-date">
                    📅 Due: {new Date(a.due_date).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="teacher-assignment-actions">
                <a href={a.file_url} target="_blank" rel="noreferrer">
                  📄 View
                </a>
                <button
                  className="btn-submissions"
                  onClick={() => navigate(`/submissions/${a.id}`)}
                >
                  Submissions
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default TeacherAssignments;
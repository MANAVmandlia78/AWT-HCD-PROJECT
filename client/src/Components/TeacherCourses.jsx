import React, { useEffect, useState } from "react";
import axios from "axios";
import "../Styles/courses.css";

const TeacherCourses = () => {
  const [courses, setCourses] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const res = await axios.get("http://localhost:8000/api/courses", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCourses(res.data);
  };

  const handleCreate = async () => {
    try {
      if (!title) { alert("Title required"); return; }

      const res = await axios.post(
        "http://localhost:8000/api/courses",
        { title, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Course Created ✅\nCode: ${res.data.enrollment_code}`);
      setTitle("");
      setDescription("");
      fetchCourses();
    } catch (err) {
      console.log(err);
      alert("Failed ❌");
    }
  };

  return (
    <div className="courses-container">

      {/* Ambient gradient blob */}
      <div className="gradient-mid" />

      <span className="courses-page-title">Teacher Dashboard</span>

      {/* ── Create Course Card ── */}
      <div className="courses-card">
        <div className="courses-card-topbar">
          <span className="courses-card-label">Create Course</span>
        </div>

        <div className="courses-card-body">
          <div className="courses-field">
            <label>Course Title</label>
            <input
              placeholder="Enter course title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="courses-field">
            <label>Description</label>
            <textarea
              rows={3}
              placeholder="Enter course description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button className="courses-submit-btn" onClick={handleCreate}>
            Create Course
          </button>
        </div>
      </div>

      {/* ── Courses List ── */}
      <div className="courses-list-section">
        <p className="courses-list-heading">Your Courses</p>

        <div className="courses-list">
          {courses.map((c) => (
            <div key={c.id} className="course-item">
              <div className="course-item-topbar">
                <div className="course-item-dot" />
                <span className="course-item-title">{c.title}</span>
              </div>
              <div className="course-item-body">
                {c.description && (
                  <p className="course-item-desc">{c.description}</p>
                )}
                <div className="course-item-code">
                  Enrollment Code:
                  <span className="course-item-code-tag">{c.enrollment_code}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default TeacherCourses;
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../Styles/announcements.css";

const TeacherAnnouncements = () => {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ title: "", message: "", course_id: "" });

  const token = localStorage.getItem("token");

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(res.data);
    } catch (err) { console.log(err); }
  };

  const handleSubmit = async () => {
    try {
      await axios.post(
        "http://localhost:8000/api/announcements",
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Announcement posted ✅");
      setForm({ title: "", message: "", course_id: "" });
    } catch (err) { console.log(err); }
  };

  return (
    <div className="announcements-container">

      {/* Ambient gradient blob */}
      <div className="gradient-mid" />

      <span className="announcements-page-title">Announcements</span>

      {/* ── Create Announcement Card ── */}
      <div className="ann-card">
        <div className="ann-card-topbar pink">
          <span className="ann-card-label">Create Announcement</span>
        </div>

        <div className="ann-card-body">
          <div className="ann-field">
            <label>Title</label>
            <input
              type="text"
              placeholder="Announcement title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="ann-field">
            <label>Message</label>
            <textarea
              rows={4}
              placeholder="Write your message..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>

          <div className="ann-field">
            <label>Course</label>
            <select
              value={form.course_id}
              onChange={(e) => setForm({ ...form, course_id: e.target.value })}
            >
              <option value="">Select a course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <button className="ann-submit-btn" onClick={handleSubmit}>
            Post Announcement
          </button>
        </div>
      </div>

    </div>
  );
};

export default TeacherAnnouncements;
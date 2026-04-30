import React, { useState } from "react";
import axios from "axios";
import "../Styles/courses.css";

const EnrollCourse = () => {
  const [code, setCode] = useState("");
  const token = localStorage.getItem("token");

 const handleEnroll = async () => {
  try {
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/courses/enroll`,
      { enrollment_code: code },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert("Enrolled successfully ✅");
  } catch (err) {
    alert(err.response?.data?.message);
  }
};

  return (
    <div className="enroll-container">

      {/* Ambient gradient blob */}
      <div className="gradient-mid" />

      <span className="enroll-page-title">Student Dashboard</span>

      {/* ── Join Course Card ── */}
      <div className="enroll-card">
        <div className="enroll-card-topbar">
          <span className="enroll-card-label">Join a Course</span>
        </div>

        <div className="enroll-card-body">
          <div className="enroll-field">
            <label>Course Code</label>
            <input
              placeholder="Enter enrollment code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <button className="enroll-submit-btn" onClick={handleEnroll}>
            Join Course
          </button>
        </div>
      </div>

    </div>
  );
};

export default EnrollCourse;
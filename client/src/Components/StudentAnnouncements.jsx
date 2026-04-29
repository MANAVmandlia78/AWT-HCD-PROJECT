import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "../Styles/announcements.css";

const StudentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { id } = useParams(); // 👈 THIS IS YOUR COURSE ID

  useEffect(() => {
    fetchAnnouncements();
  }, [id]); // refetch when course changes

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/api/announcements?course_id=${id}`, // 👈 USE id
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnnouncements(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="announcements-container">

      <div className="gradient-mid" />

      <div className="ann-list">
        <button
        className="back-btn"
        onClick={() => navigate(-1)}
      >
        ⬅ Back
      </button>
        <p className="ann-list-heading">Course Announcements</p>

        {announcements.length === 0 ? (
          <div className="ann-empty">No announcements for this course</div>
        ) : (
          announcements.map((a) => (
            <div key={a.id} className="ann-item">
              <div className="ann-item-topbar">
                <div className="ann-item-dot" />
                <span className="ann-item-title">{a.title}</span>
              </div>

              <div className="ann-item-body">
                <p className="ann-item-message">{a.message}</p>

                <div className="ann-item-meta">
                  <span className="ann-meta-pill course">
                    Course : {a.course_name}
                  </span>
                  <span className="ann-meta-pill teacher">
                    Teacher : {a.teacher_name}
                  </span>
                </div>

                <span className="ann-item-time">
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default StudentAnnouncements;
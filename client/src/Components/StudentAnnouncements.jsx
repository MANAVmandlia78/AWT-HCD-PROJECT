import React, { useEffect, useState } from "react";
import axios from "axios";
import "../Styles/announcements.css";

const StudentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/api/announcements",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnnouncements(res.data);
    } catch (err) { console.log(err); }
  };

  return (
    <div className="announcements-container">

      {/* Ambient gradient blob */}
      <div className="gradient-mid" />

      <span className="announcements-page-title">Announcements</span>

      <div className="ann-list">
        <p className="ann-list-heading">All Announcements</p>

        {announcements.length === 0 ? (
          <div className="ann-empty">No announcements yet</div>
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
                    📚 {a.course_name}
                  </span>
                  <span className="ann-meta-pill teacher">
                    👤 {a.teacher_name}
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
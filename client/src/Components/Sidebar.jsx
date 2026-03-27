import React from "react";
import "../Styles/sidebar.css";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      {/* LOGO */}
      <div className="sidebar-logo">
        <div className="logo-wrap">
          <div className="logo-icon">🎓</div>
          <span className="logo-text">ClassConnect</span>
        </div>
      </div>

      {/* MAIN */}
      <div className="nav-section-label">Main</div>

      <a className="nav-item" href="#">
        <span>🏠</span>
        <span>Dashboard</span>
      </a>

      <a className="nav-item active" href="#">
        <span>📚</span>
        <span>Courses</span>
      </a>

      <a className="nav-item" href="#">
        <span>📅</span>
        <span>Calendar</span>
      </a>

      <a className="nav-item" href="#">
        <span>🔔</span>
        <span>Announcements</span>
        <span className="nav-badge">3</span>
      </a>

      {/* ACCOUNT */}
      <div className="nav-section-label">Account</div>

      <a className="nav-item" href="#">
        <span>👤</span>
        <span>Profile</span>
      </a>

      <a className="nav-item" href="#">
        <span>⚙️</span>
        <span>Settings</span>
      </a>

      <a className="nav-item" href="#">
        <span>🚪</span>
        <span>Logout</span>
      </a>

      {/* USER */}
      <div className="sidebar-bottom">
        <div className="user-mini">
          <div className="user-avatar-sm">SH</div>
          <div className="user-mini-info">
            <div className="user-mini-name">Salman H.</div>
            <div className="user-mini-role">Instructor</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
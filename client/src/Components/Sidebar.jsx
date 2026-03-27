import React from "react";
import "../Styles/sidebar.css";
import { TfiDashboard } from "react-icons/tfi";
import { FaBook } from "react-icons/fa6";
import { FaRegCalendarAlt } from "react-icons/fa";
import { MdNotificationsActive } from "react-icons/md";
import { IoPersonCircleOutline } from "react-icons/io5";
import { MdOutlineSettings } from "react-icons/md";
import { CiLogout } from "react-icons/ci";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      {/* LOGO */}
      <div className="sidebar-logo">
        <div className="logo-wrap">
          <span className="logo-text">Class-Connect</span>
        </div>
      </div>

      {/* MAIN */}
      <div className="nav-section-label">Main</div>

      <a className="nav-item" href="#">
        <span><TfiDashboard /></span>
        <span>Dashboard</span>
      </a>

      <a className="nav-item active" href="#">
        <span><FaBook /></span>
        <span>Courses</span>
      </a>

      <a className="nav-item" href="#">
        <span><FaRegCalendarAlt /></span>
        <span>Calendar</span>
      </a>

      <a className="nav-item" href="#">
        <span><MdNotificationsActive /></span>
        <span>Announcements</span>
        <span className="nav-badge">3</span>
      </a>

      {/* ACCOUNT */}
      <div className="nav-section-label">Account</div>

      <a className="nav-item" href="#">
        <span><IoPersonCircleOutline /></span>
        <span>Profile</span>
      </a>

      <a className="nav-item" href="#">
        <span><MdOutlineSettings /></span>
        <span>Settings</span>
      </a>

      <a className="nav-item" href="#">
        <span><CiLogout /></span>
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
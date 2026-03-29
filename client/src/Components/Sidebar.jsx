import React, { useState } from "react";
import "../Styles/sidebar.css";
import { TfiDashboard } from "react-icons/tfi";
import { FaBook } from "react-icons/fa6";
import { FaRegCalendarAlt } from "react-icons/fa";
import { MdNotificationsActive } from "react-icons/md";
import { IoPersonCircleOutline } from "react-icons/io5";
import { MdOutlineSettings } from "react-icons/md";
import { CiLogout } from "react-icons/ci";
import logo from '../assets/ChatGPT Image Mar 22, 2026, 05_17_10 PM.png'
import logo2 from "../assets/ChatGPT Image Mar 26, 2026, 07_15_12 PM.png"
const Sidebar = () => {
  const [active, setActive] = useState("Courses");

  const menuItems = [
    { name: "Dashboard", icon: <TfiDashboard /> },
    { name: "Courses", icon: <FaBook /> },
    { name: "Calendar", icon: <FaRegCalendarAlt /> },
    { name: "LiveClasses", icon: <FaRegCalendarAlt /> },
    { name: "Announcements", icon: <MdNotificationsActive />, badge: 3 },
  ];

  const accountItems = [
    { name: "Profile", icon: <IoPersonCircleOutline /> },
    { name: "Settings", icon: <MdOutlineSettings /> },
    { name: "Logout", icon: <CiLogout /> },
  ];

  return (
    <aside className="sidebar">

      {/* LOGO */}
      <div className="sidebar-logo">
        <div className="logo-wrap">
          <span className="logo-text">Class Connect</span>
        </div>
      </div>

      {menuItems.map((item) => (
        <div
          key={item.name}
          className={`nav-item ${active === item.name ? "active" : ""}`}
          onClick={() => setActive(item.name)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.name}</span>
          {item.badge && <span className="nav-badge">{item.badge}</span>}
        </div>
      ))}

      {/* ACCOUNT */}
      <div className="nav-section-label">ACCOUNT</div>

      {accountItems.map((item) => (
        <div
          key={item.name}
          className={`nav-item ${active === item.name ? "active" : ""}`}
          onClick={() => setActive(item.name)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.name}</span>
        </div>
      ))}

      {/* USER */}
      <div className="sidebar-bottom">
        <div className="user-mini">
          <div className="user-avatar-sm">SH</div>
          <div className="user-mini-info">
            <div className="user-mini-name">SALMAN H.</div>
            <div className="user-mini-role">INSTRUCTOR</div>
          </div>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;
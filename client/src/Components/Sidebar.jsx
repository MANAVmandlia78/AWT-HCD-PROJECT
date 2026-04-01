import React, { useState } from "react";
import "../Styles/sidebar.css";
import { TfiDashboard } from "react-icons/tfi";
import { FaBook } from "react-icons/fa6";
import { FaRegCalendarAlt } from "react-icons/fa";
import { MdNotificationsActive } from "react-icons/md";
import { IoPersonCircleOutline } from "react-icons/io5";
import { MdOutlineSettings } from "react-icons/md";
import { CiLogout } from "react-icons/ci";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
const Sidebar = () => {
  const [active, setActive] = useState("Courses");
  const navigate = useNavigate();
   const { user } = useAuth();

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

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login"); // better than window.location.href
  };

  const handleClick = (item) => {
    if (item.name === "Logout") {
      logout();
    } else {
      setActive(item.name);
    }
  };

  return (
    <aside className="sidebar">

      {/* LOGO */}
      <div className="sidebar-logo">
        <div className="logo-wrap">
          <span className="logo-text">Class Connect</span>
        </div>
      </div>

      {/* MAIN MENU */}
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
          onClick={() => handleClick(item)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.name}</span>
        </div>
      ))}

      {/* USER */}
      <div className="sidebar-bottom">
        <div className="user-mini">
          <div className="user-avatar-sm">
  {user?.name
    ?.split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()}
</div>
          <div className="user-mini-info">
            <div className="user-mini-name">{user?.name}</div>
            <div className="user-mini-role">{user?.role?.toUpperCase()}</div>
          </div>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;
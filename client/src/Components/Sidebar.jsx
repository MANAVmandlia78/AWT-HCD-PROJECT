import React, { useState } from "react";
import "../Styles/Sidebar.css";
import { TfiDashboard } from "react-icons/tfi";
import { FaBook } from "react-icons/fa6";
import { RiLiveLine } from "react-icons/ri";
import { FaRegCalendarAlt } from "react-icons/fa";
import { IoPersonCircleOutline } from "react-icons/io5";
import { CiLogout } from "react-icons/ci";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const [active, setActive] = useState("Dashboard");
  const navigate = useNavigate();
  const { user } = useAuth();

  const role = user?.role; // ✅ get role from auth context (same pattern as CourseDetail)

  const menuItems = [
    { name: "Dashboard", icon: <TfiDashboard />, path: "/dashboard" },
    { name: "LiveClasses", icon: <RiLiveLine />, path: "/home" },
    { name: "Calendar", icon: <FaRegCalendarAlt />, path: "/calendar" },
    {
      name: "Courses",
      icon: <FaBook />,
      // ✅ route depends on role
      path: role === "teacher" ? "/teacher-courses" : "/enroll-course",
    },
  ];

  const accountItems = [
    { name: "Profile", icon: <IoPersonCircleOutline />, path: "/profile" },
    { name: "Logout", icon: <CiLogout /> },
  ];

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleNav = (item) => {
    setActive(item.name);
    navigate(item.path);
  };

  const handleClick = (item) => {
    if (item.name === "Logout") {
      logout();
    } else {
      setActive(item.name);
      navigate(item.path);
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
          onClick={() => handleNav(item)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.name}</span>
          {item.badge && <span className="nav-badge">{item.badge}</span>}
        </div>
      ))}

      {/* ACCOUNT ITEMS */}
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
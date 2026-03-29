import React from "react";
import "../Styles/maindashboard.css";
import CourseCard from "../Components/CourseCard";
import { MdNotificationsActive } from "react-icons/md";

const Maindashboard = () => {
  const courses = [
    {
      title: "Database Management System",
      image: "/sketch-1.png",
    },
    {
      title: "SQL Crash Course",
      image: "/sketch-3.png",
    },
    {
      title: "SEO Training",
      image: "/sketch-4.png",
    },
    {
      title: "Database Management System",
      image: "/sketch-1.png",
    },
    {
      title: "SQL Crash Course",
      image: "/sketch-3.png",
    },
    {
      title: "SEO Training",
      image: "/sketch-4.png",
    },
    {
      title: "Database Management System",
      image: "/sketch-1.png",
    },
    {
      title: "SQL Crash Course",
      image: "/sketch-3.png",
    },
    {
      title: "SEO Training",
      image: "/sketch-4.png",
    },
    {
      title: "Database Management System",
      image: "/sketch-1.png",
    },
    {
      title: "SQL Crash Course",
      image: "/sketch-3.png",
    },
    {
      title: "SEO Training",
      image: "/sketch-4.png",
    },
    // {
    //   title: "Computer Network",
    //   image: "/sketch-2.png",
    // },
  ];

  return (
    <div className="main">

      {/* TOPBAR */}
      <header className="topbar">

        <div className="topbar-title">COURSES</div>

        <div className="search-box">
          <input type="text" placeholder="SEARCH..." />
        </div>

        <div className="topbar-actions">

          <div className="icon-btn">
            <MdNotificationsActive></MdNotificationsActive>
            <span className="notif-dot"></span>
          </div>

          <div className="topbar-avatar">SH</div>

        </div>
      </header>

      {/* CONTENT */}
      <main className="content">

        {/* COURSES */}
        <div className="courses-grid">
          {courses.map((course, index) => (
            <CourseCard key={index} course={course} />
          ))}
        </div>

      </main>
    </div>
  );
};

export default Maindashboard;
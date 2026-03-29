import React from "react";
import "../Styles/courseDetail.css";
import assigmentimage from "/assigment-image.png";
const CourseDetail = () => {
  const features = [
  {
    title: "Assignments",
    desc: "View and submit tasks",
    image: "/assigment-image.png",
  },
  {
    title: "Quizzes",
    desc: "Test your knowledge",
    image: "/quiz-image.png",
  },
  {
    title: "Live Classes",
    desc: "Join live sessions",
    image: "/live-image.png",
  },
  {
    title: "Announcements",
    desc: "Latest updates",
    image: "/announcement-image.png",
  },
];

  return (
    <div className="course-detail">

      {/* HEADER */}
      <div className="course-header">

        <div className="course-header-left">
          <h1>Database Management System</h1>
          <p className="instructor">By Prof. Sharma</p>
          <p className="course-desc">
            Learn the fundamentals of database systems, SQL, and data modeling.
          </p>
        </div>

      </div>

      {/* FEATURES */}
      <div className="feature-grid">
        {features.map((item, index) => (
          <div key={index} className="feature-card">

            {/* IMAGE PLACEHOLDER */}
            <div className="feature-image">
                <img src={item.image} alt={item.title} />
            </div>

            <h3>{item.title}</h3>
            <p>{item.desc}</p>

          </div>
        ))}
      </div>

      {/* OPTIONAL SECTION */}
      <div className="activity-section">
        <h3>Recent Activity</h3>
        <ul>
          <li>Assignment 1 uploaded</li>
          <li>Quiz scheduled for tomorrow</li>
          <li>Live class at 5 PM</li>
        </ul>
      </div>

    </div>
  );
};

export default CourseDetail;
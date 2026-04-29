import React, { useEffect, useState } from "react";
import "../Styles/courseDetail.css";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [role, setRole] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchCourse();
    fetchUser();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/api/courses/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCourse(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/api/auth/me",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRole(res.data.role);
    } catch (err) {
      console.log(err);
    }
  };

  const handleFeatureClick = (title) => {
    if (!role) { alert("User role not loaded yet"); return; }

    if (title === "Assignments") {
      role === "teacher"
        ? navigate(`/teacher-assignments/${id}`)
        : navigate(`/assignments/${id}`);
    }

    if (title === "Quizzes") {
      role === "teacher"
        ? navigate(`/teacher-quiz/${id}`)
        : navigate(`/quizzes/${id}`);
    }

    if (title === "Announcements") {
      role === "teacher"
        ? navigate(`/teacher-announcements/${id}`)
        : navigate(`/announcements/${id}`);
    }

    if (title === "Materials") {
      role === "teacher"
        ? navigate(`/teacher/materials/${id}`)
        : navigate(`/materials/${id}`);
    }
  };

  if (!course) return <p>Loading...</p>;

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
      title: "Materials",
      desc: "Lecture slides & files",
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

      <div className="gradient-mid" />

      {/* HEADER */}
      <div className="course-header">
        <div className="course-header-left">
          <h1>{course.title}</h1>
          <p className="instructor">By {course.teacher_name}</p>
          <p className="course-desc">{course.description}</p>
        </div>
      </div>

      {/* FEATURES */}
      <div className="feature-grid">
        {features.map((item, index) => (
          <div
            key={index}
            className="feature-card"
            onClick={() => handleFeatureClick(item.title)}
            style={{ cursor: "pointer" }}
          >
            <div className="feature-image">
              <img src={item.image} alt={item.title} />
            </div>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </div>
        ))}
      </div>

      {/* ACTIVITY */}
      <div className="activity-section">
        <h3>Recent Activity</h3>
        <ul>
          <li>Assignment uploaded</li>
          <li>Quiz scheduled</li>
          <li>New material available</li>
        </ul>
      </div>

    </div>
  );
};

export default CourseDetail;
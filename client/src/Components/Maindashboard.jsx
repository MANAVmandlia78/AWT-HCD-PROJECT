import React, { useEffect, useState } from "react";
import "../Styles/maindashboard.css";
import CourseCard from "../Components/CourseCard";
import { MdNotificationsActive } from "react-icons/md";
import axios from "axios";

const Maindashboard = () => {
  const [courses, setCourses] = useState([]);
  const token = localStorage.getItem("token");

  // 🎨 Random images
  const images = [
    "/sketch-1.png",
    "/sketch-2.png",
    "/sketch-3.png",
    "/sketch-4.png",
  ];

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
  const res = await axios.get(
    `${import.meta.env.VITE_API_URL}/api/courses`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

      // 🔥 Add random image to each course
      const updated = res.data.map((course) => ({
        ...course,
        image: images[Math.floor(Math.random() * images.length)],
      }));

      setCourses(updated);

    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="main">

      <div className="gradient-mid" />

      {/* CONTENT */}
      <main className="content">
        <div className="courses-grid">
          {courses.map((course, index) => (
            <CourseCard key={course.id} course={course} index={index} />
          ))}
        </div>
      </main>

    </div>
  );
};

export default Maindashboard;
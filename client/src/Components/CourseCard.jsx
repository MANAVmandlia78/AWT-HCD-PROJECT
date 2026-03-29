import React from "react";

const CourseCard = ({ course }) => {
  return (
    <div
      style={{
        width: "300px",
        height: "320px",
        border: "3px solid #000",
        borderRadius: "12px",
        backgroundColor: "#fff",
        boxShadow: "6px 6px 0px #000",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "all 0.2s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translate(-4px, -4px)";
        e.currentTarget.style.boxShadow = "10px 10px 0px #000";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translate(0, 0)";
        e.currentTarget.style.boxShadow = "6px 6px 0px #000";
      }}
    >
      <img
        src={course.image}
        alt={course.title}
        style={{
          width: "100%",
          height: "200px",
          objectFit: "contain",
          border: "3px solid #000",
          borderRadius: "8px",
        }}
      />

      <h5
        style={{
          marginTop: "10px",
          fontWeight: "900",
          fontSize: "18px",
          textTransform: "uppercase",
        }}
      >
        {course.title}
      </h5>
    </div>
  );
};

export default CourseCard;
import React from "react";

// Accent colors cycling through the same palette as profile info rows
const ACCENT_COLORS = [
  { stripe: "#ff6b9d", hover: "#fff5f9" }, // pink
  { stripe: "#6b8eff", hover: "#f5f7ff" }, // blue
  { stripe: "#ffc96b", hover: "#fffbf0" }, // amber
  { stripe: "#6bddaa", hover: "#f0fdf8" }, // teal
  { stripe: "#b06bff", hover: "#faf5ff" }, // purple
];

const CourseCard = ({ course, index = 0 }) => {
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <div
      style={{
        width: "300px",
        height: "320px",
        border: "2.5px solid #000",
        borderRadius: "12px",
        backgroundColor: "#fff",
        boxShadow: "6px 6px 0px #000",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "all 0.2s ease",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        marginLeft: "35px"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translate(-4px, -4px)";
        e.currentTarget.style.boxShadow = "10px 10px 0px #000";
        e.currentTarget.style.backgroundColor = accent.hover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translate(0, 0)";
        e.currentTarget.style.boxShadow = "6px 6px 0px #000";
        e.currentTarget.style.backgroundColor = "#fff";
      }}
    >
      {/* Top color stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: accent.stripe,
          borderRadius: "10px 10px 0 0",
        }}
      />

      <img
        src={course.image}
        alt={course.title}
        style={{
          width: "100%",
          height: "200px",
          objectFit: "contain",
          border: "2.5px solid #000",
          borderRadius: "8px",
          marginTop: "6px",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
        {/* Color dot accent */}
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: accent.stripe,
            border: "1.5px solid #000",
            flexShrink: 0,
          }}
        />

        <h5
          style={{
            margin: 0,
            fontWeight: "900",
            fontSize: "15px",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
            lineHeight: 1.3,
          }}
        >
          {course.title}
        </h5>
      </div>
    </div>
  );
};

export default CourseCard;
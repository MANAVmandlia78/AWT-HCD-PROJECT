import React, { useEffect, useState } from "react";
import "../Styles/calendar.css";
import { ImCalendar } from "react-icons/im";
import axios from "axios";

const Calendar = () => {
  const today = new Date();
  const [assignments, setAssignments] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/api/student/assignments",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignments(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const getStatus = (date) => {
    const d = new Date(date);
    const t = new Date();
    d.setHours(0, 0, 0, 0);
    t.setHours(0, 0, 0, 0);
    if (d.getTime() === t.getTime()) return "today";
    if (d < t) return "past";
    return "future";
  };

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDay = new Date(currentYear, currentMonth, 1).getDay();

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const blanks = Array.from({ length: startDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="calendar-container">

      {/* Ambient gradient blob */}
      <div className="gradient-mid" />

      {/* HEADER */}
      <div className="calendar-header">
        <h2 style={{ display: "flex", gap: "15px" }}>
          <ImCalendar />
          {today.toLocaleString("default", { month: "long" })} {currentYear}
        </h2>

        <div className="legend">
          <span className="legend-item today-legend">Today</span>
          <span className="legend-item past-legend">Past</span>
          <span className="legend-item future-legend">Upcoming</span>
        </div>
      </div>

      {/* WEEK DAYS */}
      <div className="weekday-row">
        {weekDays.map((d) => (
          <div key={d} className="weekday-label">{d}</div>
        ))}
      </div>

      {/* GRID */}
      <div className="calendar-grid">

        {blanks.map((b) => (
          <div key={`blank-${b}`} className="day-box blank" />
        ))}

        {days.map((day) => {
          const fullDate = new Date(currentYear, currentMonth, day)
            .toISOString()
            .split("T")[0];

          const dayAssignments = assignments.filter(
            (a) => new Date(a.due_date).toISOString().split("T")[0] === fullDate
          );

          const uniqueSubjects = [
            ...new Set(dayAssignments.map((a) => a.course_name)),
          ];

          const status =
            dayAssignments.length > 0
              ? getStatus(dayAssignments[0].due_date)
              : "none";

          return (
            <div key={day} className={`day-box ${status}`}>
              <div className="day-number">{day}</div>

              {status === "today" && (
                <span className="today-badge">TODAY</span>
              )}

              {uniqueSubjects.map((subject, index) => (
                <div key={index} className="assignment">
                  <div className="subject">{subject || "Unknown"}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default Calendar;
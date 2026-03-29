import React from "react";
import "../Styles/calendar.css";
import { ImCalendar } from "react-icons/im";
const Calendar = () => {
  const today = new Date();

  const assignments = [
    { title: "DBMS Assignment", date: "2026-03-25" },
    { title: "OS Submission", date: "2026-03-28" },
    { title: "AI Project", date: "2026-04-02" },
  ];

  const getStatus = (date) => {
    const d = new Date(date);
    if (d.toDateString() === today.toDateString()) return "today";
    if (d < today) return "past";
    return "future";
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const startDay = new Date("2026-03-01").getDay();
  const blanks = Array.from({ length: startDay }, (_, i) => i);

  return (
    <div className="calendar-container">

      <div className="calendar-header">
        <h2 style={{
        display: "flex",
        gap: "15px",}}><ImCalendar /> March 2026</h2>
        <div className="legend">
          <span className="legend-item today-legend">Today</span>
          <span className="legend-item past-legend">Past</span>
          <span className="legend-item future-legend">Upcoming</span>
        </div>
      </div>

      <div className="weekday-row">
        {weekDays.map((d) => (
          <div key={d} className="weekday-label">{d}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {blanks.map((b) => (
          <div key={`blank-${b}`} className="day-box blank" />
        ))}

        {days.map((day) => {
          const fullDate = `2026-03-${String(day).padStart(2, "0")}`;
          const assignment = assignments.find((a) => a.date === fullDate);
          const status = assignment ? getStatus(fullDate) : "none";

          return (
            <div key={day} className={`day-box ${status}`}>
              <div className="day-number">{day}</div>
              {status === "today" && <span className="today-badge">TODAY</span>}
              {assignment && (
                <div className="assignment">{assignment.title}</div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default Calendar;
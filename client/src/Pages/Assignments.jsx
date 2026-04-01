import React, { useEffect, useState } from "react";
import axios from "axios";
import "../Styles/assignments.css";

import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/assignments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAssignments(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleSubmit = async (assignmentId, file) => {
    try {
      if (!file) return;

      const storageRef = ref(
        storage,
        `submissions/${Date.now()}_${file.name}`
      );

      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      await axios.post(
        "http://localhost:8000/api/submissions",
        {
          assignment_id: assignmentId,
          file_url: fileUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Submitted successfully ✅");
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Upload failed ❌");
    }
  };

  const today = new Date();

  const getCategory = (dueDate) => {
    const d = new Date(dueDate);
    if (d < today) return "past";
    if (d.toDateString() === today.toDateString()) return "today";
    return "upcoming";
  };

  const grouped = {
    overdue: [],
    upcoming: [],
    past: [],
  };

  assignments.forEach((a) => {
    const category = getCategory(a.due_date);

    if (category === "past") grouped.overdue.push(a);
    else if (category === "today" || category === "upcoming")
      grouped.upcoming.push(a);
    else grouped.past.push(a);
  });

  const renderSection = (title, data) => (
    <div className="assignment-section">
      <h3>{title}</h3>

      {data.map((a) => (
        <div key={a.id} className="assignment-row">

          <div className="assignment-info">
            <h4>{a.title}</h4>
            <p>{a.description}</p>
            <span>Due: {a.due_date}</span>
          </div>

          <div className="assignment-actions">
            <a href={a.file_url} target="_blank" rel="noreferrer">
              View
            </a>

            <input
              type="file"
              onChange={(e) =>
                handleSubmit(a.id, e.target.files[0])
              }
            />
          </div>

        </div>
      ))}
    </div>
  );

  return (
    <div className="assignments-container">
      <h2 className="title">Assignments</h2>

      {renderSection("Overdue Assignments", grouped.overdue)}
      {renderSection("Upcoming Assignments", grouped.upcoming)}
      {renderSection("Past Assignments", grouped.past)}
    </div>
  );
};

export default Assignments;
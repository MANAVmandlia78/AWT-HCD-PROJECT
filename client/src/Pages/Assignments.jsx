import React, { useEffect, useState } from "react";
import axios from "axios";
import "../Styles/assignments.css";

import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useParams } from "react-router-dom";

const Assignments = () => {
  const { id } = useParams();
  const [assignments, setAssignments] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAssignments();
  }, [id]);

  // ✅ Fetch assignments
  const fetchAssignments = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/api/assignments/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Assignments:", res.data);
      setAssignments(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // ✅ Submit assignment
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
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Submitted successfully ✅");
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Upload failed ❌");
    }
  };

  return (
    <div className="assignments-container">
      <div className="gradient-mid" />

      <h2 className="title">Assignments</h2>

      {/* 🔥 Keep section styling */}
      <div className="assignment-section">
        <h3>All Assignments</h3>

        {assignments.length === 0 ? (
          <p
            style={{
              padding: "16px 24px",
              color: "#aaa",
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            No assignments here
          </p>
        ) : (
          assignments.map((a) => (
            <div key={a.id} className="assignment-row">
              <div className="assignment-info">
                <h4>{a.title}</h4>
                <p>{a.description}</p>

                <span>
                  📅 Due:{" "}
                  {a.due_date
                    ? new Date(a.due_date).toLocaleDateString()
                    : "No deadline"}
                </span>
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
          ))
        )}
      </div>
    </div>
  );
};

export default Assignments;
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../Styles/assignments.css";
import { useParams, useNavigate } from "react-router-dom";


const Assignments = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAssignments();
  }, [id]);

  const fetchAssignments = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/api/assignments/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignments(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="assignments-container">
      
      <div className="gradient-mid" />
       <button
        className="back-btn"
        onClick={() => navigate(-1)}
      >
        ⬅ Back
      </button>

      <h2 className="title">Assignments</h2>

      <div className="assignment-section">
        <h3>All Assignments</h3>

        {assignments.length === 0 ? (
          <p style={{
            padding: "16px 24px",
            color: "#aaa",
            fontSize: "12px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>
            No assignments here
          </p>
        ) : (
          assignments.map((a) => (
            <div
              key={a.id}
              className="assignment-row"
              onClick={() => navigate(`/assignment/${a.id}`)}
              style={{ cursor: "pointer" }}
            >
              <div className="assignment-info">
                <h4>{a.title}</h4>
                <p>{a.description}</p>
                <span>
                   Due:{" "}
                  {a.due_date
                    ? new Date(a.due_date).toLocaleDateString()
                    : "No deadline"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Assignments;
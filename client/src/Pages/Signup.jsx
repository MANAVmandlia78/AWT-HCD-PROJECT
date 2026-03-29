import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    gender: "",
    enrollment_no: "",
    college_id: "",
    department_id: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    try {
      await axios.post("http://localhost:8000/api/auth/register", form);
      alert("Signup successful");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h2>Signup</h2>

        {/* NAME */}
        <input
          name="name"
          placeholder="Full Name"
          onChange={handleChange}
          style={styles.input}
        />

        {/* EMAIL */}
        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          style={styles.input}
        />

        {/* PASSWORD */}
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          style={styles.input}
        />

        {/* ROLE */}
        <select name="role" onChange={handleChange} style={styles.input}>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>

        {/* STUDENT ONLY */}
        {form.role === "student" && (
          <>
            <select name="gender" onChange={handleChange} style={styles.input}>
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>

            <input
              name="enrollment_no"
              placeholder="Enrollment Number"
              onChange={handleChange}
              style={styles.input}
            />
          </>
        )}

        {/* COMMON */}
        <select name="college_id" onChange={handleChange} style={styles.input}>
          <option value="">Select College</option>
          <option value="1">ABC College</option>
          <option value="2">XYZ University</option>
        </select>

        <select name="department_id" onChange={handleChange} style={styles.input}>
          <option value="">Select Department</option>
          <option value="1">Computer Engineering</option>
          <option value="2">IT</option>
          <option value="3">Mechanical</option>
        </select>

        <button onClick={handleSignup} style={styles.button}>
          Signup
        </button>

        <p>
          Already have an account?{" "}
          <span onClick={() => navigate("/login")} style={styles.link}>
            Login
          </span>
        </p>

      </div>
    </div>
  );
};

export default Signup;

// 🔥 minimal brutalism style
const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f8f8f8",
  },
  card: {
    padding: "30px",
    border: "2px solid black",
    boxShadow: "6px 6px 0 black",
    background: "white",
    width: "320px",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: "10px",
    margin: "8px 0",
    border: "2px solid black",
  },
  button: {
    width: "100%",
    padding: "10px",
    background: "black",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
  link: {
    color: "blue",
    cursor: "pointer",
  },
};
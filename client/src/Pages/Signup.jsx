import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../Styles/auth.css";

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
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/auth/register`,
      form
    );
    alert("Signup successful");
    navigate("/login");
  } catch (err) {
    alert(err.response?.data?.message || "Signup failed");
  }
};

  return (
    <div className="auth-container">
      <div className="gradient-mid" />

      <div className="auth-card">
        {/* Rainbow stripe via CSS ::before */}

        {/* Topbar */}
        <div className="auth-card-topbar">
          <span className="auth-card-title">Create Account</span>
        </div>

        {/* Brand */}
        <div className="auth-brand">
          <span className="auth-brand-name">ClassConnect</span>
          <span className="auth-brand-sub">Join your classroom today</span>
        </div>

        {/* Fields */}
        <div className="auth-card-body">

          <div className="auth-field">
            <label>Full Name</label>
            <input
              name="name"
              placeholder="Enter your full name"
              onChange={handleChange}
            />
          </div>

          <div className="auth-field">
            <label>Email Address</label>
            <input
              name="email"
              placeholder="you@example.com"
              onChange={handleChange}
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              onChange={handleChange}
            />
          </div>

          <div className="auth-field">
            <label>Role</label>
            <select name="role" onChange={handleChange}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Student only fields */}
          {form.role === "student" && (
            <>
              <div className="auth-field">
                <label>Gender</label>
                <select name="gender" onChange={handleChange}>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="auth-field">
                <label>Enrollment Number</label>
                <input
                  name="enrollment_no"
                  placeholder="e.g. 92301733067"
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div className="auth-field">
            <label>College</label>
            <select name="college_id" onChange={handleChange}>
              <option value="">Select College</option>
              <option value="1">ABC College</option>
              <option value="2">XYZ University</option>
            </select>
          </div>

          <div className="auth-field">
            <label>Department</label>
            <select name="department_id" onChange={handleChange}>
              <option value="">Select Department</option>
              <option value="1">Computer Engineering</option>
              <option value="2">IT</option>
              <option value="3">Mechanical</option>
            </select>
          </div>

          <button className="auth-submit-btn" onClick={handleSignup}>
            Create Account
          </button>

          <p className="auth-footer">
            Already have an account?{" "}
            <button className="auth-link" onClick={() => navigate("/login")}>
              Login
            </button>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Signup;
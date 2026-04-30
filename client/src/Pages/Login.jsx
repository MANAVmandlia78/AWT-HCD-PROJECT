import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../Styles/auth.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:8000/api/auth/login", form);
      login(res.data.token);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="gradient-mid" />

      <div className="auth-card">
        {/* Rainbow stripe via CSS ::before */}

        {/* Topbar */}
        <div className="auth-card-topbar">
          <span className="auth-card-title">Welcome Back</span>
        </div>

        {/* Brand */}
        <div className="auth-brand">
          <span className="auth-brand-name">ClassConnect</span>
          <span className="auth-brand-sub">Sign in to your account</span>
        </div>

        {/* Fields */}
        <div className="auth-card-body">

          <div className="auth-field">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <button className="auth-submit-btn" onClick={handleLogin}>
            Login
          </button>

          <p className="auth-footer">
            Don't have an account?{" "}
            <button className="auth-link" onClick={() => navigate("/signup")}>
              Sign up
            </button>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;
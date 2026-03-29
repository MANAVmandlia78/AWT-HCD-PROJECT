import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:8000/api/auth/login", form);

      // ✅ store token
      localStorage.setItem("token", res.data.token);

      const role = res.data.user.role;

      // ✅ redirect based on role
      if (role === "student") navigate("/dashboard");
      else if (role === "teacher") navigate("/dashboard");
      else if (role === "admin") navigate("/admin");

    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h2>Login</h2>

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          style={styles.input}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          style={styles.input}
        />

        <button onClick={handleLogin} style={styles.button}>
          Login
        </button>

        <p>
          Don’t have an account?{" "}
          <span onClick={() => navigate("/signup")} style={styles.link}>
            Signup
          </span>
        </p>

      </div>
    </div>
  );
};

export default Login;

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
    width: "300px",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: "10px",
    margin: "10px 0",
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
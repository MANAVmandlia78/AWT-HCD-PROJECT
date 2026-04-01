import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // 🔥 Fetch user from backend
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const res = await axios.get("http://localhost:8000/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(res.data); // ✅ full user object from DB
    } catch (err) {
      console.log(err);
      logout();
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // ✅ Login → store token + fetch user
  const login = (token) => {
    localStorage.setItem("token", token);
    fetchUser(); // 🔥 IMPORTANT
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// custom hook
export const useAuth = () => useContext(AuthContext);
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./Pages/Home";
import Room from "./Pages/Room";
import LMSmain from "./Pages/LMSmain";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Submissions from "./Pages/Submissions";
import StudentQuiz from "./Pages/StudentQuiz";
import QuizList from "./Pages/QuizList";
import CourseDetail from "./Pages/CourseDetail";
import Maindashboard from "./Components/Maindashboard";

// 🔥 ASSIGNMENTS
import Assignments from "./Pages/Assignments";
import TeacherAssignments from "./Pages/TeacherAssignments";

// 🔥 ADD THIS
import TeacherQuiz from "./Pages/TeacherQuiz";

import { SocketProvider } from "./Providers/Socket";
import { PeerProvider } from "./Providers/Peer";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

const App = () => {
  return (
    <SocketProvider>
      <PeerProvider>
        <Routes>

          {/* ================= PUBLIC ================= */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />

          {/* ================= PROTECTED LAYOUT ================= */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <LMSmain />
              </ProtectedRoute>
            }
          >
            {/* DASHBOARD */}
            <Route path="dashboard" element={<Maindashboard />} />

            {/* COURSE */}
            <Route path="course/:id" element={<CourseDetail />} />

            {/* ASSIGNMENTS */}
            <Route path="assignments/:id" element={<Assignments />} />
            <Route path="teacher-assignments/:id" element={<TeacherAssignments />} />

            {/* 🔥 QUIZ FIXED */}
            <Route path="quiz/:id" element={<StudentQuiz />} />
            <Route path="quizzes/:id" element={<QuizList />} /> {/* ✅ FIXED */}
            <Route path="teacher-quiz/:id" element={<TeacherQuiz />} /> {/* ✅ ADDED */}

            {/* SUBMISSIONS */}
            <Route path="submissions/:id" element={<Submissions />} />
          </Route>

          {/* OTHER PROTECTED */}
          <Route
            path="/room/:roomId"
            element={
              <ProtectedRoute>
                <Room />
              </ProtectedRoute>
            }
          />

          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* DEFAULT */}
          <Route path="/" element={<Navigate to="/dashboard" />} />

        </Routes>
      </PeerProvider>
    </SocketProvider>
  );
};

export default App;
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
import Profile from "./Pages/ProfilePage";
import AssignmentDetail from "./Pages/AssignmentDetail"
import TeacherAnnouncements from "./Components/TeacherAnnouncements";
import StudentAnnouncements from "./Components/StudentAnnouncements";
import TeacherMaterials from "./Pages/TeacherMaterials";
import StudentMaterials from "./Pages/StudentMaterials";
// 🔥 ASSIGNMENTS
import Assignments from "./Pages/Assignments";
import TeacherAssignments from "./Pages/TeacherAssignments";
import TeacherCourses from "./Components/TeacherCourses";
import EnrollCourse from "./Components/EnrollCourse";

// 🔥 QUIZ
import TeacherQuiz from "./Pages/TeacherQuiz";

// ✅ ADDED CALENDAR IMPORT
import Calendar from "./Components/Calendar";

import { SocketProvider } from "./Providers/Socket";
import { PeerProvider } from "./Providers/Peer";

import ProtectedRoute from "./Components/ProtectedRoute";
import PublicRoute from "./Components/PublicRoute";

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
            <Route path="/" element={<Maindashboard />} />   
            {/* ✅ CALENDAR (ONLY ADDITION) */}
            <Route path="calendar" element={<Calendar />} />
            <Route path="profile" element={<Profile />} />
            {/* ✅ COURSES — role-based, each on its own path */}
            <Route path="teacher-courses" element={<TeacherCourses />} />
            <Route path="enroll-course" element={<EnrollCourse />} />

            {/* COURSE */}
            <Route path="course/:id" element={<CourseDetail />} />

            {/* ASSIGNMENTS */}
            <Route path="assignments/:id" element={<Assignments />} />
            <Route path="teacher-assignments/:id" element={<TeacherAssignments />} />

            {/* QUIZ */}
            <Route path="quiz/:id" element={<StudentQuiz />} />
            <Route path="quizzes/:id" element={<QuizList />} />
            <Route path="teacher-quiz/:id" element={<TeacherQuiz />} />
            <Route path="/assignment/:assignmentId" element={<AssignmentDetail />} />
            <Route path="announcements/:id" element={<StudentAnnouncements />} />
            <Route path="teacher-announcements/:id" element={<TeacherAnnouncements />} />
            <Route path="/teacher/materials/:id" element={<TeacherMaterials />} />
            <Route path="/materials/:id" element={<StudentMaterials />} />

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
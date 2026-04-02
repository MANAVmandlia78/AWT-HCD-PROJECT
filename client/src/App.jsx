import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./Pages/Home";
import Room from "./Pages/Room";
import LMSmain from "./Pages/LMSmain";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Submissions from "./Pages/Submissions"; // 🔥 ADD THIS
import { SocketProvider } from "./Providers/Socket";
import { PeerProvider } from "./Providers/Peer";
import StudentQuiz from './Pages/StudentQuiz'
import QuizList from "./Pages/QuizList";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

const App = () => {
  return (
    <SocketProvider>
      <PeerProvider>
        <Routes>

          {/* PUBLIC */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          <Route
  path="/quizzes"
  element={
    <ProtectedRoute>
      <QuizList />
    </ProtectedRoute>
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

          <Route
  path="/submissions/:id"
  element={
    <ProtectedRoute>
      <Submissions />
    </ProtectedRoute>
  }
/>

          {/* PROTECTED */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <LMSmain />
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

          <Route
  path="/quiz/:id"
  element={
    <ProtectedRoute>
      <StudentQuiz />
    </ProtectedRoute>
  }
/>

          <Route
            path="/room/:roomId"
            element={
              <ProtectedRoute>
                <Room />
              </ProtectedRoute>
            }
          />

          {/* DEFAULT */}
          <Route path="/" element={<Navigate to="/login" />} />

        </Routes>
      </PeerProvider>
    </SocketProvider>
  );
};

export default App;
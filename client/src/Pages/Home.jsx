import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/home.css';

// ── helpers ──────────────────────────────────────────────────────────────────

function getPayloadFromToken() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function generateRoomCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits  = '0123456789';
  const part1   = Array.from({ length: 2 }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  const part2   = Array.from({ length: 4 }, () => digits [Math.floor(Math.random() * digits.length )]).join('');
  return `${part1}-${part2}`;
}

// ── component ─────────────────────────────────────────────────────────────────

const Home = () => {
  const navigate  = useNavigate();
  const [payload, setPayload]   = useState(null);   // JWT payload or null
  const [roomCode, setRoomCode] = useState('');      // teacher: generated code; student: typed code

  // On mount, read the token and pre-generate a room code for teachers
  useEffect(() => {
    const p = getPayloadFromToken();
    setPayload(p);
    if (p?.role === 'teacher') {
      setRoomCode(generateRoomCode());
    }
  }, []);

  const handleEnterRoom = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) { alert('Please log in first.'); return; }
    if (!roomCode.trim()) { alert('Room code is required.'); return; }
    navigate(`/room/${roomCode.trim()}`);
  }, [roomCode, navigate]);

  const isTeacher   = payload?.role === 'teacher';
  const isLoggedIn  = !!payload;
  const displayName = payload?.name || payload?.email || null;

  // ── Teacher UI ─────────────────────────────────────────────────────────────
  const TeacherCard = () => (
    <div className="home-card">
      <h2 className="card-title">Start a Session</h2>
      {displayName && <p className="card-subtitle">Logged in as <strong>{displayName}</strong></p>}
      <div className="role-badge role-badge--teacher">👩‍🏫 Teacher</div>

      <div className="room-code-display">
        <p className="room-code-label">Your Room Code</p>
        <p className="room-code-value">{roomCode}</p>
        <p className="room-code-sub">Share this with your students</p>
      </div>

      <button className="home-btn home-btn--primary" onClick={handleEnterRoom}>
        Enter Room →
      </button>

      <button
        className="home-btn home-btn--secondary"
        onClick={() => setRoomCode(generateRoomCode())}
      >
        🔄 Generate New Code
      </button>
    </div>
  );

  // ── Student UI (logged-in) ─────────────────────────────────────────────────
  const StudentCard = () => (
    <div className="home-card">
      <h2 className="card-title">Join a Session</h2>
      {displayName && <p className="card-subtitle">Logged in as <strong>{displayName}</strong></p>}
      <div className="role-badge role-badge--student">👨‍🎓 Student</div>

      <div className="field-group">
        <label>Room Code</label>
        <input
          value={roomCode}
          onChange={e => setRoomCode(e.target.value.toUpperCase())}
          type="text"
          placeholder="e.g. XK-7842"
          maxLength={7}
        />
      </div>

      <button
        className="home-btn home-btn--primary"
        onClick={handleEnterRoom}
        disabled={!roomCode.trim()}
      >
        Enter Room →
      </button>
    </div>
  );

  // ── Logged-out UI (fallback) ───────────────────────────────────────────────
  const LoggedOutCard = () => (
    <div className="home-card">
      <h2 className="card-title">Join a Session</h2>
      <p className="card-subtitle" style={{ marginBottom: 24 }}>
        Please <a href="/login" style={{ color: '#58a6ff' }}>log in</a> to continue
      </p>
    </div>
  );

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="home-root">
      <div className="gradient-mid" />

      {/* Left Panel */}
      <div className="home-left">
        <div className="home-left-inner">
          <div className="logo-mark">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="#2B8BE8"/>
              <path d="M10 14h14v2H10zM10 19h20v2H10zM10 24h10v2H10z" fill="white"/>
              <circle cx="30" cy="24" r="5" fill="white"/>
              <circle cx="30" cy="24" r="2.5" fill="#2B8BE8"/>
            </svg>
          </div>
          <h1 className="home-brand">ClassConnect</h1>
          <p className="home-tagline">Screen sharing for modern classrooms</p>
          <div className="home-features">
            <div className="feature-item">• Real-time screen sharing</div>
            <div className="feature-item">• Secure room codes</div>
            <div className="feature-item">• No downloads required</div>
          </div>
        </div>
      </div>

      <div className="home-divider" />

      {/* Right Panel */}
      <div className="home-right">
        {!isLoggedIn  && <LoggedOutCard />}
        {isLoggedIn && isTeacher  && <TeacherCard />}
        {isLoggedIn && !isTeacher && <StudentCard />}
      </div>
    </div>
  );
};

export default Home;
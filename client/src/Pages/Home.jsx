import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import '../Styles/home.css';

const Home = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [roomId, setRoomId] = useState('');

  const handleJoinRoom = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first");
      return;
    }

    if (!roomId) {
      alert("Enter Room ID");
      return;
    }

    navigate(`/room/${roomId}`);
  };

  return (
    <div className="home-root">

      {/* Ambient gradient blob */}
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

      {/* Vertical divider */}
      <div className="home-divider" />

      {/* Right Panel */}
      <div className="home-right">
        <div className="home-card">
          <h2 className="card-title">Join a Session</h2>

          <div className="home-card-body">
            <div className="field-group">
              <label>Email Address</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
              />
            </div>

            <div className="field-group">
              <label>Room Code</label>
              <input
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                type="text"
                placeholder="e.g. class-2024"
              />
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={!email || !roomId}
            >
              Enter Room
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../Providers/Socket'

const Home = () => {
  const socket = useSocket();
  const navigate = useNavigate()
  const [email, setEmail] = useState('');
  const [roomId, setRoomId] = useState('');

  const handleRoomJoined = useCallback(({ roomId }) => {
    navigate(`/room/${roomId}`)
  }, [navigate]);

  useEffect(() => {
    socket.on('joined-room', handleRoomJoined);
    return () => {
      socket.off('joined-room', handleRoomJoined)
    };
  }, [handleRoomJoined, socket])

  const handleJoinRoom = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first");
    return;
  }

  localStorage.setItem("webrtc-room-id", roomId);

  socket.emit('join-room', {
    roomId,
    token // ✅ SEND JWT
  });
};

  return (
    <div className="home-root">
      {/* Left Panel */}
      <div className="home-left">
        <div className="home-left-inner">
          <div className="logo-mark">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="#2B8BE8"/>
              <path d="M10 14h14v2H10zM10 19h20v2H10zM10 24h10v2H10z" fill="white"/>
              <circle cx="30" cy="24" r="5" fill="white"/>
              <circle cx="30" cy="24" r="2.5" fill="#2B8BE8"/>
            </svg>
          </div>
          <h1 className="home-brand">ClassConnect</h1>
          <p className="home-tagline">Screen sharing for modern classrooms</p>

          <div className="home-illustration">
            <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-svg">
              {/* Monitor 1 */}
              <rect x="20" y="50" width="130" height="90" rx="8" fill="#E8F4FD" stroke="#2B8BE8" strokeWidth="1.5"/>
              <rect x="30" y="60" width="110" height="65" rx="4" fill="#C8E6FA"/>
              {/* Screen lines */}
              <rect x="40" y="70" width="70" height="6" rx="3" fill="#2B8BE8" opacity="0.5"/>
              <rect x="40" y="82" width="90" height="4" rx="2" fill="#2B8BE8" opacity="0.3"/>
              <rect x="40" y="92" width="60" height="4" rx="2" fill="#2B8BE8" opacity="0.3"/>
              <rect x="40" y="102" width="80" height="4" rx="2" fill="#2B8BE8" opacity="0.3"/>
              {/* Stand */}
              <rect x="75" y="140" width="10" height="16" rx="2" fill="#B0D4EE"/>
              <rect x="60" y="155" width="40" height="5" rx="2.5" fill="#B0D4EE"/>

              {/* Monitor 2 */}
              <rect x="170" y="50" width="130" height="90" rx="8" fill="#E8F4FD" stroke="#2B8BE8" strokeWidth="1.5"/>
              <rect x="180" y="60" width="110" height="65" rx="4" fill="#C8E6FA"/>
              {/* Presentation lines */}
              <rect x="190" y="70" width="90" height="6" rx="3" fill="#2B8BE8" opacity="0.5"/>
              <rect x="190" y="82" width="50" height="4" rx="2" fill="#2B8BE8" opacity="0.3"/>
              <rect x="190" y="92" width="70" height="4" rx="2" fill="#2B8BE8" opacity="0.3"/>
              <rect x="190" y="102" width="40" height="4" rx="2" fill="#2B8BE8" opacity="0.3"/>
              {/* Stand */}
              <rect x="225" y="140" width="10" height="16" rx="2" fill="#B0D4EE"/>
              <rect x="210" y="155" width="40" height="5" rx="2.5" fill="#B0D4EE"/>

              {/* Connection arrow */}
              <path d="M152 95 L168 95" stroke="#2B8BE8" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round"/>
              <polygon points="168,91 176,95 168,99" fill="#2B8BE8"/>

              {/* Users below */}
              <circle cx="85" cy="182" r="8" fill="#B0D4EE"/>
              <rect x="70" y="190" width="30" height="8" rx="4" fill="#B0D4EE"/>
              <circle cx="235" cy="182" r="8" fill="#B0D4EE"/>
              <rect x="220" y="190" width="30" height="8" rx="4" fill="#B0D4EE"/>
            </svg>
          </div>

          <div className="home-features">
            <div className="feature-item">
              <span className="feature-dot"/>
              Real-time screen sharing
            </div>
            <div className="feature-item">
              <span className="feature-dot"/>
              Secure room codes
            </div>
            <div className="feature-item">
              <span className="feature-dot"/>
              No downloads required
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="home-right">
        <div className="home-card">
          <h2 className="card-title">Join a Session</h2>
          <p className="card-subtitle">Enter your details to connect to a classroom</p>

          <div className="field-group">
            <label className="field-label">Email Address</label>
            <input
              className="field-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              placeholder="you@example.com"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Room Code</label>
            <input
              className="field-input"
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              type="text"
              placeholder="e.g. class-2024"
            />
          </div>

          <button
            className="join-btn"
            onClick={handleJoinRoom}
            disabled={!email || !roomId}
          >
            <span>Enter Room</span>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <p className="home-footer-note">
            By joining, you agree to our <a href="#">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Home

export default function Features() {
  return (
    <section className="features" id="features">
      <div className="container">

        <div className="features-header">
          <div className="section-label">Core Features</div>
          <h2 className="section-title">Everything You Need in One Place</h2>
          <p className="section-subtitle">
            From live lectures to smart assignment tracking — ClassConnect covers every aspect of modern education.
          </p>
        </div>

        <div className="features-grid">

          {/* 1️⃣ Live Classroom */}
          <div className="feature-card">
            <div className="feature-icon" style={{ background: "#eff6ff", color: "#3b82f6" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
                <circle cx="12" cy="10" r="3" />
                <path d="M9 10l-2 2M15 10l2 2" />
              </svg>
            </div>

            <span className="feature-badge" style={{ color: "#3b82f6", background: "#eff6ff" }}>
              Real-time
            </span>

            <h3 className="feature-title">Live Classroom</h3>

            <p className="feature-desc">
              Real-time screen sharing with HD quality. Teachers broadcast live, students watch and interact with zero latency.
            </p>

            <a href="#" className="feature-link" style={{ color: "#3b82f6" }}>
              Learn more →
            </a>
          </div>

          {/* 2️⃣ Assignments */}
          <div className="feature-card">
            <div className="feature-icon" style={{ background: "#ecfdf5", color: "#10b981" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
                <path d="M13 3v5h5" />
              </svg>
            </div>

            <span className="feature-badge" style={{ color: "#10b981", background: "#ecfdf5" }}>
              Auto-tracking
            </span>

            <h3 className="feature-title">Assignments</h3>

            <p className="feature-desc">
              Submit, review, and track assignments effortlessly. Automated reminders keep students on schedule.
            </p>

            <a href="#" className="feature-link" style={{ color: "#10b981" }}>
              Learn more →
            </a>
          </div>

          {/* 3️⃣ Quizzes */}
          <div className="feature-card">
            <div className="feature-icon" style={{ background: "#fffbeb", color: "#f59e0b" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>

            <span className="feature-badge" style={{ color: "#f59e0b", background: "#fffbeb" }}>
              Instant results
            </span>

            <h3 className="feature-title">Interactive Quizzes</h3>

            <p className="feature-desc">
              MCQ-based quizzes with instant results and performance analytics. Auto-graded and shareable reports.
            </p>

            <a href="#" className="feature-link" style={{ color: "#f59e0b" }}>
              Learn more →
            </a>
          </div>

          {/* 4️⃣ Calendar */}
          <div className="feature-card">
            <div className="feature-icon" style={{ background: "#f5f3ff", color: "#8b5cf6" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
              </svg>
            </div>

            <span className="feature-badge" style={{ color: "#8b5cf6", background: "#f5f3ff" }}>
              Sync-ready
            </span>

            <h3 className="feature-title">Smart Calendar</h3>

            <p className="feature-desc">
              All deadlines, classes, and events in one view. Sync with your schedule and never miss a session.
            </p>

            <a href="#" className="feature-link" style={{ color: "#8b5cf6" }}>
              Learn more →
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
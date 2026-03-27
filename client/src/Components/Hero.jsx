export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-blob"></div>

      <div className="container hero-inner">

        {/* LEFT CONTENT */}
        <div
          className="hero-content"
          style={{ animation: "fadeUp 0.6s 0.05s both" }}
        >
          <div className="section-label">
            <span className="hero-label-dot"></span>
            Trusted by 10,000+ educators
          </div>

          <h1 className="hero-heading">
            A Smarter Way to{" "}
            <span className="hero-accent">Teach and Learn</span> Online
          </h1>

          <p className="hero-sub">
            ClassConnect brings live classes, assignments, quizzes, and
            real-time collaboration into one seamless platform — built for
            teachers and students.
          </p>

          <div className="hero-actions">
            <button className="hero-btn-primary">
              Get Started — It's Free
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            <button className="hero-btn-secondary">
              <span className="live-dot"></span>
              Join Live Class
            </button>
          </div>

          <div className="hero-proof">
            <div className="avatars">
              <div className="avatar" style={{ background: "#3b82f6" }}>A</div>
              <div className="avatar" style={{ background: "#10b981" }}>B</div>
              <div className="avatar" style={{ background: "#f59e0b" }}>C</div>
              <div className="avatar" style={{ background: "#ef4444" }}>D</div>
            </div>

            <p className="proof-text">
              <strong>2,400+</strong> classes held this week
            </p>
          </div>
        </div>

        {/* RIGHT VISUAL */}
        <div className="hero-visual">
          <div className="mockup">

            <div className="mockup-window">
              <div className="mockup-titlebar">
                <span className="m-dot" style={{ background: "#ff5f57" }}></span>
                <span className="m-dot" style={{ background: "#febc2e" }}></span>
                <span className="m-dot" style={{ background: "#28c840" }}></span>
                <span className="m-url">classconnect.app/dashboard</span>
              </div>

              <div className="mockup-app">

                {/* Sidebar */}
                <div className="m-sidebar">
                  <div className="m-logo">CC</div>
                  <div className="m-nav active">⊞</div>
                  <div className="m-nav">▶</div>
                  <div className="m-nav">📋</div>
                  <div className="m-nav">✓</div>
                  <div className="m-nav">📅</div>
                </div>

                {/* Main */}
                <div className="m-main">

                  <div className="m-header">
                    <div>
                      <span className="m-line big" style={{ width: "130px" }}></span>
                      <span
                        className="m-line"
                        style={{ width: "90px", marginTop: "6px", height: "7px" }}
                      ></span>
                    </div>
                    <div className="m-avatar">JS</div>
                  </div>

                  <div className="m-live">
                    <div className="m-live-badge">
                      <span className="blink-dot"></span> LIVE
                    </div>

                    <div>
                      <div className="m-live-text">
                        Advanced Mathematics — Class 10B
                      </div>
                      <div className="m-live-sub">
                        Prof. Sarah Johnson • 38 students
                      </div>
                    </div>

                    <div className="m-join">Join</div>
                  </div>

                  <div className="m-stats">
                    <div className="m-stat">
                      <div className="m-stat-val">6</div>
                      <div className="m-stat-lbl">Courses</div>
                    </div>

                    <div className="m-stat">
                      <div className="m-stat-val">3</div>
                      <div className="m-stat-lbl">Assignments</div>
                    </div>

                    <div className="m-stat">
                      <div className="m-stat-val">94%</div>
                      <div className="m-stat-lbl">Score</div>
                    </div>
                  </div>

                  <div className="m-section-title">Recent Activity</div>

                  <div className="m-activity">
                    <span className="m-act-dot" style={{ background: "#3b82f6" }}></span>
                    <span className="m-act-text">Physics Quiz submitted</span>
                    <span className="m-act-time">2m ago</span>
                  </div>

                  <div className="m-activity">
                    <span className="m-act-dot" style={{ background: "#10b981" }}></span>
                    <span className="m-act-text">Assignment graded</span>
                    <span className="m-act-time">1h ago</span>
                  </div>

                  <div className="m-activity">
                    <span className="m-act-dot" style={{ background: "#f59e0b" }}></span>
                    <span className="m-act-text">New lecture uploaded</span>
                    <span className="m-act-time">3h ago</span>
                  </div>

                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <div className="float-card float-card-1">
              <div className="float-icon" style={{ background: "#eff6ff" }}>🎓</div>
              <div>
                <div className="float-title">New Assignment</div>
                <div className="float-sub">Due in 2 days</div>
              </div>
            </div>

            <div className="float-card float-card-2">
              <div className="float-icon" style={{ background: "#dcfce7" }}>✓</div>
              <div>
                <div className="float-title">Quiz Passed!</div>
                <div className="float-sub">Score: 92/100</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
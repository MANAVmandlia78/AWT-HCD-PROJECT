import React, { useState } from "react";

export default function Showcase() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const getTitle = () => {
    if (activeTab === "dashboard") return "Student Overview Dashboard";
    if (activeTab === "live") return "Interactive Live Classes";
    if (activeTab === "assignments") return "Assignment Management";
  };

  const getDesc = () => {
    if (activeTab === "dashboard")
      return "Track all your courses, upcoming deadlines, and academic performance at a glance.";
    if (activeTab === "live")
      return "Engage in real-time classes with chat, video, and collaboration tools.";
    if (activeTab === "assignments")
      return "Manage assignments, submissions, and grading efficiently.";
  };

  const getURL = () => {
    if (activeTab === "dashboard") return "classconnect.app/dashboard";
    if (activeTab === "live") return "classconnect.app/live";
    if (activeTab === "assignments") return "classconnect.app/assignments";
  };

  return (
    <section className="showcase" id="showcase">
      <div className="container">
        <div className="showcase-header">
          <div className="section-label">Product Screenshots</div>
          <h2 className="section-title">See ClassConnect in Action</h2>
          <p className="section-subtitle">
            A clean, intuitive interface designed for both teachers and students.
          </p>
        </div>

        {/* Tabs */}
        <div className="showcase-tabs">
          <button
            className={`showcase-tab ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`showcase-tab ${activeTab === "live" ? "active" : ""}`}
            onClick={() => setActiveTab("live")}
          >
            Live Class
          </button>
          <button
            className={`showcase-tab ${activeTab === "assignments" ? "active" : ""}`}
            onClick={() => setActiveTab("assignments")}
          >
            Assignments
          </button>
        </div>

        {/* Mockup */}
        <div className="showcase-mockup">
          <div className="showcase-titlebar">
            <span className="s-dot" style={{ background: "#ff5f57" }}></span>
            <span className="s-dot" style={{ background: "#febc2e" }}></span>
            <span className="s-dot" style={{ background: "#28c840" }}></span>
            <span className="s-url">{getURL()}</span>
          </div>

          <div className="showcase-screen-area">
            {/* Dashboard */}
            {activeTab === "dashboard" && (
              <div className="preview" id="preview-dashboard">
                <div
                  className="preview-sidebar"
                  style={{
                    background: "var(--slate-900)",
                    width: "48px",
                    borderRadius: "0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "12px 0",
                    gap: "5px",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      background: "var(--blue-600)",
                      borderRadius: "7px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "9px",
                      fontWeight: "800",
                      color: "white",
                      marginBottom: "8px",
                    }}
                  >
                    CC
                  </div>
                  <div className="preview-nav active">⊞</div>
                  <div className="preview-nav">▶</div>
                  <div className="preview-nav">📋</div>
                  <div className="preview-nav">✓</div>
                  <div className="preview-nav">📅</div>
                </div>

                <div
                  className="preview-body"
                  style={{ padding: "16px", flex: 1, background: "var(--slate-50)" }}
                >
                  <div className="preview-topbar">
                    <div>
                      <div className="p-line big" style={{ width: "140px", marginBottom: "6px" }}></div>
                      <div className="p-line sm"></div>
                    </div>
                    <div className="preview-av">J</div>
                  </div>

                  <div className="preview-stats">
                    <div className="preview-stat-chip">6 Courses</div>
                    <div className="preview-stat-chip">4 Active</div>
                    <div className="preview-stat-chip">94% Avg</div>
                  </div>

                  <div className="preview-cards">
                    <div className="preview-card">
                      <div className="preview-bar" style={{ background: "#3b82f6" }}></div>
                      <div className="preview-label">Mathematics</div>
                      <div className="p-line sm"></div>
                    </div>
                    <div className="preview-card">
                      <div className="preview-bar" style={{ background: "#10b981" }}></div>
                      <div className="preview-label">Physics</div>
                      <div className="p-line sm"></div>
                    </div>
                    <div className="preview-card">
                      <div className="preview-bar" style={{ background: "#f59e0b" }}></div>
                      <div className="preview-label">Chemistry</div>
                      <div className="p-line sm"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Live */}
            {activeTab === "live" && (
              <div className="preview preview-live">
                <div
                  style={{
                    padding: "16px",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    background: "var(--slate-50)",
                  }}
                >
                  <div className="live-header">
                    <div className="live-badge">
                      <span className="blink-dot"></span> LIVE
                    </div>
                    <div className="p-line" style={{ width: "180px" }}></div>

                    <div style={{ marginLeft: "auto", display: "flex", gap: "7px" }}>
                      <div className="control-btn">🎤</div>
                      <div className="control-btn">📹</div>
                      <div className="control-btn">💬</div>
                    </div>
                  </div>

                  <div className="live-screen">
                    <div className="p-line big" style={{ width: "60%", marginBottom: "10px" }}></div>
                    <div className="p-line" style={{ width: "95%" }}></div>
                    <div className="p-line" style={{ width: "80%" }}></div>
                    <div className="p-line" style={{ width: "88%" }}></div>

                    <div className="code-block">
                      <div className="code-line" style={{ width: "80%" }}></div>
                      <div className="code-line" style={{ width: "60%" }}></div>
                      <div className="code-line" style={{ width: "70%" }}></div>
                    </div>
                  </div>

                  <div className="live-participants">
                    <div className="live-participant" style={{ background: "#3b82f6" }}>A</div>
                    <div className="live-participant" style={{ background: "#10b981" }}>B</div>
                    <div className="live-participant" style={{ background: "#f59e0b" }}>C</div>
                    <div className="live-participant" style={{ background: "#8b5cf6" }}>D</div>
                    <div className="live-participant" style={{ background: "#ef4444" }}>E</div>
                    <span className="part-count">+33 students</span>
                  </div>
                </div>
              </div>
            )}

            {/* Assignments */}
            {activeTab === "assignments" && (
              <div className="preview">
                <div
                  style={{
                    padding: "16px",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0",
                    background: "var(--slate-50)",
                  }}
                >
                  <div className="asn-header">
                    <div className="p-line big" style={{ width: "160px" }}></div>
                    <div className="asn-new">+ New</div>
                  </div>

                  <div className="asn-row">
                    <div className="asn-dot" style={{ background: "#f59e0b" }}></div>
                    <div className="asn-info">
                      <div className="asn-title">Physics Lab Report</div>
                      <div className="asn-due">Due Tomorrow</div>
                    </div>
                    <div className="asn-badge pending">→</div>
                  </div>

                  <div className="asn-row">
                    <div className="asn-dot" style={{ background: "#10b981" }}></div>
                    <div className="asn-info">
                      <div className="asn-title">Math Problem Set 4</div>
                      <div className="asn-due">Submitted</div>
                    </div>
                    <div className="asn-badge done">✓</div>
                  </div>

                  <div className="asn-row">
                    <div className="asn-dot" style={{ background: "#3b82f6" }}></div>
                    <div className="asn-info">
                      <div className="asn-title">Chemistry Essay</div>
                      <div className="asn-due">Due in 3 days</div>
                    </div>
                    <div className="asn-badge pending">→</div>
                  </div>

                  <div className="asn-row">
                    <div className="asn-dot" style={{ background: "#8b5cf6" }}></div>
                    <div className="asn-info">
                      <div className="asn-title">English Comprehension</div>
                      <div className="asn-due">Graded: A+</div>
                    </div>
                    <div className="asn-badge graded">★</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="showcase-info">
          <h3 className="showcase-info-title">{getTitle()}</h3>
          <p className="showcase-info-desc">{getDesc()}</p>
        </div>
      </div>
    </section>
  );
}
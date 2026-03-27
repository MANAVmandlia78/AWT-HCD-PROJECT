const stats = [
  { value: "10K+", label: "Active Educators" },
  { value: "95%", label: "Student Satisfaction" },
  { value: "2.4M", label: "Lessons Delivered" },
  { value: "40+", label: "Countries" }
];

const features = [
  {
    icon: "⚡",
    title: "All-in-One Platform",
    desc: "Live classes, assignments, quizzes, and calendars — everything under one roof.",
    bg: "#eff6ff"
  },
  {
    icon: "🔴",
    title: "Real-Time Interaction",
    desc: "Low-latency screen sharing and live Q&A makes every class feel natural.",
    bg: "#fef2f2"
  },
  {
    icon: "✦",
    title: "Simple & Intuitive",
    desc: "Designed for zero learning curve. Start using it instantly.",
    bg: "#ecfdf5"
  },
  {
    icon: "📐",
    title: "Organized Workflow",
    desc: "Smart calendar, alerts, and tracking keep everything structured.",
    bg: "#f5f3ff"
  }
];

export default function WhyUs() {
  return (
    <section className="why-us" id="why-us">
      <div className="container">

        {/* Stats */}
        <div className="why-stats">
          {stats.map((item, index) => (
            <div key={index} className="why-stat">
              <div className="why-stat-val">{item.value}</div>
              <div className="why-stat-lbl">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Main Section */}
        <div className="why-main">

          {/* Left */}
          <div className="why-left">
            <div className="section-label">Why ClassConnect</div>

            <h2 className="section-title">
              Built for the Way Modern Education Works
            </h2>

            <p className="section-subtitle">
              We didn't just build another LMS. We reimagined what a classroom
              platform should feel like — fast, clean, and enjoyable to use.
            </p>

            <div className="why-cta-row">
              <button
                className="hero-btn-primary"
                style={{
                  padding: "13px 26px",
                  fontSize: "15px",
                  borderRadius: "10px"
                }}
              >
                Start for Free
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

              <p className="why-fine-print">
                No credit card required
              </p>
            </div>
          </div>

          {/* Cards */}
          <div className="why-cards">
            {features.map((item, index) => (
              <div key={index} className="why-card">

                <div
                  className="why-card-icon"
                  style={{ background: item.bg }}
                >
                  {item.icon}
                </div>

                <h3 className="why-card-title">{item.title}</h3>

                <p className="why-card-desc">{item.desc}</p>

              </div>
            ))}
          </div>

        </div>

        {/* Testimonial */}
        <div className="testimonial">
          <div className="quote-mark">"</div>

          <p className="testimonial-text">
            ClassConnect transformed how I run my classes. The live screen
            sharing is flawless, and my students love the clean interface.
          </p>

          <div className="testimonial-author">

            <div className="author-avatar">SK</div>

            <div>
              <div className="author-name">Sarah K.</div>
              <div className="author-role">
                High School Physics Teacher, NY
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
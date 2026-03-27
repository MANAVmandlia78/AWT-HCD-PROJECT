const steps = [
  {
    num: "01",
    title: "Join or Create a Course",
    desc: "Teachers set up courses in minutes. Students join with a simple invite code — no complex setup.",
    color: "#3b82f6",
    icon: "↓"
  },
  {
    num: "02",
    title: "Attend Live Classes",
    desc: "Join real-time sessions with screen sharing. Raise your hand, ask questions, and collaborate live.",
    color: "#10b981",
    icon: "🎥"
  },
  {
    num: "03",
    title: "Complete Assignments & Quizzes",
    desc: "Submit work directly on the platform. Take quizzes and see results instantly.",
    color: "#f59e0b",
    icon: "✏️"
  },
  {
    num: "04",
    title: "Track Progress & Deadlines",
    desc: "Monitor your academic journey with dashboards, grade reports, and reminders.",
    color: "#8b5cf6",
    icon: "📊"
  }
];

export default function HowItWorks() {
  return (
    <section className="how-it-works" id="how-it-works">
      <div className="container">

        {/* Header */}
        <div className="hiw-header">
          <div className="section-label">How It Works</div>
          <h2 className="section-title">Up and Running in 4 Simple Steps</h2>
          <p className="section-subtitle">
            ClassConnect is designed to get you into learning mode quickly — no tutorials, no confusion.
          </p>
        </div>

        {/* Steps */}
        <div className="hiw-steps">
          {steps.map((step, index) => (
            <div key={index} className="hiw-step">

              {/* Connector line (except last) */}
              {index !== steps.length - 1 && (
                <div className="hiw-connector"></div>
              )}

              <div className="hiw-step-inner">

                <div
                  className="hiw-step-icon"
                  style={{
                    borderColor: step.color,
                    color: step.color
                  }}
                >
                  {step.icon}
                </div>

                <div
                  className="hiw-step-num"
                  style={{ color: step.color }}
                >
                  {step.num}
                </div>

                <h3 className="hiw-step-title">{step.title}</h3>

                <p className="hiw-step-desc">{step.desc}</p>

              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="hiw-cta">
          <p>Ready to get started?</p>

          <button
            className="btn-primary"
            style={{
              padding: "12px 26px",
              fontSize: "15px",
              borderRadius: "10px"
            }}
          >
            Create Your Free Account
          </button>
        </div>

      </div>
    </section>
  );
}
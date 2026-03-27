const productLinks = [
  "Features",
  "Live Classes",
  "Assignments",
  "Quizzes",
  "Calendar"
];

const companyLinks = [
  "About Us",
  "Blog",
  "Careers",
  "Press"
];

const supportLinks = [
  "Help Center",
  "Contact Us",
  "Privacy Policy",
  "Terms of Service"
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">

        <div className="footer-grid">

          {/* Brand */}
          <div className="footer-brand">
            <a href="#" className="footer-logo">
              <span className="footer-logo-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <rect x="3" y="3" width="8" height="8" rx="2" fill="white" />
                  <rect x="13" y="3" width="8" height="8" rx="2" fill="white" opacity="0.5" />
                  <rect x="3" y="13" width="8" height="8" rx="2" fill="white" opacity="0.5" />
                  <rect x="13" y="13" width="8" height="8" rx="2" fill="white" />
                </svg>
              </span>
              ClassConnect
            </a>

            <p className="footer-tagline">
              The modern LMS for live teaching, smart assignments, and real-time learning — all in one place.
            </p>

            {/* Socials */}
            <div className="footer-socials">
              <a href="#" className="footer-social">🐙</a>
              <a href="#" className="footer-social">💼</a>
              <a href="#" className="footer-social">🐦</a>
            </div>
          </div>

          {/* Product */}
          <div className="footer-col">
            <h4 className="footer-col-title">Product</h4>
            <ul>
              {productLinks.map((item, index) => (
                <li key={index}>
                  <a href="#">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="footer-col">
            <h4 className="footer-col-title">Company</h4>
            <ul>
              {companyLinks.map((item, index) => (
                <li key={index}>
                  <a href="#">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="footer-col">
            <h4 className="footer-col-title">Support</h4>
            <ul>
              {supportLinks.map((item, index) => (
                <li key={index}>
                  <a href="#">{item}</a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <p className="footer-bottom-text">
            © 2025 ClassConnect. All rights reserved.
          </p>

          <div className="footer-bottom-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
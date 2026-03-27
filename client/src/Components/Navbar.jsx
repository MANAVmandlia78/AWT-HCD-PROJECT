import { useEffect, useState } from "react";
import logo from '../assets/ChatGPT Image Mar 22, 2026, 05_17_10 PM.png'
import logo2 from "../assets/ChatGPT Image Mar 26, 2026, 07_15_12 PM.png"
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
   const navigate = useNavigate();

  // Sticky scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

   const loginonclick = () => {
    navigate("/home");
  };

  return (
    <nav
      id="navbar"
      className={`navbar ${scrolled ? "scrolled" : ""}`}
    >
      <div className="container navbar-inner">
        
        {/* Logo */}
        <a href="#" className="navbar-logo">
          <span className="navbar-logo-icon">
            <img src={logo} alt="" className="logoimage" srcset="" />
            {/* <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
            >
              <rect x="3" y="3" width="8" height="8" rx="2" fill="white" />
              <rect x="13" y="3" width="8" height="8" rx="2" fill="white" opacity="0.5" />
              <rect x="3" y="13" width="8" height="8" rx="2" fill="white" opacity="0.5" />
              <rect x="13" y="13" width="8" height="8" rx="2" fill="white" />
            </svg> */}
          </span>
          <img src={logo2} alt="" className="logoimage2" srcset="" />
        </a>

        {/* Links */}
        <ul className="navbar-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">How It Works</a></li>
          <li><a href="#showcase">Showcase</a></li>
          <li><a href="#why-us">Why Us</a></li>
        </ul>

        {/* CTA Buttons */}
        <div className="navbar-cta">
          <button className="btn-ghost" onClick={loginonclick}>Log In</button>
          <button className="btn-primary">Sign Up Free</button>
        </div>

      </div>
    </nav>
  );
}
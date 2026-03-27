import React from "react";
import Navbar from "../Components/Navbar";
import Hero from "../Components/Hero";
import Features from "../Components/Features";
import HowItWorks from "../Components/HowItWorks";
import Showcase from "../Components/Showcase";
import WhyUs from "../Components/WhyUs";
import Footer from "../Components/Footer";
import Sidebar from '../Components/Sidebar'
import "../Styles/Landingpage.css"
// import './index.css'

const LandingPage = () => {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Showcase />
        <WhyUs />
      </main>

      <Footer />
    </>
  );
};

export default LandingPage;
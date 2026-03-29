import React from "react";
import "../Styles/profile.css";
import profile from "/profile-pic-man.png";

const Profile = () => {
  const user = {
    name: "Manav Mandalia",
    department: "Information and Communication Technology",
    enrollment: "92301733067",
    email: "manavmandalia077@gmail.com",
  };

  return (
    <div className="profile-container">
      <div className="profile-card">

        {/* TOP BAR */}
        <div className="profile-topbar">
          <span className="profile-label">Student Profile</span>
          <button className="edit-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit Profile
          </button>
        </div>

        <div className="profile-body">

          {/* LEFT */}
          <div className="profile-left">
            <div className="avatar-wrapper">
              <img src={profile} alt="profile" />
              <div className="avatar-badge">ICT</div>
            </div>
            <h2 className="profile-name">{user.name}</h2>
            <span className="profile-dept-tag">{user.department}</span>
          </div>

          {/* DIVIDER */}
          <div className="profile-divider" />

          {/* RIGHT */}
          <div className="profile-right">
            <p className="section-heading">Account Details</p>

            <div className="profile-info">
              <div className="info-row">
                <span className="info-label">Department</span>
                <p className="info-value">{user.department}</p>
              </div>

              <div className="info-row">
                <span className="info-label">Enrollment No.</span>
                <p className="info-value">{user.enrollment}</p>
              </div>

              <div className="info-row">
                <span className="info-label">Email Address</span>
                <p className="info-value">{user.email}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
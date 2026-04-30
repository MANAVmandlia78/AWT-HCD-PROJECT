import React from "react";
import "../Styles/Profile.css";
import profileMan from "/profile-pic-man.png";
import profileWoman from "/profile-pic-women.png";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user } = useAuth();

  if (!user) return <div>Loading...</div>;

  // 🔥 dynamic image
  const profileImage =
    user?.gender === "female" ? profileWoman : profileMan;

  return (
    <div className="profile-container">
      {/* Ambient gradient blob (amber/yellow) */}
      <div className="gradient-mid" />

      <div className="profile-card">

        {/* TOP BAR */}
        <div className="profile-topbar">
          <span className="profile-label">
            {user.role?.toUpperCase()} Profile
          </span>

          <button className="edit-btn">Edit Profile</button>
        </div>

        <div className="profile-body">

          {/* LEFT */}
          <div className="profile-left">
            <div className="avatar-wrapper">
              <img src={profileImage} alt="profile" />

              <div className="avatar-badge">
                {user.department?.slice(0, 3)?.toUpperCase()}
              </div>
            </div>

            <h2 className="profile-name">{user.name}</h2>

            <span className="profile-dept-tag">
              {user.department}
            </span>
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
                <p className="info-value">
                  {user.enrollment_no || "N/A"}
                </p>
              </div>

              <div className="info-row">
                <span className="info-label">Email Address</span>
                <p className="info-value">{user.email}</p>
              </div>

              <div className="info-row">
                <span className="info-label">College</span>
                <p className="info-value">{user.college}</p>
              </div>

              <div className="info-row">
                <span className="info-label">Role</span>
                <p className="info-value">
                  {user.role?.toUpperCase()}
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
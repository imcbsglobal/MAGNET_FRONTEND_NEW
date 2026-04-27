import React from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import '../SuperUserDashboard/SuperUserDashboard.scss';

const TeacherDashboard = () => {
  const username = localStorage.getItem('username') || 'Teacher';

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="teacher" />
      
      <main className="dashboard-main">
        <Navbar placeholder="Search activities..." />


        <div className="dashboard-content">
          <section className="welcome-section">
            <h2>Welcome Back, {username}!</h2>
            <p>You are logged in to the Magnet School staff portal.</p>
          </section>

          <div className="dashboard-grid">
            <div className="main-stats-card">
              <h3>Recent Activities</h3>
              <div className="performance-content">
                <div className="perf-value">
                  <span className="big-number">Active</span>
                  <span className="sub-text">Account Status</span>
                </div>
                <div className="activity-placeholder">
                   <p>No recent activity found. Start exploring your tasks.</p>
                </div>
              </div>
            </div>

            <div className="teacher-list-card">
              <h3>Quick Links</h3>
              <div className="teacher-item">
                <div className="avatar">P</div>
                <div className="info">
                  <span className="name">My Profile</span>
                  <span className="subject">View and edit your details</span>
                </div>
              </div>
              <div className="teacher-item">
                <div className="avatar">T</div>
                <div className="info">
                  <span className="name">Tasks</span>
                  <span className="subject">View assigned responsibilities</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;

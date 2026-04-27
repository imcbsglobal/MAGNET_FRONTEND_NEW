import React from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import '../SuperUserDashboard/SuperUserDashboard.scss';

const AdminDashboard = () => {
  const schoolName = localStorage.getItem('schoolName') || 'School Admin';

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="admin" />
      
      <main className="dashboard-main">
        <Navbar placeholder="Search school data..." />


        <div className="dashboard-content">
          <section className="welcome-section">
            <h2>Welcome Back, {schoolName}!</h2>
            <p>Here is what's happening in your school today.</p>
            <a href="#" className="learn-more">View system reports →</a>
          </section>

          <div className="dashboard-grid">
            <div className="main-stats-card">
              <h3>Management Overview</h3>
              <div className="performance-content">
                <div className="perf-value">
                  <span className="big-number">Active</span>
                  <span className="sub-text">System Status</span>
                </div>
                <div className="chart-placeholder">
                  <div className="bar" style={{ height: '60%', background: '#3d5af1' }}></div>
                  <div className="bar" style={{ height: '80%', background: '#3d5af1' }}></div>
                  <div className="bar" style={{ height: '40%', background: '#3d5af1' }}></div>
                  <div className="bar" style={{ height: '90%', background: '#3d5af1' }}></div>
                </div>
              </div>
            </div>

            <div className="teacher-list-card">
              <h3>Quick Actions</h3>
              <div className="teacher-item">
                <div className="avatar">U</div>
                <div className="info">
                  <span className="name">Manage Users</span>
                  <span className="subject">Add or Edit staff/students</span>
                </div>
              </div>
              <div className="teacher-item">
                <div className="avatar">J</div>
                <div className="info">
                  <span className="name">Job Categories</span>
                  <span className="subject">Configure job roles</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

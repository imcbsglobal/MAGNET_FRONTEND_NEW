import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import './SuperUserDashboard.scss';

const SuperUserDashboard = () => {
  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="superuser" />

      <main className="dashboard-main">
        <Navbar placeholder="Search system data..." />


        <section className="dashboard-content">
          <div className="welcome-section">
            <h2>Hello Superadmin!</h2>
            <p>You have full administrative access. Monitor and manage your system here.</p>
            <a href="#learn" className="learn-more">Learn more</a>
          </div>

          <div className="dashboard-grid">
            <div className="main-stats-card">
              <div className="card-header">
                <h3>Performance</h3>
              </div>
              <div className="performance-content">
                <div className="perf-value">
                  <span className="big-number">95.4</span>
                  <span className="sub-text">Average Performance Score</span>
                </div>
                <div className="chart-placeholder">
                  {/* Mock Chart */}
                  <div className="bar" style={{ height: '70%', background: '#4c6ef5' }}></div>
                  <div className="bar" style={{ height: '85%', background: '#4c6ef5' }}></div>
                  <div className="bar" style={{ height: '60%', background: '#4c6ef5' }}></div>
                  <div className="bar" style={{ height: '95%', background: '#4c6ef5' }}></div>
                </div>
              </div>
            </div>

            <div className="secondary-stats">
              <div className="teacher-list-card">
                <h3>Linked Teachers</h3>
                <div className="teacher-item">
                  <div className="avatar">MJ</div>
                  <div className="info">
                    <span className="name">Mary Johnson</span>
                    <span className="subject">Science</span>
                  </div>
                </div>
                <div className="teacher-item">
                  <div className="avatar">JB</div>
                  <div className="info">
                    <span className="name">James Brown</span>
                    <span className="subject">Mathematics</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SuperUserDashboard;

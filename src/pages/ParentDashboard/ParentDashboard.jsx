import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchPaidFees } from '../../services/api';
import '../SuperUserDashboard/SuperUserDashboard.scss';
import './ParentDashboard.scss';

const ParentDashboard = () => {
  const studentName = localStorage.getItem('studentName') || 'Student';
  const admno = localStorage.getItem('admno') || 'N/A';
  const institutionId = localStorage.getItem('institutionId') || 'N/A';
  const [paidTotal, setPaidTotal] = useState(0);
  const [paidLoading, setPaidLoading] = useState(true);
  const [paidError, setPaidError] = useState('');

  useEffect(() => {
    if (!institutionId || !admno) {
      setPaidLoading(false);
      return;
    }

    fetchPaidFees(institutionId, admno)
      .then((response) => {
        if (response.data.status) {
          setPaidTotal(response.data.total_paid || 0);
        } else {
          setPaidError(response.data.message || 'Unable to load paid fee total.');
        }
      })
      .catch((err) => {
        setPaidError(err.response?.data?.message || 'Unable to load paid fee total.');
      })
      .finally(() => setPaidLoading(false));
  }, [institutionId, admno]);

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="parent" />
      <main className="dashboard-main">
        <Navbar placeholder="Search school updates..." />

        <div className="dashboard-content parent-dashboard-content">
          <section className="welcome-section parent-welcome-section">
            <div className="welcome-copy">
              <span className="dashboard-label">Parent Dashboard</span>
              <h2>Welcome, Parent of {studentName}</h2>
              <p>Keep track of your child's school life with quick access to fees, attendance, updates, and important notices in one polished dashboard.</p>
              <div className="welcome-actions">
                <button type="button" className="primary-action" onClick={() => window.location.href = '/parent/pending-fee'}>
                  View Pending Fee
                </button>
              </div>
            </div>
            <div className="welcome-highlights">
              <div className="highlight-card">
                <span>Student</span>
                <strong>{studentName}</strong>
              </div>
              <div className="highlight-card">
                <span>Admission No.</span>
                <strong>{admno}</strong>
              </div>
              <div className="highlight-card">
                <span>Institution ID</span>
                <strong>{institutionId}</strong>
              </div>
              <div className="highlight-card highlight-card-accent">
                <span>Total Paid</span>
                <strong>
                  {paidLoading ? 'Loading...' : paidError ? 'N/A' : `₹${Number(paidTotal).toFixed(2)}`}
                </strong>
              </div>
            </div>
          </section>

          <div className="dashboard-grid parent-dashboard-grid">
            <div className="main-stats-card student-details-card">
              <div className="card-header">
                <div>
                  <h3>Student Details</h3>
                  <p>Quick overview of your student's account.</p>
                </div>
              </div>
              <div className="student-details-list">
                <div className="detail-item">
                  <span>Student Name</span>
                  <strong>{studentName}</strong>
                </div>
                <div className="detail-item">
                  <span>Admission Number</span>
                  <strong>{admno}</strong>
                </div>
                <div className="detail-item">
                  <span>Institution ID</span>
                  <strong>{institutionId}</strong>
                </div>
              </div>
            </div>

            <div className="teacher-list-card quick-access-card">
              <div className="card-header">
                <div>
                  <h3>Quick Access</h3>
                  <p>Jump to the most important parent actions.</p>
                </div>
              </div>
              <div className="action-list">
                <button className="action-item" type="button" onClick={() => window.location.href = '/parent/pending-fee'}>
                  <div className="avatar">P</div>
                  <div>
                    <span className="action-title">Pending Fee</span>
                    <p>View the current fee balance for your student.</p>
                  </div>
                </button>
                <button className="action-item" type="button">
                  <div className="avatar">A</div>
                  <div>
                    <span className="action-title">Attendance</span>
                    <p>Track daily attendance and recap reports.</p>
                  </div>
                </button>
                <button className="action-item" type="button" onClick={() => window.location.href = '/parent/paid-fee'}>
                  <div className="avatar">F</div>
                  <div>
                    <span className="action-title">Paid Fee</span>
                    <p>View recently paid fee records for your student.</p>
                  </div>
                </button>
                <button className="action-item" type="button">
                  <div className="avatar">G</div>
                  <div>
                    <span className="action-title">Grades</span>
                    <p>Review academic progress and exam scores.</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ParentDashboard;

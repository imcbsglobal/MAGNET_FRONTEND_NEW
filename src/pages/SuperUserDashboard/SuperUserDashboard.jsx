import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdministrators } from '../../services/api';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import logo from '../../assets/logo.png';
import './SuperUserDashboard.scss';

const SuperUserDashboard = () => {
  const navigate = useNavigate();
  const [administrators, setAdministrators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLogo, setShowLogo] = useState(true); // Default to showing logo for superuser

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.replace('/login');
      return;
    }
    const loadAdministrators = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetchAdministrators();
        setAdministrators(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Failed to load administrators:', err);
        setError('Unable to load administrator activity.');
      } finally {
        setLoading(false);
      }
    };

    loadAdministrators();
  }, []);

  const totalClients = new Set(administrators.map((admin) => admin.institution_id).filter(Boolean)).size;
  const totalAdmins = administrators.length;

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="superuser" />

      <main className="dashboard-main">
        <Navbar placeholder="Search administrator activity..." />

        <div className="dashboard-content superuser-dashboard-content">
          <section className="superuser-hero">
            <div>
              <span className="superuser-kicker">Superuser Dashboard</span>
              <h2>Staff Activity by Client</h2>
              <p>See which client IDs have active staff/admin accounts, mapped in a colorful client activity graph.</p>
              <div className="superuser-hero-actions">
                <button type="button" className="superuser-primary-btn" onClick={() => navigate('/administrators')}>
                  Manage Administrators
                </button>
                <button type="button" className="superuser-secondary-btn" onClick={() => navigate('/administrators')}>
                  View Full List
                </button>
              </div>
            </div>
            <div className={`superuser-status-card ${showLogo ? 'has-logo' : ''}`}>
              {showLogo ? (
                <div className="superuser-logo-display">
                  <img src={logo} alt="MAGNET Logo" />
                </div>
              ) : (
                <>
                  <span>Activity summary</span>
                  <strong>{loading ? '...' : totalAdmins}</strong>
                  <p>{loading ? '...' : `${totalAdmins} administrators across ${totalClients} clients.`}</p>
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default SuperUserDashboard;

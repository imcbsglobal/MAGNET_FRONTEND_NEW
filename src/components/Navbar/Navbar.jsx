import React, { useState } from 'react';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import './Navbar.scss';

const Navbar = () => {
  const [showLogout, setShowLogout] = useState(false);

  const userType    = localStorage.getItem('userType') || '';
  const studentName = localStorage.getItem('studentName') || '';
  const username    = localStorage.getItem('username') || '';

  // For parent show student name, otherwise username
  const displayName = userType === 'parent'
    ? (studentName || username || 'User')
    : (username || 'User');

  const getInitials = (name) => {
    const parts = String(name || 'U').trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  };

  return (
    <>
      {/* Mobile-only top navbar — hidden on desktop via CSS */}
      <div className="mobile-navbar">
        {/* Left: spacer for the sidebar toggle (38px + 14px gap) */}
        <div className="mobile-navbar-left" />

        {/* Right: user avatar + name + logout */}
        <div className="mobile-navbar-right">
          <div className="mobile-navbar-user">
            <div className="mobile-navbar-avatar">{getInitials(displayName)}</div>
            <span className="mobile-navbar-name">{displayName}</span>
          </div>
          <button
            type="button"
            className="mobile-navbar-logout"
            onClick={() => setShowLogout(true)}
            aria-label="Log out"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 16l4-4m0 0l-4-4m4 4H9" />
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            </svg>
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        onConfirm={() => { localStorage.clear(); window.location.replace('/'); }}
        onCancel={() => setShowLogout(false)}
        confirmText="Yes, Logout"
        type="danger"
      />
    </>
  );
};

export default Navbar;

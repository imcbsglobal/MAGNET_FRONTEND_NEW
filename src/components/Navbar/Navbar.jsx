import React from 'react';
import './Navbar.scss';

const Navbar = () => {
  const userType = localStorage.getItem('userType') || 'user';
  const schoolName = localStorage.getItem('schoolName') || localStorage.getItem('username') || 'User';
  
  const getRoleLabel = () => {
    switch(userType) {
      case 'superuser': return 'Superadmin';
      case 'admin': return 'Administrator';
      case 'parent': return 'Parent';
      case 'staff': return 'Staff Member';
      default: return 'Staff Member';
    }
  };

  return (
    <>
      <header className="main-header">
        <div className="user-profile">
          <div className="profile-info">
            <span className="profile-name">{schoolName}</span>
            <span className="profile-role">{getRoleLabel()}</span>
          </div>
          <div className="profile-avatar" />
        </div>
      </header>
      <div className="main-header-spacer" aria-hidden="true" />
    </>
  );
};

export default Navbar;

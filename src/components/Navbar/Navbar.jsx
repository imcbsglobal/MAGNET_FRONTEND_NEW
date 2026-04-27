import React from 'react';
import './Navbar.scss';

const Navbar = ({ placeholder = "Search data..." }) => {
  const userType = localStorage.getItem('userType') || 'user';
  const schoolName = localStorage.getItem('schoolName') || localStorage.getItem('username') || 'User';
  
  const getRoleLabel = () => {
    switch(userType) {
      case 'superuser': return 'Superadmin';
      case 'admin': return 'Administrator';
      default: return 'Staff Member';
    }
  };

  return (
    <header className="main-header">
      <div className="search-bar">
        <input type="text" placeholder={placeholder} />
      </div>
      
      <div className="user-profile">
        <div className="profile-info">
          <span className="profile-name">{schoolName}</span>
          <span className="profile-role">{getRoleLabel()}</span>
        </div>
        <div className="profile-avatar"></div>
      </div>
    </header>
  );
};

export default Navbar;

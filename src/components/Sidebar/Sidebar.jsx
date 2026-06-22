import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import logo from '../../assets/logo2.jpg';
import logoMini from '../../assets/logo1.jpg';
import './Sidebar.scss';

const Sidebar = ({ userType = 'superuser' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [openMenus, setOpenMenus] = React.useState({});
  const [ripple, setRipple] = React.useState({ id: null, x: 0, y: 0 });

  const jobCategory = localStorage.getItem('jobCategory') || '';

  // User info for footer profile card
  const username = localStorage.getItem('username') || 'User';
  const storedUserType = localStorage.getItem('userType') || userType;

  const getRoleLabel = () => {
    switch (storedUserType) {
      case 'superuser':      return 'Superadmin';
      case 'admin':          return 'Administrator';
      case 'administration': return 'Administrator';
      case 'parent':         return 'Parent';
      case 'staff':          return 'Staff Member';
      case 'teacher':        return 'Staff Member';
      default:               return 'Staff Member';
    }
  };

  const getInitials = (name) => {
    const parts = String(name || 'U').trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  };

  const toggleMobile   = () => setIsMobileOpen(!isMobileOpen);
  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  React.useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      isCollapsed ? '76px' : '220px'
    );
  }, [isCollapsed]);

  const handleNavClick = (e, path, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ id: index, x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setRipple({ id: null, x: 0, y: 0 }), 500);
    navigate(path);
    if (isMobileOpen) setIsMobileOpen(false);
  };

  const handleToggleMenu = (index) => {
    setOpenMenus((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleParentClick = (e, index, hasChildren) => {
    if (!hasChildren) return;
    if (isCollapsed) {
      setIsCollapsed(false);
      setOpenMenus((prev) => ({ ...prev, [index]: true }));
      return;
    }
    handleToggleMenu(index);
  };

  const Icons = {
    Dashboard: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"></rect>
        <rect x="3" y="14" width="7" height="7" rx="1"></rect>
        <rect x="14" y="14" width="7" height="7" rx="1"></rect>
        <rect x="14" y="3" width="7" height="7" rx="1"></rect>
      </svg>
    ),
    Teachers: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    Students: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    Admins: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
    ),
    PendingFee: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5h16v14H4z"></path>
        <path d="M4 9h16" strokeLinecap="round"></path>
        <path d="M8 13h8" strokeLinecap="round"></path>
      </svg>
    ),
    PaidFee: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1v22"></path>
        <path d="M6 7h12"></path>
        <path d="M6 17h12"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    ),
    Calendar: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"></rect>
        <path d="M16 2v4"></path>
        <path d="M8 2v4"></path>
        <path d="M3 10h18"></path>
      </svg>
    ),
    SchoolInfo: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    ),
    IDCard: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2"></rect>
        <path d="M7 9h10M7 13h7" strokeLinecap="round"></path>
      </svg>
    ),
    Folder: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      </svg>
    ),
    SubItem: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2"></circle>
      </svg>
    ),
    Attendance: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"></rect>
        <path d="M16 2v4M8 2v4M3 10h18"></path>
        <path d="M9 16l2 2 4-4"></path>
      </svg>
    ),
    Chat: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    ),
    Logout: () => (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 16L21 12M21 12L17 8M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    ChevronLeft: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6"></path>
      </svg>
    ),
  };

  const menuConfigs = {
    superuser: [
      { icon: <Icons.Dashboard />, label: 'Dashboard', path: '/superuser-dashboard' },
      { icon: <Icons.Admins />, label: 'Administrators', path: '/administrators' },
    ],
    admin: [
      { icon: <Icons.Dashboard />, label: 'Dashboard', path: '/admin-dashboard' },
      { icon: <Icons.Teachers />, label: 'Staff', path: '/admin/staff' },
      { icon: <Icons.Folder />, label: 'Job Categories', path: '/admin/job-categories' },
      { icon: <Icons.Students />, label: 'Student List', path: '/admin/students' },
      { icon: <Icons.PendingFee />, label: 'Pending Fee', path: '/admin/pending-fee' },
      { icon: <Icons.PaidFee />, label: 'Paid Fee', path: '/admin/paid-fee' },
      { icon: <Icons.IDCard />, label: 'ID Card Details', path: '/admin/id-card/details' },
      { icon: <Icons.Calendar />, label: 'Academic Calendar', path: '/admin/calendar' },
      { icon: <Icons.SchoolInfo />, label: 'School Information', path: '/admin/school-info' },
      {
        icon: <Icons.Folder />,
        label: 'Masters',
        children: [
          { label: 'House Groups', path: '/admin/masters/house-groups' },
          { label: 'Subjects', path: '/admin/masters/subjects' },
          { label: 'Teacher Hours', path: '/admin/masters/teacher-hours' },
        ],
      },
      { icon: <Icons.Teachers />, label: 'Evaluations', path: '/admin/evaluations' },
    ],
    // "teacher" key — used when jobCategory or userType is "teacher"
    teacher: [
      { icon: <Icons.Dashboard />, label: 'Dashboard', path: '/staff-dashboard' },
      { icon: <Icons.Students />, label: 'Student List', path: '/staff/students' },
      { icon: <Icons.Attendance />, label: 'Attendance', path: '/staff/attendance' },
      {
        icon: <Icons.IDCard />,
        label: 'ID Card',
        children: [
          { label: 'ID Card Details', path: '/staff/id-card/details' },
          { label: 'Issue ID Card', path: '/staff/id-card/issue' },
        ],
      },
      { icon: <Icons.Teachers />, label: 'My Evaluation', path: '/teacher/evaluation' },
      { icon: <Icons.Chat />, label: 'Chat', path: '/chat' },
    ],
    hod: [
      { icon: <Icons.Dashboard />, label: 'Dashboard', path: '/staff-dashboard' },
      { icon: <Icons.Students />, label: 'Student List', path: '/staff/students' },
      { icon: <Icons.Attendance />, label: 'Attendance', path: '/staff/attendance' },
      {
        icon: <Icons.IDCard />,
        label: 'ID Card',
        children: [
          { label: 'ID Card Details', path: '/staff/id-card/details' },
          { label: 'Issue ID Card', path: '/staff/id-card/issue' },
        ],
      },
      { icon: <Icons.Teachers />, label: 'Evaluations', path: '/hod/evaluation' },
      { icon: <Icons.Chat />, label: 'Chat', path: '/chat' },
    ],
    parent: [
      { icon: <Icons.Dashboard />, label: 'Dashboard', path: '/parent-dashboard' },
      { icon: <Icons.PendingFee />, label: 'Pending Fee', path: '/parent/pending-fee' },
      { icon: <Icons.PaidFee />, label: 'Paid Fee', path: '/parent/paid-fee' },
      { icon: <Icons.Chat />, label: 'Chat', path: '/chat' },
    ],
  };

  // ── Menu resolution (order matters) ──────────────────────────────────────
  //
  // Priority:
  //   1. jobCategory from localStorage (lowercased), if it matches a config key
  //   2. storedUserType from localStorage (lowercased), with aliases resolved
  //   3. userType prop passed to <Sidebar /> (lowercased), with aliases resolved
  //   4. Fall back to "teacher" menu so staff pages never show empty sidebar
  //
  // Aliases: "staff" → "teacher",  "administration" → "admin"
  const resolveKey = (raw) => {
    const k = (raw || '').toLowerCase().trim();
    if (k === 'staff')          return 'teacher';
    if (k === 'administration') return 'admin';
    return k;
  };

  const menuItems =
    menuConfigs[resolveKey(jobCategory)] ||
    menuConfigs[resolveKey(storedUserType)] ||
    menuConfigs[resolveKey(userType)] ||
    menuConfigs.teacher; // safe fallback so sidebar is never empty

  return (
    <>
      <button className={`mobile-toggle ${isMobileOpen ? 'open' : ''}`} onClick={toggleMobile}>
        {isMobileOpen ? '✕' : '☰'}
      </button>

      {isMobileOpen && <div className="sidebar-overlay show" onClick={toggleMobile}></div>}

      <aside className={`dashboard-sidebar ${isMobileOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>

        {/* Collapse / expand toggle */}
        <button
          type="button"
          className="sidebar-collapse-toggle"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className={`collapse-arrow ${isCollapsed ? 'rotated' : ''}`}>
            <Icons.ChevronLeft />
          </span>
        </button>

        {/* Brand */}
        <div className="sidebar-brand">
          <span className="brand-text">
            <img src={logo} alt="MAGNET" className="brand-logo-full" />
          </span>
          <span className="brand-mini">
            <img src={logoMini} alt="M" className="brand-logo-mini" />
          </span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {menuItems.map((item, index) => {
            const hasChildren  = Array.isArray(item.children) && item.children.length > 0;
            const isActive     = item.path && (
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path))
            );
            const isChildActive = hasChildren && item.children.some(
              (child) => location.pathname === child.path || location.pathname.startsWith(child.path)
            );
            const isOpen = hasChildren && (openMenus[index] || isChildActive);

            return (
              <div
                key={index}
                className={`nav-item-group ${isActive || isChildActive ? 'active' : ''} ${isOpen ? 'open' : ''}`}
              >
                <div
                  className={`nav-item ${isActive || isChildActive ? 'active' : ''}`}
                  data-tooltip={item.label}
                  onClick={(e) => {
                    if (hasChildren) {
                      handleParentClick(e, index, hasChildren);
                    } else if (item.isAction) {
                      window.dispatchEvent(new CustomEvent(item.action));
                      if (isMobileOpen) setIsMobileOpen(false);
                    } else if (item.path) {
                      handleNavClick(e, item.path, index);
                    }
                  }}
                >
                  {ripple.id === index && (
                    <span className="nav-ripple" style={{ left: ripple.x, top: ripple.y }} />
                  )}
                  <span className="item-icon">{item.icon}</span>
                  <span className="item-label">{item.label}</span>
                  {hasChildren && (
                    <span className={`submenu-arrow ${isOpen ? 'open' : ''}`}>▾</span>
                  )}
                  {(isActive || isChildActive) && <span className="active-dot" />}
                </div>

                {hasChildren && (
                  <div className="nav-submenu">
                    {item.children.map((child, childIndex) => {
                      const childActive =
                        location.pathname === child.path ||
                        location.pathname.startsWith(child.path);
                      return (
                        <div
                          key={childIndex}
                          className={`nav-item sub-item ${childActive ? 'active' : ''}`}
                          onClick={(e) => handleNavClick(e, child.path, `${index}-${childIndex}`)}
                        >
                          <span className="item-icon sub-icon"><Icons.SubItem /></span>
                          <span className="item-label">{child.label}</span>
                          {childActive && <span className="active-dot" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer: user profile + logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user" data-tooltip={`${username} · ${getRoleLabel()}`}>
            <div className="sidebar-user-avatar">{getInitials(username)}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{username}</span>
              <span className="sidebar-user-role">{getRoleLabel()}</span>
            </div>
          </div>

          <div className="sidebar-footer-divider" />

          <div className="logout-card" data-tooltip="Log Out" onClick={() => setShowLogoutConfirm(true)}>
            <div className="logout-icon-container"><Icons.Logout /></div>
            <button type="button" className="logout-btn">Log Out</button>
          </div>
        </div>

        <ConfirmModal
          isOpen={showLogoutConfirm}
          title="Confirm Logout"
          message="Are you sure you want to log out of the system?"
          onConfirm={() => { localStorage.clear(); window.location.href = '/'; }}
          onCancel={() => setShowLogoutConfirm(false)}
          confirmText="Yes, Logout"
          type="danger"
        />
      </aside>
    </>
  );
};

export default Sidebar;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTeachers, deleteTeacher } from '../../services/api';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './StaffList.scss';

const StaffIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94C16.04 19.26 14.06 20 12 20c-7 0-11-8-11-8 1.79-3.48 4.59-5.96 7.96-7.01" />
    <path d="M9.53 9.53a3 3 0 0 1 4.24 4.24" />
    <path d="M1 1l22 22" />
  </svg>
);

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

const AVATAR_COLORS = ['#6366F1', '#4F46E5', '#3B82F6', '#0EA5E9', '#8B5CF6', '#6D28D9', '#2563EB', '#7C3AED'];

const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  return words.slice(0, 3).map((w) => w[0].toUpperCase()).join('');
};

const getAvatarColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' });
};

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const StaffList = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const institutionId = localStorage.getItem('institutionId');

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => { loadStaff(); }, []);
  useEffect(() => { setCurrentPage(1); }, [search]);

  const loadStaff = async () => {
    try {
      const response = await fetchTeachers(institutionId);
      setStaff(response.data);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => { setDeleteId(id); setShowDeleteConfirm(true); };

  const confirmDelete = async () => {
    try {
      await deleteTeacher(deleteId);
      setStaff(staff.filter((s) => s.id !== deleteId));
      setShowDeleteConfirm(false);
    } catch (err) { alert('Failed to delete'); }
  };

  const renderAdditionalAssignments = (assignments) => {
    if (!assignments || assignments.length === 0) return '-';
    return (
      <div className="staff-assignments-list">
        {assignments.map((a, i) => (
          <div key={i} className="staff-assignment-chip">{a.class} - {a.division}</div>
        ))}
      </div>
    );
  };

  const renderSubjects = (subjects) => {
    if (!subjects || subjects.length === 0) return '-';
    return (
      <div className="staff-assignments-list">
        {subjects.map((s, i) => (
          <div key={i} className="staff-assignment-chip" style={{ backgroundColor: '#e3f2fd', color: '#1565c0' }}>{s.name}</div>
        ))}
      </div>
    );
  };

  const renderAssignedTeachers = (teachers) => {
    if (!teachers || teachers.length === 0) return '-';
    return (
      <div className="staff-assignments-list">
        {teachers.map((t, i) => (
          <div key={i} className="staff-assignment-chip" style={{ backgroundColor: '#e8f5e9', color: '#2e7d32' }}>{t.name}</div>
        ))}
      </div>
    );
  };

  const filteredStaff = staff.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const searchableSubjects = s.subjects ? s.subjects.map(sub => sub.name).join(' ') : '';
    return [s.username, s.staff_id, s.job_category, s.assigned_class, s.assigned_division, s.reg_number, s.nationality, searchableSubjects]
      .some((v) => v && String(v).toLowerCase().includes(q));
  });

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / pageSize));
  const firstIndex = (currentPage - 1) * pageSize;
  const paginated = filteredStaff.slice(firstIndex, firstIndex + pageSize);

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="admin" />
      <main className="dashboard-main">
        <Navbar placeholder="Search users..." />
        <div className="staff-page">

          {/* ── Header ── */}
          <div className="staff-header">
            <div className="staff-header-main">
              <div className="staff-header-icon"><StaffIcon /></div>
              <div>
                <h1>Staff</h1>
                <p>Manage staff for your school</p>
              </div>
            </div>
            <div className="staff-actions">
              <button type="button" className="primary-btn" onClick={() => navigate('/admin/staff/add')}>
                + Add Staff
              </button>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="staff-table-card">

            <div className="staff-toolbar">
              <div className="staff-search">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search staff, job category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="staff-empty">Loading staff...</div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="staff-table">
                    <thead>
                      <tr>
                        <th>No.</th>
                        <th>Staff</th>
                        <th>Staff ID</th>
                        <th>Password</th>
                        <th>Job Category</th>
                        <th>Primary Class</th>
                        <th>Primary Division</th>
                        <th>Assigned Classes</th>
                        <th>Subjects</th>
                        <th>Assigned Teachers</th>
                        <th>Reg Number</th>
                        <th>School Reg No</th>
                        <th>Address</th>
                        <th>Pincode</th>
                        <th>Nationality</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((member, index) => (
                        <tr key={member.id}>
                          <td className="staff-no-cell">{firstIndex + index + 1}</td>
                          <td>
                            <div className="staff-person">
                              <span className="staff-avatar" style={{ background: getAvatarColor(member.username) }}>
                                {getInitials(member.username)}
                              </span>
                              <span className="staff-person-name">{member.username}</span>
                            </div>
                          </td>
                          <td className="staff-plain-cell">{member.staff_id || '-'}</td>
                          <td className="staff-password-column">
                            {member.password ? (
                              <div className="staff-password-cell">
                                <button
                                  type="button"
                                  className="action-btn staff-password-toggle"
                                  onClick={() => togglePasswordVisibility(member.id)}
                                  aria-label={visiblePasswords[member.id] ? 'Hide password' : 'Show password'}
                                >
                                  {visiblePasswords[member.id] ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                                {visiblePasswords[member.id] && (
                                  <span className="staff-password-text">{member.password}</span>
                                )}
                              </div>
                            ) : '-'}
                          </td>
                          <td>{member.job_category ? <span className="pill">{member.job_category}</span> : 'N/A'}</td>
                          <td className="staff-plain-cell">{member.assigned_class || '-'}</td>
                          <td className="staff-plain-cell">{member.assigned_division || '-'}</td>
                          <td>{renderAdditionalAssignments(member.additional_class_assignments)}</td>
                          <td>{renderSubjects(member.subjects)}</td>
                          <td>{renderAssignedTeachers(member.assigned_teachers)}</td>
                          <td className="staff-plain-cell">{member.reg_number || '-'}</td>
                          <td className="staff-plain-cell">{member.school_reg_number || '-'}</td>
                          <td className="staff-address-cell">{member.address || '-'}</td>
                          <td className="staff-plain-cell">{member.pincode || '-'}</td>
                          <td className="staff-plain-cell">{member.nationality || '-'}</td>
                          <td>
                            <div className="staff-date-cell">
                              <span className="staff-date-main">{formatDate(member.created_at)}</span>
                              <span className="staff-date-sub">{formatTime(member.created_at)}</span>
                            </div>
                          </td>
                          <td>
                            <div className="staff-actions-cell">
                              <button
                                type="button"
                                className="action-btn edit-btn"
                                onClick={() => navigate(`/admin/staff/edit/${member.id}`)}
                                title="Edit staff"
                              >
                                <EditIcon />
                              </button>
                              <button
                                type="button"
                                className="action-btn delete-btn"
                                onClick={() => handleDeleteClick(member.id)}
                                title="Delete staff"
                              >
                                <DeleteIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="staff-table-controls">
                  <div className="staff-table-filter">
                    <label>Rows per page</label>
                    <select
                      className="staff-select"
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    >
                      {[10, 20, 50, 100].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="staff-table-pagination">
                    <span>Showing {filteredStaff.length === 0 ? 0 : firstIndex + 1}–{Math.min(filteredStaff.length, firstIndex + pageSize)} of {filteredStaff.length}</span>
                    <div className="staff-pagination-buttons">
                      <button type="button" className="secondary-btn" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>Previous</button>
                      <button type="button" className="secondary-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <ConfirmModal isOpen={showDeleteConfirm} title="Delete Staff" message="Are you sure you want to delete this staff account?" onConfirm={confirmDelete} onCancel={() => setShowDeleteConfirm(false)} confirmText="Delete" type="danger" />
        </div>
      </main>
    </div>
  );
};

export default StaffList;
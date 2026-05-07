import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTeachers, deleteTeacher } from '../../services/api';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import '../Administrators/Administrators.scss';

const StaffList = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const institutionId = localStorage.getItem('institutionId');

  useEffect(() => { loadStaff(); }, []);

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
      setStaff(staff.filter(s => s.id !== deleteId));
      setShowDeleteConfirm(false);
    } catch (err) { alert('Failed to delete'); }
  };

  const totalPages = Math.max(1, Math.ceil(staff.length / pageSize));
  const firstIndex = (currentPage - 1) * pageSize;
  const paginated = staff.slice(firstIndex, firstIndex + pageSize);

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="admin" />
      <main className="dashboard-main">
        <Navbar placeholder="Search users..." />
        <div className="admins-page-container">
          <header className="page-header">
            <div className="header-left">
              <h1>Staff</h1>
              <p>Manage staff for your school</p>
            </div>
            <button className="add-btn" onClick={() => navigate('/admin/staff/add')}>+ Add Staff</button>
          </header>

          <div className="table-card">
            <div className="table-controls">
              <div className="table-filter">
                <label>Rows per page</label>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                  {[10, 20, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="table-pagination">
                <span>Showing {staff.length === 0 ? 0 : firstIndex + 1}–{Math.min(staff.length, firstIndex + pageSize)} of {staff.length}</span>
                <div className="pagination-buttons">
                  <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
                  <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                </div>
              </div>
            </div>

            {loading ? <div className="loader" style={{ padding: '20px' }}>Loading...</div> : (
              <div className="table-responsive">
                <table className="admins-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Staff ID</th>
                      <th>Username</th>
                      <th>Job Category</th>
                      <th>Class</th>
                      <th>Division</th>
                      <th>Reg Number</th>
                      <th>School Reg No</th>
                      <th>Address</th>
                      <th>Pincode</th>
                      <th>Nationality</th>
                      <th>Institution ID</th>
                      <th>Created Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((member, index) => (
                      <tr key={member.id}>
                        <td>{firstIndex + index + 1}</td>
                        <td><span className="badge">{member.staff_id || '-'}</span></td>
                        <td style={{ fontWeight: 600 }}>{member.username}</td>
                        <td><span className="badge secondary">{member.job_category || 'N/A'}</span></td>
                        <td>{member.assigned_class || '-'}</td>
                        <td>{member.assigned_division || '-'}</td>
                        <td>{member.reg_number || '-'}</td>
                        <td>{member.school_reg_number || '-'}</td>
                        <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.address || '-'}</td>
                        <td>{member.pincode || '-'}</td>
                        <td>{member.nationality || '-'}</td>
                        <td><span className="badge">{member.institution_id}</span></td>
                        <td>{new Date(member.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="action-btns">
                            <button className="edit-btn" onClick={() => navigate(`/admin/staff/edit/${member.id}`)}>Edit</button>
                            <button className="delete-btn" onClick={() => handleDeleteClick(member.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <ConfirmModal isOpen={showDeleteConfirm} title="Delete Staff" message="Are you sure you want to delete this staff account?" onConfirm={confirmDelete} onCancel={() => setShowDeleteConfirm(false)} confirmText="Delete" type="danger" />
        </div>
      </main>
    </div>
  );
};

export default StaffList;

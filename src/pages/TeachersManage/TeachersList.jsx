import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTeachers, deleteTeacher } from '../../services/api';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import '../Administrators/Administrators.scss';

const TeachersList = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();
  const institutionId = localStorage.getItem('institutionId');

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const response = await fetchTeachers(institutionId);
      setTeachers(response.data);
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteTeacher(deleteId);
      setTeachers(teachers.filter(t => t.id !== deleteId));
      setShowDeleteConfirm(false);
    } catch (err) {
      alert('Failed to delete');
    }
  };


  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="admin" />
      
      <main className="dashboard-main">
        <Navbar placeholder="Search users..." />
        <div className="admins-page-container">
          <header className="page-header">
            <div className="header-left">
              <h1>Teachers</h1>
              <p>Manage teachers for your school</p>
            </div>
            <button className="add-btn" onClick={() => navigate('/admin/teachers/add')}>
              + Add Teacher
            </button>
          </header>

          <div className="table-card">
            {loading ? (
              <div className="loader">Loading...</div>
            ) : (
              <div className="table-responsive">
                <table className="admins-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Created Date</th>
                      <th>Username</th>
                      <th>Job Category</th>
                      <th>Password</th>
                      <th>Institution ID</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((teacher, index) => (
                      <tr key={teacher.id}>
                        <td>{index + 1}</td>
                        <td style={{ color: '#666' }}>{new Date(teacher.created_at).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 600 }}>{teacher.username}</td>
                        <td><span className="badge secondary">{teacher.job_category || 'N/A'}</span></td>
                        <td style={{ color: '#666', fontStyle: 'italic' }}>{teacher.password}</td>
                        <td><span className="badge">{teacher.institution_id}</span></td>
                        <td>
                          <div className="action-btns">
                            <button className="edit-btn" onClick={() => navigate(`/admin/teachers/edit/${teacher.id}`)}>Edit</button>
                            <button className="delete-btn" onClick={() => handleDeleteClick(teacher.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <ConfirmModal 
        isOpen={showDeleteConfirm}
        title="Delete Teacher"
        message="Are you sure you want to delete this teacher account?"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete"
        type="danger"
      />
    </div>

      </main>
    </div>
  );
};

export default TeachersList;

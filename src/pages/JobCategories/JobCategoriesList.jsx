import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchJobCategories, deleteJobCategory } from '../../services/api';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import '../Administrators/Administrators.scss';

const JobCategoriesList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();
  const institutionId = localStorage.getItem('institutionId');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetchJobCategories(institutionId);
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
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
      await deleteJobCategory(deleteId);
      setCategories(categories.filter(c => c.id !== deleteId));
      setShowDeleteConfirm(false);
    } catch (err) {
      alert('Failed to delete');
    }
  };


  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="admin" />
      
      <main className="dashboard-main">
        <Navbar placeholder="Search job categories..." />
        <div className="admins-page-container">
          <header className="page-header">
            <div className="header-left">
              <h1>Job Categories</h1>
              <p>Manage categories for your school</p>
            </div>
            <button className="add-btn" onClick={() => navigate('/admin/job-categories/add')}>
              + Add Category
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
                      <th>Category Name</th>
                      <th>Institution ID</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat, index) => (
                      <tr key={cat.id}>
                        <td>{index + 1}</td>
                        <td style={{ color: '#666' }}>{new Date(cat.created_at).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 600 }}>{cat.name}</td>
                        <td><span className="badge">{cat.institution_id}</span></td>
                        <td>
                          <div className="action-btns">
                            <button className="edit-btn" onClick={() => navigate(`/admin/job-categories/edit/${cat.id}`)}>Edit</button>
                             <button className="delete-btn" onClick={() => handleDeleteClick(cat.id)}>Delete</button>
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
        title="Delete Category"
        message="Are you sure you want to delete this job category?"
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

export default JobCategoriesList;

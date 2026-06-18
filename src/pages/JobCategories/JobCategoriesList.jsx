import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchJobCategories, deleteJobCategory } from '../../services/api';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './JobCategoriesList.scss';

const CategoryIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
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

const JobCategoriesList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const institutionId = localStorage.getItem('institutionId');

  useEffect(() => { loadCategories(); }, []);

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

  const handleDeleteClick = (id) => { setDeleteId(id); setShowDeleteConfirm(true); };

  const confirmDelete = async () => {
    try {
      await deleteJobCategory(deleteId);
      setCategories(categories.filter(c => c.id !== deleteId));
      setShowDeleteConfirm(false);
    } catch (err) { alert('Failed to delete'); }
  };

  const totalPages = Math.max(1, Math.ceil(categories.length / pageSize));
  const firstIndex = (currentPage - 1) * pageSize;
  const paginated = categories.slice(firstIndex, firstIndex + pageSize);

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="admin" />
      <main className="dashboard-main">
        <Navbar placeholder="Search job categories..." />
        <div className="job-categories-page">

          {/* ── Header ── */}
          <div className="category-header">
            <div className="category-header-main">
              <div className="category-header-icon"><CategoryIcon /></div>
              <div>
                <h1>Job Categories</h1>
                <p>Manage categories for your school</p>
              </div>
            </div>
            <div className="category-actions">
              <button type="button" className="primary-btn" onClick={() => navigate('/admin/job-categories/add')}>
                + Add Category
              </button>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="category-table-card">
            {loading ? (
              <div className="category-empty">Loading categories...</div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="category-table">
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
                      {paginated.map((cat, index) => (
                        <tr key={cat.id}>
                          <td className="category-no-cell">{firstIndex + index + 1}</td>
                          <td className="category-plain-cell">{new Date(cat.created_at).toLocaleDateString()}</td>
                          <td className="category-name-cell">
                            {cat.name}
                            {cat.is_default && <span className="default-tag">Default</span>}
                          </td>
                          <td><span className="pill">{cat.institution_id}</span></td>
                          <td>
                            <div className="category-actions-cell">
                              <button
                                type="button"
                                className="action-btn edit-btn"
                                onClick={() => navigate(`/admin/job-categories/edit/${cat.id}`)}
                                disabled={cat.is_default}
                                title="Edit category"
                              >
                                <EditIcon />
                              </button>
                              <button
                                type="button"
                                className="action-btn delete-btn"
                                onClick={() => handleDeleteClick(cat.id)}
                                disabled={cat.is_default}
                                title="Delete category"
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
                <div className="category-table-controls">
                  <div className="category-table-filter">
                    <label>Rows per page</label>
                    <select
                      className="category-select"
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    >
                      {[10, 20, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="category-table-pagination">
                    <span>Showing {categories.length === 0 ? 0 : firstIndex + 1}–{Math.min(categories.length, firstIndex + pageSize)} of {categories.length}</span>
                    <div className="category-pagination-buttons">
                      <button type="button" className="secondary-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
                      <button type="button" className="secondary-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <ConfirmModal isOpen={showDeleteConfirm} title="Delete Category" message="Are you sure you want to delete this job category?" onConfirm={confirmDelete} onCancel={() => setShowDeleteConfirm(false)} confirmText="Delete" type="danger" />
        </div>
      </main>
    </div>
  );
};

export default JobCategoriesList;
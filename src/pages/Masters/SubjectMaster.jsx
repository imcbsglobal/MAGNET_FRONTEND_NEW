import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { fetchSubjects, saveSubject, deleteSubject } from '../../services/api';
import '../Administrators/Administrators.scss';
import './HouseGroupMaster.scss';

const BookIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const SubjectMaster = () => {
  const institutionId = localStorage.getItem('institutionId') || '';
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentSubject, setCurrentSubject] = useState({ id: null, name: '' });
  const [saving, setSaving] = useState(false);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const res = await fetchSubjects(institutionId);
      setSubjects(res.data);
    } catch (err) {
      setError('Failed to load subjects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (institutionId) loadSubjects();
  }, [institutionId]);

  const handleSave = async (e) => {
    e.preventDefault();
    const rawName = currentSubject.name.trim();
    if (!rawName) return;
    
    const capitalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    
    setSaving(true);
    try {
      await saveSubject({
        institution_id: institutionId,
        id: currentSubject.id,
        name: capitalizedName
      });
      setShowModal(false);
      setCurrentSubject({ id: null, name: '' });
      loadSubjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save subject.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteSubject(deleteId);
      loadSubjects();
      setShowDeleteConfirm(false);
    } catch (err) {
      setError('Failed to delete subject.');
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="admin" />
      <div className="dashboard-main">
        <Navbar title="Masters" />
        
        <div className="admins-page-container house-group-page">
          <header className="page-header hgm-header">
            <div className="header-left hgm-header-main">
              <div className="hgm-header-icon"><BookIcon /></div>
              <div>
                <h1>Subjects</h1>
                <p>Manage subjects for your school</p>
              </div>
            </div>
            <div className="hgm-header-right">
              <div className="hgm-stat-chip">
                <span>Total Subjects</span>
                <strong>{subjects.length}</strong>
              </div>
              <button className="add-btn hgm-add-btn" onClick={() => { setCurrentSubject({ id: null, name: '' }); setShowModal(true); }}>
                + Add New Subject
              </button>
            </div>
          </header>

          {error && <div className="error-alert" style={{ margin: '0 0 14px' }}>{error}</div>}

          <div className="table-card hgm-table-card">
            {loading ? (
              <div className="loader hgm-loader" style={{ padding: '20px' }}>Loading subjects...</div>
            ) : (
              <div className="table-responsive">
                <table className="admins-table hgm-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Subject Name</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="hgm-empty-cell">
                          No subjects added yet.
                        </td>
                      </tr>
                    ) : (
                      subjects.map((subject, index) => (
                        <tr key={subject.id}>
                          <td className="hgm-no-cell">{index + 1}</td>
                          <td className="hgm-name-cell">{subject.name}</td>
                          <td>
                            <div className="action-btns hgm-action-btns">
                              <button className="edit-btn hgm-edit-btn" onClick={() => { setCurrentSubject(subject); setShowModal(true); }}>Edit</button>
                              <button className="delete-btn hgm-delete-btn" onClick={() => handleDeleteClick(subject.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="hgm-modal-overlay">
          <div className="hgm-modal-content">
            <h3>{currentSubject.id ? 'Edit Subject' : 'Add New Subject'}</h3>
            <form onSubmit={handleSave}>
              <div className="hgm-form-group">
                <label>Subject Name</label>
                <input 
                  type="text" 
                  value={currentSubject.name} 
                  onChange={(e) => setCurrentSubject({...currentSubject, name: e.target.value})}
                  placeholder="e.g. Mathematics"
                  autoFocus
                  required
                />
              </div>
              <div className="hgm-modal-actions">
                <button type="button" className="hgm-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="hgm-save-btn" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={showDeleteConfirm} 
        title="Delete Subject" 
        message="Are you sure you want to delete this subject?" 
        onConfirm={confirmDelete} 
        onCancel={() => setShowDeleteConfirm(false)} 
        confirmText="Delete" 
        type="danger" 
      />
    </div>
  );
};

export default SubjectMaster;

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { fetchHouseGroups, saveHouseGroup, deleteHouseGroup } from '../../services/api';
import '../Administrators/Administrators.scss';
import './HouseGroupMaster.scss';

const HouseIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const HouseGroupMaster = () => {
  const institutionId = localStorage.getItem('institutionId') || '';
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentGroup, setCurrentGroup] = useState({ id: null, name: '' });
  const [saving, setSaving] = useState(false);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const res = await fetchHouseGroups(institutionId);
      setGroups(res.data);
    } catch (err) {
      setError('Failed to load house groups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (institutionId) loadGroups();
  }, [institutionId]);

  const handleSave = async (e) => {
    e.preventDefault();
    const rawName = currentGroup.name.trim();
    if (!rawName) return;
    
    // Capitalize first letter: "green" -> "Green"
    const capitalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    
    setSaving(true);
    try {
      await saveHouseGroup({
        institution_id: institutionId,
        id: currentGroup.id,
        name: capitalizedName
      });
      setShowModal(false);
      setCurrentGroup({ id: null, name: '' });
      loadGroups();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save house group.');
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
      await deleteHouseGroup(deleteId);
      loadGroups();
      setShowDeleteConfirm(false);
    } catch (err) {
      setError('Failed to delete house group.');
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
              <div className="hgm-header-icon"><HouseIcon /></div>
              <div>
                <h1>House Groups</h1>
                <p>Manage house names for your school's ID cards</p>
              </div>
            </div>
            <div className="hgm-header-right">
              <div className="hgm-stat-chip">
                <span>Total Houses</span>
                <strong>{groups.length}</strong>
              </div>
              <button className="add-btn hgm-add-btn" onClick={() => { setCurrentGroup({ id: null, name: '' }); setShowModal(true); }}>
                + Add New House
              </button>
            </div>
          </header>

          {error && <div className="error-alert" style={{ margin: '0 0 14px' }}>{error}</div>}

          <div className="table-card hgm-table-card">
            {loading ? (
              <div className="loader hgm-loader" style={{ padding: '20px' }}>Loading house groups...</div>
            ) : (
              <div className="table-responsive">
                <table className="admins-table hgm-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>House Name</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="hgm-empty-cell">
                          No house groups added yet.
                        </td>
                      </tr>
                    ) : (
                      groups.map((group, index) => (
                        <tr key={group.id}>
                          <td className="hgm-no-cell">{index + 1}</td>
                          <td className="hgm-name-cell">{group.name}</td>
                          <td>
                            <div className="action-btns hgm-action-btns">
                              <button className="edit-btn hgm-edit-btn" onClick={() => { setCurrentGroup(group); setShowModal(true); }}>Edit</button>
                              <button className="delete-btn hgm-delete-btn" onClick={() => handleDeleteClick(group.id)}>Delete</button>
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
            <h3>{currentGroup.id ? 'Edit House' : 'Add New House'}</h3>
            <form onSubmit={handleSave}>
              <div className="hgm-form-group">
                <label>House Name</label>
                <input 
                  type="text" 
                  value={currentGroup.name} 
                  onChange={(e) => setCurrentGroup({...currentGroup, name: e.target.value})}
                  placeholder="e.g. Red House"
                  autoFocus
                  required
                />
              </div>
              <div className="hgm-modal-actions">
                <button type="button" className="hgm-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="hgm-save-btn" disabled={saving}>
                  {saving ? 'Saving...' : 'Save House'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={showDeleteConfirm} 
        title="Delete House Group" 
        message="Are you sure you want to delete this house group? This will affect any ID cards already using this house name." 
        onConfirm={confirmDelete} 
        onCancel={() => setShowDeleteConfirm(false)} 
        confirmText="Delete" 
        type="danger" 
      />
    </div>
  );
};

export default HouseGroupMaster;
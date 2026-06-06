import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { fetchHouseGroups, saveHouseGroup, deleteHouseGroup } from '../../services/api';
import '../Administrators/Administrators.scss';
import './HouseGroupMaster.scss';

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
        
        <div className="admins-page-container">
          <header className="page-header">
            <div className="header-left">
              <h1>House Groups</h1>
              <p>Manage house names for your school's ID cards</p>
            </div>
            <button className="add-btn" onClick={() => { setCurrentGroup({ id: null, name: '' }); setShowModal(true); }}>
              + Add New House
            </button>
          </header>

          {error && <div className="error-alert" style={{ margin: '0 0 14px' }}>{error}</div>}

          <div className="table-card">
            {loading ? (
              <div className="loader" style={{ padding: '20px' }}>Loading house groups...</div>
            ) : (
              <div className="table-responsive">
                <table className="admins-table">
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
                        <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: '#a3aed0' }}>
                          No house groups added yet.
                        </td>
                      </tr>
                    ) : (
                      groups.map((group, index) => (
                        <tr key={group.id}>
                          <td>{index + 1}</td>
                          <td style={{ fontWeight: 600 }}>{group.name}</td>
                          <td>
                            <div className="action-btns">
                              <button className="edit-btn" onClick={() => { setCurrentGroup(group); setShowModal(true); }}>Edit</button>
                              <button className="delete-btn" onClick={() => handleDeleteClick(group.id)}>Delete</button>
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

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { fetchTeacherHours, saveTeacherHours, deleteTeacherHours, fetchTeachers } from '../../services/api';
import '../Administrators/Administrators.scss';
import './HouseGroupMaster.scss';

const TeacherHoursMaster = () => {
  const institutionId = localStorage.getItem('institutionId') || '';
  const [hoursConfigs, setHoursConfigs] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentConfig, setCurrentConfig] = useState({ 
    id: null, 
    teacher_id: '', 
    hours_type: 'smartroom', 
    required_hours: 110
  });
  const [saving, setSaving] = useState(false);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [hoursRes, teachersRes] = await Promise.all([
        fetchTeacherHours(institutionId),
        fetchTeachers(institutionId)
      ]);
      setHoursConfigs(hoursRes.data);
      // Filter to only show teachers with job_category = "Teacher"
      console.log("Teachers from API:", teachersRes.data);
      console.log("Teachers data type:", typeof teachersRes.data);
      console.log("Is array:", Array.isArray(teachersRes.data));
      
      const teacherList = Array.isArray(teachersRes.data) ? teachersRes.data : [];
      const filteredTeachers = teacherList.filter(t => t.job_category && t.job_category.toLowerCase() === 'teacher');
      console.log("Filtered teachers:", filteredTeachers);
      setTeachers(filteredTeachers);
    } catch (err) {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (institutionId) loadData();
  }, [institutionId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentConfig.teacher_id) return;
    
    setSaving(true);
    try {
      await saveTeacherHours({
        ...currentConfig,
        institution_id: institutionId
      });
      setShowModal(false);
      setCurrentConfig({ 
        id: null, 
        teacher_id: '', 
        hours_type: 'smartroom', 
        required_hours: 110
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save hours configuration.');
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
      await deleteTeacherHours(deleteId);
      loadData();
      setShowDeleteConfirm(false);
    } catch (err) {
      setError('Failed to delete hours configuration.');
    }
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.username : 'Unknown';
  };

  const isTeacherAlreadyConfigured = (teacherId) => {
    if (!teacherId || currentConfig.id) return false;
    return hoursConfigs.some(c => c.teacher_id === teacherId);
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="admin" />
      <div className="dashboard-main">
        <Navbar title="Masters" />
        
        <div className="admins-page-container">
          <header className="page-header">
            <div className="header-left">
              <h1>Teacher Hours Master</h1>
              <p>Manage hours configuration for teacher evaluations</p>
            </div>
            <button className="add-btn" onClick={() => { 
              setCurrentConfig({ 
                id: null, 
                teacher_id: '', 
                hours_type: 'smartroom', 
                required_hours: 110
              }); 
              setShowModal(true); 
            }}>
              + Add New Configuration
            </button>
          </header>

          {error && <div className="error-alert" style={{ margin: '0 0 14px' }}>{error}</div>}

          <div className="table-card">
            {loading ? (
              <div className="loader" style={{ padding: '20px' }}>Loading...</div>
            ) : (
              <div className="table-responsive">
                <table className="admins-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Teacher</th>
                      <th>Hours Type</th>
                      <th>Required Hours</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hoursConfigs.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#a3aed0' }}>
                          No hours configurations added yet.
                        </td>
                      </tr>
                    ) : (
                      hoursConfigs.map((config, index) => (
                        <tr key={config.id}>
                          <td>{index + 1}</td>
                          <td style={{ fontWeight: 600 }}>{config.teacher_name}</td>
                          <td>{config.hours_type}</td>
                          <td>{config.required_hours}</td>
                          <td>
                            <div className="action-btns">
                              <button className="edit-btn" onClick={() => { 
                                setCurrentConfig({
                                  id: config.id,
                                  teacher_id: config.teacher_id,
                                  hours_type: config.hours_type,
                                  required_hours: config.required_hours
                                }); 
                                setShowModal(true); 
                              }}>Edit</button>
                              <button className="delete-btn" onClick={() => handleDeleteClick(config.id)}>Delete</button>
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
            <h3>{currentConfig.id ? 'Edit Configuration' : 'Add New Configuration'}</h3>
            <form onSubmit={handleSave}>
              <div className="hgm-form-group">
                <label>Teacher</label>
                <select 
                  value={currentConfig.teacher_id} 
                  onChange={(e) => setCurrentConfig({...currentConfig, teacher_id: e.target.value})}
                  disabled={!!currentConfig.id}
                  required
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(teacher => (
                    <option 
                      key={teacher.id} 
                      value={teacher.id}
                      disabled={isTeacherAlreadyConfigured(teacher.id)}
                    >
                      {teacher.username} ({teacher.staff_id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="hgm-form-group">
                <label>Hours Type</label>
                <select 
                  value={currentConfig.hours_type} 
                  onChange={(e) => setCurrentConfig({...currentConfig, hours_type: e.target.value})}
                  required
                >
                  <option value="smartroom">Smartroom</option>
                </select>
              </div>
              <div className="hgm-form-group">
                <label>Required Hours</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={currentConfig.required_hours} 
                  onChange={(e) => setCurrentConfig({...currentConfig, required_hours: parseFloat(e.target.value) || 0})}
                  placeholder="110"
                  required
                />
              </div>

              <div className="hgm-modal-actions">
                <button type="button" className="hgm-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="hgm-save-btn" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={showDeleteConfirm} 
        title="Delete Configuration" 
        message="Are you sure you want to delete this hours configuration?" 
        onConfirm={confirmDelete} 
        onCancel={() => setShowDeleteConfirm(false)} 
        confirmText="Delete" 
        type="danger" 
      />
    </div>
  );
};

export default TeacherHoursMaster;

import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { fetchTeacherHours, saveTeacherHours, deleteTeacherHours, fetchTeachers } from '../../services/api';
import './TeacherHoursMaster.scss';

const ClockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

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
      const teacherList = Array.isArray(teachersRes.data) ? teachersRes.data : [];
      const filteredTeachers = teacherList.filter(t => t.job_category && t.job_category.toLowerCase() === 'teacher');
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

  const isTeacherAlreadyConfigured = (teacherId) => {
    if (!teacherId || currentConfig.id) return false;
    return hoursConfigs.some(c => c.teacher_id === teacherId);
  };

  const openAdd = () => {
    setCurrentConfig({
      id: null,
      teacher_id: '',
      hours_type: 'smartroom',
      required_hours: 110
    });
    setShowModal(true);
  };

  const openEdit = (config) => {
    setCurrentConfig({
      id: config.id,
      teacher_id: config.teacher_id,
      hours_type: config.hours_type,
      required_hours: config.required_hours
    });
    setShowModal(true);
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="admin" />
      <main className="dashboard-main">
        <Navbar title="Masters" />

        <div className="thm-page">

          {/* ── Header ── */}
          <div className="thm-header">
            <div className="thm-header-main">
              <div className="thm-header-icon"><ClockIcon /></div>
              <div>
                <h1>Teacher Hours Master</h1>
                <p>Manage hours configuration for teacher evaluations.</p>
              </div>
            </div>
            <div className="thm-actions">
              <button type="button" className="primary-btn" onClick={openAdd}>
                + Add New Configuration
              </button>
            </div>
          </div>

          {error && <div className="thm-error">{error}</div>}

          {/* ── Table ── */}
          <div className="thm-table-card">
            {loading ? (
              <div className="thm-empty">Loading configurations...</div>
            ) : hoursConfigs.length === 0 ? (
              <div className="thm-empty">No hours configurations added yet.</div>
            ) : (
              <div className="table-responsive">
                <table className="thm-table">
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
                    {hoursConfigs.map((config, index) => (
                      <tr key={config.id}>
                        <td>{index + 1}</td>
                        <td style={{ fontWeight: 600 }}>{(config.teacher_name || '').toUpperCase()}</td>
                        <td><span className="badge badge--purple">{config.hours_type}</span></td>
                        <td><span className="badge badge--blue">{config.required_hours}</span></td>
                        <td>
                          <div className="thm-actions-cell">
                            <button
                              type="button"
                              className="action-btn edit-btn"
                              onClick={() => openEdit(config)}
                              title="Edit configuration"
                            >
                              <EditIcon />
                            </button>
                            <button
                              type="button"
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteClick(config.id)}
                              title="Delete configuration"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{currentConfig.id ? 'Edit Configuration' : 'Add New Configuration'}</h2>
                <span className="modal-sub">Teacher hours evaluation setup</span>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)} disabled={saving}>✕</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-edit-body">
                <div className="modal-edit-field">
                  <label>Teacher</label>
                  <select
                    className="modal-select"
                    value={currentConfig.teacher_id}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, teacher_id: e.target.value })}
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

                <div className="modal-edit-field">
                  <label>Hours Type</label>
                  <select
                    className="modal-select"
                    value={currentConfig.hours_type}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, hours_type: e.target.value })}
                    required
                  >
                    <option value="smartroom">Smartroom</option>
                  </select>
                </div>

                <div className="modal-edit-field">
                  <label>Required Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    value={currentConfig.required_hours}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, required_hours: parseFloat(e.target.value) || 0 })}
                    placeholder="110"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? 'Saving...' : '💾 Save'}
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
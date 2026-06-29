import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import {
  fetchMarkEntrySubjects,
  fetchMarkEntryClasses,
  fetchSubjectClassAssignments,
  saveSubjectClassAssignments,
} from '../../services/api';
import '../Administrators/Administrators.scss';
import './HouseGroupMaster.scss';

const BookIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SubjectMaster = () => {
  const institutionId = localStorage.getItem('institutionId') || '';

  const [subjects, setSubjects]         = useState([]);
  const [classes, setClasses]           = useState([]);
  const [assignments, setAssignments]   = useState({}); // { subject_code: [class, ...] }
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  // Modal state
  const [modalOpen, setModalOpen]       = useState(false);
  const [modalSubject, setModalSubject] = useState(null);   // { code, name }
  const [selected, setSelected]         = useState([]);     // classes ticked in modal
  const [saving, setSaving]             = useState(false);
  const [modalError, setModalError]     = useState('');

  // ── Load everything ────────────────────────────────────────
  const loadAll = async () => {
    try {
      setLoading(true);
      setError('');
      const [subRes, clsRes, asnRes] = await Promise.all([
        fetchMarkEntrySubjects(institutionId),
        fetchMarkEntryClasses(institutionId),
        fetchSubjectClassAssignments(institutionId),
      ]);

      setSubjects(subRes.data);
      setClasses(clsRes.data || []);

      // Build a map: { subject_code: ['1','2',...] }
      const map = {};
      (asnRes.data || []).forEach(({ subject_code, student_class }) => {
        if (!map[subject_code]) map[subject_code] = [];
        map[subject_code].push(student_class);
      });
      setAssignments(map);
    } catch (err) {
      setError('Failed to load subjects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (institutionId) loadAll();
  }, [institutionId]);

  // ── Open modal ─────────────────────────────────────────────
  const openModal = (subject) => {
    setModalSubject(subject);
    setSelected(assignments[subject.code] || []);
    setModalError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalSubject(null);
  };

  // ── Toggle a class checkbox ────────────────────────────────
  const toggleClass = (cls) => {
    setSelected(prev =>
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  // ── Save assignments ───────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setModalError('');
    try {
      await saveSubjectClassAssignments({
        institution_id: institutionId,
        subject_code:   modalSubject.code,
        classes:        selected,
      });
      // Update local map without full reload
      setAssignments(prev => ({ ...prev, [modalSubject.code]: selected }));
      closeModal();
    } catch (err) {
      setModalError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="admin" />
      <div className="dashboard-main">
        <Navbar title="Masters" />

        <div className="admins-page-container house-group-page">

          {/* ── Header ── */}
          <header className="page-header hgm-header">
            <div className="header-left hgm-header-main">
              <div className="hgm-header-icon"><BookIcon /></div>
              <div>
                <h1>Subjects</h1>
                <p>Click a subject to assign classes</p>
              </div>
            </div>
            <div className="hgm-header-right">
              <div className="hgm-stat-chip">
                <span>Total Subjects</span>
                <strong>{subjects.length}</strong>
              </div>
            </div>
          </header>

          {error && <div className="error-alert" style={{ margin: '0 0 14px' }}>{error}</div>}

          {/* ── Table ── */}
          <div className="table-card hgm-table-card">
            {loading ? (
              <div className="loader hgm-loader" style={{ padding: '20px' }}>Loading subjects...</div>
            ) : (
              <div className="table-responsive">
                <table className="admins-table hgm-table">
                  <thead>
                    <tr>
                      <th style={{ width: 50 }}>No</th>
                      <th>Subject Name</th>
                      <th>Assigned Classes</th>
                      <th style={{ width: 120, textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="hgm-empty-cell">No subjects found.</td>
                      </tr>
                    ) : (
                      subjects.map((subject, index) => {
                        const assignedClasses = assignments[subject.code] || [];
                        return (
                          <tr key={subject.code}>
                            <td className="hgm-no-cell">{index + 1}</td>
                            <td className="hgm-name-cell">{subject.name}</td>
                            <td>
                              {assignedClasses.length === 0 ? (
                                <span className="sma-unassigned">Not assigned</span>
                              ) : (
                                <div className="sma-class-tags">
                                  {assignedClasses
                                    .slice()
                                    .sort((a, b) => Number(a) - Number(b))
                                    .map(cls => (
                                      <span key={cls} className="sma-class-tag">
                                        Class {cls}
                                      </span>
                                    ))}
                                </div>
                              )}
                            </td>
                            <td>
                              <div className="hgm-action-btns">
                                <button
                                  className="hgm-edit-btn"
                                  onClick={() => openModal(subject)}
                                >
                                  Assign
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Modal ── */}
        {modalOpen && modalSubject && (
          <div className="hgm-modal-overlay" onClick={closeModal}>
            <div className="hgm-modal-content sma-modal" onClick={e => e.stopPropagation()}>

              <div className="sma-modal-header">
                <div>
                  <h3>Assign Classes</h3>
                  <p className="sma-modal-sub">{modalSubject.name}</p>
                </div>
                <button className="sma-close-btn" onClick={closeModal}><CloseIcon /></button>
              </div>

              {modalError && (
                <div className="error-alert" style={{ marginBottom: 16 }}>{modalError}</div>
              )}

              {classes.length === 0 ? (
                <p className="sma-no-classes">No classes found for this institution.</p>
              ) : (
                <div className="sma-class-grid">
                  {classes
                    .slice()
                    .sort((a, b) => Number(a) - Number(b))
                    .map(cls => {
                      const checked = selected.includes(String(cls));
                      return (
                        <label
                          key={cls}
                          className={`sma-class-checkbox ${checked ? 'checked' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleClass(String(cls))}
                          />
                          <span>Class {cls}</span>
                        </label>
                      );
                    })}
                </div>
              )}

              <div className="sma-selected-count">
                {selected.length === 0
                  ? 'No classes selected'
                  : `${selected.length} class${selected.length > 1 ? 'es' : ''} selected`}
              </div>

              <div className="hgm-modal-actions">
                <button className="hgm-cancel-btn" onClick={closeModal}>Cancel</button>
                <button className="hgm-save-btn" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectMaster;
import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchIDCardStudents, updateIDCardSubmission } from '../../services/api';
import './IDCard.scss';

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const DETAIL_LABELS = {
  student_name: 'Student Name',
  father_name:  'Father Name',
  mother_name:  'Mother Name',
  dob:          'Date of Birth',
  phone:        'Phone',
  email:        'Email',
  place:        'Place',
  district:     'District',
  city:         'City',
  state:        'State',
  pin:          'PIN Code',
};

const EDIT_FIELDS = [
  { name: 'student_name', label: 'Student Name',  type: 'text'  },
  { name: 'father_name',  label: 'Father Name',   type: 'text'  },
  { name: 'mother_name',  label: 'Mother Name',   type: 'text'  },
  { name: 'dob',          label: 'Date of Birth', type: 'date'  },
  { name: 'phone',        label: 'Phone',         type: 'tel'   },
  { name: 'email',        label: 'Email',         type: 'email' },
  { name: 'place',        label: 'Place',         type: 'text'  },
  { name: 'district',     label: 'District',      type: 'text'  },
  { name: 'city',         label: 'City',          type: 'text'  },
  { name: 'state',        label: 'State',         type: 'text'  },
  { name: 'pin',          label: 'PIN Code',      type: 'text'  },
];

const IDCardDetails = () => {
  const institutionId    = localStorage.getItem('institutionId')    || '';
  const assignedClass    = localStorage.getItem('assignedClass')    || '';
  const assignedDivision = localStorage.getItem('assignedDivision') || '';

  const [students, setStudents]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [viewStudent, setViewStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm]       = useState({});
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState('');

  const loadStudents = async () => {
    if (!institutionId) {
      setError('Institution ID is missing. Please log in again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetchIDCardStudents(institutionId, assignedClass, assignedDivision);
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load ID card student list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStudents(); }, [institutionId, assignedClass, assignedDivision]);

  const openEdit = (student) => {
    setEditStudent(student);
    setEditForm({ ...student.details });
    setSaveMsg('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!editStudent?.form_id) return;
    setSaving(true);
    setSaveMsg('');
    try {
      await updateIDCardSubmission(editStudent.form_id, editForm);
      setSaveMsg('Details updated successfully.');
      // refresh list so eye modal also reflects new data
      await loadStudents();
      // close after short delay so user sees success
      setTimeout(() => { setEditStudent(null); setSaveMsg(''); }, 1200);
    } catch (err) {
      setSaveMsg(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = students.filter((s) =>
    (s.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.admno        || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.fathername   || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.mobile       || '').includes(search)
  );

  const statusBadge = (status) => {
    if (status === 'used')    return <span className="badge badge--green">Submitted</span>;
    if (status === 'pending') return <span className="badge badge--yellow">Pending</span>;
    return <span className="badge badge--gray">Not sent</span>;
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="teacher" />
      <main className="dashboard-main">
        <Navbar />
        <div className="idcard-page">

          <div className="idcard-header">
            <div>
              <h1>ID Card Details</h1>
              <p>View and edit submitted ID card information for each student.</p>
            </div>
            <div className="idcard-actions">
              <button type="button" className="secondary-btn" onClick={loadStudents} disabled={loading}>
                Refresh List
              </button>
            </div>
          </div>

          {error && <div className="idcard-error">{error}</div>}

          <div className="idcard-search-bar">
            <input
              type="text"
              value={search}
              placeholder="Search by student, adm no, father name, or mobile"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="idcard-table-card">
            {loading ? (
              <div className="idcard-empty">Loading students...</div>
            ) : filtered.length === 0 ? (
              <div className="idcard-empty">No students found.</div>
            ) : (
              <div className="table-responsive">
                <table className="idcard-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Adm No</th>
                      <th>Student</th>
                      <th>Class</th>
                      <th>Div</th>
                      <th>Mobile</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((student, index) => (
                      <tr key={`${student.admno}-${index}`}>
                        <td>{index + 1}</td>
                        <td>{student.admno}</td>
                        <td>{student.student_name}</td>
                        <td>{student.student_class}</td>
                        <td>{student.div}</td>
                        <td>{student.mobile || '-'}</td>
                        <td>{statusBadge(student.link_status)}</td>
                        <td>
                          {student.parent_submitted && (
                            <div className="idcard-actions-cell">
                              <button
                                type="button"
                                className="action-btn eye-btn"
                                onClick={() => setViewStudent(student)}
                                title="View details"
                              >
                                <EyeIcon />
                              </button>
                              <button
                                type="button"
                                className="action-btn edit-btn"
                                onClick={() => openEdit(student)}
                                title="Edit details"
                              >
                                <EditIcon />
                              </button>
                            </div>
                          )}
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

      {/* ── View Modal ── */}
      {viewStudent && (
        <div className="modal-overlay" onClick={() => setViewStudent(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{viewStudent.student_name}</h2>
                <span className="modal-admno">{viewStudent.admno}</span>
              </div>
              <button className="modal-close" onClick={() => setViewStudent(null)}>✕</button>
            </div>
            <div className="modal-body">
              {Object.entries(DETAIL_LABELS).map(([key, label]) =>
                viewStudent.details?.[key] ? (
                  <div className="modal-row" key={key}>
                    <span className="modal-label">{label}</span>
                    <span className="modal-value">{viewStudent.details[key]}</span>
                  </div>
                ) : null
              )}
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setViewStudent(null)}>Close</button>
              <button className="primary-btn" onClick={() => { setViewStudent(null); openEdit(viewStudent); }}>
                Edit Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editStudent && (
        <div className="modal-overlay" onClick={() => !saving && setEditStudent(null)}>
          <div className="modal-card modal-card--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Edit — {editStudent.student_name}</h2>
                <span className="modal-admno">{editStudent.admno}</span>
              </div>
              <button className="modal-close" onClick={() => setEditStudent(null)} disabled={saving}>✕</button>
            </div>

            <div className="modal-edit-body">
              {saveMsg && (
                <div className={`modal-save-msg ${saveMsg.includes('success') ? 'modal-save-msg--ok' : 'modal-save-msg--err'}`}>
                  {saveMsg}
                </div>
              )}
              <div className="modal-edit-grid">
                {EDIT_FIELDS.map(({ name, label, type }) => (
                  <div className="modal-edit-field" key={name}>
                    <label htmlFor={`edit-${name}`}>{label}</label>
                    <input
                      id={`edit-${name}`}
                      type={type}
                      name={name}
                      value={editForm[name] || ''}
                      onChange={handleEditChange}
                      disabled={saving}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setEditStudent(null)} disabled={saving}>
                Cancel
              </button>
              <button className="primary-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IDCardDetails;

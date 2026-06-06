import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchIDCardStudents, fetchAdminIDCardStudents, updateIDCardSubmission, toggleIDCardForm, fetchIDCardFormStatus, uploadStudentPhoto, fetchHouseGroups } from '../../services/api';
import './IDCard.scss';

const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

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
  house_name:   'House Name',
  house_group:  'House Group',
  place:        'Place',
  city:         'City',
  pin:          'PIN Code',
};

const EDIT_FIELDS = [
  { name: 'student_name', label: 'Student Name',  type: 'text'  },
  { name: 'father_name',  label: 'Father Name',   type: 'text'  },
  { name: 'mother_name',  label: 'Mother Name',   type: 'text'  },
  { name: 'dob',          label: 'Date of Birth', type: 'date'  },
  { name: 'phone',        label: 'Phone',         type: 'tel'   },
  { name: 'email',        label: 'Email',         type: 'email' },
  { name: 'house_name',   label: 'House Name',    type: 'text'  },
  { name: 'house_group',  label: 'House Group',   type: 'select' },
  { name: 'place',        label: 'Place',         type: 'text'  },
  { name: 'city',         label: 'City',          type: 'text'  },
  { name: 'pin',          label: 'PIN Code',      type: 'text'  },
];

const IDCardDetails = () => {
  const institutionId    = localStorage.getItem('institutionId')    || '';
  const assignedClass    = localStorage.getItem('assignedClass')    || '';
  const assignedDivision = localStorage.getItem('assignedDivision') || '';
  const userType         = localStorage.getItem('userType')         || '';

  const [students, setStudents]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewStudent, setViewStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm]       = useState({});
  const [saving, setSaving]           = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saveMsg, setSaveMsg]         = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [formEnabled, setFormEnabled] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [houseGroups, setHouseGroups] = useState([]);
  const photoInputRef = React.useRef(null);

  // Determine if user is admin
  const isAdmin = userType === 'admin' || userType === 'administration';

  console.log('🔍 User Detection:', {
    userType,
    isAdmin,
    institutionId,
    assignedClass,
    assignedDivision
  });

  console.log('🔑 LocalStorage Data:', {
    token: localStorage.getItem('token') ? 'Present' : 'Missing',
    userType: localStorage.getItem('userType'),
    institutionId: localStorage.getItem('institutionId'),
    assignedClass: localStorage.getItem('assignedClass'),
    assignedDivision: localStorage.getItem('assignedDivision')
  });

  const loadStudents = async () => {
    if (!institutionId) {
      setError('Institution ID is missing. Please log in again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    
    console.log('🔍 Loading students...', { 
      institutionId, 
      isAdmin, 
      assignedClass, 
      assignedDivision,
      userType 
    });
    
    try {
      // Load house groups for the dropdown
      const hgRes = await fetchHouseGroups(institutionId);
      setHouseGroups(hgRes.data);

      // Load form status
      if (isAdmin) {
        const statusRes = await fetchIDCardFormStatus(institutionId);
        setFormEnabled(statusRes.data.enabled);
      }
      
      let res;
      console.log('🧪 Testing basic API call first...');
      
      // Test with basic teacher mode first to verify API is working
      res = await fetchIDCardStudents(institutionId, assignedClass, assignedDivision);
      console.log('✅ Basic API test successful:', res.data);
      
      if (isAdmin) {
        console.log('📋 Admin detected - fetching ALL submitted students');
        // Admin: Get ALL submitted students from all classes
        res = await fetchAdminIDCardStudents(institutionId);
        console.log('✅ Admin API response:', res.data);
      } else {
        console.log('👨‍🏫 Teacher detected - using basic API response');
        // Teacher: Already got the response above
      }
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('❌ API Error:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.message || err.message || 'Unable to load ID card student list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStudents(); }, [institutionId, assignedClass, assignedDivision, isAdmin]);

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

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editStudent) return;
    if (!file.type.startsWith('image/')) { setSaveMsg('❌ Only image files allowed.'); return; }
    if (file.size > 5 * 1024 * 1024) { setSaveMsg('❌ Photo must be under 5MB.'); return; }

    setUploadingPhoto(true);
    setSaveMsg('');
    const fd = new FormData();
    fd.append('institution_id', institutionId);
    fd.append('admno', editStudent.admno);
    fd.append('photo', file);
    try {
      await uploadStudentPhoto(fd);
      setSaveMsg('✅ Photo uploaded successfully.');
      await loadStudents();
      
      // Update local editStudent so photo reflects in modal
      let res;
      if (isAdmin) {
        res = await fetchAdminIDCardStudents(institutionId);
      } else {
        res = await fetchIDCardStudents(institutionId, assignedClass, assignedDivision);
      }
      
      const updatedList = Array.isArray(res.data) ? res.data : [];
      const updated = updatedList.find(s => s.admno === editStudent.admno);
      if (updated) setEditStudent(updated);
    } catch (err) {
      setSaveMsg('❌ ' + (err.response?.data?.message || 'Upload failed.'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleGenerateLink = () => {
    const link = `https://magnetpro.in/id-card/form/${institutionId}`;
    setGeneratedLink(link);
    setShowLinkModal(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      alert('Link copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = generatedLink;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copied to clipboard!');
    }
  };

  const handleToggleForm = async () => {
    setToggleLoading(true);
    try {
      const res = await toggleIDCardForm(institutionId, !formEnabled);
      setFormEnabled(!formEnabled);
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update form status');
    } finally {
      setToggleLoading(false);
    }
  };

  const filtered = students.filter((s) => {
    const searchMatch = (s.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.admno        || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.fathername   || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.mobile       || '').includes(search) ||
      (s.student_class || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.div          || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.details?.house_group || '').toLowerCase().includes(search.toLowerCase());

    const statusMatch = statusFilter === 'all' || 
      (statusFilter === 'submitted' && s.link_status === 'used') ||
      (statusFilter === 'pending' && s.link_status === 'pending') ||
      (statusFilter === 'not_sent' && (s.link_status === 'none' || !s.link_status));

    return searchMatch && statusMatch;
  });

  const statusBadge = (status, isAdminView) => {
    if (isAdminView) {
      // In admin view, all students shown are submitted (we filter them in backend)
      return <span className="badge badge--green">Submitted</span>;
    }
    // Regular teacher view with all statuses
    if (status === 'used')    return <span className="badge badge--green">Submitted</span>;
    if (status === 'pending') return <span className="badge badge--yellow">Pending</span>;
    return <span className="badge badge--gray">Not sent</span>;
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType={isAdmin ? "admin" : "teacher"} />
      <main className="dashboard-main">
        <Navbar />
        <div className="idcard-page">

          <div className="idcard-header">
            <div>
              <h1>ID Card Details</h1>
              <p>
                {isAdmin 
                  ? "View and edit all submitted ID card information from all classes." 
                  : "View and edit submitted ID card information for each student."}
              </p>
              {isAdmin && (
                <div className="admin-badge" style={{marginTop: '8px', padding: '4px 12px', background: '#7c3aed', color: 'white', borderRadius: '12px', fontSize: '12px', display: 'inline-block', fontWeight: '600'}}>
                  Admin View - All Classes ({students.length} submitted)
                </div>
              )}
              {isAdmin && (
                <div className={`form-status-badge ${formEnabled ? 'enabled' : 'disabled'}`} style={{
                  marginTop: '8px', 
                  marginLeft: isAdmin ? '10px' : '0',
                  padding: '4px 12px', 
                  background: formEnabled ? '#10b981' : '#ef4444', 
                  color: 'white', 
                  borderRadius: '12px', 
                  fontSize: '12px', 
                  display: 'inline-block', 
                  fontWeight: '600'
                }}>
                  Form {formEnabled ? 'Enabled' : 'Disabled'}
                </div>
              )}
            </div>
            <div className="idcard-actions">
              <button 
                type="button" 
                className="primary-btn"
                onClick={handleGenerateLink}
                style={{ marginRight: '10px' }}
              >
                🔗 Generate Form Link
              </button>
              {isAdmin && (
                <button 
                  type="button" 
                  className={formEnabled ? "secondary-btn" : "primary-btn"}
                  onClick={handleToggleForm}
                  disabled={toggleLoading}
                  style={{ marginRight: '10px' }}
                >
                  {toggleLoading ? 'Updating...' : (formEnabled ? '🚫 Disable Form' : '✅ Enable Form')}
                </button>
              )}
              <button type="button" className="secondary-btn" onClick={loadStudents} disabled={loading}>
                Refresh List
              </button>
            </div>
          </div>

          {error && <div className="idcard-error">{error}</div>}

          <div className="idcard-search-bar">
            <div className="search-input-wrapper">
              <input
                type="text"
                value={search}
                placeholder={isAdmin ? "Search by student, class, adm no, father name, or mobile" : "Search by student, adm no, father name, or mobile"}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {!isAdmin && (
              <div className="status-filter-wrapper">
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="status-select"
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="pending">Pending</option>
                  <option value="not_sent">Not sent</option>
                </select>
              </div>
            )}
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
                      <th>House Group</th>
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
                        <td>{student.details?.house_group || '-'}</td>
                        <td>{student.mobile || '-'}</td>
                        <td>{statusBadge(student.link_status, isAdmin)}</td>
                        <td>
                          {(student.parent_submitted || isAdmin) && (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="modal-edit-photo-section">
                  <div className="modal-edit-photo-container">
                    {editStudent.photo_url ? (
                      <img src={editStudent.photo_url} alt="Student" />
                    ) : (
                      <div className="photo-placeholder">🎓</div>
                    )}
                    <button 
                      type="button" 
                      className="photo-edit-btn" 
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? '...' : <CameraIcon />}
                    </button>
                    <input
                      type="file"
                      ref={photoInputRef}
                      onChange={handlePhotoChange}
                      style={{ display: 'none' }}
                      accept="image/*"
                    />
                  </div>
                </div>
                <div>
                  <h2>Edit — {editStudent.student_name}</h2>
                  <span className="modal-admno">{editStudent.admno}</span>
                </div>
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
                    {type === 'select' ? (
                      <select
                        id={`edit-${name}`}
                        name={name}
                        value={editForm[name] || ''}
                        onChange={handleEditChange}
                        disabled={saving}
                        className="modal-select"
                      >
                        <option value="">Select {label}</option>
                        {houseGroups.map((g) => (
                          <option key={g.id || g.name} value={g.name}>{g.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={`edit-${name}`}
                        type={type}
                        name={name}
                        value={editForm[name] || ''}
                        onChange={handleEditChange}
                        disabled={saving}
                      />
                    )}
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

      {/* ── Link Generation Modal ── */}
      {showLinkModal && (
        <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>ID Card Form Link Generated</h2>
                <span className="modal-admno">Institution: {institutionId}</span>
              </div>
              <button className="modal-close" onClick={() => setShowLinkModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-row">
                <span className="modal-label">Generated Link:</span>
                <div style={{ 
                  padding: '12px', 
                  background: '#f8f9fa', 
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  marginTop: '8px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  wordBreak: 'break-all',
                  color: '#495057'
                }}>
                  {generatedLink}
                </div>
              </div>
              <div style={{ marginTop: '15px', padding: '12px', background: '#e7f3ff', borderRadius: '8px', fontSize: '14px', color: '#0066cc' }}>
                <strong>📋 How to use:</strong>
                <br />• Share this link with parents to fill ID card forms
                <br />• Parents enter their phone number to find their student
                <br />• Works only for students registered in your institution
                <br />• Link is permanent and can be reused multiple times
                <br />• <strong style={{color: formEnabled ? '#10b981' : '#ef4444'}}>
                  Form Status: {formEnabled ? 'Enabled ✅' : 'Disabled ❌'}
                </strong>
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowLinkModal(false)}>Close</button>
              <button className="primary-btn" onClick={copyToClipboard}>
                📋 Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IDCardDetails;

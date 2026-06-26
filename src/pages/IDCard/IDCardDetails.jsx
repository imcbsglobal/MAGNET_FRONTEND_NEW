import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import PhotoCropEditor from '../../components/PhotoCropEditor/PhotoCropEditor';
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

const IdCardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2.5" />
    <circle cx="8.5" cy="11" r="2" />
    <path d="M5 16.5c0-1.4 1.4-2.5 3.5-2.5s3.5 1.1 3.5 2.5" />
    <path d="M14 9.5h6" />
    <path d="M14 13h6" />
    <path d="M14 16.5h4" />
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

const STATUS_FILTERS = [
  { value: 'all',       label: 'All'       },
  { value: 'submitted', label: 'Submitted' },
  { value: 'pending',   label: 'Pending'   },
  { value: 'not_sent',  label: 'Not Sent'  },
];

const IDCardDetails = () => {
  const institutionId    = localStorage.getItem('institutionId')    || '';
  const assignedClass    = localStorage.getItem('assignedClass')    || '';
  const assignedDivision = localStorage.getItem('assignedDivision') || '';
  const userType         = localStorage.getItem('userType')         || '';

  const [students, setStudents]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [search, setSearch]                 = useState('');
  const [statusFilter, setStatusFilter]     = useState('all');
  const [viewStudent, setViewStudent]       = useState(null);
  const [editStudent, setEditStudent]       = useState(null);
  const [editForm, setEditForm]             = useState({});
  const [saving, setSaving]                 = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [fetchingPhoto, setFetchingPhoto]   = useState(false);
  const [saveMsg, setSaveMsg]               = useState('');
  const [generatedLink, setGeneratedLink]   = useState('');
  const [showLinkModal, setShowLinkModal]   = useState(false);
  const [formEnabled, setFormEnabled]       = useState(true);
  const [toggleLoading, setToggleLoading]   = useState(false);
  const [houseGroups, setHouseGroups]       = useState([]);
  const [photoCropData, setPhotoCropData]   = useState({ show: false, imageData: null });
  const [photoTimestamp, setPhotoTimestamp] = useState(Date.now());

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
    // email and house_group are kept as-is (house_group value comes from the dropdown)
    const noUppercase = ['email', 'house_group'];
    const finalValue = noUppercase.includes(name) ? value : value.toUpperCase();
    setEditForm((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMsg('');

      await updateIDCardSubmission(editStudent.form_id, {
        student_name: editForm.student_name,
        father_name: editForm.father_name,
        mother_name: editForm.mother_name,
        dob: editForm.dob,
        phone: editForm.phone,
        email: editForm.email,
        house_name: editForm.house_name,
        house_group: editForm.house_group,
        place: editForm.place,
        city: editForm.city,
        pin: editForm.pin,
      });

      setSaveMsg('✅ Details updated successfully.');
      await loadStudents();
    } catch (err) {
      setSaveMsg('❌ Failed to save details.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateLink = async () => {
    try {
      // Generate a link based on institution ID
      const link = `${window.location.origin}/parent-idcard-form?inst=${institutionId}`;
      setGeneratedLink(link);
      setShowLinkModal(true);
    } catch (err) {
      console.error('Failed to generate link:', err);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    alert('Link copied to clipboard!');
  };

  const handleToggleForm = async () => {
    try {
      setToggleLoading(true);
      await toggleIDCardForm(institutionId, !formEnabled);
      setFormEnabled(!formEnabled);
    } catch (err) {
      console.error('Failed to toggle form:', err);
    } finally {
      setToggleLoading(false);
    }
  };

  // ─── Photo Crop Handlers ────────────────────────────────────────────────
  const handleCameraClick = async () => {
    if (!editStudent) return;

    if (editStudent.photo_url) {
      setFetchingPhoto(true);
      try {
        // Call local proxy directly with admno+institution so it returns the
        // full original photo (not the cropped version)
        const params = new URLSearchParams({
          institution_id: institutionId,
          admno: editStudent.admno,
          url: editStudent.photo_url,
        });
        const proxyUrl = `http://127.0.0.1:8000/api/id-card/proxy-photo/?${params}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error('proxy failed');
        const json = await res.json();
        setFetchingPhoto(false);
        setPhotoCropData({
          show: true,
          imageData: json.data_url,
          existingPhotoUrl: editStudent.photo_url,
          studentData: { ...editStudent }
        });
      } catch {
        setFetchingPhoto(false);
        // Proxy unavailable — show existing photo read-only
        setPhotoCropData({
          show: true,
          imageData: null,
          existingPhotoUrl: editStudent.photo_url,
          studentData: { ...editStudent }
        });
      }
    } else {
      setPhotoCropData({
        show: true,
        imageData: null,
        existingPhotoUrl: null,
        studentData: { ...editStudent }
      });
    }
  };

  const handleCropConfirm = async (croppedBlob, originalBlob) => {
    try {
      setUploadingPhoto(true);
      setSaveMsg('');

      const fd = new FormData();
      fd.append('institution_id', institutionId);
      fd.append('admno', editStudent.admno);

      if (originalBlob) {
        // User picked a new file:
        //   full_photo    = the complete original → stored as photo_url (for re-cropping)
        //   display_photo = the cropped circle   → stored as display_photo_url (shown on ID card)
        fd.append('full_photo', originalBlob, 'original.jpg');
        fd.append('display_photo', croppedBlob, 'display.jpg');
        // Legacy fallback for production server (old code expects 'photo' = display version)
        fd.append('photo', originalBlob, 'original.jpg');
      } else {
        // Re-crop of existing photo using proxy data URL
        fd.append('full_photo', croppedBlob, 'photo.jpg');
        fd.append('photo', croppedBlob, 'photo.jpg');
      }

      await uploadStudentPhoto(fd);
      setSaveMsg('✅ Photo updated successfully.');
      
      // Close crop editor
      setPhotoCropData({ show: false, imageData: null });
      
      // Bust browser image cache
      setPhotoTimestamp(Date.now());
      
      // Reload students
      await loadStudents();

      // Update local editStudent
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
      setSaveMsg('❌ Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCropCancel = () => {
    setPhotoCropData({ show: false, imageData: null });
  };

  const filtered = students.filter((s) => {
    const searchMatch =
      (s.student_name   || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.admno          || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.fathername     || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.mobile         || '').includes(search) ||
      (s.student_class  || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.div            || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.details?.house_group || '').toLowerCase().includes(search.toLowerCase());

    const statusMatch =
      statusFilter === 'all' ||
      (statusFilter === 'submitted' && s.link_status === 'used') ||
      (statusFilter === 'pending'   && s.link_status === 'pending') ||
      (statusFilter === 'not_sent'  && (s.link_status === 'none' || !s.link_status));

    return searchMatch && statusMatch;
  });

  const statusBadge = (status, isAdminView) => {
    if (isAdminView) {
      return <span className="badge badge--green">Submitted</span>;
    }
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

          {/* ── Header ── */}
          <div className="idcard-header">
            <div>
              <div className="idcard-header-main">
                <div className="idcard-header-icon"><IdCardIcon /></div>
                <div>
                  <h1>ID Card Details</h1>
                  <p>
                    {isAdmin
                      ? "View and edit all submitted ID card information from all classes."
                      : "View and edit submitted ID card information for each student."}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <div className="idcard-pill-row">
                  <span className="idcard-pill idcard-pill--admin">
                    Admin View · All Classes ({students.length} submitted)
                  </span>
                  <span className={`idcard-pill ${formEnabled ? 'idcard-pill--enabled' : 'idcard-pill--disabled'}`}>
                    Form {formEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              )}
            </div>
            <div className="idcard-actions">
              <button
                type="button"
                className="primary-btn"
                onClick={handleGenerateLink}
              >
                🔗 Generate Form Link
              </button>
              {isAdmin && (
                <button
                  type="button"
                  className={formEnabled ? "secondary-btn" : "primary-btn"}
                  onClick={handleToggleForm}
                  disabled={toggleLoading}
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

          {/* ── Search bar ── */}
          <div className="idcard-search-bar">
            <div className="search-input-wrapper">
              <input
                type="text"
                value={search}
                placeholder={
                  isAdmin
                    ? "Search by student, class, adm no, father name, or mobile"
                    : "Search by student, adm no, father name, or mobile"
                }
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* ── Status toggle buttons (teacher only) ── */}
            {!isAdmin && (
              <div className="status-filter-wrapper">
                {STATUS_FILTERS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`status-filter-btn${statusFilter === value ? ' status-filter-btn--active' : ''}`}
                    onClick={() => setStatusFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Table ── */}
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
                        <td data-label="No">{index + 1}</td>
                        <td data-label="Adm No">{student.admno}</td>
                        <td data-label="Student">{(student.student_name  || '').toUpperCase()}</td>
                        <td data-label="Class">{(student.student_class || '').toUpperCase()}</td>
                        <td data-label="Div">{(student.div           || '').toUpperCase()}</td>
                        <td data-label="House Group">{(student.details?.house_group || '-').toUpperCase()}</td>
                        <td data-label="Mobile">{student.mobile || '-'}</td>
                        <td data-label="Status">{statusBadge(student.link_status, isAdmin)}</td>
                        <td data-label="Actions">
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
                <h2>{(viewStudent.student_name || '').toUpperCase()}</h2>
                <span className="modal-admno">{viewStudent.admno}</span>
              </div>
              <button className="modal-close" onClick={() => setViewStudent(null)}>✕</button>
            </div>
            <div className="modal-body">
              {Object.entries(DETAIL_LABELS).map(([key, label]) =>
                viewStudent.details?.[key] ? (
                  <div className="modal-row" key={key}>
                    <span className="modal-label">{label}</span>
                    <span className="modal-value">
                      {key === 'email'
                        ? viewStudent.details[key]
                        : String(viewStudent.details[key]).toUpperCase()}
                    </span>
                  </div>
                ) : null
              )}
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setViewStudent(null)}>Close</button>
              <button
                className="primary-btn"
                onClick={() => { setViewStudent(null); openEdit(viewStudent); }}
              >
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
                      <img src={`${editStudent.photo_url}?v=${photoTimestamp}`} alt="Student" />
                    ) : (
                      <div className="photo-placeholder">🎓</div>
                    )}
                    <button
                      type="button"
                      className="photo-edit-btn"
                      onClick={handleCameraClick}
                      disabled={uploadingPhoto || fetchingPhoto}
                    >
                      {(uploadingPhoto || fetchingPhoto) ? '...' : <CameraIcon />}
                    </button>
                  </div>
                </div>
                <div>
                  <h2>Edit — {(editStudent.student_name || '').toUpperCase()}</h2>
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
                          <option key={g.id || g.name} value={g.name.toUpperCase()}>{g.name}</option>
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
              <div className="modal-row modal-row--stacked">
                <span className="modal-label">Generated Link</span>
                <div className="link-display">
                  {generatedLink}
                </div>
              </div>
              <div className="usage-info">
                <strong>📋 How to use</strong>
                <br />• Share this link with parents to fill ID card forms
                <br />• Parents enter their phone number to find their student
                <br />• Works only for students registered in your institution
                <br />• Link is permanent and can be reused multiple times
                <div className="usage-info--status">
                  <span className={`idcard-pill ${formEnabled ? 'idcard-pill--enabled' : 'idcard-pill--disabled'}`}>
                    Form Status: {formEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
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

      {/* ── Full-Screen Photo Crop Editor ── */}
      <PhotoCropEditor
        isOpen={photoCropData.show}
        imageData={photoCropData.imageData}
        existingPhotoUrl={photoCropData.existingPhotoUrl || null}
        onCropConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    </div>
  );
};

export default IDCardDetails;
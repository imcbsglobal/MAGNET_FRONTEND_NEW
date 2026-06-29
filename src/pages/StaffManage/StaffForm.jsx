import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createTeacher, fetchTeacherById, updateTeacher, fetchTeachers, fetchJobCategories, fetchClassesDivisions, fetchMarkEntrySubjects } from '../../services/api';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import './StaffForm.scss';

const StaffIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const StaffForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const institutionId = localStorage.getItem('institutionId');

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    job_category: '',
    reg_number: '',
    school_reg_number: '',
    address: '',
    pincode: '',
    nationality: '',
    assigned_class: '',
    assigned_division: '',
    additional_class_assignments: [],
    subjects: [],
    assigned_teachers: [],
  });
  const [categories, setCategories] = useState([]);
  const [classes, setClasses] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('');
  const [teachersList, setTeachersList] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    loadClassesDivisions();
    loadSubjects();
    loadTeachers();
    if (isEdit) loadStaff();
  }, [id]);

  const loadCategories = async () => {
    try {
      const res = await fetchJobCategories(institutionId);
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const loadTeachers = async () => {
    try {
      const res = await fetchTeachers(institutionId);
      const allTeachers = res.data || [];
      if (isEdit) {
        setTeachersList(allTeachers.filter(t => String(t.id) !== String(id)));
      } else {
        setTeachersList(allTeachers);
      }
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    }
  };

  // Subjects are sourced from SyncMagSubject (the `mag_subject` table),
  // synced from Sybase by MAGNET SYNC. Rows use `code` as their identifier
  // (no `id` field), so selection/storage below keys off `code`.
  const loadSubjects = async () => {
    try {
      const res = await fetchMarkEntrySubjects(institutionId);
      setSubjectsList(res.data || []);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    }
  };

  const loadClassesDivisions = async () => {
    try {
      const res = await fetchClassesDivisions(institutionId);
      setClasses(res.data.classes || []);
      setDivisions(res.data.divisions || []);
    } catch (err) {
      console.error('Failed to fetch classes/divisions:', err);
    }
  };

  const loadStaff = async () => {
    try {
      const res = await fetchTeacherById(id);
      const d = res.data;
      setFormData({
        name: d.name || '',
        username: d.username || '',
        password: d.password || '',
        job_category: d.job_category || '',
        reg_number: d.reg_number || '',
        school_reg_number: d.school_reg_number || '',
        address: d.address || '',
        pincode: d.pincode || '',
        nationality: d.nationality || '',
        assigned_class: d.assigned_class || '',
        assigned_division: d.assigned_division || '',
        additional_class_assignments: d.additional_class_assignments || [],
        subjects: d.subjects || [],
        assigned_teachers: d.assigned_teachers || [],
      });
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    if (e.target.name === 'job_category' && value !== 'HOD') {
      setFormData({ ...formData, [e.target.name]: value, assigned_teachers: [] });
    } else {
      setFormData({ ...formData, [e.target.name]: value });
    }
  };

  const handleAddTeacher = () => {
    if (!selectedTeacherId) return;
    const teacher = teachersList.find(t => String(t.id) === String(selectedTeacherId));
    if (!teacher) return;
    if (formData.assigned_teachers.some(t => String(t.id) === String(teacher.id))) return;
    setFormData({
      ...formData,
      assigned_teachers: [...formData.assigned_teachers, { id: teacher.id, name: teacher.name || teacher.username }],
    });
    setSelectedTeacherId('');
  };

  const handleRemoveTeacher = (index) => {
    setFormData({
      ...formData,
      assigned_teachers: formData.assigned_teachers.filter((_, i) => i !== index),
    });
  };

  const handleAddSubject = () => {
    if (!selectedSubjectCode) return;
    const subject = subjectsList.find(s => String(s.code) === String(selectedSubjectCode));
    if (!subject) return;
    if (formData.subjects.some(s => String(s.code) === String(subject.code))) return;
    setFormData({
      ...formData,
      subjects: [...formData.subjects, { code: subject.code, name: subject.name }],
    });
    setSelectedSubjectCode('');
  };

  const handleRemoveSubject = (index) => {
    setFormData({
      ...formData,
      subjects: formData.subjects.filter((_, i) => i !== index),
    });
  };

  const handleAddAdditionalClass = () => {
    setFormData({
      ...formData,
      additional_class_assignments: [
        ...formData.additional_class_assignments,
        { class: '', division: '' },
      ],
    });
  };

  const handleRemoveAdditionalClass = (index) => {
    setFormData({
      ...formData,
      additional_class_assignments: formData.additional_class_assignments.filter((_, i) => i !== index),
    });
  };

  const handleAdditionalClassChange = (index, field, value) => {
    const updated = [...formData.additional_class_assignments];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, additional_class_assignments: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!institutionId) {
      alert('Session error: No Institution ID found.');
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await updateTeacher(id, formData);
      } else {
        await createTeacher({ ...formData, institution_id: institutionId });
      }
      navigate('/admin/staff');
    } catch (err) {
      alert(`Failed to ${isEdit ? 'update' : 'add'} staff`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="admin" />
      <main className="dashboard-main">
        <Navbar placeholder="Search settings..." />
        <div className="staff-form-page">

          {/* ── Header ── */}
          <div className="form-header">
            <div className="form-header-main">
              <div className="form-header-icon"><StaffIcon /></div>
              <div>
                <h1>{isEdit ? 'Edit Staff' : 'Add Staff'}</h1>
                <p>{isEdit ? 'Update staff details' : 'Create a new staff account for your school'}</p>
              </div>
            </div>
            <button className="back-btn" onClick={() => navigate('/admin/staff')}>
              Back to List
            </button>
          </div>

          <div className="form-card">
            <form onSubmit={handleSubmit}>

              <div className="form-section">
                <h3>Account Details</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Job Category</label>
                    <select name="job_category" value={formData.job_category} onChange={handleChange} required>
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter staff name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Enter username"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                </div>
              </div>

              {formData.job_category === 'HOD' && (
                <div className="form-section subjects-section assigned-teachers-section">
                  <h3>Assigned Teachers</h3>
                  <p className="section-desc">Select the teachers under this HOD's supervision</p>
                  <div className="subjects-picker">
                    <div className="subjects-select-wrapper">
                      <label>Select Teachers</label>
                      <div className="picker-row">
                        <select
                          value={selectedTeacherId}
                          onChange={(e) => setSelectedTeacherId(e.target.value)}
                        >
                          <option value="">Select Teacher</option>
                          {teachersList
                            .filter(t => t.job_category === 'Teacher')
                            .map((t) => (
                              <option key={t.id} value={t.id}>{t.name || t.username}</option>
                            ))}
                        </select>
                        <button type="button" className="add-btn" onClick={handleAddTeacher}>
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="subjects-tags">
                    {formData.assigned_teachers.length === 0 ? (
                      <span className="subjects-empty">No teachers assigned yet.</span>
                    ) : (
                      formData.assigned_teachers.map((t, idx) => (
                        <span key={idx} className="subject-tag">
                          {t.name}
                          <button
                            type="button"
                            className="subject-tag-remove"
                            onClick={() => handleRemoveTeacher(idx)}
                          >
                            &times;
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="form-section">
                <div className="section-header">
                  <h3>Class Incharge</h3>
                  <button 
                    type="button" 
                    className="add-btn" 
                    onClick={handleAddAdditionalClass}
                    style={{ fontSize: '0.9rem', padding: '8px 16px' }}
                  >
                    + Add Class
                  </button>
                </div>

                {/* Primary Class & Division */}
                <div className="form-grid" style={{ marginBottom: '12px', backgroundColor: '#f0f4ff', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #3d5af1' }}>
                  <div className="form-group">
                    <label style={{ fontWeight: '700', color: '#3d5af1' }}>Primary Class</label>
                    <select name="assigned_class" value={formData.assigned_class} onChange={handleChange}>
                      <option value="">Select Class</option>
                      {classes.map((cls, i) => (
                        <option key={i} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: '700', color: '#3d5af1' }}>Primary Division</label>
                    <select name="assigned_division" value={formData.assigned_division} onChange={handleChange}>
                      <option value="">Select Division</option>
                      {divisions.map((div, i) => (
                        <option key={i} value={div}>{div}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Classes */}
                {formData.additional_class_assignments.length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px', fontWeight: '600' }}>Assigned Classes</h4>
                    {formData.additional_class_assignments.map((assignment, index) => (
                      <div key={index} className="form-grid" style={{ marginBottom: '12px' }}>
                        <div className="form-group">
                          <label>Class {index + 1}</label>
                          <select
                            value={assignment.class}
                            onChange={(e) => handleAdditionalClassChange(index, 'class', e.target.value)}
                          >
                            <option value="">Select Class</option>
                            {classes.map((cls, i) => (
                              <option key={i} value={cls}>{cls}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Division {index + 1}</label>
                          <select
                            value={assignment.division}
                            onChange={(e) => handleAdditionalClassChange(index, 'division', e.target.value)}
                          >
                            <option value="">Select Division</option>
                            {divisions.map((div, i) => (
                              <option key={i} value={div}>{div}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => handleRemoveAdditionalClass(index)}
                            style={{ padding: '10px 16px' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary of all classes */}
                {(formData.assigned_class || formData.additional_class_assignments.length > 0) && (
                  <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '6px', borderLeft: '4px solid #4caf50' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: '600', color: '#2e7d32' }}>📋 All Assigned Classes:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {formData.assigned_class && (
                        <span style={{ 
                          backgroundColor: '#4caf50', 
                          color: 'white', 
                          padding: '6px 12px', 
                          borderRadius: '4px', 
                          fontSize: '0.85rem',
                          fontWeight: '500'
                        }}>
                          {formData.assigned_class}-{formData.assigned_division || 'N/A'} (Primary)
                        </span>
                      )}
                      {formData.additional_class_assignments.map((assignment, idx) => (
                        assignment.class && (
                          <span key={idx} style={{ 
                            backgroundColor: '#2196f3', 
                            color: 'white', 
                            padding: '6px 12px', 
                            borderRadius: '4px', 
                            fontSize: '0.85rem',
                            fontWeight: '500'
                          }}>
                            {assignment.class}-{assignment.division || 'N/A'}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-section subjects-section">
                <div className="section-header">
                  <h3>Subjects</h3>
                </div>
                <div className="subjects-picker">
                  <div className="subjects-select-wrapper">
                    <label>Assign Subjects</label>
                    <div className="picker-row">
                      <select
                        value={selectedSubjectCode}
                        onChange={(e) => setSelectedSubjectCode(e.target.value)}
                      >
                        <option value="">Select Subject</option>
                        {subjectsList.map((sub) => (
                          <option key={sub.code} value={sub.code}>{sub.name}</option>
                        ))}
                      </select>
                      <button type="button" className="add-btn" onClick={handleAddSubject}>
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
                <div className="subjects-tags">
                  {formData.subjects.length === 0 ? (
                    <span className="subjects-empty">No subjects assigned yet. Select a subject and click Add.</span>
                  ) : (
                    formData.subjects.map((sub, idx) => (
                      <span key={idx} className="subject-tag">
                        {sub.name}
                        <button
                          type="button"
                          className="subject-tag-remove"
                          onClick={() => handleRemoveSubject(idx)}
                        >
                          &times;
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="form-section">
                <h3>Registration Details</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Registration Number</label>
                    <input
                      name="reg_number"
                      value={formData.reg_number}
                      onChange={handleChange}
                      placeholder="Enter registration number"
                    />
                  </div>
                  <div className="form-group">
                    <label>School Registration Number</label>
                    <input
                      name="school_reg_number"
                      value={formData.school_reg_number}
                      onChange={handleChange}
                      placeholder="Enter school registration number"
                    />
                  </div>
                  <div className="form-group">
                    <label>Nationality</label>
                    <input
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleChange}
                      placeholder="Enter nationality"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Address Details</h3>
                <div className="form-grid">
                  <div className="form-group span-2">
                    <label>Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter full address"
                    />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="Enter pincode"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Saving...' : (isEdit ? 'Update Staff' : 'Create Staff')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffForm;
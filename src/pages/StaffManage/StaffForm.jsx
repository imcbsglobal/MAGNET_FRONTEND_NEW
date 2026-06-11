import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createTeacher, fetchTeacherById, updateTeacher, fetchJobCategories, fetchClassesDivisions } from '../../services/api';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import '../Administrators/Administrators.scss';

const StaffForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const institutionId = localStorage.getItem('institutionId');

  const [formData, setFormData] = useState({
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
  });
  const [categories, setCategories] = useState([]);
  const [classes, setClasses] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    loadClassesDivisions();
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
      });
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        <div className="admin-form-container">
          <header className="page-header">
            <div className="header-left">
              <h1>{isEdit ? 'Edit Staff' : 'Add Staff'}</h1>
              <p>{isEdit ? 'Update staff details' : 'Create a new staff account for your school'}</p>
            </div>
            <button className="back-btn" onClick={() => navigate('/admin/staff')}>
              Back to List
            </button>
          </header>

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

              <div className="form-section">
                <h3>Primary Class & Division</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Class</label>
                    <select name="assigned_class" value={formData.assigned_class} onChange={handleChange}>
                      <option value="">Select Class</option>
                      {classes.map((cls, i) => (
                        <option key={i} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Division</label>
                    <select name="assigned_division" value={formData.assigned_division} onChange={handleChange}>
                      <option value="">Select Division</option>
                      {divisions.map((div, i) => (
                        <option key={i} value={div}>{div}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header">
                  <h3>Additional Class Assignments</h3>
                  <button 
                    type="button" 
                    className="add-btn" 
                    onClick={handleAddAdditionalClass}
                    style={{ fontSize: '0.9rem', padding: '8px 16px' }}
                  >
                    + Add Assignment
                  </button>
                </div>
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

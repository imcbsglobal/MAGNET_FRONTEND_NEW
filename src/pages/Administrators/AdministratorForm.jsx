import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createAdministrator, updateAdministrator, api } from '../../services/api';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import './Administrators.scss';

const AdministratorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    school_name: '',
    address: '',
    city: '',
    district: '',
    pincode: '',
    state: '',
    email: '',
    phone_number: '',
    institution_id: '',
    username: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadAdministrator();
    }
  }, [id]);

  const loadAdministrator = async () => {
    try {
      const response = await api.get(`admins/${id}/`);
      setFormData(response.data);
    } catch (err) {
      console.error('Failed to load administrator:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.username.length < 4) {
      alert('Username must be at least 4 characters long');
      return;
    }

    const passwordRegex = /^(?=.*[0-9!@#$%^&*])(?=.{4,})/;
    if (!passwordRegex.test(formData.password)) {
      alert('Password must be at least 4 characters long and contain at least one number or special character');
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await updateAdministrator(id, formData);
      } else {
        await createAdministrator(formData);
      }
      navigate('/administrators');
    } catch (err) {
      alert('Error saving administrator: ' + (err.response?.data?.message || 'Check all fields'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="superuser" />
      
      <main className="dashboard-main">
        <Navbar placeholder="Search settings..." />
        <div className="admin-form-container">
          <header className="page-header">
            <h1>{isEdit ? 'Edit Administrator' : 'Add New Administrator'}</h1>
            <button className="back-btn" onClick={() => navigate('/administrators')}>← Back to List</button>
          </header>

          <div className="form-card">
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>🏫 School Information</h3>
                <div className="form-grid">
                  <div className="form-group span-2">
                    <label>School Name</label>
                    <input name="school_name" value={formData.school_name} onChange={handleChange} required placeholder="Enter School Name" />
                  </div>
                  <div className="form-group">
                    <label>Institution ID (Unique)</label>
                    <input name="institution_id" value={formData.institution_id} onChange={handleChange} required disabled={isEdit} placeholder="Ex: MAG001" />
                  </div>
                  <div className="form-group full-width">
                    <label>Address</label>
                    <textarea name="address" value={formData.address} onChange={handleChange} required placeholder="Enter full address" />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>📍 Location & Contact</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>City</label>
                    <input name="city" value={formData.city} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>District</label>
                    <input name="district" value={formData.district} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input name="state" value={formData.state} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input name="pincode" value={formData.pincode} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input name="phone_number" value={formData.phone_number} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>🔐 Security Credentials</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Username</label>
                    <input name="username" value={formData.username} onChange={handleChange} required placeholder="Min 4 chars" />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Min 4 + Spcl Char" />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Saving...' : (isEdit ? 'Update Administrator' : 'Create Administrator')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdministratorForm;

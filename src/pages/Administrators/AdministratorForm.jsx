import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createAdministrator, updateAdministrator, api, checkLicense } from '../../services/api';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import './Administrators.scss';

const MOBILE_FEATURES = [
  { key: 'payment_gateway', label: 'Payment Gateway' },
  { key: 'mark_entry', label: 'Mark Entry' },
  { key: 'assessment', label: 'Assessment of Teacher' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'fees', label: 'Fees' },
  { key: 'id_card', label: 'ID Card' },
  { key: 'diary', label: 'Diary' },
];

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
    password: '',
    has_payment: false,
    mobile_app_enabled: false,
    mobile_app_features: [],
});

  const [loading, setLoading] = useState(false);
  const [fetchingSchool, setFetchingSchool] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadAdministrator();
    }
  }, [id]);

  const loadAdministrator = async () => {
      try {
        const response = await api.get(`admins/${id}/`);
        const data = response.data;

        setFormData({
          school_name:         data.school_name         || '',
          address:             data.address             || '',
          city:                data.city                || '',
          district:            data.district            || '',
          pincode:             data.pincode             || '',
          state:               data.state               || '',
          email:               data.email               || '',
          phone_number:        data.phone_number        || '',
          institution_id:      data.institution_id      || '',
          username:            data.username            || '',
          password:            isEdit ? '********' : (data.password || ''),
          has_payment:         data.has_payment         ?? false,
          mobile_app_enabled:  data.mobile_app_enabled  ?? false,
          mobile_app_features: data.mobile_app_features ?? [],
        });
      } catch (err) {
        console.error('Failed to load administrator:', err);
      }
  };

  const fetchSchoolName = useCallback(async (id) => {
    if (!id || id.length < 2) return;
    setFetchingSchool(true);
    try {
      const res = await checkLicense(id);
      if (res.data?.customer_name) {
        setFormData(prev => ({ ...prev, school_name: res.data.customer_name }));
      }
    } catch {
      // ignore
    } finally {
      setFetchingSchool(false);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFeatureToggle = (featureKey) => {
    setFormData(prev => {
      const features = prev.mobile_app_features;
      if (features.includes(featureKey)) {
        return { ...prev, mobile_app_features: features.filter(f => f !== featureKey) };
      }
      return { ...prev, mobile_app_features: [...features, featureKey] };
    });
  };

  const handleInstitutionIdBlur = () => {
    fetchSchoolName(formData.institution_id);
  };

  const handleInstitutionIdKeyDown = (e) => {
    if (e.key === 'Enter') {
      fetchSchoolName(formData.institution_id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.username.length < 4) {
      alert('Username must be at least 4 characters long');
      return;
    }

    if (!isEdit || formData.password !== '********') {
      const passwordRegex = /^(?=.*[0-9!@#$%^&*])(?=.{4,})/;
      if (!passwordRegex.test(formData.password)) {
        alert('Password must be at least 4 characters long and contain at least one number or special character');
        return;
      }
    }

    setLoading(true);
    try {
      if (isEdit) {
        const payload = { ...formData };
        if (payload.password === '********') {
          delete payload.password;
        }
        await updateAdministrator(id, payload);
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
                  <div className="form-group">
                    <label>Institution ID (Unique)</label>
                    <input name="institution_id" value={formData.institution_id} onChange={handleChange} onBlur={handleInstitutionIdBlur} onKeyDown={handleInstitutionIdKeyDown} required disabled={isEdit} placeholder="Ex: MAG001" />
                  </div>
                  <div className="form-group span-2">
                    <label>School Name {fetchingSchool && <span className="fetching-hint">(auto-fetching...)</span>}</label>
                    <input name="school_name" value={formData.school_name} readOnly placeholder="Auto-fetched from Institution ID" disabled={fetchingSchool} />
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

              <div className="form-section">
                <h3>💳 Payment Gateway</h3>

                <div className="payment-toggle-row">
                  <span className="toggle-label">Does this school use online payment?</span>
                  <div className="toggle-options">
                    <label className={`toggle-option ${formData.has_payment ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="has_payment"
                        checked={formData.has_payment === true}
                        onChange={() => setFormData(prev => ({ ...prev, has_payment: true }))}
                      />
                      Yes
                    </label>
                    <label className={`toggle-option ${!formData.has_payment ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="has_payment"
                        checked={formData.has_payment === false}
                        onChange={() => setFormData(prev => ({ ...prev, has_payment: false }))}
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>
              <div className="form-section">
                <h3>⚙️ Settings — Mobile App</h3>

                <div className="settings-toggle-row">
                  <span className="toggle-label">Enable Mobile App for this school?</span>
                  <div className="toggle-options">
                    <label className={`toggle-option ${formData.mobile_app_enabled ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="mobile_app_enabled"
                        checked={formData.mobile_app_enabled === true}
                        onChange={() => setFormData(prev => ({ ...prev, mobile_app_enabled: true, mobile_app_features: [] }))}
                      />
                      Yes
                    </label>
                    <label className={`toggle-option ${!formData.mobile_app_enabled ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="mobile_app_enabled"
                        checked={formData.mobile_app_enabled === false}
                        onChange={() => setFormData(prev => ({ ...prev, mobile_app_enabled: false, mobile_app_features: [] }))}
                      />
                      No
                    </label>
                  </div>
                </div>

                {formData.mobile_app_enabled && (
                  <div className="features-grid">
                    <p className="features-hint">Select the features to enable in the mobile app:</p>
                    {MOBILE_FEATURES.map(feature => (
                      <label key={feature.key} className={`feature-checkbox ${formData.mobile_app_features.includes(feature.key) ? 'checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={formData.mobile_app_features.includes(feature.key)}
                          onChange={() => handleFeatureToggle(feature.key)}
                        />
                        <span className="checkmark">
                          {formData.mobile_app_features.includes(feature.key) && (
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        <span className="feature-label">{feature.label}</span>
                      </label>
                    ))}
                  </div>
                )}
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

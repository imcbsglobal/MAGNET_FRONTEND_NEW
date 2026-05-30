import React, { useEffect, useRef, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchSchoolInfo, saveSchoolInfo } from '../../services/api';
import './SchoolInfo.scss';

const SchoolInfo = () => {
  const institutionId = localStorage.getItem('institutionId') || '';
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    school_name: '',
    address: '',
    place: '',
    pincode: '',
    phone: '',
    email: '',
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!institutionId) {
      setError('Institution ID missing. Please log in again.');
      setLoading(false);
      return;
    }
    fetchSchoolInfo(institutionId)
      .then(res => {
        const data = res.data;
        if (data && data.school_name) {
          setForm({
            school_name: data.school_name || '',
            address: data.address || '',
            place: data.place || '',
            pincode: data.pincode || '',
            phone: data.phone || '',
            email: data.email || '',
          });
          setExistingLogoUrl(data.logo_url || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [institutionId]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess('');
    setError('');
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Logo must be under 5MB.'); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.school_name.trim()) { setError('School name is required.'); return; }
    if (!form.phone.trim()) { setError('Phone number is required.'); return; }
    if (!form.email.trim()) { setError('Email is required.'); return; }

    setSaving(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('institution_id', institutionId);
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    if (logoFile) formData.append('logo', logoFile);

    try {
      const res = await saveSchoolInfo(formData);
      setExistingLogoUrl(res.data.logo_url || existingLogoUrl);
      setLogoFile(null);
      setLogoPreview(null);
      setSuccess('School information saved successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const currentLogo = logoPreview || existingLogoUrl;

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="admin" />
      <main className="dashboard-main">
        <Navbar />

        <div className="si-outer">
          {/* ── Page title strip ── */}
          <div className="si-title-bar">
            <div className="si-title-left">
              <div className="si-title-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div>
                <h1>School Information</h1>
                <p>Institution ID: <strong>{institutionId}</strong></p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="si-loading">
              <span className="si-spinner-lg" />
              <p>Loading school information...</p>
            </div>
          ) : (
            <form className="si-card" onSubmit={handleSubmit} noValidate>

              {/* ══ Logo + basic info row ══ */}
              <div className="si-top-row">

                {/* Logo */}
                <div className="si-logo-col">
                  <p className="si-section-label">School Logo</p>
                  <div
                    className={`si-logo-drop ${currentLogo ? 'has-logo' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                  >
                    {currentLogo ? (
                      <>
                        <img src={currentLogo} alt="School logo" />
                        <div className="si-logo-change-overlay">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          <span>Change</span>
                        </div>
                      </>
                    ) : (
                      <div className="si-logo-empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span>Upload Logo</span>
                        <small>PNG / JPG · Max 5MB</small>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                  {logoFile && <p className="si-file-tag">📎 {logoFile.name}</p>}
                </div>

                {/* School name + email side by side */}
                <div className="si-name-col">
                  <div className="si-field">
                    <label htmlFor="school_name">School Name <span className="req">*</span></label>
                    <input
                      id="school_name" name="school_name" type="text"
                      value={form.school_name} onChange={handleChange}
                      placeholder="e.g. St. Mary's Higher Secondary School"
                      required
                    />
                  </div>
                  <div className="si-field">
                    <label htmlFor="email">Email Address <span className="req">*</span></label>
                    <input
                      id="email" name="email" type="email"
                      value={form.email} onChange={handleChange}
                      placeholder="school@example.com"
                      required
                    />
                  </div>
                  <div className="si-field">
                    <label htmlFor="phone">Phone Number <span className="req">*</span></label>
                    <input
                      id="phone" name="phone" type="tel"
                      value={form.phone} onChange={handleChange}
                      placeholder="e.g. 0495-2701234"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* ══ Divider ══ */}
              <div className="si-divider" />

              {/* ══ Address section ══ */}
              <p className="si-section-label">Address Details</p>
              <div className="si-field">
                <label htmlFor="address">Street Address</label>
                <textarea
                  id="address" name="address"
                  value={form.address} onChange={handleChange}
                  placeholder="Building name, street, area..."
                  rows={3}
                />
              </div>

              <div className="si-row-3">
                <div className="si-field">
                  <label htmlFor="place">Place / City</label>
                  <input
                    id="place" name="place" type="text"
                    value={form.place} onChange={handleChange}
                    placeholder="e.g. Kozhikode"
                  />
                </div>
                <div className="si-field">
                  <label htmlFor="pincode">PIN Code</label>
                  <input
                    id="pincode" name="pincode" type="text"
                    value={form.pincode} onChange={handleChange}
                    placeholder="e.g. 673001"
                    maxLength={10}
                  />
                </div>
              </div>

              {/* ══ Feedback ══ */}
              {error   && <div className="si-msg si-msg-error">⚠ {error}</div>}
              {success && <div className="si-msg si-msg-ok">✓ {success}</div>}

              {/* ══ Save button ══ */}
              <div className="si-footer">
                <button type="submit" className="si-btn-save" disabled={saving}>
                  {saving ? (
                    <><span className="si-spinner" /> Saving...</>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                      Save Information
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default SchoolInfo;

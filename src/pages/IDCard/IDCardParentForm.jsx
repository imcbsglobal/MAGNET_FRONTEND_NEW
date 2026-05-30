import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchIDCardParentLink, submitIDCardParentForm } from '../../services/api';
import './IDCard.scss';

const FIELDS = [
  { name: 'student_name', label: 'Student Name', type: 'text', icon: '🎓' },
  { name: 'father_name',  label: 'Father Name',  type: 'text', icon: '👨' },
  { name: 'mother_name',  label: 'Mother Name',  type: 'text', icon: '👩' },
  { name: 'dob',          label: 'Date of Birth', type: 'date', icon: '📅' },
  { name: 'phone',        label: 'Phone Number', type: 'tel',  icon: '📞' },
  { name: 'email',        label: 'Email Address', type: 'email', icon: '✉️' },
  { name: 'place',        label: 'Place',        type: 'text', icon: '📍' },
  { name: 'district',     label: 'District',     type: 'text', icon: '🏙️' },
  { name: 'city',         label: 'City',         type: 'text', icon: '🌆' },
  { name: 'state',        label: 'State',        type: 'text', icon: '🗺️' },
  { name: 'pin',          label: 'PIN Code',     type: 'text', icon: '📮' },
];

const IDCardParentForm = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(
    Object.fromEntries(FIELDS.map((f) => [f.name, '']))
  );

  useEffect(() => {
    const loadLink = async () => {
      try {
        const res = await fetchIDCardParentLink(token);
        setForm((prev) => {
          const updated = { ...prev };
          FIELDS.forEach(({ name }) => {
            updated[name] = res.data[name] || '';
          });
          return updated;
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired link.');
      } finally {
        setLoading(false);
      }
    };
    loadLink();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await submitIDCardParentForm(token, form);
      setSuccess('Your ID card details have been saved successfully. You may close this page.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pf-wrapper">
        <div className="pf-loader">
          <div className="pf-spinner" />
          <p>Loading your form...</p>
        </div>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="pf-wrapper">
        <div className="pf-error-card">
          <div className="pf-error-icon">⚠️</div>
          <h2>Link Unavailable</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="pf-wrapper">
        <div className="pf-success-card">
          <div className="pf-success-icon">✅</div>
          <h2>Details Submitted</h2>
          <p>{success}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pf-wrapper">
      <div className="pf-card">
        {/* Header */}
        <div className="pf-header">
          <div className="pf-logo">🪪</div>
          <div>
            <h1>ID Card Information</h1>
            <p>Please fill in all fields accurately. This information will be printed on your child's ID card.</p>
          </div>
        </div>

        {error && <div className="pf-alert pf-alert--error">{error}</div>}

        <form onSubmit={handleSubmit} className="pf-form">
          {/* Student & Personal Info */}
          <div className="pf-section-title">Personal Information</div>
          <div className="pf-grid pf-grid--2">
            {FIELDS.slice(0, 4).map(({ name, label, type, icon }) => (
              <div className="pf-field" key={name}>
                <label htmlFor={name}>
                  <span className="pf-field-icon">{icon}</span>
                  {label}
                </label>
                <input
                  id={name}
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={type === 'date' ? '' : `Enter ${label.toLowerCase()}`}
                  required
                  autoComplete="off"
                />
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="pf-section-title">Contact Details</div>
          <div className="pf-grid pf-grid--2">
            {FIELDS.slice(4, 6).map(({ name, label, type, icon }) => (
              <div className="pf-field" key={name}>
                <label htmlFor={name}>
                  <span className="pf-field-icon">{icon}</span>
                  {label}
                </label>
                <input
                  id={name}
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={`Enter ${label.toLowerCase()}`}
                  required
                  autoComplete="off"
                />
              </div>
            ))}
          </div>

          {/* Address */}
          <div className="pf-section-title">Address</div>
          <div className="pf-grid pf-grid--3">
            {FIELDS.slice(6).map(({ name, label, type, icon }) => (
              <div className="pf-field" key={name}>
                <label htmlFor={name}>
                  <span className="pf-field-icon">{icon}</span>
                  {label}
                </label>
                <input
                  id={name}
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={`Enter ${label.toLowerCase()}`}
                  required
                  autoComplete="off"
                />
              </div>
            ))}
          </div>

          <button type="submit" className="pf-submit-btn" disabled={submitting}>
            {submitting ? (
              <><span className="pf-btn-spinner" /> Saving...</>
            ) : (
              'Submit ID Card Details'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default IDCardParentForm;

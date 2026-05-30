import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchIDCardParentLink, submitIDCardParentForm } from '../../services/api';
import './IDCard.scss';

const IDCardParentForm = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    student_name: '',
    place: '',
    district: '',
    city: '',
    state: '',
    pin: '',
    phone: '',
    email: '',
    father_name: '',
    mother_name: '',
    dob: '',
  });

  useEffect(() => {
    const loadLink = async () => {
      try {
        const res = await fetchIDCardParentLink(token);
        setForm({
          student_name: res.data.student_name || '',
          place: res.data.place || '',
          district: res.data.district || '',
          city: res.data.city || '',
          state: res.data.state || '',
          pin: res.data.pin || '',
          phone: res.data.phone || '',
          email: res.data.email || '',
          father_name: res.data.father_name || '',
          mother_name: res.data.mother_name || '',
          dob: res.data.dob || '',
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
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await submitIDCardParentForm(token, form);
      setSuccess('Your ID card details have been saved successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save details.');
    }
  };

  if (loading) {
    return <div className="public-form-wrapper"><div className="public-loading">Loading form...</div></div>;
  }

  if (error) {
    return <div className="public-form-wrapper"><div className="public-error">{error}</div></div>;
  }

  return (
    <div className="public-form-wrapper">
      <div className="public-form-card">
        <h1>ID Card Details</h1>
        <p>Please fill in all fields to complete your child’s ID card information.</p>
        {success && <div className="public-success">{success}</div>}
        <form onSubmit={handleSubmit} className="public-form">
          {['student_name', 'place', 'district', 'city', 'state', 'pin', 'phone', 'email', 'father_name', 'mother_name', 'dob'].map((field) => (
            <label key={field} className="public-field">
              <span>{field.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</span>
              <input
                type={field === 'dob' ? 'date' : field === 'email' ? 'email' : 'text'}
                name={field}
                value={form[field] || ''}
                onChange={handleChange}
                required
              />
            </label>
          ))}
          {error && <div className="public-error">{error}</div>}
          <button type="submit" className="primary-btn">Save Details</button>
        </form>
      </div>
    </div>
  );
};

export default IDCardParentForm;

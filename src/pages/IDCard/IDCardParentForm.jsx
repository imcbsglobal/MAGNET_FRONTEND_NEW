import React, { useState } from 'react';
import { lookupIDCardByPhone, submitIDCardByPhone } from '../../services/api';
import './IDCard.scss';
import './MobileFriendlyForm.scss';

const EMPTY_FORM = {
  student_name: '', father_name: '', mother_name: '', dob: '',
  phone: '', email: '', place: '', district: '', city: '', state: '', pin: '',
};

const FIELDS = [
  { name: 'student_name', label: 'Student Name',  type: 'text',  icon: '👤', section: 'personal', required: true },
  { name: 'father_name',  label: 'Father Name',   type: 'text',  icon: '👨', section: 'personal', required: true },
  { name: 'mother_name',  label: 'Mother Name',   type: 'text',  icon: '👩', section: 'personal', required: true },
  { name: 'dob',          label: 'Date of Birth', type: 'date',  icon: '📅', section: 'personal', required: true },
  { name: 'phone',        label: 'Phone Number',  type: 'tel',   icon: '📱', section: 'contact',  required: true },
  { name: 'email',        label: 'Email Address', type: 'email', icon: '📧', section: 'contact',  required: true },
  { name: 'place',        label: 'Place',         type: 'text',  icon: '📍', section: 'address',  required: true },
  { name: 'district',     label: 'District',      type: 'text',  icon: '🏙️', section: 'address',  required: true },
  { name: 'city',         label: 'City',          type: 'text',  icon: '🌆', section: 'address',  required: true },
  { name: 'state',        label: 'State',         type: 'text',  icon: '🗺️', section: 'address',  required: true },
  { name: 'pin',          label: 'PIN Code',      type: 'text',  icon: '📮', section: 'address',  required: true },
];

// ── Enhanced Validation with better user feedback ────────────────────────────
const VALIDATORS = {
  student_name: (v) => {
    if (!v.trim()) return 'Student name is required.';
    if (!/^[a-zA-Z\s.]+$/.test(v)) return 'Only letters, spaces, and dots allowed.';
    if (v.trim().length < 2) return 'Name must be at least 2 characters.';
    return '';
  },
  father_name: (v) => {
    if (!v.trim()) return 'Father name is required.';
    if (!/^[a-zA-Z\s.]+$/.test(v)) return 'Only letters, spaces, and dots allowed.';
    return '';
  },
  mother_name: (v) => {
    if (!v.trim()) return 'Mother name is required.';
    if (!/^[a-zA-Z\s.]+$/.test(v)) return 'Only letters, spaces, and dots allowed.';
    return '';
  },
  dob: (v) => {
    if (!v) return 'Date of birth is required.';
    const d = new Date(v);
    if (isNaN(d.getTime())) return 'Enter a valid date.';
    if (d >= new Date()) return 'Date must be in the past.';
    const age = new Date().getFullYear() - d.getFullYear();
    if (age > 25 || age < 3) return 'Please check the date of birth.';
    return '';
  },
  phone: (v) => {
    const digits = v.replace(/\D/g, '');
    if (!digits) return 'Phone number is required.';
    if (digits.length !== 10) return 'Enter a valid 10-digit number.';
    if (!digits.match(/^[6789]/)) return 'Enter a valid Indian mobile number.';
    return '';
  },
  email: (v) => {
    if (!v.trim()) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
    return '';
  },
  place: (v) => {
    if (!v.trim()) return 'Place is required.';
    if (!/^[a-zA-Z\s]+$/.test(v)) return 'Only letters and spaces allowed.';
    return '';
  },
  district: (v) => {
    if (!v.trim()) return 'District is required.';
    if (!/^[a-zA-Z\s]+$/.test(v)) return 'Only letters and spaces allowed.';
    return '';
  },
  city: (v) => {
    if (!v.trim()) return 'City is required.';
    if (!/^[a-zA-Z\s]+$/.test(v)) return 'Only letters and spaces allowed.';
    return '';
  },
  state: (v) => {
    if (!v.trim()) return 'State is required.';
    if (!/^[a-zA-Z\s]+$/.test(v)) return 'Only letters and spaces allowed.';
    return '';
  },
  pin: (v) => {
    const digits = v.replace(/\D/g, '');
    if (!digits) return 'PIN code is required.';
    if (digits.length !== 6) return 'PIN must be 6 digits.';
    return '';
  },
};

// ── Enhanced Input filters ───────────────────────────────────────────────────
const INPUT_FILTERS = {
  student_name: (v) => v.replace(/[^a-zA-Z\s.]/g, '').slice(0, 50),
  father_name:  (v) => v.replace(/[^a-zA-Z\s.]/g, '').slice(0, 50),
  mother_name:  (v) => v.replace(/[^a-zA-Z\s.]/g, '').slice(0, 50),
  phone:        (v) => v.replace(/\D/g, '').slice(0, 10),
  place:        (v) => v.replace(/[^a-zA-Z\s]/g, '').slice(0, 30),
  district:     (v) => v.replace(/[^a-zA-Z\s]/g, '').slice(0, 30),
  city:         (v) => v.replace(/[^a-zA-Z\s]/g, '').slice(0, 30),
  state:        (v) => v.replace(/[^a-zA-Z\s]/g, '').slice(0, 30),
  pin:          (v) => v.replace(/\D/g, '').slice(0, 6),
  email:        (v) => v.slice(0, 50),
};

/* ── Modern Mobile-First Header ────────────────────────────────────────────── */
const FormHeader = ({ title, subtitle, institutionInfo }) => (
  <div className="mf-header">
    <div className="mf-header-content">
      <div className="mf-logo">
        <div className="mf-logo-icon">🪪</div>
        <div className="mf-logo-text">ID Card</div>
      </div>
      <div className="mf-header-text">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {institutionInfo && (
          <div className="mf-institution-badge">
            <span className="mf-badge-icon">🏫</span>
            <span>{institutionInfo}</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

/* ── Step 1: Enhanced Phone Verification ───────────────────────────────────── */
const PhoneStep = ({ onFound, institutionId }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) { 
      setError('Please enter your phone number.'); 
      return; 
    }
    if (cleanPhone.length !== 10) { 
      setError('Please enter a valid 10-digit mobile number.'); 
      return; 
    }
    
    setLoading(true);
    try {
      const res = await lookupIDCardByPhone(cleanPhone, institutionId);
      onFound(res.data.students, cleanPhone);
    } catch (err) {
      setError(err.response?.data?.message || 'No student found with this number. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhone(value);
      setError('');
    }
  };

  return (
    <div className="mf-container">
      <div className="mf-card mf-card--narrow">
        <FormHeader 
          title="Verify Your Number" 
          subtitle="Enter your registered mobile number to get started."
        />
        
        <form onSubmit={handleSubmit} className="mf-form">
          <div className="mf-phone-section">
            <div className="mf-phone-visual">
              <div className="mf-phone-icon">📱</div>
              <h2>Mobile Verification</h2>
              <p>Enter the mobile number registered with the school</p>
            </div>
            
            <div className="mf-input-group">
              <label htmlFor="phone-input" className="mf-label">
                <span className="mf-label-icon">📱</span>
                <span>Mobile Number</span>
              </label>
              <div className="mf-phone-input-wrapper">
                <span className="mf-country-code">+91</span>
                <input
                  id="phone-input"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="Enter 10-digit number"
                  className="mf-phone-input"
                  autoFocus
                  inputMode="numeric"
                />
              </div>
              <div className="mf-input-hint">
                {phone.length > 0 && (
                  <span className={phone.length === 10 ? 'mf-hint-success' : 'mf-hint-neutral'}>
                    {phone.length}/10 digits
                  </span>
                )}
              </div>
            </div>
            
            {error && (
              <div className="mf-alert mf-alert--error">
                <span className="mf-alert-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}
            
            <button 
              type="submit" 
              className="mf-btn mf-btn--primary mf-btn--full"
              disabled={loading || phone.length !== 10}
            >
              {loading ? (
                <>
                  <span className="mf-spinner" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span>Find My Details</span>
                  <span className="mf-btn-arrow">→</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Step 2: Enhanced Student Selection ───────────────────────────────────── */
const SelectStep = ({ students, onSelect, onBack }) => (
  <div className="mf-container">
    <div className="mf-card">
      <FormHeader
        title="Select Your Child"
        subtitle={`Found ${students.length} student${students.length > 1 ? 's' : ''} linked to this number.`}
      />
      
      <div className="mf-form">
        <div className="mf-selection-grid">
          {students.map((student, index) => (
            <button
              key={student.admno}
              type="button"
              className="mf-student-card"
              onClick={() => onSelect(student)}
            >
              <div className="mf-student-avatar">
                <span>{student.student_name?.charAt(0)?.toUpperCase() || '?'}</span>
              </div>
              <div className="mf-student-info">
                <div className="mf-student-name">{student.student_name}</div>
                <div className="mf-student-details">
                  <span>Class {student.student_class}-{student.div}</span>
                  <span>•</span>
                  <span>Adm: {student.admno}</span>
                </div>
              </div>
              <div className="mf-student-status">
                {student.already_submitted ? (
                  <div className="mf-status-badge mf-status--completed">
                    <span>✓</span>
                    <span>Submitted</span>
                  </div>
                ) : (
                  <div className="mf-status-badge mf-status--pending">
                    <span>📝</span>
                    <span>Fill Form</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
        
        <button 
          type="button" 
          className="mf-btn mf-btn--ghost mf-btn--full"
          onClick={onBack}
          style={{ marginTop: '20px' }}
        >
          <span>←</span>
          <span>Try Different Number</span>
        </button>
      </div>
    </div>
  </div>
);

/* ── Step 3: Enhanced Details Form ─────────────────────────────────────────── */
const DetailsStep = ({ studentInfo, onBack }) => {
  const isEdit = studentInfo.already_submitted;
  const [form, setForm] = useState({ ...EMPTY_FORM, ...(studentInfo.existing || {}) });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeSection, setActiveSection] = useState('personal');

  const handleChange = (e) => {
    const { name, value } = e.target;
    const filtered = INPUT_FILTERS[name] ? INPUT_FILTERS[name](value) : value;
    setForm((prev) => ({ ...prev, [name]: filtered }));
    
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setError('');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (VALIDATORS[name]) {
      const err = VALIDATORS[name](value);
      setFieldErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const validateAll = () => {
    const errors = {};
    let hasError = false;
    FIELDS.forEach(({ name }) => {
      if (VALIDATORS[name]) {
        const err = VALIDATORS[name](form[name]);
        if (err) { errors[name] = err; hasError = true; }
      }
    });
    setFieldErrors(errors);
    return !hasError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateAll()) {
      setError('Please fix the errors above before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await submitIDCardByPhone({
        institution_id: studentInfo.institution_id,
        admno: studentInfo.admno,
        ...form,
      });
      setSuccess(isEdit
        ? 'Your ID card details have been updated successfully.'
        : 'Your ID card details have been saved successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="mf-container">
        <div className="mf-success-screen">
          <div className="mf-success-animation">
            <div className="mf-checkmark">✓</div>
          </div>
          <div className="mf-success-content">
            <h2>{isEdit ? 'Details Updated!' : 'Form Submitted!'}</h2>
            <p>{success}</p>
            <button 
              className="mf-btn mf-btn--primary"
              onClick={onBack}
              style={{ marginTop: '24px' }}
            >
              <span>←</span>
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sections = {
    personal: FIELDS.filter(f => f.section === 'personal'),
    contact: FIELDS.filter(f => f.section === 'contact'),
    address: FIELDS.filter(f => f.section === 'address'),
  };

  const sectionTitles = {
    personal: 'Personal Information',
    contact: 'Contact Details', 
    address: 'Address Information'
  };

  const renderField = ({ name, label, type, icon, required }) => (
    <div className={`mf-field ${fieldErrors[name] ? 'mf-field--error' : ''}`} key={name}>
      <label htmlFor={name} className="mf-field-label">
        <span className="mf-field-icon">{icon}</span>
        <span className="mf-field-text">
          {label}
          {required && <span className="mf-required">*</span>}
        </span>
      </label>
      <input
        id={name}
        type={type}
        name={name}
        value={form[name] || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={type === 'date' ? '' : `Enter ${label.toLowerCase()}`}
        className="mf-input"
        autoComplete="off"
        inputMode={name === 'phone' || name === 'pin' ? 'numeric' : undefined}
      />
      {fieldErrors[name] && (
        <div className="mf-field-error">
          <span className="mf-error-icon">⚠️</span>
          <span>{fieldErrors[name]}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="mf-container">
      <div className="mf-card mf-card--wide">
        <FormHeader
          title={isEdit ? 'Update ID Card Details' : 'ID Card Information'}
          subtitle={isEdit 
            ? 'Update your previously submitted details below.'
            : 'Please fill all fields accurately for the ID card.'}
        />

        <div className="mf-student-header">
          <div className="mf-student-avatar">
            <span>{studentInfo.student_name?.charAt(0)?.toUpperCase() || '?'}</span>
          </div>
          <div className="mf-student-details">
            <div className="mf-student-name">{studentInfo.student_name}</div>
            <div className="mf-student-meta">
              Class {studentInfo.student_class}-{studentInfo.div} • Adm: {studentInfo.admno}
            </div>
          </div>
          {isEdit && (
            <div className="mf-edit-indicator">
              <span>✏️ Editing</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mf-alert mf-alert--error">
            <span className="mf-alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mf-form">
          <div className="mf-section-tabs">
            {Object.keys(sections).map((section) => (
              <button
                key={section}
                type="button"
                className={`mf-tab ${activeSection === section ? 'mf-tab--active' : ''}`}
                onClick={() => setActiveSection(section)}
              >
                {sectionTitles[section]}
              </button>
            ))}
          </div>

          <div className="mf-section-content">
            <h3 className="mf-section-title">{sectionTitles[activeSection]}</h3>
            <div className="mf-field-grid">
              {sections[activeSection].map(renderField)}
            </div>
          </div>

          <div className="mf-form-actions">
            <button 
              type="button" 
              className="mf-btn mf-btn--ghost"
              onClick={onBack} 
              disabled={submitting}
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <button 
              type="submit" 
              className="mf-btn mf-btn--primary mf-btn--flex"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="mf-spinner" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>{isEdit ? '💾 Update Details' : '✅ Submit Form'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main ─────────────────────────────────────────────────────────────────── */
const IDCardParentForm = ({ institutionId: propInstitutionId, isClientIdForm = false }) => {
  const [step, setStep]           = useState('phone');   // phone | select | form
  const [students, setStudents]   = useState([]);
  const [selected, setSelected]   = useState(null);

  const handleFound = (studentList) => {
    // If in client ID mode, filter students by the specified institution ID
    let filteredStudents = studentList;
    if (isClientIdForm && propInstitutionId) {
      filteredStudents = studentList.filter(s => s.institution_id === propInstitutionId);
      if (filteredStudents.length === 0) {
        // If no students found for this institution, show error
        setStep('no-match');
        return;
      }
    }
    
    if (filteredStudents.length === 1) {
      setSelected(filteredStudents[0]);
      setStep('form');
    } else {
      setStudents(filteredStudents);
      setStep('select');
    }
  };

  const handleSelect = (student) => {
    setSelected(student);
    setStep('form');
  };

  // No match step for client ID form
  if (step === 'no-match') {
    return (
      <div className="mf-container">
        <div className="mf-card mf-card--narrow">
          <FormHeader title="No Match Found" subtitle="Your phone number is not registered with this institution." />
          <div className="mf-form">
            <div className="mf-alert mf-alert--error">
              <span className="mf-alert-icon">⚠️</span> 
              <div>
                <strong>No student found</strong>
                <br />
                Your phone number is not registered with institution: <strong>{propInstitutionId}</strong>
                <br />
                <small>Please contact your school administration to verify your registered phone number.</small>
              </div>
            </div>
            <button 
              type="button" 
              className="mf-btn mf-btn--ghost mf-btn--full" 
              onClick={() => setStep('phone')}
              style={{ marginTop: '20px' }}
            >
              <span>←</span>
              <span>Try Another Number</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'form' && selected) {
    return (
      <DetailsStep
        studentInfo={selected}
        onBack={() => students.length > 1 ? setStep('select') : setStep('phone')}
      />
    );
  }

  if (step === 'select') {
    return (
      <SelectStep
        students={students}
        onSelect={handleSelect}
        onBack={() => setStep('phone')}
      />
    );
  }

  return <PhoneStep onFound={handleFound} institutionId={propInstitutionId} />;
};

export default IDCardParentForm;

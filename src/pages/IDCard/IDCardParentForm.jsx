import React, { useState, useEffect } from 'react';
import { lookupIDCardByPhone, submitIDCardByPhone, fetchHouseGroups } from '../../services/api';
import './IDCard.scss';

const EMPTY_FORM = {
  student_name: '', father_name: '', mother_name: '', dob: '',
  phone: '', email: '', house_name: '', house_group: '', place: '', city: '', pin: '',
};

const FIELDS = [
  { name: 'student_name', label: 'Student Name',  type: 'text',  icon: '🎓', section: 'personal' },
  { name: 'father_name',  label: 'Father Name',   type: 'text',  icon: '👨', section: 'personal' },
  { name: 'mother_name',  label: 'Mother Name',   type: 'text',  icon: '👩', section: 'personal' },
  { name: 'dob',          label: 'Date of Birth', type: 'date',  icon: '📅', section: 'personal' },
  { name: 'phone',        label: 'Phone Number',  type: 'tel',   icon: '📞', section: 'contact'  },
  { name: 'email',        label: 'Email Address', type: 'email', icon: '✉️', section: 'contact'  },
  { name: 'house_name',   label: 'House Name',    type: 'text',  icon: '🏠', section: 'address'  },
  { name: 'house_group',  label: 'House Group',   type: 'select', icon: '🏘️', section: 'address'  },
  { name: 'place',        label: 'Place',         type: 'text',  icon: '📍', section: 'address'  },
  { name: 'city',         label: 'City',          type: 'text',  icon: '🌆', section: 'address'  },
  { name: 'pin',          label: 'PIN Code',      type: 'text',  icon: '📮', section: 'address'  },
];

// ── Validation rules per field ────────────────────────────────────────────────
const VALIDATORS = {
  student_name: (v) => {
    if (!v || !v.trim()) return 'Student name is required.';
    if (!/^[a-zA-Z\s.]+$/.test(v)) return 'Only letters and spaces allowed.';
    if (v.trim().length < 2) return 'Name is too short.';
    return '';
  },
  father_name: (v) => {
    if (!v || !v.trim()) return '';
    if (!/^[a-zA-Z\s.]+$/.test(v)) return 'Only letters and spaces allowed.';
    return '';
  },
  mother_name: (v) => {
    if (!v || !v.trim()) return '';
    if (!/^[a-zA-Z\s.]+$/.test(v)) return 'Only letters and spaces allowed.';
    return '';
  },
  dob: (v) => {
    if (!v) return '';
    const d = new Date(v);
    if (isNaN(d.getTime())) return 'Enter a valid date.';
    if (d >= new Date()) return 'Date of birth must be in the past.';
    return '';
  },
  phone: (v) => {
    const digits = v ? v.replace(/\D/g, '') : '';
    if (!digits) return 'Phone number is required.';
    if (digits.length !== 10) return 'Phone must be exactly 10 digits.';
    return '';
  },
  email: (v) => {
    if (!v || !v.trim()) return '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
    return '';
  },
  house_name: (v) => {
    if (!v || !v.trim()) return 'House name is required.';
    return '';
  },
  house_group: (v) => {
    if (!v || !v.trim()) return 'House group is required.';
    return '';
  },
  place: (v) => {
    if (!v || !v.trim()) return 'Place is required.';
    if (!/^[a-zA-Z\s]+$/.test(v)) return 'Only letters and spaces allowed.';
    return '';
  },
  city: (v) => {
    if (!v || !v.trim()) return 'City is required.';
    if (!/^[a-zA-Z\s]+$/.test(v)) return 'Only letters and spaces allowed.';
    return '';
  },
  pin: (v) => {
    const digits = v ? v.replace(/\D/g, '') : '';
    if (!digits) return 'PIN code is required.';
    if (digits.length !== 6) return 'PIN must be exactly 6 digits.';
    return '';
  },
};

// ── Input filter: block invalid keystrokes per field ─────────────────────────
const INPUT_FILTERS = {
  student_name: (v) => v.replace(/[^a-zA-Z\s.]/g, ''),
  father_name:  (v) => v.replace(/[^a-zA-Z\s.]/g, ''),
  mother_name:  (v) => v.replace(/[^a-zA-Z\s.]/g, ''),
  phone:        (v) => v.replace(/\D/g, '').slice(0, 10),
  place:        (v) => v.replace(/[^a-zA-Z\s]/g, ''),
  city:         (v) => v.replace(/[^a-zA-Z\s]/g, ''),
  pin:          (v) => v.replace(/\D/g, '').slice(0, 6),
};

/* ── Shared header ─────────────────────────────────────────────────────────── */
const FormHeader = ({ title, subtitle }) => (
  <div className="pf-header">
    <div className="pf-logo">🪪</div>
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  </div>
);

/* ── Step 1: Phone lookup ──────────────────────────────────────────────────── */
const PhoneStep = ({ onFound, institutionId }) => {
  const [phone, setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!phone.trim()) { setError('Please enter your phone number.'); return; }
    setLoading(true);
    try {
      const res = await lookupIDCardByPhone(phone.trim(), institutionId);
      onFound(res.data.students, phone.trim());
    } catch (err) {
      setError(err.response?.data?.message || 'No student found with this number. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pf-wrapper">
      <div className="pf-card pf-card--narrow">
        <FormHeader title="ID Card Portal" subtitle="Enter your registered phone number to get started." />
        <form onSubmit={handleSubmit} className="pf-form">
          <div className="pf-phone-step">
            <div className="pf-phone-icon">📱</div>
            <h2>Verify Your Number</h2>
            <p>Enter the mobile number registered with your child's school.</p>
            <div className="pf-field pf-field--full">
              <label htmlFor="phone-lookup">
                <span className="pf-field-icon">📞</span> Phone Number
              </label>
              <input
                id="phone-lookup" type="tel" value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(''); }}
                placeholder="Enter your 10-digit mobile number"
                autoFocus autoComplete="tel"
              />
            </div>
            {error && <div className="pf-alert pf-alert--error"><span>⚠️</span> {error}</div>}
            <button type="submit" className="pf-submit-btn" disabled={loading}>
              {loading ? <><span className="pf-btn-spinner" /> Searching...</> : 'Find My Details →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Step 2 (multiple): Student selection ─────────────────────────────────── */
const SelectStep = ({ students, onSelect, onBack }) => (
  <div className="pf-wrapper">
    <div className="pf-card pf-card--narrow">
      <FormHeader
        title="Select Your Child"
        subtitle="Multiple students are linked to this number. Please select the child you want to fill details for."
      />
      <div className="pf-form">
        <div className="pf-select-list">
          {students.map((s) => (
            <button
              key={s.admno}
              type="button"
              className="pf-select-card"
              onClick={() => onSelect(s)}
            >
              <div className="pf-select-avatar">
                {s.student_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="pf-select-info">
                <div className="pf-select-name">{s.student_name}</div>
                <div className="pf-select-meta">
                  Class {s.student_class} – {s.div} &nbsp;|&nbsp; Adm: {s.admno}
                </div>
              </div>
              {s.already_submitted
                ? <span className="pf-select-badge pf-select-badge--done">✓ Submitted</span>
                : <span className="pf-select-badge pf-select-badge--new">Fill Now</span>}
            </button>
          ))}
        </div>
        <button type="button" className="pf-back-btn" style={{ marginTop: 16 }} onClick={onBack}>
          ← Change Number
        </button>
      </div>
    </div>
  </div>
);

/* ── Step 3: Details form ─────────────────────────────────────────────────── */
const DetailsStep = ({ studentInfo, onBack }) => {
  const isEdit = studentInfo.already_submitted;
  
  // Initialize form with existing data OR defaults from student data
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    student_name: studentInfo.student_name || '',
    father_name: studentInfo.father_name || '',
    mother_name: studentInfo.mother_name || '',
    phone: studentInfo.mobile || studentInfo.phone || '',
    place: studentInfo.place || '',
    ...(studentInfo.existing || {})
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [houseGroups, setHouseGroups] = useState([]);

  useEffect(() => {
    const loadHouseGroups = async () => {
      try {
        const res = await fetchHouseGroups(studentInfo.institution_id);
        setHouseGroups(res.data);
      } catch (err) {
        console.error('Failed to load house groups:', err);
      }
    };
    loadHouseGroups();
  }, [studentInfo.institution_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Apply input filter (blocks invalid chars as you type)
    const filtered = INPUT_FILTERS[name] ? INPUT_FILTERS[name](value) : value;
    setForm((prev) => ({ ...prev, [name]: filtered }));
    // Clear field error on change
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
      <div className="pf-wrapper">
        <div className="pf-success-card">
          <div className="pf-success-icon">✅</div>
          <h2>{isEdit ? 'Details Updated' : 'Details Submitted'}</h2>
          <p>{success}</p>
          <button className="pf-submit-btn" style={{ marginTop: 16, width: 'auto', padding: '12px 28px' }} onClick={onBack}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  const personal = FIELDS.filter((f) => f.section === 'personal');
  const contact  = FIELDS.filter((f) => f.section === 'contact');
  const address  = FIELDS.filter((f) => f.section === 'address');

  const renderField = ({ name, label, type, icon }) => (
    <div className={`pf-field ${fieldErrors[name] ? 'pf-field--error' : ''}`} key={name}>
      <label htmlFor={name}><span className="pf-field-icon">{icon}</span>{label}</label>
      {type === 'select' ? (
        <select
          id={name} name={name} value={form[name]}
          onChange={handleChange} onBlur={handleBlur}
          className="pf-select-input"
        >
          <option value="">Select {label}</option>
          {houseGroups.map((g) => (
            <option key={g.id} value={g.name}>{g.name}</option>
          ))}
        </select>
      ) : (
        <input
          id={name} type={type} name={name} value={form[name]}
          onChange={handleChange} onBlur={handleBlur}
          placeholder={type === 'date' ? '' : `Enter ${label.toLowerCase()}`}
          autoComplete="off"
          inputMode={name === 'phone' || name === 'pin' ? 'numeric' : undefined}
        />
      )}
      {fieldErrors[name] && <span className="pf-field-err">{fieldErrors[name]}</span>}
    </div>
  );

  return (
    <div className="pf-wrapper">
      <div className="pf-card">
        <FormHeader
          title={isEdit ? 'Update ID Card Details' : 'ID Card Information'}
          subtitle={isEdit
            ? 'You have already submitted details. You can update them below.'
            : "Please fill in all fields accurately for your child's ID card."}
        />

        <div className="pf-student-banner">
          <div className="pf-student-avatar">
            {studentInfo.student_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="pf-student-name">{studentInfo.student_name}</div>
            <div className="pf-student-meta">
              Class {studentInfo.student_class} – {studentInfo.div} &nbsp;|&nbsp; Adm: {studentInfo.admno}
            </div>
          </div>
          {isEdit && <span className="pf-edit-badge">✏️ Editing</span>}
        </div>

        {error && <div className="pf-alert pf-alert--error"><span>⚠️</span> {error}</div>}

        <form onSubmit={handleSubmit} className="pf-form">
          <div className="pf-section-title">Personal Information</div>
          <div className="pf-grid pf-grid--2">{personal.map(renderField)}</div>

          <div className="pf-section-title">Contact Details</div>
          <div className="pf-grid pf-grid--2">{contact.map(renderField)}</div>

          <div className="pf-section-title">Address</div>
          <div className="pf-grid pf-grid--3">{address.map(renderField)}</div>

          <div className="pf-form-actions">
            <button type="button" className="pf-back-btn" onClick={onBack} disabled={submitting}>← Back</button>
            <button type="submit" className="pf-submit-btn" disabled={submitting}>
              {submitting
                ? <><span className="pf-btn-spinner" /> Saving...</>
                : isEdit ? '💾 Update Details' : '✅ Submit Details'}
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

  const handleFound = (studentList, searchedPhone) => {
    // If in client ID mode, filter students by the specified institution ID
    // Add searched phone to student details if not already present
    let filteredStudents = studentList.map(s => ({ ...s, phone: s.phone || searchedPhone }));
    if (isClientIdForm && propInstitutionId) {
      filteredStudents = filteredStudents.filter(s => s.institution_id === propInstitutionId);
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
      <div className="pf-wrapper">
        <div className="pf-card pf-card--narrow">
          <FormHeader title="No Match Found" subtitle="Your phone number is not registered with this institution." />
          <div className="pf-form">
            <div className="pf-alert pf-alert--error">
              <span>⚠️</span> 
              No student found for this phone number in the institution: <strong>{propInstitutionId}</strong>
              <br />
              Please contact your school administration to verify your registered phone number.
            </div>
            <button type="button" className="pf-back-btn" style={{ marginTop: 16 }} onClick={() => setStep('phone')}>
              ← Try Another Number
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

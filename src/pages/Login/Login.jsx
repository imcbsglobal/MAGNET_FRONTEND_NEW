import React, { useState, useEffect } from 'react';
import { administratorLogin, teacherLogin, parentLogin } from '../../services/api';
import loginImage from '../../assets/loginpage.png';
import './Login.scss';

const Login = () => {
  const [role, setRole] = useState('parent'); // 'parent', 'staff', or 'admin'
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  const [formData, setFormData] = useState({
    institutionId: '',
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    if (!token || !userType) return;

    const dashboardMap = {
      superuser: '/superuser-dashboard',
      admin: '/admin-dashboard',
      staff: localStorage.getItem('jobCategory') === 'Teacher' ? '/teacher/evaluation' : localStorage.getItem('jobCategory') === 'HOD' ? '/hod/evaluation' : '/staff-dashboard',
      parent: '/parent-dashboard',
    };
    window.location.replace(dashboardMap[userType] || '/');
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSuccess = (userType, data, targetPath) => {
    setIsSuccess(true);
    localStorage.setItem('userType', userType);
    if (userType === 'superuser') {
      localStorage.setItem('token', data.access);
      localStorage.setItem('refreshToken', data.refresh);
    } else if (userType === 'admin') {
      localStorage.setItem('schoolName', data.school_name);
      localStorage.setItem('institutionId', formData.institutionId);
      localStorage.setItem('token', data.access);
      localStorage.setItem('refreshToken', data.refresh);
    } else if (userType === 'staff') {
      localStorage.setItem('userId', data.id);
      localStorage.setItem('institutionId', data.institution_id);
      localStorage.setItem('username', data.username);
      localStorage.setItem('assignedClass', data.assigned_class || '');
      localStorage.setItem('assignedDivision', data.assigned_division || '');
      localStorage.setItem('jobCategory', data.job_category || '');
      localStorage.setItem('token', data.access);
      localStorage.setItem('refreshToken', data.refresh);

      // Navigate to appropriate dashboard based on job category
      if (data.job_category === 'Teacher') {
        targetPath = '/staff-dashboard';
      } else if (data.job_category === 'HOD') {
        targetPath = '/staff-dashboard';
      }
    } else if (userType === 'parent') {
      localStorage.setItem('userId', data.id);
      localStorage.setItem('institutionId', data.institution_id);
      localStorage.setItem('admno', data.admno);
      localStorage.setItem('studentName', data.student_name);
      localStorage.setItem('token', data.access);
      localStorage.setItem('refreshToken', data.refresh);
    }

    setTimeout(() => {
      window.location.replace(targetPath);
    }, 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || isSuccess) return;

    setError('');
    setIsLoading(true);

    try {
      let response;
      if (role === 'admin') {
        response = await administratorLogin({
          institution_id: formData.institutionId,
          username: formData.username,
          password: formData.password
        });
        if (response.data.status) {
          handleSuccess('admin', response.data, '/admin-dashboard');
        }
      } else if (role === 'staff') {
        response = await teacherLogin({
          institution_id: formData.institutionId,
          username: formData.username,
          password: formData.password
        });
        if (response.data.status) {
          handleSuccess('staff', response.data, '/staff-dashboard');
        }
      } else if (role === 'parent') {
        response = await parentLogin({
          institution_id: formData.institutionId,
          admno: formData.username,
          password: formData.password
        });
        if (response.data.status) {
          handleSuccess('parent', response.data, '/parent-dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      triggerShake();
    } finally {
      if (!isSuccess) {
        setIsLoading(false);
      }
    }
  };

  // Purely cosmetic helper for the dynamic subtitle/button label — does not change submit logic
  const roleLabel = role === 'admin' ? 'ADMINISTRATOR' : (role === 'staff' ? 'STAFF' : 'PARENT');

  return (
    <div className="login-page-wrapper">

      {isSuccess && (
        <div className="login-success-overlay">
          <div className="login-success-box">
            <div className="login-success-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Login Successful!</h3>
            <p>Redirecting to your dashboard...</p>
          </div>
        </div>
      )}

      <div className="login-container-inner">
        <div className="login-left-section">
          <img src={loginImage} alt="" className="hero-image" />
        </div>

        <div className="login-right-section">
          <div className={`login-card ${shake ? 'shake-animation' : ''} ${isSuccess ? 'success-state' : ''}`}>
            {error && <div className="error-message">{error}</div>}

            <>
              <div className="form-header">
                <h2>Sign In</h2>
                <p>Access your {roleLabel.toLowerCase()} dashboard</p>
              </div>

              <div className="role-toggle">
                <button
                  className={role === 'parent' ? 'active' : ''}
                  onClick={() => setRole('parent')}
                >
                  PARENT
                </button>
                <button
                  className={role === 'staff' ? 'active' : ''}
                  onClick={() => setRole('staff')}
                >
                  STAFF
                </button>
                <button
                  className={role === 'admin' ? 'active' : ''}
                  onClick={() => setRole('admin')}
                >
                  ADMINISTRATOR
                </button>
              </div>
            </>
            <form onSubmit={handleSubmit} className="login-form">
              <div className="input-group">
                <label htmlFor="institutionId">Institution ID</label>
                <input
                  type="text"
                  id="institutionId"
                  name="institutionId"
                  value={formData.institutionId}
                  onChange={handleChange}
                  placeholder="Enter your institution ID"
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="username">{role === 'parent' ? 'Admission ID' : 'Username'}</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder={role === 'parent' ? 'Enter admission ID' : 'Enter your username'}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div className="password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-button"
                    onClick={togglePasswordVisibility}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 1l22 22" />
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-7-11-7a19.95 19.95 0 0 1 5.06-5.94" />
                        <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <a href="#forgot" className="forgot-link">Forgot password?</a>
              </div>
              <button
                type="submit"
                className={`login-button ${isLoading ? 'loading' : ''} ${isSuccess ? 'success' : ''}`}
                disabled={isLoading || isSuccess}
              >
                {isSuccess ? (
                  "SUCCESS"
                ) : isLoading ? (
                  <span className="loader"></span>
                ) : (
                  <>
                    <svg className="button-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14" />
                      <path d="M13 5l7 7-7 7" />
                    </svg>
                    <span>{`${roleLabel} LOGIN`}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
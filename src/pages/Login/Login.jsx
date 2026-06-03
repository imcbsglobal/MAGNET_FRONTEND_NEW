import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { superadminLogin, administratorLogin, teacherLogin, parentLogin } from '../../services/api';
import logo from '../../assets/logo.png';
import './Login.scss';

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('parent'); // 'parent', 'staff', 'admin', or 'superadmin'
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
      localStorage.setItem('token', data.access);
      localStorage.setItem('refreshToken', data.refresh);
    } else if (userType === 'parent') {
      localStorage.setItem('userId', data.id);
      localStorage.setItem('institutionId', data.institution_id);
      localStorage.setItem('admno', data.admno);
      localStorage.setItem('studentName', data.student_name);
      localStorage.setItem('token', data.access);
      localStorage.setItem('refreshToken', data.refresh);
    }
    
    setTimeout(() => {
      navigate(targetPath);
    }, 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || isSuccess) return;
    
    setError('');
    setIsLoading(true);
    
    try {
      let response;
      if (role === 'superadmin') {
        response = await superadminLogin({
          username: formData.username,
          password: formData.password
        });
        if (response.data.status) {
          handleSuccess('superuser', response.data, '/superuser-dashboard');
        }
      } else if (role === 'admin') {
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


  return (
    <div className="login-page-wrapper">

      {isSuccess && (
        <div className="login-success-overlay">
          <div className="login-success-box">
            <div className="login-success-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Login Successful!</h3>
            <p>Redirecting to your dashboard...</p>
          </div>
        </div>
      )}

      <div className="login-container-inner">
        <div className="login-left-section">
          <div className="logo-container">
            <div className="logo-ring">
              <div className="logo-ring-inner">
                <div className="demo-logo">
                  <img src={logo} alt="School Logo" />
                </div>
              </div>
            </div>
            <h1 className="brand-name">
              {'MAGNET SCHOOL'.split('').map((char, i) => (
                <span key={i} className="flash-letter" style={{ '--i': i }}>
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </h1>
            <p className="brand-tagline">Welcome to the School Management Portal</p>
            <div className="brand-dots">
              <span /><span /><span />
            </div>
          </div>
        </div>
        
        <div className="login-right-section">
          <div className={`login-card ${shake ? 'shake-animation' : ''} ${isSuccess ? 'success-state' : ''} ${role === 'superadmin' ? 'superadmin-mode' : ''}`}>
            {error && <div className="error-message">{error}</div>}





            {role === 'superadmin' ? (
              <div className="superadmin-header">
                <div className="security-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <h2 className="header-title">SUPERADMIN</h2>
                <p className="header-subtitle">Secure Authentication Portal</p>
              </div>
            ) : (
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
            )}
            <form onSubmit={handleSubmit} className="login-form">
              {role !== 'superadmin' && (
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
              )}
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
                  `${role === 'admin' ? 'ADMINISTRATOR' : (role === 'staff' ? 'STAFF' : (role === 'parent' ? 'PARENT' : role.toUpperCase())) } LOGIN`
                )}
              </button>
            </form>
            <div className="login-footer">
              <button 
                type="button"
                className={`superadmin-toggle ${role === 'superadmin' ? 'active' : ''}`}
                onClick={() => setRole(role === 'superadmin' ? 'staff' : 'superadmin')}
              >
                {role === 'superadmin' ? (
                  <><svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>Staff Login</>
                ) : (
                  <><svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>Superadmin Access</>
                )}
              </button>
              <a href="#forgot">Forgot password?</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

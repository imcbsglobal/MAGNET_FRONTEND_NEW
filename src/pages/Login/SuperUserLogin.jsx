import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { superadminLogin } from '../../services/api';
import loginImage from '../../assets/loginpage.png';
import './SuperUserLogin.scss';

const SuperUserLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || isSuccess) return;
    setError('');
    setIsLoading(true);

    try {
      const response = await superadminLogin({
        username: formData.username,
        password: formData.password
      });

      if (response.data.status) {
        setIsSuccess(true);
        localStorage.setItem('userType', 'superuser');
        localStorage.setItem('token', response.data.access);
        localStorage.setItem('refreshToken', response.data.refresh);

        setTimeout(() => {
          window.location.replace('/superuser-dashboard');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      triggerShake();
    } finally {
      if (!isSuccess) setIsLoading(false);
    }
  };

  return (
    <div className="suser-page-wrapper">
      {isSuccess && (
        <div className="suser-success-overlay">
          <div className="suser-success-box">
            <div className="suser-success-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Welcome back, Superadmin!</h3>
            <p>Redirecting to your dashboard...</p>
          </div>
        </div>
      )}

      <div className="suser-container">
        <div className="suser-left">
          <img src={loginImage} alt="" className="suser-hero" />
        </div>

        <div className="suser-right">
          <div className={`suser-card ${shake ? 'suser-shake' : ''} ${isSuccess ? 'suser-success' : ''}`}>
            {error && <div className="suser-error">{error}</div>}

            <div className="suser-header">
              <div className="suser-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <h2 className="suser-title">SUPERADMIN</h2>
              <p className="suser-subtitle">Secure Authentication Portal</p>
            </div>

            <form onSubmit={handleSubmit} className="suser-form">
              <div className="suser-field">
                <label htmlFor="suser-username">Username</label>
                <input
                  type="text"
                  id="suser-username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter superadmin username"
                  required
                />
              </div>

              <div className="suser-field">
                <label htmlFor="suser-password">Password</label>
                <div className="suser-password-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="suser-password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="suser-password-toggle"
                    onClick={() => setShowPassword(prev => !prev)}
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
                className={`suser-login-btn ${isLoading ? 'suser-loading' : ''} ${isSuccess ? 'suser-done' : ''}`}
                disabled={isLoading || isSuccess}
              >
                {isSuccess ? (
                  'SUCCESS'
                ) : isLoading ? (
                  <span className="suser-loader"></span>
                ) : (
                  <>
                    <svg className="suser-btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="M13 5l7 7-7 7" />
                    </svg>
                    <span>AUTHENTICATE</span>
                  </>
                )}
              </button>
            </form>

            <div className="suser-footer">
              <button
                type="button"
                className="suser-back-link"
                onClick={() => navigate('/login')}
              >
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
                Back to main login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperUserLogin;

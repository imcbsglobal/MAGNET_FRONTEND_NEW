import React from 'react';
import './PaymentFailure.scss';

const PaymentFailure = ({ errorMessage, onRetry, onClose }) => {
  return (
    <div className="payment-failure-overlay">
      <div className="payment-failure-modal">
        <div className="failure-icon">
          <div className="error-mark">✕</div>
        </div>
        
        <h2>Uh! oh!</h2>
        <h3>Something went wrong</h3>
        <p>We appreciate your patience! While we fix this, continue browsing on localhost</p>
        
        <div className="error-details">
          <div className="error-box">
            <div className="error-header">
              <span className="error-source">localhost:5173 says</span>
            </div>
            <div className="error-content">
              <p>Oops! Something went wrong.</p>
              <p>{errorMessage || 'Payment Failed'}</p>
            </div>
          </div>
        </div>
        
        <div className="failure-actions">
          <button className="retry-btn" onClick={onRetry}>
            🔄 Try Again
          </button>
          <button className="close-btn" onClick={onClose}>
            OK
          </button>
        </div>
        
        <div className="razorpay-branding">
          <div className="razorpay-logo">
            <div className="logo-icon">⚡</div>
            <span>Razorpay</span>
          </div>
          <p>Secured by Razorpay</p>
        </div>
        
        <div className="demo-note">
          <p>🔒 This is a demo payment failure screen. No actual transaction was attempted.</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
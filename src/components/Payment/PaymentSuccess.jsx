import React from 'react';
import './PaymentSuccess.scss';

const PaymentSuccess = ({ paymentData, onClose }) => {
  return (
    <div className="payment-success-overlay">
      <div className="payment-success-modal">
        <div className="success-icon">
          <div className="checkmark">✓</div>
        </div>
        
        <h2>Payment Successful!</h2>
        <p>Your fee payment has been processed successfully.</p>
        
        <div className="payment-details">
          <div className="detail-row">
            <span>Payment ID:</span>
            <span>{paymentData.payment_id}</span>
          </div>
          <div className="detail-row">
            <span>Amount Paid:</span>
            <span>₹{paymentData.amount.toFixed(2)}</span>
          </div>
          <div className="detail-row">
            <span>Date & Time:</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
          <div className="detail-row">
            <span>Status:</span>
            <span className="status-success">Completed</span>
          </div>
        </div>
        
        <div className="success-actions">
          <button className="download-receipt-btn">
            📄 Download Receipt
          </button>
          <button className="close-btn" onClick={onClose}>
            Continue
          </button>
        </div>
        
        <div className="demo-note">
          <p>🎉 This is a demo payment. No actual money was charged.</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
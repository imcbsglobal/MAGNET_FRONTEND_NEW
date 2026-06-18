import React, { useState } from 'react';
import PaymentSuccess from './PaymentSuccess';
import PaymentFailure from './PaymentFailure';
import './RazorpayPayment.scss';
import './PaymentSuccess.scss';
import './PaymentFailure.scss';

const RazorpayPayment = ({ 
  amount, 
  description, 
  studentName, 
  institutionId, 
  admno, 
  feeItems = [], 
  onSuccess, 
  onError,
  onClose 
}) => {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      // Demo Razorpay configuration
      const options = {
        key: 'rzp_test_1DP5mmOlF5G5ag', // Demo key - replace with actual key
        amount: Math.round(amount * 100), // Amount in paise
        currency: 'INR',
        name: 'MAGNET School',
        description: description,
        image: '/logo.png', // School logo
        order_id: `order_${Date.now()}`, // Demo order ID
        handler: function (response) {
          // Payment success callback
          console.log('Payment Success:', response);
          const successData = {
            payment_id: response.razorpay_payment_id,
            order_id: response.razorpay_order_id,
            signature: response.razorpay_signature,
            amount: amount,
            feeItems: feeItems
          };
          setPaymentResult(successData);
          setShowSuccess(true);
          setLoading(false);
        },
        prefill: {
          name: studentName,
          email: 'parent@example.com', // Can be fetched from student data
          contact: '9999999999' // Can be fetched from student data
        },
        notes: {
          institution_id: institutionId,
          admission_number: admno,
          student_name: studentName,
          fee_type: feeItems.length > 1 ? 'bulk_payment' : 'individual_payment'
        },
        theme: {
          color: '#4f6ef7'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            onClose && onClose();
          },
          onhidden: function() {
            setLoading(false);
          }
        }
      };

      // Add error handling for payment failures
      options.modal.escape = false;
      options.modal.backdrop = true;

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const rzp = new window.Razorpay({
            ...options,
            // Add payment failure handler
            modal: {
              ...options.modal,
              confirm_close: true,
              ondismiss: function() {
                setLoading(false);
                // Show failure screen for dismissal
                setErrorMessage('Payment was cancelled by user');
                setShowFailure(true);
              }
            }
          });
          
          // Override the error handler
          rzp.on('payment.failed', function (response) {
            console.log('Payment Failed:', response.error);
            setLoading(false);
            setErrorMessage(response.error.description || 'Payment failed due to technical error');
            setShowFailure(true);
          });
          
          rzp.open();
        };
        script.onerror = () => {
          setLoading(false);
          setErrorMessage('Failed to load payment gateway');
          setShowFailure(true);
        };
        document.body.appendChild(script);
      } else {
        const rzp = new window.Razorpay({
          ...options,
          // Add payment failure handler
          modal: {
            ...options.modal,
            confirm_close: true,
            ondismiss: function() {
              setLoading(false);
              // Show failure screen for dismissal
              setErrorMessage('Payment was cancelled by user');
              setShowFailure(true);
            }
          }
        });
        
        // Override the error handler
        rzp.on('payment.failed', function (response) {
          console.log('Payment Failed:', response.error);
          setLoading(false);
          setErrorMessage(response.error.description || 'Payment failed due to technical error');
          setShowFailure(true);
        });
        
        rzp.open();
      }
    } catch (error) {
      setLoading(false);
      setErrorMessage(error.message || 'Payment initialization failed');
      setShowFailure(true);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onSuccess(paymentResult);
  };

  const handleFailureRetry = () => {
    setShowFailure(false);
    setErrorMessage('');
    // Restart the payment process
    handlePayment();
  };

  const handleFailureClose = () => {
    setShowFailure(false);
    setErrorMessage('');
    onError(errorMessage || 'Payment failed');
  };

  if (showSuccess && paymentResult) {
    return (
      <PaymentSuccess 
        paymentData={paymentResult}
        onClose={handleSuccessClose}
      />
    );
  }

  if (showFailure) {
    return (
      <PaymentFailure 
        errorMessage={errorMessage}
        onRetry={handleFailureRetry}
        onClose={handleFailureClose}
      />
    );
  }

  return (
    <div className="razorpay-payment">
      <div className="payment-modal">
        <div className="payment-header">
          <h3>Payment Details</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="payment-content">
          <div className="payment-summary">
            <div className="student-info">
              <h4>{studentName}</h4>
              <p>Admission No: {admno}</p>
              <p>Institution ID: {institutionId}</p>
            </div>
            
            <div className="fee-breakdown">
              <h5>Fee Breakdown:</h5>
              {feeItems.length > 0 ? (
                <div className="fee-items">
                  {feeItems.map((item, index) => (
                    <div key={index} className="fee-item">
                      <span className="fee-desc">{item.month} - {item.refno}</span>
                      <span className="fee-amount">₹{(parseFloat(item.amount) + parseFloat(item.fine)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>{description}</p>
              )}
              
              <div className="total-amount">
                <strong>Total Amount: ₹{amount.toFixed(2)}</strong>
              </div>
            </div>
          </div>
          
          <div className="payment-actions">
            <button 
              className="pay-btn" 
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? 'Processing...' : `Pay ₹${amount.toFixed(2)}`}
            </button>
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
          
          <div className="payment-note">
            <p>🔒 This is a demo payment gateway. No actual money will be charged.</p>
            <p>Use test card: 4111 1111 1111 1111, CVV: 123, Expiry: Any future date</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RazorpayPayment;
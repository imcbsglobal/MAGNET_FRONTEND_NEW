import React, { useState } from "react";
import { initiatePayment } from "../../services/api";
import "./EasebuzzPayment.scss";

const EasebuzzPayment = ({
  amount,
  studentName,
  institutionId,
  institutionName,
  admno,
  feeItems = [],
  feeIds = [],
  onClose,
}) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      const response = await initiatePayment({
        institution_id: institutionId,
        admno: admno,
        amount: amount,
        fee_ids: feeIds,
      });

      console.log("Easebuzz Response:", response.data);

      if (response.data?.status === 1 && response.data?.data) {
        sessionStorage.setItem("payment_success_data", JSON.stringify({
          student_name: studentName,
          amount: String(amount),
          institution_name: institutionName,
          admno: admno,
          fee_type: feeItems.map(f => f.particulars || f.month).join(", "),
          mode: "Online",
        }));
        window.location.href = response.data.data;
        return;
      }

      alert(
        response.data?.data ||
        response.data?.message ||
        "Unable to initiate payment"
      );

    } catch (error) {
      console.error(error);
      alert("Payment initiation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="easebuzz-payment">
      <div className="payment-modal">
        <div className="payment-header">
          <h3>Fee Payment</h3>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '14px',
              right: '16px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              fontSize: '18px',
              lineHeight: '1',
              padding: '0',
            }}
          >
            ×
          </button>
        </div>
        <div className="payment-content">
          <div className="student-info">
            <h4>{studentName}</h4>
            <p>Admission No: {admno}</p>
            <p>Institution: {institutionName}</p>
          </div>
          <div className="fee-breakdown">
            <h5>Fee Breakdown</h5>
            <div className="fee-items">
              {feeItems.map((item, index) => (
                <div key={index} className="fee-item">
                  <span className="fee-desc">{item.month} - {item.refno}</span>
                  <span className="fee-amount">
                    ₹{(parseFloat(item.amount) + parseFloat(item.fine || 0)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="total-amount">
              <strong>Total Amount: ₹{Number(amount).toFixed(2)}</strong>
            </div>
          </div>
          <div className="payment-actions">
            <button className="pay-btn" onClick={handlePayment} disabled={loading}>
              {loading ? "Processing..." : `Pay ₹${Number(amount).toFixed(2)}`}
            </button>
            <button className="cancel-btn" onClick={onClose}>Cancel</button>
          </div>
          <div className="payment-note">
            <p>🔒 You will be redirected to Easebuzz secure payment gateway.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EasebuzzPayment;
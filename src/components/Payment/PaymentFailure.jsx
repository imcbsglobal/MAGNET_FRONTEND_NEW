import React from "react";
import { useNavigate } from "react-router-dom";
import "./PaymentFailure.scss";

const PaymentFailurePage = () => {
  const navigate = useNavigate();

  return (
    <div className="payment-failure-overlay">
      <div className="payment-failure-modal">

        <div className="failure-icon">
          <div className="error-mark">✕</div>
        </div>

        <h2>Payment Failed</h2>

        <p>
          Your payment could not be processed.
        </p>

        <div className="failure-actions">

          <button
            className="retry-btn"
            onClick={() =>
              navigate("/parent/pending-fee")
            }
          >
            Try Again
          </button>

          <button
            className="close-btn"
            onClick={() =>
              navigate("/parent-dashboard")
            }
          >
            Close
          </button>

        </div>

      </div>
    </div>
  );
};

export default PaymentFailurePage;
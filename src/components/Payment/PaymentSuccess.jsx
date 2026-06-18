import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./PaymentSuccess.scss";

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    // Priority 1: router state
    if (location.state && location.state.txnid) {
      setPaymentData(location.state);
      return;
    }

    // Priority 2: URL params from Django redirect ← MAIN PATH
    const urlParams = new URLSearchParams(window.location.search);
    const txnid = urlParams.get("txnid");

    if (txnid) {
      setPaymentData({
        txnid:            txnid,
        student_name:     urlParams.get("firstname")        || "—",
        amount:           urlParams.get("amount")           || "0.00",
        fee_type:         "School Fee Payment",
        mode:             urlParams.get("mode")             || "Online",
        institution_name: urlParams.get("institution_name") || "—",
      });
      return;
    }

    // Priority 3: sessionStorage fallback
    const stored = sessionStorage.getItem("payment_success_data");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPaymentData(parsed);
        sessionStorage.removeItem("payment_success_data");
      } catch {
        setPaymentData({});
      }
      return;
    }

    setPaymentData({});
  }, []);

  if (!paymentData) return null;

  const txnid           = paymentData.txnid            || "—";
  const studentName     = paymentData.student_name     || "—";
  const amount          = parseFloat(paymentData.amount || 0).toFixed(2);
  const feeType         = paymentData.fee_type         || "Fee Payment";
  const mode            = paymentData.mode             || "Online";
  const institutionName = paymentData.institution_name || "Institution";
  const paymentDate     = new Date().toLocaleString("en-IN");

  const handleDownloadReceipt = () => {
    const receiptWindow = window.open("", "_blank");
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Payment Receipt</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              background: #f0f4f8;
              display: flex;
              justify-content: center;
              padding: 30px 20px;
            }
            .receipt {
              background: white; width: 480px;
              border-radius: 16px; overflow: hidden;
              box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            }
            .receipt-header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white; text-align: center; padding: 32px 24px 24px;
            }
            .check-circle {
              width: 64px; height: 64px; border-radius: 50%;
              background: rgba(255,255,255,0.25);
              display: flex; align-items: center; justify-content: center;
              margin: 0 auto 12px; font-size: 32px;
            }
            .inst-name { font-size: 1.1rem; font-weight: 700; margin-bottom: 4px; }
            .receipt-header h1 { font-size: 1.4rem; font-weight: 700; margin-bottom: 4px; }
            .receipt-header p  { font-size: 0.85rem; opacity: 0.8; }
            .amount-section {
              background: #f0fdf4; border-bottom: 2px dashed #bbf7d0;
              text-align: center; padding: 24px;
            }
            .amount-label {
              font-size: 0.8rem; color: #6b7280;
              text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;
            }
            .amount-value { font-size: 2.4rem; font-weight: 800; color: #059669; }
            .receipt-body { padding: 24px; }
            .section-title {
              font-size: 0.72rem; font-weight: 700; color: #9ca3af;
              text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px;
            }
            .txn-box {
              background: #f8fafc; border: 1px solid #e2e8f0;
              border-radius: 10px; padding: 14px 16px; margin-bottom: 20px;
            }
            .txn-label { font-size: 0.72rem; color: #9ca3af; margin-bottom: 4px; }
            .txn-id { font-size: 0.95rem; font-weight: 700; color: #1e293b; font-family: 'Courier New', monospace; }
            .detail-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .detail-table tr { border-bottom: 1px solid #f1f5f9; }
            .detail-table tr:last-child { border-bottom: none; }
            .detail-table td { padding: 10px 4px; font-size: 0.88rem; }
            .detail-table td:first-child { color: #6b7280; font-weight: 500; width: 45%; }
            .detail-table td:last-child { color: #1e293b; font-weight: 600; text-align: right; }
            .status-badge {
              display: inline-block; background: #d1fae5; color: #059669;
              padding: 4px 14px; border-radius: 20px; font-size: 0.78rem; font-weight: 700;
            }
            .divider { border: none; border-top: 2px dashed #e2e8f0; margin: 16px 0; }
            .receipt-footer {
              background: #f8fafc; border-top: 1px solid #e2e8f0;
              text-align: center; padding: 18px 24px;
            }
            .org-name { font-size: 0.95rem; font-weight: 700; color: #475569; margin-bottom: 4px; }
            .receipt-footer p { font-size: 0.78rem; color: #9ca3af; line-height: 1.6; }
            @media print {
              body { background: white; padding: 0; }
              .receipt { box-shadow: none; border-radius: 0; width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="receipt-header">
              <div class="check-circle">✓</div>
              <div class="inst-name">${institutionName}</div>
              <h1>Payment Receipt</h1>
              <p>Fee payment confirmed successfully</p>
            </div>
            <div class="amount-section">
              <div class="amount-label">Amount Paid</div>
              <div class="amount-value">₹ ${amount}</div>
            </div>
            <div class="receipt-body">
              <div class="txn-box">
                <div class="txn-label">TRANSACTION ID</div>
                <div class="txn-id">${txnid}</div>
              </div>
              <div class="section-title">Student Details</div>
              <table class="detail-table">
                <tr><td>Student Name</td><td>${studentName}</td></tr>
              </table>
              <hr class="divider" />
              <div class="section-title">Payment Details</div>
              <table class="detail-table">
                <tr><td>Fee Type</td><td>${feeType}</td></tr>
                <tr><td>Payment Date</td><td>${paymentDate}</td></tr>
                <tr><td>Payment Mode</td><td>${mode}</td></tr>
                <tr><td>Status</td><td><span class="status-badge">SUCCESS</span></td></tr>
              </table>
            </div>
            <div class="receipt-footer">
              <div class="org-name">${institutionName}</div>
              <p>This is a system-generated receipt.<br/>No signature is required.</p>
            </div>
          </div>
          <script>window.onload = function() { window.print(); };<\/script>
        </body>
      </html>
    `;
    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
  };

  return (
    <div className="payment-success-overlay">
      <div className="payment-success-modal">
        <div className="success-icon">
          <div className="checkmark">✓</div>
        </div>

        <h2>Payment Successful!</h2>
        <p>Your fee payment has been completed successfully.</p>

        <div className="payment-details">
          <div className="detail-row">
            <span>Institution</span>
            <span>{institutionName}</span>
          </div>
          <div className="detail-row">
            <span>Transaction ID</span>
            <span className="txn-id-text">{txnid}</span>
          </div>
          <div className="detail-row">
            <span>Student Name</span>
            <span>{studentName}</span>
          </div>
          <div className="detail-row">
            <span>Amount Paid</span>
            <span className="amount-text">₹ {amount}</span>
          </div>
          <div className="detail-row">
            <span>Status</span>
            <span className="status-success">SUCCESS</span>
          </div>
          <div className="detail-row">
            <span>Date</span>
            <span>{paymentDate}</span>
          </div>
        </div>

        <div className="success-actions">
          <button className="download-receipt-btn" onClick={handleDownloadReceipt}>
            ⬇ Download Receipt
          </button>
          <button className="close-btn" onClick={() => navigate("/parent/paid-fee")}>
            View Paid Fees
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
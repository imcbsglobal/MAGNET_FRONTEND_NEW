import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchPaidFees } from '../../services/api';
import './ParentPaidFee.scss';

const ReceiptIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1.5L8 22l2-1.5L12 22l2-1.5L16 22l2-1.5L20 22V2l-2 1.5L16 2l-2 1.5L12 2l-2 1.5L8 2 6 3.5 4 2z" />
    <path d="M8 7h8" />
    <path d="M8 11h8" />
    <path d="M8 15h5" />
  </svg>
);

const ParentPaidFee = () => {
  const [fees, setFees] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewFee, setViewFee] = useState(null);

  const institutionId = localStorage.getItem('institutionId') || '';
  const admno = localStorage.getItem('admno') || '';
  const studentName = localStorage.getItem('studentName') || 'Student';

  const formatDateTime = (value) => {
    if (!value) return { date: '-', time: '' };

    // Force UTC parsing — append Z if no timezone info present
    const normalized = value.includes('Z') || value.includes('+') ? value : value.replace(' ', 'T') + 'Z';
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) return { date: value, time: '' };

    // Now getHours() etc. will return IST (browser local time)
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');

    return {
      date: `${day}-${month}-${year}`,
      time: `${hours}:${mins}:${secs}`,
    };
  };

  const sortedFees = React.useMemo(() => {
    return [...fees].sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
  }, [fees]);

  const filteredFees = React.useMemo(() => {
    if (!search) return sortedFees;
    return sortedFees.filter((fee) =>
      (fee.particulars || '').toLowerCase().includes(search.toLowerCase()) ||
      (fee.refno || '').toLowerCase().includes(search.toLowerCase()) ||
      (fee.month || '').toLowerCase().includes(search.toLowerCase()) ||
      (fee.txnid || '').toLowerCase().includes(search.toLowerCase()) ||
      (fee.remark || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [search, sortedFees]);

  const totalPaid = filteredFees.reduce(
    (sum, f) => sum + Number(f.amount || 0) + Number(f.fine || 0),
    0
  );

  useEffect(() => {
    if (!institutionId || !admno) {
      setError('Student details are missing. Please log in again.');
      setLoading(false);
      return;
    }
    fetchPaidFees(institutionId, admno)
      .then((response) => {
        if (response.data.status) {
          setFees(response.data.fees || []);
        } else {
          setError(response.data.message || 'Unable to load paid fee details.');
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Unable to load paid fee details.');
      })
      .finally(() => setLoading(false));
  }, [institutionId, admno]);

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="parent" />
      <main className="dashboard-main">
        <Navbar />
        <div className="fee-page">

          {/* ── Header ── */}
          <div className="fee-header">
            <div className="fee-header-main">
              <div className="fee-header-icon"><ReceiptIcon /></div>
              <div>
                <h1>Paid Fee — {studentName}</h1>
                <p>
                  Institution: <strong>{institutionId}</strong> · Adm No: <strong>{admno}</strong>
                </p>
                <div className="fee-pill-row">
                  <span className="fee-pill fee-pill--paid">
                    Total Paid · ₹{totalPaid.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {error && <div className="fee-error">{error}</div>}

          {/* ── Search bar ── */}
          <div className="fee-search-bar">
            <div className="search-input-wrapper">
              <input
                type="text"
                value={search}
                placeholder="Search by Particulars, Ref No, Month, Txn ID, Remark"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* ── Table / Cards ── */}
          <div className="fee-table-card">
            {loading ? (
              <div className="fee-empty">Loading paid fees…</div>
            ) : error ? (
              <div className="fee-empty">{error}</div>
            ) : sortedFees.length === 0 ? (
              <div className="fee-empty">No paid fee records found.</div>
            ) : (
              <>
                {/* ── Desktop table ── */}
                <div className="table-responsive">
                  <table className="fee-table">
                    <thead>
                      <tr>
                        <th className="no-col">No</th>
                        <th>Month/Term</th>
                        <th>Particulars</th>
                        <th>Ref No</th>
                        <th className="money-col">Fine</th>
                        <th className="money-col">Amount</th>
                        <th className="money-col">Total</th>
                        <th className="txn-col">Txn ID</th>
                        <th>Payment Date</th>
                        <th>Status</th>
                        <th>Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFees.map((fee, index) => {
                        const fineValue = Number(fee.fine || 0);
                        const isSuccess = fee.payment_status === 'SUCCESS';
                        return (
                          <tr key={fee.id}>
                            <td className="no-col">{index + 1}</td>
                            <td>{fee.month || '-'}</td>
                            <td>{fee.particulars || '-'}</td>
                            <td>{fee.refno || '-'}</td>
                            <td className={`money-col fine-cell ${fineValue === 0 ? 'is-zero' : ''}`}>₹{fineValue.toFixed(2)}</td>
                            <td className="money-col paid-amount-cell">₹{Number(fee.amount || 0).toFixed(2)}</td>
                            <td className="money-col total-cell">
                              ₹{(Number(fee.amount || 0) + fineValue).toFixed(2)}
                            </td>
                            <td className="txn-cell txn-col">{fee.txnid || '-'}</td>
                            <td>
                              {(() => {
                                const { date, time } = formatDateTime(fee.payment_date);
                                return (
                                  <div className="datetime-cell">
                                    <span className="dt-date">{date}</span>
                                    {time && <span className="dt-time">{time}</span>}
                                  </div>
                                );
                              })()}
                            </td>
                            <td>
                              <span className={`status-badge ${isSuccess ? 'success' : 'failed'}`}>
                                {fee.payment_status || '-'}
                              </span>
                            </td>
                            <td>{fee.remark || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── Mobile cards ── */}
                <div className="fee-cards">
                  {filteredFees.map((fee) => {
                    const fineValue = Number(fee.fine || 0);
                    const feeTotal  = Number(fee.amount || 0) + fineValue;
                    const isSuccess = fee.payment_status === 'SUCCESS';
                    return (
                      <div key={fee.id} className="fee-card">
                        <div className="fee-card-info">
                          <div className="fee-card-top">
                            <span className="fee-card-month">{fee.month || '-'}</span>
                            <span className={`status-badge ${isSuccess ? 'success' : 'failed'}`}>
                              {fee.payment_status || '-'}
                            </span>
                          </div>
                          <div className="fee-card-particulars">{fee.particulars || '-'}</div>
                          <div className="fee-card-amount">₹{feeTotal.toFixed(2)}</div>
                        </div>
                        <button type="button" className="fee-card-view" onClick={() => setViewFee(fee)}>
                          View
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

        </div>
      </main>

      {/* ── Fee detail modal (mobile "View") ── */}
      {viewFee && (() => {
        const fineValue = Number(viewFee.fine || 0);
        const feeTotal  = Number(viewFee.amount || 0) + fineValue;
        const isSuccess = viewFee.payment_status === 'SUCCESS';
        const { date, time } = formatDateTime(viewFee.payment_date);
        const rows = [
          ['Month/Term', viewFee.month || '-'],
          ['Particulars', viewFee.particulars || '-'],
          ['Ref No', viewFee.refno || '-'],
          ['Fine', `₹${fineValue.toFixed(2)}`],
          ['Amount', `₹${Number(viewFee.amount || 0).toFixed(2)}`],
          ['Total', `₹${feeTotal.toFixed(2)}`],
          ['Txn ID', viewFee.txnid || '-'],
          ['Payment Date', time ? `${date} ${time}` : date],
          ['Remark', viewFee.remark || '-'],
        ];
        return (
          <div className="modal-overlay" onClick={() => setViewFee(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>{viewFee.month || 'Payment Details'}</h2>
                  <span className="modal-sub">{viewFee.particulars || '-'}</span>
                </div>
                <button className="modal-close" onClick={() => setViewFee(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="modal-row">
                  <span className="modal-label">Status</span>
                  <span className="modal-value">
                    <span className={`status-badge ${isSuccess ? 'success' : 'failed'}`}>
                      {viewFee.payment_status || '-'}
                    </span>
                  </span>
                </div>
                {rows.map(([label, value]) => (
                  <div className="modal-row" key={label}>
                    <span className="modal-label">{label}</span>
                    <span className={`modal-value ${label === 'Total' ? 'modal-value--total' : ''} ${label === 'Txn ID' ? 'modal-value--mono' : ''}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button className="secondary-btn" onClick={() => setViewFee(null)}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ParentPaidFee;
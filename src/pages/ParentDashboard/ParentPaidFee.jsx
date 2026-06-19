import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchPaidFees } from '../../services/api';
import './FeePages.scss';

const ParentPaidFee = () => {
  const [fees, setFees] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
        <div className="dashboard-content fee-page-content">

          <section className="welcome-section">
            <div>
              <h2>Paid Fee — {studentName}</h2>
              <p>
                Institution: <strong>{institutionId}</strong>
                &nbsp;|&nbsp;
                Adm No: <strong>{admno}</strong>
              </p>
            </div>
            <div className="fee-summary-banner paid-banner">
              <span>Total Paid</span>
              <strong>₹{totalPaid.toFixed(2)}</strong>
            </div>
          </section>

          <div className="top-filter-bar">
            <div className="fee-search-box">
              <span className="fee-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by Particulars, Ref No, Remark..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="fee-table-card">
            {loading ? (
              <div className="loading-state">Loading paid fees…</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : sortedFees.length === 0 ? (
              <div className="empty-state">
                <p>No paid fee records found.</p>
              </div>
            ) : (
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
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default ParentPaidFee;
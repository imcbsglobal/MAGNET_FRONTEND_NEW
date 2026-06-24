import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import EasebuzzPayment from '../../components/Payment/EasebuzzPayment';
import { fetchPendingFees, fetchSchoolInfo } from '../../services/api';
import './FeePages.scss';

const TODAY = new Date();
TODAY.setHours(23, 59, 59, 999); // include all of today

const ParentPendingFee = () => {
  const [fees, setFees]                   = useState([]);
  const [error, setError]                 = useState('');
  const [loading, setLoading]             = useState(true);
  const [pageSize, setPageSize]           = useState(10);
  const [currentPage, setCurrentPage]     = useState(1);
  const [filterType, setFilterType]       = useState('all');
  const [search, setSearch]               = useState('');
  const [selectedFees, setSelectedFees]   = useState([]);
  const [showPayment, setShowPayment]     = useState(false);
  const [paymentFees, setPaymentFees]     = useState([]);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [studentName, setStudentName]     = useState('Student');
  const [showFuture, setShowFuture]       = useState(false);

  const institutionId = localStorage.getItem('institutionId') || '';
  const admno         = localStorage.getItem('admno')         || '';

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `${String(date.getDate()).padStart(2,'0')}-${String(date.getMonth()+1).padStart(2,'0')}-${date.getFullYear()}`;
  };

  // ascending by date
  const sortedFees = React.useMemo(() =>
    [...fees].sort((a, b) => new Date(a.date) - new Date(b.date)),
  [fees]);

  // split into due (≤ today) and future (> today)
  const dueFees    = React.useMemo(() => sortedFees.filter(f => new Date(f.date) <= TODAY), [sortedFees]);
  const futureFees = React.useMemo(() => sortedFees.filter(f => new Date(f.date) >  TODAY), [sortedFees]);

  // visible = due always + future only if showFuture
  const visibleFees = React.useMemo(() =>
    showFuture ? sortedFees : dueFees,
  [showFuture, sortedFees, dueFees]);

  const filteredFees = React.useMemo(() => {
    let result = visibleFees;
    if (filterType === 'vehicle')
      result = result.filter(f => String(f.refno || '').startsWith('VEHICLE'));
    else if (filterType === 'feeItem')
      result = result.filter(f => !String(f.refno || '').startsWith('VEHICLE'));
    if (search)
      result = result.filter(f =>
        (f.month       || '').toLowerCase().includes(search.toLowerCase()) ||
        (f.particulars || '').toLowerCase().includes(search.toLowerCase()) ||
        (f.refno       || '').toLowerCase().includes(search.toLowerCase()) ||
        (f.remark      || '').toLowerCase().includes(search.toLowerCase())
      );
    return result;
  }, [filterType, search, visibleFees]);

  const paginatedFees = filteredFees;

  // total due = ALL fees (not just visible) for the banner
  const totalDue          = sortedFees.reduce((sum, f) => sum + parseFloat(f.amount) + parseFloat(f.fine), 0);
  const dueTodayTotal     = dueFees.reduce((sum, f) => sum + parseFloat(f.amount) + parseFloat(f.fine), 0);

  const selectedTotal     = selectedFees.reduce((sum, feeId) => {
    const fee = fees.find(f => f.id === feeId);
    return fee ? sum + parseFloat(fee.amount) + parseFloat(fee.fine) : sum;
  }, 0);
  const allOnPageSelected = paginatedFees.length > 0 && paginatedFees.every(f => selectedFees.includes(f.id));
  const someSelected      = selectedFees.length > 0;

  const handleFeeSelection  = (feeId) =>
    setSelectedFees(prev => prev.includes(feeId) ? prev.filter(id => id !== feeId) : [...prev, feeId]);

  const handleSelectAllPage = () => {
    if (allOnPageSelected)
      setSelectedFees(prev => prev.filter(id => !paginatedFees.find(f => f.id === id)));
    else
      setSelectedFees(prev => [...new Set([...prev, ...paginatedFees.map(f => f.id)])]);
  };

  const handlePaySelected    = () => { setPaymentFees(fees.filter(f => selectedFees.includes(f.id))); setShowPayment(true); };
  const handlePayAll         = () => { setPaymentFees(filteredFees); setShowPayment(true); };
  const handlePaymentSuccess = (paymentData) => {
    setShowPayment(false);
    setSelectedFees([]);
    setPaymentMessage(`Payment of ₹${paymentData.amount.toFixed(2)} completed. Reference ID: ${paymentData.payment_id}`);
    setTimeout(() => setPaymentMessage(''), 5000);
  };
  const handlePaymentError = (err) => {
    setShowPayment(false);
    setPaymentMessage(`Payment failed: ${err}`);
    setTimeout(() => setPaymentMessage(''), 5000);
  };

  useEffect(() => {
    if (!institutionId || !admno) {
      setError('Student details missing. Please log in again.');
      setLoading(false);
      return;
    }
    fetchPendingFees(institutionId, admno)
      .then(res => {
        if (res.data.status) {
          const feeList = res.data.fees || [];
          setFees(feeList);
          if (feeList.length > 0 && feeList[0].student_name)
            setStudentName(feeList[0].student_name.trim());
        } else {
          setError(res.data.message || 'Unable to load fees.');
        }
      })
      .catch(err => setError(err.response?.data?.message || 'Unable to load fees.'))
      .finally(() => setLoading(false));
  }, [institutionId, admno]);

  useEffect(() => {
    if (!institutionId) return;
    fetchSchoolInfo(institutionId)
      .then(res => setInstitutionName(res.data?.school_name || ''))
      .catch(() => {});
  }, [institutionId]);

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="parent" />
      <main className="dashboard-main">
        <Navbar />
        <div className="dashboard-content fee-page-content">

          {/* ── Header ── */}
          <section className="welcome-section">
            <div>
              <h2>Pending Fee — {studentName}</h2>
              <p>
                {institutionName
                  ? <><strong>{institutionName}</strong> | Adm No: <strong>{admno}</strong></>
                  : <>Institution: <strong>{institutionId}</strong> | Adm No: <strong>{admno}</strong></>
                }
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <div className="fee-summary-banner">
                <span>Due Now</span>
                <strong>₹{dueTodayTotal.toFixed(2)}</strong>
              </div>
            </div>
          </section>

          {paymentMessage && (
            <div className={`payment-message ${paymentMessage.startsWith('Payment of') ? 'success' : 'error'}`}>
              {paymentMessage}
            </div>
          )}

          {/* ── Filter Bar ── */}
          <div className="top-filter-bar">
            <select
              value={filterType}
              onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
              className="filter-select"
            >
              <option value="all">All</option>
              <option value="vehicle">Vehicle</option>
              <option value="feeItem">Fee Item</option>
            </select>
            <div className="fee-search-box">
              <span className="fee-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by Month, Particulars, Ref No..."
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          {/* ── Table ── */}
          <div className="fee-table-card">
            {loading ? (
              <div className="loading-state">Loading pending fees…</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : filteredFees.length === 0 ? (
              <div className="empty-state"><p>No pending fee records found.</p></div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="fee-table">
                    <thead>
                      <tr>
                        <th className="checkbox-col">
                          <input type="checkbox" checked={allOnPageSelected} onChange={handleSelectAllPage} title="Select all on this page" />
                        </th>
                        <th className="no-col">No</th>
                        <th>Date</th>
                        <th>Month/Term</th>
                        <th>Particulars</th>
                        <th>Ref No</th>
                        <th className="money-col">Fine</th>
                        <th className="money-col">Amount</th>
                        <th className="money-col">Total</th>
                        <th>Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedFees.map((fee, index) => {
                        const fineValue   = parseFloat(fee.fine)   || 0;
                        const feeTotal    = parseFloat(fee.amount) + fineValue;
                        const isSelected  = selectedFees.includes(fee.id);
                        const isFuture    = new Date(fee.date) > TODAY;
                        return (
                          <tr
                            key={fee.id}
                            className={`is-clickable ${isSelected ? 'selected-row' : ''} ${isFuture ? 'future-row' : ''}`}
                            onClick={() => handleFeeSelection(fee.id)}
                          >
                            <td className="checkbox-col" onClick={e => e.stopPropagation()}>
                              <input type="checkbox" checked={isSelected} onChange={() => handleFeeSelection(fee.id)} />
                            </td>
                            <td className="no-col">{index + 1}</td>
                            <td>
                              <span className={isFuture ? 'future-date-badge' : ''}>
                                {formatDate(fee.date)}
                              </span>
                            </td>
                            <td>{fee.month}</td>
                            <td>{fee.particulars || '-'}</td>
                            <td>{fee.refno}</td>
                            <td className={`money-col fine-cell ${fineValue === 0 ? 'is-zero' : ''}`}>₹{fineValue.toFixed(2)}</td>
                            <td className="money-col amount-cell">₹{Number(fee.amount).toFixed(2)}</td>
                            <td className="money-col total-cell">₹{feeTotal.toFixed(2)}</td>
                            <td>{fee.remark || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── Mobile Card List ── */}
                <div className="fee-card-list">
                  <div className="fee-card-selectall">
                    <label className="fee-card-checkbox">
                      <input type="checkbox" checked={allOnPageSelected} onChange={handleSelectAllPage} />
                      <span>Select All ({paginatedFees.length})</span>
                    </label>
                  </div>

                  {paginatedFees.map((fee) => {
                    const fineValue  = parseFloat(fee.fine)   || 0;
                    const feeTotal   = parseFloat(fee.amount) + fineValue;
                    const isSelected = selectedFees.includes(fee.id);
                    const isFuture   = new Date(fee.date) > TODAY;
                    return (
                      <div
                        key={fee.id}
                        className={`fee-card ${isSelected ? 'selected' : ''} ${isFuture ? 'future' : ''}`}
                      >
                        <div className="fee-card-top">
                          <div className="fee-card-title">
                            <span className="fee-card-month">{fee.month}</span>
                            <span className={`fee-card-date ${isFuture ? 'future-date-badge' : ''}`}>
                              {formatDate(fee.date)}
                            </span>
                          </div>
                        </div>

                        <div className="fee-card-body">
                          <input
                            type="checkbox"
                            className="fee-card-check"
                            checked={isSelected}
                            onChange={() => handleFeeSelection(fee.id)}
                          />
                          <div className="fee-card-info">
                            <span className="fee-card-particulars">{fee.particulars || '-'}</span>
                            <span className="fee-card-amount">₹{feeTotal.toFixed(2)}</span>
                            {fineValue > 0 && (
                              <span className="fee-card-fine">Fine: ₹{fineValue.toFixed(2)}</span>
                            )}
                          </div>
                          <button
                            className="fee-card-view-btn"
                            onClick={() => handleFeeSelection(fee.id)}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Show Future toggle ── */}
                {futureFees.length > 0 && (
                  <div className="future-fees-toggle">
                    <button
                      className={`future-toggle-btn ${showFuture ? 'active' : ''}`}
                      onClick={() => { setShowFuture(v => !v); setCurrentPage(1); }}
                    >
                      {showFuture
                        ? `▲ Hide`
                        : `▼ More Fee Details (${futureFees.length} items · ₹${(totalDue - dueTodayTotal).toFixed(2)})`
                      }
                    </button>
                  </div>
                )}

                {/* ── Pay buttons ── */}
                <div className="bottom-action-bar">
                  <div className="bottom-left">
                    {someSelected && (
                      <button className="pay-selected-btn" onClick={handlePaySelected}>
                        Pay Selected
                        <span className="btn-badge">{selectedFees.length} item{selectedFees.length > 1 ? 's' : ''}</span>
                        <span className="btn-amount">₹{selectedTotal.toFixed(2)}</span>
                      </button>
                    )}
                  </div>
                  <div className="bottom-right">
                    {someSelected && (
                      <span className="selection-hint">{selectedFees.length} of {filteredFees.length} selected</span>
                    )}
                    <button className="pay-all-btn" onClick={handlePayAll} disabled={filteredFees.length === 0}>
                      Pay All Fees
                      <span className="btn-amount">₹{totalDue.toFixed(2)}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </main>

      {showPayment && (
        <EasebuzzPayment
          amount={paymentFees.reduce((sum, f) => sum + parseFloat(f.amount) + parseFloat(f.fine), 0)}
          institutionId={institutionId}
          institutionName={institutionName}
          admno={admno}
          studentName={studentName}
          feeItems={paymentFees}
          feeIds={paymentFees.map(f => f.id)}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
};

export default ParentPendingFee;
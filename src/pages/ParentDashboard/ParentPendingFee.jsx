import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import EasebuzzPayment from '../../components/Payment/EasebuzzPayment';
import { fetchPendingFees, fetchSchoolInfo } from '../../services/api';
import './ParentPendingFee.scss';

const TODAY = new Date();
TODAY.setHours(23, 59, 59, 999); // include all of today

const ReceiptIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1.5L8 22l2-1.5L12 22l2-1.5L16 22l2-1.5L20 22V2l-2 1.5L16 2l-2 1.5L12 2l-2 1.5L8 2 6 3.5 4 2z" />
    <path d="M8 7h8" />
    <path d="M8 11h8" />
    <path d="M8 15h5" />
  </svg>
);

const FILTER_TABS = [
  { value: 'all',     label: 'All'      },
  { value: 'vehicle', label: 'Vehicle'  },
  { value: 'feeItem', label: 'Fee Item' },
];

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
  const [viewFee, setViewFee]             = useState(null);

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

  const totalPages        = Math.max(1, Math.ceil(filteredFees.length / pageSize));
  const firstIndex        = (currentPage - 1) * pageSize;
  const lastIndex         = Math.min(filteredFees.length, firstIndex + pageSize);
  const paginatedFees     = filteredFees.slice(firstIndex, lastIndex);

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
  const handlePaySingle      = (fee) => { setPaymentFees([fee]); setShowPayment(true); };
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

  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

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
        <div className="fee-page">

          {/* ── Header ── */}
          <div className="fee-header">
            <div className="fee-header-main">
              <div className="fee-header-icon"><ReceiptIcon /></div>
              <div>
                <h1>Pending Fee — {studentName}</h1>
                <p>
                  {institutionName
                    ? <><strong>{institutionName}</strong> · Adm No: <strong>{admno}</strong></>
                    : <>Institution: <strong>{institutionId}</strong> · Adm No: <strong>{admno}</strong></>
                  }
                </p>
                <div className="fee-pill-row">
                  <span className="fee-pill fee-pill--due">
                    Due Now · ₹{dueTodayTotal.toFixed(2)}
                  </span>
                  {futureFees.length > 0 && (
                    <span className="fee-pill fee-pill--future">
                      Upcoming · ₹{(totalDue - dueTodayTotal).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="fee-actions">
              {someSelected && (
                <button type="button" className="secondary-btn" onClick={handlePaySelected}>
                  Pay Selected ({selectedFees.length}) · ₹{selectedTotal.toFixed(2)}
                </button>
              )}
              <button
                type="button"
                className="primary-btn"
                onClick={handlePayAll}
                disabled={filteredFees.length === 0}
              >
                Pay All · ₹{totalDue.toFixed(2)}
              </button>
            </div>
          </div>

          {error && <div className="fee-error">{error}</div>}
          {paymentMessage && (
            <div className={paymentMessage.startsWith('Payment of') ? 'fee-status' : 'fee-error'}>
              {paymentMessage}
            </div>
          )}

          {/* ── Search bar ── */}
          <div className="fee-search-bar">
            <div className="search-input-wrapper">
              <input
                type="text"
                value={search}
                placeholder="Search by Month, Particulars, Ref No, Remark"
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div className="status-filter-wrapper">
              {FILTER_TABS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`status-filter-btn${filterType === value ? ' status-filter-btn--active' : ''}`}
                  onClick={() => { setFilterType(value); setCurrentPage(1); }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Table / Cards ── */}
          <div className="fee-table-card">
            {loading ? (
              <div className="fee-empty">Loading pending fees…</div>
            ) : error ? (
              <div className="fee-empty">{error}</div>
            ) : filteredFees.length === 0 ? (
              <div className="fee-empty">No pending fee records found.</div>
            ) : (
              <>
                {/* ── Desktop table ── */}
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
                            <td className="no-col">{firstIndex + index + 1}</td>
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

                {/* ── Mobile cards ── */}
                <div className="fee-cards">
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
                        <div className="fee-card-info">
                          <div className="fee-card-top">
                            <span className="fee-card-month">{fee.month}</span>
                            {isSelected && <span className="fee-card-chip">Selected</span>}
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

      {/* ── Fee detail modal (mobile "View") ── */}
      {viewFee && (() => {
        const fineValue  = parseFloat(viewFee.fine) || 0;
        const feeTotal   = parseFloat(viewFee.amount) + fineValue;
        const isFuture   = new Date(viewFee.date) > TODAY;
        const isSelected = selectedFees.includes(viewFee.id);
        const rows = [
          ['Date', formatDate(viewFee.date)],
          ['Month/Term', viewFee.month || '-'],
          ['Particulars', viewFee.particulars || '-'],
          ['Ref No', viewFee.refno || '-'],
          ['Fine', `₹${fineValue.toFixed(2)}`],
          ['Amount', `₹${Number(viewFee.amount).toFixed(2)}`],
          ['Total', `₹${feeTotal.toFixed(2)}`],
          ['Remark', viewFee.remark || '-'],
        ];
        return (
          <div className="modal-overlay" onClick={() => setViewFee(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>{viewFee.month || 'Fee Details'}</h2>
                  <span className="modal-sub">{viewFee.particulars || '-'}</span>
                </div>
                <button className="modal-close" onClick={() => setViewFee(null)}>✕</button>
              </div>
              <div className="modal-body">
                {rows.map(([label, value]) => (
                  <div className="modal-row" key={label}>
                    <span className="modal-label">{label}</span>
                    <span className={`modal-value ${label === 'Total' ? 'modal-value--total' : ''}`}>
                      {label === 'Date' && isFuture
                        ? <span className="future-date-badge">{value}</span>
                        : value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button
                  className="secondary-btn"
                  onClick={() => { handleFeeSelection(viewFee.id); }}
                >
                  {isSelected ? 'Remove from Selection' : 'Add to Selection'}
                </button>
                <button
                  className="primary-btn"
                  onClick={() => { const f = viewFee; setViewFee(null); handlePaySingle(f); }}
                >
                  Pay This · ₹{feeTotal.toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
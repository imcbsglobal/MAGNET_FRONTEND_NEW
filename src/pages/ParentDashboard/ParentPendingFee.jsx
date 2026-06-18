import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import RazorpayPayment from '../../components/Payment/RazorpayPayment';
import { fetchPendingFees } from '../../services/api';
import './ParentPendingFee.scss';

const FeeIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="13" rx="2" />
    <path d="M2 10h20" />
    <circle cx="16" cy="14.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const ParentPendingFee = () => {
  const navigate = useNavigate();
  const [fees, setFees] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedFees, setSelectedFees] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentType, setPaymentType] = useState('individual'); // 'individual' or 'bulk'
  const [paymentFees, setPaymentFees] = useState([]);
  const [paymentMessage, setPaymentMessage] = useState('');

  const institutionId = localStorage.getItem('institutionId') || '';
  const admno = localStorage.getItem('admno') || '';
  const studentName = localStorage.getItem('studentName') || 'Student';

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const sortedFees = React.useMemo(() => {
    return [...fees].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [fees]);

  const filteredFees = React.useMemo(() => {
    let result = sortedFees;
    if (filterType === 'vehicle') result = result.filter((fee) => String(fee.refno || '').startsWith('VEHICLE'));
    else if (filterType === 'feeItem') result = result.filter((fee) => !String(fee.refno || '').startsWith('VEHICLE'));
    if (search) result = result.filter((fee) =>
      (fee.month || '').toLowerCase().includes(search.toLowerCase()) ||
      (fee.refno || '').toLowerCase().includes(search.toLowerCase()) ||
      (fee.remark || '').toLowerCase().includes(search.toLowerCase())
    );
    return result;
  }, [filterType, search, sortedFees]);

  const totalPages = Math.max(1, Math.ceil(filteredFees.length / pageSize));
  const firstIndex = (currentPage - 1) * pageSize;
  const lastIndex = Math.min(filteredFees.length, firstIndex + pageSize);
  const paginatedFees = filteredFees.slice(firstIndex, lastIndex);
  const totalDue = filteredFees.reduce((sum, f) => sum + parseFloat(f.amount) + parseFloat(f.fine), 0);
  const selectedTotal = selectedFees.reduce((sum, feeId) => {
    const fee = fees.find(f => f.id === feeId);
    return fee ? sum + parseFloat(fee.amount) + parseFloat(fee.fine) : sum;
  }, 0);

  const handleFeeSelection = (feeId) => {
    setSelectedFees(prev => 
      prev.includes(feeId) 
        ? prev.filter(id => id !== feeId)
        : [...prev, feeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFees.length === filteredFees.length) {
      setSelectedFees([]);
    } else {
      setSelectedFees(filteredFees.map(fee => fee.id));
    }
  };

  const handleIndividualPayment = (fee) => {
    setPaymentFees([fee]);
    setPaymentType('individual');
    setShowPayment(true);
  };

  const handleBulkPayment = () => {
    if (selectedFees.length === 0) {
      setPaymentMessage('Please select at least one fee to pay.');
      setTimeout(() => setPaymentMessage(''), 3000);
      return;
    }
    const feesToPay = fees.filter(fee => selectedFees.includes(fee.id));
    setPaymentFees(feesToPay);
    setPaymentType('bulk');
    setShowPayment(true);
  };

  const handlePayAllFees = () => {
    setPaymentFees(filteredFees);
    setPaymentType('bulk');
    setShowPayment(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    console.log('Payment successful:', paymentData);
    setShowPayment(false);
    setSelectedFees([]);
    setPaymentMessage(`✅ Payment of ₹${paymentData.amount.toFixed(2)} completed successfully! Payment ID: ${paymentData.payment_id}`);
    
    // In a real app, you would update the backend and refresh the fee list
    // For demo purposes, we'll just show a success message
    setTimeout(() => setPaymentMessage(''), 5000);
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
    setShowPayment(false);
    setPaymentMessage(`❌ Payment failed: ${error}`);
    setTimeout(() => setPaymentMessage(''), 5000);
  };

  const handlePaymentClose = () => {
    setShowPayment(false);
  };

  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!institutionId || !admno) {
      setError('Student details are missing. Please log in again.');
      setLoading(false);
      return;
    }
    fetchPendingFees(institutionId, admno)
      .then((response) => {
        if (response.data.status) {
          setFees(response.data.fees || []);
        } else {
          setError(response.data.message || 'Unable to load pending fee details.');
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Unable to load pending fee details.');
      })
      .finally(() => setLoading(false));
  }, [institutionId, admno]);

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="parent" />
      <main className="dashboard-main">
        <Navbar placeholder="Search pending fee records..." />
        <div className="ppf-page">

          {/* ── Header ── */}
          <div className="ppf-header">
            <div className="ppf-header-main">
              <div className="ppf-header-icon"><FeeIcon /></div>
              <div>
                <h1>Pending Fee for {studentName}</h1>
                <p>Showing fee records linked to institution ID {institutionId} and admission number {admno}.</p>
              </div>
            </div>
            <div className="ppf-header-actions">
              <div className="ppf-stat-chip">
                <span>Total Due</span>
                <strong>₹{totalDue.toFixed(2)}</strong>
              </div>
              <button
                type="button"
                className="ppf-pay-all-btn"
                onClick={handlePayAllFees}
                disabled={filteredFees.length === 0}
              >
                💰 Pay All Fees
              </button>
            </div>
          </div>

          {paymentMessage && (
            <div className={`ppf-message ${paymentMessage.startsWith('✅') ? 'success' : 'error'}`}>
              {paymentMessage}
            </div>
          )}

          {/* ── Filters ── */}
          <div className="ppf-filter-bar">
            <div className="ppf-filter">
              <label htmlFor="feeFilter">Filter</label>
              <select id="feeFilter" value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}>
                <option value="all">All</option>
                <option value="vehicle">Vehicle</option>
                <option value="feeItem">Fee item</option>
              </select>
            </div>
            <div className="ppf-search">
              <SearchIcon />
              <input
                id="search"
                type="text"
                placeholder="Search by Month, Ref No, Remark..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>

            {selectedFees.length > 0 && (
              <div className="ppf-bulk-inline">
                <span className="ppf-selected-info">
                  {selectedFees.length} selected (₹{selectedTotal.toFixed(2)})
                </span>
                <button type="button" className="ppf-bulk-pay-btn" onClick={handleBulkPayment}>
                  💳 Pay Selected
                </button>
              </div>
            )}
          </div>

          {/* ── Table ── */}
          <div className="ppf-table-card">
            {loading ? (
              <div className="ppf-empty">Loading pending fees...</div>
            ) : error ? (
              <div className="ppf-error">{error}</div>
            ) : filteredFees.length === 0 ? (
              <div className="ppf-empty">No pending fee records found for this filter.</div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="ppf-table">
                    <thead>
                      <tr>
                        <th>
                          <input 
                            type="checkbox" 
                            checked={selectedFees.length === filteredFees.length && filteredFees.length > 0}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th>No</th>
                        <th>Month/Term</th>
                        <th>Date</th>
                        <th>Ref No</th>
                        <th>Fine</th>
                        <th>Amount</th>
                        <th>Total</th>
                        <th>Remark</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedFees.map((fee, index) => {
                        const feeTotal = parseFloat(fee.amount) + parseFloat(fee.fine);
                        return (
                          <tr key={fee.id} className={selectedFees.includes(fee.id) ? 'selected-row' : ''}>
                            <td className="ppf-check-cell">
                              <input 
                                type="checkbox" 
                                checked={selectedFees.includes(fee.id)}
                                onChange={() => handleFeeSelection(fee.id)}
                              />
                            </td>
                            <td className="ppf-no-cell">{firstIndex + index + 1}</td>
                            <td className="ppf-plain-cell">{fee.month}</td>
                            <td className="ppf-plain-cell">{formatDate(fee.date)}</td>
                            <td className="ppf-plain-cell">{fee.refno}</td>
                            <td className="ppf-amount-cell ppf-fine">₹{Number(fee.fine).toFixed(2)}</td>
                            <td className="ppf-amount-cell">₹{Number(fee.amount).toFixed(2)}</td>
                            <td className="ppf-total-cell">₹{feeTotal.toFixed(2)}</td>
                            <td className="ppf-plain-cell">{fee.remark || '-'}</td>
                            <td className="ppf-action-cell">
                              <button 
                                type="button"
                                className="ppf-pay-btn"
                                onClick={() => handleIndividualPayment(fee)}
                              >
                                💳 Pay
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="ppf-table-controls">
                  <div className="ppf-table-filter">
                    <label htmlFor="pageSize">Rows per page</label>
                    <select id="pageSize" className="ppf-select" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                      {[10, 20, 50, 100].map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  <div className="ppf-table-pagination">
                    <span>Showing {filteredFees.length === 0 ? 0 : firstIndex + 1}–{lastIndex} of {filteredFees.length}</span>
                    <div className="ppf-pagination-buttons">
                      <button type="button" className="secondary-btn" disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>Previous</button>
                      <button type="button" className="secondary-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}>Next</button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </main>
      
      {showPayment && (
        <RazorpayPayment
          amount={paymentFees.reduce((sum, fee) => sum + parseFloat(fee.amount) + parseFloat(fee.fine), 0)}
          description={paymentType === 'bulk' 
            ? `Bulk payment for ${paymentFees.length} fee items`
            : `${paymentFees[0]?.month} - ${paymentFees[0]?.refno}`
          }
          studentName={studentName}
          institutionId={institutionId}
          admno={admno}
          feeItems={paymentFees}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onClose={handlePaymentClose}
        />
      )}
    </div>
  );
};

export default ParentPendingFee;
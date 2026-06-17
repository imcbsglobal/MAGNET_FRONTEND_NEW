import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import EasebuzzPayment from '../../components/Payment/EasebuzzPayment';
import { fetchPendingFees, fetchSchoolInfo } from '../../services/api';
import '../SuperUserDashboard/SuperUserDashboard.scss';
import './ParentPendingFee.scss';

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
  const [paymentFees, setPaymentFees] = useState([]);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [institutionName, setInstitutionName] = useState('');   // <-- new
  const [studentName, setStudentName] = useState('Student');    // <-- from API now

  const institutionId = localStorage.getItem('institutionId') || '';
  const admno         = localStorage.getItem('admno')         || '';

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `${String(date.getDate()).padStart(2,'0')}-${String(date.getMonth()+1).padStart(2,'0')}-${date.getFullYear()}`;
  };

  const sortedFees = React.useMemo(() => [...fees].sort((a,b) => new Date(b.date)-new Date(a.date)), [fees]);

  const filteredFees = React.useMemo(() => {
    let result = sortedFees;
    if (filterType === 'vehicle') result = result.filter(f => String(f.refno||'').startsWith('VEHICLE'));
    else if (filterType === 'feeItem') result = result.filter(f => !String(f.refno||'').startsWith('VEHICLE'));
    if (search) result = result.filter(f =>
      (f.month||'').toLowerCase().includes(search.toLowerCase()) ||
      (f.refno||'').toLowerCase().includes(search.toLowerCase()) ||
      (f.remark||'').toLowerCase().includes(search.toLowerCase())
    );
    return result;
  }, [filterType, search, sortedFees]);

  const totalPages      = Math.max(1, Math.ceil(filteredFees.length / pageSize));
  const firstIndex      = (currentPage - 1) * pageSize;
  const lastIndex       = Math.min(filteredFees.length, firstIndex + pageSize);
  const paginatedFees   = filteredFees.slice(firstIndex, lastIndex);
  const totalDue        = filteredFees.reduce((sum,f) => sum + parseFloat(f.amount) + parseFloat(f.fine), 0);
  const selectedTotal   = selectedFees.reduce((sum, feeId) => {
    const fee = fees.find(f => f.id === feeId);
    return fee ? sum + parseFloat(fee.amount) + parseFloat(fee.fine) : sum;
  }, 0);
  const allOnPageSelected = paginatedFees.length > 0 && paginatedFees.every(f => selectedFees.includes(f.id));
  const someSelected      = selectedFees.length > 0;

  const handleFeeSelection    = (feeId) => setSelectedFees(prev => prev.includes(feeId) ? prev.filter(id => id !== feeId) : [...prev, feeId]);
  const handleSelectAllPage   = () => {
    if (allOnPageSelected) setSelectedFees(prev => prev.filter(id => !paginatedFees.find(f => f.id === id)));
    else setSelectedFees(prev => [...new Set([...prev, ...paginatedFees.map(f => f.id)])]);
  };
  const handlePaySelected     = () => { setPaymentFees(fees.filter(f => selectedFees.includes(f.id))); setShowPayment(true); };
  const handlePayAll          = () => { setPaymentFees(filteredFees); setShowPayment(true); };
  const handlePaymentSuccess  = (paymentData) => {
    setShowPayment(false);
    setSelectedFees([]);
    setPaymentMessage(`✅ Payment of ₹${paymentData.amount.toFixed(2)} completed! ID: ${paymentData.payment_id}`);
    setTimeout(() => setPaymentMessage(''), 5000);
  };
  const handlePaymentError    = (error) => {
    setShowPayment(false);
    setPaymentMessage(`❌ Payment failed: ${error}`);
    setTimeout(() => setPaymentMessage(''), 5000);
  };

  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // Fetch fees
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
          // ← ADD: get student name from API response
          if (feeList.length > 0 && feeList[0].student_name) {
            setStudentName(feeList[0].student_name.trim());
          }
        } else {
          setError(res.data.message || 'Unable to load fees.');
        }
      })
      .catch(err => setError(err.response?.data?.message || 'Unable to load fees.'))
      .finally(() => setLoading(false));
  }, [institutionId, admno]);

  // Fetch school/institution name
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
        <Navbar placeholder="Search pending fee records..." />
        <div className="dashboard-content">

          <section className="welcome-section">
            <div>
              <h2>Pending Fee — {studentName}</h2>
              <p>
                {institutionName && <><strong>{institutionName}</strong> &nbsp;|&nbsp; </>}
                Institution: {institutionId} &nbsp;|&nbsp; Admission No: {admno}
              </p>
            </div>
            <div className="fee-summary-banner">
              <span>Total Due</span>
              <strong>₹{totalDue.toFixed(2)}</strong>
            </div>
          </section>

          {paymentMessage && (
            <div className={`payment-message ${paymentMessage.startsWith('✅') ? 'success' : 'error'}`}>
              {paymentMessage}
            </div>
          )}

          <div className="top-filter-bar">
            <div className="table-filter">
              <label>Filter</label>
              <select value={filterType} onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}>
                <option value="all">All</option>
                <option value="vehicle">Vehicle</option>
                <option value="feeItem">Fee Item</option>
              </select>
            </div>
            <div className="table-filter">
              <label>Search</label>
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by Month, Ref No, Remark..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>
          </div>

          <div className="fee-table-card">
            {loading ? (
              <p style={{ padding: '20px' }}>Loading pending fees...</p>
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
                        <th><input type="checkbox" checked={allOnPageSelected} onChange={handleSelectAllPage} title="Select all on this page" /></th>
                        <th>No</th>
                        <th>Month/Term</th>
                        <th>Date</th>
                        <th>Ref No</th>
                        <th>Fine</th>
                        <th>Amount</th>
                        <th>Total</th>
                        <th>Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedFees.map((fee, index) => {
                        const feeTotal = parseFloat(fee.amount) + parseFloat(fee.fine);
                        const isSelected = selectedFees.includes(fee.id);
                        return (
                          <tr key={fee.id} className={isSelected ? 'selected-row' : ''} onClick={() => handleFeeSelection(fee.id)} style={{ cursor: 'pointer' }}>
                            <td onClick={e => e.stopPropagation()}>
                              <input type="checkbox" checked={isSelected} onChange={() => handleFeeSelection(fee.id)} />
                            </td>
                            <td>{firstIndex + index + 1}</td>
                            <td>{fee.month}</td>
                            <td>{formatDate(fee.date)}</td>
                            <td>{fee.refno}</td>
                            <td className="amount-cell">₹{Number(fee.fine).toFixed(2)}</td>
                            <td className="amount-cell">₹{Number(fee.amount).toFixed(2)}</td>
                            <td className="total-cell">₹{feeTotal.toFixed(2)}</td>
                            <td>{fee.remark || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="table-controls">
                  <div className="table-filter">
                    <label>Rows per page</label>
                    <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                      {[10,20,50,100].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="table-pagination">
                    <span>Showing {firstIndex+1}–{lastIndex} of {filteredFees.length}</span>
                    <div className="pagination-buttons">
                      <button disabled={currentPage===1} onClick={() => setCurrentPage(p=>p-1)}>Previous</button>
                      <button disabled={currentPage===totalPages} onClick={() => setCurrentPage(p=>p+1)}>Next</button>
                    </div>
                  </div>
                </div>

                <div className="bottom-action-bar">
                  <div className="bottom-left">
                    {someSelected && (
                      <button className="pay-selected-btn" onClick={handlePaySelected}>
                        ✅ Pay Selected
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
                      💰 Pay All Fees
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
          amount={paymentFees.reduce((sum,f) => sum + parseFloat(f.amount) + parseFloat(f.fine), 0)}
          institutionId={institutionId}
          institutionName={institutionName}  // ← ADD THIS
          admno={admno}
          studentName={studentName}
          feeItems={paymentFees}
          feeIds={paymentFees.map(f => f.id)}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
};

export default ParentPendingFee;
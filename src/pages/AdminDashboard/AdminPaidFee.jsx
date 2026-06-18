import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchAllPaidFees } from '../../services/api';
import { getCache, setCache } from '../../services/cache';
import './AdminPaidFee.scss';

const PaidFeeIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const AdminPaidFee = () => {
  const [fees, setFees] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterDiv, setFilterDiv] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const institutionId = localStorage.getItem('institutionId') || '';

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  };

  useEffect(() => {
    if (!institutionId) {
      setError('Institution ID missing. Please log in again.');
      setLoading(false);
      return;
    }
    const cacheKey = `paid_fees_${institutionId}`;
    const cached = getCache(cacheKey);
    if (cached) {
      setFees(cached);
      setLoading(false);
      return;
    }
    fetchAllPaidFees(institutionId)
      .then((res) => {
        if (res.data.status) {
          setCache(cacheKey, res.data.fees || []);
          setFees(res.data.fees || []);
        } else setError(res.data.message || 'Failed to load data.');
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load data.'))
      .finally(() => setLoading(false));
  }, [institutionId]);

  const filtered = fees
    .filter((f) => (filterClass ? f.student_class === filterClass : true) && (filterDiv ? f.div === filterDiv : true))
    .filter((f) =>
      f.admno.toLowerCase().includes(search.toLowerCase()) ||
      (f.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.particulars || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.refno || '').toLowerCase().includes(search.toLowerCase())
    );

  const classes = React.useMemo(() => [...new Set(fees.map((f) => f.student_class || '').filter(Boolean))].sort(), [fees]);
  const divisions = React.useMemo(() => [...new Set(fees.map((f) => f.div || '').filter(Boolean))].sort(), [fees]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const firstIndex = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(firstIndex, firstIndex + pageSize);
  const totalPaid = filtered.reduce((sum, f) => sum + parseFloat(f.amount), 0);

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="admin" />
      <main className="dashboard-main">
        <Navbar />
        <div className="paid-fee-page">

          {/* ── Header ── */}
          <div className="fee-header">
            <div className="fee-header-main">
              <div className="fee-header-icon"><PaidFeeIcon /></div>
              <div>
                <h1>Paid Fees — All Students</h1>
                <p>All paid fee records for your institution.</p>
              </div>
            </div>
            <div className="fee-stat-chip">
              <span>Total Paid</span>
              <strong>₹{totalPaid.toFixed(2)}</strong>
            </div>
          </div>

          {/* ── Filters ── */}
          <div className="fee-filter-bar">
            <div className="fee-filter">
              <label htmlFor="classFilter">Class</label>
              <select id="classFilter" value={filterClass} onChange={(e) => { setFilterClass(e.target.value); setCurrentPage(1); }}>
                <option value="">All Classes</option>
                {classes.map((cls, i) => <option key={i} value={cls}>{cls}</option>)}
              </select>
            </div>
            <div className="fee-filter">
              <label htmlFor="divFilter">Division</label>
              <select id="divFilter" value={filterDiv} onChange={(e) => { setFilterDiv(e.target.value); setCurrentPage(1); }}>
                <option value="">All Divisions</option>
                {divisions.map((div, i) => <option key={i} value={div}>{div}</option>)}
              </select>
            </div>
            <div className="fee-search">
              <SearchIcon />
              <input
                id="search"
                type="text"
                placeholder="Search by Adm No, Student Name, Particulars..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          {/* ── Table ── */}
          <div className="fee-table-card">
            {loading ? <div className="fee-empty">Loading...</div> : error ? <div className="fee-error">{error}</div> : filtered.length === 0 ? (
              <div className="fee-empty">No paid fee records found.</div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="fee-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Adm No</th>
                        <th>Student Name</th>
                        <th>Class</th>
                        <th>Div</th>
                        <th>Particulars</th>
                        <th>Date</th>
                        <th>Ref No</th>
                        <th>Amount</th>
                        <th>Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((fee, index) => (
                        <tr key={fee.id}>
                          <td className="fee-no-cell">{firstIndex + index + 1}</td>
                          <td className="fee-plain-cell">{fee.admno}</td>
                          <td className="fee-name-cell">{fee.student_name || '-'}</td>
                          <td className="fee-plain-cell">{fee.student_class || '-'}</td>
                          <td className="fee-plain-cell">{fee.div || '-'}</td>
                          <td className="fee-plain-cell">{fee.particulars || '-'}</td>
                          <td className="fee-plain-cell">{formatDate(fee.date)}</td>
                          <td className="fee-plain-cell">{fee.refno}</td>
                          <td className="paid-amount-cell">₹{Number(fee.amount).toFixed(2)}</td>
                          <td className="fee-plain-cell">{fee.remark || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="fee-table-controls">
                  <div className="fee-table-filter">
                    <label htmlFor="pageSize">Rows per page</label>
                    <select id="pageSize" className="fee-select" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                      {[20, 50, 100].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="fee-table-pagination">
                    <span>Showing {filtered.length === 0 ? 0 : firstIndex + 1}–{Math.min(filtered.length, firstIndex + pageSize)} of {filtered.length}</span>
                    <div className="fee-pagination-buttons">
                      <button type="button" className="secondary-btn" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>Previous</button>
                      <button type="button" className="secondary-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPaidFee;
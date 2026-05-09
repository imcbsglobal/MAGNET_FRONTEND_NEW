import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchAllPaidFees } from '../../services/api';
import { getCache, setCache } from '../../services/cache';
import '../SuperUserDashboard/SuperUserDashboard.scss';
import '../ParentDashboard/ParentPendingFee.scss';

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
        <div className="dashboard-content">
          <section className="welcome-section">
            <div>
              <h2>Paid Fees — All Students</h2>
              <p>All paid fee records for your institution.</p>
            </div>
            <div className="fee-summary-banner paid-banner">
              <span>Total Paid</span>
              <strong>₹{totalPaid.toFixed(2)}</strong>
            </div>
          </section>

          <div className="top-filter-bar">
            <div className="table-filter">
              <label htmlFor="classFilter">Class</label>
              <select id="classFilter" value={filterClass} onChange={(e) => { setFilterClass(e.target.value); setCurrentPage(1); }}>
                <option value="">All Classes</option>
                {classes.map((cls, i) => <option key={i} value={cls}>{cls}</option>)}
              </select>
            </div>
            <div className="table-filter">
              <label htmlFor="divFilter">Division</label>
              <select id="divFilter" value={filterDiv} onChange={(e) => { setFilterDiv(e.target.value); setCurrentPage(1); }}>
                <option value="">All Divisions</option>
                {divisions.map((div, i) => <option key={i} value={div}>{div}</option>)}
              </select>
            </div>
            <div className="table-filter">
              <label htmlFor="search">Search</label>
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  id="search"
                  type="text"
                  placeholder="Search by Adm No, Student Name, Particulars..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>
          </div>

          <div className="fee-table-card">
            {loading ? <p>Loading...</p> : error ? <div className="error-message">{error}</div> : filtered.length === 0 ? (
              <div className="empty-state"><p>No paid fee records found.</p></div>
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
                          <td>{firstIndex + index + 1}</td>
                          <td>{fee.admno}</td>
                          <td style={{ fontWeight: 600 }}>{fee.student_name || '-'}</td>
                          <td>{fee.student_class || '-'}</td>
                          <td>{fee.div || '-'}</td>
                          <td>{fee.particulars || '-'}</td>
                          <td>{formatDate(fee.date)}</td>
                          <td>{fee.refno}</td>
                          <td className="paid-amount-cell">₹{Number(fee.amount).toFixed(2)}</td>
                          <td>{fee.remark || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="table-controls">
                  <div className="table-filter">
                    <label htmlFor="pageSize">Rows per page</label>
                    <select id="pageSize" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                      {[20, 50, 100].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="table-pagination">
                    <span>Showing {filtered.length === 0 ? 0 : firstIndex + 1}–{Math.min(filtered.length, firstIndex + pageSize)} of {filtered.length}</span>
                    <div className="pagination-buttons">
                      <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>Previous</button>
                      <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</button>
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

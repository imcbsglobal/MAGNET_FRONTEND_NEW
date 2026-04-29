import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchAllPendingFees } from '../../services/api';
import { getCache, setCache } from '../../services/cache';
import '../SuperUserDashboard/SuperUserDashboard.scss';
import '../ParentDashboard/ParentPendingFee.scss';

const AdminPendingFee = () => {
  const [fees, setFees] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
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
    const cacheKey = `pending_fees_${institutionId}`;
    const cached = getCache(cacheKey);
    if (cached) {
      setFees(cached);
      setLoading(false);
      return;
    }
    fetchAllPendingFees(institutionId)
      .then((res) => {
        if (res.data.status) {
          setCache(cacheKey, res.data.fees || []);
          setFees(res.data.fees || []);
        } else setError(res.data.message || 'Failed to load data.');
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load data.'))
      .finally(() => setLoading(false));
  }, [institutionId]);

  const typeFiltered = React.useMemo(() => {
    if (filterType === 'vehicle') return fees.filter((f) => String(f.refno || '').startsWith('VEHICLE'));
    if (filterType === 'feeItem') return fees.filter((f) => !String(f.refno || '').startsWith('VEHICLE'));
    return fees;
  }, [filterType, fees]);

  const filtered = typeFiltered.filter((f) =>
    f.admno.toLowerCase().includes(search.toLowerCase()) ||
    (f.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.month || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.refno || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const firstIndex = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(firstIndex, firstIndex + pageSize);
  const totalDue = filtered.reduce((sum, f) => sum + parseFloat(f.amount) + parseFloat(f.fine), 0);

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="admin" />
      <main className="dashboard-main">
        <Navbar />
        <div className="dashboard-content">
          <section className="welcome-section">
            <div>
              <h2>Pending Fees — All Students</h2>
              <p>All pending fee records for your institution.</p>
            </div>
            <div className="fee-summary-banner">
              <span>Total Due</span>
              <strong>₹{totalDue.toFixed(2)}</strong>
            </div>
          </section>

          <div className="top-filter-bar">
            <div className="table-filter">
              <label htmlFor="feeFilter">Filter</label>
              <select
                id="feeFilter"
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">All</option>
                <option value="vehicle">Vehicle</option>
                <option value="feeItem">Fee Item</option>
              </select>
            </div>
            <div className="table-filter">
              <label htmlFor="search">Search</label>
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  id="search"
                  type="text"
                  placeholder="Search by Adm No, Student Name, Month..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>
          </div>

          <div className="fee-table-card">
            <div className="table-controls">
              <div className="table-filter">
                <label htmlFor="pageSize">Rows per page</label>
                <select id="pageSize" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                  {[20, 50, 100].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="table-pagination">
                <span>Showing {filtered.length === 0 ? 0 : firstIndex + 1} - {Math.min(filtered.length, firstIndex + pageSize)} of {filtered.length}</span>
                <div className="pagination-buttons">
                  <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>Previous</button>
                  <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</button>
                </div>
              </div>
            </div>

            {loading ? <p>Loading...</p> : error ? <div className="error-message">{error}</div> : filtered.length === 0 ? (
              <div className="empty-state"><p>No pending fee records found.</p></div>
            ) : (
              <div className="table-responsive">
                <table className="fee-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Adm No</th>
                      <th>Student Name</th>
                      <th>Class</th>
                      <th>Div</th>
                      <th>Month/Term</th>
                      <th>Date</th>
                      <th>Ref No</th>
                      <th>Fine</th>
                      <th>Amount</th>
                      <th>Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((fee, index) => (
                      <tr key={fee.id}>
                        <td>{firstIndex + index + 1}</td>
                        <td>{fee.admno}</td>
                        <td>{fee.student_name || '-'}</td>
                        <td>{fee.student_class || '-'}</td>
                        <td>{fee.div || '-'}</td>
                        <td>{fee.month}</td>
                        <td>{formatDate(fee.date)}</td>
                        <td>{fee.refno}</td>
                        <td className="amount-cell">₹{Number(fee.fine).toFixed(2)}</td>
                        <td className="amount-cell">₹{Number(fee.amount).toFixed(2)}</td>
                        <td>{fee.remark || '-'}</td>
                      </tr>
                    ))}
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

export default AdminPendingFee;

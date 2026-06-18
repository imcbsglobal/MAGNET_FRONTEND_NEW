import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchPaidFees } from '../../services/api';
import './ParentPaidFee.scss';

const PaidFeeIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const ParentPaidFee = () => {
  const [fees, setFees] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');

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
    if (!search) return sortedFees;
    return sortedFees.filter((fee) =>
      (fee.particulars || '').toLowerCase().includes(search.toLowerCase()) ||
      (fee.refno || '').toLowerCase().includes(search.toLowerCase()) ||
      (fee.remark || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [search, sortedFees]);

  const totalPaid = filteredFees.reduce((sum, f) => sum + parseFloat(f.amount), 0);
  const totalPages = Math.max(1, Math.ceil(filteredFees.length / pageSize));
  const firstIndex = (currentPage - 1) * pageSize;
  const lastIndex = Math.min(filteredFees.length, firstIndex + pageSize);
  const paginatedFees = filteredFees.slice(firstIndex, lastIndex);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

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
        <div className="ppaid-page">

          {/* ── Header ── */}
          <div className="ppaid-header">
            <div className="ppaid-header-main">
              <div className="ppaid-header-icon"><PaidFeeIcon /></div>
              <div>
                <h1>Paid Fee for {studentName}</h1>
                <p>Showing paid fee records for institution ID {institutionId} and admission number {admno}.</p>
              </div>
            </div>
            <div className="ppaid-stat-chip">
              <span>Total Paid</span>
              <strong>₹{totalPaid.toFixed(2)}</strong>
            </div>
          </div>

          {/* ── Filters ── */}
          <div className="ppaid-filter-bar">
            <div className="ppaid-search">
              <SearchIcon />
              <input
                id="search"
                type="text"
                placeholder="Search by Particulars, Ref No, Remark..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          {/* ── Table ── */}
          <div className="ppaid-table-card">
            {loading ? (
              <div className="ppaid-empty">Loading paid fees...</div>
            ) : error ? (
              <div className="ppaid-error">{error}</div>
            ) : sortedFees.length === 0 ? (
              <div className="ppaid-empty">No paid fee records found.</div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="ppaid-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Particulars</th>
                        <th>Date</th>
                        <th>Ref No</th>
                        <th>Amount</th>
                        <th>Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedFees.map((fee, index) => (
                        <tr key={fee.id}>
                          <td className="ppaid-no-cell">{firstIndex + index + 1}</td>
                          <td className="ppaid-plain-cell">{fee.particulars || '-'}</td>
                          <td className="ppaid-plain-cell">{formatDate(fee.date)}</td>
                          <td className="ppaid-plain-cell">{fee.refno}</td>
                          <td className="ppaid-amount-cell">₹{Number(fee.amount).toFixed(2)}</td>
                          <td className="ppaid-plain-cell">{fee.remark || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="ppaid-table-controls">
                  <div className="ppaid-table-filter">
                    <label htmlFor="pageSize">Rows per page</label>
                    <select id="pageSize" className="ppaid-select" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                      {[10, 20, 50, 100].map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  <div className="ppaid-table-pagination">
                    <span>Showing {filteredFees.length === 0 ? 0 : firstIndex + 1}–{lastIndex} of {filteredFees.length}</span>
                    <div className="ppaid-pagination-buttons">
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
    </div>
  );
};

export default ParentPaidFee;
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchPendingFees } from '../../services/api';
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
        <div className="dashboard-content">
          <section className="welcome-section">
            <div>
              <h2>Pending Fee for {studentName}</h2>
              <p>Showing fee records linked to institution ID {institutionId} and admission number {admno}.</p>
            </div>
            <div className="fee-summary-banner">
              <span>Total Due</span>
              <strong>₹{totalDue.toFixed(2)}</strong>
            </div>
          </section>

          <div className="top-filter-bar">
            <div className="table-filter">
              <label htmlFor="feeFilter">Filter</label>
              <select id="feeFilter" value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}>
                <option value="all">All</option>
                <option value="vehicle">Vehicle</option>
                <option value="feeItem">Fee item</option>
              </select>
            </div>
            <div className="table-filter">
              <label htmlFor="search">Search</label>
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  id="search"
                  type="text"
                  placeholder="Search by Month, Ref No, Remark..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>
          </div>

          <div className="fee-table-card">
            {loading ? (
              <p>Loading pending fees...</p>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : filteredFees.length === 0 ? (
              <div className="empty-state">
                <p>No pending fee records found for this filter.</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="fee-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Month/Term</th>
                        <th>Date</th>
                        <th>Ref No</th>
                        <th>Fine</th>
                        <th>Amount</th>
                        <th>Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedFees.map((fee, index) => (
                        <tr key={fee.id}>
                          <td>{firstIndex + index + 1}</td>
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
                <div className="table-controls">
                  <div className="table-filter">
                    <label htmlFor="pageSize">Rows per page</label>
                    <select id="pageSize" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                      {[10, 20, 50, 100].map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  <div className="table-pagination">
                    <span>Showing {filteredFees.length === 0 ? 0 : firstIndex + 1}–{lastIndex} of {filteredFees.length}</span>
                    <div className="pagination-buttons">
                      <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>Previous</button>
                      <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}>Next</button>
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

export default ParentPendingFee;

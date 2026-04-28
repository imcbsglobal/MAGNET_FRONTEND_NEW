import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchPaidFees } from '../../services/api';
import '../SuperUserDashboard/SuperUserDashboard.scss';
import './ParentPendingFee.scss';

const ParentPaidFee = () => {
  const [fees, setFees] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const institutionId = localStorage.getItem('institutionId') || '';
  const admno = localStorage.getItem('admno') || '';
  const studentName = localStorage.getItem('studentName') || 'Student';

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const sortedFees = React.useMemo(() => {
    return [...fees].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [fees]);

  const totalPages = Math.max(1, Math.ceil(sortedFees.length / pageSize));
  const firstIndex = (currentPage - 1) * pageSize;
  const lastIndex = Math.min(sortedFees.length, firstIndex + pageSize);
  const paginatedFees = sortedFees.slice(firstIndex, lastIndex);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
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
          setTotalPaid(response.data.total_paid || 0);
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
        <div className="dashboard-content">
          <section className="welcome-section">
            <div>
              <h2>Paid Fee for {studentName}</h2>
              <p>Showing paid fee records for institution ID {institutionId} and admission number {admno}.</p>
            </div>
            <div className="fee-summary-banner paid-banner">
              <span>Total Paid</span>
              <strong>₹{Number(totalPaid).toFixed(2)}</strong>
            </div>
          </section>

          <div className="fee-table-card">
            <div className="table-controls">
              <div className="table-filter">
                <label htmlFor="pageSize">Rows per page</label>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              <div className="table-pagination">
                <span>
                  Showing {sortedFees.length === 0 ? 0 : firstIndex + 1} - {lastIndex} of {sortedFees.length}
                </span>
                <div className="pagination-buttons">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <p>Loading paid fees...</p>
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
                        <td>{firstIndex + index + 1}</td>
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
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ParentPaidFee;

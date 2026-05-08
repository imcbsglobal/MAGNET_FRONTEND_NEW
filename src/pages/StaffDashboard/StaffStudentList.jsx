import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchStudentsByClassDivision } from '../../services/api';
import '../SuperUserDashboard/SuperUserDashboard.scss';
import '../ParentDashboard/ParentPendingFee.scss';

const StaffStudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const institutionId = localStorage.getItem('institutionId') || '';
  const assignedClass = localStorage.getItem('assignedClass') || '';
  const assignedDivision = localStorage.getItem('assignedDivision') || '';

  useEffect(() => {
    if (!institutionId || !assignedClass || !assignedDivision) {
      setError('No class or division assigned to your account. Please contact your administrator.');
      setLoading(false);
      return;
    }
    fetchStudentsByClassDivision(institutionId, assignedClass, assignedDivision)
      .then((res) => setStudents(res.data))
      .catch(() => setError('Failed to load student data.'))
      .finally(() => setLoading(false));
  }, [institutionId, assignedClass, assignedDivision]);

  const filtered = students.filter((s) =>
    (s.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.admno || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.fathername || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.mobile || '').includes(search)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const firstIndex = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(firstIndex, firstIndex + pageSize);

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="teacher" />
      <main className="dashboard-main">
        <Navbar />
        <div className="dashboard-content">

          <section className="welcome-section">
            <div>
              <h2>Student List</h2>
              <p>Class: <strong>{assignedClass || '—'}</strong> &nbsp;|&nbsp; Division: <strong>{assignedDivision || '—'}</strong></p>
            </div>
            <div className="fee-summary-banner paid-banner">
              <span>Total Students</span>
              <strong>{filtered.length}</strong>
            </div>
          </section>

          <div className="top-filter-bar">
            <div className="table-filter">
              <label htmlFor="search">Search</label>
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input id="search" type="text" placeholder="Search by name, adm no, father name, mobile..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
              </div>
            </div>
          </div>

          <div className="fee-table-card">
            {loading ? <p style={{ padding: '20px' }}>Loading...</p>
              : error ? <div className="error-message">{error}</div>
              : filtered.length === 0 ? <div className="empty-state"><p>No students found.</p></div>
              : (
                <>
                  <div className="table-responsive">
                    <table className="fee-table">
                      <thead>
                        <tr>
                          <th>No</th><th>Adm No</th><th>Student Name</th><th>Class</th><th>Div</th>
                          <th>Mobile</th><th>Father Name</th><th>Mother Name</th><th>Address</th>
                          <th>Place</th><th>Ref No</th><th>Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map((s, index) => (
                          <tr key={s.admno + index}>
                            <td>{firstIndex + index + 1}</td>
                            <td>{s.admno}</td>
                            <td style={{ fontWeight: 600 }}>{s.student_name}</td>
                            <td>{s.student_class}</td>
                            <td>{s.div}</td>
                            <td>{s.mobile || '-'}</td>
                            <td>{s.fathername || '-'}</td>
                            <td>{s.mothername || '-'}</td>
                            <td style={{ maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.address || '-'}</td>
                            <td>{s.place || '-'}</td>
                            <td>{s.refno || '-'}</td>
                            <td>{s.remark || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="table-controls">
                    <div className="table-filter">
                      <label>Rows per page</label>
                      <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                        {[10, 20, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="table-pagination">
                      <span>Showing {filtered.length === 0 ? 0 : firstIndex + 1}–{Math.min(filtered.length, firstIndex + pageSize)} of {filtered.length}</span>
                      <div className="pagination-buttons">
                        <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
                        <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
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

export default StaffStudentList;

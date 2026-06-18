import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchAllStudents } from '../../services/api';
import './AdminStudentList.scss';

const StudentIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10 12 5 2 10l10 5 10-5z" />
    <path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const AdminStudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterDiv, setFilterDiv] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const institutionId = localStorage.getItem('institutionId') || '';

  useEffect(() => {
    if (!institutionId) { setError('Institution ID missing. Please log in again.'); setLoading(false); return; }
    fetchAllStudents(institutionId)
      .then((res) => setStudents(res.data))
      .catch(() => setError('Failed to load student data.'))
      .finally(() => setLoading(false));
  }, [institutionId]);

  const classes = [...new Set(students.map(s => s.student_class).filter(Boolean))].sort();
  const divisions = [...new Set(students.map(s => s.div).filter(Boolean))].sort();

  const filtered = students.filter((s) => {
    const matchSearch =
      (s.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.admno || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.fathername || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.mobile || '').includes(search);
    return matchSearch && (filterClass ? s.student_class === filterClass : true) && (filterDiv ? s.div === filterDiv : true);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const firstIndex = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(firstIndex, firstIndex + pageSize);

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="admin" />
      <main className="dashboard-main">
        <Navbar />
        <div className="student-list-page">

          {/* ── Header ── */}
          <div className="student-header">
            <div className="student-header-main">
              <div className="student-header-icon"><StudentIcon /></div>
              <div>
                <h1>Student List</h1>
                <p>All students under your institution.</p>
              </div>
            </div>
            <div className="student-stat-chip">
              <span>Total Students</span>
              <strong>{filtered.length}</strong>
            </div>
          </div>

          {/* ── Filters ── */}
          <div className="student-filter-bar">
            <div className="student-filter">
              <label>Class</label>
              <select value={filterClass} onChange={(e) => { setFilterClass(e.target.value); setCurrentPage(1); }}>
                <option value="">All Classes</option>
                {classes.map((c, i) => <option key={i} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="student-filter">
              <label>Division</label>
              <select value={filterDiv} onChange={(e) => { setFilterDiv(e.target.value); setCurrentPage(1); }}>
                <option value="">All Divisions</option>
                {divisions.map((d, i) => <option key={i} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="student-search">
              <SearchIcon />
              <input
                id="search"
                type="text"
                placeholder="Search by name, adm no, father name, mobile..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          {/* ── Table ── */}
          <div className="student-table-card">
            {loading ? <div className="student-empty">Loading...</div>
              : error ? <div className="student-error">{error}</div>
              : filtered.length === 0 ? <div className="student-empty">No students found.</div>
              : (
                <>
                  <div className="table-responsive">
                    <table className="student-table">
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
                            <td className="student-no-cell">{firstIndex + index + 1}</td>
                            <td className="student-plain-cell">{s.admno}</td>
                            <td className="student-name-cell">{s.student_name}</td>
                            <td className="student-plain-cell">{s.student_class}</td>
                            <td className="student-plain-cell">{s.div}</td>
                            <td className="student-plain-cell">{s.mobile || '-'}</td>
                            <td className="student-plain-cell">{s.fathername || '-'}</td>
                            <td className="student-plain-cell">{s.mothername || '-'}</td>
                            <td className="student-address-cell">{s.address || '-'}</td>
                            <td className="student-plain-cell">{s.place || '-'}</td>
                            <td className="student-plain-cell">{s.refno || '-'}</td>
                            <td className="student-plain-cell">{s.remark || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="student-table-controls">
                    <div className="student-table-filter">
                      <label>Rows per page</label>
                      <select
                        className="student-select"
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                      >
                        {[10, 20, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="student-table-pagination">
                      <span>Showing {filtered.length === 0 ? 0 : firstIndex + 1}–{Math.min(filtered.length, firstIndex + pageSize)} of {filtered.length}</span>
                      <div className="student-pagination-buttons">
                        <button type="button" className="secondary-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
                        <button type="button" className="secondary-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
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

export default AdminStudentList;
import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchIDCardStudents, sendIDCardLink, bulkSendIDCardLinks } from '../../services/api';
import './IDCard.scss';

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const DETAIL_LABELS = {
  student_name: 'Student Name',
  father_name:  'Father Name',
  mother_name:  'Mother Name',
  dob:          'Date of Birth',
  phone:        'Phone',
  email:        'Email',
  place:        'Place',
  district:     'District',
  city:         'City',
  state:        'State',
  pin:          'PIN Code',
};

const IDCardDetails = () => {
  const institutionId   = localStorage.getItem('institutionId')   || '';
  const assignedClass   = localStorage.getItem('assignedClass')   || '';
  const assignedDivision = localStorage.getItem('assignedDivision') || '';

  const [students, setStudents]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [search, setSearch]               = useState('');
  const [sending, setSending]             = useState(false);
  const [viewStudent, setViewStudent]     = useState(null); // modal data

  const loadStudents = async () => {
    if (!institutionId) {
      setError('Institution ID is missing. Please log in again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetchIDCardStudents(institutionId, assignedClass, assignedDivision);
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load ID card student list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStudents(); }, [institutionId, assignedClass, assignedDivision]);

  const handleSendLink = async (admno) => {
    setSending(true);
    setStatusMessage('');
    try {
      await sendIDCardLink({ institution_id: institutionId, admno });
      setStatusMessage(`WhatsApp link sent for ${admno}.`);
      loadStudents();
    } catch (err) {
      setStatusMessage(err.response?.data?.message || 'Failed to send link.');
    } finally {
      setSending(false);
    }
  };

  const handleBulkSend = async () => {
    setSending(true);
    setStatusMessage('');
    try {
      const res = await bulkSendIDCardLinks({ institution_id: institutionId, student_class: assignedClass, div: assignedDivision });
      setStatusMessage(`Bulk send completed: ${res.data.sent_count || 0} links sent.`);
      loadStudents();
    } catch (err) {
      setStatusMessage(err.response?.data?.message || 'Bulk send failed.');
    } finally {
      setSending(false);
    }
  };

  const filtered = students.filter((s) =>
    (s.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.admno        || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.fathername   || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.mobile       || '').includes(search)
  );

  const statusBadge = (status) => {
    if (status === 'used')    return <span className="badge badge--green">Submitted</span>;
    if (status === 'pending') return <span className="badge badge--yellow">Pending</span>;
    return <span className="badge badge--gray">Not sent</span>;
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="teacher" />
      <main className="dashboard-main">
        <Navbar />
        <div className="idcard-page">

          {/* Header */}
          <div className="idcard-header">
            <div>
              <h1>ID Card Details</h1>
              <p>Send one-time WhatsApp links so parents can enter the student's ID card information.</p>
            </div>
            <div className="idcard-actions">
              <button type="button" className="primary-btn" onClick={handleBulkSend} disabled={sending || loading}>
                {sending ? 'Sending...' : 'Bulk Send Links'}
              </button>
              <button type="button" className="secondary-btn" onClick={loadStudents} disabled={loading}>
                Refresh List
              </button>
            </div>
          </div>

          {statusMessage && <div className="idcard-status">{statusMessage}</div>}
          {error         && <div className="idcard-error">{error}</div>}

          {/* Search */}
          <div className="idcard-search-bar">
            <input
              type="text"
              value={search}
              placeholder="Search by student, adm no, father name, or mobile"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="idcard-table-card">
            {loading ? (
              <div className="idcard-empty">Loading students...</div>
            ) : filtered.length === 0 ? (
              <div className="idcard-empty">No students found.</div>
            ) : (
              <div className="table-responsive">
                <table className="idcard-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Adm No</th>
                      <th>Student</th>
                      <th>Class</th>
                      <th>Div</th>
                      <th>Mobile</th>
                      <th>Status</th>
                      <th>Send Link</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((student, index) => (
                      <tr key={`${student.admno}-${index}`}>
                        <td>{index + 1}</td>
                        <td>{student.admno}</td>
                        <td>{student.student_name}</td>
                        <td>{student.student_class}</td>
                        <td>{student.div}</td>
                        <td>{student.mobile || '-'}</td>
                        <td>{statusBadge(student.link_status)}</td>
                        <td>
                          <button
                            type="button"
                            className="action-btn whatsapp-btn"
                            onClick={() => handleSendLink(student.admno)}
                            disabled={sending || !student.mobile}
                            title={student.mobile ? 'Send WhatsApp link' : 'Missing mobile number'}
                          >
                            📱
                          </button>
                        </td>
                        <td>
                          {student.parent_submitted && (
                            <button
                              type="button"
                              className="action-btn eye-btn"
                              onClick={() => setViewStudent(student)}
                              title="View submitted details"
                            >
                              <EyeIcon />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Details Modal */}
      {viewStudent && (
        <div className="modal-overlay" onClick={() => setViewStudent(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{viewStudent.student_name}</h2>
                <span className="modal-admno">{viewStudent.admno}</span>
              </div>
              <button className="modal-close" onClick={() => setViewStudent(null)}>✕</button>
            </div>
            <div className="modal-body">
              {Object.entries(DETAIL_LABELS).map(([key, label]) => (
                viewStudent.details?.[key] ? (
                  <div className="modal-row" key={key}>
                    <span className="modal-label">{label}</span>
                    <span className="modal-value">{viewStudent.details[key]}</span>
                  </div>
                ) : null
              ))}
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setViewStudent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IDCardDetails;

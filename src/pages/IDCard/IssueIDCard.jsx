import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchIDCardStudents, sendIDCardLink, bulkSendIDCardLinks, fetchIDCardSubmission, updateIDCardSubmission } from '../../services/api';
import './IDCard.scss';

const IssueIDCard = () => {
  const institutionId = localStorage.getItem('institutionId') || '';
  const assignedClass = localStorage.getItem('assignedClass') || '';
  const assignedDivision = localStorage.getItem('assignedDivision') || '';
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [sending, setSending] = useState(false);

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
      console.error('IssueIDCard loadStudents error', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to load issue list.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [institutionId, assignedClass, assignedDivision]);

  const handleSendLink = async (admno) => {
    setSending(true);
    setStatusMessage('');
    try {
      await sendIDCardLink({ institution_id: institutionId, admno });
      setStatusMessage(`Link sent for ${admno}.`);
      loadStudents();
    } catch (err) {
      setStatusMessage(err.response?.data?.message || 'Unable to send link.');
    } finally {
      setSending(false);
    }
  };

  const handleBulkSend = async () => {
    setSending(true);
    setStatusMessage('');
    try {
      const res = await bulkSendIDCardLinks({ institution_id: institutionId, student_class: assignedClass, div: assignedDivision });
      setStatusMessage(`${res.data.sent_count || 0} links sent.`);
      loadStudents();
    } catch (err) {
      setStatusMessage(err.response?.data?.message || 'Bulk send failed.');
    } finally {
      setSending(false);
    }
  };

  const handleEditClick = async (student) => {
    setError('');
    setStatusMessage('');
    if (!student.form_id) {
      setStatusMessage('Parent has not submitted details yet.');
      return;
    }
    try {
      const res = await fetchIDCardSubmission(institutionId, student.admno);
      setEditing(student.admno);
      setEditForm({ ...res.data });
    } catch (err) {
      setError('Failed to load submission details.');
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSending(true);
    setStatusMessage('');
    try {
      await updateIDCardSubmission(editForm.id, editForm);
      setStatusMessage('Parent details updated successfully.');
      setEditing(null);
      loadStudents();
    } catch (err) {
      setStatusMessage(err.response?.data?.message || 'Failed to update details.');
    } finally {
      setSending(false);
    }
  };

  const filtered = students.filter((s) =>
    (s.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.admno || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.fathername || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.mobile || '').includes(search)
  );

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="teacher" />
      <main className="dashboard-main">
        <Navbar />
        <div className="idcard-page">
          <div className="idcard-header">
            <div>
              <h1>Issue ID Card</h1>
              <p>Manage parent submissions, regenerate a one-time link, and edit submitted details.</p>
            </div>
            <div className="idcard-actions">
              <button type="button" className="primary-btn" onClick={handleBulkSend} disabled={sending || loading}>
                {sending ? 'Sending...' : 'Bulk Send Links'}
              </button>
              <button type="button" className="secondary-btn" onClick={loadStudents} disabled={loading}>
                Refresh
              </button>
            </div>
          </div>

          {statusMessage && <div className="idcard-status">{statusMessage}</div>}
          {error && <div className="idcard-error">{error}</div>}

          <div className="idcard-search-bar">
            <input
              type="text"
              value={search}
              placeholder="Search by student, adm no, father name, or mobile"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

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
                      <th>Mobile</th>
                      <th>Submission</th>
                      <th>Link Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((student, index) => (
                      <tr key={`${student.admno}-${index}`}>
                        <td>{index + 1}</td>
                        <td>{student.admno}</td>
                        <td>{student.student_name}</td>
                        <td>{student.mobile || '-'}</td>
                        <td>{student.parent_submitted ? 'Yes' : 'No'}</td>
                        <td>{student.link_status}</td>
                        <td className="idcard-actions-cell">
                          <button
                            type="button"
                            className="action-btn whatsapp-btn"
                            onClick={() => handleSendLink(student.admno)}
                            disabled={sending || !student.mobile}
                          >
                            🔁
                          </button>
                          <button
                            type="button"
                            className="action-btn edit-btn"
                            onClick={() => handleEditClick(student)}
                            disabled={!student.parent_submitted}
                          >
                            ✏️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {editing && (
            <div className="idcard-edit-panel">
              <h2>Edit Parent Details</h2>
              <div className="idcard-edit-grid">
                {['student_name', 'place', 'district', 'city', 'state', 'pin', 'phone', 'email', 'father_name', 'mother_name', 'dob'].map((field) => (
                  <div className="idcard-field" key={field}>
                    <label>{field.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</label>
                    <input
                      name={field}
                      value={editForm[field] || ''}
                      onChange={handleEditChange}
                      type={field === 'dob' ? 'date' : 'text'}
                    />
                  </div>
                ))}
              </div>
              <div className="idcard-edit-actions">
                <button type="button" className="primary-btn" onClick={handleSaveEdit} disabled={sending}>Save</button>
                <button type="button" className="secondary-btn" onClick={() => setEditing(null)} disabled={sending}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default IssueIDCard;

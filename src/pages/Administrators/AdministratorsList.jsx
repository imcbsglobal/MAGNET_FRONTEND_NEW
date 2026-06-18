// AdministratorsList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdministrators, deleteAdministrator, api } from '../../services/api';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './Administrators.scss';

const AdministratorsList = () => {
  const [administrators, setAdministrators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // --- Payment modal state ---
  const [paymentModal, setPaymentModal] = useState(null); // null | { id, gateway, key, secret }
  const [paymentLoading, setPaymentLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => { loadAdministrators(); }, []);

  const loadAdministrators = async () => {
    try {
      const response = await fetchAdministrators();
      setAdministrators(response.data);
    } catch (err) {
      console.error('Failed to fetch administrators:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => { setDeleteId(id); setShowDeleteConfirm(true); };

  const confirmDelete = async () => {
    try {
      await deleteAdministrator(deleteId);
      setAdministrators(administrators.filter(a => a.id !== deleteId));
      setShowDeleteConfirm(false);
    } catch (err) { alert('Failed to delete administrator'); }
  };

  // Open payment modal pre-filled with existing data
  const handlePaymentClick = async (administrator) => {
    try {
      const response = await api.get(
        `payments/config/${administrator.institution_id}/`
      );

      const data = response.data;

      setPaymentModal({
        id: administrator.id,
        institution_id: administrator.institution_id,
        payment_gateway: data.payment_gateway || "easebuzz",
        gateway_key: data.gateway_key || "",
        gateway_secret: data.gateway_secret || "",
      });
    } catch (err) {
      alert("Failed to load payment details");
    }
  };

  const handlePaymentChange = (e) => {
    setPaymentModal(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePaymentSave = async () => {
    setPaymentLoading(true);

    try {
      await api.post("payments/config/save/", {
        institution_id: paymentModal.institution_id,
        payment_gateway: paymentModal.payment_gateway,
        gateway_key: paymentModal.gateway_key,
        gateway_secret: paymentModal.gateway_secret,
      });

      alert("Payment configuration saved successfully");
      setPaymentModal(null);
    } catch (err) {
      alert("Failed to save payment configuration");
    } finally {
      setPaymentLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(administrators.length / pageSize));
  const firstIndex = (currentPage - 1) * pageSize;
  const paginated = administrators.slice(firstIndex, firstIndex + pageSize);

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="superuser" />
      <main className="dashboard-main">
        <Navbar placeholder="Search customers..." />
        <div className="admins-page-container">
          <header className="page-header">
            <div className="header-left">
              <h1>Administrator Management</h1>
              <p>View and manage all school administrators</p>
            </div>
            <button className="add-btn" onClick={() => navigate('/administrators/add')}>+ Add New Administrator</button>
          </header>

          <div className="table-card">
            {loading ? <div className="loader" style={{ padding: '20px' }}>Loading...</div> : (
              <>
                <div className="table-responsive">
                  <table className="admins-table">
                    <thead>
                      <tr>
                        <th>No.</th>
                        <th>School Details</th>
                        <th>Contact Info</th>
                        <th>Location</th>
                        <th>Institution ID</th>
                        <th>Credentials</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((administrator, index) => (
                        <tr key={administrator.id}>
                          <td>{firstIndex + index + 1}</td>
                          <td>
                            <div className="school-info">
                              <span className="school-name">{administrator.school_name}</span>
                              <span className="address-snippet">{administrator.address}</span>
                            </div>
                          </td>
                          <td>
                            <div className="contact-info">
                              <span>{administrator.email}</span>
                              <span className="phone">{administrator.phone_number}</span>
                            </div>
                          </td>
                          <td>
                            <div className="location-info">
                              <span>{administrator.city}, {administrator.district}</span>
                              <span className="state-pin">{administrator.state} - {administrator.pincode}</span>
                            </div>
                          </td>
                          <td><span className="badge">{administrator.institution_id}</span></td>
                          <td>
                            <div className="credential-info">
                              <span>user: {administrator.username}</span>
                              <span className="password">pass: {administrator.password}</span>
                            </div>
                          </td>
                          <td>
                            <div className="action-btns">
                              <button
                                className="edit-btn"
                                onClick={() => navigate(`/administrators/edit/${administrator.id}`)}
                              >
                                Edit
                              </button>

                              <button
                                className={`payment-btn ${!administrator.has_payment ? 'disabled' : ''}`}
                                onClick={() => administrator.has_payment && handlePaymentClick(administrator)}
                                disabled={!administrator.has_payment}
                                title={!administrator.has_payment ? 'Payment not enabled for this school' : 'Manage payment gateway'}
                              >
                                Payment
                              </button>

                              <button
                                className="delete-btn"
                                onClick={() => handleDeleteClick(administrator.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
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
                    <span>Showing {administrators.length === 0 ? 0 : firstIndex + 1}–{Math.min(administrators.length, firstIndex + pageSize)} of {administrators.length}</span>
                    <div className="pagination-buttons">
                      <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
                      <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <ConfirmModal isOpen={showDeleteConfirm} title="Delete Administrator" message="Are you sure you want to delete this school administrator? This action cannot be undone." onConfirm={confirmDelete} onCancel={() => setShowDeleteConfirm(false)} confirmText="Delete" type="danger" />

          {/* ── Payment Gateway Modal ── */}
          {paymentModal && (
            <div className="modal-overlay" onClick={() => setPaymentModal(null)}>
              <div className="payment-modal" onClick={e => e.stopPropagation()}>
                <div className="payment-modal-header">
                  <h2>💳 Payment Gateway</h2>
                  <button className="modal-close-btn" onClick={() => setPaymentModal(null)}>✕</button>
                </div>

                <div className="payment-modal-body">
                  <div className="form-group">
                    <label>Payment Gateway</label>
                    <select
                      name="payment_gateway"
                      value={paymentModal.payment_gateway}
                      onChange={handlePaymentChange}
                    >
                      <option value="easebuzz">Easebuzz</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Easebuzz Key</label>
                    <input
                      type="text"
                      name="gateway_key"
                      value={paymentModal.gateway_key}
                      onChange={handlePaymentChange}
                      placeholder="Enter Easebuzz Key"
                    />
                  </div>

                  <div className="form-group">
                    <label>Easebuzz Salt</label>
                    <input
                      type="text"
                      name="gateway_secret"
                      value={paymentModal.gateway_secret}
                      onChange={handlePaymentChange}
                      placeholder="Enter Easebuzz Salt"
                    />
                  </div>
                </div>

                <div className="payment-modal-footer">
                  <button className="modal-cancel-btn" onClick={() => setPaymentModal(null)}>Cancel</button>
                  <button className="modal-save-btn" onClick={handlePaymentSave} disabled={paymentLoading}>
                    {paymentLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdministratorsList;
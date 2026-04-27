import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdministrators, deleteAdministrator } from '../../services/api';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './Administrators.scss';

const AdministratorsList = () => {
  const [administrators, setAdministrators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadAdministrators();
  }, []);

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

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteAdministrator(deleteId);
      setAdministrators(administrators.filter(a => a.id !== deleteId));
      setShowDeleteConfirm(false);
    } catch (err) {
      alert('Failed to delete administrator');
    }
  };


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
            <button className="add-btn" onClick={() => navigate('/administrators/add')}>
              + Add New Administrator
            </button>
          </header>

          <div className="table-card">
            {loading ? (
              <div className="loader">Loading...</div>
            ) : (
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
                    {administrators.map((administrator, index) => (
                      <tr key={administrator.id}>
                        <td>{index + 1}</td>
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
                            <span className="username">user: {administrator.username}</span>
                            <span className="password">pass: {administrator.password}</span>
                          </div>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button className="edit-btn" onClick={() => navigate(`/administrators/edit/${administrator.id}`)}>Edit</button>
                            <button className="delete-btn" onClick={() => handleDeleteClick(administrator.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <ConfirmModal 
        isOpen={showDeleteConfirm}
        title="Delete Administrator"
        message="Are you sure you want to delete this school administrator? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete"
        type="danger"
      />
    </div>

      </main>
    </div>
  );
};

export default AdministratorsList;

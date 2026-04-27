import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createJobCategory, fetchJobCategoryById, updateJobCategory } from '../../services/api';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import '../Administrators/Administrators.scss';

const JobCategoryAdd = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const institutionId = localStorage.getItem('institutionId');

  useEffect(() => {
    if (isEdit) {
      loadCategory();
    }
  }, [id]);

  const loadCategory = async () => {
    try {
      const response = await fetchJobCategoryById(id);
      setName(response.data.name);
    } catch (err) {
      console.error('Failed to fetch category:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (!institutionId) {
      alert('Session error: No Institution ID found. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await updateJobCategory(id, { name: name });
      } else {
        await createJobCategory({
          name: name,
          institution_id: institutionId
        });
      }
      navigate('/admin/job-categories');
    } catch (err) {
      alert(`Failed to ${isEdit ? 'update' : 'add'} category`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="admin" />
      
      <main className="dashboard-main">
        <Navbar placeholder="Search settings..." />
        <div className="admin-form-container">
          <header className="page-header">
            <div className="header-left">
              <h1>{isEdit ? 'Edit Job Category' : 'Add Job Category'}</h1>
              <p>{isEdit ? 'Update existing category' : 'Create a new category for your school services'}</p>
            </div>
            <button className="back-btn" onClick={() => navigate('/admin/job-categories')}>
              Back to List
            </button>
          </header>

          <div className="form-card" style={{ maxWidth: '600px' }}>
            <form onSubmit={handleSubmit}>
              <div className="form-group full-width">
                <label>Category Name</label>
                <input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter category name (e.g. Teaching, Maintenance)"
                  required
                  autoFocus
                />
              </div>

              <div className="form-actions" style={{ marginTop: '30px' }}>
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Saving...' : (isEdit ? 'Update Category' : 'Save Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JobCategoryAdd;

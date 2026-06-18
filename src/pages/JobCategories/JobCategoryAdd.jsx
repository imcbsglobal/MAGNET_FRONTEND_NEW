import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createJobCategory, fetchJobCategoryById, updateJobCategory } from '../../services/api';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import './JobCategoryAdd.scss';

const CategoryIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

const JobCategoryAdd = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
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
      setIsDefault(response.data.is_default);
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

    if (isDefault && isEdit) {
      alert('Default categories cannot be edited');
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
        <div className="job-category-form-page">

          {/* ── Header ── */}
          <div className="form-header">
            <div className="form-header-main">
              <div className="form-header-icon"><CategoryIcon /></div>
              <div>
                <h1>{isEdit ? 'Edit Job Category' : 'Add Job Category'}</h1>
                <p>{isEdit ? 'Update existing category' : 'Create a new category for your school services'}</p>
              </div>
            </div>
            <button className="back-btn" onClick={() => navigate('/admin/job-categories')}>
              Back to List
            </button>
          </div>

          <div className="form-card" style={{ maxWidth: '600px' }}>
            <form onSubmit={handleSubmit}>
              <div className="form-group full-width">
                <label>Category Name</label>
                <input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter category name (e.g., Teaching, Maintenance)"
                  required
                  autoFocus
                  disabled={isDefault && isEdit}
                />
                {isDefault && isEdit && (
                  <p className="field-hint">
                    This is a default category and cannot be edited
                  </p>
                )}
              </div>

              <div className="form-actions" style={{ marginTop: '30px' }}>
                <button type="submit" className="save-btn" disabled={loading || (isDefault && isEdit)}>
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
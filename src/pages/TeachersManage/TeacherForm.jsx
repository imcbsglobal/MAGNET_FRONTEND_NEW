import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createTeacher, fetchTeacherById, updateTeacher, fetchJobCategories } from '../../services/api';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import '../Administrators/Administrators.scss';

const TeacherForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const institutionId = localStorage.getItem('institutionId');
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    job_category: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    if (isEdit) {
      loadTeacher();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const response = await fetchJobCategories(institutionId);
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const loadTeacher = async () => {
    try {
      const response = await fetchTeacherById(id);
      setFormData({
        username: response.data.username,
        password: response.data.password,
        job_category: response.data.job_category || ''
      });
    } catch (err) {
      console.error('Failed to fetch teacher:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!institutionId) {
      alert('Session error: No Institution ID found.');
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await updateTeacher(id, formData);
      } else {
        await createTeacher({
          ...formData,
          institution_id: institutionId
        });
      }
      navigate('/admin/teachers');
    } catch (err) {
      alert(`Failed to ${isEdit ? 'update' : 'add'} teacher`);
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
              <h1>{isEdit ? 'Edit Teacher' : 'Add Teacher'}</h1>
              <p>{isEdit ? 'Update teacher credentials' : 'Create a new teacher account for your school'}</p>
            </div>
            <button className="back-btn" onClick={() => navigate('/admin/teachers')}>
              Back to List
            </button>
          </header>

          <div className="form-card" style={{ maxWidth: '600px' }}>
            <form onSubmit={handleSubmit}>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label>Job Category</label>
                  <select 
                    name="job_category"
                    value={formData.job_category} 
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Username</label>
                  <input 
                    name="username"
                    value={formData.username} 
                    onChange={handleChange}
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input 
                    type="password"
                    name="password"
                    value={formData.password} 
                    onChange={handleChange}
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: '30px' }}>
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Saving...' : (isEdit ? 'Update Teacher' : 'Create Teacher')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherForm;

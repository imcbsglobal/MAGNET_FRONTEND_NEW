import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login/Login';
import SuperUserDashboard from './pages/SuperUserDashboard/SuperUserDashboard';
import AdministratorsList from './pages/Administrators/AdministratorsList';
import AdministratorForm from './pages/Administrators/AdministratorForm';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import JobCategoriesList from './pages/JobCategories/JobCategoriesList';
import JobCategoryAdd from './pages/JobCategories/JobCategoryAdd';
import TeachersList from './pages/TeachersManage/TeachersList';
import TeacherForm from './pages/TeachersManage/TeacherForm';
import TeacherDashboard from './pages/TeacherDashboard/TeacherDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/superuser-dashboard" element={<SuperUserDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
          <Route path="/admin/job-categories" element={<JobCategoriesList />} />
          <Route path="/admin/job-categories/add" element={<JobCategoryAdd />} />
          <Route path="/admin/job-categories/edit/:id" element={<JobCategoryAdd />} />
          <Route path="/admin/teachers" element={<TeachersList />} />
          <Route path="/admin/teachers/add" element={<TeacherForm />} />
          <Route path="/admin/teachers/edit/:id" element={<TeacherForm />} />
          <Route path="/administrators" element={<AdministratorsList />} />
          <Route path="/administrators/add" element={<AdministratorForm />} />
          <Route path="/administrators/edit/:id" element={<AdministratorForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

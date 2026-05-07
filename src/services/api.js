import axios from 'axios';

const API_BASE_URL = 'http://magnetpro.in/api/';
const STUDENT_BASE_URL = 'http://magnetpro.in/student_data/';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const studentApi = axios.create({
  baseURL: STUDENT_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const authInterceptor = (config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
};

api.interceptors.request.use(authInterceptor, (error) => Promise.reject(error));
studentApi.interceptors.request.use(authInterceptor, (error) => Promise.reject(error));

export const superadminLogin = (credentials) => {
  return api.post('superadmin-login/', credentials);
};

export const administratorLogin = (credentials) => {
  return api.post('admin-login/', credentials);
};

export const teacherLogin = (credentials) => {
  return api.post('user-login/', credentials);
};

export const parentLogin = (credentials) => {
  return api.post('parent-login/', credentials);
};

export const fetchPendingFees = (institutionId, admno) => {
  return api.get(`fee_pending/pending/?institution_id=${encodeURIComponent(institutionId)}&admno=${encodeURIComponent(admno)}`);
};

export const fetchPaidFees = (institutionId, admno) => {
  return api.get(`feepaid/paid/?institution_id=${encodeURIComponent(institutionId)}&admno=${encodeURIComponent(admno)}`);
};

export const fetchAllPendingFees = (institutionId) => {
  return api.get(`fee_pending/all-pending/?institution_id=${encodeURIComponent(institutionId)}`);
};

export const fetchAllPaidFees = (institutionId) => {
  return api.get(`feepaid/all-paid/?institution_id=${encodeURIComponent(institutionId)}`);
};

// Administrator CRUD
export const fetchAdministrators = () => api.get('admins/');
export const createAdministrator = (data) => api.post('admins/', data);
export const updateAdministrator = (id, data) => api.put(`admins/${id}/`, data);
export const deleteAdministrator = (id) => api.delete(`admins/${id}/`);

// Job Categories
export const fetchJobCategories = (institutionId) => api.get(`job-categories/?institution_id=${institutionId}`);
export const fetchJobCategoryById = (id) => api.get(`job-categories/${id}/`);
export const createJobCategory = (data) => api.post('job-categories/', data);
export const updateJobCategory = (id, data) => api.put(`job-categories/${id}/`, data);
export const deleteJobCategory = (id) => api.delete(`job-categories/${id}/`);

// Teachers
export const fetchTeachers = (institutionId) => api.get(`teachers/?institution_id=${institutionId}`);
export const fetchTeacherById = (id) => api.get(`teachers/${id}/`);
export const createTeacher = (data) => api.post('teachers/', data);
export const updateTeacher = (id, data) => api.put(`teachers/${id}/`, data);
export const deleteTeacher = (id) => api.delete(`teachers/${id}/`);

// Student Classes and Divisions
export const fetchClassesDivisions = (institutionId) =>
  studentApi.get(`classes-divisions/?institution_id=${encodeURIComponent(institutionId)}`);

// Students by class and division
export const fetchStudentsByClassDivision = (institutionId, studentClass, div) =>
  studentApi.get(`students/?institution_id=${encodeURIComponent(institutionId)}&student_class=${encodeURIComponent(studentClass)}&div=${encodeURIComponent(div)}`);

// All students by institution
export const fetchAllStudents = (institutionId) =>
  studentApi.get(`all-students/?institution_id=${encodeURIComponent(institutionId)}`);

export default api;

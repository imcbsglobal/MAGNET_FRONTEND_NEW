import axios from 'axios';

const DEFAULT_API_BASE_URL =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000/api/'
    : 'https://magnetpro.in/api/';
    // : 'demo.magnetpro.in/student_data/';

const DEFAULT_STUDENT_BASE_URL =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000/student_data/'
    : 'https://magnetpro.in/student_data/';
    // : 'demo.magnetpro.in/student_data/';

const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '')) + '/';
const STUDENT_BASE_URL = ((import.meta.env.VITE_STUDENT_BASE_URL || DEFAULT_STUDENT_BASE_URL).replace(/\/+$/, '')) + '/';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const studentApi = axios.create({
  baseURL: STUDENT_BASE_URL,
});

const authInterceptor = (config) => {
  if (config.skipAuth) {
    delete config.headers.Authorization;
    return config;
  }
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
};

api.interceptors.request.use(authInterceptor, (error) => Promise.reject(error));
studentApi.interceptors.request.use(authInterceptor, (error) => Promise.reject(error));

export const superadminLogin = (credentials) => {
  return api.post('superadmin-login/', credentials);
};

export const superuserLogin = (credentials) => {
  return api.post('login/suser/', credentials);
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

// Administrator CRUDD
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

// Attendance
export const saveAttendance = (data) => api.post('attendance/save/', data, { skipAuth: true });
export const getAttendance = (institutionId, year, month) =>
  api.get(`attendance/get/?institution_id=${encodeURIComponent(institutionId)}&year=${year}&month=${month}`, { skipAuth: true });

// Calendar Setup
export const fetchCalendarEvents = (institutionId, year, month) =>
  api.get(`calendar/events/by_month/?institution_id=${encodeURIComponent(institutionId)}&year=${year}&month=${month}`, { skipAuth: true });

export const fetchYearCalendarEvents = (institutionId, year) =>
  api.get(`calendar/events/by_year/?institution_id=${encodeURIComponent(institutionId)}&year=${year}`, { skipAuth: true });

export const createCalendarEvent = (data) => api.post('calendar/events/', data, { skipAuth: true });
export const updateCalendarEvent = (id, data) => api.put(`calendar/events/${id}/`, data, { skipAuth: true });
export const deleteCalendarEvent = (id) => api.delete(`calendar/events/${id}/`, { skipAuth: true });

export default api;

// School Information
export const fetchSchoolInfo = (institutionId) =>
  api.get(`school-info/?institution_id=${encodeURIComponent(institutionId)}`);

export const saveSchoolInfo = (formData) =>
  api.post('school-info/save/', formData);

// ID Card
export const fetchIDCardStudents = (institutionId, studentClass, div) =>
  api.get('id-card/students/', {
    params: {
      institution_id: institutionId,
      student_class: studentClass || undefined,
      div: div || undefined,
    },
  });

// Admin-only: fetch ALL submitted students from all classes (using modified endpoint)
export const fetchAdminIDCardStudents = (institutionId) =>
  api.get('id-card/students/', {
    params: {
      institution_id: institutionId,
      admin_mode: true,
    },
  });

export const sendIDCardLink = (data) =>
  api.post('id-card/send-link/', data);

export const bulkSendIDCardLinks = (data) =>
  api.post('id-card/bulk-send/', data);

export const fetchIDCardParentLink = (token) =>
  api.get(`id-card/parent-link/?token=${encodeURIComponent(token)}`, { skipAuth: true });

export const submitIDCardParentForm = (token, data) =>
  api.post('id-card/submit/', { token, ...data }, { skipAuth: true });

export const lookupIDCardByPhone = (phone, institutionId = null) =>
  api.post('id-card/lookup-by-phone/', { 
    phone,
    ...(institutionId && { institution_id: institutionId })
  }, { skipAuth: true });

export const submitIDCardByPhone = (data) =>
  api.post('id-card/submit-by-phone/', data, { skipAuth: true });

export const fetchIDCardSubmission = (institutionId, admno) =>
  api.get(`id-card/submission/?institution_id=${encodeURIComponent(institutionId)}&admno=${encodeURIComponent(admno)}`);

export const updateIDCardSubmission = (id, data) =>
  api.put(`id-card/submission/${id}/`, data);

export const uploadStudentPhoto = (formData) =>
  api.post('id-card/upload-photo/', formData);

export const fetchIDCardSchoolInfo = (institutionId) =>
  api.get(`id-card/school-info/?institution_id=${encodeURIComponent(institutionId)}`);

// Form status management
export const fetchIDCardFormStatus = (institutionId) =>
  api.get(`id-card/form-status/?institution_id=${encodeURIComponent(institutionId)}`, { skipAuth: true });

export const toggleIDCardForm = (institutionId, enabled) =>
  api.post('id-card/toggle-form/', { institution_id: institutionId, enabled });

// House Group Master
export const fetchHouseGroups = (institutionId) =>
  api.get(`id-card/house-groups/${encodeURIComponent(institutionId)}/`);

export const saveHouseGroup = (data) =>
  api.post('id-card/house-groups-add/', data);

export const deleteHouseGroup = (groupId) =>
  api.delete(`id-card/house-groups-delete/${groupId}/`);

// Subject Master
export const fetchSubjects = (institutionId) =>
  api.get(`subjects/${encodeURIComponent(institutionId)}/`);

export const saveSubject = (data) =>
  api.post('subjects/add/', data);

export const deleteSubject = (subjectId) =>
  api.delete(`subjects/delete/${subjectId}/`);

// Chat
export const fetchChatContacts = (params) => api.get('chat/contacts/', { params });
export const getOrCreateChatRoom = (data) => api.post('chat/get-room/', data);
export const fetchChatHistory = (roomId, role) => api.get(`chat/history/${roomId}/`, { params: { role } });
export const uploadChatFile = (formData) => api.post('chat/upload/', formData);
export const sendBulkMessage = (data) => api.post('chat/send-bulk/', data);

// Evaluation System,
export const fetchAllEvaluations = (institutionId) => api.get(`evaluation/evaluations/?institution_id=${institutionId}`);
export const fetchTeacherEvaluations = (teacherId) => api.get(`evaluation/evaluations/teacher/${teacherId}/`);
export const fetchTeacherMonthEvaluation = (teacherId, month) => api.get(`evaluation/evaluations/teacher/${teacherId}/${month}/`);
export const saveEvaluation = (data) => api.put('evaluation/evaluations/save/', data);

// Class-wise Evaluation System
export const fetchTeacherClasses = (teacherId, month) => api.get(`evaluation/class-evaluations/teacher/${teacherId}/${month}/classes/`);
export const saveClassEvaluation = (data) => api.post('evaluation/class-evaluations/save/', data);
export const fetchClassEvaluation = (teacherId, month, studentClass, division) => api.get(`evaluation/class-evaluations/teacher/${teacherId}/${month}/${studentClass}/${division}/`);
export const fetchAllClassEvaluations = (teacherId, month) => api.get(`evaluation/class-evaluations/teacher/${teacherId}/${month}/all/`);
export const finishMonthEvaluation = (teacherId, month) => api.post(`evaluation/class-evaluations/teacher/${teacherId}/${month}/finish/`);
export const fetchTeachersEvaluationSummary = (institutionId, month) => api.get(`evaluation/teachers-summary/?institution_id=${institutionId}&month=${month}`);

// Teacher Hours Master
export const fetchTeacherHours = (institutionId) => api.get(`evaluation/teacher-hours/${encodeURIComponent(institutionId)}/`);
export const saveTeacherHours = (data) => api.post('evaluation/teacher-hours/', data);
export const deleteTeacherHours = (hoursId) => api.delete(`evaluation/teacher-hours/${hoursId}/`);

export const initiatePayment = (data) =>
  api.post("payments/initiate/", data);

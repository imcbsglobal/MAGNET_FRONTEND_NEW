import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Login from './pages/Login/Login';
import SuperUserDashboard from './pages/SuperUserDashboard/SuperUserDashboard';
import AdministratorsList from './pages/Administrators/AdministratorsList';
import AdministratorForm from './pages/Administrators/AdministratorForm';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import AdminPendingFee from './pages/AdminDashboard/AdminPendingFee';
import AdminPaidFee from './pages/AdminDashboard/AdminPaidFee';
import AdminStudentList from './pages/AdminDashboard/AdminStudentList';
import JobCategoriesList from './pages/JobCategories/JobCategoriesList';
import JobCategoryAdd from './pages/JobCategories/JobCategoryAdd';
import StaffList from './pages/StaffManage/StaffList';
import StaffForm from './pages/StaffManage/StaffForm';
import StaffDashboard from './pages/StaffDashboard/StaffDashboard';
import StaffStudentList from './pages/StaffDashboard/StaffStudentList';
import Attendance from './pages/Attendance/Attendance';
import StudentAttendance from './pages/Attendance/StudentAttendance';
import CalendarSetup from './pages/CalendarSetup/CalendarSetup';
import ParentDashboard from './pages/ParentDashboard/ParentDashboard';
import ParentPendingFee from './pages/ParentDashboard/ParentPendingFee';
import ParentPaidFee from './pages/ParentDashboard/ParentPaidFee';
import SchoolInfo from './pages/SchoolInfo/SchoolInfo';
import HouseGroupMaster from './pages/Masters/HouseGroupMaster';
import IDCardDetails from './pages/IDCard/IDCardDetails';
import IssueIDCard from './pages/IDCard/IssueIDCard';
import IDCardFormByClientId from './pages/IDCard/IDCardFormByClientId';
import IDCardParentForm from './pages/IDCard/IDCardParentForm';
import ChatWidget from './components/Chat/ChatWidget';
import ChatPage from './pages/ChatPage/ChatPage';
import TeacherEvaluation from './pages/Evaluations/TeacherEvaluation';
import HODEvaluation from './pages/Evaluations/HODEvaluation';
import AdminEvaluation from './pages/Evaluations/AdminEvaluation';
import PaymentSuccess from "./components/Payment/PaymentSuccess";
import PaymentFailure from "./components/Payment/PaymentFailure";
import './App.css';

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/' || location.pathname === '/login';
  const isIDCardForm = location.pathname.startsWith('/id-card/form');
  const hideChat = isLoginPage || isIDCardForm;

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/superuser-dashboard" element={<SuperUserDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/pending-fee" element={<AdminPendingFee />} />
        <Route path="/admin/paid-fee" element={<AdminPaidFee />} />
        <Route path="/admin/students" element={<AdminStudentList />} />
        <Route path="/admin/id-card/details" element={<IDCardDetails />} />
        <Route path="/staff-dashboard" element={<StaffDashboard />} />
        <Route path="/staff/students" element={<StaffStudentList />} />
        <Route path="/staff/attendance" element={<Attendance />} />
        <Route path="/staff/attendance/student/:admno" element={<StudentAttendance />} />
        <Route path="/staff/id-card/details" element={<IDCardDetails />} />
        <Route path="/staff/id-card/issue" element={<IssueIDCard />} />
        <Route path="/id-card/form" element={<IDCardParentForm />} />
        <Route path="/id-card/form/:clientId" element={<IDCardParentForm isClientIdForm={true} institutionId={location.pathname.split('/').pop()} />} />
        <Route path="/id-card/form/:token" element={<IDCardParentForm />} />
        <Route path="/admin/calendar" element={<CalendarSetup />} />
        <Route path="/parent-dashboard" element={<ParentDashboard />} />
        <Route path="/parent/pending-fee" element={<ParentPendingFee />} />
        <Route path="/parent/paid-fee" element={<ParentPaidFee />} />
        <Route path="/admin/school-info" element={<SchoolInfo />} />
        <Route path="/admin/masters/house-groups" element={<HouseGroupMaster />} />
        <Route path="/admin/job-categories" element={<JobCategoriesList />} />
        <Route path="/admin/job-categories/add" element={<JobCategoryAdd />} />
        <Route path="/admin/job-categories/edit/:id" element={<JobCategoryAdd />} />
        <Route path="/admin/staff" element={<StaffList />} />
        <Route path="/admin/staff/add" element={<StaffForm />} />
        <Route path="/admin/staff/edit/:id" element={<StaffForm />} />
        <Route path="/administrators" element={<AdministratorsList />} />
        <Route path="/administrators/add" element={<AdministratorForm />} />
        <Route path="/administrators/edit/:id" element={<AdministratorForm />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/teacher/evaluation" element={<TeacherEvaluation />} />
        <Route path="/hod/evaluation" element={<HODEvaluation />} />
        <Route path="/admin/evaluations" element={<AdminEvaluation />} />
        <Route path="/payment-success"element={<PaymentSuccess />}/>
        <Route path="/payment-failed"element={<PaymentFailure />}/>
      </Routes>
      {!hideChat && <ChatWidget />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

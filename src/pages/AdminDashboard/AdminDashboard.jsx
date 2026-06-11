import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchAllPaidFees, fetchAllPendingFees, fetchAllStudents, getAttendance, fetchCalendarEvents, fetchSchoolInfo } from '../../services/api';
import '../SuperUserDashboard/SuperUserDashboard.scss';
import './AdminDashboard.scss';

const toAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const today = new Date();

const getErrorMessage = (result, fallback) => {
  if (result.status !== 'rejected') return '';
  return result.reason?.response?.data?.message || result.reason?.message || fallback;
};

const AdminDashboard = () => {
  const schoolName = localStorage.getItem('schoolName') || 'School Admin';
  const institutionId = localStorage.getItem('institutionId') || '';
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [pendingFees, setPendingFees] = useState([]);
  const [paidFees, setPaidFees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [schoolLogo, setSchoolLogo] = useState(null);
  const [schoolInfoName, setSchoolInfoName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const monthName = today.toLocaleString('default', { month: 'long' });

  useEffect(() => {
    if (!institutionId) {
      setError('Institution ID missing. Please log in again.');
      setLoading(false);
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      const [studentsRes, pendingRes, paidRes, attendanceRes, eventsRes, schoolRes] = await Promise.allSettled([
        fetchAllStudents(institutionId),
        fetchAllPendingFees(institutionId),
        fetchAllPaidFees(institutionId),
        getAttendance(institutionId, year, month),
        fetchCalendarEvents(institutionId, year, month),
        fetchSchoolInfo(institutionId),
      ]);

      if (studentsRes.status === 'fulfilled') {
        setStudents(Array.isArray(studentsRes.value.data) ? studentsRes.value.data : []);
      } else {
        setStudents([]);
      }

      if (schoolRes.status === 'fulfilled') {
        setSchoolLogo(schoolRes.value.data?.logo_url || null);
        setSchoolInfoName(schoolRes.value.data?.school_name || '');
      } else {
        setSchoolLogo(null);
        setSchoolInfoName('');
      }

      if (pendingRes.status === 'fulfilled') {
        setPendingFees(pendingRes.value.data?.fees || []);
      } else {
        setPendingFees([]);
      }

      if (paidRes.status === 'fulfilled') {
        setPaidFees(paidRes.value.data?.fees || []);
      } else {
        setPaidFees([]);
      }

      if (attendanceRes.status === 'fulfilled') {
        setAttendanceRecords(attendanceRes.value.data?.records || []);
      } else {
        setAttendanceRecords([]);
      }

      if (eventsRes.status === 'fulfilled') {
        setCalendarEvents(Array.isArray(eventsRes.value.data) ? eventsRes.value.data : []);
      } else {
        setCalendarEvents([]);
      }

      const loadErrors = [
        getErrorMessage(studentsRes, 'students'),
        getErrorMessage(pendingRes, 'pending fees'),
        getErrorMessage(paidRes, 'paid fees'),
        getErrorMessage(attendanceRes, 'attendance'),
      ].filter(Boolean);

      if (loadErrors.length) {
        setError(`Some dashboard data could not load: ${loadErrors.join(', ')}.`);
      }

      setLoading(false);
    };

    loadDashboard();
  }, [institutionId, year, month]);

  const dashboardData = useMemo(() => {
    const totalPending = pendingFees.reduce((sum, fee) => sum + toAmount(fee.amount) + toAmount(fee.fine), 0);
    const totalPaid = paidFees.reduce((sum, fee) => sum + toAmount(fee.amount), 0);
    const totalExpected = totalPending + totalPaid;
    const collectionRate = totalExpected ? Math.round((totalPaid / totalExpected) * 100) : 0;

    const classes = [...new Set(students.map((student) => student.student_class).filter(Boolean))];
    const divisions = [...new Set(students.map((student) => student.div).filter(Boolean))];
    const pendingStudents = new Set(pendingFees.map((fee) => fee.admno).filter(Boolean)).size;
    const paidStudents = new Set(paidFees.map((fee) => fee.admno).filter(Boolean)).size;

    const classSummary = classes
      .map((className) => ({
        className,
        count: students.filter((student) => student.student_class === className).length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const maxClassCount = Math.max(...classSummary.map((item) => item.count), 1);
    const studentByAdmno = students.reduce((acc, student) => {
      acc[String(student.admno)] = student;
      return acc;
    }, {});

    const classAttendance = classes.map((className) => {
      const classStudents = students.filter((student) => student.student_class === className);
      const classAdmnos = new Set(classStudents.map((student) => String(student.admno)));
      const classRecords = attendanceRecords.filter((record) => classAdmnos.has(String(record.admno)));
      const present = classRecords.filter((record) => record.status === 'P').length;
      const absent = classRecords.filter((record) => record.status === 'A').length;
      const holiday = classRecords.filter((record) => record.status === 'H').length;
      const marked = present + absent;
      const percentage = marked ? Math.round((present / marked) * 100) : 0;
      return {
        className,
        students: classStudents.length,
        present,
        absent,
        holiday,
        percentage,
      };
    }).sort((a, b) => b.percentage - a.percentage || b.students - a.students);

    const totalPresent = attendanceRecords.filter((record) => {
      const student = studentByAdmno[String(record.admno)];
      return student && record.status === 'P';
    }).length;
    const totalAbsent = attendanceRecords.filter((record) => {
      const student = studentByAdmno[String(record.admno)];
      return student && record.status === 'A';
    }).length;
    const attendanceRate = totalPresent + totalAbsent
      ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100)
      : 0;

    const pendingByStudent = Object.values(pendingFees.reduce((acc, fee) => {
      const admno = fee.admno || 'Unknown';
      if (!acc[admno]) {
        acc[admno] = {
          admno,
          studentName: fee.student_name || 'Unknown Student',
          amount: 0,
          records: 0,
        };
      }
      acc[admno].amount += toAmount(fee.amount) + toAmount(fee.fine);
      acc[admno].records += 1;
      return acc;
    }, {})).sort((a, b) => b.amount - a.amount).slice(0, 5);

    // Calculate leaves and holidays for current month (excluding weekends)
    const monthLeaves = calendarEvents
      .filter((event) => event.event_type === 'L' || event.event_type === 'H')
      .map((event) => {
        const eventDate = new Date(event.date);
        const typeLabel = event.event_type === 'L' ? 'Leave' : 'Holiday';
        return {
          ...event,
          date: event.date,
          dayOfWeek: eventDate.getDay(),
          dateNum: eventDate.getDate(),
          dayName: eventDate.toLocaleString('default', { weekday: 'short' }),
          typeLabel,
        };
      })
      .filter((event) => event.dayOfWeek !== 0 && event.dayOfWeek !== 6)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      totalPending,
      totalPaid,
      totalExpected,
      collectionRate,
      classes: classes.length,
      divisions: divisions.length,
      pendingStudents,
      paidStudents,
      classSummary,
      maxClassCount,
      classAttendance,
      attendanceRate,
      totalPresent,
      totalAbsent,
      pendingByStudent,
      monthLeaves,
    };
  }, [students, pendingFees, paidFees, attendanceRecords, calendarEvents]);

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="admin" />

      <main className="dashboard-main">
        <Navbar placeholder="Search school data..." />

        <div className="dashboard-content admin-dashboard-content">
          <section className="admin-hero">
            <div>
              <span className="admin-kicker">Administration Dashboard</span>
              <h2>Welcome back, {schoolName}</h2>
              <p>Monitor all students under client ID {institutionId || '-'}, fee collections, pending dues, and school-wide administration activity.</p>
              <div className="admin-hero-actions">
                <button type="button" className="admin-primary-btn" onClick={() => navigate('/admin/students')}>
                  View Students
                </button>
                <button type="button" className="admin-secondary-btn" onClick={() => navigate('/admin/pending-fee')}>
                  Pending Fees
                </button>
              </div>
            </div>
            <div className={`admin-client-card ${schoolLogo ? 'has-logo' : ''}`}>
              {schoolLogo ? (
                <div className="admin-logo-display">
                  <img src={schoolLogo} alt="School Logo" />
                  {schoolInfoName && <p className="admin-school-name">{schoolInfoName}</p>}
                </div>
              ) : (
                <>
                  <span>Client ID</span>
                  <strong>{institutionId || '-'}</strong>
                </>
              )}
              {!schoolLogo && <p>{students.length} active student records</p>}
            </div>
          </section>

          {error && <div className="admin-alert">{error}</div>}

          <div className="admin-stats-row">
            <div className="admin-stat-card">
              <span>Total Students</span>
              <strong>{loading ? '...' : students.length}</strong>
              <p>{dashboardData.classes} classes, {dashboardData.divisions} divisions</p>
            </div>
            <div className="admin-stat-card pending">
              <span>Pending Fee</span>
              <strong>{loading ? '...' : formatCurrency(dashboardData.totalPending)}</strong>
              <p>{dashboardData.pendingStudents} students with dues</p>
            </div>
            <div className="admin-stat-card paid">
              <span>Paid Fee</span>
              <strong>{loading ? '...' : formatCurrency(dashboardData.totalPaid)}</strong>
              <p>{dashboardData.paidStudents} students paid</p>
            </div>
            <div className="admin-stat-card collection">
              <span>Attendance Rate</span>
              <strong>{loading ? '...' : `${dashboardData.attendanceRate}%`}</strong>
              <p>{monthName} present average</p>
            </div>
          </div>

          <div className="admin-dashboard-grid">
            <section className="admin-panel admin-finance-panel">
              <div className="admin-panel-header">
                <div>
                  <h3>Fee Collection Summary</h3>
                  <p>Paid versus pending amount for this client</p>
                </div>
                <span>{formatCurrency(dashboardData.totalExpected)}</span>
              </div>

              <div className="admin-finance-chart">
                <div
                  className="admin-donut"
                  style={{
                    background: `conic-gradient(#16a34a 0 ${dashboardData.collectionRate}%, #ef4444 ${dashboardData.collectionRate}% 100%)`,
                  }}
                >
                  <span>{dashboardData.collectionRate}%</span>
                </div>
                <div className="admin-finance-list">
                  <div><span>Paid Amount</span><strong>{formatCurrency(dashboardData.totalPaid)}</strong></div>
                  <div><span>Pending Amount</span><strong>{formatCurrency(dashboardData.totalPending)}</strong></div>
                  <div><span>Total Fee Records</span><strong>{paidFees.length + pendingFees.length}</strong></div>
                </div>
              </div>
            </section>

            <section className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h3>Students By Class</h3>
                  <p>Top classes by student strength</p>
                </div>
              </div>

              <div className="admin-class-chart">
                {loading ? (
                  <div className="admin-empty">Loading class summary...</div>
                ) : dashboardData.classSummary.length === 0 ? (
                  <div className="admin-empty">No student class data found.</div>
                ) : (
                  dashboardData.classSummary.map((item) => (
                    <div className="admin-class-row" key={item.className}>
                      <span>Class {item.className}</span>
                      <div>
                        <i style={{ width: `${Math.max((item.count / dashboardData.maxClassCount) * 100, 8)}%` }}></i>
                      </div>
                      <strong>{item.count}</strong>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="admin-dashboard-grid bottom">
            <section className="admin-panel admin-attendance-panel">
              <div className="admin-panel-header">
                <div>
                  <h3>Class Attendance Graph</h3>
                  <p>{monthName} attendance under client ID {institutionId || '-'}</p>
                </div>
                <span>{dashboardData.totalPresent} P / {dashboardData.totalAbsent} A</span>
              </div>

              <div className="admin-attendance-chart">
                {loading ? (
                  <div className="admin-empty">Loading attendance graph...</div>
                ) : dashboardData.classAttendance.length === 0 ? (
                  <div className="admin-empty">No class attendance records found.</div>
                ) : (
                  dashboardData.classAttendance.map((item) => (
                    <div className="admin-attendance-row" key={item.className}>
                      <div className="admin-attendance-label">
                        <strong>Class {item.className}</strong>
                        <span>{item.students} students</span>
                      </div>
                      <div className="admin-attendance-track">
                        <i style={{ width: `${Math.max(item.percentage, 5)}%` }}></i>
                      </div>
                      <em>{item.percentage}%</em>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="admin-dashboard-grid bottom">
            <section className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h3>Highest Pending Dues</h3>
                  <p>Students needing fee follow-up</p>
                </div>
              </div>

              <div className="admin-due-list">
                {loading ? (
                  <div className="admin-empty">Loading pending fee list...</div>
                ) : dashboardData.pendingByStudent.length === 0 ? (
                  <div className="admin-empty">No pending fee records found.</div>
                ) : (
                  dashboardData.pendingByStudent.map((student) => (
                    <button type="button" key={student.admno} onClick={() => navigate('/admin/pending-fee')}>
                      <span>{student.studentName.slice(0, 1).toUpperCase()}</span>
                      <div>
                        <strong>{student.studentName}</strong>
                        <small>Adm No: {student.admno}, {student.records} records</small>
                      </div>
                      <em>{formatCurrency(student.amount)}</em>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h3>Current Month Leaves & Holidays</h3>
                  <p>Working days only (no weekends)</p>
                </div>
                <span className="admin-leaves-count">{loading ? '...' : dashboardData.monthLeaves.length}</span>
              </div>

              <div className="admin-leaves-list">
                {loading ? (
                  <div className="admin-empty">Loading calendar...</div>
                ) : dashboardData.monthLeaves.length === 0 ? (
                  <div className="admin-empty">No leaves or holidays scheduled this month.</div>
                ) : (
                  dashboardData.monthLeaves.map((leave) => (
                    <div className="admin-leave-item" key={leave.id || leave.date}>
                      <div className="admin-leave-date">
                        <span className="admin-leave-day">{leave.dateNum}</span>
                        <span className="admin-leave-dayname">{leave.dayName}</span>
                      </div>
                      <div className="admin-leave-info">
                        <div className="admin-leave-type">
                          <span className={`admin-leave-badge ${leave.event_type === 'H' ? 'badge-holiday' : 'badge-leave'}`}>
                            {leave.typeLabel}
                          </span>
                        </div>
                        <strong>{leave.title}</strong>
                        <small>{leave.description || leave.typeLabel}</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h3>Quick Actions</h3>
                  <p>Administration shortcuts</p>
                </div>
              </div>

              <div className="admin-action-list">
                <button type="button" onClick={() => navigate('/admin/students')}>
                  <span>S</span>
                  <strong>All Students</strong>
                  <small>Search and filter all student records</small>
                </button>
                <button type="button" onClick={() => navigate('/admin/pending-fee')}>
                  <span>P</span>
                  <strong>Pending Fee</strong>
                  <small>Review outstanding fee balances</small>
                </button>
                <button type="button" onClick={() => navigate('/admin/paid-fee')}>
                  <span>F</span>
                  <strong>Paid Fee</strong>
                  <small>Check completed fee collections</small>
                </button>
                <button type="button" onClick={() => navigate('/admin/staff')}>
                  <span>T</span>
                  <strong>Staff Management</strong>
                  <small>Add or update staff accounts</small>
                </button>
                <button type="button" onClick={() => navigate('/admin/evaluations')}>
                  <span>E</span>
                  <strong>Evaluations</strong>
                  <small>View teacher evaluations</small>
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

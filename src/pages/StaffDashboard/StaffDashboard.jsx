import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchStudentsByClassDivision, getAttendance } from '../../services/api';
import '../SuperUserDashboard/SuperUserDashboard.scss';
import './StaffDashboard.scss';

const today = new Date();

const getInitials = (name) => {
  const parts = String(name || 'Student').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'S';
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
};

const getErrorMessage = (result, fallback) => {
  if (result.status !== 'rejected') return '';
  return result.reason?.response?.data?.message || result.reason?.message || fallback;
};

const StaffDashboard = () => {
  const username = localStorage.getItem('username') || 'Staff';
  const institutionId = localStorage.getItem('institutionId') || '';
  const assignedClass = localStorage.getItem('assignedClass') || '';
  const assignedDivision = localStorage.getItem('assignedDivision') || '';
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const currentDay = today.getDate();
  const monthName = today.toLocaleString('default', { month: 'long' });

  useEffect(() => {
    if (!institutionId || !assignedClass || !assignedDivision) {
      setError('No class or division is assigned to your account.');
      setLoading(false);
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      const [studentRes, attendanceRes] = await Promise.allSettled([
        fetchStudentsByClassDivision(institutionId, assignedClass, assignedDivision),
        getAttendance(institutionId, year, month),
      ]);

      if (studentRes.status === 'fulfilled') {
        setStudents(Array.isArray(studentRes.value.data) ? studentRes.value.data : []);
      } else {
        setStudents([]);
      }

      if (attendanceRes.status === 'fulfilled') {
        setAttendanceRecords(attendanceRes.value.data?.records || []);
      } else {
        setAttendanceRecords([]);
      }

      const loadErrors = [
        getErrorMessage(studentRes, 'students'),
        getErrorMessage(attendanceRes, 'attendance'),
      ].filter(Boolean);

      if (loadErrors.length) {
        setError(`Some dashboard data could not load: ${loadErrors.join(', ')}.`);
      }

      setLoading(false);
    };

    loadDashboard();
  }, [institutionId, assignedClass, assignedDivision, year, month]);

  const dashboardData = useMemo(() => {
    const studentAdmnos = new Set(students.map((student) => String(student.admno)));
    const classRecords = attendanceRecords.filter((record) => studentAdmnos.has(String(record.admno)));
    const todayKey = `${year}-${String(month).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

    const todayRecords = classRecords.filter((record) => record.date === todayKey);
    const presentToday = todayRecords.filter((record) => record.status === 'P').length;
    const absentToday = todayRecords.filter((record) => record.status === 'A').length;
    const markedToday = presentToday + absentToday + todayRecords.filter((record) => record.status === 'H').length;
    const pendingToday = Math.max(students.length - markedToday, 0);
    const attendanceRate = students.length ? Math.round((presentToday / students.length) * 100) : 0;

    let presentMonth = 0;
    let absentMonth = 0;
    let holidayMonth = 0;
    classRecords.forEach((record) => {
      if (record.status === 'P') presentMonth += 1;
      if (record.status === 'A') absentMonth += 1;
      if (record.status === 'H') holidayMonth += 1;
    });

    const monthTotal = presentMonth + absentMonth + holidayMonth;
    const monthlyRate = presentMonth + absentMonth
      ? Math.round((presentMonth / (presentMonth + absentMonth)) * 100)
      : 0;

    const dailyBars = Array.from({ length: currentDay }, (_, index) => {
      const day = index + 1;
      const dayKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const records = classRecords.filter((record) => record.date === dayKey);
      const present = records.filter((record) => record.status === 'P').length;
      const absent = records.filter((record) => record.status === 'A').length;
      const percentage = students.length ? Math.round((present / students.length) * 100) : 0;
      return { day, present, absent, percentage };
    }).slice(-10);

    const studentSummaries = students.map((student) => {
      const records = classRecords.filter((record) => String(record.admno) === String(student.admno));
      const present = records.filter((record) => record.status === 'P').length;
      const absent = records.filter((record) => record.status === 'A').length;
      const total = present + absent;
      const rate = total ? Math.round((present / total) * 100) : 0;
      return { ...student, present, absent, total, rate };
    });

    const attentionStudents = studentSummaries
      .filter((student) => student.absent > 0 || (student.total > 0 && student.rate < 75))
      .sort((a, b) => b.absent - a.absent || a.rate - b.rate)
      .slice(0, 5);

    return {
      attendanceRate,
      presentToday,
      absentToday,
      pendingToday,
      presentMonth,
      absentMonth,
      holidayMonth,
      monthTotal,
      monthlyRate,
      dailyBars,
      attentionStudents,
    };
  }, [students, attendanceRecords, year, month, currentDay]);

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="teacher" />
      
      <main className="dashboard-main">
        <Navbar placeholder="Search activities..." />

        <div className="dashboard-content staff-dashboard-content">
          <section className="staff-hero">
            <div>
              <span className="staff-kicker">Staff Dashboard</span>
              <h2>Welcome back, {username}</h2>
              <p>Manage Class {assignedClass || '-'} {assignedDivision || ''} with attendance insights, student follow-ups, and daily classroom actions.</p>
              <div className="staff-hero-actions">
                <button type="button" className="staff-primary-btn" onClick={() => navigate('/staff/attendance')}>
                  Mark Attendance
                </button>
                <button type="button" className="staff-secondary-btn" onClick={() => navigate('/staff/students')}>
                  View Students
                </button>
              </div>
            </div>
            <div className="staff-class-card">
              <span>Assigned Class</span>
              <strong>{assignedClass || '-'} {assignedDivision || ''}</strong>
              <p>{students.length} students enrolled</p>
            </div>
          </section>

          {error && <div className="staff-alert">{error}</div>}

          <div className="staff-stats-row">
            <div className="staff-stat-card">
              <span>Total Students</span>
              <strong>{loading ? '...' : students.length}</strong>
              <p>Class strength</p>
            </div>
            <div className="staff-stat-card present">
              <span>Today Present</span>
              <strong>{loading ? '...' : dashboardData.presentToday}</strong>
              <p>{dashboardData.attendanceRate}% attendance today</p>
            </div>
            <div className="staff-stat-card absent">
              <span>Today Absent</span>
              <strong>{loading ? '...' : dashboardData.absentToday}</strong>
              <p>{dashboardData.pendingToday} pending marks</p>
            </div>
            <div className="staff-stat-card month">
              <span>Monthly Rate</span>
              <strong>{loading ? '...' : `${dashboardData.monthlyRate}%`}</strong>
              <p>{monthName} attendance average</p>
            </div>
          </div>

          <div className="staff-dashboard-grid">
            <section className="staff-panel staff-chart-panel">
              <div className="staff-panel-header">
                <div>
                  <h3>Attendance Trend</h3>
                  <p>Last marked days in {monthName}</p>
                </div>
                <span>{dashboardData.monthTotal} marks</span>
              </div>

              <div className="staff-chart">
                {loading ? (
                  <div className="staff-empty">Loading attendance graph...</div>
                ) : dashboardData.dailyBars.length === 0 ? (
                  <div className="staff-empty">No attendance marked this month.</div>
                ) : (
                  dashboardData.dailyBars.map((bar) => (
                    <div className="staff-bar-item" key={bar.day}>
                      <div className="staff-bar-track">
                        <span style={{ height: `${Math.max(bar.percentage, 6)}%` }}></span>
                      </div>
                      <small>{bar.day}</small>
                    </div>
                  ))
                )}
              </div>

              <div className="staff-chart-legend">
                <span><i className="present-dot"></i>Present percentage</span>
                <span><i className="absent-dot"></i>{dashboardData.absentMonth} monthly absences</span>
              </div>
            </section>

            <section className="staff-panel">
              <div className="staff-panel-header">
                <div>
                  <h3>Monthly Summary</h3>
                  <p>{monthName} {year}</p>
                </div>
              </div>

              <div className="staff-donut-wrap">
                <div
                  className="staff-donut"
                  style={{
                    background: `conic-gradient(#16a34a 0 ${dashboardData.monthlyRate}%, #ef4444 ${dashboardData.monthlyRate}% 100%)`,
                  }}
                >
                  <span>{dashboardData.monthlyRate}%</span>
                </div>
                <div className="staff-summary-list">
                  <div><span>Present</span><strong>{dashboardData.presentMonth}</strong></div>
                  <div><span>Absent</span><strong>{dashboardData.absentMonth}</strong></div>
                  <div><span>Holiday</span><strong>{dashboardData.holidayMonth}</strong></div>
                </div>
              </div>
            </section>
          </div>

          <div className="staff-dashboard-grid bottom">
            <section className="staff-panel">
              <div className="staff-panel-header">
                <div>
                  <h3>Students To Review</h3>
                  <p>Attendance follow-up list</p>
                </div>
              </div>

              <div className="staff-student-list">
                {loading ? (
                  <div className="staff-empty">Loading students...</div>
                ) : dashboardData.attentionStudents.length === 0 ? (
                  <div className="staff-empty">No attendance concerns found.</div>
                ) : (
                  dashboardData.attentionStudents.map((student) => (
                    <button
                      type="button"
                      className="staff-student-item"
                      key={student.admno}
                      onClick={() => navigate(`/staff/attendance/student/${encodeURIComponent(student.admno)}`, {
                        state: { studentName: student.student_name },
                      })}
                    >
                      <span className="staff-avatar">{getInitials(student.student_name)}</span>
                      <span>
                        <strong>{student.student_name}</strong>
                        <small>Adm No: {student.admno}</small>
                      </span>
                      <em>{student.rate || 0}%</em>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="staff-panel">
              <div className="staff-panel-header">
                <div>
                  <h3>Quick Actions</h3>
                  <p>Daily staff tools</p>
                </div>
              </div>

              <div className="staff-action-list">
                <button type="button" onClick={() => navigate('/staff/attendance')}>
                  <span>A</span>
                  <strong>Open Attendance</strong>
                  <small>Mark or review monthly attendance</small>
                </button>
                <button type="button" onClick={() => navigate('/staff/students')}>
                  <span>S</span>
                  <strong>Student Directory</strong>
                  <small>Search class student details</small>
                </button>
                <button type="button" onClick={() => navigate('/staff/attendance')}>
                  <span>R</span>
                  <strong>Attendance Reports</strong>
                  <small>View student-wise attendance records</small>
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffDashboard;

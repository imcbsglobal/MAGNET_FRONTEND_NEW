import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchStudentsByClassDivision, getAttendance, fetchCalendarEvents, fetchSchoolInfo } from '../../services/api';
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

// ── Small decorative icon set (purely visual, no logic) ──
const Icons = {
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  UserCheck: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="8.5" cy="7" r="4"></circle>
      <polyline points="17 11 19 13 23 9"></polyline>
    </svg>
  ),
  UserX: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="8.5" cy="7" r="4"></circle>
      <line x1="18" y1="8" x2="23" y2="13"></line>
      <line x1="23" y1="8" x2="18" y2="13"></line>
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  TrendingUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  List: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  ),
  BarChart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10"></line>
      <line x1="18" y1="20" x2="18" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="16"></line>
    </svg>
  ),
  PieChart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
      <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"></rect>
      <path d="M16 2v4"></path>
      <path d="M8 2v4"></path>
      <path d="M3 10h18"></path>
    </svg>
  ),
  Flag: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
      <line x1="4" y1="22" x2="4" y2="15"></line>
    </svg>
  ),
  Bolt: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  ),
};

const StaffDashboard = () => {
  const username = localStorage.getItem('username') || 'Staff';
  const institutionId = localStorage.getItem('institutionId') || '';
  const assignedClass = localStorage.getItem('assignedClass') || '';
  const assignedDivision = localStorage.getItem('assignedDivision') || '';
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [schoolLogo, setSchoolLogo] = useState(null);
  const [schoolInfoName, setSchoolInfoName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const currentDay = today.getDate();
  const monthName = today.toLocaleString('default', { month: 'long' });

  useEffect(() => {
    if (!institutionId || !assignedClass || !assignedDivision || !localStorage.getItem('token')) {
      window.location.replace('/login');
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      const [studentRes, attendanceRes, eventsRes, schoolRes] = await Promise.allSettled([
        fetchStudentsByClassDivision(institutionId, assignedClass, assignedDivision),
        getAttendance(institutionId, year, month),
        fetchCalendarEvents(institutionId, year, month),
        fetchSchoolInfo(institutionId),
      ]);

      if (studentRes.status === 'fulfilled') {
        setStudents(Array.isArray(studentRes.value.data) ? studentRes.value.data : []);
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
    const halfDayToday = todayRecords.filter((record) => record.status === 'HD').length;
    const markedToday = presentToday + absentToday + halfDayToday + todayRecords.filter((record) => record.status === 'H').length;
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
      attendanceRate,
      presentToday,
      absentToday,
      halfDayToday,
      pendingToday,
      presentMonth,
      absentMonth,
      holidayMonth,
      monthTotal,
      monthlyRate,
      dailyBars,
      attentionStudents,
      monthLeaves,
    };
  }, [students, attendanceRecords, calendarEvents, year, month, currentDay]);

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="teacher" />

      <main className="dashboard-main">
        <Navbar placeholder="Search students, reports..." />

        <div className="dashboard-content staff-dashboard-content">

          {/* ── Hero ── */}
          <section className="sd-hero">
            <div className="sd-hero-left">
              <span className="sd-eyebrow">Staff Dashboard</span>
              <h2 className="sd-title">Good day, {username}</h2>
              <p className="sd-subtitle">
                Class {assignedClass || '—'} {assignedDivision} &nbsp;·&nbsp; {monthName} {year} &nbsp;·&nbsp; {loading ? '…' : students.length} students enrolled
              </p>
              <div className="sd-hero-actions">
                <button type="button" className="sd-btn-primary" onClick={() => navigate('/staff/attendance')}>
                  <span className="sd-btn-icon"><Icons.Plus /></span>
                  Mark Attendance
                </button>
                <button type="button" className="sd-btn-ghost" onClick={() => navigate('/staff/students')}>
                  <span className="sd-btn-icon"><Icons.List /></span>
                  View Students
                </button>
              </div>
            </div>

            <div className="sd-school-card">
              {schoolLogo ? (
                <>
                  <img src={schoolLogo} alt="School logo" className="sd-school-logo" />
                  {schoolInfoName && <p className="sd-school-name">{schoolInfoName}</p>}
                </>
              ) : (
                <>
                  <div className="sd-class-badge">
                    {assignedClass || '—'}{assignedDivision}
                  </div>
                  <p className="sd-school-label">Assigned class</p>
                </>
              )}
            </div>
          </section>

          {/* ── Error ── */}
          {error && <div className="sd-alert">{error}</div>}

          {/* ── Stats row ── */}
          <div className="sd-stats-row">
            {[
              { label: 'Total Students', value: loading ? '…' : students.length, sub: 'Class strength', mod: '', icon: <Icons.Users /> },
              { label: 'Present Today', value: loading ? '…' : dashboardData.presentToday, sub: `${dashboardData.attendanceRate}% rate`, mod: 'present', icon: <Icons.UserCheck /> },
              { label: 'Absent Today', value: loading ? '…' : dashboardData.absentToday, sub: `${dashboardData.pendingToday} pending`, mod: 'absent', icon: <Icons.UserX /> },
              { label: 'Half Day', value: loading ? '…' : dashboardData.halfDayToday, sub: 'Half-day students', mod: 'half', icon: <Icons.Clock /> },
              { label: 'Monthly Rate', value: loading ? '…' : `${dashboardData.monthlyRate}%`, sub: `${monthName} average`, mod: 'rate', icon: <Icons.TrendingUp /> },
            ].map((card) => (
              <div className={`sd-stat ${card.mod}`} key={card.label}>
                <span className="sd-stat-icon">{card.icon}</span>
                <span className="sd-stat-label">{card.label}</span>
                <strong className="sd-stat-value">{card.value}</strong>
                <p className="sd-stat-sub">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Main grid ── */}
          <div className="sd-grid-top">

            {/* Trend chart */}
            <section className="sd-panel sd-chart-panel">
              <div className="sd-panel-head">
                <div className="sd-panel-heading">
                  <span className="sd-panel-icon"><Icons.BarChart /></span>
                  <div>
                    <h3>Attendance trend</h3>
                    <p>Last marked days in {monthName}</p>
                  </div>
                </div>
                <span className="sd-pill">{dashboardData.monthTotal} marks</span>
              </div>

              <div className="sd-bars">
                {loading ? (
                  <div className="sd-empty">Loading chart…</div>
                ) : dashboardData.dailyBars.length === 0 ? (
                  <div className="sd-empty">No attendance marked yet.</div>
                ) : (
                  dashboardData.dailyBars.map((bar) => (
                    <div className="sd-bar-col" key={bar.day}>
                      <span className="sd-bar-pct">{bar.percentage > 0 ? `${bar.percentage}%` : ''}</span>
                      <div className="sd-bar-track">
                        <div
                          className="sd-bar-fill"
                          style={{ height: `${Math.max(bar.percentage, 4)}%` }}
                        />
                      </div>
                      <span className="sd-bar-day">{bar.day}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="sd-legend">
                <span><i className="sd-dot present-dot" />Present %</span>
                <span><i className="sd-dot absent-dot" />{dashboardData.absentMonth} absences this month</span>
              </div>
            </section>

            {/* Donut summary */}
            <section className="sd-panel sd-donut-panel">
              <div className="sd-panel-head">
                <div className="sd-panel-heading">
                  <span className="sd-panel-icon"><Icons.PieChart /></span>
                  <div>
                    <h3>Monthly summary</h3>
                    <p>{monthName} {year}</p>
                  </div>
                </div>
              </div>

              <div className="sd-donut-wrap">
                <div
                  className="sd-donut"
                  style={{
                    background: `conic-gradient(#2e7d32 0 ${dashboardData.monthlyRate}%, #de350b ${dashboardData.monthlyRate}% 100%)`,
                  }}
                >
                  <span>{dashboardData.monthlyRate}%</span>
                </div>
              </div>

              <div className="sd-summary-rows">
                <div className="sd-summary-row">
                  <span><i className="sd-dot present-dot" />Present</span>
                  <strong>{dashboardData.presentMonth}</strong>
                </div>
                <div className="sd-summary-row">
                  <span><i className="sd-dot absent-dot" />Absent</span>
                  <strong>{dashboardData.absentMonth}</strong>
                </div>
                <div className="sd-summary-row">
                  <span><i className="sd-dot holiday-dot" />Holiday</span>
                  <strong>{dashboardData.holidayMonth}</strong>
                </div>
              </div>
            </section>
          </div>

          {/* ── Bottom grid ── */}
          <div className="sd-grid-bottom">

            {/* Leaves & holidays */}
            <section className="sd-panel">
              <div className="sd-panel-head">
                <div className="sd-panel-heading">
                  <span className="sd-panel-icon"><Icons.Calendar /></span>
                  <div>
                    <h3>Leaves &amp; holidays</h3>
                    <p>Working days only · no weekends</p>
                  </div>
                </div>
                <span className="sd-pill">{loading ? '…' : dashboardData.monthLeaves.length}</span>
              </div>

              <div className="sd-leave-list">
                {loading ? (
                  <div className="sd-empty">Loading calendar…</div>
                ) : dashboardData.monthLeaves.length === 0 ? (
                  <div className="sd-empty">No leaves or holidays this month.</div>
                ) : (
                  dashboardData.monthLeaves.map((leave) => (
                    <div className="sd-leave-item" key={leave.id || leave.date}>
                      <div className={`sd-leave-cal ${leave.event_type === 'H' ? 'cal-holiday' : 'cal-leave'}`}>
                        <strong>{leave.dateNum}</strong>
                        <span>{leave.dayName}</span>
                      </div>

                      <div className="sd-leave-body">
                        <p className="sd-leave-title">{leave.title}</p>
                        <p className="sd-leave-desc">{leave.description || leave.typeLabel}</p>
                      </div>

                      <span className={`sd-badge ${leave.event_type === 'H' ? 'badge-holiday' : 'badge-leave'}`}>
                        {leave.typeLabel}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Right column */}
            <div className="sd-right-col">

              {/* Students to review */}
              <section className="sd-panel">
                <div className="sd-panel-head">
                  <div className="sd-panel-heading">
                    <span className="sd-panel-icon"><Icons.Flag /></span>
                    <div>
                      <h3>Students to review</h3>
                      <p>Attendance follow-up list</p>
                    </div>
                  </div>
                </div>

                <div className="sd-student-list">
                  {loading ? (
                    <div className="sd-empty">Loading…</div>
                  ) : dashboardData.attentionStudents.length === 0 ? (
                    <div className="sd-empty">No concerns found.</div>
                  ) : (
                    dashboardData.attentionStudents.map((student) => (
                      <button
                        type="button"
                        className="sd-student-row"
                        key={student.admno}
                        onClick={() => navigate(`/staff/attendance/student/${encodeURIComponent(student.admno)}`, {
                          state: { studentName: student.student_name },
                        })}
                      >
                        <span className="sd-avatar">{getInitials(student.student_name)}</span>
                        <span className="sd-student-info">
                          <strong>{student.student_name}</strong>
                          <small>Adm: {student.admno}</small>
                        </span>
                        <span className={`sd-rate-pill ${(student.rate || 0) < 75 ? 'rate-low' : 'rate-ok'}`}>
                          {student.rate || 0}%
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </section>

              {/* Quick actions */}
              <section className="sd-panel">
                <div className="sd-panel-head">
                  <div className="sd-panel-heading">
                    <span className="sd-panel-icon"><Icons.Bolt /></span>
                    <div>
                      <h3>Quick actions</h3>
                      <p>Daily staff tools</p>
                    </div>
                  </div>
                </div>

                <div className="sd-action-list">
                  <button type="button" className="sd-action-row" onClick={() => navigate('/staff/attendance')}>
                    <span className="sd-action-icon">A</span>
                    <span className="sd-action-text">
                      <strong>Open Attendance</strong>
                      <small>Mark or review monthly attendance</small>
                    </span>
                    <svg className="sd-arrow" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button type="button" className="sd-action-row" onClick={() => navigate('/staff/students')}>
                    <span className="sd-action-icon">S</span>
                    <span className="sd-action-text">
                      <strong>Student Directory</strong>
                      <small>Search class student details</small>
                    </span>
                    <svg className="sd-arrow" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button type="button" className="sd-action-row" onClick={() => navigate('/staff/attendance')}>
                    <span className="sd-action-icon">R</span>
                    <span className="sd-action-text">
                      <strong>Attendance Reports</strong>
                      <small>View student-wise records</small>
                    </span>
                    <svg className="sd-arrow" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffDashboard;
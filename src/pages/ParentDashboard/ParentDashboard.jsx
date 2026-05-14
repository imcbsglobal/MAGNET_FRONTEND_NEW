import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchPaidFees, fetchPendingFees, getAttendance, fetchCalendarEvents } from '../../services/api';
import '../SuperUserDashboard/SuperUserDashboard.scss';
import './ParentDashboard.scss';

const today = new Date();

const toAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const getErrorMessage = (result, fallback) => {
  if (result.status !== 'rejected') return '';
  return result.reason?.response?.data?.message || result.reason?.message || fallback;
};

const ParentDashboard = () => {
  const navigate = useNavigate();
  const studentName = localStorage.getItem('studentName') || 'Student';
  const admno = localStorage.getItem('admno') || '';
  const institutionId = localStorage.getItem('institutionId') || '';
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const currentDay = today.getDate();
  const monthName = today.toLocaleString('default', { month: 'long' });

  const [pendingFees, setPendingFees] = useState([]);
  const [paidFees, setPaidFees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!institutionId || !admno) {
      setError('Student details are missing. Please log in again.');
      setLoading(false);
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      const [pendingRes, paidRes, attendanceRes, eventsRes] = await Promise.allSettled([
        fetchPendingFees(institutionId, admno),
        fetchPaidFees(institutionId, admno),
        getAttendance(institutionId, year, month),
        fetchCalendarEvents(institutionId, year, month),
      ]);

      setPendingFees(pendingRes.status === 'fulfilled' ? pendingRes.value.data?.fees || [] : []);
      setPaidFees(paidRes.status === 'fulfilled' ? paidRes.value.data?.fees || [] : []);
      setAttendanceRecords(attendanceRes.status === 'fulfilled' ? attendanceRes.value.data?.records || [] : []);
      setCalendarEvents(eventsRes.status === 'fulfilled' ? (Array.isArray(eventsRes.value.data) ? eventsRes.value.data : []) : []);

      const loadErrors = [
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
  }, [institutionId, admno, year, month]);

  const dashboardData = useMemo(() => {
    const totalPending = pendingFees.reduce((sum, fee) => sum + toAmount(fee.amount) + toAmount(fee.fine), 0);
    const totalPaid = paidFees.reduce((sum, fee) => sum + toAmount(fee.amount), 0);
    const totalFeeActivity = totalPending + totalPaid;
    const paidRate = totalFeeActivity ? Math.round((totalPaid / totalFeeActivity) * 100) : 0;

    const studentAttendance = attendanceRecords.filter((record) => String(record.admno) === String(admno));
    const present = studentAttendance.filter((record) => record.status === 'P').length;
    const absent = studentAttendance.filter((record) => record.status === 'A').length;
    const holiday = studentAttendance.filter((record) => record.status === 'H').length;
    const marked = present + absent;
    const attendanceRate = marked ? Math.round((present / marked) * 100) : 0;

    const dailyBars = Array.from({ length: currentDay }, (_, index) => {
      const day = index + 1;
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const status = studentAttendance.find((record) => record.date === dateKey)?.status || '';
      return { day, status };
    }).slice(-12);

    const recentPending = [...pendingFees]
      .sort((a, b) => toAmount(b.amount) + toAmount(b.fine) - (toAmount(a.amount) + toAmount(a.fine)))
      .slice(0, 4);

    const recentPaid = [...paidFees]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 4);

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
      paidRate,
      present,
      absent,
      holiday,
      attendanceRate,
      dailyBars,
      recentPending,
      recentPaid,
      monthLeaves,
    };
  }, [pendingFees, paidFees, attendanceRecords, calendarEvents, admno, year, month, currentDay]);

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="parent" />
      <main className="dashboard-main">
        <Navbar placeholder="Search school updates..." />

        <div className="dashboard-content parent-dashboard-content">
          <section className="parent-hero">
            <div className="welcome-copy">
              <span className="dashboard-label">Parent Dashboard</span>
              <h2>{studentName}</h2>
              <p>Track attendance, pending fees, paid fees, and important student account details from one clean parent dashboard.</p>
              <div className="welcome-actions">
                <button type="button" className="primary-action" onClick={() => navigate('/parent/pending-fee')}>
                  View Pending Fee
                </button>
                <button type="button" className="secondary-action" onClick={() => navigate('/parent/paid-fee')}>
                  View Paid Fee
                </button>
              </div>
            </div>
            <div className="parent-profile-card">
              <span>Admission No.</span>
              <strong>{admno || '-'}</strong>
              <p>Institution ID {institutionId || '-'}</p>
            </div>
          </section>

          {error && <div className="parent-alert">{error}</div>}

          <div className="parent-stats-row">
            <div className="parent-stat-card attendance">
              <span>Attendance Rate</span>
              <strong>{loading ? '...' : `${dashboardData.attendanceRate}%`}</strong>
              <p>{monthName} present average</p>
            </div>
            <div className="parent-stat-card pending">
              <span>Pending Fee</span>
              <strong>{loading ? '...' : formatCurrency(dashboardData.totalPending)}</strong>
              <p>{pendingFees.length} pending records</p>
            </div>
            <div className="parent-stat-card paid">
              <span>Paid Fee</span>
              <strong>{loading ? '...' : formatCurrency(dashboardData.totalPaid)}</strong>
              <p>{paidFees.length} paid records</p>
            </div>
            <div className="parent-stat-card">
              <span>Fee Cleared</span>
              <strong>{loading ? '...' : `${dashboardData.paidRate}%`}</strong>
              <p>Paid from total fee activity</p>
            </div>
          </div>

          <div className="parent-dashboard-grid">
            <section className="parent-panel parent-attendance-panel" id="parent-attendance">
              <div className="parent-panel-header">
                <div>
                  <h3>Attendance Graph</h3>
                  <p>{monthName} attendance for {studentName}</p>
                </div>
                <span>{dashboardData.present} P / {dashboardData.absent} A</span>
              </div>

              <div className="parent-attendance-graph">
                {loading ? (
                  <div className="parent-empty">Loading attendance graph...</div>
                ) : dashboardData.dailyBars.length === 0 ? (
                  <div className="parent-empty">No attendance records found.</div>
                ) : (
                  dashboardData.dailyBars.map((item) => (
                    <div className="parent-day-bar" key={item.day}>
                      <div className={`parent-day-pill status-${item.status || 'blank'}`}>
                        {item.status || '-'}
                      </div>
                      <small>{item.day}</small>
                    </div>
                  ))
                )}
              </div>

              <div className="parent-attendance-summary">
                <div><span>Present</span><strong>{dashboardData.present}</strong></div>
                <div><span>Absent</span><strong>{dashboardData.absent}</strong></div>
                <div><span>Holiday</span><strong>{dashboardData.holiday}</strong></div>
              </div>
            </section>

            <section className="parent-panel">
              <div className="parent-panel-header">
                <div>
                  <h3>Fee Summary</h3>
                  <p>Pending and paid balance overview</p>
                </div>
              </div>

              <div className="parent-fee-donut-wrap">
                <div
                  className="parent-fee-donut"
                  style={{
                    background: `conic-gradient(#16a34a 0 ${dashboardData.paidRate}%, #ef4444 ${dashboardData.paidRate}% 100%)`,
                  }}
                >
                  <span>{dashboardData.paidRate}%</span>
                </div>
                <div className="parent-fee-list">
                  <div><span>Paid</span><strong>{formatCurrency(dashboardData.totalPaid)}</strong></div>
                  <div><span>Pending</span><strong>{formatCurrency(dashboardData.totalPending)}</strong></div>
                </div>
              </div>
            </section>
          </div>

          <div className="parent-dashboard-grid bottom">
            <section className="parent-panel">
              <div className="parent-panel-header">
                <div>
                  <h3>School Calendar — Leaves & Holidays</h3>
                  <p>Working days only (no weekends)</p>
                </div>
                <span className="parent-leaves-count">{loading ? '...' : dashboardData.monthLeaves.length}</span>
              </div>

              <div className="parent-leaves-list">
                {loading ? (
                  <div className="parent-empty">Loading calendar...</div>
                ) : dashboardData.monthLeaves.length === 0 ? (
                  <div className="parent-empty">No leaves or holidays scheduled this month.</div>
                ) : (
                  dashboardData.monthLeaves.map((leave) => (
                    <div className="parent-leave-item" key={leave.id || leave.date}>
                      <div className="parent-leave-date">
                        <span className="parent-leave-day">{leave.dateNum}</span>
                        <span className="parent-leave-dayname">{leave.dayName}</span>
                      </div>
                      <div className="parent-leave-info">
                        <div className="parent-leave-type">
                          <span className={`parent-leave-badge ${leave.event_type === 'H' ? 'badge-holiday' : 'badge-leave'}`}>
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

            <section className="parent-panel">
              <div className="parent-panel-header">
                <div>
                  <h3>Pending Fee Section</h3>
                  <p>Largest pending fee items</p>
                </div>
              </div>

              <div className="parent-record-list">
                {loading ? (
                  <div className="parent-empty">Loading pending fees...</div>
                ) : dashboardData.recentPending.length === 0 ? (
                  <div className="parent-empty">No pending fees found.</div>
                ) : (
                  dashboardData.recentPending.map((fee) => (
                    <button type="button" key={fee.id} onClick={() => navigate('/parent/pending-fee')}>
                      <span>P</span>
                      <div>
                        <strong>{fee.month || fee.particulars || 'Pending fee'}</strong>
                        <small>{fee.refno || 'No reference'}</small>
                      </div>
                      <em>{formatCurrency(toAmount(fee.amount) + toAmount(fee.fine))}</em>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="parent-panel">
              <div className="parent-panel-header">
                <div>
                  <h3>Paid Fee Section</h3>
                  <p>Recent paid fee items</p>
                </div>
              </div>

              <div className="parent-record-list">
                {loading ? (
                  <div className="parent-empty">Loading paid fees...</div>
                ) : dashboardData.recentPaid.length === 0 ? (
                  <div className="parent-empty">No paid fees found.</div>
                ) : (
                  dashboardData.recentPaid.map((fee) => (
                    <button type="button" key={fee.id} onClick={() => navigate('/parent/paid-fee')}>
                      <span>F</span>
                      <div>
                        <strong>{fee.particulars || 'Paid fee'}</strong>
                        <small>{fee.refno || 'No reference'}</small>
                      </div>
                      <em>{formatCurrency(fee.amount)}</em>
                    </button>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ParentDashboard;

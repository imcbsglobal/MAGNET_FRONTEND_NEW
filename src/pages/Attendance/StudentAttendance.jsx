import React, { useEffect, useRef, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { getAttendance } from '../../services/api';
import './StudentAttendance.scss';

const today = new Date();

/* ── Donut Chart (pure SVG, CSS-animated) ─────────────────── */
const DonutChart = ({ data, total }) => {
  const size = 140;
  const radius = 54;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  let offset = 0;
  const segments = data.map(item => {
    const pct = total > 0 ? item.value / total : 0;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const rotation = (offset / circumference) * 360 - 90;
    offset += dash;
    return { ...item, dash, gap, rotation };
  });

  return (
    <div className="donut-wrapper">
      <svg
        className="donut-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* track */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={18} />
        {/* segments */}
        {segments.map((seg, i) =>
          seg.value > 0 ? (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={18}
              strokeLinecap="round"
              strokeDasharray={animated ? `${seg.dash} ${seg.gap}` : `0 ${circumference}`}
              strokeDashoffset={0}
              transform={`rotate(${seg.rotation} ${cx} ${cy})`}
              style={{
                transition: `stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s`,
              }}
            />
          ) : null
        )}
        {/* center text */}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="900" fill="#111827">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#94a3b8" letterSpacing="1.5">
          TOTAL DAYS
        </text>
      </svg>

      <div className="donut-legend">
        {data.map((item, i) => (
          <div key={i} className="donut-legend-item">
            <span className="dl-dot" style={{ background: item.color }} />
            <span className="dl-text">{item.label}</span>
            <span className="dl-count">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Animated Bar Row ─────────────────────────────────────── */
const BarRow = ({ label, value, total, color, delay }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const barRef = useRef(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    el.style.setProperty('--bar-target', `${pct}%`);
    const t = setTimeout(() => el.classList.add('animate'), 200 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div className="chart-row">
      <span className="chart-label">{label}</span>
      <div className="chart-bar-wrapper">
        <div
          ref={barRef}
          className="chart-bar"
          style={{ background: color }}
        />
      </div>
      <span className="chart-count">{value}</span>
    </div>
  );
};

/* ── Status Badge ─────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    P: { cls: 'badge-p', label: 'Present' },
    A: { cls: 'badge-a', label: 'Absent' },
    H: { cls: 'badge-h', label: 'Holiday' },
    '': { cls: 'badge-', label: 'Unmarked' },
  };
  const { cls, label } = map[status] || map[''];
  return (
    <span className={`status-badge ${cls}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
};

/* ── Day label helper ─────────────────────────────────────── */
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ══════════════════════════════════════════════════════════ */
const StudentAttendance = () => {
  const navigate = useNavigate();
  const { admno } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [year, setYear] = useState(() => parseInt(searchParams.get('year')) || today.getFullYear());
  const [month, setMonth] = useState(() => parseInt(searchParams.get('month')) || today.getMonth() + 1);

  const studentName = location.state?.studentName || location.state?.name || '';
  const institutionId = localStorage.getItem('institutionId') || '';
  const assignedClass = localStorage.getItem('assignedClass') || '';
  const assignedDivision = localStorage.getItem('assignedDivision') || '';

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    const loadAttendance = async () => {
      if (!institutionId || !assignedClass || !assignedDivision || !admno) {
        setError('Missing student or school information.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await getAttendance(institutionId, year, month);
        const map = {};
        (res.data.records || []).forEach(rec => {
          const day = new Date(rec.date).getDate();
          if (rec.admno === admno) map[day] = rec.status;
        });
        setAttendance(map);
      } catch {
        setError('Unable to load student attendance.');
      } finally {
        setLoading(false);
      }
    };
    loadAttendance();
  }, [institutionId, assignedClass, assignedDivision, admno, year, month]);

  const summary = useMemo(() => {
    const present  = days.filter(d => attendance[d] === 'P').length;
    const absent   = days.filter(d => attendance[d] === 'A').length;
    const holiday  = days.filter(d => attendance[d] === 'H').length;
    const blank    = days.filter(d => !attendance[d]).length;
    return { present, absent, holiday, blank };
  }, [attendance, days]);

  const statusRows = useMemo(() => days.map(d => {
    const status = attendance[d] || '';
    const dayName = DAY_NAMES[new Date(year, month - 1, d).getDay()];
    return { day: d, status, dayName };
  }), [attendance, days, year, month]);

  const chartData = [
    { label: 'Present',  value: summary.present,  color: '#10b981' },
    { label: 'Absent',   value: summary.absent,   color: '#ef4444' },
    { label: 'Holiday',  value: summary.holiday,  color: '#f59e0b' },
    { label: 'Unmarked', value: summary.blank,    color: '#94a3b8' },
  ];

  const totalDays = days.length;
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

  const prevMonth = () => { const d = new Date(year, month - 2); setYear(d.getFullYear()); setMonth(d.getMonth() + 1); };
  const nextMonth = () => { const d = new Date(year, month);     setYear(d.getFullYear()); setMonth(d.getMonth() + 1); };

  const pct = n => totalDays > 0 ? Math.round((n / totalDays) * 100) : 0;

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="teacher" />
      <main className="dashboard-main">
        <Navbar />
        <div className="dashboard-content student-attendance-page">

          {/* ── Header ── */}
          <section className="student-header">
            <button className="back-button" onClick={() => navigate(-1)}>&#8592; Back</button>
            <div className="student-header-text">
              <h2>{studentName || admno}</h2>
              <p>Monthly Attendance Report &nbsp;·&nbsp; Adm No: {admno}</p>
            </div>
            <div className="student-header-month">
              <button onClick={prevMonth}>&#8249;</button>
              <span>{monthName} {year}</span>
              <button onClick={nextMonth}>&#8250;</button>
            </div>
          </section>

          {/* ── Summary Cards ── */}
          <div className="student-att-summary-row">
            {[
              { cls: 'present',  icon: '✅', label: 'Present',  val: summary.present  },
              { cls: 'absent',   icon: '❌', label: 'Absent',   val: summary.absent   },
              { cls: 'holiday',  icon: '🎉', label: 'Holiday',  val: summary.holiday  },
              { cls: 'unmarked', icon: '📋', label: 'Unmarked', val: summary.blank    },
            ].map(({ cls, icon, label, val }) => (
              <div key={cls} className={`student-att-box ${cls}`}>
                <span className="card-icon">{icon}</span>
                <span className="label">{label}</span>
                <span className="value">{val}</span>
                <span className="small">
                  <span className="pct-pill">{pct(val)}% of {totalDays} days</span>
                </span>
              </div>
            ))}
          </div>

          {/* ── Charts + Table ── */}
          <div className="student-att-card">

            {/* Left: Chart Card */}
            <div className="student-chart-card">
              <h3>Attendance Distribution</h3>

              {/* Donut */}
              <DonutChart data={chartData} total={totalDays} />

              {/* Horizontal bars */}
              <div className="student-chart">
                {chartData.map((item, i) => (
                  <BarRow
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    total={totalDays}
                    color={item.color}
                    delay={i * 100}
                  />
                ))}
              </div>
            </div>

            {/* Right: Status Table */}
            <div className="student-status-table">
              <h3>Daily Status — {monthName} {year}</h3>

              {loading ? (
                <div className="status-empty">
                  <span className="empty-icon">⏳</span>
                  <div className="skel" style={{ width: '60%', margin: '0 auto' }} />
                  <div className="skel" style={{ width: '40%', margin: '8px auto 0' }} />
                </div>
              ) : error ? (
                <div className="status-empty error">
                  <span className="empty-icon">⚠️</span>
                  {error}
                </div>
              ) : (
                <div className="status-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statusRows.map(row => (
                        <tr key={row.day}>
                          <td>{row.day}</td>
                          <td className="status-day-label">{row.dayName}</td>
                          <td><StatusBadge status={row.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentAttendance;
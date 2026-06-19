import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchStudentsByClassDivision, saveAttendance, getAttendance, fetchCalendarEvents } from '../../services/api';
import '../SuperUserDashboard/SuperUserDashboard.scss';
import '../ParentDashboard/FeePages.scss';
import './Attendance.scss';

const today = new Date();

const Attendance = () => {
  const institutionId = localStorage.getItem('institutionId') || '';
  const assignedClass = localStorage.getItem('assignedClass') || '';
  const assignedDivision = localStorage.getItem('assignedDivision') || '';

  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const saveTimer = useRef(null);
  const pendingRecordsRef = useRef([]);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [attendance, setAttendance] = useState({});
  const [highlightedCell, setHighlightedCell] = useState(null);
  const [eventDayMap, setEventDayMap] = useState({});

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  const dayStates = useMemo(() => {
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return days.map(d => {
      const cellDate = new Date(year, month - 1, d);
      const future = cellDate > todayDate;
      const weekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
      const dayName = cellDate.toLocaleString('default', { weekday: 'short' }).toLowerCase();
      const allHoliday = students.length > 0 && students.every(s => attendance[d]?.[s.admno] === 'H');
      return { d, dayName, future, weekend, allHoliday };
    });
  }, [days, year, month, students, attendance]);

  const loadData = useCallback(async () => {
    if (!institutionId || !assignedClass || !assignedDivision) {
      setError('No class/division assigned to your account.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [studRes, attRes, eventsRes] = await Promise.all([
        fetchStudentsByClassDivision(institutionId, assignedClass, assignedDivision),
        getAttendance(institutionId, year, month),
        fetchCalendarEvents(institutionId, year, month),
      ]);
      const studentsData = studRes.data || [];
      setStudents(studentsData);

      const eventMap = {};
      (eventsRes.data || []).forEach(ev => {
        const d = new Date(ev.date).getDate();
        if (!eventMap[d]) eventMap[d] = [];
        eventMap[d].push(ev);
      });
      setEventDayMap(eventMap);

      const map = {};
      (attRes.data.records || []).forEach(r => {
        const d = new Date(r.date).getDate();
        if (!map[d]) map[d] = {};
        map[d][r.admno] = r.status;
      });

      studentsData.forEach(s => {
        days.forEach(d => {
          const cellDate = new Date(year, month - 1, d);
          const weekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
          if (!map[d]) map[d] = {};

          const eventForDay = eventMap[d]?.find(ev => ev.event_type === 'H' || ev.event_type === 'L');
          if (eventForDay) {
            if (!Object.prototype.hasOwnProperty.call(map[d], s.admno) || map[d][s.admno] === '') {
              map[d][s.admno] = 'H';
            }
          } else if (weekend) {
            if (!Object.prototype.hasOwnProperty.call(map[d], s.admno)) {
              map[d][s.admno] = 'H';
            }
          }
        });
      });
      setAttendance(map);
    } catch {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [institutionId, assignedClass, assignedDivision, year, month, days]);

  useEffect(() => {
    const load = async () => { await loadData(); };
    load();
  }, [loadData]);

  useEffect(() => {
    if (!highlightedCell) return;
    const timer = setTimeout(() => setHighlightedCell(null), 350);
    return () => clearTimeout(timer);
  }, [highlightedCell]);

  const enqueueRecords = useCallback((records) => {
    pendingRecordsRef.current = [...pendingRecordsRef.current, ...records];
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const uniqueMap = {};
      pendingRecordsRef.current.forEach(rec => {
        const key = `${rec.admno}-${rec.date}`;
        uniqueMap[key] = rec;
      });
      const finalRecords = Object.values(uniqueMap);
      pendingRecordsRef.current = [];
      if (finalRecords.length) {
        await saveAttendance({ institution_id: institutionId, records: finalRecords });
      }
    }, 600);
  }, [institutionId]);

  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, []);

  const setCell = (admno, day, status) => {
    const dayMeta = dayStates.find(d => d.d === day);
    if (!dayMeta || dayMeta.future) return;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setAttendance(prev => {
      const dayMap = prev[day] || {};
      const next = { ...prev, [day]: { ...dayMap, [admno]: status } };
      enqueueRecords([{ admno, date: dateStr, status }]);
      return next;
    });
    setHighlightedCell({ admno, day });
  };

  const bulkDay = (day, status) => {
    const dayMeta = dayStates.find(d => d.d === day);
    if (!dayMeta || dayMeta.future) return;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setAttendance(prev => {
      const dayMap = prev[day] || {};
      const nextDayMap = { ...dayMap };
      students.forEach(s => { nextDayMap[s.admno] = status; });
      return { ...prev, [day]: nextDayMap };
    });
    enqueueRecords(students.map(s => ({ admno: s.admno, date: dateStr, status })));
  };

  const getSummary = (admno) => {
    let present = 0, absent = 0, holiday = 0, halfDay = 0;
    days.forEach(d => {
      const cellDate = new Date(year, month - 1, d);
      const weekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
      const recordedStatus = attendance[d] && Object.prototype.hasOwnProperty.call(attendance[d], admno)
        ? attendance[d][admno]
        : undefined;
      const value = recordedStatus !== undefined
        ? recordedStatus
        : (weekend ? 'H' : '');
      if (value === 'P') present += 1;
      if (value === 'A') absent += 1;
      if (value === 'H') holiday += 1;
      if (value === 'HD') halfDay += 1;
    });
    return { total: days.length, present, absent, holiday, halfDay };
  };

  const totals = useMemo(() => {
    let totalPresent = 0, totalAbsent = 0, totalHoliday = 0, totalHalfDay = 0;
    const isCurrent = month === today.getMonth() + 1 && year === today.getFullYear();
    if (isCurrent) {
      students.forEach(s => {
        const value = attendance[today.getDate()]?.[s.admno];
        if (value === 'P') totalPresent += 1;
        if (value === 'A') totalAbsent += 1;
        if (value === 'HD') totalHalfDay += 1;
      });
    }
    days.forEach(d => {
      const cellDate = new Date(year, month - 1, d);
      const weekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
      const dayHasHoliday = students.some(s => attendance[d]?.[s.admno] === 'H');
      const allMarkedHoliday = students.length > 0 && students.every(s => attendance[d]?.[s.admno] === 'H');
      const hasClearOverride = students.some(s => attendance[d] && Object.prototype.hasOwnProperty.call(attendance[d], s.admno) && attendance[d][s.admno] === '');
      if (dayHasHoliday || ((weekend && !hasClearOverride) || allMarkedHoliday)) {
        totalHoliday += 1;
      }
    });
    return { totalPresent, totalAbsent, totalHoliday, totalHalfDay };
  }, [attendance, students, days, month, year]);

  const { totalPresent, totalAbsent, totalHoliday, totalHalfDay } = totals;
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
  const prevMonth = () => { const d = new Date(year, month - 2); setYear(d.getFullYear()); setMonth(d.getMonth() + 1); };
  const nextMonth = () => { const d = new Date(year, month); setYear(d.getFullYear()); setMonth(d.getMonth() + 1); };

  const getEventLabel = (day) => {
    const events = eventDayMap[day] || [];
    return events.map((ev) => ev.title).filter(Boolean).join(', ');
  };

  const getDayTitle = (day, dayName) => {
    const eventLabel = getEventLabel(day);
    const weekendLabel = dayName.toLowerCase() === 'sat' || dayName.toLowerCase() === 'sun' ? 'Weekend' : '';
    const baseTitle = `${dayName.toUpperCase()} ${day}`;
    if (eventLabel && weekendLabel) return `${weekendLabel}: ${eventLabel}`;
    if (eventLabel) return eventLabel;
    if (weekendLabel) return `${baseTitle} (${weekendLabel})`;
    return baseTitle;
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="teacher" />
      <main className="dashboard-main">
        <Navbar />
        <div className="dashboard-content">

          {/* ── Header ── */}
          <section className="welcome-section">
            <div>
              <h2>Attendance — Class {assignedClass} {assignedDivision}</h2>
              <p>Mark monthly attendance for your students.</p>
            </div>
            <div className="att-month-nav">
              <button onClick={prevMonth}>&#8249;</button>
              <span>{monthName} {year}</span>
              <button onClick={nextMonth}>&#8250;</button>
            </div>
          </section>

          {/* ── Summary Cards ── */}
          <div className="att-summary-row">
            <div className="att-box">
              <span className="att-box-label">Total Students</span>
              <span className="att-box-value">{students.length}</span>
            </div>
            <div className="att-box present">
              <span className="att-box-label">Today Present</span>
              <span className="att-box-value">{totalPresent}</span>
            </div>
            <div className="att-box absent">
              <span className="att-box-label">Today Absent</span>
              <span className="att-box-value">{totalAbsent}</span>
            </div>
            <div className="att-box halfday">
              <span className="att-box-label">Today Half Day</span>
              <span className="att-box-value">{totalHalfDay}</span>
            </div>
            <div className="att-box holiday">
              <span className="att-box-label">Holiday Days</span>
              <span className="att-box-value">{totalHoliday}</span>
            </div>
          </div>

          {/* ── Table Card ── */}
          <div className="fee-table-card" style={{ padding: 0 }}>
            {loading ? (
              <div className="att-empty">
                <div className="att-empty-icon">⏳</div>
                <p>Loading attendance data…</p>
              </div>
            ) : error ? (
              <div className="att-empty">
                <div className="att-empty-icon">⚠️</div>
                <p className="error-message">{error}</p>
              </div>
            ) : (
              <>
                <div className="att-legend">
                  <span className="legend-item"><span className="legend-dot l-p"></span>Present</span>
                  <span className="legend-item"><span className="legend-dot l-a"></span>Absent</span>
                  <span className="legend-item"><span className="legend-dot l-d"></span>Half Day</span>
                  <span className="legend-item"><span className="legend-dot l-h"></span>Holiday / Weekend</span>
                  <span className="legend-item"><span className="legend-dot l-f"></span>Future (locked)</span>
                </div>
                <div className="table-responsive">
                  <table className="att-table">
                    <thead>
                      {/* Bulk action row */}
                      <tr className="bulk-row">
                        <th colSpan={4} className="bulk-label">Bulk Mark</th>
                        {dayStates.map(({ d, future, weekend, allHoliday }) => (
                          <th key={d} className="bulk-cell">
                            <div className="bulk-btns">
                              <button title="Mark All Present"   className="bp" disabled={future} onClick={() => bulkDay(d, 'P')}>P</button>
                              <button title="Mark All Absent"    className="ba" disabled={future} onClick={() => bulkDay(d, 'A')}>A</button>
                              <button title="Mark All Half Day" className="bd" disabled={future} onClick={() => bulkDay(d, 'HD')}>HD</button>
                              <button title="Mark All Holiday"  className="bh" disabled={future} onClick={() => bulkDay(d, 'H')}>H</button>
                              <button title="Clear All"         className="bc" disabled={future} onClick={() => bulkDay(d, '')}>—</button>
                            </div>
                          </th>
                        ))}
                        <th colSpan={4}></th>
                      </tr>

                      {/* Column headers */}
                      <tr>
                        <th>#</th>
                        <th>Adm No</th>
                        <th>Student Name</th>
                        <th>View</th>
                        {dayStates.map(({ d, dayName }) => {
                          return (
                            <th key={d} className="day-th" title={getDayTitle(d, dayName)}>
                              <div className="day-label-wrap">
                                <span className="day-number">{d}</span>
                                <span className="day-name">{dayName}</span>
                              </div>
                            </th>
                          );
                        })}
                        <th className="sum-th">Days</th>
                        <th className="sum-th present-th">P</th>
                        <th className="sum-th absent-th">A</th>
                        <th className="sum-th halfday-th">D</th>
                        <th className="sum-th holiday-th">H</th>
                      </tr>
                    </thead>

                    <tbody>
                      {students.map((s, idx) => {
                        const sum = getSummary(s.admno);
                        return (
                          <tr key={s.admno}>
                            <td>{idx + 1}</td>
                            <td>{s.admno}</td>
                            <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{s.student_name}</td>
                            <td className="att-view-cell">
                              <button
                                className="student-view-btn"
                                type="button"
                                title="View detailed attendance"
                                onClick={() => navigate(`/staff/attendance/student/${encodeURIComponent(s.admno)}?year=${year}&month=${month}`, {
                                  state: { studentName: s.student_name },
                                })}
                              >
                                👁️
                              </button>
                            </td>
                            {dayStates.map(({ d, dayName, future, weekend, allHoliday }) => {
                              const recordedStatus = attendance[d] && Object.prototype.hasOwnProperty.call(attendance[d], s.admno)
                                ? attendance[d][s.admno]
                                : undefined;
                              const val = recordedStatus !== undefined
                                ? recordedStatus
                                : (weekend ? 'H' : '');
                              const isHolidayWeekend = weekend && val === 'H';
                              const isHighlighted = highlightedCell?.admno === s.admno && highlightedCell?.day === d;
                              const eventLabel = getEventLabel(d);
                              const cellTitle = eventLabel || (weekend ? `${dayName.toUpperCase()} ${d} (Weekend)` : undefined);
                              const cellClass = [
                                'att-cell',
                                val === 'P' ? 'cell-p' : val === 'A' ? 'cell-a' : val === 'HD' ? 'cell-d' : val === 'H' ? 'cell-h' : '',
                                future ? 'cell-future' : '',
                                isHolidayWeekend ? 'cell-weekend' : '',
                                isHighlighted ? 'cell-flash' : '',
                              ].filter(Boolean).join(' ');
                              return (
                                <td key={d} className={cellClass} title={cellTitle}>
                                  <select value={val} disabled={future} onChange={e => setCell(s.admno, d, e.target.value)}>
                                    <option value="">–</option>
                                    <option value="P">P</option>
                                    <option value="A">A</option>
                                    <option value="HD">HD</option>
                                    <option value="H">H</option>
                                  </select>
                                </td>
                              );
                            })}
                            <td className="sum-total">{sum.total}</td>
                            <td className="sum-p">{sum.present}</td>
                            <td className="sum-a">{sum.absent}</td>
                            <td className="sum-d">{sum.halfDay}</td>
                            <td className="sum-h">{sum.holiday}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default Attendance;
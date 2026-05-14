import { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import {
  fetchCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../../services/api';
import './CalendarSetup.scss';

const EVENT_TYPES = [
  { value: 'H', label: 'Holiday' },
  { value: 'L', label: 'Leave' },
  { value: 'E', label: 'Event' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (value) => String(value).padStart(2, '0');
const formatISODate = (date) => date.toISOString().slice(0, 10);

const getEventKey = (event) => {
  try {
    return formatISODate(new Date(event.date));
  } catch {
    return event.date;
  }
};

const CalendarSetup = () => {
  const institutionId = localStorage.getItem('institutionId') || '';
  const today = new Date();
  const initialYear = today.getFullYear();
  const initialMonth = today.getMonth() + 1;
  const initialDate = formatISODate(today);

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    id: null,
    date: initialDate,
    event_type: 'H',
    title: '',
    description: '',
  });
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadEvents = useCallback(async () => {
    if (!institutionId) {
      setError('Institution ID missing. Please log in again.');
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetchCalendarEvents(institutionId, year, month);
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const serverMessage = err?.response?.data?.error || err?.response?.data?.message;
      const status = err?.response?.status;
      if (status === 404) {
        setError('Calendar API route not found. Ensure the backend exposes /api/calendar/events/by_month/.');
      } else if (serverMessage) {
        setError(`Unable to load calendar events: ${serverMessage}`);
      } else {
        setError('Unable to load calendar events. Please check the institution ID or API connection.');
      }
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [institutionId, year, month]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  useEffect(() => {
    const newDate = `${year}-${pad(month)}-01`;
    setSelectedDate(newDate);
    setForm((prev) => ({ ...prev, date: newDate, id: null, title: '', description: '' }));
  }, [year, month]);

  const eventsByDate = useMemo(() => {
    return events.reduce((map, event) => {
      const key = getEventKey(event);
      if (!map[key]) map[key] = [];
      map[key].push(event);
      return map;
    }, {});
  }, [events]);

  const selectedDateEvents = eventsByDate[selectedDate] || [];

  const getDayClass = (dayEvents) => {
    if (!dayEvents.length) return '';
    const types = [...new Set(dayEvents.map((e) => e.event_type))];
    return types.length === 1 ? `has-${types[0].toLowerCase()}` : 'has-mixed';
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayIndex = new Date(year, month - 1, 1).getDay();
  const calendarCells = Array.from({ length: firstDayIndex + daysInMonth }, (_, i) =>
    i < firstDayIndex ? null : i - firstDayIndex + 1
  );

  const years = Array.from({ length: 5 }, (_, i) => initialYear - 2 + i);

  const resetForm = () =>
    setForm({ id: null, date: selectedDate, event_type: 'H', title: '', description: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!institutionId) { setError('Institution ID missing. Please log in again.'); return; }
    if (!form.date || !form.title) { setError('Date and title are required.'); return; }

    const payload = {
      institution_id: institutionId,
      date: form.date,
      event_type: form.event_type,
      title: form.title,
      description: form.description,
    };

    const getErrorMessage = (err) => {
      const res = err?.response;
      if (!res) return 'Failed to save calendar event. Please check the network connection.';
      const { status, data } = res;
      if (status === 404) return 'Calendar API route not found. Ensure the backend exposes /api/calendar/events/.';
      if (data) {
        const msg = data.error || data.message || data.detail;
        if (msg) return `Failed to save calendar event: ${msg}`;
        if (typeof data === 'object') return `Failed to save calendar event: ${Object.values(data).flat().join(' ')}`;
      }
      return 'Failed to save calendar event. Please check the institution ID or API connection.';
    };

    try {
      if (form.id) {
        await updateCalendarEvent(form.id, payload);
        setSuccess('Event updated successfully.');
      } else {
        await createCalendarEvent(payload);
        setSuccess('Event added successfully.');
      }
      resetForm();
      await loadEvents();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleEdit = (event) => {
    const eventDate = getEventKey(event);
    setSelectedDate(eventDate);
    setForm({ id: event.id, date: eventDate, event_type: event.event_type, title: event.title, description: event.description || '' });
  };

  const handleDateClick = (day) => {
    const isoDate = `${year}-${pad(month)}-${pad(day)}`;
    setSelectedDate(isoDate);
    setForm((prev) => ({ ...prev, date: isoDate, id: null, title: '', description: '' }));
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCalendarEvent(deleteId);
      setSuccess('Event deleted successfully.');
      setShowDeleteConfirm(false);
      setDeleteId(null);
      await loadEvents();
    } catch {
      setError('Unable to delete event.');
    }
  };

  const summaryCounts = useMemo(() => {
    return events.reduce((acc, e) => {
      acc[e.event_type] = (acc[e.event_type] || 0) + 1;
      return acc;
    }, {});
  }, [events]);

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="admin" />
      <main className="dashboard-main">
        <Navbar />
        <div className="calendar-page">

          {/* ── Page Header ── */}
          <header className="calendar-header">
            <div className="calendar-header-title">
              <div className="header-eyebrow">Academic Management</div>
              <h1>Calendar Setup</h1>
              <p>Define holidays, leaves, and institutional events for the selected period.</p>
            </div>
            <div className="calendar-header-controls">
              <div className="control-group">
                <label className="control-label" htmlFor="year-select">Year</label>
                <select id="year-select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="control-group">
                <label className="control-label" htmlFor="month-select">Month</label>
                <select id="month-select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {MONTH_NAMES.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
                </select>
              </div>
            </div>
          </header>

          {/* ── Body ── */}
          <section className="calendar-body">

            {/* ── Left Panel ── */}
            <aside className="calendar-sidebar">
              <div className="panel-section">
                <div className="panel-section-header">
                  <h2>{form.id ? 'Edit Event' : 'Add Event'}</h2>
                </div>
                <form className="calendar-form" onSubmit={handleSubmit}>
                  <div className="field-group">
                    <label htmlFor="event-date">Date</label>
                    <input
                      id="event-date"
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>

                  <div className="field-group">
                    <label htmlFor="event-type">Type</label>
                    <select
                      id="event-type"
                      value={form.event_type}
                      onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                    >
                      {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>

                  <div className="field-group">
                    <label htmlFor="event-title">Title</label>
                    <input
                      id="event-title"
                      type="text"
                      value={form.title}
                      placeholder="e.g. Republic Day"
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>

                  <div className="field-group">
                    <label htmlFor="event-desc">Notes <span className="optional">(optional)</span></label>
                    <textarea
                      id="event-desc"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Additional details…"
                      rows={3}
                    />
                  </div>

                  {error && <div className="form-message error">{error}</div>}
                  {success && <div className="form-message success">{success}</div>}

                  <div className="form-actions">
                    <button type="submit" className="btn-primary">{form.id ? 'Update' : 'Save'} Event</button>
                    {form.id && <button type="button" className="btn-ghost" onClick={resetForm}>Cancel</button>}
                  </div>
                </form>
              </div>

              {/* ── Selected Date ── */}
              <div className="panel-section selected-day-panel">
                <div className="panel-section-header">
                  <h2>Selected Date</h2>
                  <span className="selected-date-label">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {selectedDateEvents.length === 0 ? (
                  <p className="empty-state">No events for this date.</p>
                ) : (
                  <div className="selected-day-events">
                    {selectedDateEvents.map((event) => (
                      <div key={event.id} className="event-row">
                        <span className={`event-badge event-${event.event_type.toLowerCase()}`}>
                          {EVENT_TYPES.find((t) => t.value === event.event_type)?.label || event.event_type}
                        </span>
                        <div className="event-row-body">
                          <strong>{event.title}</strong>
                          {event.description && <p>{event.description}</p>}
                        </div>
                        <button className="btn-icon-edit" type="button" onClick={() => handleEdit(event)}>Edit</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            {/* ── Calendar Main ── */}
            <div className="calendar-main">
              <div className="calendar-grid-header">
                <div>
                  <h2>{MONTH_NAMES[month - 1]} {year}</h2>
                  <p>Click a date to select it and fill in event details.</p>
                </div>
                <div className="legend">
                  <span className="legend-item legend-h">Holiday</span>
                  <span className="legend-item legend-l">Leave</span>
                  <span className="legend-item legend-e">Event</span>
                  {events.length > 0 && (
                    <span className="event-count-badge">{events.length} total</span>
                  )}
                </div>
              </div>

              {/* Grid */}
              <div className="calendar-grid">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="calendar-weekday">{d}</div>
                ))}
                {calendarCells.map((day, index) => {
                  const isoDate = day ? `${year}-${pad(month)}-${pad(day)}` : null;
                  const dayEvents = day ? (eventsByDate[isoDate] || []) : [];
                  const isToday = isoDate === formatISODate(today);
                  const dayOfWeek = day ? (firstDayIndex + (day - 1)) % 7 : -1;
                  const isWeekend = day && (dayOfWeek === 0 || dayOfWeek === 6);
                  return (
                    <button
                      type="button"
                      key={`${index}-${day}`}
                      className={[
                        'calendar-day',
                        day ? getDayClass(dayEvents) : 'calendar-day-empty',
                        isWeekend && !dayEvents.length ? 'calendar-day-weekend' : '',
                        isWeekend ? 'is-weekend' : '',
                        isoDate === selectedDate ? 'calendar-day-selected' : '',
                        isToday ? 'calendar-day-today' : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => day && handleDateClick(day)}
                      disabled={!day}
                      title={isoDate || ''}
                    >
                      <span className="day-number">{day || ''}</span>
                      {(dayEvents.length > 0 || isWeekend) && (
                        <span className="day-dot-row">
                          {isWeekend && dayEvents.length === 0 && (
                            <span className="weekend-label">Off</span>
                          )}
                          {dayEvents.slice(0, 3).map((ev, di) => (
                            <span key={di} className={`day-dot dot-${ev.event_type.toLowerCase()}`} />
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Events Table */}
              <div className="calendar-events-list">
                <div className="events-list-header">
                  <h3>Monthly Events</h3>
                  <div className="summary-pills">
                    {summaryCounts['H'] && <span className="summary-pill pill-h">{summaryCounts['H']} Holiday</span>}
                    {summaryCounts['L'] && <span className="summary-pill pill-l">{summaryCounts['L']} Leave</span>}
                    {summaryCounts['E'] && <span className="summary-pill pill-e">{summaryCounts['E']} Event</span>}
                  </div>
                </div>
                {loading ? (
                  <div className="empty-state">Loading…</div>
                ) : events.length === 0 ? (
                  <div className="empty-state">No events scheduled for this month.</div>
                ) : (
                  <div className="events-table-wrapper">
                    <table className="calendar-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Title</th>
                          <th>Notes</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.map((event) => (
                          <tr key={event.id}>
                            <td className="td-date">{new Date(getEventKey(event) + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td>
                              <span className={`event-badge event-${event.event_type.toLowerCase()}`}>
                                {EVENT_TYPES.find((t) => t.value === event.event_type)?.label || event.event_type}
                              </span>
                            </td>
                            <td className="td-title">{event.title}</td>
                            <td className="td-notes">{event.description || <span className="muted">—</span>}</td>
                            <td className="td-actions">
                              <button className="btn-table-edit" type="button" onClick={() => handleEdit(event)}>Edit</button>
                              <button className="btn-table-delete" type="button" onClick={() => { setDeleteId(event.id); setShowDeleteConfirm(true); }}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>

          <ConfirmModal
            isOpen={showDeleteConfirm}
            title="Delete Calendar Event"
            message="Are you sure you want to delete this calendar event? This action cannot be undone."
            onConfirm={confirmDelete}
            onCancel={() => setShowDeleteConfirm(false)}
            confirmText="Delete"
            type="danger"
          />
        </div>
      </main>
    </div>
  );
};

export default CalendarSetup;
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import {
  fetchMarkEntryClasses,
  fetchMarkEntryDivisions,
  fetchMarkEntrySubjects,
  fetchAssessmentItems,
  fetchSavedMarks,
} from '../../services/api';
import './Reports.scss';

const TERMS = ['Term 1', 'Term 2', 'Term 3'];

const ChartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);

export default function ClassReport() {
  const institutionId = localStorage.getItem('institutionId') || '';

  const [classes,     setClasses]     = useState([]);
  const [divisions,   setDivisions]   = useState([]);
  const [subjects,    setSubjects]    = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [marks,       setMarks]       = useState([]);

  const [filter, setFilter] = useState({
    student_class: '', division: '', subject: '', assessmentitem: '', term: 'Term 1',
  });

  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!institutionId) return;
    Promise.all([
      fetchMarkEntryClasses(institutionId),
      fetchMarkEntrySubjects(institutionId),
      fetchAssessmentItems(institutionId),
    ]).then(([c, s, a]) => {
      setClasses(c.data);
      setSubjects(s.data);
      setAssessments(a.data);
    });
  }, [institutionId]);

  useEffect(() => {
    if (!filter.student_class) { setDivisions([]); return; }
    fetchMarkEntryDivisions(institutionId, filter.student_class)
      .then(r => setDivisions(r.data));
  }, [filter.student_class, institutionId]);

  const handleFilter = (key, val) => {
    setFilter(prev => ({ ...prev, [key]: val }));
    setMarks([]);
    setSearched(false);
  };

  const allSelected = filter.student_class && filter.division &&
                      filter.subject && filter.assessmentitem && filter.term;

  const loadReport = async () => {
    if (!allSelected) return;
    setLoading(true);
    setSearched(true);
    try {
      const r = await fetchSavedMarks({
        institution_id: institutionId,
        class:          filter.student_class,
        division:       filter.division,
        subject:        filter.subject,
        assessmentitem: filter.assessmentitem,
        term:           filter.term,
      });
      setMarks(r.data);
    } finally {
      setLoading(false);
    }
  };

  const subjectName = (code) => subjects.find(s => s.code === code)?.name || code;

  const avg = marks.length
    ? (marks.reduce((s, m) => s + (parseFloat(m.mark) || 0), 0) / marks.length).toFixed(1)
    : '—';
  const highest = marks.length ? Math.max(...marks.map(m => parseFloat(m.mark) || 0)) : '—';
  const passed  = marks.filter(m => m.mark && m.maxmark &&
    (parseFloat(m.mark) / parseFloat(m.maxmark)) >= 0.35).length;

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="admin" />
      <main className="dashboard-main">
        <Navbar />
        <div className="rp-page">

          {/* ── Header ── */}
          <div className="rp-header-card">
            <div className="rp-header-main">
              <div className="rp-header-icon"><ChartIcon /></div>
              <div>
                <h1>Class Report</h1>
                <p>View marks for any class, subject, and term</p>
              </div>
            </div>
            {marks.length > 0 && (
              <span className="rp-pill rp-pill--info">
                {marks.length} students
              </span>
            )}
          </div>

          {/* ── Filters ── */}
          <div className="rp-filter-card">
            <div className="rp-filter-grid">
              <div className="rp-field">
                <label>Class</label>
                <select value={filter.student_class} onChange={e => handleFilter('student_class', e.target.value)}>
                  <option value="">Select</option>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="rp-field">
                <label>Division</label>
                <select value={filter.division} onChange={e => handleFilter('division', e.target.value)} disabled={!filter.student_class}>
                  <option value="">Select</option>
                  {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="rp-field">
                <label>Subject</label>
                <select value={filter.subject} onChange={e => handleFilter('subject', e.target.value)}>
                  <option value="">Select</option>
                  {subjects.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
              </div>
              <div className="rp-field">
                <label>Assessment</label>
                <select value={filter.assessmentitem} onChange={e => handleFilter('assessmentitem', e.target.value)}>
                  <option value="">Select</option>
                  {assessments.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
                </select>
              </div>
              <div className="rp-field">
                <label>Term</label>
                <select value={filter.term} onChange={e => handleFilter('term', e.target.value)}>
                  {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="rp-filter-action">
              <button className="rp-view-btn" onClick={loadReport} disabled={!allSelected || loading}>
                {loading ? 'Loading…' : 'View Report'}
              </button>
            </div>
          </div>

          {/* ── Summary cards ── */}
          {marks.length > 0 && (
            <div className="rp-summary-row">
              <div className="rp-stat-card">
                <span className="rp-stat-label">Students</span>
                <span className="rp-stat-value">{marks.length}</span>
              </div>
              <div className="rp-stat-card">
                <span className="rp-stat-label">Average</span>
                <span className="rp-stat-value">{avg}</span>
              </div>
              <div className="rp-stat-card">
                <span className="rp-stat-label">Highest</span>
                <span className="rp-stat-value">{highest}</span>
              </div>
              <div className="rp-stat-card rp-stat-card--accent">
                <span className="rp-stat-label">Passed ≥35%</span>
                <span className="rp-stat-value">{passed}</span>
              </div>
            </div>
          )}

          {/* ── Empty ── */}
          {searched && !loading && marks.length === 0 && (
            <div className="rp-empty">No marks found for this selection.</div>
          )}

          {/* ── Table / Cards ── */}
          {marks.length > 0 && (
            <div className="rp-table-card">
              {/* Desktop table */}
              <div className="rp-table-responsive">
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th className="rp-col-num">#</th>
                      <th className="rp-col-adm">Admission</th>
                      <th>Student Name</th>
                      <th>Subject</th>
                      <th className="rp-col-money">Mark</th>
                      <th className="rp-col-money">Max</th>
                      <th className="rp-col-money">%</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marks.map((m, i) => {
                      const pct = m.mark && m.maxmark
                        ? ((parseFloat(m.mark) / parseFloat(m.maxmark)) * 100).toFixed(1)
                        : null;
                      const fail = pct && parseFloat(pct) < 35;
                      return (
                        <tr key={m.id}>
                          <td className="rp-col-num rp-td-num">{i + 1}</td>
                          <td className="rp-col-adm rp-td-adm">{m.admission}</td>
                          <td className="rp-td-name">{m.student_name}</td>
                          <td>{subjectName(m.subject)}</td>
                          <td className="rp-col-money rp-td-mark">{m.mark ?? '—'}</td>
                          <td className="rp-col-money rp-td-max">{m.maxmark ?? '—'}</td>
                          <td className="rp-col-money">
                            {pct ? <span className={`rp-pct-badge ${fail ? 'rp-pct-badge--fail' : 'rp-pct-badge--pass'}`}>{pct}%</span> : '—'}
                          </td>
                          <td>{m.grade ? <span className="rp-grade-badge">{m.grade}</span> : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile result cards */}
              <div className="rp-result-card-list">
                {marks.map((m, i) => {
                  const pct = m.mark && m.maxmark
                    ? ((parseFloat(m.mark) / parseFloat(m.maxmark)) * 100).toFixed(1)
                    : null;
                  const fail = pct && parseFloat(pct) < 35;
                  return (
                    <div key={m.id} className="rp-result-card">
                      <div className="rp-result-card-top">
                        <div className="rp-result-card-id">
                          <span className="rp-result-num">{i + 1}</span>
                          <span className="rp-result-adm">{m.admission}</span>
                        </div>
                        {m.grade && <span className="rp-grade-badge">{m.grade}</span>}
                      </div>
                      <div className="rp-result-name">{m.student_name}</div>
                      <div className="rp-result-row">
                        <span className="rp-result-subject">{subjectName(m.subject)}</span>
                        <div className="rp-result-scores">
                          <span className="rp-result-mark">{m.mark ?? '—'} / {m.maxmark ?? '—'}</span>
                          {pct && <span className={`rp-pct-badge ${fail ? 'rp-pct-badge--fail' : 'rp-pct-badge--pass'}`}>{pct}%</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
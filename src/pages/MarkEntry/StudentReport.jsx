import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import { fetchSavedMarks, fetchMarkEntrySubjects, fetchAssessmentItems } from '../../services/api';
import './Reports.scss';

const TERMS = ['Term 1', 'Term 2', 'Term 3'];

const ReportCardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

export default function StudentReport() {
  const institutionId = localStorage.getItem('institutionId') || '';
  const admno         = localStorage.getItem('admno') || '';
  const studentName   = localStorage.getItem('studentName') || 'Student';

  const [subjects,    setSubjects]    = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [term,        setTerm]        = useState('Term 1');
  const [marks,       setMarks]       = useState([]);
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    if (!institutionId) return;
    Promise.all([
      fetchMarkEntrySubjects(institutionId),
      fetchAssessmentItems(institutionId),
    ]).then(([s, a]) => {
      setSubjects(s.data);
      setAssessments(a.data);
    });
  }, [institutionId]);

  useEffect(() => {
    if (!admno || !term) return;
    setLoading(true);
    fetchSavedMarks({ institution_id: institutionId, term, admission: admno })
      .then(r => setMarks(r.data))
      .catch(() => setMarks([]))
      .finally(() => setLoading(false));
  }, [term, admno, institutionId]);

  const subjectName = (code) => subjects.find(s => s.code === code)?.name  || code;
  const assessName  = (code) => assessments.find(a => a.code === code)?.name || code;

  const pct = (mark, maxmark) => {
    if (!mark || !maxmark) return null;
    return ((parseFloat(mark) / parseFloat(maxmark)) * 100).toFixed(1);
  };

  const totalMark = marks.reduce((s, m) => s + (parseFloat(m.mark)    || 0), 0);
  const totalMax  = marks.reduce((s, m) => s + (parseFloat(m.maxmark) || 0), 0);
  const overallPct = pct(totalMark, totalMax);

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="parent" />
      <main className="dashboard-main">
        <Navbar />
        <div className="rp-page">

          {/* ── Header ── */}
          <div className="rp-header-card">
            <div className="rp-header-main">
              <div className="rp-header-icon"><ReportCardIcon /></div>
              <div>
                <h1>My Report Card</h1>
                <p>{studentName} · {admno}</p>
              </div>
            </div>
            {/* Term tabs */}
            <div className="rp-term-tabs">
              {TERMS.map(t => (
                <button
                  key={t}
                  className={`rp-term-tab ${term === t ? 'rp-term-tab--active' : ''}`}
                  onClick={() => setTerm(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="rp-empty">Loading marks…</div>
          ) : marks.length === 0 ? (
            <div className="rp-empty">No marks recorded for {term} yet.</div>
          ) : (
            <>
              {/* ── Summary ── */}
              <div className="rp-summary-row">
                <div className="rp-stat-card">
                  <span className="rp-stat-label">Subjects</span>
                  <span className="rp-stat-value">{marks.length}</span>
                </div>
                <div className="rp-stat-card">
                  <span className="rp-stat-label">Total Mark</span>
                  <span className="rp-stat-value">{totalMark} / {totalMax}</span>
                </div>
                <div className="rp-stat-card rp-stat-card--accent">
                  <span className="rp-stat-label">Overall %</span>
                  <span className="rp-stat-value">{overallPct ? `${overallPct}%` : '—'}</span>
                </div>
              </div>

              {/* ── Table / Cards ── */}
              <div className="rp-table-card">
                {/* Desktop table */}
                <div className="rp-table-responsive">
                  <table className="rp-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Assessment</th>
                        <th className="rp-col-money">Mark</th>
                        <th className="rp-col-money">Max</th>
                        <th className="rp-col-money">%</th>
                        <th>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marks.map(m => {
                        const p    = pct(m.mark, m.maxmark);
                        const fail = p && parseFloat(p) < 35;
                        return (
                          <tr key={m.id}>
                            <td className="rp-td-subject">{subjectName(m.subject)}</td>
                            <td>{assessName(m.assessmentitem)}</td>
                            <td className="rp-col-money rp-td-mark">{m.mark ?? '—'}</td>
                            <td className="rp-col-money rp-td-max">{m.maxmark ?? '—'}</td>
                            <td className="rp-col-money">
                              {p ? <span className={`rp-pct-badge ${fail ? 'rp-pct-badge--fail' : 'rp-pct-badge--pass'}`}>{p}%</span> : '—'}
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
                  {marks.map(m => {
                    const p    = pct(m.mark, m.maxmark);
                    const fail = p && parseFloat(p) < 35;
                    return (
                      <div key={m.id} className="rp-result-card">
                        <div className="rp-result-card-top">
                          <span className="rp-result-subject-badge">{subjectName(m.subject)}</span>
                          {m.grade && <span className="rp-grade-badge">{m.grade}</span>}
                        </div>
                        <div className="rp-result-assess">{assessName(m.assessmentitem)}</div>
                        <div className="rp-result-row">
                          <span className="rp-result-mark">{m.mark ?? '—'} / {m.maxmark ?? '—'}</span>
                          {p && <span className={`rp-pct-badge ${fail ? 'rp-pct-badge--fail' : 'rp-pct-badge--pass'}`}>{p}%</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
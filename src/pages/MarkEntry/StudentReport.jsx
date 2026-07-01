import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import {
  fetchSavedMarks,
  fetchMarkEntrySubjects,
  fetchAssessmentItems,
  fetchAssessmentParts,
} from '../../services/api';
import './Reports.scss';

const PASS_MARK_PCT = 35;

export default function StudentReport() {
  const institutionId = localStorage.getItem('institutionId') || '';
  const admno         = localStorage.getItem('admno') || '';
  const studentName   = localStorage.getItem('studentName') || 'Student';

  const [assessments, setAssessments] = useState([]); // [{code, name}]
  const [terms,       setTerms]       = useState([]); // [{code, name}]
  const [marks,       setMarks]       = useState([]);
  const [subjects,    setSubjects]    = useState([]); // subjects assigned to this student's ACTUAL class
  const [studentClass,setStudentClass]= useState('');
  const [studentDiv,  setStudentDiv]  = useState('');
  const [loading,     setLoading]     = useState(true);

  // Lookup data: assessment types + term names (not class-dependent)
  useEffect(() => {
    if (!institutionId) return;
    Promise.all([
      fetchAssessmentItems(institutionId),
      fetchAssessmentParts(institutionId),
    ]).then(([a, t]) => {
      setAssessments(a.data || []);
      setTerms(t.data || []);
    });
  }, [institutionId]);

  // Every mark entered for this student, across all terms/assessments
  useEffect(() => {
    if (!admno) return;
    setLoading(true);
    fetchSavedMarks({ institution_id: institutionId, admission: admno })
      .then(r => setMarks(r.data || []))
      .catch(() => setMarks([]))
      .finally(() => setLoading(false));
  }, [admno, institutionId]);

  // Derive the student's REAL class/division from their own saved marks —
  // never trust a guessed localStorage key, since MarkEntry rows already
  // carry the authoritative student_class/division for this admission no.
  useEffect(() => {
    if (marks.length === 0) return;
    const cls = marks[0].student_class;
    const div = marks[0].division;
    setStudentClass(cls || '');
    setStudentDiv(div || '');
  }, [marks]);

  // Once we know the real class, fetch ONLY the subjects assigned to it
  // (via Subject Master's SubjectClassAssignment) — not all institution subjects.
  useEffect(() => {
    if (!institutionId || !studentClass) return;
    fetchMarkEntrySubjects(institutionId, studentClass)
      .then(r => setSubjects(r.data || []))
      .catch(() => setSubjects([]));
  }, [institutionId, studentClass]);

  const assessName = (code) => assessments.find(a => a.code === code)?.name || code;
  const termName    = (code) => terms.find(t => t.code === code)?.name       || code;

  // Only build sections for (term, assessmentitem) combinations the teacher
  // has actually saved marks for — never invent combinations speculatively.
  const comboKeys = Array.from(
    new Set(marks.map(m => `${m.term}__${m.assessmentitem}`))
  );

  const sections = comboKeys
    .map(key => {
      const [term, assessmentitem] = key.split('__');
      const entriesForCombo = marks.filter(
        m => m.term === term && m.assessmentitem === assessmentitem
      );

      // Show only subjects assigned to this student's class for that combo,
      // marking the ones the teacher hasn't entered yet as Pending.
      const rows = subjects.map(sub => {
        const entry = entriesForCombo.find(m => m.subject === sub.code);
        return {
          subjectCode: sub.code,
          subjectName: sub.name,
          mark:        entry ? entry.mark    : null,
          maxmark:     entry ? entry.maxmark : 100,
          pending:     !entry,
        };
      });

      if (rows.length === 0) return null;

      const enteredRows = rows.filter(r => !r.pending);
      const total       = enteredRows.reduce((s, r) => s + (parseFloat(r.mark) || 0), 0);
      const possible     = rows.reduce((s, r) => s + (parseFloat(r.maxmark) || 100), 0);
      const overallPct   = possible > 0 ? ((total / possible) * 100).toFixed(1) : null;

      return {
        key,
        term,
        assessmentitem,
        title: `${assessName(assessmentitem)} · ${termName(term)}`,
        rows,
        total,
        overallPct,
      };
    })
    .filter(Boolean);

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="parent" />
      <main className="dashboard-main">
        <Navbar />
        <div className="rp-page">

          {/* Header */}
          <div className="rp-header-card">
            <div className="rp-header-main">
              <div>
                <h1 className="rp-student-name">{studentName}</h1>
                <p className="rp-student-meta">
                  Roll no. {localStorage.getItem('rollNo') || admno}
                  {studentClass && <> · Class {studentClass}{studentDiv ? ` ${studentDiv}` : ''}</>}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rp-empty">Loading marks…</div>
          ) : sections.length === 0 ? (
            <div className="rp-empty">No marks have been entered yet.</div>
          ) : (
            sections.map(section => (
              <div key={section.key} className="rp-assessment-card">
                <div className="rp-assessment-head">
                  <h2 className="rp-assessment-title">{section.title}</h2>
                  {section.overallPct != null && (
                    <span className="rp-assessment-pct">{section.overallPct}%</span>
                  )}
                </div>

                <div className="rp-table-responsive">
                  <table className="rp-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th className="rp-col-money">Marks</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.map(r => {
                        const pct  = !r.pending && r.maxmark ? (parseFloat(r.mark) / parseFloat(r.maxmark)) * 100 : null;
                        const fail = pct != null && pct < PASS_MARK_PCT;
                        return (
                          <tr key={r.subjectCode}>
                            <td className="rp-td-subject">{r.subjectName}</td>
                            <td className="rp-col-money rp-td-mark">
                              {r.pending ? '-- / 100' : `${r.mark ?? '—'} / ${r.maxmark ?? 100}`}
                            </td>
                            <td>
                              {r.pending ? (
                                <span className="rp-result-badge rp-result-badge--pending">Pending</span>
                              ) : (
                                <span className={`rp-result-badge ${fail ? 'rp-result-badge--fail' : 'rp-result-badge--pass'}`}>
                                  {fail ? 'Fail' : 'Pass'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="rp-result-card-list">
                  {section.rows.map(r => {
                    const pct  = !r.pending && r.maxmark ? (parseFloat(r.mark) / parseFloat(r.maxmark)) * 100 : null;
                    const fail = pct != null && pct < PASS_MARK_PCT;
                    return (
                      <div key={r.subjectCode} className="rp-result-card">
                        <div className="rp-result-card-top">
                          <span className="rp-result-subject-badge">{r.subjectName}</span>
                          {r.pending ? (
                            <span className="rp-result-badge rp-result-badge--pending">Pending</span>
                          ) : (
                            <span className={`rp-result-badge ${fail ? 'rp-result-badge--fail' : 'rp-result-badge--pass'}`}>
                              {fail ? 'Fail' : 'Pass'}
                            </span>
                          )}
                        </div>
                        <div className="rp-result-row">
                          <span className="rp-result-mark">
                            {r.pending ? '-- / 100' : `${r.mark ?? '—'} / ${r.maxmark ?? 100}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rp-assessment-foot">
                  Total: <strong>{section.total}</strong>
                </div>
              </div>
            ))
          )}

        </div>
      </main>
    </div>
  );
}
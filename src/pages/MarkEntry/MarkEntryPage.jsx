import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import {
  fetchMarkEntryClasses,
  fetchMarkEntryDivisions,
  fetchMarkEntrySubjects,
  fetchAssessmentItems,
  fetchAssessmentParts,
  fetchMarkEntryStudents,
  saveMarks,
} from '../../services/api';
import './MarkEntryPage.scss';

const GRADE_THRESHOLDS = [
  { min: 90, grade: 'A+' },
  { min: 80, grade: 'A'  },
  { min: 70, grade: 'B'  },
  { min: 60, grade: 'C'  },
  { min: 50, grade: 'D'  },
  { min: 35, grade: 'E'  },
  { min:  0, grade: 'F'  },
];

function calcGrade(total, maxTotal) {
  if (total == null || maxTotal == null || maxTotal === 0) return null;
  const pct = (total / maxTotal) * 100;
  for (const { min, grade } of GRADE_THRESHOLDS) {
    if (pct >= min) return grade;
  }
  return 'F';
}

// Sort helper: male students first, then female, then anything unrecognized.
// Handles common encodings: 'M'/'F', 'Male'/'Female', case-insensitive.
function genderRank(sex) {
  const s = String(sex || '').trim().toLowerCase();
  if (s === 'm' || s === 'male') return 0;
  if (s === 'f' || s === 'female') return 1;
  return 2;
}

function sortByGenderThenName(students) {
  return [...students].sort((a, b) => {
    const rankDiff = genderRank(a.sex) - genderRank(b.sex);
    if (rankDiff !== 0) return rankDiff;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

// ─────────────────────────────────────────────────────────────
// PAGE 1 — Filter selection
// ─────────────────────────────────────────────────────────────
function FilterPage({ onSubmit }) {
  const institutionId = localStorage.getItem('institutionId') || '';

  const [classes,     setClasses]     = useState([]);
  const [divisions,   setDivisions]   = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [terms,       setTerms]       = useState([]);
  const [loading,     setLoading]     = useState(false);

  const [filter, setFilter] = useState({
    student_class: '', division: '', assessmentitem: '', term: '',
  });

  useEffect(() => {
    if (!institutionId) return;
    Promise.all([
      fetchMarkEntryClasses(institutionId),
      fetchAssessmentItems(institutionId),
      fetchAssessmentParts(institutionId),
    ]).then(([c, a, p]) => {
      setClasses(c.data);
      setAssessments(a.data);
      setTerms(p.data);
    });
  }, [institutionId]);

  useEffect(() => {
    if (!filter.student_class) { setDivisions([]); return; }
    fetchMarkEntryDivisions(institutionId, filter.student_class).then(r => {
      setDivisions(r.data);
      setFilter(prev => ({ ...prev, division: '' }));
    });
  }, [filter.student_class]);

  const setField = (key, val) =>
    setFilter(prev => ({ ...prev, [key]: val }));

  const allSelected =
    filter.student_class && filter.division &&
    filter.assessmentitem && filter.term;

  const completedCount = [
    filter.student_class, filter.division,
    filter.assessmentitem, filter.term,
  ].filter(Boolean).length;

  const handleSubmit = async () => {
    if (!allSelected) return;
    setLoading(true);
    try {
      const [sRes, stuRes] = await Promise.all([
        fetchMarkEntrySubjects(institutionId),
        fetchMarkEntryStudents({
          institution_id: institutionId,
          class:          filter.student_class,
          division:       filter.division,
          term:           filter.term,
          assessmentitem: filter.assessmentitem,
        }),
      ]);
      const sortedStudents = sortByGenderThenName(stuRes.data);
      onSubmit({
        filter,
        institutionId,
        subjects:       sRes.data,
        students:       sortedStudents.map((s, idx) => ({
          ...s, rollNo: idx + 1, marks: s.marks || {},
        })),
        assessmentName: assessments.find(a => a.code === filter.assessmentitem)?.name || filter.assessmentitem,
        termName:       terms.find(t => t.code === filter.term)?.name || filter.term,
      });
    } finally {
      setLoading(false);
    }
  };

  const FIELDS = [
    {
      key: 'student_class', label: 'Class',
      options: classes.map(c => ({ value: c, label: `Class ${c}` })),
      placeholder: 'Select a class', disabled: false,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
    },
    {
      key: 'division', label: 'Division',
      options: divisions.map(d => ({ value: d, label: `Division ${d}` })),
      placeholder: filter.student_class ? 'Select a division' : 'Select class first',
      disabled: !filter.student_class,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    },
    {
      key: 'assessmentitem', label: 'Assessment',
      options: assessments.map(a => ({ value: a.code, label: a.name })),
      placeholder: 'Select assessment type', disabled: false,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    },
    {
      key: 'term', label: 'Term',
      options: terms.map(t => ({ value: t.code, label: t.name })),
      placeholder: 'Select term', disabled: false,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    },
  ];

  return (
    <div className="me-filter-page">
      <div className="me-fp-header">
        <div className="me-fp-header-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </div>
        <div>
          <h1 className="me-fp-title">Mark Entry</h1>
          <p className="me-fp-sub">Select the details below to load the mark sheet</p>
        </div>
      </div>

      <div className="me-progress-wrap">
        <div className="me-progress-bar">
          <div className="me-progress-fill" style={{ width: `${(completedCount / 4) * 100}%` }} />
        </div>
        <span className="me-progress-label">{completedCount} / 4 selected</span>
      </div>

      <div className="me-fp-fields">
        {FIELDS.map(({ key, label, icon, options, placeholder, disabled }) => (
          <div
            key={key}
            className={[
              'me-fp-field',
              filter[key]  ? 'me-fp-field--filled'   : '',
              disabled     ? 'me-fp-field--disabled'  : '',
            ].join(' ')}
          >
            <div className="me-fp-field-top">
              <span className="me-fp-field-icon">{icon}</span>
              <label className="me-fp-field-label">{label}</label>
              {filter[key] && (
                <span className="me-fp-check">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
              )}
            </div>
            <div className="me-fp-select-wrap">
              <select
                className="me-fp-select"
                value={filter[key]}
                onChange={e => setField(key, e.target.value)}
                disabled={disabled}
              >
                <option value="">{placeholder}</option>
                {options.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <span className="me-fp-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </span>
            </div>
          </div>
        ))}
      </div>

      <button
        className={`me-fp-submit${allSelected ? ' me-fp-submit--ready' : ''}`}
        onClick={handleSubmit}
        disabled={!allSelected || loading}
      >
        {loading ? (
          <><span className="me-spinner me-spinner--white" />Loading students…</>
        ) : (
          <>
            Load Mark Sheet
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </>
        )}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE 2 — Mark sheet
// ─────────────────────────────────────────────────────────────
function MarkSheetPage({ data, onBack }) {
  const { filter, institutionId, subjects, assessmentName, termName } = data;

  const [students,    setStudents]    = useState(data.students);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxMarks,    setMaxMarks]    = useState({});
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState(null);
  const passmark = 35;

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.admission?.toLowerCase().includes(q) ||
      String(s.rollNo).includes(q)
    );
  }, [students, searchQuery]);

  const updateMark = (admission, subCode, val) =>
    setStudents(prev => prev.map(s =>
      s.admission === admission ? { ...s, marks: { ...s.marks, [subCode]: val } } : s
    ));

  const maxTotal = subjects.reduce((sum, s) => {
    const m = Number(maxMarks[s.code] || 0);
    return sum + (m > 0 ? m : 100);
  }, 0);

  const getTotal = (student) => {
    let t = 0;
    for (const sub of subjects) {
      const m = student.marks[sub.code];
      if (m === '' || m == null) return null;
      t += Number(m);
    }
    return t;
  };

  const isFail = (val, subCode) => {
    const max = Number(maxMarks[subCode] || 100);
    return val !== '' && val != null && Number(val) < (passmark / 100) * max;
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveMarks({
        student_class:  filter.student_class,
        division:       filter.division,
        term:           filter.term,
        assessmentitem: filter.assessmentitem,
        institution_id: institutionId,
        maxmarks:       maxMarks,
        marks: students.map(s => ({
          admission:    s.admission,
          student_name: s.name,
          marks:        s.marks,
        })),
      });
      showToast('Marks saved successfully.');
    } catch {
      showToast('Failed to save marks.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="me-sheet-page">

      {/* Top bar */}
      <div className="me-sp-topbar">
        <button className="me-back-btn" onClick={onBack}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Change filters
        </button>

        <div className="me-sp-meta">
          <span className="me-sp-badge">
            Class {filter.student_class} · {filter.division} · {assessmentName} · {termName}
          </span>
          <span className="me-sp-count">{students.length} students</span>
        </div>

        <button className="me-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? (
            <><span className="me-spinner me-spinner--white" />Saving…</>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              Save marks
            </>
          )}
        </button>
      </div>

      {/* Search + max marks bar */}
      <div className="me-sp-controls">
        <div className="me-search-wrap">
          <svg className="me-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="me-search-input"
            type="text"
            placeholder="Search by name, admission no or roll no…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="me-search-clear" onClick={() => setSearchQuery('')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        <div className="me-maxmark-strip">
          <span className="me-maxmark-label">Max marks:</span>
          {subjects.map(sub => (
            <div key={sub.code} className="me-maxmark-field">
              <span className="me-maxmark-subname">{sub.name}</span>
              <input
                type="number" min="1" placeholder="100"
                className="me-maxmark-input"
                value={maxMarks[sub.code] || ''}
                onChange={e => setMaxMarks(prev => ({ ...prev, [sub.code]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Empty search */}
      {filteredStudents.length === 0 && (
        <div className="me-empty">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{opacity:.3}}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p>No students match <strong>"{searchQuery}"</strong></p>
        </div>
      )}

      {/* Desktop table */}
      {filteredStudents.length > 0 && (
        <div className="me-table-wrap">
          <table className="me-table">
            <thead>
              <tr>
                <th className="me-th-roll">#</th>
                <th className="me-th-adm">Adm No</th>
                <th className="me-th-name">Student Name</th>
                {subjects.map(sub => <th key={sub.code} className="me-th-subject">{sub.name}</th>)}
                <th className="me-th-total">Total</th>
                <th className="me-th-grade">Grade</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(s => {
                const total = getTotal(s);
                const grade = total != null ? calcGrade(total, maxTotal) : null;
                return (
                  <tr key={s.admission} className="me-tr">
                    <td className="me-td-roll">{s.rollNo}</td>
                    <td className="me-td-adm">{s.admission}</td>
                    <td className="me-td-name">{s.name}</td>
                    {subjects.map(sub => {
                      const val  = s.marks[sub.code] ?? '';
                      const fail = isFail(val, sub.code);
                      return (
                        <td key={sub.code} className={`me-td-mark${fail ? ' me-td-mark--fail' : ''}`}>
                          <input
                            className={`me-cell-input${fail ? ' me-cell-input--fail' : ''}`}
                            type="number" min="0"
                            max={maxMarks[sub.code] || undefined}
                            value={val}
                            onChange={e => updateMark(s.admission, sub.code, e.target.value)}
                          />
                        </td>
                      );
                    })}
                    <td className="me-td-total">
                      {total != null
                        ? <strong className="me-total-val">{total}</strong>
                        : <span className="me-dash">—</span>}
                    </td>
                    <td className="me-td-grade">
                      {grade != null
                        ? <span className={`me-grade-badge me-grade-badge--${grade === 'F' ? 'fail' : grade === 'A+' ? 'top' : 'pass'}`}>{grade}</span>
                        : <span className="me-dash">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {filteredStudents.length > 0 && (
        <div className="me-mobile-list">
          {filteredStudents.map(s => {
            const total = getTotal(s);
            const grade = total != null ? calcGrade(total, maxTotal) : null;
            return (
              <div key={s.admission} className="me-mobile-card">
                <div className="me-mobile-card-head">
                  <div className="me-mobile-meta">
                    <span className="me-mobile-roll">#{s.rollNo}</span>
                    <span className="me-mobile-adm">{s.admission}</span>
                  </div>
                  <span className="me-mobile-name">{s.name}</span>
                  <div className="me-mobile-result">
                    {total != null && <span className="me-mobile-total">{total}</span>}
                    {grade && (
                      <span className={`me-grade-badge me-grade-badge--${grade === 'F' ? 'fail' : grade === 'A+' ? 'top' : 'pass'}`}>{grade}</span>
                    )}
                  </div>
                </div>
                <div className="me-mobile-inputs">
                  {subjects.map(sub => {
                    const val = s.marks[sub.code] ?? '';
                    return (
                      <div key={sub.code} className="me-mobile-field">
                        <label className="me-mobile-sub-label">{sub.name}</label>
                        <input
                          className={`me-cell-input${isFail(val, sub.code) ? ' me-cell-input--fail' : ''}`}
                          type="number" min="0" placeholder="—"
                          value={val}
                          onChange={e => updateMark(s.admission, sub.code, e.target.value)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {filteredStudents.length > 0 && (
        <div className="me-sheet-footer">
          <p className="me-footer-note">
            Pass mark: {passmark}/100 per subject ·
            <span className="me-fail-legend"> red = below pass mark</span>
          </p>
          <button className="me-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save marks'}
          </button>
        </div>
      )}

      {toast && (
        <div className={`me-toast me-toast--${toast.type}`}>
          {toast.type === 'success'
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          }
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────
export default function MarkEntryPage() {
  const [page,      setPage]      = useState('filter');
  const [sheetData, setSheetData] = useState(null);

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="teacher" />
      <main className="dashboard-main">
        <Navbar />
        <div className="me-page">
          {page === 'filter'
            ? <FilterPage onSubmit={d => { setSheetData(d); setPage('sheet'); }} />
            : <MarkSheetPage data={sheetData} onBack={() => { setPage('filter'); setSheetData(null); }} />
          }
        </div>
      </main>
    </div>
  );
}
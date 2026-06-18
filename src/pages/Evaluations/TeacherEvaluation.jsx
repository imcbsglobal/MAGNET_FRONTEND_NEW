import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchTeacherMonthEvaluation, saveEvaluation } from '../../services/api';
import './Evaluations.scss';

const EvalIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const TeacherEvaluationDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [teacherId, setTeacherId] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [formData, setFormData] = useState({
    exam_classes_with: 0,
    exam_total_classes: 1,
    exam_excellent: 0,
    exam_good: 0,
    exam_average: 0,
    exam_below_average: 0,
    notebook_entry: 0,
    notebook_excellent: 0,
    notebook_good: 0,
    notebook_average: 0,
    notebook_below_average: 0,
    smartroom_hours: 0,
    smartroom_ai: 0,
    smartroom_youtube: 0,
    smartroom_creative: 0,
  });

  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (id) setTeacherId(parseInt(id));
  }, []);

  useEffect(() => {
    if (teacherId && month) loadEvaluation();
  }, [teacherId, month]);

  const loadEvaluation = async () => {
    try {
      setLoading(true);
      const response = await fetchTeacherMonthEvaluation(teacherId, month);
      const data = response.data;
      setFormData({
        exam_classes_with:    data.exam_classes_with    || 0,
        exam_total_classes:   data.exam_total_classes   || 1,
        exam_excellent:       data.exam_excellent       || 0,
        exam_good:            data.exam_good            || 0,
        exam_average:         data.exam_average         || 0,
        exam_below_average:   data.exam_below_average   || 0,
        notebook_entry:       data.notebook_entry       || 0,
        notebook_excellent:   data.notebook_excellent   || 0,
        notebook_good:        data.notebook_good        || 0,
        notebook_average:     data.notebook_average     || 0,
        notebook_below_average: data.notebook_below_average || 0,
        smartroom_hours:      data.smartroom_hours      || 0,
        smartroom_ai:         data.smartroom_ai         || 0,
        smartroom_youtube:    data.smartroom_youtube    || 0,
        smartroom_creative:   data.smartroom_creative   || 0,
      });
    } catch (err) {
      console.error('Failed to load evaluation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? 0 : parseFloat(value),
    }));
  };

  const calculateExamScore = () => {
    const base = formData.exam_classes_with > 0 ? 6 : 0;
    const total = formData.exam_excellent + formData.exam_good + formData.exam_average + formData.exam_below_average;
    let perf = 0;
    if (total > 0) {
      perf = ((formData.exam_excellent * 4) + (formData.exam_good * 3) + (formData.exam_average * 2) + (formData.exam_below_average * 1)) / total;
      perf = Math.min(perf, 4);
    }
    return (base + perf).toFixed(2);
  };

  const calculateNotebookScore = () => {
    const entry = formData.notebook_entry;
    const total = formData.notebook_excellent + formData.notebook_good + formData.notebook_average + formData.notebook_below_average;
    let perf = 0;
    if (total > 0) {
      perf = ((formData.notebook_excellent * 4) + (formData.notebook_good * 3) + (formData.notebook_average * 2) + (formData.notebook_below_average * 1)) / total;
      perf = Math.min(perf, 4);
    }
    return (entry + perf).toFixed(2);
  };

  const calculateSmartroomScore = () => {
    const pct = formData.smartroom_hours / 110;
    let usage = pct >= 0.3 ? 3 : parseFloat((pct / 0.3 * 3).toFixed(2));
    const totalContent = formData.smartroom_ai + formData.smartroom_youtube + formData.smartroom_creative;
    let creative = 0;
    if (totalContent > 0) {
      const crPct = formData.smartroom_creative / totalContent;
      creative = crPct >= 0.7 ? 2 : parseFloat((crPct / 0.7 * 2).toFixed(2));
    }
    return (usage + creative).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await saveEvaluation({ teacher_id: teacherId, month, ...formData });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save evaluation:', err);
      alert(`Failed to save evaluation: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="staff" />
      <main className="dashboard-main">
        <Navbar placeholder="Search evaluation..." />
        <div className="eval-page">

          {/* ── Header (matches IDCard header style) ── */}
          <div className="eval-header">
            <div className="eval-header-main">
              <div className="eval-header-icon"><EvalIcon /></div>
              <div>
                <h1>Teacher Evaluation</h1>
                <p>Enter your monthly evaluation details</p>
              </div>
            </div>
            {/* Month picker lives in the header, right side */}
            <div className="eval-month-picker">
              <label htmlFor="eval-month">Month</label>
              <input
                id="eval-month"
                type="month"
                name="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
              />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {loading ? (
              <div className="eval-loader">Loading...</div>
            ) : (
              <>
                {/* ── Exam Section ── */}
                <div className="eval-section">
                  <div className="eval-section-header">
                    <span className="eval-section-title">Exam</span>
                    <span className="eval-section-badge">Max 10</span>
                  </div>

                  <div className="eval-criteria-label">Exam Conducted</div>
                  <div className="eval-criteria-hint">
                    Enter data for each class. Points: conducted = 6, performance = up to 4
                  </div>

                  <div className="eval-fields">
                    <div className="eval-fld">
                      <label>Classes with Exam</label>
                      <input type="number" name="exam_classes_with" min="0"
                        value={formData.exam_classes_with} onChange={handleChange} />
                    </div>
                    <div className="eval-fld">
                      <label>Total Classes</label>
                      <input type="number" name="exam_total_classes" min="1"
                        value={formData.exam_total_classes} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="eval-fields eval-fields--mt">
                    <div className="eval-fld">
                      <label>Excellent Students</label>
                      <input type="number" name="exam_excellent" min="0"
                        value={formData.exam_excellent} onChange={handleChange} />
                    </div>
                    <div className="eval-fld">
                      <label>Good Students</label>
                      <input type="number" name="exam_good" min="0"
                        value={formData.exam_good} onChange={handleChange} />
                    </div>
                    <div className="eval-fld">
                      <label>Average Students</label>
                      <input type="number" name="exam_average" min="0"
                        value={formData.exam_average} onChange={handleChange} />
                    </div>
                    <div className="eval-fld">
                      <label>Below Average</label>
                      <input type="number" name="exam_below_average" min="0"
                        value={formData.exam_below_average} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="eval-score-chip">Score: {calculateExamScore()}</div>
                </div>

                {/* ── Notebook Section ── */}
                <div className="eval-section">
                  <div className="eval-section-header">
                    <span className="eval-section-title">Notebook</span>
                    <span className="eval-section-badge">Max 10</span>
                  </div>

                  <div className="eval-criteria-label">Notebook Check</div>
                  <div className="eval-criteria-hint">
                    Data entered twice = 6 pts. Performance based on student grades.
                  </div>

                  <div className="eval-fields">
                    <div className="eval-fld">
                      <label>Data Entered Twice?</label>
                      <select name="notebook_entry" value={formData.notebook_entry} onChange={handleChange}>
                        <option value={0}>No (0)</option>
                        <option value={6}>Yes (6)</option>
                      </select>
                    </div>
                  </div>

                  <div className="eval-fields eval-fields--mt">
                    <div className="eval-fld">
                      <label>Excellent</label>
                      <input type="number" name="notebook_excellent" min="0"
                        value={formData.notebook_excellent} onChange={handleChange} />
                    </div>
                    <div className="eval-fld">
                      <label>Good</label>
                      <input type="number" name="notebook_good" min="0"
                        value={formData.notebook_good} onChange={handleChange} />
                    </div>
                    <div className="eval-fld">
                      <label>Average</label>
                      <input type="number" name="notebook_average" min="0"
                        value={formData.notebook_average} onChange={handleChange} />
                    </div>
                    <div className="eval-fld">
                      <label>Below Average</label>
                      <input type="number" name="notebook_below_average" min="0"
                        value={formData.notebook_below_average} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="eval-score-chip">Score: {calculateNotebookScore()}</div>
                </div>

                {/* ── Smart Room Section ── */}
                <div className="eval-section">
                  <div className="eval-section-header">
                    <span className="eval-section-title">Smart Room</span>
                    <span className="eval-section-badge">Max 5</span>
                  </div>

                  <div className="eval-criteria-label">Smart Room Usage</div>
                  <div className="eval-criteria-hint">
                    110 hrs/month reference. Above 30% usage = 3 pts. Creative content ≥70% = 2 pts.
                  </div>

                  <div className="eval-fields">
                    <div className="eval-fld">
                      <label>Hours Used</label>
                      <input type="number" name="smartroom_hours" min="0"
                        value={formData.smartroom_hours} onChange={handleChange} />
                    </div>
                    <div className="eval-fld">
                      <label>No. of AI Content</label>
                      <input type="number" name="smartroom_ai" min="0"
                        value={formData.smartroom_ai} onChange={handleChange} />
                    </div>
                    <div className="eval-fld">
                      <label>No. of YouTube</label>
                      <input type="number" name="smartroom_youtube" min="0"
                        value={formData.smartroom_youtube} onChange={handleChange} />
                    </div>
                    <div className="eval-fld">
                      <label>No. of Creative (PPT/PDF)</label>
                      <input type="number" name="smartroom_creative" min="0"
                        value={formData.smartroom_creative} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="eval-score-chip">Score: {calculateSmartroomScore()}</div>
                </div>

                {/* ── Actions footer ── */}
                <div className="eval-actions">
                  <button type="submit" className="primary-btn" disabled={saving}>
                    {saving ? 'Saving...' : '💾 Save My Entry'}
                  </button>
                  {saved && <span className="eval-saved-tag">Saved ✓</span>}
                </div>
              </>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

export default TeacherEvaluationDashboard;
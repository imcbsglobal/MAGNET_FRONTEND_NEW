import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { 
  fetchTeacherClasses, 
  saveClassEvaluation, 
  fetchClassEvaluation,
  fetchAllClassEvaluations,
  finishMonthEvaluation,
  fetchTeacherMonthEvaluation,
  fetchTeacherHours
} from '../../services/api';
import './Evaluations.scss';

const TeacherEvaluationDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [teacherId, setTeacherId] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [completedClasses, setCompletedClasses] = useState([]);
  const [isMonthFinished, setIsMonthFinished] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finalScores, setFinalScores] = useState(null);
  const [hoursConfig, setHoursConfig] = useState({ required_hours: 110 });
  
  const [formData, setFormData] = useState({
    exam_conducted: false,
    exam_excellent: 0,
    exam_good: 0,
    exam_average: 0,
    exam_below_average: 0,
    notebook_check1: false,
    notebook_check2: false,
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
    if (id) {
      setTeacherId(parseInt(id));
    }
  }, []);

  useEffect(() => {
    if (teacherId && month) {
      loadTeacherClasses();
      loadCompletedClasses();
      checkMonthFinished();
      loadTeacherHoursConfig();
    }
  }, [teacherId, month]);

  useEffect(() => {
    if (selectedClass && selectedDivision && teacherId) {
      loadClassEvaluation();
    }
  }, [selectedClass, selectedDivision, teacherId]);

  const loadTeacherClasses = async () => {
    try {
      setLoading(true);
      const response = await fetchTeacherClasses(teacherId, month);
      setClasses(response.data.classes || []);
      
      // Auto-select first class if available
      if (response.data.classes && response.data.classes.length > 0) {
        setSelectedClass(response.data.classes[0].class);
        setSelectedDivision(response.data.classes[0].division);
      }
    } catch (err) {
      console.error('Failed to load teacher classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedClasses = async () => {
    try {
      const response = await fetchAllClassEvaluations(teacherId, month);
      setCompletedClasses(response.data.evaluations || []);
    } catch (err) {
      console.error('Failed to load completed classes:', err);
    }
  };

  const loadTeacherHoursConfig = async () => {
    try {
      const institutionId = localStorage.getItem('institutionId');
      if (!institutionId) return;
      const response = await fetchTeacherHours(institutionId);
      const config = response.data.find(h => h.teacher_id === teacherId);
      if (config) {
        setHoursConfig(config);
      }
    } catch (err) {
      console.error('Failed to load teacher hours config:', err);
    }
  };

  const checkMonthFinished = async () => {
    try {
      const response = await fetchTeacherMonthEvaluation(teacherId, month);
      if (response.data.is_month_finished) {
        setIsMonthFinished(true);
        const scores = calculateFinalScores(response.data);
        setFinalScores(scores);
      }
    } catch (err) {
      // No evaluation exists yet, month not finished
    }
  };

  const loadClassEvaluation = async () => {
    try {
      const response = await fetchClassEvaluation(teacherId, month, selectedClass, selectedDivision);
      const data = response.data;
      
      // Convert old notebook_entry (0 or 6) to check1 and check2
      let check1 = false;
      let check2 = false;
      if (data.notebook_check1 !== undefined) {
        check1 = data.notebook_check1;
        check2 = data.notebook_check2;
      } else if (data.notebook_entry >= 6) {
        check1 = true;
        check2 = true;
      } else if (data.notebook_entry >= 3) {
        check1 = true;
      }
      
      setFormData({
        exam_conducted: data.exam_conducted || false,
        exam_excellent: data.exam_excellent || 0,
        exam_good: data.exam_good || 0,
        exam_average: data.exam_average || 0,
        exam_below_average: data.exam_below_average || 0,
        notebook_check1: check1,
        notebook_check2: check2,
        notebook_excellent: data.notebook_excellent || 0,
        notebook_good: data.notebook_good || 0,
        notebook_average: data.notebook_average || 0,
        notebook_below_average: data.notebook_below_average || 0,
        smartroom_hours: data.smartroom_hours || 0,
        smartroom_ai: data.smartroom_ai || 0,
        smartroom_youtube: data.smartroom_youtube || 0,
        smartroom_creative: data.smartroom_creative || 0,
      });
    } catch (err) {
      // Initialize with empty data if no evaluation exists yet
      setFormData({
        exam_conducted: false,
        exam_excellent: 0,
        exam_good: 0,
        exam_average: 0,
        exam_below_average: 0,
        notebook_check1: false,
        notebook_check2: false,
        notebook_excellent: 0,
        notebook_good: 0,
        notebook_average: 0,
        notebook_below_average: 0,
        smartroom_hours: 0,
        smartroom_ai: 0,
        smartroom_youtube: 0,
        smartroom_creative: 0,
      });
    }
  };

  const handleNotebookCheckChange = (level) => {
    let check1 = false;
    let check2 = false;
    
    if (level === '3') {
      check1 = true;
    } else if (level === '6') {
      check1 = true;
      check2 = true;
    }
    
    setFormData(prev => ({
      ...prev,
      notebook_check1: check1,
      notebook_check2: check2
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (value === '' ? 0 : parseFloat(value))
    }));
  };

  const calculateFinalScores = (data) => {
    const examBase = data.exam_classes_with > 0 ? 6 : 0;
    const examTotal = data.exam_excellent + data.exam_good + data.exam_average + data.exam_below_average;
    let examPerf = 0;
    if (examTotal > 0) {
      examPerf = ((data.exam_excellent * 4) + (data.exam_good * 3) + (data.exam_average * 2) + (data.exam_below_average * 1)) / examTotal;
      examPerf = Math.min(examPerf, 4);
    }
    const examScore = examBase + examPerf;

    // Calculate notebook entry score based on checks
    let notebookEntryScore = 0;
    if (data.notebook_check1 && data.notebook_check2) {
      notebookEntryScore = 6;
    } else if (data.notebook_check1 || data.notebook_check2) {
      notebookEntryScore = 3;
    }
    // Fallback for old data
    if (notebookEntryScore === 0 && data.notebook_entry) {
      notebookEntryScore = data.notebook_entry;
    }

    const notebookTotal = data.notebook_excellent + data.notebook_good + data.notebook_average + data.notebook_below_average;
    let notebookPerf = 0;
    if (notebookTotal > 0) {
      notebookPerf = ((data.notebook_excellent * 4) + (data.notebook_good * 3) + (data.notebook_average * 2) + (data.notebook_below_average * 1)) / notebookTotal;
      notebookPerf = Math.min(notebookPerf, 4);
    }
    const notebookScore = notebookEntryScore + notebookPerf;

    const smartPct = data.smartroom_hours / hoursConfig.required_hours;
    const smartUsage = smartPct >= 0.3 ? 3 : parseFloat((smartPct / 0.3 * 3).toFixed(2));
    const totalContent = data.smartroom_ai + data.smartroom_youtube + data.smartroom_creative;
    let smartCreative = 0;
    if (totalContent > 0) {
      const crPct = data.smartroom_creative / totalContent;
      smartCreative = crPct >= 0.7 ? 2 : parseFloat((crPct / 0.7 * 2).toFixed(2));
    }
    const smartroomScore = smartUsage + smartCreative;

    return {
      exam: examScore.toFixed(2),
      notebook: notebookScore.toFixed(2),
      smartroom: smartroomScore.toFixed(2),
      examStudents: examTotal,
      notebookStudents: notebookTotal,
      total: (examScore + notebookScore + smartroomScore).toFixed(2),
    };
  };

  const handleSaveClass = async (e) => {
    e.preventDefault();
    if (!selectedClass || !selectedDivision) {
      alert('Please select a class and division');
      return;
    }

    // Calculate notebook_entry for backward compatibility
    const notebookEntry = formData.notebook_check1 && formData.notebook_check2 
      ? 6 
      : (formData.notebook_check1 || formData.notebook_check2) 
        ? 3 
        : 0;

    try {
      setSaving(true);
      await saveClassEvaluation({
        teacher_id: teacherId,
        month: month,
        student_class: selectedClass,
        division: selectedDivision,
        ...formData,
        notebook_entry: notebookEntry,
        notebook_check1: formData.notebook_check1,
        notebook_check2: formData.notebook_check2,
        is_completed: true,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      
      // Reload completed classes
      loadCompletedClasses();
    } catch (err) {
      console.error('Failed to save class evaluation:', err);
      alert(`Failed to save: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleFinishMonth = async () => {
    if (completedClasses.length === 0) {
      alert('Please complete at least one class before finishing the month');
      return;
    }

    if (!window.confirm('Are you sure you want to finish the month? Once finished, you cannot edit the data.')) {
      return;
    }

    try {
      setFinishing(true);
      await finishMonthEvaluation(teacherId, month);
      setIsMonthFinished(true);
      // Fetch the aggregated evaluation to calculate final scores
      const evalRes = await fetchTeacherMonthEvaluation(teacherId, month);
      const scores = calculateFinalScores(evalRes.data);
      setFinalScores(scores);
      alert('Month evaluation finished successfully! Final marks calculated from total student counts across all classes.');
    } catch (err) {
      console.error('Failed to finish month:', err);
      alert(`Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setFinishing(false);
    }
  };

  const isClassCompleted = completedClasses.some(c => c.student_class === selectedClass && c.division === selectedDivision);

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="staff" />
      <main className="dashboard-main">
        <Navbar placeholder="Search evaluation..." />
        <div className="admins-page-container">
          <div className="evaluation-page">
            <header className="page-header">
              <div className="header-left">
                <h1>My Evaluation</h1>
                <p>Enter data per class, then finish month to get final marks based on total student counts</p>
              </div>
            </header>

            <div className="form-card">
              <form onSubmit={handleSaveClass}>
                <div className="form-section" style={{ opacity: isMonthFinished ? 0.7 : 1 }}>
                  <div className="form-group">
                    <label>Select Month</label>
                    <input
                      type="month"
                      name="month"
                      value={month}
                      onChange={(e) => {
                        setMonth(e.target.value);
                        setSelectedClass(null);
                        setSelectedDivision(null);
                        setCompletedClasses([]);
                      }}
                      disabled={isMonthFinished}
                      required
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="loader">
                    <div className="loading-spinner"></div>
                    <div>Loading your classes...</div>
                  </div>
                ) : (
                  <>
                    {/* Class and Division Selection */}
                    <div className="panel panel--step" style={{ opacity: isMonthFinished ? 0.7 : 1 }}>
                      <h3>Step 1: Select Class &amp; Division</h3>
                      <div className="fields">
                        <div className="fld">
                          <label>Select Class</label>
                          <select
                            value={selectedClass || ''}
                            onChange={(e) => {
                              const cls = e.target.value;
                              setSelectedClass(cls);
                              const classObj = classes.find(c => c.class === cls);
                              if (classObj) setSelectedDivision(classObj.division);
                            }}
                            disabled={isMonthFinished}
                            required
                          >
                            <option value="">-- Select Class --</option>
                            {classes.map((cls, idx) => (
                              <option key={idx} value={cls.class}>
                                {cls.class} - {cls.division}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {selectedClass && selectedDivision && (
                      <>
                        {/* Completed Classes Summary */}
                        {completedClasses.length > 0 && (
                          <div className="panel panel--success">
                            <h3 className="panel-title">Completed Classes</h3>
                            <div className="chip-list">
                              {completedClasses.map((cls, idx) => (
                                <span key={idx} className="chip chip--success">
                                  {cls.student_class}-{cls.division} ✓
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Exam Section */}
                        <div className="form-section" style={{ opacity: isMonthFinished ? 0.7 : 1 }}>
                          <h3>Exam</h3>
                          <div className="row">
                            <div className="rlabel">Exam Conducted</div>
                            <div className="rsub">If exam was conducted = 6 pts, plus performance up to 4 pts</div>
                            <div className="fields">
                              <div className="fld">
                                <label>
                                  <input
                                    type="checkbox"
                                    name="exam_conducted"
                                    checked={formData.exam_conducted}
                                    onChange={handleChange}
                                    disabled={isMonthFinished}
                                  />
                                  Exam Conducted
                                </label>
                              </div>
                            </div>
                            {formData.exam_conducted && (
                              <div className="fields">
                                <div className="fld">
                                  <label>Excellent Students</label>
                                  <input
                                    type="number"
                                    name="exam_excellent"
                                    min="0"
                                    value={formData.exam_excellent || ''}
                                    onChange={handleChange}
                                    disabled={isMonthFinished}
                                  />
                                </div>
                                <div className="fld">
                                  <label>Good Students</label>
                                  <input
                                    type="number"
                                    name="exam_good"
                                    min="0"
                                    value={formData.exam_good || ''}
                                    onChange={handleChange}
                                    disabled={isMonthFinished}
                                  />
                                </div>
                                <div className="fld">
                                  <label>Average Students</label>
                                  <input
                                    type="number"
                                    name="exam_average"
                                    min="0"
                                    value={formData.exam_average || ''}
                                    onChange={handleChange}
                                    disabled={isMonthFinished}
                                  />
                                </div>
                                <div className="fld">
                                  <label>Below Average</label>
                                  <input
                                    type="number"
                                    name="exam_below_average"
                                    min="0"
                                    value={formData.exam_below_average || ''}
                                    onChange={handleChange}
                                    disabled={isMonthFinished}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Notebook Section */}
                        <div className="form-section" style={{ opacity: isMonthFinished ? 0.7 : 1 }}>
                          <h3>Notebook</h3>
                          <div className="row">
                            <div className="rlabel">Notebook Check</div>
                            <div className="rsub">Select check level for 0, 3, or 6 points. Performance based on student grades.</div>
                            <div className="fields" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                              <div className="fld">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <input
                                    type="radio"
                                    name="notebook_check_level"
                                    value="0"
                                    checked={!formData.notebook_check1 && !formData.notebook_check2}
                                    onChange={(e) => handleNotebookCheckChange('0')}
                                    disabled={isMonthFinished}
                                  />
                                  No Checks (0 pts)
                                </label>
                              </div>
                              <div className="fld">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <input
                                    type="radio"
                                    name="notebook_check_level"
                                    value="3"
                                    checked={(formData.notebook_check1 || formData.notebook_check2) && !(formData.notebook_check1 && formData.notebook_check2)}
                                    onChange={(e) => handleNotebookCheckChange('3')}
                                    disabled={isMonthFinished}
                                  />
                                  One Check (3 pts)
                                </label>
                              </div>
                              <div className="fld">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <input
                                    type="radio"
                                    name="notebook_check_level"
                                    value="6"
                                    checked={formData.notebook_check1 && formData.notebook_check2}
                                    onChange={(e) => handleNotebookCheckChange('6')}
                                    disabled={isMonthFinished}
                                  />
                                  Two Checks (6 pts)
                                </label>
                              </div>
                            </div>
                            <div className="fields">
                              <div className="fld">
                                <label>Excellent</label>
                                <input
                                  type="number"
                                  name="notebook_excellent"
                                  min="0"
                                  value={formData.notebook_excellent || ''}
                                  onChange={handleChange}
                                  disabled={isMonthFinished}
                                />
                              </div>
                              <div className="fld">
                                <label>Good</label>
                                <input
                                  type="number"
                                  name="notebook_good"
                                  min="0"
                                  value={formData.notebook_good || ''}
                                  onChange={handleChange}
                                  disabled={isMonthFinished}
                                />
                              </div>
                              <div className="fld">
                                <label>Average</label>
                                <input
                                  type="number"
                                  name="notebook_average"
                                  min="0"
                                  value={formData.notebook_average || ''}
                                  onChange={handleChange}
                                  disabled={isMonthFinished}
                                />
                              </div>
                              <div className="fld">
                                <label>Below Average</label>
                                <input
                                  type="number"
                                  name="notebook_below_average"
                                  min="0"
                                  value={formData.notebook_below_average || ''}
                                  onChange={handleChange}
                                  disabled={isMonthFinished}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Smart Room Section */}
                        <div className="form-section" style={{ opacity: isMonthFinished ? 0.7 : 1 }}>
                          <h3>Smart Room</h3>
                          <div className="row">
                            <div className="rlabel">Smart Room Usage</div>
                            <div className="rsub">{hoursConfig.required_hours} hrs/month reference. Above 30% usage = 3 pts. Creative content ≥70% = 2 pts.</div>
                            <div className="fields">
                              <div className="fld">
                                <label>Hours Used</label>
                                <input
                                  type="number"
                                  name="smartroom_hours"
                                  min="0"
                                  value={formData.smartroom_hours || ''}
                                  onChange={handleChange}
                                  disabled={isMonthFinished}
                                />
                              </div>
                              <div className="fld">
                                <label>No. of AI Content</label>
                                <input
                                  type="number"
                                  name="smartroom_ai"
                                  min="0"
                                  value={formData.smartroom_ai || ''}
                                  onChange={handleChange}
                                  disabled={isMonthFinished}
                                />
                              </div>
                              <div className="fld">
                                <label>No. of YouTube</label>
                                <input
                                  type="number"
                                  name="smartroom_youtube"
                                  min="0"
                                  value={formData.smartroom_youtube || ''}
                                  onChange={handleChange}
                                  disabled={isMonthFinished}
                                />
                              </div>
                              <div className="fld">
                                <label>No. of Creative (PPT/PDF)</label>
                                <input
                                  type="number"
                                  name="smartroom_creative"
                                  min="0"
                                  value={formData.smartroom_creative || ''}
                                  onChange={handleChange}
                                  disabled={isMonthFinished}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Save Button for Class */}
                        <div className="form-actions">
                          <button type="submit" className="save-btn" disabled={saving || isMonthFinished}>
                            {saving ? 'Saving...' : `Save ${selectedClass}-${selectedDivision}`}
                          </button>
                          {saved && <span className="saved-tag">✅ Saved Successfully!</span>}
                          {isClassCompleted && <span className="chip chip--success">✓ Completed</span>}
                        </div>
                      </>
                    )}

                    {/* Finish Month Button */}
                    {completedClasses.length > 0 && !isMonthFinished && (
                      <div className="panel panel--warning">
                        <div className="panel-row">
                          <div>
                            <h3 className="panel-title">Classes Completed: {completedClasses.length} / {classes.length}</h3>
                            <p className="panel-sub">
                              When all classes are done, click below to finalize the month evaluation
                            </p>
                          </div>
                          <button
                            type="button"
                            className="btn-warning"
                            onClick={handleFinishMonth}
                            disabled={finishing}
                          >
                            {finishing ? 'Finishing...' : 'Finish Month Data Entry'}
                          </button>
                        </div>
                      </div>
                    )}

                    {isMonthFinished && (
                      <div className="panel panel--success">
                        <div style={{ textAlign: 'center' }}>
                          <h3 className="panel-title" style={{ justifyContent: 'center' }}>✓ Month Data Entry Completed</h3>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherEvaluationDashboard;
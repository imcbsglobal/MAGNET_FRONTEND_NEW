import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchTeachers, fetchTeacherMonthEvaluation, fetchAllClassEvaluations, saveEvaluation, fetchTeacherHours } from '../../services/api';
import './Evaluations.scss';

const HODEvaluationDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [classEvaluations, setClassEvaluations] = useState([]);
  const [showClassDetails, setShowClassDetails] = useState(false);
  const [hoursConfigs, setHoursConfigs] = useState([]);
  const [formData, setFormData] = useState({
    lesson_plan_submitted: 0,
    lesson_plan_quality: 0,
    subject_knowledge_1: 0,
    subject_knowledge_2: 0,
    subject_knowledge_3: 0,
    subject_knowledge_4: 0,
    subject_knowledge_5: 0,
    classroom_management: 0,
    activity_based_class: 0,
    training_1: 0,
    training_2: 0,
    training_3: 0,
    training_4: 0,
    training_5: 0,
    english_classroom: 0,
    english_informal: 0,
    english_fluency: 0,
    cocurricular_extra: 0,
    cocurricular_reward: 0,
    moral_discipline: 0,
    moral_uniform: 0,
    moral_good_deeds: 0,
    // Teacher's part (for display)
    exam_classes_with: 0,
    exam_excellent: 0,
    exam_good: 0,
    exam_average: 0,
    exam_below_average: 0,
    notebook_check1: false,
    notebook_check2: false,
    notebook_entry: 0,
    notebook_excellent: 0,
    notebook_good: 0,
    notebook_average: 0,
    notebook_below_average: 0,
    smartroom_hours: 0,
    smartroom_ai: 0,
    smartroom_youtube: 0,
    smartroom_creative: 0,
    is_month_finished: false,
  });

  const institutionId = localStorage.getItem('institutionId');

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    if (selectedTeacherId && month) {
      loadEvaluation();
    }
  }, [selectedTeacherId, month]);

  const loadTeachers = async () => {
    try {
      const [teacherResponse, hoursResponse] = await Promise.all([
        fetchTeachers(institutionId),
        fetchTeacherHours(institutionId),
      ]);
      const teacherOnly = teacherResponse.data.filter(teacher => teacher.job_category && teacher.job_category.toLowerCase() === 'Teacher'.toLowerCase());
      setTeachers(teacherOnly);
      setHoursConfigs(hoursResponse.data);
    } catch (err) {
      console.error('Failed to load teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEvaluation = async () => {
    try {
      setLoading(true);
      
      // Load both aggregated and class-based data
      const [monthlyResponse, classResponse] = await Promise.all([
        fetchTeacherMonthEvaluation(selectedTeacherId, month),
        fetchAllClassEvaluations(selectedTeacherId, month),
      ]);
      
      const data = monthlyResponse.data;
      
      // Convert old notebook_entry to checkboxes if needed
      let check1 = data.notebook_check1 || false;
      let check2 = data.notebook_check2 || false;
      if (data.notebook_check1 === undefined && data.notebook_entry >= 3) {
        check1 = true;
        if (data.notebook_entry >= 6) {
          check2 = true;
        }
      }
      
      setFormData({
        lesson_plan_submitted: data.lesson_plan_submitted || 0,
        lesson_plan_quality: data.lesson_plan_quality || 0,
        subject_knowledge_1: data.subject_knowledge_1 || 0,
        subject_knowledge_2: data.subject_knowledge_2 || 0,
        subject_knowledge_3: data.subject_knowledge_3 || 0,
        subject_knowledge_4: data.subject_knowledge_4 || 0,
        subject_knowledge_5: data.subject_knowledge_5 || 0,
        classroom_management: data.classroom_management || 0,
        activity_based_class: data.activity_based_class || 0,
        training_1: data.training_1 || 0,
        training_2: data.training_2 || 0,
        training_3: data.training_3 || 0,
        training_4: data.training_4 || 0,
        training_5: data.training_5 || 0,
        english_classroom: data.english_classroom || 0,
        english_informal: data.english_informal || 0,
        english_fluency: data.english_fluency || 0,
        cocurricular_extra: data.cocurricular_extra || 0,
        cocurricular_reward: data.cocurricular_reward || 0,
        moral_discipline: data.moral_discipline || 0,
        moral_uniform: data.moral_uniform || 0,
        moral_good_deeds: data.moral_good_deeds || 0,
        // Teacher's part (for display)
        exam_classes_with: data.exam_classes_with || 0,
        exam_excellent: data.exam_excellent || 0,
        exam_good: data.exam_good || 0,
        exam_average: data.exam_average || 0,
        exam_below_average: data.exam_below_average || 0,
        notebook_check1: check1,
        notebook_check2: check2,
        notebook_entry: data.notebook_entry || 0,
        notebook_excellent: data.notebook_excellent || 0,
        notebook_good: data.notebook_good || 0,
        notebook_average: data.notebook_average || 0,
        notebook_below_average: data.notebook_below_average || 0,
        smartroom_hours: data.smartroom_hours || 0,
        smartroom_ai: data.smartroom_ai || 0,
        smartroom_youtube: data.smartroom_youtube || 0,
        smartroom_creative: data.smartroom_creative || 0,
        is_month_finished: data.is_month_finished || false,
      });
      
      const evaluations = classResponse.data.evaluations || [];
      console.log('Class evaluations data:', evaluations);
      setClassEvaluations(evaluations);
    } catch (err) {
      console.error('Failed to load evaluation:', err);
      // Reset to default if no data found
      setFormData({
        lesson_plan_submitted: 0,
        lesson_plan_quality: 0,
        subject_knowledge_1: 0,
        subject_knowledge_2: 0,
        subject_knowledge_3: 0,
        subject_knowledge_4: 0,
        subject_knowledge_5: 0,
        classroom_management: 0,
        activity_based_class: 0,
        training_1: 0,
        training_2: 0,
        training_3: 0,
        training_4: 0,
        training_5: 0,
        english_classroom: 0,
        english_informal: 0,
        english_fluency: 0,
        cocurricular_extra: 0,
        cocurricular_reward: 0,
        moral_discipline: 0,
        moral_uniform: 0,
        moral_good_deeds: 0,
        exam_classes_with: 0,
        exam_excellent: 0,
        exam_good: 0,
        exam_average: 0,
        exam_below_average: 0,
        notebook_check1: false,
        notebook_check2: false,
        notebook_entry: 0,
        notebook_excellent: 0,
        notebook_good: 0,
        notebook_average: 0,
        notebook_below_average: 0,
        smartroom_hours: 0,
        smartroom_ai: 0,
        smartroom_youtube: 0,
        smartroom_creative: 0,
        is_month_finished: false,
      });
      setClassEvaluations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? 0 : parseFloat(value)
    }));
  };

  const calculateLessonPlanScore = () => {
    const sub = formData.lesson_plan_submitted;
    const q = sub > 0 ? formData.lesson_plan_quality : 0;
    return (sub + q).toFixed(1);
  };

  const calculateSubjectKnowledgeScore = () => {
    let total = 0;
    for (let i = 1; i <= 5; i++) {
      total += formData[`subject_knowledge_${i}`];
    }
    return total.toFixed(2);
  };

  const calculateTrainingScore = () => {
    let total = 0;
    for (let i = 1; i <= 5; i++) {
      total += formData[`training_${i}`];
    }
    return total.toFixed(2);
  };

  // Calculate exam score for a single class
  const calculateSingleClassExamScore = (cls) => {
    const base = cls.exam_conducted ? 6 : 0;
    const total = (cls.exam_excellent || 0) + (cls.exam_good || 0) + (cls.exam_average || 0) + (cls.exam_below_average || 0);
    let perf = 0;
    if (total > 0) {
      perf = (
        ((cls.exam_excellent || 0) * 4) +
        ((cls.exam_good || 0) * 3) +
        ((cls.exam_average || 0) * 2) +
        ((cls.exam_below_average || 0) * 1)
      ) / total;
      perf = Math.min(perf, 4);
    }
    return base + perf;
  };

  // Calculate notebook score for a single class
  const calculateSingleClassNotebookScore = (cls) => {
    let nbCheck1 = cls.notebook_check1 || false;
    let nbCheck2 = cls.notebook_check2 || false;
    if (cls.notebook_check1 === undefined && cls.notebook_entry) {
      if (cls.notebook_entry >= 6) {
        nbCheck1 = true;
        nbCheck2 = true;
      } else if (cls.notebook_entry >= 3) {
        nbCheck1 = true;
      }
    }
    let base = 0;
    if (nbCheck1 && nbCheck2) {
      base = 6;
    } else if (nbCheck1 || nbCheck2) {
      base = 3;
    } else {
      base = cls.notebook_entry || 0;
    }

    const total = (cls.notebook_excellent || 0) + (cls.notebook_good || 0) + (cls.notebook_average || 0) + (cls.notebook_below_average || 0);
    let perf = 0;
    if (total > 0) {
      perf = (
        ((cls.notebook_excellent || 0) * 4) +
        ((cls.notebook_good || 0) * 3) +
        ((cls.notebook_average || 0) * 2) +
        ((cls.notebook_below_average || 0) * 1)
      ) / total;
      perf = Math.min(perf, 4);
    }
    return base + perf;
  };

  // Get the selected teacher's hours configuration
  const getTeacherHoursConfig = () => {
    if (!selectedTeacherId) return { required_hours: 110 };
    return hoursConfigs.find(h => h.teacher_id === selectedTeacherId) || { required_hours: 110 };
  };

  // Calculate smart room score for a single class
  const calculateSingleClassSmartroomScore = (cls) => {
    const config = getTeacherHoursConfig();
    const smartPct = (cls.smartroom_hours || 0) / config.required_hours;
    const maxUsage = 3;
    const maxCreative = 2;
    const usage = smartPct >= 0.3 ? maxUsage : parseFloat((smartPct / 0.3 * maxUsage).toFixed(2));
    const totalContent = (cls.smartroom_ai || 0) + (cls.smartroom_youtube || 0) + (cls.smartroom_creative || 0);
    let creative = 0;
    if (totalContent > 0) {
      const crPct = (cls.smartroom_creative || 0) / totalContent;
      creative = crPct >= 0.7 ? maxCreative : parseFloat((crPct / 0.7 * maxCreative).toFixed(2));
    }
    return usage + creative;
  };

  // Calculate aggregated scores from class evaluations
  const calculateTeacherScoresFromClasses = () => {
    if (classEvaluations.length === 0) {
      return {
        exam: 0,
        notebook: 0,
        smartroom: 0,
      };
    }

    let totalExam = 0;
    let totalNotebook = 0;
    let totalSmartroom = 0;

    classEvaluations.forEach((cls) => {
      totalExam += calculateSingleClassExamScore(cls);
      totalNotebook += calculateSingleClassNotebookScore(cls);
      totalSmartroom += calculateSingleClassSmartroomScore(cls);
    });

    // Average the scores across classes
    const avgExam = totalExam / classEvaluations.length;
    const avgNotebook = totalNotebook / classEvaluations.length;
    const avgSmartroom = totalSmartroom / classEvaluations.length;

    return {
      exam: avgExam,
      notebook: avgNotebook,
      smartroom: avgSmartroom,
    };
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
    // Calculate base from checkboxes, fall back to notebook_entry
    let base = 0;
    if (formData.notebook_check1 && formData.notebook_check2) {
      base = 6;
    } else if (formData.notebook_check1 || formData.notebook_check2) {
      base = 3;
    } else {
      base = formData.notebook_entry || 0;
    }
    
    const total = formData.notebook_excellent + formData.notebook_good + formData.notebook_average + formData.notebook_below_average;
    let perf = 0;
    if (total > 0) {
      perf = ((formData.notebook_excellent * 4) + (formData.notebook_good * 3) + (formData.notebook_average * 2) + (formData.notebook_below_average * 1)) / total;
      perf = Math.min(perf, 4);
    }
    return (base + perf).toFixed(2);
  };

  const calculateSmartroomScore = () => {
    const config = getTeacherHoursConfig();
    const smartPct = formData.smartroom_hours / config.required_hours;
    const usage = smartPct >= 0.3 ? 3 : parseFloat((smartPct / 0.3 * 3).toFixed(2));
    const totalContent = formData.smartroom_ai + formData.smartroom_youtube + formData.smartroom_creative;
    let creative = 0;
    if (totalContent > 0) {
      const crPct = formData.smartroom_creative / totalContent;
      creative = crPct >= 0.7 ? 2 : parseFloat((crPct / 0.7 * 2).toFixed(2));
    }
    return (usage + creative).toFixed(2);
  };

  const calculateTotalScores = () => {
    const lessonPlan = parseFloat(calculateLessonPlanScore());
    const subjectKnowledge = parseFloat(calculateSubjectKnowledgeScore());
    const classroomManagement = formData.classroom_management;
    const activityBasedClass = formData.activity_based_class;
    const training = parseFloat(calculateTrainingScore());
    
    // Use calculated scores from class evaluations if available, otherwise use aggregated data
    const classScores = calculateTeacherScoresFromClasses();
    const exam = classScores.exam || parseFloat(calculateExamScore());
    const notebook = classScores.notebook || parseFloat(calculateNotebookScore());
    const smartroom = classScores.smartroom || parseFloat(calculateSmartroomScore());
    
    const english = formData.english_classroom + formData.english_informal + formData.english_fluency;
    const cocurricular = formData.cocurricular_extra + formData.cocurricular_reward;
    const moral = formData.moral_discipline + formData.moral_uniform + formData.moral_good_deeds;

    const academics = lessonPlan + subjectKnowledge + classroomManagement + activityBasedClass + training + exam + notebook + smartroom;
    const total = academics + english + cocurricular + moral;

    const percentage = Math.round((total / 100) * 100);
    let grade = 'Average';
    let gradeClass = 'bg-a';
    if (percentage >= 90) {
      grade = 'Excellent';
      gradeClass = 'bg-e';
    } else if (percentage >= 75) {
      grade = 'Very Good';
      gradeClass = 'bg-vg';
    } else if (percentage >= 60) {
      grade = 'Good';
      gradeClass = 'bg-g';
    }

    return {
      lessonPlan,
      subjectKnowledge,
      classroomManagement,
      activityBasedClass,
      training,
      exam,
      notebook,
      smartroom,
      academics: academics.toFixed(1),
      english: english.toFixed(1),
      cocurricular: cocurricular.toFixed(1),
      moral: moral.toFixed(1),
      total: total.toFixed(1),
      percentage,
      grade,
      gradeClass,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await saveEvaluation({
        teacher_id: selectedTeacherId,
        month: month,
        ...formData
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save evaluation:', err);
      alert('Failed to save evaluation');
    } finally {
      setSaving(false);
    }
  };

  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);
  const scores = selectedTeacherId && month ? calculateTotalScores() : null;

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="staff" />
      <main className="dashboard-main">
        <Navbar placeholder="Search evaluation..." />
        <div className="admins-page-container">
          <div className="evaluation-page">
            <header className="page-header">
              <div className="header-left">
                <h1>HOD Evaluation</h1>
                <p>Evaluate teachers</p>
              </div>
            </header>

            <div className="form-card">
              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <div className="teacher-selector">
                    <label>Select Teacher</label>
                    <select
                      value={selectedTeacherId || ''}
                      onChange={(e) => setSelectedTeacherId(parseInt(e.target.value))}
                      required
                    >
                      <option value="">— Select Teacher —</option>
                      {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.username}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Select Month</label>
                    <input
                      type="month"
                      name="month"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {!selectedTeacherId ? (
                  <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280', fontSize: '16px' }}>
                    Select a teacher to begin.
                  </div>
                ) : loading ? (
                  <div className="loader">
                    <div className="loading-spinner" style={{width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px'}}></div>
                    <div>Loading evaluation...</div>
                  </div>
                ) : (
                  <>
                    {/* Evaluation Summary */}
                    <div className="form-section" style={{ background: '#f0f9ff', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: 0 }}>Evaluation Summary</h3>
                        {classEvaluations.length > 0 && (
                          <button
                            type="button"
                            className="save-btn"
                            onClick={() => setShowClassDetails(!showClassDetails)}
                            style={{ fontSize: '13px', padding: '8px 16px' }}
                          >
                            {showClassDetails ? 'Hide Class Details' : 'Show Class Details'}
                          </button>
                        )}
                      </div>
                      <div className="tcard" style={{ marginBottom: 0, border: '1px solid #bae6fd' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>
                          {selectedTeacher?.username || 'Teacher'}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: '#6b7280' }}>{month}</span>
                        </div>
                      </div>

                      {(() => {
                        // Calculate average check status from class evaluations
                        let totalCheck1 = 0;
                        let totalCheck2 = 0;
                        
                        classEvaluations.forEach((cls) => {
                          let c1 = cls.notebook_check1 || false;
                          let c2 = cls.notebook_check2 || false;
                          
                          if (cls.notebook_check1 === undefined && cls.notebook_entry) {
                            if (cls.notebook_entry >= 6) {
                              c1 = true;
                              c2 = true;
                            } else if (cls.notebook_entry >= 3) {
                              c1 = true;
                            }
                          }
                          
                          if (c1) totalCheck1++;
                          if (c2) totalCheck2++;
                        });
                        
                        const avgCheck1 = classEvaluations.length > 0 ? totalCheck1 / classEvaluations.length : 0;
                        const avgCheck2 = classEvaluations.length > 0 ? totalCheck2 / classEvaluations.length : 0;
                        
                        const displayCheck1 = avgCheck1 >= 0.5 ? '✓' : '✗';
                        const displayCheck2 = avgCheck2 >= 0.5 ? '✓' : '✗';
                        
                        return (
                          <>
                            <div className="mrow">
                          <div className="mc">
                            <div className="mv">{(parseFloat(scores?.exam) + parseFloat(scores?.notebook) + parseFloat(scores?.smartroom)).toFixed(1)} / 25</div>
                            <div className="ml">Teacher Total</div>
                          </div>
                          <div className="mc">
                            <div className="mv">{parseFloat(scores?.exam).toFixed(1)} / 10</div>
                            <div className="ml">Exam</div>
                          </div>
                          <div className="mc">
                            <div className="mv">{parseFloat(scores?.notebook).toFixed(1)} / 10</div>
                            <div className="ml">Notebook</div>
                          </div>
                          <div className="mc">
                            <div className="mv">{parseFloat(scores?.smartroom).toFixed(1)} / 5</div>
                            <div className="ml">Smart Room</div>
                          </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                          <table className="ptable">
                            <thead>
                              <tr>
                                <th style={{ width: '44%' }}>Criterion</th>
                                <th style={{ width: '28%', textAlign: 'center' }}>Score</th>
                                <th style={{ width: '28%', textAlign: 'center' }}>Max</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="cat-row">
                                <td colSpan={3}>Teacher-Submitted Data</td>
                              </tr>
                              <tr>
                                <td>Exam</td>
                                <td style={{ textAlign: 'center', fontWeight: 500 }}>{parseFloat(scores?.exam).toFixed(1)}</td>
                                <td style={{ textAlign: 'center', color: '#6b7280' }}>10</td>
                              </tr>
                              <tr>
                                <td>
                                  Notebook Checks: {displayCheck1} / {displayCheck2} {classEvaluations.length > 0 && `(Avg across ${classEvaluations.length} classes)`}
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 500 }}>{parseFloat(scores?.notebook).toFixed(1)}</td>
                                <td style={{ textAlign: 'center', color: '#6b7280' }}>10</td>
                              </tr>
                              <tr>
                                <td>Smart Room</td>
                                <td style={{ textAlign: 'center', fontWeight: 500 }}>{parseFloat(scores?.smartroom).toFixed(1)}</td>
                                <td style={{ textAlign: 'center', color: '#6b7280' }}>5</td>
                              </tr>
                              <tr className="tot-row">
                                <td style={{ fontWeight: 600 }}>Teacher Total</td>
                                <td style={{ textAlign: 'center', fontWeight: 600 }}>{(parseFloat(scores?.exam) + parseFloat(scores?.notebook) + parseFloat(scores?.smartroom)).toFixed(1)}</td>
                                <td style={{ textAlign: 'center', color: '#6b7280' }}>25</td>
                              </tr>
                                </tbody>
                              </table>
                            </div>
                          </>
                        );
                      })()}

                        {/* Class-based details */}
                        {showClassDetails && classEvaluations.length > 0 && (
                            <div style={{ marginTop: '20px' }}>
                                <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>Class-wise Details</h4>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="ptable">
                                        <thead>
                                            <tr>
                                                <th>Class</th>
                                                <th>Exam Conducted</th>
                                                <th>Exam (Exc/Good/Avg/Below)</th>
                                                <th>Notebook Checks</th>
                                                <th>Notebook (Exc/Good/Avg/Below)</th>
                                                <th>Smart Room Hours</th>
                                                <th>Smart Room (AI/YT/Creative)</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {classEvaluations.map((cls, idx) => {
                                                // Add fallback values for all fields
                                                const safeCls = {
                                                    student_class: cls.student_class || '-',
                                                    division: cls.division || '-',
                                                    exam_conducted: cls.exam_conducted || false,
                                                    exam_excellent: cls.exam_excellent || 0,
                                                    exam_good: cls.exam_good || 0,
                                                    exam_average: cls.exam_average || 0,
                                                    exam_below_average: cls.exam_below_average || 0,
                                                    notebook_check1: cls.notebook_check1 || false,
                                                    notebook_check2: cls.notebook_check2 || false,
                                                    notebook_entry: cls.notebook_entry || 0,
                                                    notebook_excellent: cls.notebook_excellent || 0,
                                                    notebook_good: cls.notebook_good || 0,
                                                    notebook_average: cls.notebook_average || 0,
                                                    notebook_below_average: cls.notebook_below_average || 0,
                                                    smartroom_hours: cls.smartroom_hours || 0,
                                                    smartroom_ai: cls.smartroom_ai || 0,
                                                    smartroom_youtube: cls.smartroom_youtube || 0,
                                                    smartroom_creative: cls.smartroom_creative || 0,
                                                    is_completed: cls.is_completed || false,
                                                };

                                                let nbCheck1 = safeCls.notebook_check1;
                                                let nbCheck2 = safeCls.notebook_check2;
                                                if (safeCls.notebook_check1 === undefined && safeCls.notebook_entry) {
                                                    if (safeCls.notebook_entry >= 6) {
                                                        nbCheck1 = true;
                                                        nbCheck2 = true;
                                                    } else if (safeCls.notebook_entry >= 3) {
                                                        nbCheck1 = true;
                                                    }
                                                }

                                                return (
                                                    <tr key={idx}>
                                                        <td style={{ fontWeight: 500 }}>{safeCls.student_class} - {safeCls.division}</td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            {safeCls.exam_conducted ? (
                                                                <span className="badge bg-e" style={{ fontSize: '11px' }}>Yes</span>
                                                            ) : (
                                                                <span className="badge bg-a" style={{ fontSize: '11px' }}>No</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                                                                <span style={{ color: '#16a34a', fontWeight: 500 }}>{safeCls.exam_excellent}</span>
                                                                <span style={{ color: '#2563eb', fontWeight: 500 }}>{safeCls.exam_good}</span>
                                                                <span style={{ color: '#d97706', fontWeight: 500 }}>{safeCls.exam_average}</span>
                                                                <span style={{ color: '#dc2626', fontWeight: 500 }}>{safeCls.exam_below_average}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', fontSize: '12px' }}>
                                                                <span style={{ color: nbCheck1 ? '#16a34a' : '#dc2626', fontWeight: 500 }}>
                                                                    {nbCheck1 ? '✓' : '✗'}
                                                                </span>
                                                                <span style={{ color: nbCheck2 ? '#16a34a' : '#dc2626', fontWeight: 500 }}>
                                                                    {nbCheck2 ? '✓' : '✗'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                                                                <span style={{ color: '#16a34a', fontWeight: 500 }}>{safeCls.notebook_excellent}</span>
                                                                <span style={{ color: '#2563eb', fontWeight: 500 }}>{safeCls.notebook_good}</span>
                                                                <span style={{ color: '#d97706', fontWeight: 500 }}>{safeCls.notebook_average}</span>
                                                                <span style={{ color: '#dc2626', fontWeight: 500 }}>{safeCls.notebook_below_average}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: 'center', fontWeight: 500 }}>{safeCls.smartroom_hours}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                                                                <span style={{ color: '#16a34a', fontWeight: 500 }}>{safeCls.smartroom_ai}</span>
                                                                <span style={{ color: '#2563eb', fontWeight: 500 }}>{safeCls.smartroom_youtube}</span>
                                                                <span style={{ color: '#d97706', fontWeight: 500 }}>{safeCls.smartroom_creative}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            {safeCls.is_completed ? (
                                                                <span className="badge bg-e" style={{ fontSize: '11px' }}>Completed</span>
                                                            ) : (
                                                                <span className="badge bg-a" style={{ fontSize: '11px' }}>Pending</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                      </div>
                    </div>

                    <div className="form-section">
                      <h3>Academics - Lesson Plan (Max 5)</h3>
                      <div className="row">
                        <div className="rlabel">Lesson Plan Submitted?</div>
                        <div className="fields">
                          <div className="fld">
                            <label>Submitted</label>
                            <select
                              name="lesson_plan_submitted"
                              value={formData.lesson_plan_submitted}
                              onChange={handleChange}
                            >
                              <option value={0}>No (0)</option>
                              <option value={3}>Yes (3)</option>
                            </select>
                          </div>
                          <div className="fld">
                            <label>Quality</label>
                            <select
                              name="lesson_plan_quality"
                              value={formData.lesson_plan_quality}
                              onChange={handleChange}
                            >
                              <option value={0}>— if submitted —</option>
                              <option value={2}>Excellent (+2)</option>
                              <option value={1.5}>Good (+1.5)</option>
                              <option value={1}>Average (+1)</option>
                            </select>
                          </div>
                        </div>
                        <div className="score-preview">Score: {calculateLessonPlanScore()}</div>
                      </div>
                    </div>

                    <div className="form-section">
                      <h3>Academics - Subject Knowledge (Max 5)</h3>
                      <div className="row">
                        <div className="rlabel">5 parameters - rate each (Exc=1, Good=0.75, Avg=0.5)</div>
                        <div className="fields">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="fld">
                              <label>Param {i}</label>
                              <select
                                name={`subject_knowledge_${i}`}
                                value={formData[`subject_knowledge_${i}`]}
                                onChange={handleChange}
                              >
                                <option value={0}>—</option>
                                <option value={1}>Excellent</option>
                                <option value={0.75}>Good</option>
                                <option value={0.5}>Average</option>
                              </select>
                            </div>
                          ))}
                        </div>
                        <div className="score-preview">Score: {calculateSubjectKnowledgeScore()}</div>
                      </div>
                    </div>

                    <div className="form-section">
                      <h3>Academics - Classroom Management (Max 5)</h3>
                      <div className="row">
                        <div className="fields">
                          <div className="fld">
                            <label>Rating</label>
                            <select
                              name="classroom_management"
                              value={formData.classroom_management}
                              onChange={handleChange}
                            >
                              <option value={0}>—</option>
                              <option value={5}>Excellent (5)</option>
                              <option value={4}>Very Good (4)</option>
                              <option value={3}>Good (3)</option>
                              <option value={2}>Average (2)</option>
                              <option value={1}>Below Average (1)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="form-section">
                      <h3>Academics - Activity Based Class (Max 5)</h3>
                      <div className="row">
                        <div className="fields">
                          <div className="fld">
                            <label>Rating</label>
                            <select
                              name="activity_based_class"
                              value={formData.activity_based_class}
                              onChange={handleChange}
                            >
                              <option value={0}>—</option>
                              <option value={5}>Excellent (5)</option>
                              <option value={4}>Very Good (4)</option>
                              <option value={3}>Good (3)</option>
                              <option value={2}>Average (2)</option>
                              <option value={1}>Below Average (1)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="form-section">
                      <h3>Academics - Training (Max 5)</h3>
                      <div className="row">
                        <div className="rlabel">5 parameters - rate each (Exc=1, Good=0.75, Avg=0.5)</div>
                        <div className="fields">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="fld">
                              <label>Param {i}</label>
                              <select
                                name={`training_${i}`}
                                value={formData[`training_${i}`]}
                                onChange={handleChange}
                              >
                                <option value={0}>—</option>
                                <option value={1}>Excellent</option>
                                <option value={0.75}>Good</option>
                                <option value={0.5}>Average</option>
                              </select>
                            </div>
                          ))}
                        </div>
                        <div className="score-preview">Score: {calculateTrainingScore()}</div>
                      </div>
                    </div>

                    <div className="form-section">
                      <h3>English Communication (Max 30)</h3>
                      <div className="row">
                        <div className="rlabel">Classroom Communication - Max 10</div>
                        <div className="fields">
                          <div className="fld">
                            <label>Rating</label>
                            <select
                              name="english_classroom"
                              value={formData.english_classroom}
                              onChange={handleChange}
                            >
                              <option value={0}>—</option>
                              <option value={10}>Excellent (10)</option>
                              <option value={8}>Very Good (8)</option>
                              <option value={6}>Good (6)</option>
                              <option value={4}>Average (4)</option>
                              <option value={2}>Below Average (2)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="rlabel">Informal Communication - Max 10</div>
                        <div className="fields">
                          <div className="fld">
                            <label>Rating</label>
                            <select
                              name="english_informal"
                              value={formData.english_informal}
                              onChange={handleChange}
                            >
                              <option value={0}>—</option>
                              <option value={10}>Excellent (10)</option>
                              <option value={8}>Very Good (8)</option>
                              <option value={6}>Good (6)</option>
                              <option value={4}>Average (4)</option>
                              <option value={2}>Below Average (2)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="rlabel">Fluency & Vocabulary - Max 10</div>
                        <div className="fields">
                          <div className="fld">
                            <label>Rating</label>
                            <select
                              name="english_fluency"
                              value={formData.english_fluency}
                              onChange={handleChange}
                            >
                              <option value={0}>—</option>
                              <option value={10}>Excellent (10)</option>
                              <option value={8}>Very Good (8)</option>
                              <option value={6}>Good (6)</option>
                              <option value={4}>Average (4)</option>
                              <option value={2}>Below Average (2)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="form-section">
                      <h3>Co-Curricular Activities (Max 10)</h3>
                      <div className="row">
                        <div className="rlabel">Extra Activity - Max 5</div>
                        <div className="fields">
                          <div className="fld">
                            <label>Rating</label>
                            <select
                              name="cocurricular_extra"
                              value={formData.cocurricular_extra}
                              onChange={handleChange}
                            >
                              <option value={0}>—</option>
                              <option value={5}>Excellent (5)</option>
                              <option value={4}>Very Good (4)</option>
                              <option value={3}>Good (3)</option>
                              <option value={2}>Average (2)</option>
                              <option value={1}>Below Average (1)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="rlabel">Reward - Max 5</div>
                        <div className="fields">
                          <div className="fld">
                            <label>Rating</label>
                            <select
                              name="cocurricular_reward"
                              value={formData.cocurricular_reward}
                              onChange={handleChange}
                            >
                              <option value={0}>—</option>
                              <option value={5}>Excellent (5)</option>
                              <option value={4}>Very Good (4)</option>
                              <option value={3}>Good (3)</option>
                              <option value={2}>Average (2)</option>
                              <option value={1}>Below Average (1)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="form-section">
                      <h3>Moral (Max 10)</h3>
                      <div className="row">
                        <div className="rlabel">Discipline of Children - Max 4</div>
                        <div className="fields">
                          <div className="fld">
                            <label>Rating</label>
                            <select
                              name="moral_discipline"
                              value={formData.moral_discipline}
                              onChange={handleChange}
                            >
                              <option value={0}>—</option>
                              <option value={4}>Excellent (4)</option>
                              <option value={3}>Good (3)</option>
                              <option value={2}>Average (2)</option>
                              <option value={1}>Below Average (1)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="rlabel">Uniform - Max 3</div>
                        <div className="fields">
                          <div className="fld">
                            <label>Rating</label>
                            <select
                              name="moral_uniform"
                              value={formData.moral_uniform}
                              onChange={handleChange}
                            >
                              <option value={0}>—</option>
                              <option value={3}>Excellent (3)</option>
                              <option value={2}>Good (2)</option>
                              <option value={1}>Average (1)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="rlabel">Good Deeds - Max 3</div>
                        <div className="fields">
                          <div className="fld">
                            <label>Rating</label>
                            <select
                              name="moral_good_deeds"
                              value={formData.moral_good_deeds}
                              onChange={handleChange}
                            >
                              <option value={0}>—</option>
                              <option value={3}>Excellent (3)</option>
                              <option value={2}>Good (2)</option>
                              <option value={1}>Average (1)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="save-btn" disabled={saving}>
                        {saving ? 'Saving...' : 'Save HOD Entry'}
                      </button>
                      {saved && <span className="saved-tag">✅ Saved Successfully!</span>}
                    </div>
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

export default HODEvaluationDashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchAllEvaluations, fetchTeachers } from '../../services/api';
import './Evaluations.scss';

const AdminEvaluationDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  const institutionId = localStorage.getItem('institutionId');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [evalsRes, teachersRes] = await Promise.all([
        fetchAllEvaluations(institutionId),
        fetchTeachers(institutionId)
      ]);
      setEvaluations(evalsRes.data);
      const teacherOnly = teachersRes.data.filter(teacher => teacher.job_category && teacher.job_category.toLowerCase() === 'Teacher'.toLowerCase());
      setTeachers(teacherOnly);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (e) => {
    // Teacher's part
    const examBase = e.exam_classes_with > 0 ? 6 : 0;
    const examTotalStudents = e.exam_excellent + e.exam_good + e.exam_average + e.exam_below_average;
    let examPerf = 0;
    if (examTotalStudents > 0) {
      examPerf = ((e.exam_excellent * 4) + (e.exam_good * 3) + (e.exam_average * 2) + (e.exam_below_average * 1)) / examTotalStudents;
      examPerf = Math.min(examPerf, 4);
    }
    const exam = examBase + examPerf;

    // Calculate notebook entry from checkboxes (fallback to notebook_entry for old data)
    let notebookEntry = 0;
    if (e.notebook_check1 && e.notebook_check2) {
      notebookEntry = 6;
    } else if (e.notebook_check1 || e.notebook_check2) {
      notebookEntry = 3;
    } else {
      notebookEntry = e.notebook_entry;
    }
    const notebookTotalStudents = e.notebook_excellent + e.notebook_good + e.notebook_average + e.notebook_below_average;
    let notebookPerf = 0;
    if (notebookTotalStudents > 0) {
      notebookPerf = ((e.notebook_excellent * 4) + (e.notebook_good * 3) + (e.notebook_average * 2) + (e.notebook_below_average * 1)) / notebookTotalStudents;
      notebookPerf = Math.min(notebookPerf, 4);
    }
    const notebook = notebookEntry + notebookPerf;

    const smartRoomPct = e.smartroom_hours / 110;
    let smartRoomUsage = smartRoomPct >= 0.3 ? 3 : parseFloat((smartRoomPct / 0.3 * 3).toFixed(2));
    const totalContent = e.smartroom_ai + e.smartroom_youtube + e.smartroom_creative;
    let smartRoomCreative = 0;
    if (totalContent > 0) {
      const crPct = e.smartroom_creative / totalContent;
      smartRoomCreative = crPct >= 0.7 ? 2 : parseFloat((crPct / 0.7 * 2).toFixed(2));
    }
    const smartRoom = smartRoomUsage + smartRoomCreative;

    // HOD's part
    const lessonPlan = e.lesson_plan_submitted + e.lesson_plan_quality;
    const subjectKnowledge = e.subject_knowledge_1 + e.subject_knowledge_2 + e.subject_knowledge_3 + e.subject_knowledge_4 + e.subject_knowledge_5;
    const classroomManagement = e.classroom_management;
    const activityBasedClass = e.activity_based_class;
    const training = e.training_total > 0 ? Math.min((e.training_attended / e.training_total) * 5, 5) : 0;

    const academics = exam + notebook + smartRoom + lessonPlan + subjectKnowledge + classroomManagement + activityBasedClass + training;
    const english = e.english_classroom + e.english_informal + e.english_fluency;
    const cocurricular = e.cocurricular_extra + e.cocurricular_reward;
    const moral = e.moral_discipline + e.moral_uniform + e.moral_good_deeds;
    const total = academics + english + cocurricular + moral;

    const pct = Math.round((total / 100) * 100);
    let grade;
    let gradeClass;
    if (pct >= 90) {
      grade = 'Excellent';
      gradeClass = 'bg-e';
    } else if (pct >= 75) {
      grade = 'Very Good';
      gradeClass = 'bg-vg';
    } else if (pct >= 60) {
      grade = 'Good';
      gradeClass = 'bg-g';
    } else {
      grade = 'Average';
      gradeClass = 'bg-a';
    }

    return {
      academics: academics.toFixed(1),
      english: english.toFixed(1),
      cocurricular: cocurricular.toFixed(1),
      moral: moral.toFixed(1),
      total: total.toFixed(1),
      percentage: pct,
      grade,
      gradeClass,
      lessonPlan: lessonPlan.toFixed(1),
      subjectKnowledge: subjectKnowledge.toFixed(2),
      classroomManagement,
      activityBasedClass,
      training,
      exam: exam.toFixed(2),
      notebook: notebook.toFixed(2),
      smartRoom: smartRoom.toFixed(2)
    };
  };

  const filteredEvaluations = () => {
    let filtered = [...evaluations];
    if (selectedTeacherId) {
      filtered = filtered.filter(e => e.teacher_id === parseInt(selectedTeacherId));
    }
    if (selectedMonth) {
      filtered = filtered.filter(e => e.month === selectedMonth);
    }
    return filtered;
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="admin" />
      <main className="dashboard-main">
        <Navbar placeholder="Search evaluations..." />
        <div className="admins-page-container">
          <div className="evaluation-page">
            <header className="page-header">
              <div className="header-left">
                <h1>Evaluation Dashboard</h1>
                <p>View all teacher evaluations</p>
              </div>
              <button className="save-btn" onClick={() => navigate('/admin/evaluations/teachers')} style={{ background: '#6b7280' }}>
                View Teachers Entry Details
              </button>
            </header>

            <div className="form-card">
              <div className="pf-row">
                <label>View:</label>
                <select value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)}>
                  <option value="">All Teachers</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.username}</option>
                  ))}
                </select>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                  <option value="">All Months</option>
                  {[...new Set(evaluations.map(e => e.month))].sort().reverse().map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="loader">
                  <div className="loading-spinner" style={{width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px'}}></div>
                  <div>Loading evaluations...</div>
                </div>
              ) : filteredEvaluations().length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280', fontSize: '16px' }}>
                  No entries yet.
                </div>
              ) : (
                filteredEvaluations().map(evaluation => {
                  const scores = calculateTotal(evaluation);
                  const teacher = teachers.find(t => t.id === evaluation.teacher_id);
                  return (
                    <div key={evaluation.id} className="tcard">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>
                          {teacher?.username || 'Unknown Teacher'}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: '#6b7280' }}>{evaluation.month}</span>
                        </div>
                      </div>

                      <div className="mrow">
                        <div className="mc">
                          <div className="mv">{scores.total} / 100</div>
                          <div className="ml">Total</div>
                        </div>
                        <div className="mc">
                          <div className="mv">{scores.percentage}%</div>
                          <div className="ml">Percentage</div>
                        </div>
                        <div className="mc">
                          <div className="mv">{scores.academics} / 50</div>
                          <div className="ml">Academics</div>
                        </div>
                        <div className="mc">
                          <div className="mv">{scores.english} / 30</div>
                          <div className="ml">English</div>
                        </div>
                        <div className="mc">
                          <div className="mv">{scores.cocurricular} / 10</div>
                          <div className="ml">Co-curricular</div>
                        </div>
                        <div className="mc">
                          <div className="mv">{scores.moral} / 10</div>
                          <div className="ml">Moral</div>
                        </div>
                      </div>

                      <div style={{ overflowX: 'auto' }}>
                        <table className="ptable">
                          <thead>
                            <tr>
                              <th style={{ width: '44%' }}>Criterion</th>
                              <th style={{ width: '16%' }}>By</th>
                              <th style={{ width: '20%', textAlign: 'center' }}>Score</th>
                              <th style={{ width: '20%', textAlign: 'center' }}>Max</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="cat-row">
                              <td colSpan={4}>Academics (50)</td>
                            </tr>
                            <tr>
                              <td>Lesson Plan</td>
                              <td style={{ fontSize: '12px', color: '#6b7280' }}>HOD</td>
                              <td style={{ textAlign: 'center', fontWeight: 500 }}>{scores.lessonPlan.replace('.00', '')}</td>
                              <td style={{ textAlign: 'center', color: '#6b7280' }}>5</td>
                            </tr>
                            <tr>
                              <td>Subject Knowledge</td>
                              <td style={{ fontSize: '12px', color: '#6b7280' }}>HOD</td>
                              <td style={{ textAlign: 'center', fontWeight: 500 }}>{scores.subjectKnowledge.replace('.00', '')}</td>
                              <td style={{ textAlign: 'center', color: '#6b7280' }}>5</td>
                            </tr>
                            <tr>
                              <td>Classroom Management</td>
                              <td style={{ fontSize: '12px', color: '#6b7280' }}>HOD</td>
                              <td style={{ textAlign: 'center', fontWeight: 500 }}>{scores.classroomManagement}</td>
                              <td style={{ textAlign: 'center', color: '#6b7280' }}>5</td>
                            </tr>
                            <tr>
                              <td>Activity Based Classroom</td>
                              <td style={{ fontSize: '12px', color: '#6b7280' }}>HOD</td>
                              <td style={{ textAlign: 'center', fontWeight: 500 }}>{scores.activityBasedClass}</td>
                              <td style={{ textAlign: 'center', color: '#6b7280' }}>5</td>
                            </tr>
                            <tr>
                              <td>Training</td>
                              <td style={{ fontSize: '12px', color: '#6b7280' }}>HOD</td>
                              <td style={{ textAlign: 'center', fontWeight: 500 }}>{scores.training}</td>
                              <td style={{ textAlign: 'center', color: '#6b7280' }}>5</td>
                            </tr>
                            <tr>
                              <td>Exam</td>
                              <td style={{ fontSize: '12px', color: '#6b7280' }}>Teacher</td>
                              <td style={{ textAlign: 'center', fontWeight: 500 }}>{scores.exam.replace('.00', '')}</td>
                              <td style={{ textAlign: 'center', color: '#6b7280' }}>10</td>
                            </tr>
                            <tr>
                              <td>Notebook</td>
                              <td style={{ fontSize: '12px', color: '#6b7280' }}>Teacher</td>
                              <td style={{ textAlign: 'center', fontWeight: 500 }}>{scores.notebook.replace('.00', '')}</td>
                              <td style={{ textAlign: 'center', color: '#6b7280' }}>10</td>
                            </tr>
                            <tr>
                              <td>Smart Room</td>
                              <td style={{ fontSize: '12px', color: '#6b7280' }}>Teacher</td>
                              <td style={{ textAlign: 'center', fontWeight: 500 }}>{scores.smartRoom.replace('.00', '')}</td>
                              <td style={{ textAlign: 'center', color: '#6b7280' }}>5</td>
                            </tr>

                            <tr className="cat-row">
                              <td colSpan={4}>English (30)</td>
                            </tr>
                            <tr>
                              <td>Classroom Comm.</td>
                              <td style={{ fontSize: '12px', color: '#6b7280' }}>HOD</td>
                              <td style={{ textAlign: 'center', fontWeight: 500 }}>{evaluation.english_classroom}</td>
                              <td style={{ textAlign: 'center', color: '#6b7280' }}>10</td>
                            </tr>
                            <tr>
                              <td>Informal Comm.</td>
                              <td style={{ fontSize: '12px', color: '#6b7280' }}>HOD</td>
                              <td style={{ textAlign: 'center', fontWeight: 500 }}>{evaluation.english_informal}</td>
                              <td style={{ textAlign: 'center', color: '#6b7280' }}>10</td>
                            </tr>
                            <tr>
                              <td>Fluency & Vocab.</td>
                              <td style={{ fontSize: '12px', color: '#6b7280' }}>HOD</td>
                              <td style={{ textAlign: 'center', fontWeight: 500 }}>{evaluation.english_fluency}</td>
                              <td style={{ textAlign: 'center', color: '#6b7280' }}>10</td>
                            </tr>

                            <tr className="cat-row">
                              <td colSpan={4}>Co-curricular (10)</td>
                            </tr>
                            <tr>
                              <td>Extra Activity</td>
                              <td style={{ fontSize: '12px', color: '#6b7280' }}>HOD</td>
                              <td style={{ textAlign: 'center', fontWeight: 500 }}>{evaluation.cocurricular_extra}</td>
                              <td style={{ textAlign: 'center', color: '#6b7280' }}>5</td>
                            </tr>
                            <tr>
                              <td>Reward</td>
                              <td style={{ fontSize: '12px', color: '#6b7280' }}>HOD</td>
                              <td style={{ textAlign: 'center', fontWeight: 500 }}>{evaluation.cocurricular_reward}</td>
                              <td style={{ textAlign: 'center', color: '#6b7280' }}>5</td>
                            </tr>

                            <tr className="cat-row">
                              <td colSpan={4}>Moral (10)</td>
                            </tr>
                            <tr>
                              <td>Discipline</td>
                              <td style={{ fontSize: '12px', color: '#6b7280' }}>HOD</td>
                              <td style={{ textAlign: 'center', fontWeight: 500 }}>{evaluation.moral_discipline}</td>
                              <td style={{ textAlign: 'center', color: '#6b7280' }}>4</td>
                            </tr>
                            <tr>
                              <td>Uniform</td>
                              <td style={{ fontSize: '12px', color: '#6b7280' }}>HOD</td>
                              <td style={{ textAlign: 'center', fontWeight: 500 }}>{evaluation.moral_uniform}</td>
                              <td style={{ textAlign: 'center', color: '#6b7280' }}>3</td>
                            </tr>
                            <tr>
                              <td>Good Deeds</td>
                              <td style={{ fontSize: '12px', color: '#6b7280' }}>HOD</td>
                              <td style={{ textAlign: 'center', fontWeight: 500 }}>{evaluation.moral_good_deeds}</td>
                              <td style={{ textAlign: 'center', color: '#6b7280' }}>3</td>
                            </tr>

                            <tr className="tot-row">
                              <td colSpan={2} style={{ fontWeight: 600 }}>Total</td>
                              <td style={{ textAlign: 'center', fontWeight: 600 }}>{scores.total}</td>
                              <td style={{ textAlign: 'center', color: '#6b7280' }}>100</td>
                            </tr>
                            {evaluation.hod_remark && (
                              <tr>
                                <td colSpan={4} style={{ padding: '10px 16px', color: '#4b5563', fontStyle: 'italic', background: '#fffbeb', borderTop: '1px solid #fde68a' }}>
                                  <strong>HOD Remark:</strong> {evaluation.hod_remark}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminEvaluationDashboard;

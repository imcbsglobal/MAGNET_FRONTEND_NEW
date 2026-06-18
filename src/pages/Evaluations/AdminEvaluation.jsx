import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchAllEvaluations, fetchTeachers } from '../../services/api';
import './AdminEvaluation.scss';

const EvalIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 2h6a1 1 0 0 1 1 1v1H8V3a1 1 0 0 1 1-1z" />
    <path d="M5 5h14v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

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
      setTeachers(teachersRes.data);
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

    const notebookEntry = e.notebook_entry;
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
    const training = e.training_1 + e.training_2 + e.training_3 + e.training_4 + e.training_5;

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
        <div className="evaluations-page">

          {/* ── Header ── */}
          <div className="eval-header">
            <div className="eval-header-main">
              <div className="eval-header-icon"><EvalIcon /></div>
              <div>
                <h1>Evaluation Dashboard</h1>
                <p>View all teacher evaluations</p>
              </div>
            </div>
          </div>

          {/* ── Filters ── */}
          <div className="eval-filter-card">
            <div className="eval-filter-bar">
              <span className="eval-filter-label">View:</span>
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
              <div className="eval-empty">Loading...</div>
            ) : filteredEvaluations().length === 0 ? (
              <div className="eval-empty">No entries yet.</div>
            ) : (
              <div className="eval-cards">
                {filteredEvaluations().map(evaluation => {
                  const scores = calculateTotal(evaluation);
                  const teacher = teachers.find(t => t.id === evaluation.teacher_id);
                  return (
                    <div key={evaluation.id} className="tcard">
                      <div className="tcard-top">
                        <div className="tcard-teacher">
                          {teacher?.username || 'Unknown Teacher'}
                        </div>
                        <div className="tcard-meta">
                          <span className="tcard-month">{evaluation.month}</span>
                          <span className={`badge ${scores.gradeClass}`}>{scores.grade}</span>
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

                      <div className="table-responsive">
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
                              <td className="ptable-by">HOD</td>
                              <td className="ptable-score">{scores.lessonPlan.replace('.00', '')}</td>
                              <td className="ptable-max">5</td>
                            </tr>
                            <tr>
                              <td>Subject Knowledge</td>
                              <td className="ptable-by">HOD</td>
                              <td className="ptable-score">{scores.subjectKnowledge.replace('.00', '')}</td>
                              <td className="ptable-max">5</td>
                            </tr>
                            <tr>
                              <td>Classroom Management</td>
                              <td className="ptable-by">HOD</td>
                              <td className="ptable-score">{scores.classroomManagement}</td>
                              <td className="ptable-max">5</td>
                            </tr>
                            <tr>
                              <td>Activity Based Classroom</td>
                              <td className="ptable-by">HOD</td>
                              <td className="ptable-score">{scores.activityBasedClass}</td>
                              <td className="ptable-max">5</td>
                            </tr>
                            <tr>
                              <td>Training</td>
                              <td className="ptable-by">HOD</td>
                              <td className="ptable-score">{scores.training}</td>
                              <td className="ptable-max">5</td>
                            </tr>
                            <tr>
                              <td>Exam</td>
                              <td className="ptable-by">Teacher</td>
                              <td className="ptable-score">{scores.exam.replace('.00', '')}</td>
                              <td className="ptable-max">10</td>
                            </tr>
                            <tr>
                              <td>Notebook</td>
                              <td className="ptable-by">Teacher</td>
                              <td className="ptable-score">{scores.notebook.replace('.00', '')}</td>
                              <td className="ptable-max">10</td>
                            </tr>
                            <tr>
                              <td>Smart Room</td>
                              <td className="ptable-by">Teacher</td>
                              <td className="ptable-score">{scores.smartRoom.replace('.00', '')}</td>
                              <td className="ptable-max">5</td>
                            </tr>

                            <tr className="cat-row">
                              <td colSpan={4}>English (30)</td>
                            </tr>
                            <tr>
                              <td>Classroom Comm.</td>
                              <td className="ptable-by">HOD</td>
                              <td className="ptable-score">{evaluation.english_classroom}</td>
                              <td className="ptable-max">10</td>
                            </tr>
                            <tr>
                              <td>Informal Comm.</td>
                              <td className="ptable-by">HOD</td>
                              <td className="ptable-score">{evaluation.english_informal}</td>
                              <td className="ptable-max">10</td>
                            </tr>
                            <tr>
                              <td>Fluency & Vocab.</td>
                              <td className="ptable-by">HOD</td>
                              <td className="ptable-score">{evaluation.english_fluency}</td>
                              <td className="ptable-max">10</td>
                            </tr>

                            <tr className="cat-row">
                              <td colSpan={4}>Co-curricular (10)</td>
                            </tr>
                            <tr>
                              <td>Extra Activity</td>
                              <td className="ptable-by">HOD</td>
                              <td className="ptable-score">{evaluation.cocurricular_extra}</td>
                              <td className="ptable-max">5</td>
                            </tr>
                            <tr>
                              <td>Reward</td>
                              <td className="ptable-by">HOD</td>
                              <td className="ptable-score">{evaluation.cocurricular_reward}</td>
                              <td className="ptable-max">5</td>
                            </tr>

                            <tr className="cat-row">
                              <td colSpan={4}>Moral (10)</td>
                            </tr>
                            <tr>
                              <td>Discipline</td>
                              <td className="ptable-by">HOD</td>
                              <td className="ptable-score">{evaluation.moral_discipline}</td>
                              <td className="ptable-max">4</td>
                            </tr>
                            <tr>
                              <td>Uniform</td>
                              <td className="ptable-by">HOD</td>
                              <td className="ptable-score">{evaluation.moral_uniform}</td>
                              <td className="ptable-max">3</td>
                            </tr>
                            <tr>
                              <td>Good Deeds</td>
                              <td className="ptable-by">HOD</td>
                              <td className="ptable-score">{evaluation.moral_good_deeds}</td>
                              <td className="ptable-max">3</td>
                            </tr>

                            <tr className="tot-row">
                              <td colSpan={2}>Total</td>
                              <td className="ptable-score">{scores.total}</td>
                              <td className="ptable-max">100</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminEvaluationDashboard;
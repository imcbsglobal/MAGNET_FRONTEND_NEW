import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchTeachersEvaluationSummary, fetchTeacherHours, fetchTeachers } from '../../services/api';
import './Evaluations.scss';

const PrintIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"></polyline>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
    <rect x="6" y="14" width="12" height="8"></rect>
  </svg>
);

const currentMonth = new Date().toISOString().slice(0, 7);

const months = [];
const dd = new Date();
for (let i = 0; i < 12; i++) {
  const y = dd.getFullYear();
  const m = String(dd.getMonth() + 1).padStart(2, '0');
  months.push(`${y}-${m}`);
  dd.setMonth(dd.getMonth() - 1);
}

// Helper: calculate exam score per class
const calculateClassExamScore = (cls) => {
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

// Helper: calculate notebook score per class
const calculateClassNotebookScore = (cls) => {
  // Check both new check fields and old notebook_entry
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
  if (nbCheck1 && nbCheck2) base = 6;
  else if (nbCheck1 || nbCheck2) base = 3;
  else base = cls.notebook_entry || 0;

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

// Helper: calculate smart room score per class
const calculateClassSmartroomScore = (cls, config = { required_hours: 110, max_marks: 5 }) => {
  const smartPct = (cls.smartroom_hours || 0) / config.required_hours;
  const maxUsage = (config.max_marks * 3) / 5;
  const maxCreative = config.max_marks - maxUsage;
  const usage = smartPct >= 0.3 ? maxUsage : parseFloat((smartPct / 0.3 * maxUsage).toFixed(2));
  const totalContent = (cls.smartroom_ai || 0) + (cls.smartroom_youtube || 0) + (cls.smartroom_creative || 0);
  let creative = 0;
  if (totalContent > 0) {
    const crPct = (cls.smartroom_creative || 0) / totalContent;
    creative = crPct >= 0.7 ? maxCreative : parseFloat((crPct / 0.7 * maxCreative).toFixed(2));
  }
  return usage + creative;
};

const AdminEvaluationTeachers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [hoursConfigs, setHoursConfigs] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const institutionId = localStorage.getItem('institutionId');
  const tableRef = useRef(null);

  const handleDownloadPDF = async () => {
    if (!tableRef.current) return;
    
    try {
      // Capture the table with html2canvas
      const canvas = await html2canvas(tableRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      
      // Calculate dimensions - use landscape for wide table
      const imgWidth = 280;
      const pageHeight = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Create PDF in landscape mode
      const pdf = new jsPDF('l', 'mm', 'a4');
      
      // If image fits on first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, position, imgWidth, imgHeight);
      
      // If more than one page
      while (heightLeft > pageHeight) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download the PDF
      pdf.save(`teacher-evaluation-summary-${selectedMonth}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to download PDF. Please try again.');
    }
  };

  useEffect(() => {
    if (institutionId) loadData();
  }, [institutionId, selectedMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [res, hoursRes, teachersRes] = await Promise.all([
        fetchTeachersEvaluationSummary(institutionId, selectedMonth),
        fetchTeacherHours(institutionId),
        fetchTeachers(institutionId),
      ]);
      console.log('API Response:', res.data);
      setRows(res.data);
      setHoursConfigs(hoursRes.data);
      setTeachers(teachersRes.data);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    // Filter teacher IDs to only include those with job category "Teacher"
    const allTeacherIds = [...new Set(rows.map(r => r.teacher_id))];
    const filteredTeacherIds = allTeacherIds.filter(teacherId => {
      const fullTeacherData = teachers.find(t => t.id === teacherId);
      if (fullTeacherData) {
        return (fullTeacherData.job_category || '').toLowerCase() === 'teacher';
      }
      return true; // Fallback
    });
    
    const entered = rows.filter(r => r.student_class);
    const completed = rows.filter(r => r.is_completed);
    const monthFinished = rows.filter(r => r.is_month_finished);
    const filteredMonthFinished = monthFinished.filter(r => filteredTeacherIds.includes(r.teacher_id));
    
    return {
      totalTeachers: filteredTeacherIds.length,
      totalEntries: rows.length,
      enteredCount: entered.length,
      completedCount: completed.length,
      monthFinishedCount: [...new Set(filteredMonthFinished.map(r => r.teacher_id))].length,
    };
  }, [rows, teachers]);

  const grouped = useMemo(() => {
    const map = {};
    rows.forEach(r => {
      const key = r.teacher_id;
      if (!map[key]) {
        map[key] = {
          teacher_id: r.teacher_id,
          username: r.username,
          staff_id: r.staff_id,
          assigned_class: r.assigned_class,
          assigned_division: r.assigned_division,
          is_month_finished: r.is_month_finished,
          hod_entered: r.hod_entered,
          hod_remark: r.hod_remark || '',
          // HOD fields (teacher-level)
          lesson_plan_submitted: r.lesson_plan_submitted,
          lesson_plan_quality: r.lesson_plan_quality,
          subject_knowledge_1: r.subject_knowledge_1,
          subject_knowledge_2: r.subject_knowledge_2,
          subject_knowledge_3: r.subject_knowledge_3,
          subject_knowledge_4: r.subject_knowledge_4,
          subject_knowledge_5: r.subject_knowledge_5,
          classroom_management: r.classroom_management,
          activity_based_class: r.activity_based_class,
          training_total: r.training_total,
          training_attended: r.training_attended,
          english_classroom: r.english_classroom,
          english_informal: r.english_informal,
          english_fluency: r.english_fluency,
          cocurricular_extra: r.cocurricular_extra,
          cocurricular_reward: r.cocurricular_reward,
          moral_discipline: r.moral_discipline,
          moral_uniform: r.moral_uniform,
          moral_good_deeds: r.moral_good_deeds,
          classes: [],
        };
      }
      map[key].classes.push(r);
    });
    return Object.values(map).map(teacher => {
      // Get teacher's hours config
      const teacherHoursConfig = hoursConfigs.find(h => h.teacher_id === teacher.teacher_id) || { required_hours: 110, max_marks: 5 };
      
      // Calculate aggregated class-level data
      const classesWithData = teacher.classes.filter(c => c.student_class);
      
      // Aggregate student counts
      const totalExamExcellent = classesWithData.reduce((sum, c) => sum + (c.exam_excellent || 0), 0);
      const totalExamGood = classesWithData.reduce((sum, c) => sum + (c.exam_good || 0), 0);
      const totalExamAverage = classesWithData.reduce((sum, c) => sum + (c.exam_average || 0), 0);
      const totalExamBelowAverage = classesWithData.reduce((sum, c) => sum + (c.exam_below_average || 0), 0);
      
      const totalNotebookExcellent = classesWithData.reduce((sum, c) => sum + (c.notebook_excellent || 0), 0);
      const totalNotebookGood = classesWithData.reduce((sum, c) => sum + (c.notebook_good || 0), 0);
      const totalNotebookAverage = classesWithData.reduce((sum, c) => sum + (c.notebook_average || 0), 0);
      const totalNotebookBelowAverage = classesWithData.reduce((sum, c) => sum + (c.notebook_below_average || 0), 0);
      
      const totalSmartroomHours = classesWithData.reduce((sum, c) => sum + (c.smartroom_hours || 0), 0);
      const totalSmartroomAI = classesWithData.reduce((sum, c) => sum + (c.smartroom_ai || 0), 0);
      const totalSmartroomYT = classesWithData.reduce((sum, c) => sum + (c.smartroom_youtube || 0), 0);
      const totalSmartroomCreative = classesWithData.reduce((sum, c) => sum + (c.smartroom_creative || 0), 0);
      
      // Calculate average scores per class
      let avgExamScore = 0;
      let avgNotebookScore = 0;
      let avgSmartroomScore = 0;
      
      if (classesWithData.length > 0) {
        const totalExamScore = classesWithData.reduce((sum, c) => sum + calculateClassExamScore(c), 0);
        const totalNotebookScore = classesWithData.reduce((sum, c) => sum + calculateClassNotebookScore(c), 0);
        const totalSmartroomScore = classesWithData.reduce((sum, c) => sum + calculateClassSmartroomScore(c, teacherHoursConfig), 0);
        
        avgExamScore = totalExamScore / classesWithData.length;
        avgNotebookScore = totalNotebookScore / classesWithData.length;
        avgSmartroomScore = totalSmartroomScore / classesWithData.length;
      }
      
      // Calculate HOD scores
      const lessonPlanScore = (teacher.lesson_plan_submitted || 0) + (teacher.lesson_plan_quality || 0);
      const subjectKnowledgeScore = (teacher.subject_knowledge_1 || 0) + (teacher.subject_knowledge_2 || 0) + (teacher.subject_knowledge_3 || 0) + (teacher.subject_knowledge_4 || 0) + (teacher.subject_knowledge_5 || 0);
      const trainingScore = teacher.training_total > 0 ? Math.min((teacher.training_attended / teacher.training_total) * 5, 5) : 0;
      const englishScore = (teacher.english_classroom || 0) + (teacher.english_informal || 0) + (teacher.english_fluency || 0);
      const cocurricularScore = (teacher.cocurricular_extra || 0) + (teacher.cocurricular_reward || 0);
      const moralScore = (teacher.moral_discipline || 0) + (teacher.moral_uniform || 0) + (teacher.moral_good_deeds || 0);
      
      // Total scores
      const academicsScore = lessonPlanScore + subjectKnowledgeScore + (teacher.classroom_management || 0) + (teacher.activity_based_class || 0) + trainingScore + avgExamScore + avgNotebookScore + avgSmartroomScore;
      const totalScore = academicsScore + englishScore + cocurricularScore + moralScore;
      const percentage = Math.round((totalScore / 100) * 100);
      
      // Get grade and badge color
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
        ...teacher,
        classCount: classesWithData.length,
        completedClassCount: classesWithData.filter(c => c.is_completed).length,
        // Aggregated student counts
        totalExamExcellent,
        totalExamGood,
        totalExamAverage,
        totalExamBelowAverage,
        totalNotebookExcellent,
        totalNotebookGood,
        totalNotebookAverage,
        totalNotebookBelowAverage,
        totalSmartroomHours,
        totalSmartroomAI,
        totalSmartroomYT,
        totalSmartroomCreative,
        // Scores
        avgExamScore,
        avgNotebookScore,
        avgSmartroomScore,
        lessonPlanScore,
        subjectKnowledgeScore,
        trainingScore,
        englishScore,
        cocurricularScore,
        moralScore,
        academicsScore,
        totalScore,
        percentage,
        grade,
        gradeClass,
      };
    });
  }, [rows]);

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="admin" />
      <main className="dashboard-main">
        <Navbar placeholder="Search teacher evaluations..." />
        <div className="admins-page-container">
          <div className="evaluation-page">
            <header className="page-header">
              <div className="header-left">
                <h1>Teachers Evaluation Summary</h1>
                <p>Aggregated evaluation data per teacher for {selectedMonth}</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="save-btn" 
                  onClick={handleDownloadPDF} 
                  style={{ 
                    background: '#2563eb', 
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <PrintIcon />
                  Download PDF
                </button>
                <button className="save-btn" onClick={() => navigate('/admin/evaluations')} style={{ background: '#6b7280', fontSize: '14px' }}>
                  Back to Score View
                </button>
              </div>
            </header>

            <div className="pf-row" style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '15px', fontWeight: 600 }}>Select Month:</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ padding: '10px 16px', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '14px' }}>
                {months.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="loader">
                <div className="loading-spinner" style={{width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px'}}></div>
                <div>Loading evaluation data...</div>
              </div>
            ) : rows.length === 0 ? (
              <div className="form-card" style={{ textAlign: 'center', padding: '60px', color: '#6b7280', fontSize: '16px' }}>
                No evaluation data found for {selectedMonth}.
              </div>
            ) : (
              <>
                <div className="mrow" style={{ marginBottom: '24px' }}>
                  <div className="mc">
                    <div className="mv">{summary.totalTeachers}</div>
                    <div className="ml">Total Teachers</div>
                  </div>
                  <div className="mc">
                    <div className="mv">{summary.totalEntries}</div>
                    <div className="ml">Total Class Entries</div>
                  </div>
                  <div className="mc">
                    <div className="mv">{summary.completedCount}</div>
                    <div className="ml">Classes Completed</div>
                  </div>
                  <div className="mc">
                    <div className="mv">{summary.monthFinishedCount}</div>
                    <div className="ml">Months Finished</div>
                  </div>
                </div>

                <div className="tcard" ref={tableRef} id="evaluation-table">
                  <div style={{ overflowX: 'auto' }}>
                    <table className="ptable">
                      <thead>
                        <tr>
                          <th colSpan={22}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                              <div style={{ fontSize: '14px', fontWeight: 600 }}>Name of the HOD: {(() => {
                                // First try to find a HOD in teachers list
                                const hod = teachers.find(t => t.job_category?.toLowerCase() === 'hod');
                                if (hod) {
                                  return hod.name || hod.username;
                                }
                                // If no HOD, use logged-in admin username
                                return localStorage.getItem('username') || 'N/A';
                              })()}</div>
                              <div style={{ fontSize: '14px', fontWeight: 600 }}>Month: {selectedMonth}</div>
                            </div>
                          </th>
                        </tr>
                        <tr>
                          <th rowSpan={2}>Name of the Teacher</th>
                          <th colSpan={8} style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)' }}>Academics</th>
                          <th colSpan={3} style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}>English Communication</th>
                          <th colSpan={2} style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' }}>Co-curricular Activities</th>
                          <th colSpan={3} style={{ background: 'linear-gradient(135deg, #ffe4e6 0%, #ffcdd2 100%)' }}>Moral</th>
                          <th rowSpan={2}>Status</th>
                          <th rowSpan={2} style={{ minWidth: '150px' }}>HOD Remark</th>
                          <th rowSpan={2}>Total</th>
                          <th rowSpan={2}>Percentage</th>
                        </tr>
                        <tr>
                          {/* Academics sub-items */}
                          <th style={{ fontSize: '11px' }}>
                            <div>Lesson Plan</div>
                            <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: 'normal' }}>HOD</div>
                          </th>
                          <th style={{ fontSize: '11px' }}>
                            <div>Exam</div>
                            <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: 'normal' }}>Teacher</div>
                          </th>
                          <th style={{ fontSize: '11px' }}>
                            <div>Subject Knowledge</div>
                            <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: 'normal' }}>HOD</div>
                          </th>
                          <th style={{ fontSize: '11px' }}>
                            <div>Class Room Management</div>
                            <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: 'normal' }}>HOD</div>
                          </th>
                          <th style={{ fontSize: '11px' }}>
                            <div>Activity Based Class Room</div>
                            <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: 'normal' }}>HOD</div>
                          </th>
                          <th style={{ fontSize: '11px' }}>
                            <div>Note Book</div>
                            <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: 'normal' }}>Teacher</div>
                          </th>
                          <th style={{ fontSize: '11px' }}>
                            <div>Training</div>
                            <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: 'normal' }}>HOD</div>
                          </th>
                          <th style={{ fontSize: '11px' }}>
                            <div>Smart Room</div>
                            <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: 'normal' }}>Teacher</div>
                          </th>
                          
                          {/* English Communication sub-items */}
                          <th style={{ fontSize: '11px' }}>
                            <div>Class Room Communication</div>
                            <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: 'normal' }}>HOD</div>
                          </th>
                          <th style={{ fontSize: '11px' }}>
                            <div>Informal Communication</div>
                            <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: 'normal' }}>HOD</div>
                          </th>
                          <th style={{ fontSize: '11px' }}>
                            <div>Fluency in Language</div>
                            <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: 'normal' }}>HOD</div>
                          </th>
                          
                          {/* Co-curricular Activities sub-items */}
                          <th style={{ fontSize: '11px' }}>
                            <div>Extra Activity</div>
                            <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: 'normal' }}>HOD</div>
                          </th>
                          <th style={{ fontSize: '11px' }}>
                            <div>Reward</div>
                            <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: 'normal' }}>HOD</div>
                          </th>
                          
                          {/* Moral sub-items */}
                          <th style={{ fontSize: '11px' }}>
                            <div>Discipline of Children</div>
                            <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: 'normal' }}>HOD</div>
                          </th>
                          <th style={{ fontSize: '11px' }}>
                            <div>Uniform</div>
                            <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: 'normal' }}>HOD</div>
                          </th>
                          <th style={{ fontSize: '11px' }}>
                            <div>Good Deeds</div>
                            <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: 'normal' }}>HOD</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {grouped
                          // Filter only teachers with job category "Teacher" (case-insensitive)
                          .filter(teacher => {
                            // Find the teacher in the teachers array by teacher_id
                            const fullTeacherData = teachers.find(t => t.id === teacher.teacher_id);
                            // If we have teacher data, check job_category (case-insensitive)
                            if (fullTeacherData) {
                              return (fullTeacherData.job_category || '').toLowerCase() === 'teacher';
                            }
                            // Fallback: if no teacher data found, include (to avoid breaking)
                            return true;
                          })
                          .map((teacher, idx) => (
                          <tr key={teacher.teacher_id}>
                            <td style={{ fontWeight: 600 }}>
                              <div>{teacher.username}</div>
                              <div style={{ fontSize: '11px', color: '#6b7280' }}>ID: {teacher.staff_id}</div>
                            </td>
                            
                            {/* Academics */}
                            <td style={{ textAlign: 'center' }}>{teacher.lessonPlanScore.toFixed(1)}</td>
                            <td style={{ textAlign: 'center' }}>{teacher.avgExamScore.toFixed(1)}</td>
                            <td style={{ textAlign: 'center' }}>{teacher.subjectKnowledgeScore.toFixed(1)}</td>
                            <td style={{ textAlign: 'center' }}>{teacher.classroom_management || 0}</td>
                            <td style={{ textAlign: 'center' }}>{teacher.activity_based_class || 0}</td>
                            <td style={{ textAlign: 'center' }}>{teacher.avgNotebookScore.toFixed(1)}</td>
                            <td style={{ textAlign: 'center' }}>{teacher.trainingScore}</td>
                            <td style={{ textAlign: 'center' }}>{teacher.avgSmartroomScore.toFixed(1)}</td>
                            
                            {/* English Communication */}
                            <td style={{ textAlign: 'center' }}>{teacher.english_classroom || 0}</td>
                            <td style={{ textAlign: 'center' }}>{teacher.english_informal || 0}</td>
                            <td style={{ textAlign: 'center' }}>{teacher.english_fluency || 0}</td>
                            
                            {/* Co-curricular Activities */}
                            <td style={{ textAlign: 'center' }}>{teacher.cocurricular_extra || 0}</td>
                            <td style={{ textAlign: 'center' }}>{teacher.cocurricular_reward || 0}</td>
                            
                            {/* Moral */}
                            <td style={{ textAlign: 'center' }}>{teacher.moral_discipline || 0}</td>
                            <td style={{ textAlign: 'center' }}>{teacher.moral_uniform || 0}</td>
                            <td style={{ textAlign: 'center' }}>{teacher.moral_good_deeds || 0}</td>
                            
                            <td style={{ textAlign: 'center' }}>
                              <div>
                                <span className={`badge ${teacher.hod_entered ? 'bg-e' : 'bg-a'}`} style={{ fontSize: '10px', marginRight: '4px' }}>
                                  HOD: {teacher.hod_entered ? 'Yes' : 'No'}
                                </span>
                                <span className={`badge ${teacher.is_month_finished ? 'bg-e' : 'bg-a'}`} style={{ fontSize: '10px' }}>
                                  Month: {teacher.is_month_finished ? 'Done' : 'Open'}
                                </span>
                              </div>
                            </td>
                            
                            <td style={{ textAlign: 'center', fontSize: '12px', maxWidth: '160px', color: teacher.hod_remark ? '#4b5563' : '#d1d5db', fontStyle: teacher.hod_remark ? 'normal' : 'italic' }}>
                              {teacher.hod_remark || '—'}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '14px' }}>{teacher.totalScore.toFixed(1)}</td>
                            <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '14px' }}>{teacher.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminEvaluationTeachers;

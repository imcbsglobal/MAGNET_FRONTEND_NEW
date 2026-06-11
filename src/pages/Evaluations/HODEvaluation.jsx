import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { fetchTeachers, fetchTeacherMonthEvaluation, saveEvaluation } from '../../services/api';
import './Evaluations.scss';

const HODEvaluationDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
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
      const response = await fetchTeachers(institutionId);
      setTeachers(response.data);
    } catch (err) {
      console.error('Failed to load teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEvaluation = async () => {
    try {
      setLoading(true);
      const response = await fetchTeacherMonthEvaluation(selectedTeacherId, month);
      const data = response.data;
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
    return total;
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

  return (
    <div className="dashboard-wrapper">
      <Sidebar userType="staff" />
      <main className="dashboard-main">
        <Navbar placeholder="Search evaluation..." />
        <div className="admins-page-container">
          <header className="page-header">
            <div className="header-left">
              <h1>HOD Evaluation</h1>
              <p>Evaluate teachers</p>
            </div>
          </header>

          <div className="form-card">
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <div className="form-grid">
                  <div className="form-group">
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
                    <label>Month</label>
                    <input
                      type="month"
                      name="month"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {!selectedTeacherId ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                  Select a teacher to begin.
                </div>
              ) : loading ? (
                <div className="loader" style={{ padding: '40px' }}>Loading...</div>
              ) : (
                <>
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
                    <h3>Academics - Activity Based Classroom (Max 5)</h3>
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
                      <div className="rlabel">5 parameters - each scored 1</div>
                      <div className="fields">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className="fld">
                            <label>Param {i}</label>
                            <select
                              name={`training_${i}`}
                              value={formData[`training_${i}`]}
                              onChange={handleChange}
                            >
                              <option value={0}>No</option>
                              <option value={1}>Yes (1)</option>
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
                    {saved && <span className="saved-tag">Saved ✓</span>}
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HODEvaluationDashboard;

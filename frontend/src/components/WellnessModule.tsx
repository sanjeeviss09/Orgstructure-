import React, { useEffect, useState } from 'react';
import { 
  AuthUser, Employee, WellnessQuestionnaire, WellnessAssignment, 
  CounsellingSession, fetchQuestionnaires, 
  fetchAssignments, createQuestionnaire, createAssignment,
  submitWellnessResponse, fetchCounsellingSessions, 
  createCounsellingSession, sendCounsellingMessage,
  DailyFeedback, fetchDailyFeedbacks, submitDailyFeedback,
  resetDatabase, WellnessQuestion
} from '../lib/api';
import { 
  MessageSquare, ClipboardList, Send, ShieldAlert, 
  Star, Activity, FileText, Bell, CheckCircle, BarChart3, Edit3,
  Plus, Trash2, Users
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import type { Role } from '../App';

ChartJS.register(ArcElement, Tooltip, Legend);

interface WellnessModuleProps {
  activeRole: Role;
  loggedInUser: AuthUser;
  employees: Employee[];
}

export const WellnessModule: React.FC<WellnessModuleProps> = ({ activeRole, loggedInUser, employees }) => {
  const [questionnaires, setQuestionnaires] = useState<WellnessQuestionnaire[]>([]);
  const [assignments, setAssignments] = useState<WellnessAssignment[]>([]);
  const [sessions, setSessions] = useState<CounsellingSession[]>([]);
  const [dailyFeedbacks, setDailyFeedbacks] = useState<DailyFeedback[]>([]);
  
  const isAdmin = activeRole === 'Admin';
  const canManageSurveys = activeRole === 'HOD' || activeRole === 'Manager';
  
  const [activeTab, setActiveTab] = useState<'admin' | 'manage' | 'surveys' | 'counselling' | 'daily_feedback'>(
    isAdmin ? 'admin' : (canManageSurveys ? 'manage' : 'daily_feedback')
  );

  // ── Questionnaire builder state (Admin only) ──
  const [qTitle, setQTitle] = useState('');
  const [qDesc, setQDesc] = useState('');
  const [qType, setQType] = useState<'WELLNESS' | 'APTITUDE' | 'FEEDBACK' | 'GENERAL'>('WELLNESS');
  const [qQuestions, setQQuestions] = useState<WellnessQuestion[]>([
    { id: 'q1', type: 'RATING', text: '' }
  ]);
  const [qTargetRoles, setQTargetRoles] = useState<string[]>(['HOD', 'Manager', 'Employee']);
  const [qSaving, setQSaving] = useState(false);

  const ASSIGNABLE_ROLES = ['Admin', 'HOD', 'Manager', 'Employee', 'Intern'];
  
  const [counsellingInput, setCounsellingInput] = useState('');
  const [dfRating, setDfRating] = useState<number>(3);
  const [dfQueries, setDfQueries] = useState('');
  const [dfSuggestions, setDfSuggestions] = useState('');
  
  const [adminReplyText, setAdminReplyText] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const myEmpId = loggedInUser.employee_id || loggedInUser.id;

  useEffect(() => {
    fetchData();
  }, [activeRole]);

  const fetchData = async () => {
    try {
      const q = await fetchQuestionnaires();
      setQuestionnaires(q);
      const a = await fetchAssignments(!isAdmin ? myEmpId : undefined);
      setAssignments(a);
      const s = await fetchCounsellingSessions(!isAdmin ? myEmpId : undefined);
      setSessions(s);
      if (isAdmin) {
        const d = await fetchDailyFeedbacks();
        setDailyFeedbacks(d);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendCounselling = async () => {
    if (!counsellingInput.trim()) return;
    try {
      if (sessions.length === 0) {
        const s = await createCounsellingSession({ employee_id: myEmpId, topic: "General Stress" });
        await sendCounsellingMessage(s.id, counsellingInput, myEmpId);
      } else {
        await sendCounsellingMessage(sessions[0].id, counsellingInput, myEmpId);
      }
      setCounsellingInput('');
      fetchData();
    } catch (e) {
      alert('Failed to send message');
    }
  };

  const handleSubmitDailyFeedback = async () => {
    try {
      await submitDailyFeedback({
        employee_id: myEmpId,
        workload_rating: dfRating,
        office_environment_queries: dfQueries,
        suggestions: dfSuggestions
      });
      alert('Daily feedback submitted successfully!');
      setDfRating(3);
      setDfQueries('');
      setDfSuggestions('');
    } catch (e) {
      alert('Failed to submit daily feedback');
    }
  };

  const handleAdminReply = async (sessionId: string) => {
    if (!adminReplyText.trim()) return;
    try {
      await sendCounsellingMessage(sessionId, adminReplyText, myEmpId);
      setAdminReplyText('');
      fetchData();
    } catch(e) {
      alert('Failed to send reply');
    }
  };

  const handleResetData = async () => {
    if (!window.confirm("Are you sure you want to reset all application data to the original demo values? All custom modifications will be lost.")) return;
    try {
      await resetDatabase();
      alert("Database reset successfully!");
      window.location.reload();
    } catch (e) {
      alert("Failed to reset data");
    }
  };

  const renderAdmin = () => {
    const data = {
      labels: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor', 'Very Poor'],
      datasets: [
        {
          label: 'Feedback Ratings',
          data: [12, 19, 3, 5, 2, 3],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(153, 27, 27, 0.8)',
          ],
          borderWidth: 1,
        },
      ],
    };

    return (
      <div className="space-y-6 slide-up fade-in pb-10">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-purple-600" /> Executive Wellness Analytics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="glass-panel p-5">
            <h3 className="text-sm font-bold text-slate-500">Total Employees</h3>
            <div className="text-3xl font-black text-slate-900">{employees.length}</div>
          </div>
          <div className="glass-panel p-5">
            <h3 className="text-sm font-bold text-slate-500">Submission Rate</h3>
            <div className="text-3xl font-black text-emerald-600">84%</div>
          </div>
          <div className="glass-panel p-5">
            <h3 className="text-sm font-bold text-slate-500">Pending Questionnaires</h3>
            <div className="text-3xl font-black text-amber-600">{assignments.filter(a => a.status === 'PENDING').length}</div>
          </div>
          <div className="glass-panel p-5 bg-gradient-to-br from-blue-50 to-indigo-50">
            <h3 className="text-sm font-bold text-blue-600 flex items-center gap-1"><Bell className="w-4 h-4"/> Notify Pending</h3>
            <button className="mt-3 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm w-full hover:bg-blue-700 transition-colors" onClick={() => alert("Mock: Sending reminder emails to pending employees via SMTP...")}>
              Send Reminder
            </button>
          </div>
          <div className="glass-panel p-5 bg-gradient-to-br from-red-50 to-rose-50/50">
            <h3 className="text-sm font-bold text-red-600 flex items-center gap-1">Reset Database</h3>
            <button className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-755 text-white font-bold rounded-lg text-sm w-full transition-colors" onClick={handleResetData}>
              Reset Demo Data
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-slate-500" /> Organizational Satisfaction
            </h3>
            <div className="h-64 flex justify-center">
              <Pie data={data} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
          
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" /> Feedback Correction & Audit
            </h3>
            <p className="text-sm text-slate-500 mb-4">Manage submitted responses or allow resubmissions for employees.</p>
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/50 border border-slate-200 rounded-xl">
                  <div>
                    <div className="font-bold text-sm text-slate-800">Response ID: RES-{9000 + i}</div>
                    <div className="text-xs text-slate-500">Submitted by EMP-00{i}</div>
                  </div>
                  <button className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-md hover:bg-slate-200">Allow Resubmit</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Feedbacks List for Admin */}
        <div className="glass-panel p-6 mt-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-indigo-500" /> Employee Daily Feedback & Workload
          </h3>
          <div className="space-y-4">
            {dailyFeedbacks.map(f => {
              const emp = employees.find(e => e.id === f.employee_id);
              return (
                <div key={f.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="font-bold text-slate-800">{emp?.full_name || 'Unknown Employee'}</span>
                      <span className="text-xs text-slate-500 ml-2">{emp?.designation || ''}</span>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-500 shadow-sm">
                      {new Date(f.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <strong className="text-slate-500 block mb-1 text-xs uppercase">Workload Rating</strong>
                      <div className="flex items-center gap-1">
                        <Star className={`w-4 h-4 ${f.workload_rating >= 4 ? 'text-red-500' : 'text-amber-500'} fill-current`} />
                        <span className="font-bold">{f.workload_rating}/5</span>
                        <span className="text-slate-400 ml-1">({f.workload_rating === 1 ? 'Very Light' : f.workload_rating === 3 ? 'Manageable' : f.workload_rating === 5 ? 'Overwhelming' : 'Moderate'})</span>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <strong className="text-slate-500 block mb-1 text-xs uppercase">Environment Queries</strong>
                      <div className="text-slate-800">{f.office_environment_queries || '-'}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <strong className="text-slate-500 block mb-1 text-xs uppercase">Suggestions</strong>
                      <div className="text-slate-800">{f.suggestions || '-'}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {dailyFeedbacks.length === 0 && <p className="text-slate-500 text-sm italic">No daily feedback submitted yet.</p>}
          </div>
        </div>

        {/* Private Support Chat Management for Admin */}
        <div className="glass-panel p-0 mt-6 border-t-4 border-indigo-600 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
          
          {/* Left sidebar: list of sessions */}
          <div className="w-full md:w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col max-h-[600px]">
            <div className="p-5 border-b border-slate-200 bg-white">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" /> Admin Support Inbox
              </h3>
              <p className="text-xs text-slate-500 mt-1">Respond confidentially to employee support queries.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {sessions.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-400 italic">No active support sessions.</div>
              ) : (
                sessions.map(s => {
                  const emp = employees.find(e => e.id === s.employee_id);
                  const isSelected = selectedSessionId === s.id;
                  return (
                    <div 
                      key={s.id} 
                      onClick={() => setSelectedSessionId(s.id)} 
                      className={`p-4 border-b border-slate-200 cursor-pointer transition-colors ${isSelected ? 'bg-white border-l-4 border-l-indigo-600 shadow-sm' : 'hover:bg-white border-l-4 border-l-transparent'}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="font-bold text-slate-800 text-sm truncate">{emp?.full_name || 'Unknown'}</div>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full shrink-0">
                          {s.messages.length} msg
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate">{emp?.designation || ''}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right side: Chat box */}
          <div className="w-full md:w-2/3 flex flex-col bg-white max-h-[600px]">
            {selectedSessionId ? (
              (() => {
                const s = sessions.find(x => x.id === selectedSessionId);
                const emp = employees.find(e => e.id === s?.employee_id);
                if (!s) return null;
                
                return (
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white shrink-0">
                      <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold shrink-0">
                        {emp?.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{emp?.full_name || 'Unknown Employee'}</div>
                        <div className="text-xs text-slate-500">{emp?.designation || ''}</div>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
                      {s.messages.map((m, i) => (
                        <div key={i} className={`flex ${m.sender_id === s.employee_id ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.sender_id === s.employee_id ? 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm' : 'bg-indigo-600 text-white rounded-br-sm shadow-sm'}`}>
                            {m.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-white border-t border-slate-200 flex gap-2 shrink-0">
                      <input 
                        type="text" 
                        value={adminReplyText}
                        onChange={e => setAdminReplyText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdminReply(s.id)}
                        placeholder="Type a confidential reply..."
                        className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm"
                      />
                      <button onClick={() => handleAdminReply(s.id)} className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-750 transition-colors shadow-sm">
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 bg-slate-50/30">
                <MessageSquare className="w-16 h-16 text-slate-200 mb-4" />
                <p className="font-bold text-slate-600 text-lg">Select a conversation</p>
                <p className="text-sm mt-2 text-center max-w-xs">Click on an employee from the list to view their messages and reply privately.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleAddQuestion = () => {
    setQQuestions(prev => [
      ...prev,
      { id: `q${Date.now()}`, type: 'PARAGRAPH', text: '' }
    ]);
  };

  const handleRemoveQuestion = (id: string) => {
    setQQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleQuestionChange = (id: string, field: 'text' | 'type', value: string) => {
    setQQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const toggleTargetRole = (role: string) => {
    setQTargetRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSaveQuestionnaire = async () => {
    if (!qTitle.trim()) { alert('Please enter a title.'); return; }
    if (qQuestions.some(q => !q.text.trim())) { alert('Please fill in all question texts.'); return; }
    if (qTargetRoles.length === 0) { alert('Please select at least one target role.'); return; }
    setQSaving(true);
    try {
      const newQ = await createQuestionnaire({
        title: qTitle,
        description: qDesc,
        type: qType,
        created_by: myEmpId,
        status: 'ACTIVE',
        questions: qQuestions
      });
      // Assign to all employees whose dashboard_access is in qTargetRoles
      const targets = employees.filter(e => qTargetRoles.includes(e.dashboard_access));
      await Promise.all(targets.map(emp =>
        createAssignment({ questionnaire_id: newQ.id, employee_id: emp.id, assigned_by: myEmpId })
      ));
      alert(`✅ Questionnaire created and assigned to ${targets.length} employee(s) across roles: ${qTargetRoles.join(', ')}`);
      // Reset form
      setQTitle(''); setQDesc(''); setQType('WELLNESS');
      setQQuestions([{ id: 'q1', type: 'RATING', text: '' }]);
      setQTargetRoles(['HOD', 'Manager', 'Employee']);
      fetchData();
    } catch (e) {
      alert('Failed to create questionnaire. Please try again.');
    } finally {
      setQSaving(false);
    }
  };

  const renderManage = () => {
    return (
      <div className="space-y-6 slide-up fade-in pb-10">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-indigo-600" /> Create & Assign Questionnaire
        </h2>

        {/* ── Builder Card ── */}
        <div className="glass-panel p-6 space-y-5">
          <h3 className="text-lg font-bold text-slate-900">New Questionnaire</h3>

          {/* Title & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Title *</label>
              <input
                type="text"
                value={qTitle}
                onChange={e => setQTitle(e.target.value)}
                placeholder="e.g., Q3 Emotional Wellness Survey"
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Type</label>
              <select
                value={qType}
                onChange={e => setQType(e.target.value as any)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
              >
                <option value="WELLNESS">Wellness</option>
                <option value="FEEDBACK">Feedback</option>
                <option value="APTITUDE">Aptitude</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Description</label>
            <textarea
              value={qDesc}
              onChange={e => setQDesc(e.target.value)}
              placeholder="Brief description shown to the employee before they begin."
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm h-20 resize-none"
            />
          </div>

          {/* Target Roles */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Assign To Roles (Management excluded)
            </label>
            <div className="flex flex-wrap gap-2">
              {ASSIGNABLE_ROLES.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleTargetRole(role)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    qTargetRoles.includes(role)
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Will assign to <strong className="text-slate-700">{employees.filter(e => qTargetRoles.includes(e.dashboard_access)).length}</strong> employee(s)
            </p>
          </div>

          {/* Questions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Questions *</label>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Question
              </button>
            </div>
            {qQuestions.map((q, idx) => (
              <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Question {idx + 1}</span>
                  {qQuestions.length > 1 && (
                    <button
                      onClick={() => handleRemoveQuestion(q.id)}
                      className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={q.text}
                  onChange={e => handleQuestionChange(q.id, 'text', e.target.value)}
                  placeholder="e.g., How would you rate your workplace satisfaction?"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                />
                <select
                  value={q.type}
                  onChange={e => handleQuestionChange(q.id, 'type', e.target.value)}
                  className="p-2 border border-slate-200 rounded-lg text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-400 text-slate-600"
                >
                  <option value="RATING">⭐ Rating (1-5 Stars)</option>
                  <option value="PARAGRAPH">📝 Paragraph (Free text)</option>
                  <option value="MCQ_SINGLE">☑ Multiple Choice (Single)</option>
                </select>
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveQuestionnaire}
            disabled={qSaving}
            className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl shadow hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {qSaving ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Assigning…</>
            ) : (
              <><Send className="w-4 h-4" /> Create & Assign to {employees.filter(e => qTargetRoles.includes(e.dashboard_access)).length} Employee(s)</>
            )}
          </button>
        </div>

        {/* ── Existing Questionnaires ── */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" /> Existing Questionnaires
          </h3>
          {questionnaires.length === 0 ? (
            <p className="text-slate-500 text-sm italic">No questionnaires created yet.</p>
          ) : (
            <div className="space-y-3">
              {questionnaires.map(q => {
                const assigned = assignments.filter(a => a.questionnaire_id === q.id);
                const completed = assigned.filter(a => a.status === 'COMPLETED');
                return (
                  <div key={q.id} className="p-4 border border-slate-200 rounded-xl flex items-center justify-between bg-white/50 hover:bg-white transition-colors">
                    <div>
                      <div className="font-bold text-slate-800">{q.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {q.questions.length} questions · {q.type} ·
                        <span className="ml-1 text-emerald-600 font-bold">{completed.length}/{assigned.length} completed</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      q.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>{q.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSurveys = () => {
    return (
      <div className="space-y-6 slide-up fade-in">
        <div className="glass-panel p-6">
          <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-600" /> Assigned Questionnaires
          </h2>
          {assignments.filter(a => a.status === 'PENDING').length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <CheckCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-bold">You're all caught up!</p>
              <p className="text-sm mt-1">No pending questionnaires.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.filter(a => a.status === 'PENDING').map(a => {
                const q = questionnaires.find(x => x.id === a.questionnaire_id);
                if (!q) return null;
                return (
                  <div key={a.id} className="p-5 border border-slate-200 rounded-2xl bg-white/50 hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-black text-lg text-slate-800">{q.title}</div>
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg">PENDING</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">{q.description}</p>
                    
                    {/* Fake form submission logic for demo */}
                    <div className="p-4 bg-slate-50 rounded-xl space-y-4">
                      {q.questions.map(question => (
                        <div key={question.id}>
                          <div className="font-bold text-sm text-slate-800 mb-2">{question.text}</div>
                          {question.type === 'RATING' && (
                            <div className="flex gap-2">
                              {[1,2,3,4,5].map(star => <Star key={star} className="w-6 h-6 text-amber-400 cursor-pointer hover:scale-110 transition-transform" />)}
                            </div>
                          )}
                          {question.type === 'PARAGRAPH' && (
                            <textarea className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Type your answer here..."></textarea>
                          )}
                        </div>
                      ))}
                    </div>

                    <button className="mt-4 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-sm hover:bg-blue-700 w-full" onClick={async () => {
                      const res = await submitWellnessResponse({
                        assignment_id: a.id,
                        questionnaire_id: q.id,
                        employee_id: myEmpId,
                        answers: [{ question_id: q.questions[0].id, rating: 5, text_response: "Feeling great!" }]
                      });
                      alert(`Submitted! AI Feedback generated by Llama 3.1:\n\nConsolation: ${res.ai_consolation}\nSuggestion: ${res.ai_suggestion}`);
                      fetchData();
                    }}>Submit Answers Securely</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCounselling = () => {
    return (
      <div className="glass-panel p-6 border-t-4 border-indigo-600 slide-up fade-in">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-8 h-8 text-indigo-600 p-1.5 bg-indigo-50 rounded-full" />
          <div>
            <h2 className="text-xl font-black text-slate-900">Confidential Admin Support</h2>
            <p className="text-xs font-bold text-slate-500 mt-0.5">Securely message HR/Admins with your queries or concerns.</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col h-[400px]">
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {sessions.length === 0 ? (
              <div className="text-center text-slate-400 font-medium text-sm mt-10">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No active sessions. Start a conversation below.
              </div>
            ) : (
              sessions[0].messages.map((m, i) => (
                <div key={i} className={`flex ${m.sender_id === myEmpId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${m.sender_id === myEmpId ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                    {m.text}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
            <input 
              type="text" 
              placeholder="Type a message confidentially..." 
              value={counsellingInput}
              onChange={e => setCounsellingInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendCounselling()}
              className="flex-1 p-2.5 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent rounded-xl outline-none text-sm" 
            />
            <button className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors" onClick={handleSendCounselling}>
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDailyFeedback = () => {
    return (
      <div className="glass-panel p-6 border-t-4 border-indigo-500 slide-up fade-in">
        <div className="flex items-center gap-3 mb-6">
          <Edit3 className="w-8 h-8 text-indigo-500 p-1.5 bg-indigo-100 rounded-full" />
          <div>
            <h2 className="text-xl font-black text-slate-900">Daily Workload & Feedback</h2>
            <p className="text-xs font-bold text-slate-500 mt-0.5">Submit your day-to-day workload, environment queries, and suggestions.</p>
          </div>
        </div>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">How was your workload today?</label>
            <div className="flex flex-wrap items-center gap-4">
              {[1, 2, 3, 4, 5].map(rating => (
                <button 
                  key={rating}
                  onClick={() => setDfRating(rating)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all flex-1 min-w-[80px] ${dfRating === rating ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
                >
                  <Star className={`w-6 h-6 ${dfRating >= rating ? (rating >= 4 ? 'text-red-500' : 'text-amber-500') : 'text-slate-300'} fill-current`} />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center leading-tight">
                    {rating === 1 && 'Very Light'}
                    {rating === 2 && 'Light'}
                    {rating === 3 && 'Manageable'}
                    {rating === 4 && 'Heavy'}
                    {rating === 5 && 'Overwhelming'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Queries or improvements needed in the office environment?</label>
            <textarea 
              value={dfQueries}
              onChange={e => setDfQueries(e.target.value)}
              placeholder="e.g., AC is not working well in Zone A, need better chairs, etc."
              className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm h-24 resize-none"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">General Suggestions / Feedback</label>
            <textarea 
              value={dfSuggestions}
              onChange={e => setDfSuggestions(e.target.value)}
              placeholder="Any other feedback or suggestions for management?"
              className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm h-24 resize-none"
            ></textarea>
          </div>

          <button 
            onClick={handleSubmitDailyFeedback}
            className="w-full py-3.5 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
          >
            Submit Feedback Securely
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Dynamic Tabs */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {isAdmin && (
          <button onClick={() => setActiveTab('admin')} className={`px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'admin' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
            <Activity className="w-4 h-4 inline mr-2"/> Analytics & Feedback Dashboard
          </button>
        )}

        {/* Admin can create & assign questionnaires; HOD/Manager can also manage */}
        {(isAdmin || canManageSurveys) && (
          <button onClick={() => setActiveTab('manage')} className={`px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'manage' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
            <ClipboardList className="w-4 h-4 inline mr-2"/> Questionnaires
          </button>
        )}

        {/* Everyone gets to submit daily feedback, take surveys, and do counselling */}
        <button onClick={() => setActiveTab('daily_feedback')} className={`px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'daily_feedback' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
          <Edit3 className="w-4 h-4 inline mr-2"/> Daily Feedback
        </button>

        <button onClick={() => setActiveTab('surveys')} className={`px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'surveys' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
          <FileText className="w-4 h-4 inline mr-2"/> My Surveys
        </button>
        
        <button onClick={() => setActiveTab('counselling')} className={`px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'counselling' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
          <MessageSquare className="w-4 h-4 inline mr-2"/> Admin Support
        </button>
      </div>

      {/* Render Active View */}
      {activeTab === 'admin' && isAdmin && renderAdmin()}
      {activeTab === 'manage' && (isAdmin || canManageSurveys) && renderManage()}
      {activeTab === 'surveys' && renderSurveys()}
      {activeTab === 'counselling' && renderCounselling()}
      {activeTab === 'daily_feedback' && renderDailyFeedback()}
    </div>
  );
};

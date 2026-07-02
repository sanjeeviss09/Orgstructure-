import React, { useState, useEffect } from 'react';
import { fetchCandidates, updateCandidateStatus, Candidate, CandidateStatus, submitPreScreening, submitHRApproval, deleteCandidate, scheduleInterview, fetchRequisitions, JobRequisition, submitCandidateApplication, submitCandidateAIUpload, updateCandidateDetails } from '../lib/recruitment_api';
import { Mail, Phone, Calendar, UserPlus, XCircle, Trash2, Video, MapPin, UploadCloud, Download, Bot, Edit2 } from 'lucide-react';



export const CandidatePipeline: React.FC<{ activeRole: string }> = ({ activeRole }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showPreScreenModal, setShowPreScreenModal] = useState(false);
  const [preScreenData, setPreScreenData] = useState<any>({});
  
  // Scheduling state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingCandidate, setSchedulingCandidate] = useState<Candidate | null>(null);
  const [scheduleData, setScheduleData] = useState<any>({
    type: 'Online',
    platform: 'MS Teams',
    date: '',
    time: '',
    venue_or_link: ''
  });

  // Manual Add state
  const [showManualAddModal, setShowManualAddModal] = useState(false);
  const [requisitions, setRequisitions] = useState<JobRequisition[]>([]);
  const [manualData, setManualData] = useState({
    requisition_id: '',
    first_name: '',
    last_name: '',
    email: '',
    mobile_number: '',
    location: '',
    total_experience: '',
    current_ctc: '',
    expected_ctc: '',
    notice_period: '',
    current_company: ''
  });
  const [manualResume, setManualResume] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Upload State
  const [showAIUploadModal, setShowAIUploadModal] = useState(false);
  const [aiRequisitionId, setAiRequisitionId] = useState('');
  const [aiResume, setAiResume] = useState<File | null>(null);
  const [isAIUploading, setIsAIUploading] = useState(false);

  // Edit Compensation State
  const [showEditCompModal, setShowEditCompModal] = useState(false);
  const [editCompCandidate, setEditCompCandidate] = useState<Candidate | null>(null);
  const [editCompData, setEditCompData] = useState({
    current_ctc: '',
    expected_ctc: '',
    notice_period: ''
  });

  const handleEditCompSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCompCandidate) return;
    try {
      const updated = await updateCandidateDetails(editCompCandidate.id, {
        current_ctc: editCompData.current_ctc ? Number(editCompData.current_ctc) : 0,
        expected_ctc: editCompData.expected_ctc ? Number(editCompData.expected_ctc) : 0,
        notice_period: editCompData.notice_period
      });
      setCandidates(candidates.map(c => c.id === updated.id ? updated : c));
      setShowEditCompModal(false);
      setEditCompCandidate(null);
    } catch (error) {
      alert('Failed to update compensation details');
    }
  };

  const exportPipelineToCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Location', 'Designation', 'Company', 'Experience', 'CTC', 'Expected CTC', 'Notice Period', 'Status', 'Applied At'];
    const rows = candidates.map(c => [
      c.id, `${c.first_name} ${c.last_name}`, c.email, c.mobile_number, c.location,
      c.current_designation, c.current_company, c.total_experience, c.current_ctc, c.expected_ctc, c.notice_period,
      c.status, new Date(c.applied_at || Date.now()).toLocaleDateString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `candidate_pipeline_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAIUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiResume || !aiRequisitionId) return alert('Resume and Requisition are required.');
    setIsAIUploading(true);
    try {
      const data = new FormData();
      data.append('requisition_id', aiRequisitionId);
      data.append('resume', aiResume);
      
      await submitCandidateAIUpload(data);
      setShowAIUploadModal(false);
      setAiRequisitionId('');
      setAiResume(null);
      loadData();
      alert('Candidate successfully added and shortlisted via AI!');
    } catch (err: any) {
      alert(err.message || 'Failed to process resume');
    } finally {
      setIsAIUploading(false);
    }
  };

  const loadData = () => {
    fetchCandidates().then(setCandidates);
    fetchRequisitions().then(setRequisitions);
  };
  useEffect(() => { loadData(); }, []);

  const moveCandidate = async (id: string, newStatus: CandidateStatus) => {
    await updateCandidateStatus(id, newStatus);
    loadData();
  };

  const handlePreScreenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCandidate) {
      await submitPreScreening(selectedCandidate.id, preScreenData);
      setShowPreScreenModal(false);
      setSelectedCandidate(null);
      loadData();
    }
  };

  const handleHRAction = async (id: string, action: string) => {
    await submitHRApproval(id, action);
    loadData();
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (schedulingCandidate) {
      await submitHRApproval(schedulingCandidate.id, 'Approve');
      await scheduleInterview({
        candidate_id: schedulingCandidate.id,
        type: scheduleData.type,
        platform: scheduleData.type === 'Online' ? scheduleData.platform : undefined,
        date: scheduleData.date,
        time: scheduleData.time,
        venue_or_link: scheduleData.venue_or_link,
        interview_panel: [],
        notes: ''
      });
      setShowScheduleModal(false);
      setSchedulingCandidate(null);
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this candidate application?')) {
      await deleteCandidate(id);
      loadData();
    }
  };

  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(manualData).forEach(key => data.append(key, (manualData as any)[key]));
      if (manualResume) data.append('resume', manualResume);
      
      await submitCandidateApplication(data);
      setShowManualAddModal(false);
      setManualData({
        requisition_id: '', first_name: '', last_name: '', email: '', mobile_number: '',
        location: '', total_experience: '', current_ctc: '', expected_ctc: '', notice_period: '', current_company: ''
      });
      setManualResume(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add candidate');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col h-[75vh]">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h2 className="text-xl font-black text-slate-900">Candidate Pipeline</h2>
        <div className="flex gap-3">
          <button onClick={exportPipelineToCSV} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          {(activeRole === 'Admin' || activeRole === 'HR Head' || activeRole === 'Recruiter') && (
            <>
              <button
                onClick={() => setShowAIUploadModal(true)}
                className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Bot className="w-4 h-4" /> AI Resume Upload
              </button>
              <button
                onClick={() => setShowManualAddModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <UserPlus className="w-4 h-4" /> Add Candidate
              </button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar -mx-2 px-2">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-slate-200">
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Profile</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Professional Info</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Compensation</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map(cand => (
              <tr key={cand.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-4 min-w-[200px] align-top">
                  <div className="font-bold text-slate-900 text-sm">{cand.first_name} {cand.last_name}</div>
                  <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-1.5"><Mail className="w-3.5 h-3.5 text-slate-400"/> {cand.email}</div>
                  <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5"><Phone className="w-3.5 h-3.5 text-slate-400"/> {cand.mobile_number}</div>
                  <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5"><MapPin className="w-3.5 h-3.5 text-slate-400"/> {cand.location}</div>
                </td>
                <td className="py-4 px-4 min-w-[220px] align-top">
                  <div className="text-xs font-semibold text-slate-800">{cand.current_designation || 'N/A'}</div>
                  <div className="text-[11px] text-slate-500 font-medium">At: {cand.current_company || 'N/A'}</div>
                  <div className="text-[11px] text-slate-600 mt-1.5 flex flex-col gap-0.5">
                    {(cand as any).highest_qualification && <div>Edu: <span className="font-semibold text-slate-800">{(cand as any).highest_qualification}</span></div>}
                    <div>Total Exp: <span className="font-semibold text-slate-800">{cand.total_experience || '0'}</span></div>
                    {cand.relevant_experience && <div>Relevant: <span className="font-semibold text-slate-800">{cand.relevant_experience}</span></div>}
                  </div>
                </td>
                <td className="py-4 px-4 min-w-[220px] align-top relative group">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { 
                      setEditCompCandidate(cand); 
                      setEditCompData({ current_ctc: String(cand.current_ctc || ''), expected_ctc: String(cand.expected_ctc || ''), notice_period: cand.notice_period || '' }); 
                      setShowEditCompModal(true); 
                    }} className="p-1.5 bg-white hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-md border border-slate-200 shadow-sm transition-colors" title="Edit Compensation">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-600 flex flex-col gap-0.5">
                    <div>C. CTC: <span className="font-semibold text-slate-800">₹{cand.current_ctc || 0}</span></div>
                    <div>E. CTC: <span className="font-semibold text-slate-800">₹{cand.expected_ctc || 0}</span></div>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1.5 flex items-center gap-1.5"><Calendar className="w-3 h-3 text-slate-400"/> NP: <span className="font-semibold text-slate-800">{cand.notice_period || 'N/A'}</span></div>
                  {cand.reason_for_change && <div className="text-[10px] text-slate-500 mt-1.5 italic leading-tight line-clamp-2" title={cand.reason_for_change}>"{cand.reason_for_change}"</div>}
                </td>
                <td className="py-4 px-4 min-w-[140px] align-top">
                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border inline-block ${
                    cand.status === 'Applied' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    cand.status === 'Selected' || cand.status === 'Joining' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    cand.status === 'Interview Completed' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {cand.status}
                  </span>
                  {(() => {
                    const suitability = ((cand.qualification_match || 0) + (cand.experience_match || 0) + (cand.industry_relevance || 0) + (cand.technical_fit || 0) + (cand.communication_skills || 0)) * 2;
                    if (suitability > 0) {
                      const color = suitability >= 80 ? 'text-emerald-600 bg-emerald-50' : suitability >= 60 ? 'text-amber-600 bg-amber-50' : 'text-rose-600 bg-rose-50';
                      const breakdown = `Qualification: ${cand.qualification_match || 0}/10\nExperience: ${cand.experience_match || 0}/10\nIndustry: ${cand.industry_relevance || 0}/10\nTechnical: ${cand.technical_fit || 0}/10\nCommunication: ${cand.communication_skills || 0}/10`;
                      return (
                        <div title={breakdown} className={`mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold border border-transparent cursor-help ${color}`}>
                          Suitability: {suitability}%
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <div className="text-[10px] font-medium text-slate-400 mt-2">
                    Applied: {new Date(cand.applied_at || Date.now()).toLocaleDateString()}
                  </div>
                </td>
                <td className="py-4 px-4 text-right align-top">
                  <div className="flex items-center justify-end gap-2">
                    {cand.status === 'Applied' && (activeRole === 'Admin' || activeRole === 'Recruiter') && (
                      <button onClick={() => { setSelectedCandidate(cand); setShowPreScreenModal(true); }} className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                        Pre-Screen
                      </button>
                    )}
                    {cand.status === 'HR Review' && (activeRole === 'Admin' || activeRole === 'HR Head') && (
                      <>
                        <button onClick={() => { setSchedulingCandidate(cand); setShowScheduleModal(true); }} className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">Approve</button>
                        <button onClick={() => handleHRAction(cand.id, 'Reject')} className="bg-rose-50 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors">Reject</button>
                      </>
                    )}
                    {cand.status === 'Interview Scheduling' && (
                      <button onClick={() => moveCandidate(cand.id, 'Interview Completed')} className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                        Mark Interviewed
                      </button>
                    )}
                    {cand.status === 'Interview Completed' && (
                      <button onClick={() => moveCandidate(cand.id, 'Selected')} className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
                        Select
                      </button>
                    )}
                    {cand.status === 'Selected' && (
                      <button onClick={() => moveCandidate(cand.id, 'Offer Approval')} className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                        Create Offer
                      </button>
                    )}
                    {cand.status === 'Offer Released' && (
                      <button onClick={() => moveCandidate(cand.id, 'Joining')} className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
                        Accept & Join
                      </button>
                    )}
                    {(activeRole === 'Admin' || activeRole === 'HR Head' || activeRole === 'Recruiter') && (
                      <>
                        {cand.resume_url && (
                          <a href={cand.resume_url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors ml-1" title="Download Resume">
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => handleDelete(cand.id)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors ml-1" title="Delete Candidate">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {candidates.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-400 font-medium italic">
                  No candidates found in the pipeline.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showPreScreenModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col pop-in" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            
            {/* ─ Header ─ */}
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">Pre-Screening Evaluation</h3>
                <button type="button" onClick={() => setShowPreScreenModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors text-lg font-bold leading-none">✕</button>
              </div>
              {/* Candidate summary strip */}
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-slate-600">
                <span><strong className="text-slate-800">{selectedCandidate.first_name} {selectedCandidate.last_name}</strong></span>
                <span className="text-right text-slate-500 italic">"{selectedCandidate.reason_for_change || 'N/A'}"</span>
                <span><strong>Exp:</strong> {selectedCandidate.total_experience} &nbsp;|&nbsp; <strong>Location:</strong> {selectedCandidate.location}</span>
                <span className="text-right"><strong>CCTC:</strong> ₹{selectedCandidate.current_ctc} &nbsp;|&nbsp; <strong>ECTC:</strong> ₹{selectedCandidate.expected_ctc}</span>
              </div>
            </div>

            {/* ─ Form (scrollable) ─ */}
            <form onSubmit={handlePreScreenSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto custom-scrollbar px-5 py-4 flex-1">

                {/* Scoring grid — 3 columns for compactness */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { key: 'qualification_match', label: 'Qualification' },
                    { key: 'experience_match',    label: 'Experience' },
                    { key: 'industry_relevance',  label: 'Industry' },
                    { key: 'technical_fit',       label: 'Technical Fit' },
                    { key: 'communication_skills',label: 'Communication' },
                    { key: 'salary_alignment',    label: 'Salary Alignment' },
                  ].map(item => (
                    <div key={item.key}>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label} <span className="text-slate-300">(1-10)</span></label>
                      <input
                        type="number" min="1" max="10" required
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 outline-none transition-all"
                        onChange={e => setPreScreenData({...preScreenData, [item.key]: Number(e.target.value)})}
                      />
                    </div>
                  ))}
                </div>

                {/* Recommendation */}
                <div className="mb-3">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Recommendation</label>
                  <select required className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm focus:border-indigo-400 outline-none"
                    onChange={e => setPreScreenData({...preScreenData, recruiter_recommendation: e.target.value})}>
                    <option value="">Select...</option>
                    <option>Shortlist</option>
                    <option>Hold</option>
                    <option>Reject</option>
                  </select>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Remarks</label>
                  <textarea rows={2} required className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm resize-none focus:border-indigo-400 outline-none"
                    onChange={e => setPreScreenData({...preScreenData, recruiter_remarks: e.target.value})} />
                </div>
              </div>

              {/* ─ Footer (pinned) ─ */}
              <div className="px-5 py-3 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setShowPreScreenModal(false)} className="px-4 py-1.5 rounded-lg text-slate-600 text-sm font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-1.5 rounded-lg text-sm font-bold transition-colors">Submit Evaluation</button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ── INTERVIEW SCHEDULING MODAL ── */}
      {showScheduleModal && schedulingCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  Schedule Interview
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  For {schedulingCandidate.first_name} {schedulingCandidate.last_name}
                </p>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleScheduleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Interview Mode</label>
                    <select required className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 outline-none"
                      value={scheduleData.type} onChange={e => setScheduleData({...scheduleData, type: e.target.value})}>
                      <option value="Online">Online</option>
                      <option value="Face-to-Face">Face-to-Face</option>
                    </select>
                  </div>
                  
                  {scheduleData.type === 'Online' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Platform</label>
                      <select required className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 outline-none"
                        value={scheduleData.platform} onChange={e => setScheduleData({...scheduleData, platform: e.target.value})}>
                        <option value="MS Teams">MS Teams</option>
                        <option value="Zoom">Zoom</option>
                        <option value="Google Meet">Google Meet</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</label>
                    <input type="date" required className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 outline-none"
                      value={scheduleData.date} onChange={e => setScheduleData({...scheduleData, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Time</label>
                    <input type="time" required className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 outline-none"
                      value={scheduleData.time} onChange={e => setScheduleData({...scheduleData, time: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    {scheduleData.type === 'Online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                    {scheduleData.type === 'Online' ? 'Meeting Link (Optional)' : 'Venue'}
                  </label>
                  <input type="text" placeholder={scheduleData.type === 'Online' && scheduleData.platform === 'MS Teams' ? 'Leave blank to auto-generate MS Teams link' : 'Enter link or physical address'} 
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 outline-none"
                    value={scheduleData.venue_or_link} onChange={e => setScheduleData({...scheduleData, venue_or_link: e.target.value})} />
                </div>

              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="px-4 py-1.5 rounded-lg text-slate-600 text-sm font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-1.5 rounded-lg text-sm font-bold transition-colors">Approve & Schedule</button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ── MANUAL ADD CANDIDATE MODAL ── */}
      {showManualAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-500" /> Manually Add Candidate
              </h3>
              <button onClick={() => setShowManualAddModal(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleManualAddSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Requisition *</label>
                  <select required className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 outline-none"
                    value={manualData.requisition_id} onChange={e => setManualData({...manualData, requisition_id: e.target.value})}>
                    <option value="">Select Requisition...</option>
                    {requisitions.filter(r => r.status === 'Approved').map(r => (
                      <option key={r.id} value={r.id}>{r.position_title} ({r.department})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">First Name *</label>
                    <input type="text" required className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 outline-none"
                      value={manualData.first_name} onChange={e => setManualData({...manualData, first_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Name *</label>
                    <input type="text" required className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 outline-none"
                      value={manualData.last_name} onChange={e => setManualData({...manualData, last_name: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email *</label>
                    <input type="email" required className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 outline-none"
                      value={manualData.email} onChange={e => setManualData({...manualData, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile Number *</label>
                    <input type="text" required className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 outline-none"
                      value={manualData.mobile_number} onChange={e => setManualData({...manualData, mobile_number: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Previous Org *</label>
                    <input type="text" required className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 outline-none"
                      value={manualData.current_company} onChange={e => setManualData({...manualData, current_company: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Exp (Yrs) *</label>
                    <input type="text" required className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 outline-none"
                      value={manualData.total_experience} onChange={e => setManualData({...manualData, total_experience: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notice Period *</label>
                    <input type="text" required className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 outline-none"
                      value={manualData.notice_period} onChange={e => setManualData({...manualData, notice_period: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location *</label>
                    <input type="text" required className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 outline-none"
                      value={manualData.location} onChange={e => setManualData({...manualData, location: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current CTC *</label>
                    <input type="number" required className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 outline-none"
                      value={manualData.current_ctc} onChange={e => setManualData({...manualData, current_ctc: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expected CTC *</label>
                    <input type="number" required className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 outline-none"
                      value={manualData.expected_ctc} onChange={e => setManualData({...manualData, expected_ctc: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Resume Upload *</label>
                  <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm font-medium text-slate-700 w-full border-dashed">
                    <UploadCloud className="w-5 h-5 text-slate-400" />
                    {manualResume ? manualResume.name : 'Click to select resume file (PDF/Word)'}
                    <input type="file" required className="hidden" onChange={e => { if (e.target.files) setManualResume(e.target.files[0]) }} accept=".pdf,.doc,.docx" />
                  </label>
                </div>
              </div>
              
              <div className="px-5 py-3 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setShowManualAddModal(false)} className="px-4 py-2 rounded-xl text-slate-600 text-sm font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? 'Uploading...' : 'Upload & Add Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── AI RESUME UPLOAD MODAL ── */}
      {showAIUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-purple-50/50">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-600" /> AI Resume Auto-Fill
              </h3>
              <button onClick={() => setShowAIUploadModal(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAIUploadSubmit} className="flex flex-col p-5 space-y-4">
              <p className="text-sm text-slate-600 mb-2">Upload a resume and our AI will automatically extract details, score suitability, and shortlist the candidate.</p>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Requisition *</label>
                <select required className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-purple-400 outline-none"
                  value={aiRequisitionId} onChange={e => setAiRequisitionId(e.target.value)}>
                  <option value="">Select Requisition...</option>
                  {requisitions.filter(r => r.status === 'Approved').map(r => (
                    <option key={r.id} value={r.id}>{r.position_title} ({r.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Resume Upload (PDF) *</label>
                <label className={`cursor-pointer border-2 border-dashed px-4 py-6 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors text-sm font-medium w-full ${aiResume ? 'bg-purple-50 border-purple-300 text-purple-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500'}`}>
                  <UploadCloud className="w-8 h-8 opacity-50" />
                  {aiResume ? aiResume.name : 'Click to select resume PDF'}
                  <input type="file" required className="hidden" onChange={e => { if (e.target.files) setAiResume(e.target.files[0]) }} accept=".pdf" />
                </label>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAIUploadModal(false)} className="px-4 py-2 rounded-xl text-slate-600 text-sm font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" disabled={isAIUploading} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2">
                  {isAIUploading ? 'Analyzing Resume...' : 'Analyze & Shortlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT COMPENSATION MODAL ── */}
      {showEditCompModal && editCompCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col pop-in">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-500" /> Edit Compensation
              </h3>
              <button onClick={() => setShowEditCompModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditCompSubmit} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current CTC (₹)</label>
                <input type="number" required className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 outline-none"
                  value={editCompData.current_ctc} onChange={e => setEditCompData({...editCompData, current_ctc: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expected CTC (₹)</label>
                <input type="number" required className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 outline-none"
                  value={editCompData.expected_ctc} onChange={e => setEditCompData({...editCompData, expected_ctc: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notice Period</label>
                <input type="text" placeholder="e.g. 30 Days, Immediate" required className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 outline-none"
                  value={editCompData.notice_period} onChange={e => setEditCompData({...editCompData, notice_period: e.target.value})} />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowEditCompModal(false)} className="flex-1 py-2 rounded-xl text-slate-600 text-sm font-bold bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-xl text-white text-sm font-bold bg-indigo-600 hover:bg-indigo-700 transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

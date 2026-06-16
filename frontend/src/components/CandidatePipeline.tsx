import React, { useState, useEffect } from 'react';
import { fetchCandidates, updateCandidateStatus, Candidate, CandidateStatus, submitPreScreening, submitHRApproval, deleteCandidate, scheduleInterview } from '../lib/recruitment_api';
import { Mail, Phone, Calendar, UserPlus, XCircle, Trash2, Video, MapPin } from 'lucide-react';

const PIPELINE_STAGES: CandidateStatus[] = [
  'Applied', 'Pre-Screening', 'HR Review', 'Interview Scheduling', 
  'Interview Completed', 'Selected', 'Offer Approval', 'Offer Released', 'Joining'
];

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

  const loadData = () => fetchCandidates().then(setCandidates);
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

  return (
    <div className="flex flex-col h-[75vh]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-slate-900">Candidate Pipeline</h2>
        {(activeRole === 'Admin' || activeRole === 'HR Head' || activeRole === 'Recruiter') && (
          <button
            onClick={() => { /* setShowManualAddModal(true) to be implemented */ }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Add Candidate
          </button>
        )}
      </div>
      <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar flex-1 items-start">
        {PIPELINE_STAGES.map(stage => (
          <div key={stage} className="w-80 shrink-0 flex flex-col bg-slate-50/50 border border-slate-200 rounded-3xl p-4 max-h-full">
            <h3 className="font-black text-slate-800 mb-3 px-2 flex justify-between">
              {stage} 
              <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold shadow-sm border border-slate-100 text-slate-500">
                {candidates.filter(c => c.status === stage).length}
              </span>
            </h3>
            
            <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1 px-1">
              {candidates.filter(c => c.status === stage).map(cand => (
                <div key={cand.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-grab">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <div className="font-bold text-slate-900 leading-tight">{cand.first_name} {cand.last_name}</div>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1"><Mail className="w-3 h-3"/> {cand.email}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-3"><Phone className="w-3 h-3"/> {cand.mobile_number}</div>
                  
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                    {stage === 'Applied' && (activeRole === 'Admin' || activeRole === 'Recruiter') && (
                      <button onClick={() => { setSelectedCandidate(cand); setShowPreScreenModal(true); }} className="w-full bg-indigo-50 text-indigo-700 text-xs font-bold py-1.5 rounded-lg hover:bg-indigo-100">
                        Start Pre-Screening
                      </button>
                    )}
                    {stage === 'HR Review' && (activeRole === 'Admin' || activeRole === 'HR Head') && (
                      <div className="flex w-full gap-2">
                        <button onClick={() => { setSchedulingCandidate(cand); setShowScheduleModal(true); }} className="flex-1 bg-emerald-50 text-emerald-700 text-xs font-bold py-1.5 rounded-lg hover:bg-emerald-100">Approve</button>
                        <button onClick={() => handleHRAction(cand.id, 'Reject')} className="flex-1 bg-rose-50 text-rose-700 text-xs font-bold py-1.5 rounded-lg hover:bg-rose-100">Reject</button>
                      </div>
                    )}
                    {stage === 'Interview Scheduling' && (
                      <button onClick={() => moveCandidate(cand.id, 'Interview Completed')} className="w-full bg-indigo-50 text-indigo-700 text-xs font-bold py-1.5 rounded-lg hover:bg-indigo-100">
                        Mark Interviewed
                      </button>
                    )}
                    {stage === 'Interview Completed' && (
                      <button onClick={() => moveCandidate(cand.id, 'Selected')} className="w-full bg-emerald-50 text-emerald-700 text-xs font-bold py-1.5 rounded-lg hover:bg-emerald-100">
                        Select Candidate
                      </button>
                    )}
                    {stage === 'Selected' && (
                      <button onClick={() => moveCandidate(cand.id, 'Offer Approval')} className="w-full bg-indigo-50 text-indigo-700 text-xs font-bold py-1.5 rounded-lg hover:bg-indigo-100">
                        Create Offer
                      </button>
                    )}
                    {stage === 'Offer Released' && (
                      <button onClick={() => moveCandidate(cand.id, 'Joining')} className="w-full bg-emerald-50 text-emerald-700 text-xs font-bold py-1.5 rounded-lg hover:bg-emerald-100">
                        Accept & Join
                      </button>
                    )}
                    {(activeRole === 'Admin' || activeRole === 'HR Head' || activeRole === 'Recruiter') && (
                      <button onClick={() => handleDelete(cand.id)} className="w-full bg-rose-50 text-rose-700 text-xs font-bold py-1.5 rounded-lg hover:bg-rose-100 flex items-center justify-center gap-1.5 mt-1">
                        <Trash2 className="w-3.5 h-3.5" /> Delete Application
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {candidates.filter(c => c.status === stage).length === 0 && (
                <div className="text-xs text-center text-slate-400 py-4 font-medium italic">No candidates</div>
              )}
            </div>
          </div>
        ))}
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

    </div>
  );
};

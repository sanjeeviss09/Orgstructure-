import React, { useState, useEffect } from 'react';
import { fetchCandidates, fetchInterviews, scheduleInterview, submitInterviewEvaluation, fetchOffers, createOffer, sendOfferEmail, approveOffer, fetchBudgetExceptions, approveBudgetException, Candidate, Interview, Offer, BudgetException } from '../lib/recruitment_api';
import { Calendar, Clock, AlertTriangle, Send, FileUp, FileText } from 'lucide-react';

export const InterviewOfferManager: React.FC<{ activeRole: string, type: 'interviews' | 'offers' }> = ({ activeRole, type }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [budgetExceptions, setBudgetExceptions] = useState<BudgetException[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const [interviewForm, setInterviewForm] = useState<Partial<Interview>>({ type: 'Online' });
  const [evaluationForm, setEvaluationForm] = useState<any>({});
  const [offerForm, setOfferForm] = useState<Partial<Offer>>({});
  const [offerStep, setOfferStep] = useState<1 | 2>(1);
  const [emailForm, setEmailForm] = useState({ subject: 'Offer of Employment from ORG Enterprise', body: 'Dear Candidate,\n\nWe are thrilled to offer you this position. Please find the details attached.\n\nBest Regards,\nORG Enterprise HR' });
  const [emailFiles, setEmailFiles] = useState<File[]>([]);

  const loadData = async () => {
    const cands = await fetchCandidates();
    setCandidates(cands);
    if (type === 'interviews') {
      const ints = await fetchInterviews();
      setInterviews(ints);
    } else {
      const offs = await fetchOffers();
      setOffers(offs);
      const excs = await fetchBudgetExceptions();
      setBudgetExceptions(excs);
    }
  };
  
  useEffect(() => { loadData(); }, [type]);

  // Handle Interview Scheduling
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem) {
      await scheduleInterview({ ...interviewForm, candidate_id: selectedItem.id });
      setShowModal(false);
      setSelectedItem(null);
      loadData();
    }
  };

  // Handle Interview Evaluation
  const handleEvaluationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem) {
      await submitInterviewEvaluation(selectedItem.id, evaluationForm);
      setShowModal(false);
      setSelectedItem(null);
      loadData();
    }
  };

  // Handle Offer Creation & Email
  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem) {
      if (offerStep === 1) {
        setOfferStep(2); // Go to email draft
        return;
      }
      
      // Submit offer
      const newOffer = await createOffer({ ...offerForm, candidate_id: selectedItem.id });
      
      // Prepare form data for email
      const fd = new FormData();
      fd.append('subject', emailForm.subject);
      fd.append('body', emailForm.body);
      emailFiles.forEach(f => fd.append('attachments', f));
      
      await sendOfferEmail(newOffer.id, fd);

      setShowModal(false);
      setSelectedItem(null);
      setOfferStep(1);
      setEmailFiles([]);
      loadData();
    }
  };

  // Handle Offer Approval
  const handleOfferApproval = async (offerId: string, action: string) => {
    let roleForApproval = 'Admin';
    if (activeRole === 'HR Head') roleForApproval = 'HR Head';
    else if (activeRole === 'HOD' || activeRole === 'Management') roleForApproval = 'Dept Head';
    else if (activeRole === 'Admin') roleForApproval = 'Final';
    
    await approveOffer(offerId, roleForApproval, action);
    loadData();
  };

  const handleExceptionApproval = async (excId: string, action: 'Approve' | 'Reject') => {
    let roleForApproval: 'Dept Head' | 'HR Head' | 'Management' = 'Dept Head';
    if (activeRole === 'HR Head') roleForApproval = 'HR Head';
    else if (activeRole === 'Management' || activeRole === 'Admin') roleForApproval = 'Management';
    else if (activeRole === 'HOD') roleForApproval = 'Dept Head';
    
    await approveBudgetException(excId, action, roleForApproval);
    loadData();
  };

  if (type === 'interviews') {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-xl font-black text-slate-900 mb-6">Interview Management</h2>
        
        {/* Candidates needing scheduling */}
        <h3 className="font-bold text-slate-700 mb-4">Pending Scheduling</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {candidates.filter(c => c.status === 'Interview Scheduling').map(cand => (
            <div key={cand.id} className="border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">{cand.first_name} {cand.last_name}</div>
                <div className="text-xs text-slate-500">{cand.current_designation}</div>
              </div>
              <button onClick={() => { setSelectedItem(cand); setShowModal(true); setInterviewForm({ type: 'Online' }); }} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 p-2 rounded-xl text-sm font-bold">
                Schedule
              </button>
            </div>
          ))}
          {candidates.filter(c => c.status === 'Interview Scheduling').length === 0 && <div className="text-sm text-slate-500">No candidates pending scheduling.</div>}
        </div>

        {/* Scheduled Interviews */}
        <h3 className="font-bold text-slate-700 mb-4">Scheduled Interviews</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interviews.filter(i => i.status === 'Scheduled').map(int => {
            const cand = candidates.find(c => c.id === int.candidate_id);
            if (!cand) return null;
            return (
              <div key={int.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                <div className="font-bold text-slate-900 mb-2">{cand.first_name} {cand.last_name}</div>
                <div className="text-sm text-slate-600 flex flex-col gap-1 mb-4">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4"/> {int.date} at {int.time}</div>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4"/> {int.type}</div>
                </div>
                <button onClick={() => { setSelectedItem(int); setShowModal(true); setEvaluationForm({}); }} className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 p-2 rounded-xl text-sm font-bold">
                  Evaluate Candidate
                </button>
              </div>
            );
          })}
        </div>

        {showModal && selectedItem && !selectedItem.date && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col pop-in">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900">Schedule Interview</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
              </div>
              <form onSubmit={handleScheduleSubmit} className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                    <input type="date" required className="w-full px-3 py-2 rounded-xl border border-slate-200" onChange={e => setInterviewForm({...interviewForm, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Time</label>
                    <input type="time" required className="w-full px-3 py-2 rounded-xl border border-slate-200" onChange={e => setInterviewForm({...interviewForm, time: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                    <select className="w-full px-3 py-2 rounded-xl border border-slate-200" onChange={e => setInterviewForm({...interviewForm, type: e.target.value as any})}>
                      <option>Online</option>
                      <option>Face-to-Face</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link / Venue</label>
                    <input type="text" required className="w-full px-3 py-2 rounded-xl border border-slate-200" onChange={e => setInterviewForm({...interviewForm, venue_or_link: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">Schedule & Notify</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showModal && selectedItem && selectedItem.date && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col pop-in">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex flex-col">
                  <h3 className="text-xl font-black text-slate-900">Interview Evaluation</h3>
                  <div className="text-sm font-medium text-slate-500">
                    Candidate: {candidates.find(c => c.id === selectedItem.candidate_id)?.first_name} {candidates.find(c => c.id === selectedItem.candidate_id)?.last_name}
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
              </div>
              <form onSubmit={handleEvaluationSubmit} className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {['technical_score', 'communication_score', 'problem_solving_score', 'cultural_fit_score'].map(k => (
                    <div key={k}>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{k.replace('_score', '').replace('_', ' ')} (1-10)</label>
                      <input type="number" min="1" max="10" required className="w-full px-3 py-2 rounded-xl border border-slate-200" onChange={e => setEvaluationForm({...evaluationForm, [k]: Number(e.target.value)})} />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Recommendation</label>
                    <select required className="w-full px-3 py-2 rounded-xl border border-slate-200" onChange={e => setEvaluationForm({...evaluationForm, overall_recommendation: e.target.value})}>
                      <option value="">Select...</option>
                      <option>Select</option>
                      <option>Hold</option>
                      <option>Reject</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">Submit Evaluation</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }

  // OFFERS VIEW
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-xl font-black text-slate-900 mb-6">Offer Management</h2>

      {/* Candidates needing Offers */}
      <h3 className="font-bold text-slate-700 mb-4">Pending Offer Creation</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {candidates.filter(c => c.status === 'Selected').map(cand => (
          <div key={cand.id} className="border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">{cand.first_name} {cand.last_name}</div>
              <div className="text-xs text-slate-500">Exp: {cand.expected_ctc} INR</div>
            </div>
            <button onClick={() => { setSelectedItem(cand); setShowModal(true); setOfferForm({ offered_ctc: cand.expected_ctc }); }} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 p-2 rounded-xl text-sm font-bold">
              Create Offer
            </button>
          </div>
        ))}
      </div>

      {/* Existing Offers */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
              <th className="py-3 px-4">Candidate</th>
              <th className="py-3 px-4">Offered CTC</th>
              <th className="py-3 px-4">Designation</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {offers.filter(o => o.status !== 'Offer Declined' && o.status !== 'Offer Expired').map(offer => {
              const cand = candidates.find(c => c.id === offer.candidate_id);
              return (
                <tr key={offer.id} className="border-b border-slate-100">
                  <td className="py-3 px-4 font-bold text-slate-900">{cand?.first_name} {cand?.last_name}</td>
                  <td className="py-3 px-4 font-medium text-slate-600">₹{offer.offered_ctc.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 font-medium text-slate-600">{offer.designation}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      offer.status.includes('Pending') ? 'bg-amber-100 text-amber-700' :
                      (offer.status === 'Offer Declined' || offer.status === 'Offer Expired') ? 'bg-red-100 text-red-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>{offer.status}</span>
                  </td>
                  <td className="py-3 px-4">
                    {offer.status.includes('Pending') && (
                      <button onClick={() => handleOfferApproval(offer.id, 'Approve')} className="text-emerald-600 hover:text-emerald-800 text-sm font-bold">Approve</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {budgetExceptions.filter(e => e.status !== 'Rejected' && e.status !== 'Approved').length > 0 && (
        <div className="mt-12">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Budget Exceptions Pending Approval
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left bg-red-50/30 border border-red-100 rounded-xl">
              <thead>
                <tr className="border-b border-red-100 text-xs text-red-700 uppercase">
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Offered CTC</th>
                  <th className="py-3 px-4">Variance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {budgetExceptions.filter(e => e.status !== 'Rejected' && e.status !== 'Approved').map(exc => {
                  return (
                    <tr key={exc.id} className="border-b border-red-100/50">
                      <td className="py-3 px-4 font-bold text-slate-900">{exc.department}</td>
                      <td className="py-3 px-4 font-medium text-slate-600">₹{exc.offered_ctc.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 font-bold text-red-600">₹{exc.variance_amount.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700">{exc.status}</span>
                      </td>
                      <td className="py-3 px-4 flex gap-3">
                        <button onClick={() => handleExceptionApproval(exc.id, 'Approve')} className="text-emerald-600 hover:text-emerald-800 text-sm font-bold">Approve</button>
                        <button onClick={() => handleExceptionApproval(exc.id, 'Reject')} className="text-red-600 hover:text-red-800 text-sm font-bold">Reject</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && selectedItem && !selectedItem.offered_ctc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col pop-in">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900">{offerStep === 1 ? 'Create Offer Details' : 'Draft Offer Email'}</h3>
              <button onClick={() => { setShowModal(false); setOfferStep(1); }} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleOfferSubmit} className="p-6">
              {offerStep === 1 ? (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Offered CTC</label>
                    <input type="number" required className="w-full px-3 py-2 rounded-xl border border-slate-200" value={offerForm.offered_ctc} onChange={e => setOfferForm({...offerForm, offered_ctc: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Designation</label>
                    <input type="text" required className="w-full px-3 py-2 rounded-xl border border-slate-200" onChange={e => setOfferForm({...offerForm, designation: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Grade</label>
                    <input type="text" required className="w-full px-3 py-2 rounded-xl border border-slate-200" onChange={e => setOfferForm({...offerForm, grade: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Joining Date</label>
                    <input type="date" required className="w-full px-3 py-2 rounded-xl border border-slate-200" onChange={e => setOfferForm({...offerForm, joining_date: e.target.value})} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
                    <input type="text" required className="w-full px-3 py-2 rounded-xl border border-slate-200" value={emailForm.subject} onChange={e => setEmailForm({...emailForm, subject: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Body (HTML allowed)</label>
                    <textarea rows={5} required className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-sm" value={emailForm.body} onChange={e => setEmailForm({...emailForm, body: e.target.value})} />
                  </div>
                  <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg"><FileText size={16} className="text-indigo-600"/></div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">Offer_Letter.pdf (Auto-generated)</div>
                        <div className="text-xs text-slate-500">Will be attached automatically</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Additional Attachments</label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                        <FileUp size={16}/> Upload File
                        <input type="file" multiple className="hidden" onChange={e => { if (e.target.files) setEmailFiles(Array.from(e.target.files)); }} />
                      </label>
                      <div className="text-sm text-slate-500">
                        {emailFiles.length} file(s) selected
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-4">
                {offerStep === 2 ? (
                  <button type="button" onClick={() => setOfferStep(1)} className="text-slate-500 hover:text-slate-800 font-bold px-4 py-2">Back</button>
                ) : <div/>}
                
                <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors">
                  {offerStep === 1 ? 'Next: Draft Email' : <><Send size={16}/> Send Offer</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

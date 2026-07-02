import React, { useState, useEffect } from 'react';
import { fetchOffers, fetchCandidates, candidateActionOffer, Offer, Candidate } from '../lib/recruitment_api';
import { CheckCircle, MessageCircle, FileUp, Send, FileText, Check, AlertTriangle, X } from 'lucide-react';
import { DigitalHumanCompanion } from './DigitalHuman/DigitalHumanCompanion';

export const CandidateOfferPortal: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clarificationMsg, setClarificationMsg] = useState('');
  const [showClarification, setShowClarification] = useState(false);
  
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptFile, setAcceptFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const saved = localStorage.getItem('ag_user');
      const authUser = saved ? JSON.parse(saved) : null;
      if (authUser && authUser.id.startsWith('OFR-')) {
        setUser(authUser);
        // Find the candidate that matches this test login
        const cands = await fetchCandidates();
        const cand = cands.find(c => c.first_name.includes('Offered') || c.id === 'CAND-001'); // Fallback to first cand for testing if needed
        
        if (cand) {
          setCandidate(cand);
          const allOffers = await fetchOffers();
          const candOffer = allOffers.find(o => o.candidate_id === cand.id);
          if (candOffer) setOffer(candOffer);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'Accept' | 'Clarification') => {
    if (!offer) return;
    
    if (action === 'Accept' && showAcceptModal === false) {
      setShowAcceptModal(true);
      return;
    }

    if (action === 'Clarification' && !clarificationMsg) {
      alert("Please enter a message");
      return;
    }

    await candidateActionOffer(offer.id, action, clarificationMsg);
    setShowAcceptModal(false);
    setShowClarification(false);
    loadData();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-extrabold text-slate-900 text-lg tracking-tight">ORG Enterprise</div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-slate-600">{candidate?.first_name} {candidate?.last_name}</span>
            <button onClick={onLogout} className="text-sm font-bold text-slate-400 hover:text-slate-600">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 flex flex-col gap-8 relative z-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">Welcome, {candidate?.first_name}! 🎉</h1>
            <p className="text-lg font-medium text-slate-500">Review your employment offer details below.</p>
          </div>

          {!offer ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900">No Offer Found</h2>
              <p className="text-slate-500 mt-2">We could not locate an active offer for your profile. Please contact HR.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-indigo-100/20 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white flex justify-between items-end">
                <div>
                  <div className="text-indigo-100 font-bold mb-1 uppercase tracking-wider text-sm">Position Offered</div>
                  <div className="text-3xl font-black">{offer.designation}</div>
                </div>
                <div className="text-right">
                  <div className="text-indigo-100 font-bold mb-1 uppercase tracking-wider text-sm">Status</div>
                  <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full font-bold text-sm inline-block">
                    {offer.status}
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <div className="text-sm font-bold text-slate-400 uppercase mb-1">Total CTC</div>
                    <div className="text-2xl font-black text-slate-900">₹{offer.offered_ctc.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-400 uppercase mb-1">Joining Date</div>
                    <div className="text-xl font-bold text-slate-800">{new Date(offer.joining_date).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-400 uppercase mb-1">Grade</div>
                    <div className="text-xl font-bold text-slate-800">{offer.grade}</div>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Official_Offer_Letter.pdf</div>
                      <div className="text-xs font-medium text-slate-500">Sent to your email</div>
                    </div>
                  </div>
                  <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800">Download</button>
                </div>

                {offer.status === 'Offer Sent' && (
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleAction('Accept')}
                      className="flex-1 bg-slate-900 hover:bg-black text-white px-6 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-slate-900/20"
                    >
                      <CheckCircle size={20}/> Accept Offer
                    </button>
                    <button 
                      onClick={() => setShowClarification(!showClarification)}
                      className="bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 px-6 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <MessageCircle size={20}/> Request Clarification
                    </button>
                  </div>
                )}

                {offer.status === 'Clarification Requested' && (
                  <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl">
                    <h3 className="font-bold text-amber-800 mb-2">Clarification Requested</h3>
                    <p className="text-amber-700 text-sm font-medium">You have requested clarification on this offer. Our HR team will get back to you shortly.</p>
                  </div>
                )}
                
                {offer.status === 'Offer Accepted' && (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                      <Check size={24}/>
                    </div>
                    <div>
                      <h3 className="font-bold text-emerald-800 text-lg">Offer Accepted!</h3>
                      <p className="text-emerald-700 text-sm font-medium">Congratulations! We look forward to welcoming you to the team. A confirmation email has been sent.</p>
                    </div>
                  </div>
                )}

                {showClarification && offer.status === 'Offer Sent' && (
                  <div className="mt-6 p-6 bg-slate-50 rounded-2xl border border-slate-200 pop-in">
                    <label className="block text-sm font-bold text-slate-700 mb-2">What do you need clarification on?</label>
                    <textarea 
                      className="w-full p-3 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none resize-none mb-4" 
                      rows={3}
                      value={clarificationMsg}
                      onChange={e => setClarificationMsg(e.target.value)}
                      placeholder="E.g. Regarding the joining date or benefits..."
                    />
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setShowClarification(false)} className="px-4 py-2 text-slate-500 font-bold hover:text-slate-700">Cancel</button>
                      <button onClick={() => handleAction('Clarification')} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2"><Send size={16}/> Submit Request</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right side: Digital Human / Guide */}
        <div className="lg:col-span-1 hidden lg:block relative">
          <div className="sticky top-24 w-[300px] h-[500px]">
            <DigitalHumanCompanion user={user} activeTab="candidate_offer" context="candidate_offer" />
          </div>
        </div>

      </main>

      {/* Accept Offer Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden pop-in p-6">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Upload Signed Copy</h3>
            <p className="text-slate-500 font-medium mb-6">Please upload the signed copy of your offer letter to complete the acceptance process.</p>
            
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer mb-6">
              <label className="cursor-pointer flex flex-col items-center">
                <FileUp className="w-10 h-10 text-indigo-400 mb-3" />
                <span className="font-bold text-slate-700">Click to upload PDF</span>
                <span className="text-xs text-slate-500 mt-1">Max file size: 5MB</span>
                <input type="file" className="hidden" accept=".pdf" onChange={e => {
                  if (e.target.files && e.target.files[0]) setAcceptFile(e.target.files[0]);
                }} />
              </label>
            </div>
            
            {acceptFile && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between mb-6">
                <span className="font-bold text-indigo-900 text-sm truncate">{acceptFile.name}</span>
                <button onClick={() => setAcceptFile(null)} className="text-indigo-400 hover:text-indigo-600"><X size={16}/></button>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAcceptModal(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:text-slate-700">Cancel</button>
              <button onClick={() => handleAction('Accept')} className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-black"><CheckCircle size={18}/> Confirm Accept</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

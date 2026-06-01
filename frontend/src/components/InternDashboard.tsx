import React, { useEffect, useState } from 'react';
import { AuthUser, Intern, InternReport, submitInternReport, fetchInternReports } from '../lib/api';
import { CheckCircle, AlertCircle, Calendar, Send, BookOpen, User } from 'lucide-react';

interface InternDashboardProps {
  user: AuthUser;
}

export const InternDashboard: React.FC<InternDashboardProps> = ({ user }) => {
  const [reports, setReports] = useState<InternReport[]>([]);
  const [internInfo, setInternInfo] = useState<Intern | null>(null);
  
  const [learnings, setLearnings] = useState('');
  const [feedback, setFeedback] = useState('');
  const [needsImprovement, setNeedsImprovement] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Need to fetch full intern info to show countdown, but for now we'll just mock it or try fetching from reports if we had it.
  // Wait, we can fetch intern details by logging them in, but the AuthUser doesn't contain all fields. Let's fetch the specific intern using the API.

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const { fetchInterns } = await import('../lib/api');
      const allInterns = await fetchInterns();
      const me = allInterns.find(i => i.id === user.id);
      if (me) setInternInfo(me);

      const r = await fetchInternReports(user.id);
      setReports(r);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnings.trim()) {
      setError('Please fill in your daily learnings.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      await submitInternReport({
        intern_id: user.id,
        date: dateStr,
        learnings,
        feedback,
        needs_improvement: needsImprovement
      });
      alert('Daily Report Submitted Successfully!');
      setLearnings('');
      setFeedback('');
      setNeedsImprovement('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = () => {
    if (!internInfo) return 0;
    const end = new Date(internInfo.end_date).getTime();
    const now = new Date().getTime();
    return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = getDaysLeft();
  const todayStr = new Date().toISOString().split('T')[0];
  const hasSubmittedToday = reports.some(r => r.date === todayStr);

  return (
    <div className="space-y-6 slide-up fade-in max-w-5xl mx-auto pb-10">
      
      {daysLeft <= 3 && daysLeft > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-amber-800">Action Required: Internship Ending Soon</h3>
            <p className="text-sm text-amber-700 mt-1">
              Your internship ends in {daysLeft} days. Please ensure all your daily reports are completed to receive your certificate. An email reminder has also been sent.
            </p>
          </div>
        </div>
      )}

      {internInfo?.is_certified && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-emerald-800">Congratulations!</h3>
              <p className="text-sm text-emerald-700 mt-1">Your internship certificate has been generated and approved by the admin.</p>
            </div>
          </div>
          {internInfo.certificate_url && (
            <a href={internInfo.certificate_url} download target="_blank" rel="noreferrer" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm shadow transition-colors shrink-0">
              Download Certificate
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Progress & Profile */}
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" /> My Profile
            </h3>
            {internInfo ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase">Name</div>
                  <div className="text-slate-800 font-bold">{internInfo.name}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase">Intern ID</div>
                  <div className="text-slate-800 font-bold">{internInfo.id}</div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase">Status</div>
                    <div className="text-slate-800 font-bold">{internInfo.is_active ? 'Active' : 'Inactive'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase">Days Left</div>
                    <div className="text-indigo-600 font-black text-xl">{daysLeft}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-pulse h-32 bg-slate-100 rounded-xl"></div>
            )}
          </div>

          <div className="glass-panel p-6">
             <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" /> Report History
            </h3>
            {reports.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No reports submitted yet.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {reports.map(r => (
                  <div key={r.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-500">{r.date}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === 'COMPLETE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2">{r.learnings}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Daily Submission Form */}
        <div className="md:col-span-2">
          <div className="glass-panel p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10" />
            
            <h2 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" /> Daily Learnings & Feedback
            </h2>
            <p className="text-sm text-slate-500 mb-6 font-medium">
              Document what you learned today. If you skip a day, it will be marked as INCOMPLETE and affect your final certification.
            </p>

            {hasSubmittedToday ? (
              <div className="p-8 border border-emerald-200 bg-emerald-50 rounded-2xl flex items-center justify-center text-center">
                <div>
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h3 className="font-bold text-emerald-900 text-lg">Report Submitted!</h3>
                  <p className="text-sm text-emerald-700 mt-1">You've successfully logged your learnings for today.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && <div className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
                
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Today's Learnings & Tasks Completed <span className="text-red-500">*</span></label>
                  <textarea 
                    value={learnings}
                    onChange={e => setLearnings(e.target.value)}
                    required
                    placeholder="e.g. Today I learned about React hooks and implemented the frontend dashboard..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm h-32 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Feedback / Blockers (Optional)</label>
                    <textarea 
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      placeholder="Any blockers or feedback for your manager?"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm h-24 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Areas for Improvement (Optional)</label>
                    <textarea 
                      value={needsImprovement}
                      onChange={e => setNeedsImprovement(e.target.value)}
                      placeholder="What can we do better?"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm h-24 resize-none"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || !internInfo?.is_active}
                  className="w-full py-3.5 bg-indigo-600 text-white font-black rounded-xl shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Submitting...' : <><Send className="w-4 h-4" /> Submit Today's Report</>}
                </button>
                {!internInfo?.is_active && <p className="text-xs text-red-500 text-center font-bold">Your account is deactivated. You cannot submit reports.</p>}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

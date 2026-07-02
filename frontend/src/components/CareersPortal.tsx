import React, { useState, useEffect, useRef } from 'react';
import { fetchRequisitions, JobRequisition, submitCandidateApplication } from '../lib/recruitment_api';
import { Layers, MapPin, Briefcase, Clock, Search, ChevronRight, Sparkles, ArrowLeft, UploadCloud, CheckCircle2, Send, Users, TrendingUp, Zap, X, MessageCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─── Aira Avatar (light theme) ─────────────────────────────────────
const AiraOrb: React.FC<{ speaking: boolean; size?: number }> = ({ speaking, size = 72 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', position: 'relative', flexShrink: 0,
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #a855f7)',
    boxShadow: speaking
      ? '0 0 0 6px rgba(99,102,241,0.18), 0 0 0 12px rgba(99,102,241,0.08), 0 12px 30px rgba(99,102,241,0.35)'
      : '0 0 0 4px rgba(99,102,241,0.12), 0 8px 24px rgba(99,102,241,0.25)',
    transition: 'box-shadow 0.3s', animation: 'airaFloat 3s ease-in-out infinite',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <svg width={size * 0.54} height={size * 0.54} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="18" r="8" fill="rgba(255,255,255,0.92)" />
      <path d="M8 40c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="rgba(255,255,255,0.92)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="20" cy="17" r="2" fill="#4f46e5" />
      <circle cx="28" cy="17" r="2" fill="#4f46e5" />
      <path d="M20 22c1.333 1.333 6.667 1.333 8 0" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
    {speaking && <>
      <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.35)', animation: 'ripple 1.5s ease-out infinite' }} />
      <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '2px solid rgba(99,102,241,0.18)', animation: 'ripple 1.5s ease-out infinite 0.5s' }} />
    </>}
  </div>
);

// ─── Speech Bubble ─────────────────────────────────────────────────
const AiraBubble: React.FC<{ text: string }> = ({ text }) => (
  <div style={{
    background: 'white', borderRadius: 18, padding: '14px 18px', fontSize: 13,
    color: '#334155', lineHeight: 1.6, fontWeight: 500, position: 'relative',
    boxShadow: '0 6px 24px rgba(99,102,241,0.12)', border: '1.5px solid rgba(99,102,241,0.15)',
    animation: 'fadeUp 0.4s ease'
  }}>
    <div style={{ position: 'absolute', bottom: -8, left: 22, width: 15, height: 15, background: 'white', borderRight: '1.5px solid rgba(99,102,241,0.15)', borderBottom: '1.5px solid rgba(99,102,241,0.15)', transform: 'rotate(45deg)' }} />
    {text}
  </div>
);

// ─── Job Card ──────────────────────────────────────────────────────
const JobCard: React.FC<{ job: JobRequisition; onApply: (j: JobRequisition) => void; index: number }> = ({ job, onApply, index }) => {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={() => onApply(job)}
      style={{
        background: 'white', borderRadius: 20, padding: '22px 24px',
        border: hov ? '2px solid #6366f1' : '2px solid #e8edf5', cursor: 'pointer',
        transition: 'all 0.28s ease',
        boxShadow: hov ? '0 16px 40px rgba(99,102,241,0.16)' : '0 2px 12px rgba(0,0,0,0.05)',
        transform: hov ? 'translateY(-3px)' : 'none',
        animationName: 'slideUpCard', animationDuration: '0.45s',
        animationFillMode: 'both', animationDelay: `${index * 0.07}s`
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: 10, fontWeight: 800, background: 'linear-gradient(135deg,#eef2ff,#ede9fe)', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.7px' }}>{job.department}</span>
        {job.number_of_openings > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '3px 9px', borderRadius: 100 }}>{job.number_of_openings} opening{job.number_of_openings > 1 ? 's' : ''}</span>}
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.3px' }}>{job.position_title}</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b', fontWeight: 600 }}><MapPin size={12} color="#f43f5e" />{job.location || 'Various'}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b', fontWeight: 600 }}><Briefcase size={12} color="#f59e0b" />{job.employment_type || 'Full-time'}</span>
        {job.required_experience && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b', fontWeight: 600 }}><Clock size={12} color="#8b5cf6" />{job.required_experience}</span>}
      </div>
      {job.key_skills && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
          {job.key_skills.split(',').slice(0, 3).map((s, i) => <span key={i} style={{ padding: '3px 9px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: '#f8faff', color: '#475569', border: '1px solid #e2e8f0' }}>{s.trim()}</span>)}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Posted {new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#4f46e5', fontWeight: 800, fontSize: 13, transform: hov ? 'translateX(3px)' : 'none', transition: 'transform 0.2s' }}>Apply Now <ChevronRight size={15} /></span>
      </div>
    </div>
  );
};

// ─── Step Indicator ────────────────────────────────────────────────
const Steps: React.FC<{ cur: number; labels: string[] }> = ({ cur, labels }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
    {labels.map((label, i) => (
      <React.Fragment key={i}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, transition: 'all 0.3s', background: i < cur ? '#4f46e5' : i === cur ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : '#f1f5f9', color: i <= cur ? 'white' : '#94a3b8', boxShadow: i === cur ? '0 4px 14px rgba(99,102,241,0.4)' : 'none', transform: i === cur ? 'scale(1.1)' : 'none' }}>
            {i < cur ? <CheckCircle2 size={17} /> : i + 1}
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: i <= cur ? '#4f46e5' : '#94a3b8', whiteSpace: 'nowrap' }}>{label}</span>
        </div>
        {i < labels.length - 1 && <div style={{ flex: 1, height: 2, background: i < cur ? '#4f46e5' : '#e2e8f0', margin: '0 4px', marginBottom: 20, transition: 'background 0.4s' }} />}
      </React.Fragment>
    ))}
  </div>
);

// ─── Form Field (top-level, stable identity) ──────────────────────
type FormData = { first_name: string; last_name: string; email: string; mobile_number: string; location: string; current_company: string; current_designation: string; total_experience: string; relevant_experience: string; current_ctc: string; expected_ctc: string; notice_period: string; reason_for_change: string };

const F: React.FC<{ label: string; k: keyof FormData; type?: string; req?: boolean; value: string; onChange: (k: keyof FormData, v: string) => void }> = ({ label, k, type = 'text', req = false, value, onChange }) => (
  <div>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}{req && <span style={{ color: '#f43f5e' }}> *</span>}</label>
    <input type={type} value={value} required={req}
      onChange={e => onChange(k, e.target.value)}
      onFocus={e => (e.target.style.borderColor = '#6366f1')}
      onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
      style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 14, fontWeight: 500, outline: 'none', background: 'white', boxSizing: 'border-box', transition: 'border-color 0.2s' }} />
  </div>
);

// ─── Aira Sidebar Panel (top-level, stable identity) ───────────────
const AiraSidebarContent: React.FC<{
  speaking: boolean; airaMsg: string; jobCount: number; loading: boolean;
  airaChat: boolean; onToggleChat: () => void;
  msgs: { role: 'user' | 'aira'; text: string }[];
  chatInput: string; onChatInput: (v: string) => void;
  chatLoading: boolean; onSend: () => void; chatEndRef: React.RefObject<HTMLDivElement>;
}> = ({ speaking, airaMsg, jobCount, loading, airaChat, onToggleChat, msgs, chatInput, onChatInput, chatLoading, onSend, chatEndRef }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 4px' }}>
    <AiraOrb speaking={speaking} size={76} />
    <AiraBubble text={airaMsg} />
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[{ icon: <Briefcase size={14} />, label: 'Open Positions', val: loading ? '...' : `${jobCount}` },
        { icon: <Users size={14} />, label: 'Hires This Year', val: '500+' },
        { icon: <TrendingUp size={14} />, label: 'Avg Salary Growth', val: '35%' }
      ].map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8faff', borderRadius: 12, padding: '9px 12px', border: '1px solid #e8edf5' }}>
          <div style={{ color: '#6366f1' }}>{s.icon}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{s.val}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>
    <button onClick={onToggleChat} style={{ width: '100%', padding: '10px', borderRadius: 12, border: '1.5px solid rgba(99,102,241,0.3)', background: airaChat ? '#eef2ff' : 'white', color: '#4f46e5', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
      <Sparkles size={14} /> {airaChat ? 'Hide Chat' : 'Ask Aira'}
    </button>
    {airaChat && (
      <div style={{ width: '100%', background: 'white', borderRadius: 16, border: '1.5px solid #e8edf5', overflow: 'hidden' }}>
        <div style={{ maxHeight: 220, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '85%', padding: '8px 11px', borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px', fontSize: 12, fontWeight: 500, lineHeight: 1.5, background: m.role === 'user' ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : '#f8faff', color: m.role === 'user' ? 'white' : '#334155', border: m.role === 'aira' ? '1px solid #e8edf5' : 'none' }}>
                {m.role === 'aira' ? <div style={{ fontSize: 12 }}><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown></div> : m.text}
              </div>
            </div>
          ))}
          {chatLoading && <div style={{ display: 'flex' }}><div style={{ background: '#f8faff', border: '1px solid #e8edf5', borderRadius: '12px 12px 12px 4px', padding: '9px 12px' }}><div className="dot-bounce"><span /><span /><span /></div></div></div>}
          <div ref={chatEndRef} />
        </div>
        <div style={{ padding: 8, borderTop: '1px solid #f1f5f9', display: 'flex', gap: 6, background: '#fafbff' }}>
          <input
            value={chatInput}
            onChange={e => onChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !chatLoading && chatInput.trim()) onSend(); }}
            placeholder="Ask Aira..."
            style={{ flex: 1, padding: '8px 11px', borderRadius: 10, background: 'white', border: '1.5px solid #e2e8f0', color: '#334155', fontSize: 12, outline: 'none' }}
          />
          <button onClick={onSend} disabled={chatLoading || !chatInput.trim()} style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!chatInput.trim() || chatLoading) ? 0.4 : 1, flexShrink: 0 }}>
            <Send size={13} color="white" />
          </button>
        </div>
      </div>
    )}
  </div>
);

// ─── Main Component ────────────────────────────────────────────────
export const CareersPortal: React.FC = () => {
  const [jobs, setJobs] = useState<JobRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [selected, setSelected] = useState<JobRequisition | null>(null);
  const [step, setStep] = useState(0);
  const [formStep, setFormStep] = useState(0);
  const [airaMsg, setAiraMsg] = useState("👋 Hi! I'm Aira. Browse our open roles — I'll guide you every step of the way!");
  const [speaking, setSpeaking] = useState(true);
  const [showAiraPanel, setShowAiraPanel] = useState(false); // mobile: show Aira drawer
  const [airaChat, setAiraChat] = useState(false);
  const [msgs, setMsgs] = useState<{ role: 'user' | 'aira'; text: string }[]>([{ role: 'aira', text: "Hi! 👋 Ask me about any role, the interview process, or company culture!" }]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<FormData>({ first_name: '', last_name: '', email: '', mobile_number: '', location: '', current_company: '', current_designation: '', total_experience: '', relevant_experience: '', current_ctc: '', expected_ctc: '', notice_period: '', reason_for_change: '' });
  const handleFieldChange = (k: keyof FormData, v: string) => setFormData(p => ({ ...p, [k]: v }));
  const [files, setFiles] = useState<Record<string, File | null>>({ resume: null, payslips: null, increment_letter: null });
  const [submitting, setSubmitting] = useState(false);
  const [candId, setCandId] = useState('');

  useEffect(() => {
    fetchRequisitions().then(d => setJobs(d.filter(r => r.status === 'Approved'))).catch(() => setJobs([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [msgs]);

  const departments = ['All', ...Array.from(new Set(jobs.map(j => j.department).filter(Boolean)))];
  const filteredJobs = jobs.filter(j => {
    const matchD = deptFilter === 'All' || j.department === deptFilter;
    const q = search.toLowerCase();
    return matchD && (!q || j.position_title.toLowerCase().includes(q) || (j.department || '').toLowerCase().includes(q) || (j.key_skills || '').toLowerCase().includes(q));
  });

  const setAira = (msg: string) => { setAiraMsg(msg); setSpeaking(true); setTimeout(() => setSpeaking(false), 4000); };

  const handleSelect = (job: JobRequisition) => { setSelected(job); setStep(1); setAira(`Great pick! 🎯 "${job.position_title}" — read the details, then hit Apply!`); };
  const handleApply = () => { setStep(2); setFormStep(0); setAira("Let's build your application! 📝 Start with your personal info."); };
  const handleNext = () => {
    if (formStep === 0) { setFormStep(1); setAira("💼 Tell me about your professional background!"); }
    else if (formStep === 1) { setFormStep(2); setAira("📎 Almost done! Attach your resume."); }
  };
  const handleSubmit = async () => {
    if (!selected || !files.resume) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('requisition_id', selected.id);
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });
      const res = await submitCandidateApplication(fd);
      setCandId(res.id);
      setStep(3);
      setAira("🎉 Submitted! Our talent team will review and reach out soon. All the best!");
    } catch (err: any) { alert(err.message || 'Failed. Please try again.'); }
    finally { setSubmitting(false); }
  };

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setMsgs(p => [...p, { role: 'user', text }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/ai-companion/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, role: 'Employee', activeTab: 'careers', context: `ORG Careers Portal. ${jobs.length} openings. ${selected ? `Viewing: ${selected.position_title}` : 'Browsing.'}`, history: msgs.slice(-4).map(m => ({ role: m.role === 'aira' ? 'assistant' : 'user', content: m.text })) })
      });
      const data = await res.json();
      setMsgs(p => [...p, { role: 'aira', text: (data.reply || 'Happy to help!').replace(/\[NAVIGATE:[^\]]+\]/g, '').trim() }]);
    } catch { setMsgs(p => [...p, { role: 'aira', text: 'Connection issue! Try again 🙏' }]); }
    finally { setChatLoading(false); }
  };

  // AiraSidebarContent and F are now top-level components (above this function) to preserve stable identity between renders.

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f8faff 0%,#eef2ff 50%,#faf5ff 100%)', fontFamily: 'Inter,system-ui,sans-serif', position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes airaFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes ripple { 0%{transform:scale(1);opacity:1} 100%{transform:scale(1.8);opacity:0} }
        @keyframes slideUpCard { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes orb1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(50px,-35px) scale(1.12)} 66%{transform:translate(-25px,25px) scale(0.92)} }
        @keyframes orb2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-35px,35px)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes drawerIn { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes dotBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        .dot-bounce span{display:inline-block;width:6px;height:6px;border-radius:50%;background:#6366f1;animation:dotBounce 1.2s infinite;margin:0 2px}
        .dot-bounce span:nth-child(2){animation-delay:.2s}
        .dot-bounce span:nth-child(3){animation-delay:.4s}
        @media(max-width:768px){
          .careers-layout{flex-direction:column !important}
          .careers-sidebar{display:none !important}
          .careers-content{padding:20px 16px !important}
          .job-grid{grid-template-columns:1fr !important}
          .form-grid{grid-template-columns:1fr !important}
          .header-pad{padding:12px 16px !important}
          .detail-pad{padding:24px 20px !important}
        }
      `}</style>

      {/* BG orbs — light version */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-5%', left: '-5%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)', animation: 'orb1 14s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.1) 0%,transparent 70%)', animation: 'orb2 17s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '40%', right: '20%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,0.07) 0%,transparent 70%)', animation: 'orb1 20s ease-in-out infinite reverse' }} />
      </div>

      {/* ── Header ── */}
      <header className="header-pad" style={{ position: 'sticky', top: 0, zIndex: 200, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(99,102,241,0.1)', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => window.location.href = '?portal=candidate'} style={{ background: '#f1f5f9', border: '1.5px solid #e2e8f0', color: '#475569', borderRadius: 10, padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Layers size={17} color="white" /></div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 15, color: '#0f172a', letterSpacing: '-0.3px' }}>ORG Careers</div>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>Find Your Next Chapter</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {step > 0 && (
            <button onClick={() => { setStep(0); setSelected(null); setAira("Welcome back! 🌟 Browse our openings."); }} style={{ background: '#f1f5f9', border: '1.5px solid #e2e8f0', color: '#475569', borderRadius: 10, padding: '7px 13px', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
              <ArrowLeft size={13} /> Jobs
            </button>
          )}
          {/* Mobile Aira button */}
          <button onClick={() => setShowAiraPanel(true)} style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', border: 'none', color: 'white', borderRadius: 20, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#86efac' }} />
            Aira Online
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="careers-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 65px)', position: 'relative', zIndex: 1 }}>

        {/* Desktop Sidebar */}
        <div className="careers-sidebar" style={{ width: 272, flexShrink: 0, padding: '24px 18px', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', borderRight: '1px solid rgba(99,102,241,0.08)', position: 'sticky', top: 65, height: 'calc(100vh - 65px)', overflowY: 'auto' }}>
          <AiraSidebarContent speaking={speaking} airaMsg={airaMsg} jobCount={jobs.length} loading={loading} airaChat={airaChat} onToggleChat={() => setAiraChat(p => !p)} msgs={msgs} chatInput={chatInput} onChatInput={setChatInput} chatLoading={chatLoading} onSend={sendChat} chatEndRef={chatEndRef} />
        </div>

        {/* Content */}
        <div className="careers-content" style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>

          {/* Step 0: Listings */}
          {step === 0 && (
            <div style={{ maxWidth: 860, margin: '0 auto' }}>
              <div style={{ marginBottom: 24, animation: 'fadeUp 0.5s ease' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 100, padding: '5px 14px', marginBottom: 14 }}>
                  <Zap size={12} color="#6366f1" /><span style={{ fontSize: 12, fontWeight: 800, color: '#4f46e5', letterSpacing: '0.4px' }}>{jobs.length} LIVE OPENINGS</span>
                </div>
                <h1 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a', marginBottom: 10, letterSpacing: '-1px', lineHeight: 1.1 }}>
                  Build Your Career<br />
                  <span style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>at ORG Enterprise</span>
                </h1>
                <p style={{ fontSize: 15, color: '#64748b', fontWeight: 500, maxWidth: 460, lineHeight: 1.7 }}>Join a team redefining how enterprises manage their most valuable asset — their people.</p>
              </div>

              {/* Search + filters */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22, animation: 'fadeUp 0.5s ease 0.1s both' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roles, skills, departments..." style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: 14, background: 'white', border: '1.5px solid #e2e8f0', color: '#334155', fontSize: 14, outline: 'none', boxSizing: 'border-box', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} />
                </div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {departments.slice(0, 8).map(d => (
                    <button key={d} onClick={() => setDeptFilter(d)} style={{ padding: '7px 15px', borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', background: deptFilter === d ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'white', color: deptFilter === d ? 'white' : '#64748b', border: deptFilter === d ? 'none' : '1.5px solid #e2e8f0', boxShadow: deptFilter === d ? '0 4px 12px rgba(99,102,241,0.35)' : '0 1px 4px rgba(0,0,0,0.05)' }}>{d}</button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '70px 0' }}>
                  <div style={{ display: 'inline-block', width: 42, height: 42, border: '4px solid rgba(99,102,241,0.15)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <div style={{ color: '#94a3b8', marginTop: 14, fontSize: 14, fontWeight: 600 }}>Loading opportunities...</div>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '70px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 14 }}>🔍</div>
                  <div style={{ color: '#64748b', fontSize: 16, fontWeight: 700 }}>No openings match your search.</div>
                  <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>Try a different keyword or filter.</div>
                </div>
              ) : (
                <div className="job-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
                  {filteredJobs.map((job, i) => <JobCard key={job.id} job={job} onApply={handleSelect} index={i} />)}
                </div>
              )}
            </div>
          )}

          {/* Step 1: Detail */}
          {step === 1 && selected && (
            <div style={{ maxWidth: 700, margin: '0 auto', animation: 'slideIn 0.4s ease' }}>
              <div style={{ background: 'white', borderRadius: 24, overflow: 'hidden', boxShadow: '0 16px 48px rgba(99,102,241,0.12)', border: '1.5px solid rgba(99,102,241,0.1)' }}>
                <div className="detail-pad" style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', padding: '32px 36px' }}>
                  <span style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.18)', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.92)', marginBottom: 14 }}>{selected.department}</span>
                  <h2 style={{ fontSize: 26, fontWeight: 900, color: 'white', marginBottom: 14, letterSpacing: '-0.4px' }}>{selected.position_title}</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                    {[{ icon: <MapPin size={13} />, val: selected.location || 'Various' }, { icon: <Briefcase size={13} />, val: selected.employment_type }, { icon: <Clock size={13} />, val: selected.required_experience || 'Open' }, { icon: <Users size={13} />, val: `${selected.number_of_openings || 1} opening(s)` }].map((m, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: 600 }}>{m.icon}{m.val}</div>
                    ))}
                  </div>
                </div>
                <div className="detail-pad" style={{ padding: '28px 36px' }}>
                  {selected.key_skills && <div style={{ marginBottom: 20 }}>
                    <h4 style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Key Skills</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {selected.key_skills.split(',').map((s, i) => <span key={i} style={{ padding: '5px 13px', borderRadius: 100, background: '#eef2ff', color: '#4f46e5', fontSize: 13, fontWeight: 700 }}>{s.trim()}</span>)}
                    </div>
                  </div>}
                  {selected.qualification && <div style={{ marginBottom: 20 }}>
                    <h4 style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Qualification</h4>
                    <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>{selected.qualification}</p>
                  </div>}
                  <div style={{ marginBottom: 26 }}>
                    <h4 style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Job Description</h4>
                    <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{selected.job_description}</p>
                  </div>
                  <button onClick={handleApply} style={{ width: '100%', padding: '16px', borderRadius: 16, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', fontWeight: 900, fontSize: 15, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
                    <Sparkles size={18} /> Apply for this Position
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Form */}
          {step === 2 && selected && (
            <div style={{ maxWidth: 640, margin: '0 auto', animation: 'slideIn 0.4s ease' }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: 4 }}>Apply: {selected.position_title}</h2>
                <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>Complete all steps to submit</p>
              </div>
              <Steps cur={formStep} labels={['Personal', 'Professional', 'Documents']} />
              <div style={{ background: 'white', borderRadius: 22, padding: '26px 28px', boxShadow: '0 12px 40px rgba(99,102,241,0.1)', border: '1.5px solid rgba(99,102,241,0.08)' }}>
                {formStep === 0 && <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <F label="First Name" k="first_name" req value={formData.first_name} onChange={handleFieldChange} /><F label="Last Name" k="last_name" req value={formData.last_name} onChange={handleFieldChange} />
                  <F label="Email" k="email" type="email" req value={formData.email} onChange={handleFieldChange} /><F label="Mobile" k="mobile_number" req value={formData.mobile_number} onChange={handleFieldChange} />
                  <F label="Location" k="location" req value={formData.location} onChange={handleFieldChange} /><F label="Reason for Change" k="reason_for_change" req value={formData.reason_for_change} onChange={handleFieldChange} />
                </div>}
                {formStep === 1 && <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <F label="Current Company" k="current_company" value={formData.current_company} onChange={handleFieldChange} /><F label="Designation" k="current_designation" value={formData.current_designation} onChange={handleFieldChange} />
                  <F label="Total Exp (Yrs)" k="total_experience" value={formData.total_experience} onChange={handleFieldChange} /><F label="Relevant Exp (Yrs)" k="relevant_experience" value={formData.relevant_experience} onChange={handleFieldChange} />
                  <F label="Current CTC (INR)" k="current_ctc" type="number" value={formData.current_ctc} onChange={handleFieldChange} /><F label="Expected CTC (INR)" k="expected_ctc" type="number" value={formData.expected_ctc} onChange={handleFieldChange} />
                  <F label="Notice Period" k="notice_period" value={formData.notice_period} onChange={handleFieldChange} />
                </div>}
                {formStep === 2 && <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[{ key: 'resume', label: 'Resume / CV', accept: '.pdf,.doc,.docx', req: true }, { key: 'payslips', label: 'Payslips (Last 3 Months)', accept: '.pdf', req: true }, { key: 'increment_letter', label: 'Increment Letter (Optional)', accept: '.pdf', req: false }].map(({ key, label, accept, req }) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}{req && <span style={{ color: '#f43f5e' }}> *</span>}</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 14, border: `2px dashed ${files[key] ? '#10b981' : '#e2e8f0'}`, background: files[key] ? '#f0fdf4' : '#fafbff', cursor: 'pointer', transition: 'all 0.2s' }}>
                        {files[key] ? <CheckCircle2 size={19} color="#10b981" /> : <UploadCloud size={19} color="#94a3b8" />}
                        <span style={{ fontSize: 13, fontWeight: 600, color: files[key] ? '#166534' : '#94a3b8' }}>{files[key] ? (files[key] as File).name : 'Click to upload'}</span>
                        <input type="file" accept={accept} style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setFiles(p => ({ ...p, [key]: e.target.files![0] })); }} />
                      </label>
                    </div>
                  ))}
                </div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22, paddingTop: 18, borderTop: '1px solid #f1f5f9' }}>
                  <button onClick={() => formStep === 0 ? setStep(1) : setFormStep(f => f - 1)} style={{ padding: '10px 20px', borderRadius: 12, background: '#f8faff', border: '1.5px solid #e2e8f0', color: '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}><ArrowLeft size={14} /> Back</button>
                  {formStep < 2 ? (
                    <button onClick={handleNext} style={{ padding: '10px 22px', borderRadius: 12, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>Continue <ChevronRight size={14} /></button>
                  ) : (
                    <button onClick={handleSubmit} disabled={submitting || !files.resume} style={{ padding: '10px 22px', borderRadius: 12, background: 'linear-gradient(135deg,#059669,#10b981)', color: 'white', fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 4px 12px rgba(16,185,129,0.3)', opacity: submitting || !files.resume ? 0.5 : 1 }}>
                      {submitting ? (<><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Submitting...</>) : (<><CheckCircle2 size={14} /> Submit</>)}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div style={{ maxWidth: 500, margin: '50px auto', textAlign: 'center', animation: 'fadeUp 0.5s ease' }}>
              <div style={{ background: 'white', borderRadius: 28, padding: '48px 36px', boxShadow: '0 16px 48px rgba(99,102,241,0.12)', border: '1.5px solid rgba(99,102,241,0.1)' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><CheckCircle2 size={36} color="#059669" /></div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.4px' }}>Application Submitted! 🎉</h2>
                <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>Your application for <strong style={{ color: '#0f172a' }}>{selected?.position_title}</strong> has been received.</p>
                <div style={{ background: '#f8faff', borderRadius: 14, padding: '14px 18px', marginBottom: 22, border: '1.5px solid #e2e8f0' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Candidate ID</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#4f46e5', letterSpacing: '1px' }}>{candId}</div>
                </div>
                <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 22 }}>Our team will review and contact you shortly.</p>
                <button onClick={() => { setStep(0); setSelected(null); setFormData({ first_name:'',last_name:'',email:'',mobile_number:'',location:'',current_company:'',current_designation:'',total_experience:'',relevant_experience:'',current_ctc:'',expected_ctc:'',notice_period:'',reason_for_change:'' }); setFiles({ resume:null,payslips:null,increment_letter:null }); }} style={{ padding: '13px 26px', borderRadius: 14, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: 14, boxShadow: '0 6px 18px rgba(99,102,241,0.3)' }}>
                  Browse More Opportunities
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Aira Drawer ── */}
      {showAiraPanel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setShowAiraPanel(false)} style={{ flex: 1, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }} />
          <div style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '20px 20px 32px', maxHeight: '80vh', overflowY: 'auto', animation: 'drawerIn 0.35s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles size={16} color="#6366f1" /> Aira — Your Guide</div>
              <button onClick={() => setShowAiraPanel(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}><X size={16} color="#64748b" /></button>
            </div>
            <AiraSidebarContent speaking={speaking} airaMsg={airaMsg} jobCount={jobs.length} loading={loading} airaChat={airaChat} onToggleChat={() => setAiraChat(p => !p)} msgs={msgs} chatInput={chatInput} onChatInput={setChatInput} chatLoading={chatLoading} onSend={sendChat} chatEndRef={chatEndRef} />
          </div>
        </div>
      )}

      {/* Mobile floating Aira button when drawer is closed */}
      <button onClick={() => setShowAiraPanel(true)} style={{ position: 'fixed', bottom: 24, right: 20, zIndex: 400, width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', border: '3px solid white', boxShadow: '0 8px 24px rgba(99,102,241,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MessageCircle size={24} color="white" />
        {speaking && <div style={{ position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: '#10b981', border: '2px solid white' }} />}
      </button>
    </div>
  );
};

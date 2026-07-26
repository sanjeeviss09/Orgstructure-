import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, MessageCircle, Star, TrendingUp, Users, Award, Sparkles, CheckCircle, Briefcase, GraduationCap, Heart, Send, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CandidateHomePageProps {
  onEnterPortal: (type: 'candidate' | 'offered' | 'login') => void;
}

// ── Aira Animated SVG for Home Page ──────────────────────────────
const AiraHomeAvatar: React.FC<{ speaking: boolean; animated: boolean }> = ({ speaking, animated }) => {
  const [blink, setBlink] = useState(false);
  const [wave, setWave] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    if (animated) {
      const waveInterval = setInterval(() => {
        setWave(true);
        setTimeout(() => setWave(false), 1200);
      }, 5000);
      return () => clearInterval(waveInterval);
    }
  }, [animated]);

  return (
    <svg viewBox="0 0 200 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDDBB6" />
          <stop offset="100%" stopColor="#F5C89A" />
        </linearGradient>
        <linearGradient id="suitGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <radialGradient id="glowBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Glow circle behind */}
      <circle cx="100" cy="130" r="90" fill="url(#glowBg)" />

      {/* Body suit */}
      <g style={{ animation: speaking ? 'bodyTalk 0.4s ease-in-out infinite alternate' : 'bodyBreathe 4s ease-in-out infinite' }}>
        <style>{`
          @keyframes bodyBreathe { 0%,100%{transform:scaleY(1) translateY(0);} 50%{transform:scaleY(1.015) translateY(-1px);} }
          @keyframes bodyTalk { 0%{transform:scaleY(1);} 100%{transform:scaleY(1.02) translateY(-2px);} }
          @keyframes headBobble { 0%,100%{transform:translateY(0) rotate(0deg);} 25%{transform:translateY(-3px) rotate(1deg);} 75%{transform:translateY(1px) rotate(-0.5deg);} }
          @keyframes waveArm { 0%,100%{transform:rotate(0deg);} 25%{transform:rotate(-30deg);} 50%{transform:rotate(-50deg);} 75%{transform:rotate(-30deg);} }
          @keyframes idleArm { 0%,100%{transform:rotate(0deg);} 50%{transform:rotate(3deg);} }
          @keyframes floatParticle { 0%{transform:translateY(0) scale(1); opacity:1;} 100%{transform:translateY(-60px) scale(0); opacity:0;} }
          @keyframes sparkle { 0%,100%{transform:scale(0.8) rotate(0deg); opacity:0.7;} 50%{transform:scale(1.2) rotate(180deg); opacity:1;} }
        `}</style>

        {/* Torso */}
        <rect x="60" y="155" width="80" height="90" rx="14" fill="url(#suitGrad)" />
        {/* Suit lapels */}
        <polygon points="100,165 80,175 88,220 100,215" fill="#4338ca" />
        <polygon points="100,165 120,175 112,220 100,215" fill="#4338ca" />
        {/* Shirt */}
        <rect x="90" y="165" width="20" height="55" rx="4" fill="white" opacity="0.9" />
        {/* Buttons */}
        <circle cx="100" cy="178" r="2.5" fill="#c7d2fe" />
        <circle cx="100" cy="188" r="2.5" fill="#c7d2fe" />
        <circle cx="100" cy="198" r="2.5" fill="#c7d2fe" />

        {/* Left arm */}
        <g style={{ transformOrigin: '70px 165px', animation: wave ? 'waveArm 1.2s ease-in-out' : 'idleArm 3s ease-in-out infinite' }}>
          <rect x="42" y="158" width="28" height="16" rx="8" fill="url(#suitGrad)" />
          <rect x="35" y="166" width="22" height="14" rx="7" fill="url(#skinGrad)" />
        </g>

        {/* Right arm */}
        <g style={{ transformOrigin: '130px 165px', animation: 'idleArm 3s ease-in-out infinite 0.5s' }}>
          <rect x="130" y="158" width="28" height="16" rx="8" fill="url(#suitGrad)" />
          <rect x="143" y="166" width="22" height="14" rx="7" fill="url(#skinGrad)" />
        </g>

        {/* Legs */}
        <rect x="68" y="238" width="28" height="35" rx="8" fill="#3730a3" />
        <rect x="104" y="238" width="28" height="35" rx="8" fill="#3730a3" />
        {/* Shoes */}
        <ellipse cx="82" cy="273" rx="18" ry="7" fill="#1e1b4b" />
        <ellipse cx="118" cy="273" rx="18" ry="7" fill="#1e1b4b" />
      </g>

      {/* Neck */}
      <rect x="90" y="140" width="20" height="20" rx="4" fill="url(#skinGrad)" />

      {/* Head */}
      <g style={{ transformOrigin: '100px 110px', animation: 'headBobble 5s ease-in-out infinite' }}>
        {/* Face */}
        <ellipse cx="100" cy="110" rx="38" ry="42" fill="url(#skinGrad)" />

        {/* Hair */}
        <ellipse cx="100" cy="76" rx="40" ry="22" fill="url(#hairGrad)" />
        <rect x="62" y="72" width="76" height="30" rx="4" fill="url(#hairGrad)" />
        <ellipse cx="62" cy="100" rx="10" ry="22" fill="url(#hairGrad)" />
        <ellipse cx="138" cy="100" rx="10" ry="22" fill="url(#hairGrad)" />
        {/* Hair highlight */}
        <ellipse cx="90" cy="72" rx="15" ry="8" fill="#4c1d95" opacity="0.5" />

        {/* Eyes */}
        <ellipse cx="83" cy="108" rx={blink ? 6 : 6} ry={blink ? 1 : 7} fill="#1e293b" />
        <ellipse cx="117" cy="108" rx={blink ? 6 : 6} ry={blink ? 1 : 7} fill="#1e293b" />
        {/* Eye shine */}
        {!blink && <circle cx="86" cy="105" r="2" fill="white" />}
        {!blink && <circle cx="120" cy="105" r="2" fill="white" />}
        {/* Eyebrows */}
        <path d="M76 99 Q83 95 90 98" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M110 98 Q117 95 124 99" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* Nose */}
        <path d="M98 114 Q100 119 102 114" stroke="#d4956a" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* Mouth */}
        {speaking ? (
          <ellipse cx="100" cy="127" rx="9" ry="5" fill="#e05c7a" />
        ) : (
          <path d="M88 125 Q100 133 112 125" stroke="#e05c7a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}

        {/* Cheek blush */}
        <ellipse cx="74" cy="118" rx="8" ry="5" fill="#f9a8d4" opacity="0.35" />
        <ellipse cx="126" cy="118" rx="8" ry="5" fill="#f9a8d4" opacity="0.35" />

        {/* Earrings */}
        <circle cx="62" cy="112" r="4" fill="#818cf8" />
        <circle cx="138" cy="112" r="4" fill="#818cf8" />
        <circle cx="62" cy="118" r="2.5" fill="#c7d2fe" />
        <circle cx="138" cy="118" r="2.5" fill="#c7d2fe" />

        {/* AI badge on forehead */}
        <rect x="91" y="83" width="18" height="8" rx="3" fill="#4f46e5" opacity="0.85" />
        <text x="100" y="90" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold" fontFamily="system-ui">AI</text>
      </g>

      {/* Floating sparkles around Aira */}
      <circle cx="42" cy="80" r="4" fill="#818cf8" style={{ animation: 'sparkle 2s ease-in-out infinite' }} />
      <circle cx="158" cy="90" r="3" fill="#a78bfa" style={{ animation: 'sparkle 2.5s ease-in-out infinite 0.5s' }} />
      <circle cx="50" cy="150" r="2.5" fill="#c7d2fe" style={{ animation: 'sparkle 3s ease-in-out infinite 1s' }} />
      <circle cx="155" cy="60" r="3.5" fill="#6366f1" style={{ animation: 'sparkle 2s ease-in-out infinite 0.3s' }} />

      {/* Star particles */}
      <polygon points="38,60 40,54 42,60 48,60 43,64 45,70 40,66 35,70 37,64 32,60" fill="#fbbf24" opacity="0.8"
        style={{ animation: 'sparkle 3s ease-in-out infinite 1.2s', transformOrigin: '40px 62px' }} transform="scale(0.6)" />
    </svg>
  );
};

// ── Animated stat counter ─────────────────────────────────────────
const AnimatedCounter: React.FC<{ end: number; suffix: string; label: string; icon: React.ReactNode }> = ({ end, suffix, label, icon }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasStarted.current) {
        hasStarted.current = true;
        const duration = 2000;
        const step = end / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
          current = Math.min(current + step, end);
          setCount(Math.floor(current));
          if (current >= end) clearInterval(timer);
        }, 16);
      }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return (
    <div ref={ref} className="text-center group">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-3 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div className="text-3xl font-black text-slate-900">{count.toLocaleString('en-IN')}{suffix}</div>
      <div className="text-sm text-slate-500 font-medium mt-1">{label}</div>
    </div>
  );
};

// ── Chat bubble for Aira greetings ────────────────────────────────
const AiraSpeechBubble: React.FC<{ message: string; visible: boolean }> = ({ message, visible }) => (
  <div style={{
    position: 'absolute', right: 0, bottom: 'calc(100% + 12px)',
    background: 'white', borderRadius: '16px 16px 4px 16px',
    border: '1px solid #e2e8f0',
    padding: '14px 18px', maxWidth: 280, zIndex: 10,
    boxShadow: '0 10px 40px rgba(99,102,241,0.15)',
    opacity: visible ? 1 : 0, transform: visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.95)',
    transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
    pointerEvents: 'none'
  }}>
    <div style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      ✨ Aira — Enterprise AI
    </div>
    <div style={{ fontSize: 13, lineHeight: 1.55, color: '#1e293b', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
      {message}
    </div>
    <div style={{
      position: 'absolute', bottom: -6, right: 18,
      width: 12, height: 12, background: 'white',
      borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0',
      transform: 'rotate(45deg)', borderRadius: '0 0 3px 0'
    }} />
  </div>
);

// ── Journey step card ─────────────────────────────────────────────
const JourneyStep: React.FC<{ icon: React.ReactNode; title: string; desc: string; step: number; delay: number }> = ({ icon, title, desc, step, delay }) => (
  <div style={{
    animation: `slideUp 0.6s ease-out ${delay}ms both`,
    background: 'white', borderRadius: 20, padding: '24px 20px',
    border: '1px solid #e8edf5', boxShadow: '0 4px 20px rgba(99,102,241,0.08)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12,
    transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'default',
    position: 'relative', overflow: 'hidden'
  }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(99,102,241,0.18)'; }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(99,102,241,0.08)'; }}
  >
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 3,
      background: 'linear-gradient(90deg, #6366f1, #a78bfa)'
    }} />
    <div style={{
      position: 'absolute', top: 12, right: 14,
      fontSize: 11, fontWeight: 800, color: '#c7d2fe',
      fontFamily: 'monospace'
    }}>0{step}</div>
    <div style={{
      width: 56, height: 56, borderRadius: 16,
      background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#6366f1'
    }}>{icon}</div>
    <div style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>{title}</div>
    <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{desc}</div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────
export const CandidateHomePage: React.FC<CandidateHomePageProps> = ({ onEnterPortal }) => {
  const [bubbleIndex, setBubbleIndex] = useState(0);
  const [showBubble, setShowBubble] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'aira'; text: string }[]>([
    { role: 'aira', text: "Hi! I'm Aira 👋 I'm here to help you explore your career journey. You can ask me about the application process, what to expect in interviews, or how our offered candidates get onboarded!" }
  ]);
  const [airaSpeaking, setAiraSpeaking] = useState(false);
  const [showOfferLogin, setShowOfferLogin] = useState(false);
  const [offerId, setOfferId] = useState('');
  const [airaLoading, setAiraLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const bubbleMessages = [
    "Welcome to ORG Enterprise! 🌟 I'm Aira, your AI career companion. How can I guide you today?",
    "We've helped 500+ candidates find their dream roles. Your journey starts here! 🚀",
    "Already received an offer? Click 'Offered Candidate' to begin your personalized onboarding experience! 🎉",
    "Curious about our culture or interview process? Just ask me anything! 💼",
    "Every great career starts with a single step. Let's take yours together! ✨"
  ];

  useEffect(() => {
    const cycle = setInterval(() => {
      setShowBubble(false);
      setTimeout(() => {
        setBubbleIndex(prev => (prev + 1) % bubbleMessages.length);
        setShowBubble(true);
      }, 500);
    }, 6000);
    return () => clearInterval(cycle);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [chatMessages]);

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || airaLoading) return;
    setChatMessages(prev => [...prev, { role: 'user', text }]);
    setChatInput('');
    setAiraLoading(true);
    setAiraSpeaking(true);
    try {
      const res = await fetch('http://localhost:3001/api/ai-companion/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          role: 'Employee',
          activeTab: 'home',
          context: 'This is the ORG Enterprise candidate portal home page. User is either a job candidate or an offered employee who has not yet joined. They want to know about the company culture, career paths, interview process, onboarding, etc.',
          history: chatMessages.slice(-4).map(m => ({ role: m.role === 'aira' ? 'assistant' : 'user', content: m.text }))
        })
      });
      const data = await res.json();
      // Strip navigate tokens for home page
      const cleanReply = (data.reply || 'I am here to help!').replace(/\[NAVIGATE:[^\]]+\]/g, '').trim();
      setChatMessages(prev => [...prev, { role: 'aira', text: cleanReply }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'aira', text: "I'm having trouble connecting right now. Please try again shortly! 🙏" }]);
    } finally {
      setAiraLoading(false);
      setAiraSpeaking(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8faff 0%, #eef2ff 50%, #faf5ff 100%)', fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes orb1 { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(40px,-30px) scale(1.1); } 66% { transform: translate(-20px,20px) scale(0.95); } }
        @keyframes orb2 { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(-50px,20px) scale(0.9); } 66% { transform: translate(30px,-40px) scale(1.1); } }
        @keyframes orb3 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(20px,30px); } }
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.05); opacity: 1; } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes dotBounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        .aira-float { animation: float 4s ease-in-out infinite; }
        .shimmer-text {
          background: linear-gradient(90deg, #4f46e5, #a78bfa, #ec4899, #4f46e5);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        .dot-bounce span { display:inline-block; width:7px; height:7px; border-radius:50%; background:#6366f1; margin:0 2px; animation:dotBounce 1.3s ease-in-out infinite; }
        .dot-bounce span:nth-child(2){animation-delay:0.2s;}
        .dot-bounce span:nth-child(3){animation-delay:0.4s;}
        .chat-msg-user { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border-radius: 18px 18px 4px 18px; }
        .chat-msg-aira { background: white; border: 1px solid #e8edf5; color: #1e293b; border-radius: 18px 18px 18px 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
      `}</style>

      {/* ── Animated Background Orbs ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', animation: 'orb1 12s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '8%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)', animation: 'orb2 15s ease-in-out infinite 2s' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 70%)', animation: 'orb3 8s ease-in-out infinite' }} />
      </div>

      {/* ── Header ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(99,102,241,0.1)', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(79,70,229,0.4)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <span style={{ fontWeight: 900, fontSize: 16, color: '#1e293b', letterSpacing: '-0.5px' }}>ORG</span>
            <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 6, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Enterprise</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => setChatOpen(!chatOpen)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, border: '1.5px solid #e0e7ff', background: 'white', color: '#4f46e5', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
            <MessageCircle size={15} /> Chat with Aira
          </button>
          <button onClick={() => onEnterPortal('login')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 12, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(79,70,229,0.35)', transition: 'all 0.2s' }}>
            Employee Login <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 min-h-[calc(100vh-80px)]">
        {/* Left: Hero text */}
        <div style={{ animation: 'slideUp 0.8s ease-out both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: '#ede9fe', border: '1px solid #ddd6fe', marginBottom: 24 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', animation: 'pulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', letterSpacing: '0.05em' }}>Powered by Aira AI Enterprise Intelligence</span>
          </div>

          <h1 className="text-4xl lg:text-[54px] font-black text-slate-900 leading-tight mb-5 tracking-tight">
            Build Your<br />
            <span className="shimmer-text">Career Journey</span><br />
            With Intelligence
          </h1>

          <p style={{ fontSize: 17, color: '#475569', lineHeight: 1.7, marginBottom: 36, maxWidth: 460 }}>
            ORG's AI-powered career companion guides you through every step — from application to onboarding. Experience a career platform that truly understands you.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button onClick={() => onEnterPortal('candidate')} className="flex items-center gap-2 px-6 py-3 lg:px-7 lg:py-4 rounded-xl lg:rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black text-sm lg:text-base border-none cursor-pointer shadow-lg shadow-indigo-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/50 transition-all">
              <Briefcase size={18} /> Explore Career Opportunities
            </button>
            <button onClick={() => onEnterPortal('offered')} className="flex items-center gap-2 px-6 py-3 lg:px-7 lg:py-4 rounded-xl lg:rounded-2xl bg-white text-indigo-600 font-black text-sm lg:text-base border-2 border-indigo-100 cursor-pointer transition-all hover:bg-indigo-50">
              <Award size={18} /> I Have an Offer Letter 🎉
            </button>
          </div>

          {/* Social proof */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 32 }}>
            <div style={{ display: 'flex' }}>
              {['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'].map((c, i) => (
                <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: '2px solid white', marginLeft: i === 0 ? 0 : -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 700 }}>
                  {['S', 'R', 'M', 'A'][i]}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
              <span style={{ color: '#1e293b', fontWeight: 800 }}>500+</span> people joined this month
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1,2,3,4,5].map(s => <Star key={s} size={13} fill="#fbbf24" color="#fbbf24" />)}
            </div>
          </div>
        </div>

        {/* Right: Aira Avatar (Always visible on desktop) */}
        <div className="w-full flex justify-center items-center relative min-h-[350px] lg:min-h-[600px]">
          {/* Glowing ring */}
          <div style={{ position: 'absolute', inset: '10%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', animation: 'pulse 3s ease-in-out infinite' }} />

          {/* Aira */}
          <div className="aira-float relative cursor-pointer w-[240px] h-[300px] lg:w-[320px] lg:h-[400px]" onClick={() => setChatOpen(true)}>
            <AiraHomeAvatar speaking={airaSpeaking} animated={true} />

            {/* Speech Bubble */}
            <div style={{ position: 'absolute', top: -10, right: -10 }}>
              <AiraSpeechBubble message={bubbleMessages[bubbleIndex]} visible={showBubble && !chatOpen} />
            </div>

            {/* Click hint */}
            <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(79,70,229,0.1)', borderRadius: 100, padding: '6px 14px', fontSize: 11, color: '#4f46e5', fontWeight: 700, whiteSpace: 'nowrap' }}>
              <MessageCircle size={12} /> Click Aira to chat!
            </div>
          </div>

          {/* Floating achievement cards (desktop only) */}
          <div className="hidden lg:flex absolute -left-8 top-1/4 bg-white rounded-2xl p-3 shadow-[0_8px_30px_rgba(0,0,0,0.1)] border border-slate-100 items-center gap-3" style={{ animation: 'float 4s ease-in-out infinite 0.5s' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={18} color="#059669" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>Offer Accepted!</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Just now</div>
            </div>
          </div>

          <div className="hidden lg:flex absolute -right-8 bottom-1/3 bg-white rounded-2xl p-3 shadow-[0_8px_30px_rgba(0,0,0,0.1)] border border-slate-100 items-center gap-3" style={{ animation: 'float 4s ease-in-out infinite 1s' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="#6366f1" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>Career Growth</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>+35% this year</div>
            </div>
          </div>
        </div>
      </section>

      {/* Aira Chat Widget Overlay */}
      {chatOpen && (
        <div className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 w-[calc(100vw-32px)] lg:w-[420px] h-[600px] lg:h-[700px] z-[9999] bg-white rounded-3xl border border-slate-200 shadow-[0_25px_80px_rgba(79,70,229,0.25)] flex flex-col overflow-hidden fade-in">
          {/* Chat header */}
          <div style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.15)', padding: 4 }}>
              <AiraHomeAvatar speaking={airaSpeaking} animated={false} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, color: 'white', fontSize: 16 }}>Aira</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>● Online — Career Companion</div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.25)'} onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}>×</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16, background: '#f8fafc' }}>
            {chatMessages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                {m.role === 'aira' && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={14} color="white" />
                  </div>
                )}
                <div className={m.role === 'user' ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm shadow-md' : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-sm shadow-md'} style={{ maxWidth: '85%', padding: '12px 16px', fontSize: 14, lineHeight: 1.6, fontWeight: 500 }}>
                  {m.role === 'aira' ? (
                    <div className="aira-markdown">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({node, ...props}) => <div style={{ overflowX: 'auto', margin: '8px 0', borderRadius: 10, border: '1px solid #e2e8f0' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }} {...props} /></div>,
                          thead: ({node, ...props}) => <thead style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }} {...props} />,
                          th: ({node, ...props}) => <th style={{ padding: '8px 12px', color: 'white', fontWeight: 800, textAlign: 'left', whiteSpace: 'nowrap' }} {...props} />,
                          td: ({node, ...props}) => <td style={{ padding: '8px 12px', color: '#1e293b', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }} {...props} />,
                          p: ({node, ...props}) => <p style={{ margin: '4px 0' }} {...props} />,
                          ul: ({node, ...props}) => <ul style={{ margin: '6px 0', paddingLeft: 20 }} {...props} />,
                          li: ({node, ...props}) => <li style={{ marginBottom: 4 }} {...props} />,
                          strong: ({node, ...props}) => <strong style={{ fontWeight: 800, color: '#0f172a' }} {...props} />
                        }}
                      >
                        {m.text.replace(/\|\s*\|/g, '|\n|')}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    m.text
                  )}
                </div>
              </div>
            ))}
            {airaLoading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={14} color="white" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm shadow-md" style={{ padding: '12px 16px' }}>
                  <div className="dot-bounce"><span /><span /><span /></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick suggestions */}
          <div style={{ padding: '12px 16px', display: 'flex', gap: 8, overflowX: 'auto', background: 'white', borderTop: '1px solid #f1f5f9' }} className="no-scrollbar">
            {['What roles are open?', 'Interview tips', 'Company culture', 'Onboarding process'].map(q => (
              <button key={q} onClick={() => { setChatInput(q); }} style={{ padding: '6px 14px', borderRadius: 100, border: '1.5px solid #e0e7ff', background: '#fafbff', color: '#4f46e5', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='#ede9fe'} onMouseLeave={e => e.currentTarget.style.background='#fafbff'}>{q}</button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: '16px', borderTop: '1px solid #e8edf5', display: 'flex', gap: 10, background: 'white' }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !airaLoading && chatInput.trim()) {
                  sendChat();
                }
              }}
              placeholder="Ask Aira anything..."
              style={{ flex: 1, padding: '14px 18px', borderRadius: 16, border: '2px solid #e2e8f0', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', background: '#f8fafc', transition: 'border-color 0.2s' }}
              onFocus={e => e.currentTarget.style.borderColor='#818cf8'}
              onBlur={e => e.currentTarget.style.borderColor='#e2e8f0'}
            />
            <button onClick={sendChat} disabled={airaLoading || !chatInput.trim()} style={{ width: 50, height: 50, borderRadius: 16, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (airaLoading || !chatInput.trim()) ? 0.4 : 1, transition: 'transform 0.2s' }} onMouseEnter={e => { if(!airaLoading && chatInput.trim()) e.currentTarget.style.transform='scale(1.05)' }} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
              <Send size={20} color="white" />
            </button>
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      <section style={{ background: 'white', padding: '60px 32px', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40 }}>
          <AnimatedCounter end={500} suffix="+" label="Talents Placed" icon={<Users size={24} />} />
          <AnimatedCounter end={98} suffix="%" label="Satisfaction Rate" icon={<Heart size={24} />} />
          <AnimatedCounter end={35} suffix="+" label="Departments" icon={<Briefcase size={24} />} />
          <AnimatedCounter end={12} suffix="x" label="AI-Powered Screening" icon={<Sparkles size={24} />} />
        </div>
      </section>

      {/* ── Journey Steps ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 38, fontWeight: 900, color: '#0f172a', letterSpacing: '-1.5px', marginBottom: 12 }}>
            Your Journey with <span className="shimmer-text">Aira</span>
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', maxWidth: 500, margin: '0 auto' }}>
            From application to your first day — Aira guides you through every step of the process.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          <JourneyStep step={1} delay={100} icon={<Briefcase size={24} />}
            title="Apply Smartly"
            desc="Upload your resume and let Aira match you with the most suitable roles instantly." />
          <JourneyStep step={2} delay={200} icon={<MessageCircle size={24} />}
            title="Guided Interviews"
            desc="Aira coaches you on what to expect and how to prepare for your interview rounds." />
          <JourneyStep step={3} delay={300} icon={<Award size={24} />}
            title="Offer & Clarity"
            desc="Receive a personalized offer breakdown with full transparency on your compensation." />
          <JourneyStep step={4} delay={400} icon={<GraduationCap size={24} />}
            title="Smooth Onboarding"
            desc="Your first-day prep, team introductions, and learning roadmap — all ready before you join." />
        </div>
      </section>

      {/* ── CTA Cards ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, position: 'relative', zIndex: 1 }}>
        {/* Candidate card */}
        <div style={{
          borderRadius: 24, padding: '40px 36px',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: 'white', position: 'relative', overflow: 'hidden', cursor: 'pointer',
          transition: 'all 0.3s'
        }}
          onClick={() => onEnterPortal('candidate')}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'none'}
        >
          <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
          <div style={{ position: 'absolute', bottom: -20, left: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <Briefcase size={32} color="rgba(255,255,255,0.9)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 10 }}>I'm a Candidate</h3>
          <p style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.6, marginBottom: 24 }}>
            Browse open roles, submit your application, and get real-time AI guidance through your entire recruitment journey.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14 }}>
            Explore Opportunities <ArrowRight size={16} />
          </div>
        </div>

        {/* Offered candidate card */}
        <div style={{
          borderRadius: 24, padding: '40px 36px',
          background: 'white', border: '2px solid #e0e7ff',
          position: 'relative', overflow: 'hidden', cursor: 'pointer',
          transition: 'all 0.3s', boxShadow: '0 8px 30px rgba(99,102,241,0.1)'
        }}
          onClick={() => setShowOfferLogin(true)}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 40px rgba(99,102,241,0.2)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 30px rgba(99,102,241,0.1)'; }}
        >
          <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(99,102,241,0.04)' }} />
          <Award size={32} color="#4f46e5" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>I Have an Offer 🎉</h3>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
            Congratulations! Access your personalized onboarding experience, meet your team, and prepare for your exciting first day.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14, color: '#4f46e5' }}>
            Begin Onboarding <ArrowRight size={16} />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #e8edf5', padding: '32px', textAlign: 'center', fontSize: 13, color: '#94a3b8', fontWeight: 500, position: 'relative', zIndex: 1 }}>
        © 2026 ORG Enterprise Intelligence Platform · Powered by Aira AI · All rights reserved
      </footer>

      {showOfferLogin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 400, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} className="fade-in">
            <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Award size={24} color="#6366f1" />
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.5px' }}>Access Your Offer</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>Enter your unique Offer Number to view your package and begin your onboarding journey.</p>
            
            <input 
              value={offerId}
              onChange={e => setOfferId(e.target.value)}
              placeholder="e.g. OFR-2026-8921"
              style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: 14, fontWeight: 600, marginBottom: 16, outline: 'none' }}
            />
            
            <button 
              onClick={() => onEnterPortal('offered')}
              style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer', marginBottom: 20, boxShadow: '0 8px 20px rgba(99,102,241,0.3)' }}
            >
              View Offer Details
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ height: 1, flex: 1, background: '#e2e8f0' }} />
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Testing</div>
              <div style={{ height: 1, flex: 1, background: '#e2e8f0' }} />
            </div>

            <button 
              onClick={() => onEnterPortal('offered')}
              style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#f1f5f9', color: '#475569', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}
            >
              <FileText size={16} /> Quick Login as Offered
            </button>

            <button onClick={() => setShowOfferLogin(false)} style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'transparent', color: '#94a3b8', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AvatarSVG } from './AvatarSVG';
import { ChatPanel } from './ChatPanel';
import { AuthUser, Employee, Position } from '../../lib/api';
import './digital-human.css';
import { MessageCircle } from 'lucide-react';

type AiraState = 'idle' | 'greeting' | 'talking' | 'thinking' | 'celebrating' | 'pointing';

interface BubbleContent {
  text: string;
  subtext?: string;
}

interface DigitalHumanCompanionProps {
  user?: AuthUser;
  activeTab?: string;
  employees?: Employee[];
  positions?: Position[];
  onNavigate?: (tab: string) => void;
  context?: string;
}

// ── Context messages per tab ─────────────────────────────────
const getContextMessage = (tab: string, employees: Employee[], positions: Position[]): BubbleContent => {
  const active = employees.filter(e => e.employment_status === 'Active').length;
  const vacant = positions.filter(p => p.status === 'V').length;

  const msgs: Record<string, BubbleContent> = {
    dashboard: {
      text: `You have ${active} active employees today.`,
      subtext: 'Check your pending tasks below.'
    },
    orgchart: {
      text: `${vacant} position${vacant !== 1 ? 's are' : ' is'} currently vacant.`,
      subtext: 'Drag & drop to reassign roles.'
    },
    directory: {
      text: `${active} employees in the directory.`,
      subtext: 'Use filters to narrow your search.'
    },
    recruitment: {
      text: 'Candidates awaiting HR review.',
      subtext: 'Check the pipeline for updates.'
    },
    wellness: {
      text: 'Support sessions are open.',
      subtext: 'Employee feedback is updated.'
    },
    reports: {
      text: 'Your workforce reports are ready.',
      subtext: 'Export as PDF or Excel.'
    },
    templates: {
      text: 'Document templates are available.',
      subtext: 'Generate offer letters instantly.'
    },
    targets: {
      text: 'Set your HR targets here.',
      subtext: 'Changes reflect on the dashboard.'
    },
    manage_interns: {
      text: 'Intern management dashboard.',
      subtext: 'Track intern progress and evaluations.'
    },
    user_analytics: {
      text: 'Platform usage analytics ready.',
      subtext: 'See who\'s most active this week.'
    },
  };
  return msgs[tab] || { text: 'How can I assist you today?', subtext: 'Click me to chat!' };
};

export const DigitalHumanCompanion: React.FC<DigitalHumanCompanionProps> = ({ user, activeTab, employees = [], positions = [], onNavigate, context }) => {
  const [state, setState] = useState<AiraState>('greeting');
  const [chatOpen, setChatOpen] = useState(false);
  const [bubble, setBubble] = useState<BubbleContent | null>(null);
  const [bubbleExiting, setBubbleExiting] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  
  // Dragging state using translate transform instead of left/bottom to fix SSR and resize issues
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  const stateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const proactiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
  };

  // Show a bubble then auto-dismiss
  const showBubble = useCallback((content: BubbleContent, duration = 6000) => {
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    setBubbleExiting(false);
    setBubble(content);

    bubbleTimerRef.current = setTimeout(() => {
      setBubbleExiting(true);
      setTimeout(() => setBubble(null), 280);
    }, duration);
  }, []);

  // Transition state with auto-return to idle
  const transitionState = useCallback((newState: AiraState, duration = 4000) => {
    clearTimers();
    setState(newState);
    if (newState !== 'idle') {
      stateTimerRef.current = setTimeout(() => setState('idle'), duration);
    }
  }, []);

  // ── Initial greeting after login ─────────────────────
  useEffect(() => {
    if (hasGreeted || !user) return;
    setHasGreeted(true);

    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    const name = user.full_name?.split(' ')[0] || 'there';
    const active = employees.filter(e => e.employment_status === 'Active').length;

    setTimeout(() => {
      transitionState('greeting', 3500);
      showBubble({
        text: `${greet}, ${name}! 👋 Welcome back.`,
        subtext: `${active} active employees • Click me to ask anything.`
      }, 7000);
    }, 800);
  }, [user]);

  // ── React to tab changes ───────────────────────────────
  useEffect(() => {
    if (context === 'candidate_offer') {
      setState('greeting');
      setBubble({ text: "Hi! I'm Aira.", subtext: "I can help you review your offer and onboarding steps." });
    } else if (activeTab) {
      setState('thinking');
      const msg = getContextMessage(activeTab, employees, positions);
      setTimeout(() => {
        setBubble(msg);
        setState('idle');
      }, 800);
    }
  }, [activeTab, employees, positions, context]);

  // ── Proactive suggestions every 3 minutes ─────────────
  useEffect(() => {
    proactiveTimerRef.current = setTimeout(function proactiveCycle() {
      if (!chatOpen && state === 'idle' && activeTab) {
        const ctx = getContextMessage(activeTab, employees, positions);
        transitionState('pointing', 2000);
        showBubble(ctx, 5000);
      }
      proactiveTimerRef.current = setTimeout(proactiveCycle, 3 * 60 * 1000);
    }, 3 * 60 * 1000);

    return () => {
      if (proactiveTimerRef.current) clearTimeout(proactiveTimerRef.current);
    };
  }, [chatOpen, state, activeTab]);

  // ── Idle random micro-animations ──────────────────────
  useEffect(() => {
    if (state !== 'idle' || chatOpen) return;
    const idleAnims: AiraState[] = ['thinking', 'idle', 'idle'];
    const timer = setInterval(() => {
      const pick = idleAnims[Math.floor(Math.random() * idleAnims.length)];
      if (pick !== 'idle') transitionState(pick, 2200);
    }, 12000 + Math.random() * 8000);

    return () => clearInterval(timer);
  }, [state, chatOpen]);

  // Cleanup on unmount
  useEffect(() => () => clearTimers(), []);

  // ── Click handler ─────────────────────────────────────
  const handleClick = () => {
    // If we just dragged, don't open chat
    if (isDragging) return;
    if (chatOpen) return;
    transitionState('greeting', 1000);
    setChatOpen(true);
    setBubble(null);
  };

  // ── Drag Logic ────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag on left click
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    // Require a minimum 10px move to trigger drag mode to prevent click vs drag issues
    if (!isDragging && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      setIsDragging(true);
      if (chatOpen) setChatOpen(false); // Close chat while dragging
    }

    if (isDragging) {
      setPos({
        x: dragRef.current.startPosX + dx,
        y: dragRef.current.startPosY + dy
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    
    // If we didn't drag, treat it as a click (only if it wasn't on a button)
    if (!isDragging && (e.target as HTMLElement).tagName !== 'BUTTON') {
      handleClick();
    }
    
    // Small delay before clearing isDragging so the click handler can check it
    setTimeout(() => setIsDragging(false), 50);
  };

  // ── Aira is speaking (chat panel response) ─────────────
  const handleAiraSpeaking = (speaking: boolean) => {
    if (speaking) transitionState('talking', 8000);
    else setState('idle');
  };

  // ── Role-based greeting variation ─────────────────────
  const isExecutive = user ? ['Admin', 'Management'].includes(user.role) : false;

  return (
    <>
      {/* Chat Panel */}
      {chatOpen && user && activeTab && (
        <ChatPanel
          user={user}
          activeTab={activeTab}
          employees={employees}
          positions={positions}
          onClose={() => { setChatOpen(false); setState('idle'); }}
          onAiraSpeaking={handleAiraSpeaking}
          onNavigate={onNavigate}
          pos={pos}
        />
      )}

      {/* Digital Human Zone */}
      <div 
        className={`dh-zone ${isDragging ? 'dh-dragging' : ''} ${minimized ? 'dh-minimized' : ''}`}
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {minimized ? (
          <button
            className="dh-minimized-btn"
            onClick={(e) => {
              e.stopPropagation();
              setMinimized(false);
            }}
            onPointerDown={e => e.stopPropagation()}
            style={{
              width: 52, height: 52, borderRadius: '50%', border: 'none',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: 'white', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
            }}
            title="Open Aira"
          >
            <MessageCircle size={22} />
          </button>
        ) : (
          <>
            {/* Speech Bubble */}
            {bubble && !chatOpen && (
              <div className={`dh-bubble ${bubbleExiting ? 'exiting' : ''}`}>
                <div className="dh-bubble-name">
                  {isExecutive ? '✨ Aira — Executive Mode' : '💼 Aira'}
                </div>
                <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>
                  {bubble.text}
                </div>
                {bubble.subtext && (
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                    {bubble.subtext}
                  </div>
                )}
                <div className="dh-bubble-dot-tail" />
              </div>
            )}

            {/* Avatar */}
            <AvatarSVG state={state} size={140} onClick={handleClick} />

            {/* Label + minimize */}
            <div style={{
              marginTop: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3
            }}>
              <span style={{
                fontSize: 10, fontWeight: 800, color: '#6366f1',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                background: 'rgba(99,102,241,0.08)',
                padding: '2px 10px', borderRadius: 20,
                border: '1px solid rgba(99,102,241,0.2)'
              }}>
                Aira · AI Companion
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMinimized(true);
                }}
                onPointerDown={e => e.stopPropagation()}
                style={{
                  fontSize: 10, color: '#94a3b8', background: 'none', border: 'none',
                  cursor: 'pointer', fontWeight: 600, padding: '2px 6px', fontFamily: 'Inter, sans-serif'
                }}
                title="Minimize"
              >
                Hide
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

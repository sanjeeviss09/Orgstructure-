import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, Loader2, RotateCcw, ArrowRight, Paperclip } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AuthUser, Employee } from '../../lib/api';

interface Message {
  id: string;
  role: 'user' | 'aira';
  text: string;
  navTarget?: { tab: string; label: string };
  ts: number;
}

interface ChatPanelProps {
  user: AuthUser;
  activeTab: string;
  employees: Employee[];
  positions: any[];
  onClose: () => void;
  onAiraSpeaking: (speaking: boolean) => void;
  onNavigate?: (tab: string) => void;
  pos?: { left: number; bottom: number };
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Parse [NAVIGATE:tab:label] token from AI response
const parseNavigate = (text: string): { clean: string; nav?: { tab: string; label: string } } => {
  const match = text.match(/\[NAVIGATE:([\w_]+):([^\]]+)\]/);
  if (!match) return { clean: text.trim() };
  return {
    clean: text.replace(match[0], '').trim(),
    nav: { tab: match[1], label: match[2].trim() }
  };
};

// ── Markdown Renderer ────────────────────────────────────────
// Converts AI markdown response into structured React elements
const renderMessage = (text: string, isUser: boolean): React.ReactNode => {
  if (isUser) {
    return <span style={{ whiteSpace: 'pre-wrap' }}>{text}</span>;
  }

  // Pre-process $ to ₹
  const processedText = text.replace(/\$\s?([\d,]+(?:\.\d+)?)/g, '₹$1').replace(/\|\s*\|/g, '|\n|');

  return (
    <div className="aira-markdown" style={{ fontSize: 13, color: '#1e293b', fontWeight: 500, lineHeight: 1.6 }}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({node, ...props}) => <div style={{ overflowX: 'auto', margin: '8px 0', borderRadius: 10, border: '1px solid #e2e8f0' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }} {...props} /></div>,
          thead: ({node, ...props}) => <thead style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }} {...props} />,
          th: ({node, ...props}) => <th style={{ padding: '7px 10px', color: 'white', fontWeight: 700, textAlign: 'left', whiteSpace: 'nowrap' }} {...props} />,
          td: ({node, ...props}) => <td style={{ padding: '6px 10px', color: '#1e293b', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }} {...props} />,
          p: ({node, ...props}) => <p style={{ margin: '4px 0' }} {...props} />,
          ul: ({node, ...props}) => <ul style={{ margin: '6px 0', paddingLeft: 20 }} {...props} />,
          li: ({node, ...props}) => <li style={{ marginBottom: 4 }} {...props} />,
          strong: ({node, ...props}) => <strong style={{ fontWeight: 800, color: '#0f172a' }} {...props} />,
          code: ({node, ...props}) => <code style={{ background: '#f1f5f9', borderRadius: 4, padding: '2px 6px', fontSize: 11, fontFamily: 'monospace', color: '#4f46e5', fontWeight: 700 }} {...props} />
        }}
      >
        {processedText}
      </ReactMarkdown>
    </div>
  );
};

// ── Component ────────────────────────────────────────────────
export const ChatPanel: React.FC<ChatPanelProps> = ({
  user, activeTab, employees, positions, onClose, onAiraSpeaking, onNavigate, pos
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const name = user.full_name?.split(' ')[0] || 'there';
    setMessages([{
      id: 'intro',
      role: 'aira',
      text: `${greet}, ${name}! 👋 I'm Aira, your enterprise AI companion.\n\nI can help you with HR workflows, recruitment, org structure, CTC in **₹ (INR)**, and much more.\n\nWhat can I do for you today?`,
      ts: Date.now()
    }]);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 250);
  };

  const buildContext = () => {
    const activeCount = employees.filter(e => e.employment_status === 'Active').length;
    const vacantPositions = positions.filter(p => p.status === 'V').length;
    const TAB_LABELS: Record<string, string> = {
      dashboard: 'Main Dashboard', orgchart: 'Org Structure',
      directory: 'Employee Directory', recruitment: 'Recruitment Module',
      wellness: 'Support & Feedback', reports: 'Reports Center',
      templates: 'Document Templates', targets: 'Target Settings',
      manage_interns: 'Intern Management', user_analytics: 'User Analytics',
    };
    return `Current Tab: ${TAB_LABELS[activeTab] || activeTab}. Active employees: ${activeCount}. Vacant positions: ${vacantPositions}. User role: ${user.role}. Currency: Indian Rupees (₹ INR).`;
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now() + 'u', role: 'user', text, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    onAiraSpeaking(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai-companion/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          role: user.role,
          activeTab,
          context: buildContext(),
          history: messages.slice(-6).map(m => ({ role: m.role === 'aira' ? 'assistant' : 'user', content: m.text }))
        })
      });

      if (!res.ok) throw new Error('AI error');
      const data = await res.json();
      const { clean, nav } = parseNavigate(data.reply || '');
      setMessages(prev => [...prev, {
        id: Date.now() + 'a',
        role: 'aira',
        text: clean,
        navTarget: nav,
        ts: Date.now()
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 'err', role: 'aira',
        text: "I'm having trouble connecting right now. Please try again in a moment.",
        ts: Date.now()
      }]);
    } finally {
      setLoading(false);
      onAiraSpeaking(false);
    }
  };

  const clearChat = () => setMessages(prev => [prev[0]]);

  const suggestions = getSuggestions(activeTab);

  return (
    <div 
      className={`dh-chat-panel ${closing ? 'closing' : ''}`}
      style={pos ? { left: Math.min(pos.left - 440, window.innerWidth - 440) > 0 ? pos.left - 440 : pos.left + 160, bottom: pos.bottom, right: 'auto', transformOrigin: 'bottom right' } : {}}
    >
      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        padding: '14px 16px', display: 'flex', alignItems: 'center',
        gap: 10, flexShrink: 0
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)', border: '1.5px solid rgba(255,255,255,0.3)'
        }}>
          <Bot size={18} color="white" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: 'white', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>Aira</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
            {loading ? '✨ Thinking...' : '● Online — Enterprise AI Companion'}
          </div>
        </div>
        <button onClick={clearChat} title="Clear chat" style={{
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          cursor: 'pointer', color: 'rgba(255,255,255,0.85)', padding: '5px 7px',
          borderRadius: 8, display: 'flex', alignItems: 'center'
        }}>
          <RotateCcw size={13} />
        </button>
        <button onClick={handleClose} style={{
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          cursor: 'pointer', color: 'rgba(255,255,255,0.85)', padding: '5px 7px',
          borderRadius: 8, display: 'flex', alignItems: 'center'
        }}>
          <X size={14} />
        </button>
      </div>

      {/* ── Messages ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '14px 14px 6px',
        display: 'flex', flexDirection: 'column', gap: 12,
        background: '#fafbff'
      }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            alignItems: 'flex-end',
            gap: 8
          }}>
            {/* Aira avatar */}
            {msg.role === 'aira' && (
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, boxShadow: '0 2px 8px rgba(99,102,241,0.3)'
              }}>
                <Bot size={13} color="white" />
              </div>
            )}

            {/* Bubble */}
            <div style={{
              maxWidth: msg.role === 'user' ? '72%' : '88%',
              display: 'flex', flexDirection: 'column', gap: 6
            }}>
              <div style={{
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                  : 'white',
                color: msg.role === 'user' ? 'white' : '#1e293b',
                fontSize: 13,
                lineHeight: 1.55,
                fontWeight: 500,
                fontFamily: 'Inter, sans-serif',
                boxShadow: msg.role === 'user'
                  ? '0 4px 14px rgba(99,102,241,0.35)'
                  : '0 2px 10px rgba(0,0,0,0.07)',
                border: msg.role === 'aira' ? '1px solid #e8edf5' : 'none',
                wordBreak: 'break-word'
              }}>
                {renderMessage(msg.text, msg.role === 'user')}
              </div>

              {/* Navigate button */}
              {msg.navTarget && onNavigate && (
                <button
                  onClick={() => { onNavigate(msg.navTarget!.tab); handleClose(); }}
                  style={{
                    alignSelf: 'flex-start',
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 20,
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    color: 'white', border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 700,
                    fontFamily: 'Inter, sans-serif',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
                >
                  <ArrowRight size={13} />
                  {msg.navTarget.label}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(99,102,241,0.3)'
            }}>
              <Bot size={13} color="white" />
            </div>
            <div style={{
              background: 'white', borderRadius: '18px 18px 18px 4px',
              padding: '12px 16px', border: '1px solid #e8edf5',
              boxShadow: '0 2px 10px rgba(0,0,0,0.07)'
            }}>
              <div className="dh-typing-dots">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick Suggestions ── */}
      {suggestions.length > 0 && (
        <div style={{
          padding: '8px 14px 6px',
          borderTop: '1px solid #f0f2f8',
          background: '#fafbff',
          display: 'flex', gap: 6, flexWrap: 'wrap'
        }}>
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => { setInput(s); inputRef.current?.focus(); }}
              style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 20,
                border: '1.5px solid #e0e4f4', background: 'white',
                cursor: 'pointer', color: '#4f46e5', fontWeight: 700,
                transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
                whiteSpace: 'nowrap'
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Input ── */}
      <div style={{
        padding: '10px 14px 14px',
        borderTop: '1px solid #f0f2f8',
        background: 'white',
        display: 'flex', gap: 8, alignItems: 'center'
      }}>
        <button
          onClick={() => document.getElementById('aira-file-upload')?.click()}
          title="Attach File"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#64748b', display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '6px'
          }}
        >
          <Paperclip size={18} />
          <input type="file" id="aira-file-upload" style={{ display: 'none' }} onChange={(e) => {
            if (e.target.files?.length) {
              // Simulate file attach
              const file = e.target.files[0];
              setInput(prev => prev + (prev ? ' ' : '') + `[Attached File: ${file.name}] `);
            }
          }} />
        </button>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask Aira anything…"
          disabled={loading}
          style={{
            flex: 1, padding: '9px 14px', borderRadius: 12,
            border: '1.5px solid #e0e4f4', fontSize: 13,
            fontFamily: 'Inter, sans-serif', fontWeight: 500,
            outline: 'none', color: '#1e293b', background: '#fafbff',
            transition: 'border-color 0.2s'
          }}
          onFocus={e => (e.target.style.borderColor = '#6366f1')}
          onBlur={e => (e.target.style.borderColor = '#e0e4f4')}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          style={{
            width: 38, height: 38, borderRadius: 10, border: 'none', flexShrink: 0,
            background: input.trim() && !loading ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#e8edf5',
            color: input.trim() && !loading ? 'white' : '#94a3b8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            boxShadow: input.trim() && !loading ? '0 4px 12px rgba(99,102,241,0.4)' : 'none',
          }}
        >
          {loading
            ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
            : <Send size={14} />
          }
        </button>
      </div>
    </div>
  );
};

function getSuggestions(tab: string): string[] {
  const map: Record<string, string[]> = {
    dashboard:   ['Show budget report', 'Hiring summary?', 'Pending tasks?'],
    orgchart:    ['How many vacancies?', 'Department overview', 'CEO details?'],
    directory:   ['Who joined recently?', 'Active employees count?', 'Search employee'],
    recruitment: ['Candidates pending review', 'Upcoming interviews?', 'Open requisitions?'],
    wellness:    ['Open support sessions', 'Team morale summary'],
    reports:     ['Workforce analytics', 'Attrition rate?', 'Budget report'],
    templates:   ['Create offer letter', 'Policy template?'],
    targets:     ['Set headcount target', 'Budget planning help'],
  };
  return map[tab] || ['How can you help?', 'Platform guide'];
}

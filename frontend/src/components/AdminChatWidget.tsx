import React, { useEffect, useState, useRef } from 'react';
import { 
  AuthUser, Employee, CounsellingSession, 
  fetchCounsellingSessions, createCounsellingSession, 
  sendCounsellingMessage
} from '../lib/api';
import { MessageSquare, Send, X } from 'lucide-react';

interface AdminChatWidgetProps {
  user: AuthUser;
  employees: Employee[];
  onClose?: () => void;
}

export const AdminChatWidget: React.FC<AdminChatWidgetProps> = ({ user, employees, onClose }) => {
  const [sessions, setSessions] = useState<CounsellingSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [adminReplyText, setAdminReplyText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const pollingRef = useRef<number | null>(null);

  const myEmpId = user.employee_id || user.id;
  const isAdmin = user.role === 'Admin';

  // Fetch support sessions
  const loadSessions = async () => {
    try {
      // If employee, fetch only their own sessions. If admin, fetch all.
      const res = await fetchCounsellingSessions(!isAdmin ? myEmpId : undefined);
      setSessions(res);
    } catch (e) {
      console.error('Error fetching chat sessions', e);
    }
  };

  // Poll for messages periodically
  useEffect(() => {
    loadSessions();
    
    const interval = 3000;
    pollingRef.current = window.setInterval(() => {
      loadSessions();
    }, interval);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [user]);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, selectedSessionId]);

  const handleSendEmployeeMessage = async () => {
    if (!messageText.trim()) return;
    try {
      let activeSession = sessions[0];
      if (!activeSession) {
        // Create new session
        activeSession = await createCounsellingSession({ employee_id: myEmpId, topic: "General Support" });
      }
      await sendCounsellingMessage(activeSession.id, messageText, myEmpId);
      setMessageText('');
      await loadSessions();
    } catch (e) {
      alert('Failed to send message');
    }
  };

  const handleSendAdminReply = async (sessionId: string) => {
    if (!adminReplyText.trim()) return;
    try {
      await sendCounsellingMessage(sessionId, adminReplyText, myEmpId);
      setAdminReplyText('');
      await loadSessions();
    } catch (e) {
      alert('Failed to send reply');
    }
  };

  // Find employee details for lists
  const getEmployeeName = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.full_name : 'Support User';
  };

  const getEmployeeDesignation = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.designation : 'Employee';
  };

  // Selected session for admin or employee
  const currentSession = isAdmin 
    ? sessions.find(s => s.id === selectedSessionId)
    : sessions[0];

  return (
    <div className="w-full h-full bg-white flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md">
            <MessageSquare className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">
              {!isAdmin ? 'Confidential Admin Support' : (selectedSessionId ? getEmployeeName(currentSession?.employee_id || '') : 'Admin Support Inbox')}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              {!isAdmin ? 'Secure line to HR & Admin' : (selectedSessionId ? getEmployeeDesignation(currentSession?.employee_id || '') : `${sessions.length} active chats`)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isAdmin && selectedSessionId && (
            <button 
              onClick={() => setSelectedSessionId(null)}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors px-2 py-1 rounded bg-white/10"
            >
              Back
            </button>
          )}
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col">
            
            {/* 1. EMPLOYEE VIEW: Direct Thread to Admin */}
            {!isAdmin && (
              <div className="flex-1 flex flex-col overflow-hidden h-full">
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
                  <div className="text-center p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800 font-medium leading-relaxed mb-4">
                    Welcome to the direct support channel. Your conversation here is secure and visible only to system administrators.
                  </div>
                  
                  {currentSession?.messages.map((m, idx) => {
                    const isMe = m.sender_id === myEmpId;
                    return (
                      <div key={m.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                          isMe 
                            ? 'bg-indigo-600 text-white rounded-br-sm shadow-sm shadow-indigo-100' 
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                        }`}>
                          <div className="leading-normal">{m.text}</div>
                          <div className={`text-[9px] mt-1 font-semibold text-right ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {(!currentSession || currentSession.messages.length === 0) && (
                    <div className="text-center text-slate-400 text-xs py-10">
                      No message history yet. Type a message below to start a confidential chat with the Admin.
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input block */}
                <div className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
                  <input
                    type="text"
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendEmployeeMessage()}
                    placeholder="Ask a question or share feedback..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
                  />
                  <button
                    onClick={handleSendEmployeeMessage}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-100 active:scale-95 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 2. ADMIN VIEW: Inbox List or Active Thread */}
            {isAdmin && (
              <div className="flex-1 flex flex-col overflow-hidden h-full">
                
                {/* Inbox List Mode */}
                {!selectedSessionId && (
                  <div className="flex-1 overflow-y-auto">
                    {sessions.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 text-sm">
                        No support requests currently in the queue.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-150">
                        {sessions.map(s => {
                          const lastMsg = s.messages[s.messages.length - 1];
                          const hasAdminReplied = lastMsg ? lastMsg.sender_id !== s.employee_id : true;
                          return (
                            <div
                              key={s.id}
                              onClick={() => setSelectedSessionId(s.id)}
                              className={`p-4 hover:bg-slate-100/70 cursor-pointer transition-colors flex items-center gap-3 relative ${
                                !hasAdminReplied ? 'bg-indigo-50/40 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'
                              }`}
                            >
                              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 uppercase">
                                {getEmployeeName(s.employee_id).charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                  <div className={`text-sm truncate ${!hasAdminReplied ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                                    {getEmployeeName(s.employee_id)}
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    {lastMsg ? new Date(lastMsg.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 truncate mb-1">
                                  {getEmployeeDesignation(s.employee_id)}
                                </div>
                                <div className={`text-xs truncate ${!hasAdminReplied ? 'font-bold text-indigo-700' : 'text-slate-400'}`}>
                                  {lastMsg ? lastMsg.text : 'Opened support channel'}
                                </div>
                              </div>
                              {!hasAdminReplied && (
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 absolute right-4 top-1/2 -translate-y-1/2" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Chat Thread Mode */}
                {selectedSessionId && currentSession && (
                  <div className="flex-1 flex flex-col overflow-hidden h-full">
                    <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
                      {currentSession.messages.map((m, idx) => {
                        const isMe = m.sender_id === myEmpId;
                        return (
                          <div key={m.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                              isMe 
                                ? 'bg-indigo-600 text-white rounded-br-sm shadow-sm shadow-indigo-100' 
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                            }`}>
                              <div className="leading-normal">{m.text}</div>
                              <div className={`text-[9px] mt-1 font-semibold text-right ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Admin Reply Input */}
                    <div className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
                      <input
                        type="text"
                        value={adminReplyText}
                        onChange={e => setAdminReplyText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendAdminReply(currentSession.id)}
                        placeholder="Reply confidentially..."
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
                      />
                      <button
                        onClick={() => handleSendAdminReply(currentSession.id)}
                        className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-100 active:scale-95 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
    </div>
  );
};

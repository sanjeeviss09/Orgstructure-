import React, { useEffect, useState, useRef } from 'react';
import { 
  AuthUser, Employee, CounsellingSession, 
  fetchCounsellingSessions, createCounsellingSession, 
  sendCounsellingMessage
} from '../lib/api';
import { MessageSquare, Send, X, MessageCircle } from 'lucide-react';

interface AdminChatWidgetProps {
  user: AuthUser;
  employees: Employee[];
}

export const AdminChatWidget: React.FC<AdminChatWidgetProps> = ({ user, employees }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<CounsellingSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [adminReplyText, setAdminReplyText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const pollingRef = useRef<number | null>(null);

  const myEmpId = user.employee_id || user.id;
  const isAdmin = user.role === 'Admin' || user.role === 'Management';

  // Fetch support sessions
  const loadSessions = async () => {
    try {
      // If employee, fetch only their own sessions. If admin, fetch all.
      const res = await fetchCounsellingSessions(!isAdmin ? myEmpId : undefined);
      setSessions(res);

      // Simple unread calculation (if employee, count messages sent by someone else than employee; if admin, count messages from employee)
      let count = 0;
      res.forEach(s => {
        if (s.messages.length > 0) {
          const lastMsg = s.messages[s.messages.length - 1];
          if (!isAdmin) {
            if (lastMsg.sender_id !== myEmpId) count = 1;
          } else {
            if (lastMsg.sender_id === s.employee_id) count += 1;
          }
        }
      });
      setUnreadCount(count);
    } catch (e) {
      console.error('Error fetching chat sessions', e);
    }
  };

  // Poll for messages when open or periodically when closed (slower)
  useEffect(() => {
    loadSessions();
    
    const interval = isOpen ? 3000 : 10000;
    pollingRef.current = window.setInterval(() => {
      loadSessions();
    }, interval);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, user]);

  // Scroll to bottom helper
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sessions, isOpen, selectedSessionId]);

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
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-50 cursor-pointer active:scale-95 ${
          isOpen 
            ? 'bg-slate-900 text-white hover:bg-slate-800' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1 shadow-indigo-300/40'
        }`}
        title="Admin Support Chat"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Chat Drawer Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[380px] h-[550px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] bg-white border border-slate-200/80 shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden pop-in">
          
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
            
            {isAdmin && selectedSessionId && (
              <button 
                onClick={() => setSelectedSessionId(null)}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors px-2 py-1 rounded bg-white/10"
              >
                Back
              </button>
            )}
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
      )}
    </>
  );
};

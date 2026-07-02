import React, { useState } from 'react';
import { login, register, AuthUser } from '../lib/api';
import { Eye, EyeOff, Layers, Lock, User, AlertCircle } from 'lucide-react';
import { InternRegistration } from './InternRegistration';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMode, setLoginMode] = useState<'employee'|'intern_login'>('employee');
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);

  React.useEffect(() => {
    const handleShowReg = () => setShowRegistration(true);
    window.addEventListener('showInternRegister', handleShowReg);
    return () => window.removeEventListener('showInternRegister', handleShowReg);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (loginMode === 'employee') {
        if (isRegistering) {
          if (!fullName.trim()) throw new Error('Full Name is required');
          const user = await register(username.trim(), password, fullName.trim());
          onLogin(user);
        } else {
          const user = await login(username.trim(), password);
          onLogin(user);
        }
      } else {
        const { loginIntern } = await import('../lib/api');
        const intern = await loginIntern(username.trim(), password);
        onLogin({
          id: intern.id,
          username: intern.id,
          full_name: intern.name,
          role: 'Intern',
          employee_id: null,
          avatar: undefined
        } as AuthUser);
      }
    } catch (err: any) {
      const msg = err.message || '';
      const isFetchErr = msg.includes('fetch') || msg.includes('network') || msg.includes('Failed');
      setError(isFetchErr 
        ? '⚠️ Cannot connect to server. Please ensure the backend is running on port 3001.' 
        : (isRegistering ? 'Registration failed.' : 'Invalid credentials. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (showRegistration) {
    return <InternRegistration onCancel={() => setShowRegistration(false)} />;
  }

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4">
      {/* Background decorative circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-slate-900/[0.01] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-900/[0.02] rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 shadow-md mb-4">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">ORG</h1>
          <p className="text-slate-500 text-xs tracking-widest uppercase font-semibold">Enterprise Intelligence Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xl relative overflow-hidden">
          {/* Top Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
            <button 
              onClick={() => setLoginMode('employee')} 
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${loginMode === 'employee' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
            >
              Employee
            </button>
            <button 
              onClick={() => setLoginMode('intern_login')} 
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${loginMode === 'intern_login' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
            >
              Intern
            </button>
          </div>

          <h1 className="text-2xl font-black text-slate-900 mb-1.5 tracking-tight">
            {loginMode === 'employee' ? (isRegistering ? 'Create your account' : 'Welcome back') : 'Intern Portal'}
          </h1>
          <p className="text-sm text-slate-500 font-medium mb-6">
            {loginMode === 'employee' ? (isRegistering ? 'Sign up for a new account' : 'Sign in to your account') : 'Sign in with your INT ID'}
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5 text-red-600 text-sm fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {loginMode === 'employee' && isRegistering && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold text-slate-900 placeholder:font-medium placeholder:text-slate-400 transition-all outline-none"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={loginMode === 'employee' ? 'Enter username' : 'Enter INT ID (e.g. INT001)'}
                  autoComplete="username"
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900/10 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900/10 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Processing…
                </span>
              ) : (loginMode === 'employee' && isRegistering ? 'Activate Account' : 'Sign In')}
            </button>
          </form>

          {loginMode === 'employee' && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {isRegistering ? 'Already have an account? Sign In' : 'New User? Activate Account'}
              </button>
            </div>
          )}
          
          {loginMode === 'intern_login' && (
            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
               <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('showInternRegister'))} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                 New Intern? Register Here
               </button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button 
            onClick={() => window.location.href = '?portal=candidate'}
            className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 mx-auto bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 shadow-sm mb-6"
          >
            ← Back to Candidate Portal
          </button>
        </div>

        <div className="mt-2 pt-6 border-t border-slate-200/50 flex flex-col gap-2">
          <div className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mb-1">Quick Login (Testing)</div>
          <div className="flex gap-2">
            <button type="button" onClick={() => onLogin({ id: 'EMP001', username: 'admin', full_name: 'Admin User', role: 'Admin', employee_id: 'EMP001' })} className="flex-1 text-[11px] py-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold hover:bg-indigo-100 transition-colors">Admin</button>
            <button type="button" onClick={() => onLogin({ id: 'EMP002', username: 'manager', full_name: 'Manager User', role: 'Manager', employee_id: 'EMP002' })} className="flex-1 text-[11px] py-2 bg-purple-50 text-purple-700 rounded-lg font-bold hover:bg-purple-100 transition-colors">Manager</button>
            <button type="button" onClick={() => onLogin({ id: 'EMP003', username: 'employee', full_name: 'Employee User', role: 'Employee', employee_id: 'EMP003' })} className="flex-1 text-[11px] py-2 bg-blue-50 text-blue-700 rounded-lg font-bold hover:bg-blue-100 transition-colors">Employee</button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">© 2026 ORG Enterprise · Powered by Aira AI</p>
      </div>
    </div>
  );
};

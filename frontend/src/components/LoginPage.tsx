import React, { useState } from 'react';
import { login, AuthUser } from '../lib/api';
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
        const user = await login(username.trim(), password);
        onLogin(user);
      } else {
        const { loginIntern } = await import('../lib/api');
        const intern = await loginIntern(username.trim(), password);
        onLogin({
          id: intern.id,
          username: intern.id,
          full_name: intern.name,
          role: 'Intern',
          employee_id: intern.id
        } as AuthUser);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, roleType: 'employee' | 'intern' = 'employee') => {
    if (roleType === 'intern') {
      onLogin({
        id: 'INT999',
        username: 'INT999',
        full_name: 'Test Intern',
        role: 'Intern',
        employee_id: 'INT999'
      } as AuthUser);
      return;
    }

    setUsername(u);
    setPassword('password123');
    // We need to wait for state to update, then submit.
    // Easiest is to just call login directly
    setLoading(true);
    login(u, 'password123')
      .then(user => onLogin(user))
      .catch(err => setError(err.message || 'Login failed.'))
      .finally(() => setLoading(false));
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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Axxel</h1>
          <p className="text-slate-500 text-xs tracking-widest uppercase font-semibold">Org Structure Management</p>
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

          <h2 className="text-xl font-bold text-slate-900 mb-1">
            {loginMode === 'employee' ? 'Welcome back' : 'Intern Portal'}
          </h2>
          <p className="text-slate-500 text-sm mb-6 font-medium">
            {loginMode === 'employee' ? 'Sign in to your account' : 'Sign in with your INT ID'}
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5 text-red-600 text-sm fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3 text-center">Quick Login (Testing)</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => handleQuickLogin('marcus')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">Admin</button>
              <button type="button" onClick={() => handleQuickLogin('elena')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">Management</button>
              <button type="button" onClick={() => handleQuickLogin('liam')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">HOD</button>
              <button type="button" onClick={() => handleQuickLogin('michael')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">Manager</button>
              <button type="button" onClick={() => handleQuickLogin('alex')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">Employee</button>
              <button type="button" onClick={() => handleQuickLogin('INT999', 'intern')} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors border border-indigo-200">Intern</button>
            </div>
          </div>
          
          {loginMode === 'intern_login' && (
            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
               <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('showInternRegister'))} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                 New Intern? Register Here
               </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">© 2026 Axxel Corp · Secured by Antigravity</p>
      </div>
    </div>
  );
};

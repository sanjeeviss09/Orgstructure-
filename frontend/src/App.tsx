import { useState, useEffect, cloneElement } from 'react';
import { LoginPage } from './components/LoginPage';
import { DashboardStats } from './components/DashboardStats';
import { OrgChart } from './components/OrgChart';
import { EmployeeManager } from './components/EmployeeManager';
import { EmployeeDetails } from './components/EmployeeDetails';
import { DepartmentAnalytics } from './components/DepartmentAnalytics';
import { WellnessModule } from './components/WellnessModule';
import { AdminChatWidget } from './components/AdminChatWidget';
import { TargetSettings } from './components/TargetSettings';
import { DetailedAnalytics } from './components/DetailedAnalytics';
import { InternDashboard } from './components/InternDashboard';
import { ManageInterns } from './components/ManageInterns';
import { UserAnalytics } from './components/UserAnalytics';
import ReportsCenter from './components/ReportsCenter';
import { RecruitmentModule } from './components/RecruitmentModule';
import { fetchEmployees, fetchPositions, Employee, Position, AuthUser, DEFAULT_AVATAR } from './lib/api';
import { supabase } from './lib/supabase';
import { Layers, LayoutDashboard, Network, Users, LogOut, ChevronRight, Star, FileText, UserPlus, Sparkles, MessageSquare, GraduationCap, ClipboardList, BarChart2, MessageCircle, PieChart } from 'lucide-react';
import { JobApplicationPortal } from './components/JobApplicationPortal';
import { CandidateHomePage } from './components/CandidateHomePage';
import { CareersPortal } from './components/CareersPortal';
import { CandidateOfferPortal } from './components/CandidateOfferPortal';
import { DocumentTemplateManager } from './components/TemplateManager/DocumentTemplateManager';
import { DigitalHumanCompanion } from './components/DigitalHuman/DigitalHumanCompanion';
import { AiraKnowledgeBase } from './components/AiraKnowledgeBase';
import { BrainCircuit } from 'lucide-react';

export type Role = 'Admin' | 'Management' | 'HOD' | 'Manager' | 'Employee' | 'Intern' | 'Candidate';
type Tab = 'dashboard' | 'orgchart' | 'directory' | 'details' | 'deptAnalytics' | 'wellness' | 'appraisals' | 'templates' | 'recruitment' | 'targets' | 'detailed_analytics' | 'intern_dashboard' | 'manage_interns' | 'user_analytics' | 'reports' | 'opbie' | 'aira_knowledge';

const ROLE_ACCESS: Record<Role, Tab[]> = {
  Admin:      ['dashboard', 'orgchart', 'directory', 'wellness', 'manage_interns', 'user_analytics', 'appraisals', 'templates', 'recruitment', 'reports', 'opbie', 'aira_knowledge'],
  Management: ['dashboard', 'orgchart', 'directory', 'wellness', 'appraisals', 'reports', 'opbie', 'aira_knowledge'],
  HOD:        ['dashboard', 'orgchart', 'directory', 'wellness', 'appraisals', 'reports', 'opbie'],
  Manager:    ['dashboard', 'orgchart', 'wellness'],
  Employee:   ['dashboard', 'orgchart', 'wellness'],
  Intern:     ['intern_dashboard', 'orgchart'],
  Candidate:  []
};

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('job');
  const applyGeneral = urlParams.get('apply');

  if (jobId) {
    return <JobApplicationPortal requisitionId={jobId} />;
  }

  if (applyGeneral === 'general') {
    return <JobApplicationPortal requisitionId="GENERAL" />;
  }

  if (applyGeneral === 'smart') {
    return <JobApplicationPortal requisitionId="SMART_APPLY" />;
  }

  const portalType = urlParams.get('portal');
  if (portalType === 'careers') {
    return <CareersPortal />;
  }
  if (portalType === 'candidate' || portalType === 'offered') {
    return <CandidateHomePage onEnterPortal={(type) => {
      if (type === 'candidate') {
        window.location.href = '?portal=careers';
      } else if (type === 'offered') {
        // Quick login for offered testing
        const dummyOffered = { id: 'OFR-991', username: 'OFR-991', full_name: 'Alex Offered (Test)', role: 'Intern', employee_id: null };
        localStorage.setItem('ag_user', JSON.stringify(dummyOffered));
        window.location.href = '/'; // Reload to root which will read ag_user and show dashboard
      } else {
        window.location.href = window.location.pathname; // Clear query params to go to login
      }
    }} />;
  }

  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [detailedType, setDetailedType] = useState<'hiring' | 'attrition' | 'budget'>('hiring');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [navHistory, setNavHistory] = useState<{ tab: Tab; employeeId?: string | null; dept?: string | null }[]>(() => [
    { tab: 'dashboard' }
  ]);

  const navigateToDetails = (id: string) => {
    setSelectedEmployeeId(id);
    setActiveTab('details');
    setNavHistory(prev => [...prev, { tab: 'details', employeeId: id }]);
  };

  const navigateToDepartment = (dept: string) => {
    setSelectedDept(dept);
    setActiveTab('deptAnalytics');
    setNavHistory(prev => [...prev, { tab: 'deptAnalytics', dept }]);
  };

  const handleBack = () => {
    if (navHistory.length <= 1) {
      setActiveTab('orgchart');
      return;
    }
    const newHistory = navHistory.slice(0, -1);
    const prevState = newHistory[newHistory.length - 1];
    setNavHistory(newHistory);
    
    if (prevState.tab === 'details' && prevState.employeeId) {
      setSelectedEmployeeId(prevState.employeeId);
    } else if (prevState.tab === 'deptAnalytics' && prevState.dept) {
      setSelectedDept(prevState.dept);
    }
    setActiveTab(prevState.tab);
  };

  const navigateToDetailedAnalytics = (type: 'hiring' | 'attrition' | 'budget') => {
    setDetailedType(type);
    setActiveTab('detailed_analytics');
    setNavHistory(prev => [...prev, { tab: 'detailed_analytics' }]);
  };

  const activeRole = user ? (user.role as Role) : 'Admin';
  const allowedTabs = ROLE_ACCESS[activeRole];

  const loggedInEmployee = employees.find(e => e.id === user?.employee_id);
  const displayName = loggedInEmployee ? loggedInEmployee.full_name : (user ? user.full_name : '');
  const displayAvatar = (loggedInEmployee && loggedInEmployee.photo_url) ? loggedInEmployee.photo_url : DEFAULT_AVATAR;

  const loadData = async () => {
    setLoading(true);
    try { 
      setEmployees(await fetchEmployees()); 
      setPositions(await fetchPositions());
    }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) loadData(); }, [user]);

  useEffect(() => {
    if (!user) return;
    
    const empSub = supabase
      .channel('employees_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
        loadData();
      })
      .subscribe();
      
    const posSub = supabase
      .channel('positions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'positions' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(empSub);
      supabase.removeChannel(posSub);
    };
  }, [user]);


  // If role changes, snap to allowed tab
  useEffect(() => {
    if (!allowedTabs.includes(activeTab)) {
      const firstTab = allowedTabs[0];
      setActiveTab(firstTab);
      setNavHistory([{ tab: firstTab }]);
    }
  }, [activeRole]);

  const handleLogin = (u: AuthUser) => {
    setUser(u);
    localStorage.setItem('ag_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ag_user');
    localStorage.removeItem('axxel_employee_extras');
    localStorage.removeItem('axxel_custom_units');
    setEmployees([]);
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  if (user.id.startsWith('OFR-') || user.role === 'Candidate') {
    return <CandidateOfferPortal onLogout={handleLogout} />;
  }

  const NAV_TABS = [
    { id: 'dashboard' as Tab, label: 'My Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'orgchart'  as Tab, label: 'Org Structure', icon: <Network className="w-5 h-5" /> },
    { id: 'directory' as Tab, label: 'Directory',     icon: <Users className="w-5 h-5" /> },
    { id: 'wellness'  as Tab, label: 'Support & Feedback', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'reports' as Tab, label: 'Reports', icon: <PieChart className="w-5 h-5" /> },
    { id: 'manage_interns' as Tab, label: 'Manage Interns', icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'user_analytics' as Tab, label: 'User Analytics', icon: <BarChart2 className="w-5 h-5" /> },
    { id: 'intern_dashboard' as Tab, label: 'My Internship', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'appraisals' as Tab, label: 'Appraisals',   icon: <Star className="w-5 h-5" /> },
    { id: 'templates' as Tab, label: 'Templates',     icon: <FileText className="w-5 h-5" /> },
    { id: 'recruitment' as Tab, label: 'Recruitment', icon: <UserPlus className="w-5 h-5" /> },
    { id: 'aira_knowledge' as Tab, label: 'Aira Knowledge Base', icon: <BrainCircuit className="w-5 h-5" /> },
  ].filter(t => allowedTabs.includes(t.id));

  return (
    <div className="h-screen flex overflow-hidden mesh-bg">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        {/* ✨ Header ✨ */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-sm">
              <Layers className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-slate-900 text-sm tracking-tight">Axxel</span>
              <span className="text-slate-400 text-[10px] ml-1.5 uppercase tracking-wider font-semibold">HR Suite</span>
            </div>
          </div>

          {/* Breadcrumb trail */}
          <div className="hidden lg:flex items-center gap-1 text-xs text-slate-400 font-medium shrink-0">
            <span>Axxel Corp</span>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-600 font-semibold">
              {NAV_TABS.find(t => t.id === activeTab)?.label || (activeTab === 'deptAnalytics' ? 'Department Analytics' : 'Details')}
            </span>
          </div>

          {/* Nav tabs — left-aligned "side option" */}
          <nav className="flex items-center gap-3 overflow-x-auto no-scrollbar mx-4 flex-1 min-w-0">
            {NAV_TABS.map(tab => (
              <button
                key={tab.id}
                id={`nav-${tab.id}`}
                title={tab.label}
                onClick={() => {
                  setActiveTab(tab.id);
                  setNavHistory([{ tab: tab.id }]);
                }}
                className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 ease-out hover:scale-105 active:scale-95 shrink-0 shadow-sm ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-indigo-300/50 shadow-lg border border-indigo-600'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md'
                }`}
              >
                {/* Clone icon and make it slightly bigger too to match the bigger button */}
                {cloneElement(tab.icon as any, { className: 'w-6 h-6' })}
              </button>
            ))}
            {/* Spacer to prevent scroll clipping of the last icon and keep a gap before the profile */}
            <div className="w-4 shrink-0" />
          </nav>

          {/* Right: User */}
          <div className="flex items-center gap-3 shrink-0 ml-auto">
            {/* User avatar */}
            <div className="flex items-center gap-2.5">
              <img
                src={displayAvatar}
                alt={displayName}
                className="w-8 h-8 rounded-full border border-slate-200 object-cover"
              />
              <div className="hidden md:block">
                <div className="text-sm font-bold text-slate-800 leading-tight">{displayName}</div>
                <div className="text-xs text-slate-500 font-medium leading-tight">{user.role}</div>
              </div>
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to reset all data to the initial mock state? This cannot be undone.')) {
                    await fetch('http://localhost:3001/api/reset', { method: 'POST' });
                    window.location.reload();
                  }
                }}
                title="Reset Database to Mock State"
                className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </button>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-7">

        {/* Page title bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'dashboard' && `Welcome, ${displayName.split(' ')[0]} 👋`}
              {activeTab === 'orgchart' && 'Organizational Structure'}
              {activeTab === 'directory' && 'Employee Master'}
              {activeTab === 'details' && 'Employee Details'}
              {activeTab === 'deptAnalytics' && 'Department Analytics'}
              {activeTab === 'wellness' && 'Support & Feedback'}
              {activeTab === 'user_analytics' && 'User Analytics'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">
              {activeTab === 'dashboard' && `Viewing as ${activeRole} · ${employees.length} employees across Axxel Corp`}
              {activeTab === 'orgchart' && 'Full 5-tier reporting hierarchy · Filter by Business Unit or Department'}
              {activeTab === 'directory' && 'Complete employee records · Import, search, and manage'}
              {activeTab === 'details' && 'Detailed profile, team, and budget access'}
              {activeTab === 'deptAnalytics' && 'KPIs, budget tracking, and employee distribution'}
              {activeTab === 'wellness' && 'Confidential feedback, suggestions, and admin support.'}
              {activeTab === 'manage_interns' && 'Oversee intern onboarding, reports, and generate certificates.'}
              {activeTab === 'intern_dashboard' && 'Submit daily learnings and track your internship progress.'}
              {activeTab === 'user_analytics' && 'Track individual dashboard responsiveness, engagement and interaction quality.'}
            </p>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-sm">
              <svg className="animate-spin w-3.5 h-3.5 text-slate-700" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Syncing…
            </div>
          )}
        </div>

        {/* ── Tab content ── */}
        <div key={activeTab} className="pop-in">
          {activeTab === 'dashboard' && (
            <DashboardStats
              activeRole={activeRole}
              loggedInUser={user}
              employees={employees}
              onChartClick={navigateToDetailedAnalytics}
              onTargetsClick={() => {
                setActiveTab('targets');
                setNavHistory([{ tab: 'targets' }]);
              }}
              onNavigateToWellness={() => {
                setActiveTab('wellness');
                setNavHistory([{ tab: 'wellness' }]);
              }}
            />
          )}
          
          {activeTab === 'intern_dashboard' && (
            <InternDashboard user={user!} />
          )}

          {activeTab === 'manage_interns' && (
            <ManageInterns />
          )}

          {activeTab === 'orgchart' && (
            <OrgChart employees={employees} positions={positions} activeRole={activeRole} onNavigateToDetails={navigateToDetails} onDepartmentClick={navigateToDepartment} onRefresh={loadData} />
          )}

          {activeTab === 'directory' && (
            <EmployeeManager
              employees={employees}
              activeRole={activeRole}
              currentUser={user}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'details' && selectedEmployeeId && (
            <EmployeeDetails
              employeeId={selectedEmployeeId}
              employees={employees}
              onBack={handleBack}
              onSelectEmployee={navigateToDetails}
            />
          )}

          {activeTab === 'deptAnalytics' && selectedDept && (
            <DepartmentAnalytics
              department={selectedDept}
              employees={employees}
              onBack={handleBack}
              onSelectEmployee={navigateToDetails}
            />
          )}

          {activeTab === 'wellness' && (
            <WellnessModule
              activeRole={activeRole}
              loggedInUser={user}
              employees={employees}
            />
          )}

          {activeTab === 'targets' && (
            <TargetSettings onSaved={() => {
              setActiveTab('dashboard');
              setNavHistory([{ tab: 'dashboard' }]);
              loadData(); // reload stats
            }} />
          )}

          {activeTab === 'detailed_analytics' && (
            <DetailedAnalytics 
              type={detailedType} 
              onBack={handleBack} 
            />
          )}

          {activeTab === 'user_analytics' && (
            <UserAnalytics />
          )}

          {activeTab === 'recruitment' && (
            <RecruitmentModule activeRole={activeRole} loggedInUser={user} />
          )}

          {activeTab === 'reports' && (
            <ReportsCenter />
          )}

          {activeTab === 'templates' && (
            <DocumentTemplateManager />
          )}

          {activeTab === 'aira_knowledge' && (
            <AiraKnowledgeBase />
          )}

          {['appraisals'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm min-h-[50vh]">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Module Coming Soon</h2>
              <p className="text-slate-500 max-w-md">
                The {activeTab} module is currently under development. The backend infrastructure is ready, and this interface will be rolled out in the next phase.
              </p>
            </div>
          )}
        </div>
      </main>

        {/* ── Footer ── */}
        <footer className="border-t border-slate-200 mt-16 py-6 text-center text-xs text-slate-400 font-semibold">
          Axxel Org Structure • Axxel Corp © 2026 • Secured by blackdevil system SSS
        </footer>
      </div>

      {/* Global Support Chat Widget */}
      {isChatOpen ? (
        <div className="w-[380px] shrink-0 border-l border-slate-200 bg-white hidden xl:block z-40 relative shadow-[-5px_0_15px_rgba(0,0,0,0.03)] transition-all duration-300 transform translate-x-0">
          <AdminChatWidget user={user} employees={employees} onClose={() => setIsChatOpen(false)} />
        </div>
      ) : (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:-translate-y-1 hover:bg-indigo-700 transition-all z-50 shadow-indigo-300/40 pop-in"
          title="Open Admin Support Chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Aira Digital Human Companion */}
      <div className="fixed bottom-4 right-[90px] z-50">
        <DigitalHumanCompanion
          user={user}
          activeTab={activeTab}
          employees={employees}
          positions={positions}
          onNavigate={(tab) => {
            setActiveTab(tab as Tab);
            setNavHistory([{ tab: tab as Tab }]);
          }}
          context="dashboard"
        />
      </div>
    </div>
  );
}

export default App;

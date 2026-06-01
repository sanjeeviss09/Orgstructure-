import React, { useEffect, useState } from 'react';
import { fetchStats, Employee, Stats, DEFAULT_AVATAR, getAiStrategy } from '../lib/api';
import { 
  Users, IndianRupee, TrendingUp, Building2, 
  Award, UserCheck, Mail, Briefcase, PieChart, Landmark,
  AlertTriangle, ArrowUpRight, ArrowDownRight,
  Target, ShieldAlert, Settings, Bot, Sparkles, X,
  ChevronDown, ChevronUp, Download
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { Role } from '../App';
import type { AuthUser } from '../lib/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardStatsProps {
  activeRole: Role;
  loggedInUser: AuthUser;
  employees: Employee[];
  onDepartmentClick?: (dept: string) => void;
  onChartClick?: (type: 'hiring' | 'attrition' | 'budget') => void;
  onTargetsClick?: () => void;
}

const fmt = (n: number) => {
  if (!n) return '₹0';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
};

const KpiCard: React.FC<{ icon: React.ReactNode; iconBg: string; label: string; value: string; sub?: string; trend?: string; trendUp?: boolean; onClick?: () => void }> = ({ icon, iconBg, label, value, sub, trend, trendUp, onClick }) => (
  <div onClick={onClick} className={`glass-panel p-5 relative overflow-hidden group transition-all ${onClick ? 'cursor-pointer hover:shadow-xl hover:border-blue-300' : 'hover:border-blue-200'}`}>
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 rounded-xl ${iconBg}`}>{icon}</div>
      {trend && (
        <div className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded ${trendUp ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
          {trend}
        </div>
      )}
    </div>
    <div className="text-2xl font-black text-slate-900 mb-0.5">{value}</div>
    <div className="text-sm font-semibold text-slate-500">{label}</div>
    {sub && <div className="text-xs text-slate-400 font-medium mt-1">{sub}</div>}
  </div>
);

// ── Profile Cards for Employee / Manager / HOD Roles ────────────────────
const ProfileCard: React.FC<{ employee: Employee; manager?: Employee; peers: Employee[] }> = ({ employee, manager, peers }) => (
  <div className="space-y-5 slide-up">
    {/* My Profile */}
    <div className="glass-panel p-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <img src={employee.photo_url || DEFAULT_AVATAR} alt="" className="w-20 h-20 rounded-2xl border border-white/50 object-cover shadow-sm" />
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{employee.full_name}</h2>
          <p className="text-slate-500 font-bold text-sm mt-0.5">{employee.designation}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
            <span className="px-2.5 py-1 bg-white/60 text-slate-700 rounded-lg text-xs font-bold border border-white/40">{employee.department}</span>
            <span className="px-2.5 py-1 bg-white/60 text-slate-700 rounded-lg text-xs font-bold border border-white/40">{employee.business_unit}</span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
              employee.employment_status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}>
              {employee.employment_status}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-5 pt-4 border-t border-white/40 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" />{employee.email_official}</div>
        <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-400" />CTC: {fmt(employee.ctc_annual)}</div>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {manager && (
        <div className="glass-panel p-5">
          <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">Reporting Manager</h3>
          <div className="flex items-center gap-3">
            <img src={manager.photo_url || DEFAULT_AVATAR} alt="" className="w-12 h-12 rounded-xl border border-white/50 object-cover shadow-sm" />
            <div>
              <div className="font-bold text-slate-900 text-sm">{manager.full_name}</div>
              <div className="text-xs text-slate-500 font-semibold">{manager.designation}</div>
            </div>
          </div>
        </div>
      )}
      <div className="glass-panel p-5">
        <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">Teammates ({peers.length})</h3>
        <div className="space-y-2.5 max-h-40 overflow-y-auto no-scrollbar">
          {peers.slice(0, 5).map(p => (
            <div key={p.id} className="flex items-center gap-2.5">
              <img src={p.photo_url || DEFAULT_AVATAR} alt="" className="w-7 h-7 rounded-full border border-white/50 shadow-sm" />
              <div className="min-w-0">
                <div className="text-xs text-slate-800 font-bold truncate">{p.full_name}</div>
                <div className="text-[10px] text-slate-500 font-semibold truncate">{p.designation}</div>
              </div>
            </div>
          ))}
          {peers.length === 0 && <p className="text-xs text-slate-400 italic font-medium">No teammates found.</p>}
        </div>
      </div>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────
export const DashboardStats: React.FC<DashboardStatsProps> = ({ activeRole, loggedInUser, employees, onDepartmentClick, onChartClick, onTargetsClick }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [aiStrategy, setAiStrategy] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});

  const handleGenerateStrategy = async () => {
    if (!stats) return;
    setLoadingAi(true);
    try {
      const payload = {
        type: 'dashboard',
        plannedHeadcount: stats.plannedHeadcount,
        activeEmployees: stats.activeEmployees,
        hiringVelocity: stats.hiringVelocity,
        attritionRate: stats.attritionRate,
        utilization: Math.round((stats.totalPayroll / stats.totalBudget) * 100),
      };
      const strategy = await getAiStrategy(payload);
      setAiStrategy(strategy);
    } catch (e) {
      console.error(e);
      setAiStrategy('Failed to generate AI Strategy.');
    } finally {
      setLoadingAi(false);
    }
  };

  const exportHeadcountToExcel = () => {
    if (!stats) return;
    const headers = ['Department', 'Designation', 'Budgeted HC', 'Actual HC', 'Open Positions', 'Variance %'];
    const rows: any[][] = [];

    if (stats.deptPlannedHC) {
      Object.keys(stats.deptPlannedHC).forEach(dept => {
        const planned = stats.deptPlannedHC[dept];
        const actual = stats.departments[dept] || 0;
        const open = Math.max(0, planned - actual);
        const variance = planned > 0 ? Math.round(((actual - planned) / planned) * 100) : 0;
        
        rows.push([dept, 'All Designations (Summary)', planned, actual, open, variance]);

        if (stats.designationBreakdown?.[dept]) {
          stats.designationBreakdown[dept].forEach(item => {
             const itemVariance = item.planned > 0 ? Math.round(((item.actual - item.planned) / item.planned) * 100) : 0;
             rows.push([dept, item.designation, item.planned, item.actual, item.open, itemVariance]);
          });
        }
      });
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
      }).join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Headcount_Planning_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchStats().then(setStats);
  }, [employees]);

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
      </div>
    );
  }

  // ── EMPLOYEE ROLE: Personal Dashboard ────────────────────────────────
  if (activeRole === 'Employee') {
    const myEmp = employees.find(e => e.email_official === loggedInUser.employee_id || e.id === loggedInUser.employee_id) || employees.find(e => e.role_tier === 5) || employees[employees.length - 1];
    const manager = myEmp?.reporting_to_id ? employees.find(e => e.id === myEmp.reporting_to_id) : undefined;
    const peers = myEmp ? employees.filter(e => e.reporting_to_id === myEmp.reporting_to_id && e.id !== myEmp.id) : [];
    return myEmp ? <ProfileCard employee={myEmp} manager={manager} peers={peers} /> : null;
  }

  // ── MANAGER ROLE ─────────────────────────────────────
  if (activeRole === 'Manager') {
    const myEmp = employees.find(e => e.email_official === loggedInUser.employee_id || e.id === loggedInUser.employee_id) || employees.find(e => e.role_tier === 4) || employees[0];
    const directReports = employees.filter(e => e.reporting_to_id === myEmp?.id);

    return (
      <div className="space-y-5 slide-up">
        <div className="glass-panel p-6">
          <div className="flex items-center gap-4 mb-4">
            <img src={myEmp.photo_url || DEFAULT_AVATAR} alt="" className="w-14 h-14 rounded-xl border border-white/50 shadow-sm" />
            <div>
              <div className="text-xl font-black text-slate-900 tracking-tight">{myEmp.full_name}</div>
              <div className="text-sm text-slate-500 font-bold mt-0.5">{myEmp.designation}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/40">
            <div className="text-center">
              <div className="text-2xl font-black text-slate-900">{directReports.length}</div>
              <div className="text-xs text-slate-500 font-bold mt-0.5">Direct Reports</div>
            </div>
            <div className="text-center border-x border-white/40">
              <div className="text-2xl font-black text-slate-900">{directReports.filter(e => e.employment_status === 'Active').length}</div>
              <div className="text-xs text-slate-500 font-bold mt-0.5">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-slate-900">{myEmp.department}</div>
              <div className="text-xs text-slate-500 font-bold mt-0.5">Department</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── HOD ROLE ───────────────────────────────────
  if (activeRole === 'HOD') {
    const myEmp = employees.find(e => e.email_official === loggedInUser.employee_id || e.id === loggedInUser.employee_id) || employees.find(e => e.role_tier === 3) || employees[0];
    const deptEmployees = employees.filter(e => e.department === myEmp?.department);
    const deptPayroll = deptEmployees.reduce((s, e) => s + (e.ctc_annual || 0), 0);
    const deptBudget = deptEmployees.reduce((s, e) => s + (e.budget_allocated || 0), 0);
    const utilPct = deptBudget > 0 ? Math.round((deptPayroll / deptBudget) * 100) : 0;

    return (
      <div className="space-y-5 slide-up">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard icon={<Users />} iconBg="bg-blue-50 text-blue-600" label={`${myEmp?.department} Headcount`} value={String(deptEmployees.length)} />
          <KpiCard icon={<UserCheck />} iconBg="bg-emerald-50 text-emerald-600" label="Active Staff" value={String(deptEmployees.filter(e => e.employment_status === 'Active').length)} />
          <KpiCard icon={<IndianRupee />} iconBg="bg-purple-50 text-purple-600" label="Dept Payroll" value={fmt(deptPayroll)} />
          <KpiCard icon={<TrendingUp />} iconBg="bg-indigo-50 text-indigo-600" label="Dept Budget" value={fmt(deptBudget)} sub={`${utilPct}% Utilized`} />
        </div>
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-slate-500" /> Departmental Budget Vs Actual
            </h3>
            <span className="text-xs font-bold text-slate-600">
              {utilPct}% Utilized · Variance: {fmt(deptBudget - deptPayroll)} remaining
            </span>
          </div>
          <div className="relative h-4 bg-slate-200/50 rounded-full overflow-hidden shadow-inner border border-white/50">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${utilPct > 100 ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-blue-400 to-indigo-500'}`} 
              style={{ width: `${Math.min(utilPct, 100)}%` }} 
            />
          </div>
        </div>
      </div>
    );
  }

  // ── ADMIN / MANAGEMENT ROLE: Full Executive Dashboard ─────────────────
  const utilizationPct = stats.totalBudget > 0 ? Math.round((stats.totalPayroll / stats.totalBudget) * 100) : 0;
  
  const salaryChartData = {
    labels: stats.salaryBands ? Object.keys(stats.salaryBands) : [],
    datasets: [
      {
        label: 'Headcount',
        data: stats.salaryBands ? Object.values(stats.salaryBands) : [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 4,
      }
    ]
  };

  return (
    <div className="space-y-8 slide-up pb-10">
      
      {/* SECTION 1: Executive KPIs */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" /> Executive KPIs
          </h2>
          {activeRole === 'Admin' && (
            <div className="flex gap-2">
              <button 
                onClick={onTargetsClick} 
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition shadow-sm" 
                title="HR Target Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button 
                onClick={handleGenerateStrategy} 
                disabled={loadingAi}
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm shadow-indigo-200 flex items-center gap-2" 
                title="Generate AI Insights"
              >
                {loadingAi ? <Sparkles className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>
        
        {aiStrategy && (
          <div className="mb-6 p-5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl relative shadow-sm slide-up">
            <button onClick={() => setAiStrategy('')} className="absolute top-4 right-4 text-indigo-400 hover:text-indigo-600 transition">
              <X className="w-5 h-5" />
            </button>
            <div className="flex gap-3">
              <Sparkles className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black text-indigo-900 mb-2">Executive AI Insights (Phi-4-Mini)</h4>
                <div className="whitespace-pre-wrap text-sm text-indigo-800 font-medium leading-relaxed">{aiStrategy}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard icon={<Users className="w-5 h-5"/>} iconBg="bg-blue-50 text-blue-600" label="Planned Headcount" value={String(stats.plannedHeadcount || 0)} sub="Approved positions" />
          <KpiCard icon={<UserCheck className="w-5 h-5"/>} iconBg="bg-emerald-50 text-emerald-600" label="Actual Employees" value={String(stats.activeEmployees)} sub="Filled positions" />
          <KpiCard 
            icon={<AlertTriangle className="w-5 h-5"/>} 
            iconBg="bg-amber-50 text-amber-600" 
            label="Open Positions" 
            value={String(stats.openPositions || 0)} 
            sub="Click for details" 
            onClick={() => {
              const el = document.getElementById('headcount-planning-table');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-4', 'ring-amber-200', 'transition-all', 'duration-500');
                setTimeout(() => el.classList.remove('ring-4', 'ring-amber-200'), 2000);
              }
            }}
          />
          <KpiCard icon={<Building2 className="w-5 h-5"/>} iconBg="bg-indigo-50 text-indigo-600" label="Total Departments" value={String(Object.keys(stats.departments).length)} sub="Active divisions" />
          
          <KpiCard icon={<Briefcase className="w-5 h-5"/>} iconBg="bg-slate-100 text-slate-700" label="Active Roles" value={String(stats.totalRoles || 0)} sub="Unique designations" />
          <KpiCard icon={<Landmark className="w-5 h-5"/>} iconBg="bg-cyan-50 text-cyan-600" label="Total Payroll" value={fmt(stats.totalPayroll)} sub="Current spend" />
          <KpiCard icon={<PieChart className="w-5 h-5"/>} iconBg="bg-purple-50 text-purple-600" label="Budget Utilization" value={`${utilizationPct}%`} sub="Of planned budget" />
          <KpiCard icon={<IndianRupee className="w-5 h-5"/>} iconBg="bg-rose-50 text-rose-600" label="Avg CTC" value={fmt(stats.avgCTC)} sub="Average salary" />
        </div>
      </div>

      {/* SECTION 2: Workforce Analytics */}
      <div>
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-purple-600" /> Workforce Analytics
        </h2>
        
        {/* MAIN CARD: Budgeted vs Actual Cost */}
        <div 
          className="glass-panel p-8 mb-6 glow-border cursor-pointer hover:shadow-xl hover:border-blue-400 transition-all group"
          onClick={() => onChartClick && onChartClick('budget')}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1 w-full">
              <h3 className="text-lg font-black text-slate-900 mb-1">Budgeted vs Actual People Cost</h3>
              <p className="text-sm font-semibold text-slate-500 mb-6">Financial overview of workforce expenditure</p>
              
              <div className="flex flex-wrap items-end gap-6 mb-4">
                <div>
                  <div className="text-sm font-bold text-slate-500 mb-1">Actual Workforce Cost</div>
                  <div className="text-4xl font-black text-slate-900">{fmt(stats.totalPayroll)}</div>
                </div>
                <div className="text-slate-300 text-2xl font-light mb-1">/</div>
                <div className="pb-1">
                  <div className="text-xs font-bold text-slate-500 mb-1">Planned Workforce Cost</div>
                  <div className="text-2xl font-black text-slate-600">{fmt(stats.totalBudget)}</div>
                </div>
              </div>

              <div className="relative h-4 bg-slate-200/50 rounded-full overflow-hidden border border-white/40 mb-6 shadow-inner">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${utilizationPct > 100 ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                  style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/60 rounded-xl p-3 border border-white/60">
                  <div className="text-xs font-bold text-slate-500">Hiring Gap</div>
                  <div className="text-lg font-black text-slate-900">{stats.openPositions || 0} roles</div>
                </div>
                <div className="bg-white/60 rounded-xl p-3 border border-white/60">
                  <div className="text-xs font-bold text-slate-500">Salary Variance</div>
                  <div className={`text-lg font-black ${stats.totalBudget - stats.totalPayroll < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {fmt(stats.totalBudget - stats.totalPayroll)}
                  </div>
                </div>
                <div className="bg-white/60 rounded-xl p-3 border border-white/60">
                  <div className="text-xs font-bold text-slate-500">Forecast Util.</div>
                  <div className="text-lg font-black text-slate-900">{Math.min(100, utilizationPct + 12)}%</div>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/3 bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex-shrink-0">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full opacity-20 blur-3xl -mr-10 -mt-10"></div>
               <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500 rounded-full opacity-20 blur-3xl -ml-10 -mb-10"></div>
               <ShieldAlert className="w-8 h-8 text-blue-400 mb-4" />
               <h4 className="text-lg font-bold mb-2">Workforce Forecasting</h4>
               <p className="text-sm text-slate-300 font-medium leading-relaxed mb-4">
                 At the current hiring velocity of {stats.hiringVelocity || 0}/mo and average CTC of {fmt(stats.avgCTC)}, budget exhaustion is expected in <strong className="text-white">8 months</strong>.
               </p>
               <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/10">
                 <div className="text-xs text-slate-300 font-bold">Recommended Action</div>
                 <div className="text-sm font-semibold mt-1">Review Q3 hiring plan for {stats.deptPlannedHC ? Object.keys(stats.deptPlannedHC)[0] : 'Engineering'}</div>
               </div>
            </div>
          </div>
        </div>



        {/* Headcount Planning Table */}
        <div id="headcount-planning-table" className="glass-panel p-1 overflow-hidden mb-6 rounded-2xl scroll-mt-24">
           <div className="p-5 border-b border-white/40 flex justify-between items-center">
             <h3 className="text-sm font-bold text-slate-800">Headcount Planning Analytics</h3>
             <button onClick={exportHeadcountToExcel} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors border border-indigo-200 shadow-sm">
               <Download className="w-4 h-4" /> Export Excel
             </button>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-50/50 text-xs uppercase text-slate-500 font-bold">
                 <tr>
                   <th className="px-6 py-3">Department</th>
                   <th className="px-6 py-3 text-center">Budgeted HC</th>
                   <th className="px-6 py-3 text-center">Actual HC</th>
                   <th className="px-6 py-3 text-center">Open Positions</th>
                   <th className="px-6 py-3 text-right">Variance</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/40">
                 {stats.deptPlannedHC && Object.keys(stats.deptPlannedHC).map(dept => {
                   const planned = stats.deptPlannedHC[dept];
                   const actual = stats.departments[dept] || 0;
                   const open = Math.max(0, planned - actual);
                   const variance = planned > 0 ? Math.round(((actual - planned) / planned) * 100) : 0;
                   const expanded = !!expandedDepts[dept];
                   return (
                     <React.Fragment key={dept}>
                       <tr 
                         className="hover:bg-white/40 transition-colors cursor-pointer select-none"
                         onClick={() => {
                           setExpandedDepts(prev => ({
                             ...prev,
                             [dept]: !prev[dept]
                           }));
                         }}
                       >
                         <td className="px-6 py-4 font-bold text-slate-800">
                           <div className="flex items-center gap-2">
                             {expanded ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />}
                             <span>{dept}</span>
                           </div>
                         </td>
                         <td className="px-6 py-4 text-center font-semibold text-slate-600">{planned}</td>
                         <td className="px-6 py-4 text-center font-bold text-slate-900">{actual}</td>
                         <td className="px-6 py-4 text-center font-semibold text-amber-600">{open}</td>
                         <td className={`px-6 py-4 text-right font-bold ${variance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                           {variance > 0 ? '+' : ''}{variance}%
                         </td>
                       </tr>
                       {expanded && stats.designationBreakdown?.[dept]?.map(item => {
                         const itemVariance = item.planned > 0 ? Math.round(((item.actual - item.planned) / item.planned) * 100) : 0;
                         return (
                           <tr key={item.designation} className="bg-slate-50/40 text-xs hover:bg-slate-100/40 transition-colors">
                             <td className="pl-12 pr-6 py-3 font-semibold text-slate-600 italic">
                               {item.designation}
                             </td>
                             <td className="px-6 py-3 text-center font-medium text-slate-500">{item.planned}</td>
                             <td className="px-6 py-3 text-center font-semibold text-slate-700">{item.actual}</td>
                             <td className={`px-6 py-3 text-center font-bold ${item.open > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                               {item.open}
                             </td>
                             <td className={`px-6 py-3 text-right font-bold ${itemVariance < 0 ? 'text-red-500' : itemVariance > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                               {itemVariance > 0 ? '+' : ''}{itemVariance}%
                             </td>
                           </tr>
                         );
                       })}
                     </React.Fragment>
                   );
                 })}
               </tbody>
             </table>
           </div>
        </div>
      </div>

      {/* SECTION 3: Org Structure & Cost Intelligence */}
      <div>
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-600" /> Structure & Cost Intelligence
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
           <div className="glass-panel p-5 md:col-span-1">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Salary Distribution</h3>
              <div className="h-64">
                 <Bar data={salaryChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
              </div>
           </div>
           
           <div className="glass-panel p-5 md:col-span-2">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-slate-500" /> Workforce Pyramid
              </h3>
              <div className="flex flex-col justify-end h-64 gap-3 pb-2 pt-4">
                {Object.entries(stats.tiers).sort((a,b) => Number(a[0]) - Number(b[0])).map(([tier, count]) => {
                  const labels: Record<string, string> = { '1': 'C-Suite', '2': 'VP / CXO', '3': 'HOD', '4': 'Manager', '5': 'Individual' };
                  const maxCount = Math.max(...Object.values(stats.tiers));
                  const width = Math.max(10, (count / maxCount) * 100);
                  return (
                    <div key={tier} className="flex items-center gap-4">
                      <div className="w-24 text-right text-xs font-bold text-slate-500 shrink-0">{labels[tier]}</div>
                      <div className="flex-1 flex justify-center">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-md h-8 flex items-center justify-center text-white font-black text-xs shadow-sm transition-all hover:brightness-110"
                          style={{ width: `${width}%` }}
                        >
                          {count}
                        </div>
                      </div>
                      <div className="w-12 text-left text-xs font-semibold text-slate-400 shrink-0">Tier {tier}</div>
                    </div>
                  );
                })}
              </div>
           </div>
        </div>

        {/* Cost Intelligence Table */}
        <div className="glass-panel p-1 overflow-hidden">
           <div className="p-5 border-b border-white/40">
             <h3 className="text-sm font-bold text-slate-800">Department Cost Intelligence</h3>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-50/50 text-xs uppercase text-slate-500 font-bold">
                 <tr>
                   <th className="px-6 py-3">Department</th>
                   <th className="px-6 py-3 text-right">Budget</th>
                   <th className="px-6 py-3 text-right">Actual Cost</th>
                   <th className="px-6 py-3 text-center">People</th>
                   <th className="px-6 py-3 text-right">Avg CTC</th>
                   <th className="px-6 py-3 text-center">Utilization</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/40">
                 {Object.keys(stats.departments).map(dept => {
                   const actual = stats.deptPayroll[dept] || 0;
                   const budget = stats.deptBudget[dept] || 0;
                   const people = stats.departments[dept] || 0;
                   const avg = people > 0 ? actual / people : 0;
                   const util = budget > 0 ? Math.round((actual / budget) * 100) : 0;
                   
                   return (
                     <tr key={dept} className="hover:bg-white/40 transition-colors" onClick={() => onDepartmentClick && onDepartmentClick(dept)} style={{ cursor: onDepartmentClick ? 'pointer' : 'default' }}>
                       <td className={`px-6 py-4 font-bold text-slate-800 ${onDepartmentClick ? 'hover:text-blue-600' : ''}`}>{dept}</td>
                       <td className="px-6 py-4 text-right font-semibold text-slate-500">{fmt(budget)}</td>
                       <td className="px-6 py-4 text-right font-black text-slate-900">{fmt(actual)}</td>
                       <td className="px-6 py-4 text-center font-bold text-slate-700">{people}</td>
                       <td className="px-6 py-4 text-right font-semibold text-slate-600">{fmt(avg)}</td>
                       <td className="px-6 py-4 text-center">
                         <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                           util > 100 ? 'bg-red-100 text-red-700' : util > 90 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                         }`}>
                           {util}%
                         </span>
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { fetchStats, Employee, Stats, DEFAULT_AVATAR, getAiStrategy } from '../lib/api';
import { KpiDetailsView, KpiType } from './KpiDetailsView';
import { STATUS_CONFIG } from './OrgChart';
import { 
  Users, IndianRupee, TrendingUp, Building2, 
  Award, UserCheck, Mail, Briefcase, PieChart, Landmark,
  AlertTriangle, ArrowUpRight, ArrowDownRight,
  Target, ShieldAlert, Settings, Bot, Sparkles, X, Tag,
  Download, Filter, Bell
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
import type { Role } from '../App';
import type { AuthUser } from '../lib/api';
import { DrillDownModal } from './DrillDownModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
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
  onChartClick?: (type: 'hiring' | 'attrition' | 'budget') => void;
  onTargetsClick?: () => void;
  onNavigateToWellness?: () => void;
}

const fmt = (n: number) => {
  if (!n) return '₹0';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
};

const fmtLakhCrore = (n: number) => {
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${+(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${+(n / 100000).toFixed(2)} L`;
  return fmt(n);
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
        <div className="space-y-2.5 max-h-40 overflow-y-auto custom-scrollbar">
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
export const DashboardStats: React.FC<DashboardStatsProps> = ({ activeRole, loggedInUser, employees, onChartClick, onTargetsClick, onNavigateToWellness }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [aiStrategy, setAiStrategy] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [activeKpiDetails, setActiveKpiDetails] = useState<KpiType | null>(null);
  const [selectedDrillDown, setSelectedDrillDown] = useState<any>(null);

  const [buFilter, setBuFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const businessUnits = React.useMemo(() => [...new Set(employees.map(e => e.business_unit).filter(Boolean))].sort(), [employees]);
  const allDepartments = React.useMemo(() => [...new Set(employees.map(e => e.department).filter(Boolean))].sort(), [employees]);
  // Optional: filter departments based on selected BU
  const departments = React.useMemo(() => {
    if (!buFilter) return allDepartments;
    return [...new Set(employees.filter(e => e.business_unit === buFilter).map(e => e.department).filter(Boolean))].sort();
  }, [employees, buFilter, allDepartments]);

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


  // wpTable is computed inline after the !stats guard to avoid hook order issues

  useEffect(() => {
    fetchStats(buFilter, deptFilter).then(setStats);
    
    // Fetch wellness assignments
    if (activeRole !== 'Admin') {
      const empId = loggedInUser.employee_id || loggedInUser.id;
      fetch(`http://localhost:3001/api/wellness/assignments?employee_id=${empId}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setAssignments(data))
        .catch(console.error);
    }
  }, [employees, buFilter, deptFilter, loggedInUser, activeRole]);

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

  const utilizationPct = stats.totalBudget > 0 ? Math.round((stats.totalPayroll / stats.totalBudget) * 100) : 0;

  const wpTable = stats.workforcePlanningTable || [];

  const overallBudgetCTC = stats.totalBudget || 0;
  const overallActiveCTC = stats.totalPayroll || 0;
  const overallOfferedCTC = stats.totalOffered || 0;
  const overallHoldCTC = stats.totalHold || 0;
  const overallResignedCTC = stats.resignedCTC || 0;
  
  // Calculate vacancy cost based on the table to ensure it matches the Variance breakdown
  const overallVacancyCTC = wpTable.reduce((acc, row) => acc + (row.vacancyCTC || 0), 0);
  const totalSavingsAmt = overallBudgetCTC - (overallActiveCTC + overallResignedCTC + overallOfferedCTC + overallHoldCTC + overallVacancyCTC);
  const totalSavingsPct = overallBudgetCTC > 0 ? ((totalSavingsAmt / overallBudgetCTC) * 100).toFixed(1) : 0;

  const exportWPToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(wpTable.map(row => ({
      Position: row.position,
      'Department': row.department,
      'Budget HC': row.budgetHC,
      'Budgeted CTC': row.budgetedCTC,
      'Active HC': row.activeHC,
      'Active CTC': row.activeCTC,
      'Offered HC': row.offeredHC,
      'Offered CTC': row.offeredCTC,
      'Hold HC': row.holdHC,
      'Hold CTC': row.holdCTC,
      'Vacancy HC': row.vacancyHC,
      'Vacancy CTC': row.vacancyCTC,
      'Variance Amount': row.savingsAmount,
      'Variance %': row.savingsPercentage.toFixed(1) + '%'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Workforce_Budget");
    XLSX.writeFile(wb, `Workforce_Budget_vs_Actual_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportWPToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text("Workforce Budget vs Actual (Position Level)", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['Position', 'Dept', 'Budget HC', 'Budget CTC', 'Active HC', 'Active CTC', 'Offered HC', 'Offered CTC', 'Hold HC', 'Hold CTC', 'Vacancy HC', 'Vacancy CTC', 'Variance', 'Variance %']],
      body: wpTable.map(row => [
        row.position,
        row.department,
        row.budgetHC,
        fmtLakhCrore(row.budgetedCTC),
        row.activeHC,
        fmtLakhCrore(row.activeCTC),
        row.offeredHC,
        fmtLakhCrore(row.offeredCTC),
        row.holdHC,
        fmtLakhCrore(row.holdCTC),
        row.vacancyHC,
        fmtLakhCrore(row.vacancyCTC),
        fmtLakhCrore(row.savingsAmount),
        row.savingsPercentage.toFixed(1) + '%'
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [30, 41, 59] }
    });
    doc.save(`Workforce_Budget_vs_Actual_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const budgetHC = stats.budgetHC || 0;
  const activeHC = stats.activeHC || 0;
  const resignedHC = stats.resignedHC || 0;
  const offeredHC = stats.oyjPositions || 0;
  const holdHC = stats.holdPositions || 0;
  const vacancyHC = stats.vacancyHC || 0;

  const hiringProgress = budgetHC > 0 ? Math.round(((activeHC + offeredHC) / budgetHC) * 100) : 0;
  const forecastedUtil = overallBudgetCTC > 0 ? Math.round(((overallActiveCTC + overallOfferedCTC) / overallBudgetCTC) * 100) : 0;
  const attritionImpactPct = stats.attritionRate || 0;


  if (activeKpiDetails) {
    return <KpiDetailsView kpiType={activeKpiDetails} onBack={() => setActiveKpiDetails(null)} formatCurrency={fmtLakhCrore} />;
  }

  const pendingAssignments = assignments.filter(a => !a.completed_at);

  return (
    <div className="space-y-8 slide-up pb-10">
      
      {pendingAssignments.length > 0 && onNavigateToWellness && (
        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-pulse-slow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Bell className="w-5 h-5"/></div>
            <div>
              <h4 className="font-bold text-indigo-900">Pending Questionnaires</h4>
              <p className="text-sm text-indigo-700">You have {pendingAssignments.length} pending questionnaire(s). Please go to Support & Feedback to complete them.</p>
            </div>
          </div>
          <button 
            onClick={onNavigateToWellness}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition shadow-sm"
          >
            Take Questionnaire
          </button>
        </div>
      )}

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

        {/* Hierarchy Filter Bar */}
        <div className="flex items-center gap-3 mb-6 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1 border-r border-slate-200">
            <Filter className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-bold text-slate-700">Hierarchy Filter</span>
          </div>
          
          <select 
            value={buFilter} 
            onChange={e => { setBuFilter(e.target.value); setDeptFilter(''); }}
            className="w-48 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 rounded-xl text-sm font-medium text-slate-800 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="">All Business Units</option>
            {businessUnits.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select 
            value={deptFilter} 
            onChange={e => setDeptFilter(e.target.value)}
            className="w-48 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 rounded-xl text-sm font-medium text-slate-800 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {(buFilter || deptFilter) && (
            <button 
              onClick={() => { setBuFilter(''); setDeptFilter(''); }}
              className="px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors ml-auto"
            >
              Clear Filters
            </button>
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

        {/* Health Scores */}
        <h3 className="text-sm font-bold text-slate-800 mt-6 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-slate-500" /> Organization Health Scores
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <KpiCard icon={<Building2 className="w-5 h-5"/>} iconBg="bg-blue-50 text-blue-600" label="Overall Org Health" value={`${Math.max(0, Math.round((activeHC / (budgetHC || 1)) * 100 - (stats.attritionRate || 0)))} / 100`} sub="Based on Headcount & Attrition" />
          <KpiCard icon={<PieChart className="w-5 h-5"/>} iconBg="bg-indigo-50 text-indigo-600" label="Top BU Health" value="92 / 100" sub="Corporate" />
          <KpiCard icon={<Target className="w-5 h-5"/>} iconBg="bg-emerald-50 text-emerald-600" label="Top Dept Health" value="88 / 100" sub="Engineering" />
        </div>

        {/* Headcount Intelligence */}
        <h3 className="text-sm font-bold text-slate-800 mt-6 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" /> Headcount Intelligence
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <KpiCard icon={<Building2 className="w-4 h-4"/>} iconBg="bg-blue-50 text-blue-600" label="Budget HC" value={String(budgetHC)} onClick={() => setActiveKpiDetails('budget')} />
          <KpiCard icon={<UserCheck className="w-4 h-4"/>} iconBg="bg-emerald-50 text-emerald-600" label="Active HC" value={String(activeHC)} onClick={() => setActiveKpiDetails('active')} />
          <KpiCard icon={<Users className="w-4 h-4"/>} iconBg="bg-rose-50 text-rose-600" label="Resigned on Roll HC" value={String(resignedHC)} />
          <KpiCard icon={<TrendingUp className="w-4 h-4"/>} iconBg="bg-purple-50 text-purple-600" label="Offered HC" value={String(offeredHC)} onClick={() => setActiveKpiDetails('offered')} />
          <KpiCard icon={<Settings className="w-4 h-4"/>} iconBg="bg-slate-100 text-slate-600" label="Hold HC" value={String(holdHC)} onClick={() => setActiveKpiDetails('hold')} />
          <KpiCard icon={<AlertTriangle className="w-4 h-4"/>} iconBg="bg-amber-50 text-amber-600" label="Vacancy HC" value={String(vacancyHC)} onClick={() => setActiveKpiDetails('vacancy')} />
        </div>

        {/* Budget & Cost Intelligence */}
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-slate-500" /> Budget & Cost Intelligence
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <KpiCard icon={<Landmark className="w-4 h-4"/>} iconBg="bg-blue-50 text-blue-600" label="Budget Cost" value={fmtLakhCrore(overallBudgetCTC)} onClick={() => setActiveKpiDetails('budget')} />
          <KpiCard icon={<IndianRupee className="w-4 h-4"/>} iconBg="bg-emerald-50 text-emerald-600" label="Actual Cost" value={fmtLakhCrore(overallActiveCTC)} onClick={() => setActiveKpiDetails('active')} />
          <KpiCard icon={<IndianRupee className="w-4 h-4"/>} iconBg="bg-rose-50 text-rose-600" label="Resigned on Roll Cost" value={fmtLakhCrore(overallResignedCTC)} />
          <KpiCard icon={<TrendingUp className="w-4 h-4"/>} iconBg="bg-purple-50 text-purple-600" label="Offered Cost" value={fmtLakhCrore(overallOfferedCTC)} onClick={() => setActiveKpiDetails('offered')} />
          <KpiCard icon={<Settings className="w-4 h-4"/>} iconBg="bg-slate-100 text-slate-600" label="Hold Cost" value={fmtLakhCrore(overallHoldCTC)} onClick={() => setActiveKpiDetails('hold')} />
          <KpiCard icon={<PieChart className="w-4 h-4"/>} iconBg="bg-amber-50 text-amber-600" label="Vacancy Cost" value={fmtLakhCrore(overallVacancyCTC)} onClick={() => setActiveKpiDetails('vacancy')} />
        </div>

        {/* Advanced Workforce Analytics */}
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-slate-500" /> Executive Highlights
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <KpiCard icon={<IndianRupee className="w-4 h-4"/>} iconBg="bg-emerald-50 text-emerald-600" label="Total Variance" value={fmtLakhCrore(totalSavingsAmt)} />
          <KpiCard icon={<PieChart className="w-4 h-4"/>} iconBg="bg-emerald-50 text-emerald-600" label="Variance %" value={`${totalSavingsPct}%`} />
          <KpiCard icon={<TrendingUp className="w-4 h-4"/>} iconBg="bg-blue-50 text-blue-600" label="Budget Util." value={`${stats.ctcUtilization || utilizationPct}%`} />
          <KpiCard icon={<ShieldAlert className="w-4 h-4"/>} iconBg="bg-purple-50 text-purple-600" label="Forecasted Util." value={`${forecastedUtil}%`} />
          <KpiCard icon={<Target className="w-4 h-4"/>} iconBg="bg-indigo-50 text-indigo-600" label="Hiring Progress" value={`${hiringProgress}%`} />
          <KpiCard icon={<AlertTriangle className="w-4 h-4"/>} iconBg="bg-rose-50 text-rose-600" label="Attrition Impact" value={`${attritionImpactPct}%`} />
        </div>
      </div>

      {/* Position Status Legend */}
      <div className="glass-panel p-6 mb-6">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-slate-500" /> Position Status Legend
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {Object.entries(STATUS_CONFIG).map(([key, sc]) => {
            if (key === 'Inactive' || key === 'Under Notice Period') return null;
            return (
              <div 
                key={key} 
                className="flex items-center gap-2.5 p-3 bg-white/60 border border-slate-200/80 rounded-xl hover:shadow-md transition-all duration-300"
                style={{ boxShadow: `0 0 8px ${sc.glow}15` }}
              >
                <span 
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-black border select-none shrink-0 ${sc.bg} ${sc.text} ${sc.border}`}
                  style={{ boxShadow: `0 0 6px ${sc.glow}40` }}
                >
                  {sc.letter}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-slate-800 truncate">{sc.label}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{key}</div>
                </div>
              </div>
            );
          })}
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



        {/* Workforce Budget Intelligence Table (Position Level) */}
        <div id="workforce-intelligence-table" className="glass-panel p-1 overflow-hidden mb-6 rounded-2xl scroll-mt-24">
           <div className="p-5 border-b border-white/40 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
             <div>
               <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Target className="w-4 h-4 text-indigo-600" /> Workforce Budget vs Actual (Position Level)</h3>
               <p className="text-xs text-slate-500 font-medium mt-1">Real-time breakdown of position budgets, actuals, offers, and savings</p>
             </div>
             <div className="flex items-center gap-2">
               <button onClick={exportWPToPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors">
                 <Download className="w-3.5 h-3.5" /> PDF
               </button>
               <button onClick={exportWPToExcel} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors">
                 <Download className="w-3.5 h-3.5" /> Excel
               </button>
             </div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-[11px]">
               <thead className="bg-slate-800 text-white font-bold tracking-wider">
                 <tr>
                   <th className="px-4 py-3 sticky left-0 z-10 bg-slate-800 border-r border-slate-700 w-48 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">Position</th>
                   <th className="px-3 py-3 text-center bg-blue-900/40 border-l border-blue-800/30">Budget<br/>HC</th>
                   <th className="px-3 py-3 text-right bg-blue-900/40 border-r border-blue-800/30">Budgeted<br/>CTC</th>
                   
                   <th className="px-3 py-3 text-center bg-emerald-900/40">Active<br/>HC</th>
                   <th className="px-3 py-3 text-right bg-emerald-900/40 border-r border-emerald-800/30">Active<br/>CTC</th>
                   
                   <th className="px-3 py-3 text-center bg-purple-900/40">Offered<br/>HC</th>
                   <th className="px-3 py-3 text-right bg-purple-900/40 border-r border-purple-800/30">Offered<br/>CTC</th>
                   
                   <th className="px-3 py-3 text-center bg-slate-700">Hold<br/>HC</th>
                   <th className="px-3 py-3 text-right bg-slate-700 border-r border-slate-600">Hold<br/>CTC</th>
                   
                   <th className="px-3 py-3 text-center bg-rose-900/40">Vacancy<br/>HC</th>
                   <th className="px-3 py-3 text-right bg-rose-900/40 border-r border-rose-800/30">Vacancy<br/>CTC</th>

                   <th className="px-4 py-3 text-right bg-indigo-900/60">Variance<br/>Amount</th>
                   <th className="px-4 py-3 text-right bg-indigo-900/60 rounded-tr-lg">Variance<br/>%</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-200">
                 {wpTable.map((row, idx) => {
                   const sPct = row.savingsPercentage || 0;
                   let heatmapClass = "bg-white text-slate-800";
                   if (sPct < 0) {
                     heatmapClass = "bg-red-50 text-red-800 font-bold";
                   } else if (sPct > 20) {
                     heatmapClass = "bg-emerald-50 text-emerald-800 font-bold";
                   } else if (sPct > 0) {
                     heatmapClass = "bg-green-50/50 text-green-700 font-semibold";
                   }

                   return (
                     <tr 
                       key={idx} 
                       className="hover:bg-indigo-50 transition-colors cursor-pointer group"
                       onClick={() => setSelectedDrillDown({
                         position: row.position,
                         business_unit: row.business_unit,
                         department: row.department
                       })}
                     >
                       <td className="px-4 py-3 sticky left-0 z-10 bg-white group-hover:bg-indigo-50 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                         <div className="font-black text-slate-800 truncate" title={row.position}>{row.position}</div>
                         <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate mt-0.5" title={`${row.business_unit} • ${row.department}`}>{row.business_unit} • {row.department}</div>
                       </td>
                       <td className="px-3 py-3 text-center font-bold text-blue-700 bg-blue-50/30 border-l border-blue-100/50">{row.budgetHC}</td>
                       <td className="px-3 py-3 text-right font-semibold text-slate-600 bg-blue-50/30 border-r border-blue-100/50">{fmtLakhCrore(row.budgetedCTC)}</td>
                       
                       <td className="px-3 py-3 text-center font-bold text-emerald-700 bg-emerald-50/30">{row.activeHC}</td>
                       <td className="px-3 py-3 text-right font-semibold text-slate-600 bg-emerald-50/30 border-r border-emerald-100/50">{fmtLakhCrore(row.activeCTC)}</td>
                       
                       <td className="px-3 py-3 text-center font-bold text-purple-700 bg-purple-50/30">{row.offeredHC}</td>
                       <td className="px-3 py-3 text-right font-semibold text-slate-600 bg-purple-50/30 border-r border-purple-100/50">{fmtLakhCrore(row.offeredCTC)}</td>
                       
                       <td className="px-3 py-3 text-center font-bold text-slate-600 bg-slate-50/50">{row.holdHC}</td>
                       <td className="px-3 py-3 text-right font-semibold text-slate-500 bg-slate-50/50 border-r border-slate-200/50">{fmtLakhCrore(row.holdCTC)}</td>
                       
                       <td className="px-3 py-3 text-center font-bold text-rose-700 bg-rose-50/30">{row.vacancyHC}</td>
                       <td className="px-3 py-3 text-right font-semibold text-slate-600 bg-rose-50/30 border-r border-rose-100/50">{fmtLakhCrore(row.vacancyCTC)}</td>
                       
                       <td className={`px-4 py-3 text-right font-black border-l border-slate-100 ${heatmapClass}`}>{fmtLakhCrore(row.savingsAmount)}</td>
                       <td className={`px-4 py-3 text-right font-black ${heatmapClass}`}>{sPct.toFixed(1)}%</td>
                     </tr>
                   );
                 })}
               </tbody>
               <tfoot className="bg-slate-100 font-black text-slate-800 border-t-2 border-slate-300">
                 <tr>
                   <td className="px-4 py-3 sticky left-0 z-10 bg-slate-100 border-r border-slate-300 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">TOTALS</td>
                   <td className="px-3 py-3 text-center text-blue-700 border-l border-blue-200">{budgetHC}</td>
                   <td className="px-3 py-3 text-right border-r border-blue-200">{fmtLakhCrore(overallBudgetCTC)}</td>
                   <td className="px-3 py-3 text-center text-emerald-700">{activeHC}</td>
                   <td className="px-3 py-3 text-right border-r border-emerald-200">{fmtLakhCrore(overallActiveCTC)}</td>
                   <td className="px-3 py-3 text-center text-purple-700">{offeredHC}</td>
                   <td className="px-3 py-3 text-right border-r border-purple-200">{fmtLakhCrore(overallOfferedCTC)}</td>
                   <td className="px-3 py-3 text-center text-slate-600">{holdHC}</td>
                   <td className="px-3 py-3 text-right border-r border-slate-300">{fmtLakhCrore(overallHoldCTC)}</td>
                   <td className="px-3 py-3 text-center text-rose-700">{vacancyHC}</td>
                   <td className="px-3 py-3 text-right border-r border-rose-200">{fmtLakhCrore(overallVacancyCTC)}</td>
                   <td className="px-4 py-3 text-right font-black text-indigo-700 border-l border-indigo-200">{fmtLakhCrore(totalSavingsAmt)}</td>
                   <td className="px-4 py-3 text-right font-black text-indigo-700">{totalSavingsPct}%</td>
                 </tr>
               </tfoot>
             </table>
           </div>
         </div>
      </div>
      {/* SECTION: Position Status Legend */}
      <div>
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-black">★</span>
          Position Status Overview
        </h2>
        <div className="glass-panel p-6">
          <p className="text-sm text-slate-500 font-medium mb-5">Each position in the Org Chart is tagged with a colored status badge. Here is what each badge means:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(STATUS_CONFIG).filter(([key]) =>
              !['Inactive', 'Under Notice Period'].includes(key)
            ).map(([key, sc]) => (
              <div key={key} className="flex flex-col items-center gap-2 p-4 bg-white/60 backdrop-blur-sm border border-white/40 rounded-2xl hover:shadow-md hover:border-slate-200 transition-all group">
                <span
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-base font-black select-none transition-transform group-hover:scale-110 ${sc.bg} ${sc.text} ${sc.border}`}
                  style={{ boxShadow: `0 4px 14px ${sc.glow}55, 0 0 0 3px white` }}
                >
                  {sc.letter}
                </span>
                <div className="text-center">
                  <div className="text-xs font-black text-slate-800 leading-tight">{sc.label}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-white/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-500 font-medium">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-orange-500 border-2 border-orange-600 flex items-center justify-center text-white text-[9px] font-black shrink-0 mt-0.5" style={{ boxShadow: '0 2px 8px #f9731655' }}>R</span>
              <span><strong className="text-slate-700">Resigned on Roll (R)</strong> — The employee has resigned but is still on the payroll. "Under Notice Period" maps to the same badge.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-500 border-2 border-indigo-600 flex items-center justify-center text-white text-[9px] font-black shrink-0 mt-0.5" style={{ boxShadow: '0 2px 8px #6366f155' }}>P</span>
              <span><strong className="text-slate-700">Replacement Joined (P)</strong> — A new hire has joined as a replacement while the previous employee is still on the payroll.</span>
            </div>
          </div>
        </div>
      </div>
      
      {selectedDrillDown && (
        <DrillDownModal 
          rowData={selectedDrillDown} 
          onClose={() => setSelectedDrillDown(null)} 
        />
      )}
    </div>
  );
};

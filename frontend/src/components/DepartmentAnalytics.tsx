import React, { useMemo } from 'react';
import { Employee } from '../lib/api';
import { ArrowLeft, Users, Building2, TrendingUp, IndianRupee, PieChart as PieChartIcon } from 'lucide-react';

interface DepartmentAnalyticsProps {
  department: string;
  employees: Employee[];
  onBack: () => void;
  onSelectEmployee: (id: string) => void;
}

const fmtCTC = (n: number) => {
  if (!n) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
};

export const DepartmentAnalytics: React.FC<DepartmentAnalyticsProps> = ({ department, employees, onBack, onSelectEmployee }) => {
  const deptEmployees = useMemo(() => employees.filter(e => e.department === department), [employees, department]);
  
  const stats = useMemo(() => {
    const totalEmployees = deptEmployees.length;
    const activeEmployees = deptEmployees.filter(e => e.employment_status === 'Active').length;
    const noticeEmployees = deptEmployees.filter(e => e.employment_status === 'Under Notice Period').length;
    const inactiveEmployees = deptEmployees.filter(e => e.employment_status === 'Inactive').length;
    
    const totalPayroll = deptEmployees.reduce((sum, e) => sum + (e.ctc_annual || 0), 0);
    const totalBudget = deptEmployees.reduce((sum, e) => sum + (e.budget_allocated || 0), 0);
    const avgPayroll = totalEmployees ? totalPayroll / totalEmployees : 0;
    
    return { totalEmployees, activeEmployees, noticeEmployees, inactiveEmployees, totalPayroll, totalBudget, avgPayroll };
  }, [deptEmployees]);

  return (
    <div className="space-y-6 slide-up max-w-6xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-2">
        <ArrowLeft className="w-4 h-4" /> Back to Previous
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{department}</h1>
          <p className="text-sm font-bold text-slate-500 mt-1 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Department Analytics & Split
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-elevated p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Headcount</p>
              <p className="text-2xl font-black text-slate-900">{stats.totalEmployees}</p>
            </div>
          </div>
        </div>

        <div className="card-elevated p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Payroll</p>
              <p className="text-2xl font-black text-slate-900 font-mono">{fmtCTC(stats.totalPayroll)}</p>
            </div>
          </div>
        </div>

        <div className="card-elevated p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
              <PieChartIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Budget vs Actual</p>
              <p className="text-xl font-black text-slate-900 font-mono">
                {stats.totalBudget ? ((stats.totalPayroll / stats.totalBudget) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="card-elevated p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Attrition Risk (Notice)</p>
              <p className="text-2xl font-black text-slate-900">{stats.noticeEmployees}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="card-elevated p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Status Distribution</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Active</span>
                <span>{stats.activeEmployees}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.totalEmployees ? (stats.activeEmployees / stats.totalEmployees) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Notice Period</span>
                <span>{stats.noticeEmployees}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${stats.totalEmployees ? (stats.noticeEmployees / stats.totalEmployees) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>Vacant / Inactive</span>
                <span>{stats.inactiveEmployees}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${stats.totalEmployees ? (stats.inactiveEmployees / stats.totalEmployees) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Roster */}
        <div className="lg:col-span-2 card-elevated p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Department Roster</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="py-3 px-4 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee</th>
                  <th className="py-3 px-4 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role Tier</th>
                  <th className="py-3 px-4 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">CTC</th>
                </tr>
              </thead>
              <tbody>
                {deptEmployees.sort((a, b) => a.role_tier - b.role_tier).map((emp) => (
                  <tr key={emp.id} onClick={() => onSelectEmployee(emp.id)} className="group cursor-pointer hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 border-b border-slate-50 flex items-center gap-3">
                      <img src={emp.photo_url} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                      <div>
                        <div className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{emp.full_name}</div>
                        <div className="text-xs text-slate-400 font-semibold">{emp.designation}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 border-b border-slate-50 text-xs font-bold text-slate-600">Tier {emp.role_tier}</td>
                    <td className="py-3 px-4 border-b border-slate-50">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        emp.employment_status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                        emp.employment_status === 'Under Notice Period' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {emp.employment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b border-slate-50 text-right text-xs font-mono font-bold text-slate-800">
                      {fmtCTC(emp.ctc_annual)}
                    </td>
                  </tr>
                ))}
                {deptEmployees.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-sm font-semibold">No employees in this department</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

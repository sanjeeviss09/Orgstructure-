import React, { useState, useCallback } from 'react';
import {
  FileSpreadsheet, FileText, Printer, Building2, Users, IndianRupee,
  AlertTriangle, UserPlus, TrendingUp, Briefcase, BarChart2, CheckCircle2,
  Loader2, X, Eye, Filter, Calendar
} from 'lucide-react';
import { fetchStats, fetchEmployees, fetchPositions } from '../lib/api';
import { fetchCandidates, fetchRequisitions, fetchOffers } from '../lib/recruitment_api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const TODAY = new Date().toISOString().slice(0, 10);

// ─── Utility: escape CSV cell ───────────────────────────────────────
const esc = (v: any) => {
  const s = String(v ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
};

const toCSV = (headers: string[], rows: any[][]) =>
  [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');

const downloadBlob = (content: string, filename: string, type = 'text/csv;charset=utf-8;') => {
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
};

// ─── Excel-compatible HTML table export ────────────────────────────
const downloadExcel = (title: string, headers: string[], rows: any[][], filename: string) => {
  const table = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head><meta charset="UTF-8"/><style>
      th { background:#1e293b; color:#fff; font-weight:bold; padding:6px 10px; }
      td { padding:5px 10px; border:1px solid #e2e8f0; }
      tr:nth-child(even) td { background:#f8fafc; }
      h2 { font-family:Calibri; color:#1e293b; }
    </style></head><body>
    <h2>${title} — Generated: ${TODAY}</h2>
    <table border="1" cellpadding="5" cellspacing="0">
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></body></html>`;
  downloadBlob(table, filename.replace('.csv', '.xls'), 'application/vnd.ms-excel');
};

// ─── PDF print helper ───────────────────────────────────────────────
const printReport = (title: string, headers: string[], rows: any[][]) => {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <html><head><title>${title}</title>
    <style>
      body { font-family: 'Segoe UI', sans-serif; padding:20px; color:#1e293b; }
      h1 { font-size:20px; margin-bottom:4px; } p { color:#64748b; font-size:12px; margin:0 0 16px; }
      table { width:100%; border-collapse:collapse; font-size:11px; }
      th { background:#1e293b; color:#fff; padding:8px 10px; text-align:left; }
      td { padding:7px 10px; border-bottom:1px solid #e2e8f0; }
      tr:nth-child(even) td { background:#f8fafc; }
      @media print { button { display:none; } }
    </style></head><body>
    <h1>${title}</h1>
    <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
    <button onclick="window.print()" style="margin-bottom:16px;padding:8px 20px;background:#1e293b;color:#fff;border:none;border-radius:6px;cursor:pointer">Print / Save as PDF</button>
    <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></body></html>`);
  win.document.close();
};

// ─── Report Definitions ─────────────────────────────────────────────
type ExportFormat = 'csv' | 'excel' | 'pdf';

interface ReportDef {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  tag: string;
  generate: () => Promise<{ headers: string[]; rows: any[][] }>;
}

// ─── Main Component ─────────────────────────────────────────────────
export default function ReportsCenter() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{ title: string; headers: string[]; rows: any[][] } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
  const fmtL = (n: number) => {
    if (!n) return '₹0';
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
    return fmt(n);
  };

  // ── Report Generators ──────────────────────────────────────────────
  const reports: ReportDef[] = [
    {
      id: 'bu_workforce',
      title: 'Business Unit Workforce Report',
      description: 'Headcount, payroll, budget utilization, and vacancy breakdown by Business Unit.',
      icon: <Building2 className="w-6 h-6" />,
      gradient: 'from-blue-600 to-indigo-600',
      iconBg: 'bg-blue-50 text-blue-600',
      tag: 'Workforce',
      generate: async () => {
        const stats = await fetchStats();
        const buMap: Record<string, { active: number; budget: number; payroll: number; vacancy: number; offered: number; budgetCTC: number }> = {};
        (stats.workforcePlanningTable || []).forEach(row => {
          const bu = row.business_unit || 'Corporate';
          if (!buMap[bu]) buMap[bu] = { active: 0, budget: 0, payroll: 0, vacancy: 0, offered: 0, budgetCTC: 0 };
          buMap[bu].budget += row.budgetHC || 0;
          buMap[bu].budgetCTC += row.budgetedCTC || 0;
          buMap[bu].active += row.activeHC || 0;
          buMap[bu].offered += row.offeredHC || 0;
          buMap[bu].vacancy += row.vacancyHC || 0;
          buMap[bu].payroll += row.activeCTC || 0;
        });
        const headers = ['Business Unit', 'Budget HC', 'Active HC', 'Offered HC', 'Vacancy HC', 'Budget CTC', 'Actual Payroll', 'Variance', 'Utilization %'];
        const rows = Object.entries(buMap).map(([bu, d]) => [
          bu, d.budget, d.active, d.offered, d.vacancy,
          fmtL(d.budgetCTC), fmtL(d.payroll),
          fmtL(d.budgetCTC - d.payroll),
          d.budgetCTC > 0 ? `${((d.payroll / d.budgetCTC) * 100).toFixed(1)}%` : '0%'
        ]);
        return { headers, rows };
      }
    },
    {
      id: 'dept_workforce',
      title: 'Department Workforce Report',
      description: 'Granular department-level headcount, designation breakdown, and cost analysis.',
      icon: <Users className="w-6 h-6" />,
      gradient: 'from-violet-600 to-purple-600',
      iconBg: 'bg-violet-50 text-violet-600',
      tag: 'Workforce',
      generate: async () => {
        const stats = await fetchStats();
        const headers = ['Department', 'Designation', 'Budget HC', 'Active HC', 'Vacancy HC', 'Budget CTC', 'Active CTC', 'Variance', 'Variance %'];
        const rows: any[][] = [];
        if (stats.designationBreakdown) {
          Object.entries(stats.designationBreakdown).forEach(([dept, desigs]) => {
            desigs.forEach(d => {
              const bCTC = d.planned * (stats.avgCTC || 0);
              const aCTC = d.actual * (stats.avgCTC || 0);
              const sav = bCTC - aCTC;
              rows.push([dept, d.designation, d.planned, d.actual, d.open, fmtL(bCTC), fmtL(aCTC), fmtL(sav), bCTC > 0 ? `${((sav / bCTC) * 100).toFixed(1)}%` : '0%']);
            });
          });
        }
        return { headers, rows };
      }
    },
    {
      id: 'budget_actual',
      title: 'Budget vs Actual Report',
      description: 'Position-level comparison of budgeted CTC vs actual payroll with variance analysis.',
      icon: <IndianRupee className="w-6 h-6" />,
      gradient: 'from-emerald-600 to-teal-600',
      iconBg: 'bg-emerald-50 text-emerald-600',
      tag: 'Finance',
      generate: async () => {
        const stats = await fetchStats();
        const headers = ['Position', 'Department', 'Business Unit', 'Budget HC', 'Budget CTC', 'Active HC', 'Active CTC', 'Offered HC', 'Offered CTC', 'Hold HC', 'Hold CTC', 'Vacancy HC', 'Vacancy CTC', 'Variance', 'Variance %'];
        const rows = (stats.workforcePlanningTable || []).map((r: any) => [
          r.position, r.department, r.business_unit,
          r.budgetHC, fmtL(r.budgetedCTC),
          r.activeHC, fmtL(r.activeCTC),
          r.offeredHC, fmtL(r.offeredCTC),
          r.holdHC, fmtL(r.holdCTC),
          r.vacancyHC, fmtL(r.vacancyCTC),
          fmtL(r.savingsAmount), `${(r.savingsPercentage || 0).toFixed(1)}%`
        ]);
        return { headers, rows };
      }
    },
    {
      id: 'vacancy',
      title: 'Vacancy Report',
      description: 'All open, hold, and frozen positions with budgeted CTC and urgency status.',
      icon: <AlertTriangle className="w-6 h-6" />,
      gradient: 'from-amber-500 to-orange-500',
      iconBg: 'bg-amber-50 text-amber-600',
      tag: 'Workforce',
      generate: async () => {
        const [emps, positions] = await Promise.all([fetchEmployees(), fetchPositions()]);
        const statusLabel: Record<string, string> = {
          V: 'Vacant', H: 'On Hold', F: 'Frozen', OYJ: 'Offer Yet to Join', RoR: 'Resigned on Roll', RP: 'Replacement Position'
        };
        const vacant = positions.filter(p => {
          const hasActive = emps.some(e => e.position_id === p.id && (
            e.employment_status === 'Active' || 
            e.employment_status === 'Under Notice Period' ||
            e.employment_status === 'Resigned on Roll' ||
            e.employment_status === 'Replacement Joined'
          ));
          return !hasActive;
        });
        const headers = ['Position ID', 'Title', 'Department', 'Business Unit', 'Status', 'Budgeted CTC'];
        const rows = vacant.map(p => [
          p.id, p.title, p.department, p.business_unit,
          statusLabel[p.status] || p.status, fmtL(p.budgeted_ctc || 0)
        ]);
        return { headers, rows };
      }
    },
    {
      id: 'offer_pipeline',
      title: 'Offer Pipeline Report',
      description: 'All active and historical offers with candidate details, CTC, and approval status.',
      icon: <Briefcase className="w-6 h-6" />,
      gradient: 'from-pink-600 to-rose-600',
      iconBg: 'bg-pink-50 text-pink-600',
      tag: 'Recruitment',
      generate: async () => {
        const [offers, candidates] = await Promise.all([fetchOffers(), fetchCandidates()]);
        const candMap = Object.fromEntries(candidates.map(c => [c.id, c]));
        const headers = ['Offer ID', 'Candidate Name', 'Email', 'Designation', 'Offered CTC', 'Grade', 'Joining Date', 'Status', 'Created At'];
        const rows = offers.map(o => {
          const c = candMap[o.candidate_id];
          return [
            o.id,
            c ? `${c.first_name} ${c.last_name}` : o.candidate_id,
            c?.email || '',
            o.designation, fmtL(o.offered_ctc), o.grade,
            o.joining_date ? new Date(o.joining_date).toLocaleDateString('en-IN') : '',
            o.status,
            new Date(o.created_at).toLocaleDateString('en-IN')
          ];
        });
        return { headers, rows };
      }
    },
    {
      id: 'employee_cost',
      title: 'Employee Cost Report',
      description: 'Full employee roster with actual CTC, budget allocation, and cost variance per head.',
      icon: <IndianRupee className="w-6 h-6" />,
      gradient: 'from-cyan-600 to-blue-600',
      iconBg: 'bg-cyan-50 text-cyan-600',
      tag: 'Finance',
      generate: async () => {
        const emps = await fetchEmployees();
        const active = emps.filter(e => 
          e.employment_status === 'Active' || 
          e.employment_status === 'Under Notice Period' ||
          e.employment_status === 'Resigned on Roll' ||
          e.employment_status === 'Replacement Joined'
        );
        const headers = ['Emp ID', 'Name', 'Designation', 'Department', 'Business Unit', 'CTC Annual', 'Budget Allocated', 'Variance', 'Status', 'Join Date'];
        const rows = active.map(e => [
          e.emp_id, e.full_name, e.designation, e.department, e.business_unit,
          fmtL(e.ctc_annual), fmtL(e.budget_allocated),
          fmtL((e.budget_allocated || 0) - (e.ctc_annual || 0)),
          e.employment_status,
          e.join_date ? new Date(e.join_date).toLocaleDateString('en-IN') : 'N/A'
        ]);
        return { headers, rows };
      }
    },
    {
      id: 'attrition',
      title: 'Attrition Report',
      description: 'Department-wise attrition rates, resignation impact, cost of replacement, and trend data.',
      icon: <TrendingUp className="w-6 h-6" />,
      gradient: 'from-red-600 to-rose-600',
      iconBg: 'bg-red-50 text-red-600',
      tag: 'Analytics',
      generate: async () => {
        const [res, emps] = await Promise.all([
          fetch(`${API_BASE}/api/analytics/attrition`).then(r => r.json()),
          fetchEmployees()
        ]);
        const headers = ['Department', 'Attrition Rate (%)', 'Active HC', 'Inactive HC', 'Cost Impact (Est.)'];
        const rows = (res.deptAttrition || []).map((d: any) => {
          const deptEmps = emps.filter(e => e.department === d.department);
          const inactive = deptEmps.filter(e => e.employment_status === 'Inactive');
          const costImpact = inactive.reduce((s: number, e: any) => s + (e.ctc_annual || 0) * 0.2, 0);
          return [d.department, `${d.rate}%`, deptEmps.length - inactive.length, inactive.length, fmtL(costImpact)];
        });
        // Append BU attrition
        rows.push(['— Business Unit —', '—', '—', '—', '—']);
        (res.buAttrition || []).forEach((d: any) => rows.push([d.bu, `${d.rate}%`, '', '', '']));
        return { headers, rows };
      }
    },
    {
      id: 'recruitment',
      title: 'Recruitment Report',
      description: 'Complete candidate pipeline: applications, screening, interviews, offers, and joinings.',
      icon: <UserPlus className="w-6 h-6" />,
      gradient: 'from-indigo-600 to-violet-600',
      iconBg: 'bg-indigo-50 text-indigo-600',
      tag: 'Recruitment',
      generate: async () => {
        const [candidates, requisitions] = await Promise.all([fetchCandidates(), fetchRequisitions()]);
        const reqMap = Object.fromEntries(requisitions.map(r => [r.id, r]));
        const headers = [
          'Candidate ID', 'Name', 'Email', 'Mobile', 'Current Company', 'Current Designation',
          'Experience', 'Current CTC', 'Expected CTC', 'Notice Period',
          'Applied For', 'Department', 'Business Unit', 'Position Type', 'Status', 'Applied At'
        ];
        const rows = candidates.map(c => {
          const req = reqMap[c.requisition_id];
          return [
            c.id, `${c.first_name} ${c.last_name}`, c.email, c.mobile_number,
            c.current_company, c.current_designation, c.total_experience,
            fmtL(c.current_ctc), fmtL(c.expected_ctc), c.notice_period,
            req?.position_title || c.requisition_id,
            req?.department || '', req?.business_unit || '',
            req?.position_type || '',
            c.status, new Date(c.applied_at).toLocaleDateString('en-IN')
          ];
        });
        return { headers, rows };
      }
    },
    {
      id: 'forecast',
      title: 'Forecast Report',
      description: 'Forward-looking workforce projections: future HC, payroll cost, budget utilization, and savings.',
      icon: <BarChart2 className="w-6 h-6" />,
      gradient: 'from-slate-600 to-slate-800',
      iconBg: 'bg-slate-100 text-slate-600',
      tag: 'Analytics',
      generate: async () => {
        const res = await fetch(`${API_BASE}/api/analytics/forecasting`).then(r => r.json());
        const headers = ['Metric', 'Value'];
        const rows = [
          ['Budget Headcount (Positions)', res.budgetHC],
          ['Active Headcount', res.activeHC],
          ['Offered HC (Awaiting Joining)', res.offeredHC],
          ['Vacancy HC', res.vacancyHC],
          ['Expected Joining HC', res.expectedJoiningHC],
          ['Forecasted Total HC', res.forecastedHC],
          ['Future Payroll Cost', fmtL(res.futurePayrollCost)],
          ['Future Budget Utilization', `${res.futureBudgetUtilization.toFixed(1)}%`],
          ['Expected Variance / (Deficit)', fmtL(res.expectedSavings)],
          ['Hiring Requirement (Open Vacancies)', res.hiringRequirementForecast],
          ['Avg Hiring Speed (positions/month)', res.forecastCompletionDates?.avgHiringSpeed],
          ['Expected Vacancy Closure (months)', res.forecastCompletionDates?.expectedClosureMonths],
        ];
        return { headers, rows };
      }
    },
  ];

  // ── Export Handler ─────────────────────────────────────────────────
  const handleExport = useCallback(async (report: ReportDef, format: ExportFormat) => {
    setLoadingId(`${report.id}_${format}`);
    try {
      const { headers, rows } = await report.generate();
      const filename = `${report.title.replace(/\s+/g, '_')}_${TODAY}`;
      if (format === 'csv') {
        downloadBlob(toCSV(headers, rows), `${filename}.csv`);
        showToast(`✅ ${report.title} — CSV downloaded`);
      } else if (format === 'excel') {
        downloadExcel(report.title, headers, rows, `${filename}.xls`);
        showToast(`✅ ${report.title} — Excel downloaded`);
      } else {
        printReport(report.title, headers, rows);
        showToast(`🖨️ ${report.title} — Print dialog opened`);
      }
    } catch (e) {
      console.error(e);
      showToast(`❌ Failed to generate ${report.title}`);
    } finally {
      setLoadingId(null);
    }
  }, []);

  const handlePreview = useCallback(async (report: ReportDef) => {
    setLoadingId(`${report.id}_preview`);
    try {
      const { headers, rows } = await report.generate();
      setPreviewData({ title: report.title, headers, rows: rows.slice(0, 20) });
    } catch (e) {
      showToast(`❌ Failed to preview ${report.title}`);
    } finally {
      setLoadingId(null);
    }
  }, []);

  const tags = ['All', 'Workforce', 'Finance', 'Recruitment', 'Analytics'];
  const [activeTag, setActiveTag] = useState('All');
  const filtered = activeTag === 'All' ? reports : reports.filter(r => r.tag === activeTag);

  return (
    <div className="min-h-screen space-y-8 pb-16">

      {/* ── Header Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 shadow-2xl">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, #6366f1 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 40%)'
        }} />
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Reports Center</h1>
              <p className="text-indigo-300 text-sm font-medium mt-0.5">Generate, preview & export business-ready reports</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-6 mt-6">
            {[
              { label: 'Total Reports', value: reports.length },
              { label: 'Export Formats', value: 3 },
              { label: 'Last Generated', value: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-white/80 text-sm font-semibold">{s.value} <span className="text-white/40 font-normal">{s.label}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filter Tags ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-slate-400" />
        {tags.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
              activeTag === tag
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {tag}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 font-medium">{filtered.length} report{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Report Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(report => (
          <ReportCard
            key={report.id}
            report={report}
            loadingId={loadingId}
            onExport={handleExport}
            onPreview={handlePreview}
          />
        ))}
      </div>

      {/* ── Preview Modal ── */}
      {previewData && (
        <PreviewModal
          data={previewData}
          onClose={() => setPreviewData(null)}
          onExportCSV={() => {
            downloadBlob(toCSV(previewData.headers, previewData.rows), `${previewData.title.replace(/\s+/g, '_')}_Preview.csv`);
            showToast('✅ CSV downloaded');
          }}
          onExportExcel={() => {
            downloadExcel(previewData.title, previewData.headers, previewData.rows, `${previewData.title.replace(/\s+/g, '_')}_Preview.xls`);
            showToast('✅ Excel downloaded');
          }}
          onPrint={() => printReport(previewData.title, previewData.headers, previewData.rows)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold animate-slide-up flex items-center gap-2">
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Report Card ────────────────────────────────────────────────────
interface ReportCardProps {
  report: ReportDef;
  loadingId: string | null;
  onExport: (r: ReportDef, f: ExportFormat) => void;
  onPreview: (r: ReportDef) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, loadingId, onExport, onPreview }) => {
  const isLoading = (format: string) => loadingId === `${report.id}_${format}`;
  const anyLoading = loadingId?.startsWith(report.id) ?? false;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
      {/* Gradient top bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${report.gradient}`} />

      <div className="p-6 flex flex-col flex-1">
        {/* Icon + Tag */}
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${report.iconBg} transition-all`}>
            {report.icon}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full">
            {report.tag}
          </span>
        </div>

        {/* Title + Desc */}
        <h3 className="text-base font-black text-slate-900 mb-1.5 leading-tight">{report.title}</h3>
        <p className="text-sm text-slate-500 font-medium leading-relaxed flex-1">{report.description}</p>

        {/* Preview button */}
        <button
          onClick={() => onPreview(report)}
          disabled={anyLoading}
          className="mt-5 mb-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50"
        >
          {isLoading('preview') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
          Preview Report
        </button>

        {/* Export buttons */}
        <div className="grid grid-cols-3 gap-2">
          {([
            { format: 'csv' as ExportFormat, label: 'CSV', icon: <FileText className="w-3.5 h-3.5" />, cls: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200' },
            { format: 'excel' as ExportFormat, label: 'Excel', icon: <FileSpreadsheet className="w-3.5 h-3.5" />, cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200' },
            { format: 'pdf' as ExportFormat, label: 'PDF', icon: <Printer className="w-3.5 h-3.5" />, cls: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200' },
          ] as const).map(({ format, label, icon, cls }) => (
            <button
              key={format}
              onClick={() => onExport(report, format)}
              disabled={anyLoading}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-colors disabled:opacity-40 ${cls}`}
            >
              {isLoading(format) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Preview Modal ──────────────────────────────────────────────────
interface PreviewModalProps {
  data: { title: string; headers: string[]; rows: any[][] };
  onClose: () => void;
  onExportCSV: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ data, onClose, onExportCSV, onExportExcel, onPrint }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
    <div
      className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[85vh] flex flex-col overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-black text-slate-900">{data.title}</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Showing first {data.rows.length} rows · Generated {new Date().toLocaleTimeString('en-IN')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onExportCSV} className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition">
            <FileText className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={onExportExcel} className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
          <button onClick={onPrint} className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition">
            <Printer className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={onClose} className="ml-2 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-slate-800 text-white">
            <tr>
              <th className="px-4 py-3 font-bold text-slate-300 w-8 text-center">#</th>
              {data.headers.map((h, i) => (
                <th key={i} className="px-4 py-3 font-bold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.rows.length === 0 ? (
              <tr><td colSpan={data.headers.length + 1} className="px-4 py-10 text-center text-slate-400 font-medium">No data available</td></tr>
            ) : (
              data.rows.map((row, ri) => (
                <tr key={ri} className={`hover:bg-indigo-50/50 transition-colors ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-4 py-3 text-center text-slate-400 font-bold">{ri + 1}</td>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap max-w-[200px] truncate" title={String(cell ?? '')}>
                      {cell ?? <span className="text-slate-300">—</span>}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-400 font-medium rounded-b-3xl">
        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Report date: {TODAY}</span>
        <span>{data.rows.length} records shown</span>
      </div>
    </div>
  </div>
);

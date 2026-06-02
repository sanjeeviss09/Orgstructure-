import React, { useState, useEffect, useMemo } from 'react';
import { Employee, DEFAULT_AVATAR, fetchTargets, HRTargets } from '../lib/api';
import type { Role } from '../App';
import { X, Mail, Users, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Search, Building2, Tag, Filter, Download, Eye, EyeOff, FileSpreadsheet, GitBranch } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

interface OrgChartProps {
  employees: Employee[];
  activeRole: Role;
  onNavigateToDetails?: (id: string) => void;
  onDepartmentClick?: (dept: string) => void;
}

// ─── Theming ──────────────────────────────────────────────────────────
const BU_THEMES: Record<string, { gradient: string; text: string; bg: string; border: string; icon: string; badge: string; }> = {
  'Executive':  { gradient: 'from-amber-400 to-orange-500',   text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: '👑', badge: 'bg-amber-100 text-amber-700'   },
  'Technology': { gradient: 'from-blue-500 to-indigo-600',    text: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    icon: '💻', badge: 'bg-blue-100 text-blue-700'    },
  'Growth':     { gradient: 'from-emerald-400 to-teal-500',   text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',  icon: '🚀', badge: 'bg-emerald-100 text-emerald-700' },
  'Sales':      { gradient: 'from-violet-500 to-purple-600',  text: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200',   icon: '💼', badge: 'bg-violet-100 text-violet-700'  },
  'Operations': { gradient: 'from-rose-400 to-pink-600',      text: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200',     icon: '⚙️', badge: 'bg-rose-100 text-rose-700'    },
};
const DT = { gradient: 'from-slate-400 to-slate-500', text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', icon: '🏢', badge: 'bg-slate-100 text-slate-700' };

const TIER_LABEL: Record<number, string> = { 1: 'C-Suite', 2: 'VP / CXO', 3: 'Head of Dept', 4: 'Manager', 5: 'Individual' };

const fmtCTC = (n: number) => {
  if (!n) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
};

// ─── Main Component ───────────────────────────────────────────────────
export const OrgChart: React.FC<OrgChartProps> = ({ employees, activeRole, onNavigateToDetails, onDepartmentClick }) => {
  const [selected, setSelected] = useState<Employee | null>(null);
  const [panelIn, setPanelIn] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [showCTC, setShowCTC] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'tree' | 'mindmap'>('tree');
  const [groupBy, setGroupBy] = useState<'reporting' | 'department'>('department');
  const [targets, setTargets] = useState<HRTargets | null>(null);
  const treeRef = React.useRef<HTMLDivElement>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [buFilter, setBuFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const canCTC = ['Admin', 'Management', 'HOD'].includes(activeRole);

  const businessUnits = useMemo(() => [...new Set(employees.map(e => e.business_unit).filter(Boolean))].sort(), [employees]);
  const departments = useMemo(() => [...new Set(employees.map(e => e.department).filter(Boolean))].sort(), [employees]);

  useEffect(() => {
    fetchTargets().then(setTargets).catch(console.error);
  }, []);

  const augmentedEmployees = useMemo(() => {
    // Map Inactive employees to Vacant, and filter out those that are replaced
    let result = employees
      .filter(e => e.employment_status !== 'Inactive') as Employee[];

    if (!targets) return result;


    targets.departments.forEach(deptTarget => {
      const deptName = deptTarget.department;
      
      if (deptTarget.designations && deptTarget.designations.length > 0) {
        deptTarget.designations.forEach(desig => {
          const actualHc = employees.filter(e => e.department === deptName && e.designation === desig.designation && e.employment_status !== 'Inactive').length;
          const vacancies = Math.max(0, desig.budgeted_hc - actualHc);
          
          if (vacancies > 0) {
            // Find a manager in this dept
            const deptEmps = employees.filter(e => e.department === deptName && e.employment_status !== 'Inactive');
            const manager = deptEmps.sort((a, b) => a.role_tier - b.role_tier)[0];
            
            for (let i = 0; i < vacancies; i++) {
              result.push({
                id: `vacant-${deptName}-${desig.designation}-${i}`,
                emp_id: '',
                full_name: 'Vacant Position',
                employment_status: 'Inactive',
                department: deptName,
                business_unit: manager?.business_unit || 'Operations',
                designation: desig.designation,
                role_tier: (manager?.role_tier || 4) + 1,
                photo_url: '',
                reporting_to_id: manager ? manager.id : null,
                company_name: 'Axxel',
                email_official: '',
                ctc_annual: desig.budget_allocated ? Math.round(desig.budget_allocated / desig.budgeted_hc) : 0,
                ctc_currency: 'INR',
                budget_allocated: desig.budget_allocated ? Math.round(desig.budget_allocated / desig.budgeted_hc) : 0,
                dashboard_access: 'No'
              });
            }
          }
        });
      } else {
        const actualHc = employees.filter(e => e.department === deptName && e.employment_status !== 'Inactive').length;
        const vacancies = Math.max(0, deptTarget.budgeted_hc - actualHc);
        
        if (vacancies > 0) {
          const deptEmps = employees.filter(e => e.department === deptName && e.employment_status !== 'Inactive');
          const manager = deptEmps.sort((a, b) => a.role_tier - b.role_tier)[0];
          
          for (let i = 0; i < vacancies; i++) {
            result.push({
              id: `vacant-${deptName}-${i}`,
              emp_id: '',
              full_name: 'Vacant Position',
              employment_status: 'Inactive',
              department: deptName,
              business_unit: manager?.business_unit || 'Operations',
              designation: 'Open Role',
              role_tier: (manager?.role_tier || 4) + 1,
              photo_url: '',
              reporting_to_id: manager ? manager.id : null,
              company_name: 'Axxel',
              email_official: '',
              ctc_annual: 0,
              ctc_currency: 'INR',
              budget_allocated: 0,
              dashboard_access: 'No'
            });
          }
        }
      }
    });
    
    if (groupBy === 'reporting') return result;

    const newEmps: Employee[] = [];
    const buSet = new Set<string>();
    const deptSet = new Set<string>();
    const subFuncSet = new Set<string>();

    result.forEach(e => {
      const bu = e.business_unit?.trim();
      const dept = e.department?.trim() || 'General';
      const subFunc = e.sub_function?.trim();
      
      const buId = bu ? `bu-${bu}` : null;
      const deptId = `dept-${bu || 'none'}-${dept}`;
      const subFuncId = subFunc ? `sub-${deptId}-${subFunc}` : null;
      
      if (bu && !buSet.has(buId!)) {
        buSet.add(buId!);
        newEmps.push({
          id: buId!,
          emp_id: '',
          full_name: bu,
          designation: 'Business Unit',
          business_unit: bu,
          department: '',
          employment_status: 'Active',
          role_tier: 1,
          reporting_to_id: null,
          photo_url: '',
          company_name: 'Axxel',
          email_official: '',
          ctc_annual: 0,
          ctc_currency: 'INR',
          budget_allocated: 0,
          dashboard_access: 'No'
        });
      }
      
      if (!deptSet.has(deptId)) {
        deptSet.add(deptId);
        newEmps.push({
          id: deptId,
          emp_id: '',
          full_name: dept,
          designation: 'Department',
          business_unit: bu || '',
          department: dept,
          employment_status: 'Active',
          role_tier: bu ? 2 : 1, // If no BU, Dept is the root
          reporting_to_id: buId,
          photo_url: '',
          company_name: 'Axxel',
          email_official: '',
          ctc_annual: 0,
          ctc_currency: 'INR',
          budget_allocated: 0,
          dashboard_access: 'No'
        });
      }

      if (subFunc && !subFuncSet.has(subFuncId!)) {
        subFuncSet.add(subFuncId!);
        newEmps.push({
          id: subFuncId!,
          emp_id: '',
          full_name: subFunc,
          designation: 'Sub Function',
          business_unit: bu || '',
          department: dept,
          sub_function: subFunc,
          employment_status: 'Active',
          role_tier: bu ? 3 : 2, // Depends on BU
          reporting_to_id: deptId,
          photo_url: '',
          company_name: 'Axxel',
          email_official: '',
          ctc_annual: 0,
          ctc_currency: 'INR',
          budget_allocated: 0,
          dashboard_access: 'No'
        });
      }

      let newReportingTo = subFuncId || deptId;
      if (e.reporting_to_id) {
        const mgr = result.find(m => m.id === e.reporting_to_id);
        if (mgr && mgr.department === e.department && mgr.business_unit === e.business_unit && mgr.sub_function === e.sub_function) {
          newReportingTo = mgr.id;
        }
      }

      let shift = 0;
      if (bu) shift++;
      shift++; // for dept
      if (subFunc) shift++; // for sub function

      newEmps.push({
        ...e,
        reporting_to_id: newReportingTo,
        role_tier: e.role_tier + shift
      });
    });
    
    return newEmps;
  }, [employees, targets, groupBy]);

  // Expand top levels by default on mount
  useEffect(() => {
    const defaultExpanded = new Set<string>();
    augmentedEmployees.forEach(e => {
      // Expand BU nodes by default, but keep Dept nodes collapsed to avoid huge empty horizontal lines
      if (groupBy === 'department') {
        if (e.designation === 'Business Unit') defaultExpanded.add(e.id);
        // Also expand Dept nodes if they are roots (meaning no BU)
        if (e.designation === 'Department' && !e.reporting_to_id) defaultExpanded.add(e.id);
      } else {
        if (e.role_tier <= 2) defaultExpanded.add(e.id);
      }
    });
    setExpandedNodes(defaultExpanded);
  }, [augmentedEmployees, groupBy]);

  const selectEmp = (emp: Employee) => {
    // If admin or management, navigate directly to details page when they click someone in the hierarchy
    if (onNavigateToDetails && ['Admin', 'Management'].includes(activeRole)) {
      onNavigateToDetails(emp.id);
      return;
    }
    
    // Otherwise show the slide-in panel
    if (selected?.id === emp.id) {
      setPanelIn(false);
      setTimeout(() => setSelected(null), 320);
    } else {
      setSelected(emp);
      setPanelIn(true);
    }
  };

  const closePanel = () => {
    setPanelIn(false);
    setTimeout(() => setSelected(null), 320);
  };

  const exportToExcel = () => {
    const headers = [
      'Emp ID', 'Full Name', 'Email', 'Designation', 'Department', 'Business Unit', 
      'Role Tier', 'Annual CTC', 'Budget Allocated', 'Employment Status', 'Reporting Manager'
    ];
    
    const getManagerName = (mgrId: string | null) => {
      if (!mgrId) return '';
      const mgr = employees.find(e => e.id === mgrId);
      return mgr ? mgr.full_name : '';
    };

    const rows = augmentedEmployees.map(e => [
      e.emp_id || '',
      e.full_name,
      e.email_official || '',
      e.designation,
      e.department || '',
      e.business_unit || '',
      e.role_tier,
      e.ctc_annual || 0,
      e.budget_allocated || 0,
      e.employment_status,
      getManagerName(e.reporting_to_id)
    ]);

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
    link.setAttribute('download', `axxel_org_structure_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadImage = async () => {
    const printDiv = document.getElementById('org-chart-download-target');
    if (!printDiv) return;
    setIsDownloading(true);
    try {
      // 1. Briefly make the div visible so the browser fully paints it
      printDiv.style.visibility = 'visible';
      printDiv.style.zIndex = '9999';

      // Ensure all custom web fonts (like Inter) are fully loaded and calculated before drawing
      if (document.fonts) {
        await document.fonts.ready;
      }

      // 2. Wait for all images inside to load
      const imgs = Array.from(printDiv.querySelectorAll('img')) as HTMLImageElement[];
      await Promise.all(imgs.map(img =>
        img.complete
          ? Promise.resolve()
          : new Promise(res => { img.onload = res; img.onerror = res; })
      ));
      // Small extra delay for layout engine to stabilize and repaint
      await new Promise(r => setTimeout(r, 400));

      const width = printDiv.scrollWidth;
      const height = printDiv.scrollHeight;

      // 3. Capture the fully-painted element
      const treeCanvas = await html2canvas(printDiv, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: false,
        removeContainer: true,
        width: width,
        height: height,
        scrollX: 0,
        scrollY: 0,
        windowWidth: width,
        windowHeight: height
      });

      // 4. Restore hidden state immediately after capture
      printDiv.style.visibility = 'hidden';
      printDiv.style.zIndex = '-999';

      const W = treeCanvas.width;
      const H = treeCanvas.height;

      // 5. Build the A4 landscape canvas (3508 x 2480 for 300 DPI)
      const a4W = 3508;
      const a4H = 2480;

      const a4Canvas = document.createElement('canvas');
      a4Canvas.width  = a4W;
      a4Canvas.height = a4H;
      const ctx = a4Canvas.getContext('2d')!;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, a4W, a4H);

      // Thin top accent bar
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, a4W, 24);

      // ── Header ──
      const HEADER_PX = 320;
      const FOOTER_PX = 160;
      const SIDE_PAD  = 160;

      ctx.fillStyle = '#0f172a';
      ctx.font = `900 80px Inter, Arial, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText('AXXEL ORGANIZATION STRUCTURE', SIDE_PAD, 140);

      ctx.fillStyle = '#64748b';
      ctx.font = `600 48px Inter, Arial, sans-serif`;
      ctx.fillText('Official Corporate Department & Reporting Hierarchy', SIDE_PAD, 220);

      // Divider
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(SIDE_PAD, HEADER_PX - 40);
      ctx.lineTo(a4W - SIDE_PAD, HEADER_PX - 40);
      ctx.stroke();

      // ── Calculate scaling to fit tree inside A4 margins ──
      const availW = a4W - SIDE_PAD * 2;
      const availH = a4H - HEADER_PX - FOOTER_PX;

      const scaleW = availW / W;
      const scaleH = availH / H;
      let scale = Math.min(scaleW, scaleH);
      
      // Don't blow up tiny trees too much
      if (scale > 2.5) scale = 2.5;

      const drawW = W * scale;
      const drawH = H * scale;

      // Center the tree horizontally and vertically within the available space
      const treeX = SIDE_PAD + (availW - drawW) / 2;
      const treeY = HEADER_PX + (availH - drawH) / 2;

      ctx.drawImage(treeCanvas, 0, 0, W, H, treeX, treeY, drawW, drawH);

      // ── Footer ──
      const footerY = a4H - FOOTER_PX / 2;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(SIDE_PAD, footerY - 40);
      ctx.lineTo(a4W - SIDE_PAD, footerY - 40);
      ctx.stroke();

      const dateStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
      ctx.fillStyle = '#94a3b8';
      ctx.font = `500 36px Inter, Arial, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(`Generated: ${dateStr}`, SIDE_PAD, footerY + 20);
      ctx.textAlign = 'right';
      ctx.fillText('CONFIDENTIAL  |  FOR INTERNAL USE ONLY', a4W - SIDE_PAD, footerY + 20);

      // 6. Download as PDF
      const dataUrl = a4Canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4'
      });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfW, pdfH, undefined, 'FAST');
      pdf.save(`org-chart-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err: any) {
      // Make sure we restore visibility on error
      const pd = document.getElementById('org-chart-download-target');
      if (pd) { pd.style.visibility = 'hidden'; pd.style.zIndex = '-999'; }
      console.error('Download failed', err);
      alert(`Download failed: ${err.message || err}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleNode = (id: string, force?: boolean) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (force === true) next.add(id);
      else if (force === false) next.delete(id);
      else next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getReports = (e: Employee) => augmentedEmployees.filter(x => x.reporting_to_id === e.id);
  const getManager = (e: Employee) => e.reporting_to_id ? augmentedEmployees.find(x => x.id === e.reporting_to_id) : undefined;

  // Filtering Logic
  const hasActiveFilter = search.trim() !== '' || buFilter !== '' || deptFilter !== '';

  const isMatch = (e: Employee) => {
    if (!hasActiveFilter) return true;
    const s = search.toLowerCase();
    const matchS = !s || e.full_name.toLowerCase().includes(s) || e.designation.toLowerCase().includes(s);
    const matchBU = !buFilter || e.business_unit === buFilter;
    const matchD = !deptFilter || e.department === deptFilter;
    return matchS && matchBU && matchD;
  };

  // Pre-calculate matches and their ancestors so we can auto-expand paths to matches
  const matchContext = useMemo(() => {
    if (!hasActiveFilter) {
      return {
        matchedIds: new Set<string>(),
        effectiveParentMap: new Map<string, string | null>(),
        roots: augmentedEmployees.filter(e => !e.reporting_to_id || !augmentedEmployees.some(x => x.id === e.reporting_to_id)).sort((a, b) => a.role_tier - b.role_tier)
      };
    }
    
    const empMap = new Map(augmentedEmployees.map(e => [e.id, e]));
    const matched = augmentedEmployees.filter(isMatch);
    const matchedIds = new Set(matched.map(e => e.id));
    
    const effectiveParentMap = new Map<string, string | null>();
    matched.forEach(e => {
      let curr = e.reporting_to_id;
      let effParent: string | null = null;
      while (curr && empMap.has(curr)) {
        if (matchedIds.has(curr)) {
          effParent = curr;
          break;
        }
        curr = empMap.get(curr)?.reporting_to_id ?? null;
      }
      effectiveParentMap.set(e.id, effParent);
    });

    const roots = matched.filter(e => effectiveParentMap.get(e.id) === null).sort((a, b) => a.role_tier - b.role_tier);

    return { matchedIds, effectiveParentMap, roots };
  }, [augmentedEmployees, search, buFilter, deptFilter, hasActiveFilter]);

  // Auto-expand nodes that have matching children when filtering
  useEffect(() => {
    if (hasActiveFilter) {
      setExpandedNodes(new Set(matchContext.matchedIds));
    }
  }, [matchContext, hasActiveFilter]);

  if (!augmentedEmployees.length) return (
    <div className="flex flex-col items-center justify-center py-28 text-slate-400">
      <Users className="w-14 h-14 mb-4 opacity-30" />
      <p className="font-bold text-lg">No employees to display</p>
    </div>
  );

  return (
    <div className="relative h-[calc(100vh-140px)] flex flex-col bg-slate-50 overflow-hidden rounded-3xl border border-slate-200/60 shadow-inner">
      
      {/* ── Floating Toolbar ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/80 backdrop-blur-xl border border-slate-200/80 p-2 rounded-2xl shadow-lg">
        <div className="flex items-center gap-2 px-3 py-1.5 border-r border-slate-200/60">
          <Filter className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold text-slate-700">Filters</span>
        </div>
        
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <input 
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name or role..." 
            className="w-48 pl-9 pr-3 py-2 bg-slate-100/50 hover:bg-slate-100 border border-transparent focus:border-slate-300 focus:bg-white rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all"
          />
        </div>

        <select 
          value={buFilter} onChange={e => setBuFilter(e.target.value)}
          className="w-40 px-3 py-2 bg-slate-100/50 hover:bg-slate-100 border border-transparent focus:border-slate-300 focus:bg-white rounded-xl text-sm font-medium text-slate-800 outline-none cursor-pointer transition-all appearance-none"
        >
          <option value="">All Business Units</option>
          {businessUnits.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <select 
          value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="w-40 px-3 py-2 bg-slate-100/50 hover:bg-slate-100 border border-transparent focus:border-slate-300 focus:bg-white rounded-xl text-sm font-medium text-slate-800 outline-none cursor-pointer transition-all appearance-none"
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {(hasActiveFilter) && (
          <button 
            onClick={() => { setSearch(''); setBuFilter(''); setDeptFilter(''); }}
            className="p-2 ml-1 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl transition-colors"
            title="Clear filters"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {canCTC && (
          <button 
            onClick={() => setShowCTC(!showCTC)}
            className="flex items-center gap-1.5 px-3 py-1.5 ml-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors font-bold text-xs border border-slate-200"
            title="Toggle CTC Visibility"
          >
            {showCTC ? <EyeOff className="w-4 h-4 text-rose-500" /> : <Eye className="w-4 h-4 text-emerald-600" />}
            {showCTC ? 'Hide CTC' : 'Show CTC'}
          </button>
        )}

        <button 
          onClick={() => setLayoutMode(prev => prev === 'tree' ? 'mindmap' : 'tree')}
          className={`flex items-center gap-1.5 px-3 py-1.5 ml-2 rounded-xl transition-colors font-bold text-xs border ${
            layoutMode === 'mindmap' 
              ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' 
              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
          }`}
          title="Toggle layout between Hierarchy Tree and Mindmap"
        >
          <GitBranch className="w-4 h-4" />
          {layoutMode === 'mindmap' ? 'Show Tree' : 'Show Mindmap'}
        </button>

        <button 
          onClick={() => setGroupBy(prev => prev === 'reporting' ? 'department' : 'reporting')}
          className={`flex items-center gap-1.5 px-3 py-1.5 ml-2 rounded-xl transition-colors font-bold text-xs border ${
            groupBy === 'department' 
              ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700' 
              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
          }`}
          title="Group by Department"
        >
          <Building2 className="w-4 h-4" />
          {groupBy === 'department' ? 'By Reporting' : 'By Department'}
        </button>

        <div className="w-px h-6 bg-slate-200/80 mx-1"></div>

        <button 
          onClick={exportToExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors font-bold text-xs border border-emerald-200/60"
          title="Export Active Structure to Excel"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> 
          Excel
        </button>

        <button 
          onClick={downloadImage}
          disabled={isDownloading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors font-bold text-xs"
          title="Download as PDF"
        >
          {isDownloading ? (
            <svg className="animate-spin w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : (
            <Download className="w-4 h-4" /> 
          )}
          {isDownloading ? 'Saving...' : 'Download'}
        </button>
      </div>

      {/* ── Tree Canvas ── */}
      <div 
        className="flex-1 w-full h-full overflow-hidden relative"
        style={{ 
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', 
          backgroundSize: '24px 24px',
          paddingRight: selected ? 400 : 0,
          transition: 'padding-right 0.35s cubic-bezier(0.25,1,0.5,1)'
        }}
      >
        <TransformWrapper
          initialScale={1}
          minScale={0.2}
          maxScale={3}
          centerOnInit={true}
          limitToBounds={false}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Toolbar Controls */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-md border border-slate-200/80 p-2 rounded-xl shadow-lg">
                <button onClick={() => zoomOut()} className="px-3 py-1.5 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-colors">Zoom Out</button>
                <button onClick={() => resetTransform()} className="px-3 py-1.5 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-colors">Reset</button>
                <button onClick={() => zoomIn()} className="px-3 py-1.5 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-colors">Zoom In</button>
                <div className="w-px h-4 bg-slate-300 mx-1" />
                <button onClick={() => setExpandedNodes(new Set(augmentedEmployees.map(e => e.id)))} className="px-3 py-1.5 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-colors">Expand All</button>
                <button onClick={() => setExpandedNodes(new Set())} className="px-3 py-1.5 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-colors">Collapse All</button>
              </div>

              <TransformComponent wrapperStyle={{ width: '100%', height: '100%', minHeight: 'calc(100vh - 4rem)' }} contentStyle={{ padding: '140px 100px 140px 100px', minWidth: '100%', display: 'flex', justifyContent: 'center' }}>
                <div ref={treeRef} className="pb-24 min-w-max">
                  <OrgTreeView
                    employees={augmentedEmployees}
                    selectEmp={selectEmp}
                    selected={selected}
                    getReports={getReports}
                    expandedNodes={expandedNodes}
                    toggleNode={toggleNode}
                    matchContext={matchContext}
                    hasActiveFilter={hasActiveFilter}
                    onDepartmentClick={onDepartmentClick}
                    showCTC={showCTC}
                    canCTC={canCTC}
                    layoutMode={layoutMode}
                  />
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      {/* ── Hidden Print Target for A4 Download ── */}
      {/* IMPORTANT: visibility:hidden at position:fixed top:0 left:0 lets the browser
          fully PAINT this element (unlike off-screen left:-9999px), so html2canvas
          can capture it with correct colors, fonts, and images. */}
      <div
        id="org-chart-download-target"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          visibility: 'hidden',
          zIndex: -999,
          background: '#ffffff',
          padding: '60px',
          width: 'max-content',
          pointerEvents: 'none',
        }}
      >
        <OrgTreeView
          employees={augmentedEmployees}
          selectEmp={() => {}}
          selected={null}
          getReports={getReports}
          expandedNodes={hasActiveFilter ? new Set(matchContext.matchedIds) : new Set(augmentedEmployees.map(e => e.id))}
          toggleNode={() => {}}
          matchContext={matchContext}
          hasActiveFilter={hasActiveFilter}
          isPrint={true}
          onDepartmentClick={onDepartmentClick}
          showCTC={showCTC}
          canCTC={canCTC}
          layoutMode={layoutMode}
        />
      </div>

      {/* ── Slide-in Profile Panel ── */}
      {selected && (
        <div key={selected.id}
          className="absolute right-0 top-0 bottom-0 bg-white/95 backdrop-blur-xl border-l border-white/20 shadow-[-10px_0_40px_rgba(0,0,0,0.08)] overflow-y-auto z-40"
          style={{
            width: 400,
            animation: panelIn ? 'slideRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) both' : 'slideRightOut 0.3s ease both',
          }}
        >
          <div className="sticky top-0 z-10 backdrop-blur-md bg-white/70 border-b border-slate-100 p-4 flex justify-between items-center">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Employee Profile
            </h4>
            <button onClick={closePanel} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6">
            <div className="flex flex-col items-center text-center mb-8">
              <div className={`w-28 h-28 rounded-full p-1 bg-gradient-to-br ${(BU_THEMES[selected.business_unit] ?? DT).gradient} mb-4 shadow-xl`}>
                <img src={selected.photo_url || DEFAULT_AVATAR} alt={selected.full_name} className="w-full h-full object-cover rounded-full border-4 border-white" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
                {selected.full_name}
                {selected.emp_id && (
                   <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">
                     {selected.emp_id}
                   </span>
                )}
              </h3>
              <p className="text-indigo-600 font-bold text-sm mt-1">{selected.designation}</p>
              
              <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> {selected.business_unit}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                  <Tag className="w-3.5 h-3.5 text-slate-400" /> {selected.department}
                </span>
                {selected.sub_function && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                    <GitBranch className="w-3.5 h-3.5 text-slate-400" /> {selected.sub_function}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <a href={`mailto:${selected.email_official}`}
                className="flex items-center gap-4 p-4 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md rounded-2xl transition-all group">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Official Email</p>
                  <p className="text-sm text-slate-800 font-semibold truncate mt-0.5">{selected.email_official}</p>
                </div>
              </a>

              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Tier" value={`Tier ${selected.role_tier}`} sub={TIER_LABEL[selected.role_tier]} />
                <StatCard label="Status" value={selected.employment_status} sub={selected.company_name} />
                {canCTC && (
                  <>
                    <StatCard label="Annual CTC" value={fmtCTC(selected.ctc_annual)} mono />
                    <StatCard label="Budget" value={fmtCTC(selected.budget_allocated)} mono />
                  </>
                )}
              </div>

              {/* Reports To */}
              {(() => {
                const mgr = getManager(selected);
                return mgr ? (
                  <div className="pt-4 border-t border-slate-100 mt-6">
                    <PanelLabel>Reports To</PanelLabel>
                    <MiniCard emp={mgr} onPick={() => selectEmp(mgr)} />
                  </div>
                ) : null;
              })()}

              {/* Team */}
              {(() => {
                const rpts = getReports(selected).sort((a, b) => a.role_tier - b.role_tier);
                return (
                  <div className="pt-4 border-t border-slate-100 mt-6">
                    <PanelLabel>{rpts.length > 0 ? `Direct Reports (${rpts.length})` : 'Team'}</PanelLabel>
                    {rpts.length > 0 ? (
                      <div className="space-y-3">
                        {rpts.map((r, ri) => (
                          <div key={r.id} style={{ animation: `fadeUp 0.3s ease ${ri * 40}ms both` }}>
                            <MiniCard emp={r} onPick={() => selectEmp(r)} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-sm text-slate-400 font-medium bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                        No direct reports
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Recursive Tree Components ────────────────────────────────────────

interface TreeSharedProps {
  employees: Employee[];
  selectEmp: (e: Employee) => void;
  selected: Employee | null;
  getReports: (e: Employee) => Employee[];
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
  matchContext: {
    matchedIds: Set<string>;
    effectiveParentMap: Map<string, string | null>;
    roots: Employee[];
  };
  hasActiveFilter: boolean;
  isPrint?: boolean;
  onDepartmentClick?: (dept: string) => void;
  showCTC?: boolean;
  canCTC?: boolean;
  layoutMode: 'tree' | 'mindmap';
}

const OrgTreeView: React.FC<TreeSharedProps> = (props) => {
  const { matchContext, hasActiveFilter, employees, isPrint } = props;
  
  const empIds = useMemo(() => new Set(employees.map(e => e.id)), [employees]);
  const normalRoots = useMemo(() => {
    let rts = employees
      .filter(e => !e.reporting_to_id || !empIds.has(e.reporting_to_id) || e.reporting_to_id === e.id)
      .sort((a, b) => a.role_tier - b.role_tier);

    // Fallback: If still no roots (e.g. strict circular dependency like A->B->C->A)
    if (rts.length === 0 && employees.length > 0) {
      const highestTier = Math.min(...employees.map(e => e.role_tier));
      rts = employees.filter(e => e.role_tier === highestTier);
    }
    return rts;
  }, [employees, empIds]);

  const roots = hasActiveFilter ? matchContext.roots : normalRoots;

  const isMindmap = props.layoutMode === 'mindmap';

  return (
    <div 
      className={isPrint ? '' : (isMindmap ? 'flex flex-col items-start gap-12' : 'flex justify-center gap-12')} 
      style={isPrint ? {
        display: 'flex',
        flexDirection: isMindmap ? 'column' : 'row',
        justifyContent: isMindmap ? 'flex-start' : 'center',
        alignItems: isMindmap ? 'flex-start' : 'center',
      } : { animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both' }}
    >
      {roots.map(root => (
        <div key={root.id} style={isPrint ? (isMindmap ? { padding: '24px 0' } : { padding: '0 24px' }) : undefined}>
          <OrgTreeNode emp={root} {...props} />
        </div>
      ))}
    </div>
  );
};

const OrgTreeNode: React.FC<TreeSharedProps & { emp: Employee }> = (props) => {
  const { emp, selectEmp, selected, getReports, expandedNodes, toggleNode, matchContext, hasActiveFilter } = props;
  
  const children = hasActiveFilter 
    ? Array.from(matchContext.matchedIds)
        .map(id => props.employees.find(e => e.id === id)!)
        .filter(e => matchContext.effectiveParentMap.get(e.id) === emp.id)
        .sort((a, b) => a.role_tier - b.role_tier)
    : getReports(emp).sort((a, b) => a.role_tier - b.role_tier);

  const isExpanded = expandedNodes.has(emp.id);
  const theme = BU_THEMES[emp.business_unit] ?? DT;
  const active = selected?.id === emp.id;
  const isPrint = props.isPrint;
  const isMindmap = props.layoutMode === 'mindmap';

  const opacityClass = emp.employment_status === 'Inactive' ? 'opacity-60 grayscale' : '';
  
  // New Employee Check (within last 30 days)
  const isNewEmployee = emp.join_date 
    ? (new Date().getTime() - new Date(emp.join_date).getTime()) <= (30 * 24 * 3600 * 1000)
    : false;

  const isVirtualNode = emp.designation === 'Business Unit' || emp.designation === 'Department';

  const cardContent = (
    <div 
      onClick={() => {
        if (!isVirtualNode) {
          selectEmp(emp);
        }
      }}
      className={[
        'w-64 border flex items-center gap-3 text-left transition-all duration-300',
        isPrint
          ? 'border-slate-200 rounded-xl p-3'
          : [
              'rounded-2xl bg-white pt-3 pl-3',
              isMindmap
                ? (children.length > 0 ? 'pr-6 pb-3' : 'pr-3 pb-3')
                : (children.length > 0 ? 'pr-3 pb-6' : 'pr-3 pb-3'),
              active
                ? `border-indigo-400 shadow-[0_0_0_2px_rgba(99,102,241,0.2)] shadow-xl ring-2 ring-indigo-500/50 scale-105 z-10 cursor-pointer`
                : isVirtualNode
                  ? 'border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-default'
                  : 'border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 cursor-pointer'
            ].join(' ')
      ].join(' ')}
      style={isPrint ? {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        textAlign: 'left',
        padding: '12px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        position: 'relative',
        width: '256px',
        boxSizing: 'border-box'
      } : { position: 'relative' }}
    >
      {/* Left colored accent strip */}
      <div
        style={isPrint ? {
          position: 'absolute',
          left: 0, top: 16, bottom: 16,
          width: 5,
          borderRadius: '0 4px 4px 0',
          background: (
            emp.business_unit === 'Technology' ? '#4f46e5' :
            emp.business_unit === 'Growth' ? '#059669' :
            emp.business_unit === 'Sales' ? '#7c3aed' :
            emp.business_unit === 'Operations' ? '#e11d48' :
            emp.business_unit === 'Executive' ? '#d97706' : '#64748b'
          )
        } : undefined}
        className={isPrint ? '' : `absolute left-0 top-4 bottom-4 w-1.5 rounded-r-full bg-gradient-to-b ${theme.gradient}`}
      />
      
      <div 
        style={isPrint ? { position: 'relative', flexShrink: 0, marginLeft: '6px', marginRight: '12px' } : undefined}
        className="relative shrink-0 ml-1.5"
      >
        <img 
          src={emp.photo_url || DEFAULT_AVATAR} 
          alt={emp.full_name} 
          style={isPrint ? { width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ffffff', display: 'block' } : undefined}
          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" 
        />
        {emp.employment_status === 'Under Notice Period' && (
           <div 
             style={isPrint ? { position: 'absolute', bottom: -4, right: -4, width: 16, height: 16, backgroundColor: '#f59e0b', border: '2px solid #ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 } : undefined}
             className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm" 
             title="Under Notice"
           >
             <span style={isPrint ? { color: '#ffffff', fontSize: 8, fontWeight: 900, lineHeight: 1 } : undefined} className="text-white text-[8px] font-black">!</span>
           </div>
        )}
      </div>
      
      <div className="min-w-0 flex-1" style={isPrint ? { overflow: 'visible', textAlign: 'left', minWidth: 0, flex: 1 } : undefined}>
        <h4
          className={isPrint ? "font-extrabold text-sm flex items-center gap-2" : "font-extrabold text-sm truncate flex items-center gap-2"}
          style={{ color: '#1e293b', fontWeight: 800, lineHeight: isPrint ? '1.5' : undefined, overflow: isPrint ? 'visible' : undefined, whiteSpace: isPrint ? 'normal' : undefined }}
        >
          {emp.employment_status === 'Inactive' ? 'Vacant Position' : emp.full_name}
          {emp.emp_id && (
            <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200" title="Employee ID">
              {emp.emp_id}
            </span>
          )}
        </h4>
        {/* Hide sub-label for dept/BU header nodes */}
        {emp.designation !== 'Department' && emp.designation !== 'Business Unit' && (
          <p
            className={isPrint ? "text-[11px] font-semibold" : "text-[11px] font-semibold truncate mt-0.5"}
            style={{ color: '#64748b', lineHeight: isPrint ? '1.4' : undefined, overflow: isPrint ? 'visible' : undefined, whiteSpace: isPrint ? 'normal' : undefined }}
          >
            {emp.designation}
          </p>
        )}
        <div 
          style={isPrint ? { marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' } : undefined}
          className="mt-1.5 flex items-center gap-1.5 cursor-pointer hover:opacity-80"
          onClick={(e) => {
            e.stopPropagation();
            if (props.onDepartmentClick && emp.department) props.onDepartmentClick(emp.department);
          }}
        >
          {/* Hide dept badge for dept/BU header nodes (they already ARE the dept name) */}
          {emp.designation !== 'Department' && emp.designation !== 'Business Unit' && (
            <span style={{
              display: 'inline-block', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
              padding: '2px 5px', borderRadius: 4, lineHeight: 'normal',
              backgroundColor: (
                emp.business_unit === 'Technology' ? '#e0e7ff' : emp.business_unit === 'Growth' ? '#d1fae5' :
                emp.business_unit === 'Sales' ? '#ede9fe' : emp.business_unit === 'Operations' ? '#ffe4e6' :
                emp.business_unit === 'Executive' ? '#fef3c7' : '#f1f5f9'
              ),
              color: (
                emp.business_unit === 'Technology' ? '#3730a3' : emp.business_unit === 'Growth' ? '#065f46' :
                emp.business_unit === 'Sales' ? '#5b21b6' : emp.business_unit === 'Operations' ? '#9f1239' :
                emp.business_unit === 'Executive' ? '#92400e' : '#334155'
              ),
            }}>{emp.department}</span>
          )}
        </div>

        {/* Show CTC for active employees (with toggle) OR always show budgeted CTC for vacant positions */}
        {emp.employment_status === 'Inactive' && emp.ctc_annual > 0 && (
          <div 
            className={isPrint ? "mt-1.5 text-[10px] font-black" : "mt-1.5 text-[10px] font-black truncate"}
            style={{ color: '#f59e0b', lineHeight: isPrint ? '1.4' : undefined }}
          >
            Budget: {fmtCTC(emp.ctc_annual)}
          </div>
        )}
        {props.canCTC && props.showCTC && emp.employment_status !== 'Inactive' && !isVirtualNode && (
          <div 
            className={isPrint ? "mt-1.5 text-[10px] font-black" : "mt-1.5 text-[10px] font-black truncate"}
            style={{ color: '#059669', lineHeight: isPrint ? '1.4' : undefined, overflow: isPrint ? 'visible' : undefined, whiteSpace: isPrint ? 'normal' : undefined }}
          >
            CTC: {fmtCTC(emp.ctc_annual)}
          </div>
        )}

        {isNewEmployee && (
          <div className="absolute -top-3 -right-3 z-20">
            <span className="flex items-center gap-1 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white text-[9px] px-2 py-0.5 rounded shadow-sm uppercase font-black tracking-widest border border-emerald-300">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> New
            </span>
          </div>
        )}
        {emp.employment_status === 'Under Notice Period' && emp.notice_start_date && (
          <div
            className={isPrint ? "mt-1 text-[9px] font-bold" : "mt-1 text-[9px] font-bold truncate"}
            style={{ color: '#d97706', lineHeight: isPrint ? '1.4' : undefined, overflow: isPrint ? 'visible' : undefined, whiteSpace: isPrint ? 'normal' : undefined }}
          >
            Notice: {90 - Math.floor((new Date().getTime() - new Date(emp.notice_start_date).getTime()) / (1000 * 3600 * 24))} Days Left
          </div>
        )}
      </div>
    </div>
  );

  if (isMindmap) {
    return (
      <div className={`flex items-center ${opacityClass}`}>
        {/* ── Node Card & Expand/Collapse Button ── */}
        <div className="relative group shrink-0">
          {cardContent}

          {/* Expand/Collapse Button on the right edge */}
          {!isPrint && children.length > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); toggleNode(emp.id); }}
              className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 shadow-sm z-10 transition-colors"
            >
              {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {!isExpanded && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border border-white">
                  {children.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* ── Children Sub-tree (horizontal extension) ── */}
        {/* When isPrint=true, always show ALL children regardless of expandedNodes */}
        {(isPrint || isExpanded) && children.length > 0 && (
          <div className="flex items-center">
            {/* Horizontal line extending from parent card to the children block */}
            <div 
              className={isPrint ? '' : 'w-8 h-0.5 bg-slate-300/70 shrink-0'} 
              style={isPrint ? { width: '32px', height: '2px', backgroundColor: '#cbd5e1', flexShrink: 0 } : undefined}
            />
            
            {/* Vertical stack of children */}
            <div 
              className={isPrint ? '' : 'flex flex-col gap-6 relative border-l-2 border-slate-300/70 pl-6 py-2'}
              style={isPrint ? {
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                position: 'relative',
                borderLeft: '2px solid #cbd5e1',
                paddingLeft: '24px',
                paddingTop: '8px',
                paddingBottom: '8px'
              } : undefined}
            >
              {children.map((child) => (
                <div key={child.id} className="flex items-center relative">
                  {/* Small horizontal connecting line from the vertical left border to the child node */}
                  <div 
                    className={isPrint ? '' : 'absolute -left-6 w-6 h-0.5 bg-slate-300/70'} 
                    style={isPrint ? {
                      position: 'absolute',
                      left: '-24px',
                      width: '24px',
                      height: '2px',
                      backgroundColor: '#cbd5e1'
                    } : undefined}
                  />
                  
                  <OrgTreeNode {...props} emp={child} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Otherwise: Vertical Tree Layout
  return (
    <div className={`flex flex-col items-center ${opacityClass}`}>
      {/* ── Node Card & Expand/Collapse Button ── */}
      <div className="relative group">
        {cardContent}

        {/* Expand/Collapse Button at the bottom edge */}
        {!isPrint && children.length > 0 && (
          <button 
            onClick={(e) => { e.stopPropagation(); toggleNode(emp.id); }}
            className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 shadow-sm z-10 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {!isExpanded && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border border-white">
                {children.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* ── Children Sub-tree ── */}
      {/* When isPrint=true, always show ALL children regardless of expandedNodes */}
      <div
        className={
          isPrint
            ? 'flex flex-col items-center'
            : `flex flex-col items-center transition-all duration-500 origin-top ${
                isExpanded
                  ? 'opacity-100 scale-y-100 max-h-[10000px]'
                  : 'opacity-0 scale-y-0 max-h-0 overflow-hidden'
              }`
        }
      >
        {children.length > 0 && (
          <>
            {/* Vertical drop from parent */}
            <div 
              className={isPrint ? '' : 'w-0.5 h-8 bg-slate-300/70 rounded-full mt-2'} 
              style={isPrint ? {
                width: '2px',
                height: '32px',
                backgroundColor: '#cbd5e1',
                borderRadius: '9999px',
                marginTop: '8px'
              } : undefined}
            />

            {/* Horizontal distributor and children */}
            <div className="flex items-start">
              {children.map((child, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === children.length - 1;
                const isOnly = children.length === 1;
                
                return (
                  <div key={child.id} className="flex flex-col items-center relative" style={{ padding: '0 16px' }}>
                    {/* Horizontal connecting line */}
                    {!isOnly && (
                      <div 
                        className={isPrint ? '' : 'absolute top-0 h-0.5 bg-slate-300/70'} 
                        style={isPrint ? {
                          position: 'absolute',
                          top: 0,
                          height: '2px',
                          backgroundColor: '#cbd5e1',
                          left: isFirst ? '50%' : 0,
                          right: isLast ? '50%' : 0,
                          borderTopLeftRadius: isFirst ? 4 : 0,
                          borderTopRightRadius: isLast ? 4 : 0,
                        } : {
                          left: isFirst ? '50%' : 0,
                          right: isLast ? '50%' : 0,
                          borderTopLeftRadius: isFirst ? 4 : 0,
                          borderTopRightRadius: isLast ? 4 : 0,
                        }} 
                      />
                    )}
                    {/* Vertical drop to child */}
                    <div 
                      className={isPrint ? '' : 'w-0.5 h-8 bg-slate-300/70'} 
                      style={isPrint ? {
                        width: '2px',
                        height: '32px',
                        backgroundColor: '#cbd5e1'
                      } : undefined}
                    />
                    
                    <OrgTreeNode {...props} emp={child} />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────

const PanelLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{children}</p>
);

const StatCard: React.FC<{ label: string; value: string; sub?: string; mono?: boolean }> = ({ label, value, sub, mono }) => (
  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">{label}</div>
    <div className={`font-black text-slate-800 text-sm ${mono ? 'font-mono tracking-tight' : ''}`}>{value}</div>
    {sub && <div className="text-[10px] text-slate-500 font-semibold mt-1 truncate px-2">{sub}</div>}
  </div>
);

const MiniCard: React.FC<{ emp: Employee; onPick: () => void }> = ({ emp, onPick }) => (
  <div onClick={onPick}
    className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all group">
    <img src={emp.photo_url || DEFAULT_AVATAR} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors">{emp.full_name}</p>
      <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{emp.designation}</p>
    </div>
    <div className="flex flex-col items-end gap-1 shrink-0">
      <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">T{emp.role_tier}</span>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
    </div>
  </div>
);

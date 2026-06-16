import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Employee, Position, DEFAULT_AVATAR, fetchTargets, HRTargets } from '../lib/api';
import type { Role } from '../App';
import { X, Mail, Users, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Search, Building2, Tag, Filter, Download, Eye, EyeOff, FileSpreadsheet, GitBranch } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

export interface PositionNode {
  position: Position;
  occupants: Employee[];
}

export const STATUS_CONFIG: Record<string, { letter: string; label: string; bg: string; text: string; border: string; glow: string }> = {
  'Active':             { letter: 'Ⓐ', label: 'Active',              bg: 'bg-emerald-500',  text: 'text-white', border: 'border-emerald-600', glow: '#10b981' },
  'Vacant Position':    { letter: 'Ⓥ', label: 'Vacant',              bg: 'bg-slate-400',    text: 'text-white', border: 'border-slate-500',   glow: '#94a3b8' },
  'Inactive':           { letter: 'Ⓥ', label: 'Vacant',              bg: 'bg-slate-400',    text: 'text-white', border: 'border-slate-500',   glow: '#94a3b8' },
  'Offered Yet to Join':{ letter: 'Ⓞ', label: 'Offered Yet to Join', bg: 'bg-blue-500',     text: 'text-white', border: 'border-blue-600',    glow: '#3b82f6' },
  'Resigned on Roll':   { letter: 'Ⓡ', label: 'Resigned on Roll',    bg: 'bg-orange-500',   text: 'text-white', border: 'border-orange-600',  glow: '#f97316' },
  'Replacement Joined': { letter: 'Ⓟ', label: 'Replacement Joined',  bg: 'bg-indigo-500',   text: 'text-white', border: 'border-indigo-600',  glow: '#6366f1' },
  'Under Notice Period':{ letter: 'Ⓡ', label: 'Resigned on Roll',    bg: 'bg-orange-500',   text: 'text-white', border: 'border-orange-600',  glow: '#f97316' },
  'Hold':               { letter: 'Ⓗ', label: 'Hold',                bg: 'bg-red-500',      text: 'text-white', border: 'border-red-600',     glow: '#ef4444' },
  'Frozen':             { letter: 'Ⓕ', label: 'Frozen',              bg: 'bg-cyan-500',     text: 'text-white', border: 'border-cyan-600',    glow: '#06b6d4' },
  'Merged':             { letter: 'Ⓜ', label: 'Merged',              bg: 'bg-purple-500',   text: 'text-white', border: 'border-purple-600',  glow: '#a855f7' },
  'Combined Position':  { letter: 'Ⓒ', label: 'Combined Position',   bg: 'bg-fuchsia-500',  text: 'text-white', border: 'border-fuchsia-600', glow: '#d946ef' },
  'Transfer Pending':   { letter: 'Ⓣ', label: 'Transfer Pending',    bg: 'bg-amber-500',    text: 'text-white', border: 'border-amber-600',   glow: '#f59e0b' },
};

export const STATUS_MAP: Record<string, string> = {
  'A': 'Active',
  'V': 'Vacant Position',
  'OYJ': 'Offered Yet to Join',
  'RoR': 'Resigned on Roll',
  'RP': 'Replacement Joined',
  'H': 'Hold',
  'F': 'Frozen',
  'M': 'Merged',
  'C': 'Combined Position',
  'T': 'Transfer Pending'
};

export const STATUS_SYMBOLS: Record<string, string> = {
  'Active': 'Ⓐ', 'Vacant Position': 'Ⓥ', 'Inactive': 'Ⓥ', 'Offered Yet to Join': 'Ⓞ', 
  'Resigned on Roll': 'Ⓡ', 'Replacement Joined': 'Ⓟ', 'Hold': 'Ⓗ', 'Frozen': 'Ⓕ', 
  'Merged': 'Ⓜ️', 'Combined Position': 'Ⓒ', 'Transfer Pending': 'Ⓣ', 'Under Notice Period': 'Ⓡ'
};

export const STATUS_TITLES: Record<string, string> = {
  'Active': 'Active', 'Vacant Position': 'Vacant', 'Inactive': 'Vacant', 'Offered Yet to Join': 'Offered Yet to Join', 
  'Resigned on Roll': 'Resigned on Roll', 'Replacement Joined': 'Replacement Joined', 'Hold': 'Hold', 'Frozen': 'Frozen', 
  'Merged': 'Merged', 'Combined Position': 'Combined', 'Transfer Pending': 'Transfer Pending', 'Under Notice Period': 'Resigned on Roll'
};

interface OrgChartProps {
  employees: Employee[];
  positions: Position[];
  activeRole: Role;
  onNavigateToDetails?: (id: string) => void;
  onDepartmentClick?: (dept: string) => void;
  onRefresh?: () => void;
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
export const OrgChart: React.FC<OrgChartProps> = ({ employees, positions, activeRole, onNavigateToDetails, onDepartmentClick, onRefresh }) => {
  const [selected, setSelected] = useState<Employee | null>(null);
  const [panelIn, setPanelIn] = useState(false);
  
  // ── Persistent expand state (localStorage-backed) ──
  const EXPAND_STORAGE_KEY = 'orgchart-expanded-nodes';
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(EXPAND_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return new Set<string>(parsed);
      }
    } catch { /* ignore corrupt storage */ }
    return new Set<string>();
  });
  const hasInitializedExpand = useRef(false);
  
  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(EXPAND_STORAGE_KEY, JSON.stringify([...expandedNodes]));
    } catch { /* quota exceeded, ignore */ }
  }, [expandedNodes]);
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [showCTC, setShowCTC] = useState(false);
  
  // ── Drag & Drop State ──
  const [draggingEmpId, setDraggingEmpId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [dropSuccessNodeId, setDropSuccessNodeId] = useState<string | null>(null);
  const [dropDialog, setDropDialog] = useState<{ empId: string; targetPosition: Position; targetNodeId: string } | null>(null);
  const dragTrailRef = useRef<HTMLDivElement | null>(null);
  const dragSourceRef = useRef<{ x: number; y: number } | null>(null);

  const handleMoveEmployee = useCallback(async (empId: string, newPosition: Position, dropNodeId: string, action: 'merge' | 'under') => {
    try {
      setDropSuccessNodeId(dropNodeId);
      setTimeout(() => setDropSuccessNodeId(null), 600);
      
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      let targetPositionId = newPosition.id;

      if (action === 'under') {
        const empRes = await fetch(`${API_BASE}/api/employees/${empId}`);
        if (empRes.ok) {
          const empData = await empRes.json();
          const newPosRes = await fetch(`${API_BASE}/api/positions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: empData.designation || 'New Role',
              department: newPosition.department,
              business_unit: newPosition.business_unit,
              sub_function: newPosition.sub_function || '',
              reporting_to_position_id: newPosition.id,
              status: 'A',
              budgeted_ctc: empData.ctc_annual || 0
            })
          });
          if (newPosRes.ok) {
            const newPosData = await newPosRes.json();
            targetPositionId = newPosData.position?.id || newPosData.id;
          }
        }
      } else if (action === 'merge') {
        targetPositionId = newPosition.id;
      }

      const updateData = {
        position_id: targetPositionId,
        department: newPosition.department,
        business_unit: newPosition.business_unit,
        sub_function: newPosition.sub_function || '',
        reporting_to_id: null
      };
      
      const res = await fetch(`${API_BASE}/api/employees/${empId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (res.ok && onRefresh) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDraggingEmpId(null);
      setDragOverNodeId(null);
    }
  }, [onRefresh]);
  
  // ── Drag trail animation (thread from source to cursor) ──
  useEffect(() => {
    if (!draggingEmpId) {
      if (dragTrailRef.current) {
        dragTrailRef.current.style.display = 'none';
      }
      return;
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragSourceRef.current || !dragTrailRef.current) return;
      const src = dragSourceRef.current;
      const dx = e.clientX - src.x;
      const dy = e.clientY - src.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      const trail = dragTrailRef.current;
      trail.style.display = 'block';
      trail.style.left = `${src.x}px`;
      trail.style.top = `${src.y}px`;
      trail.style.width = `${len}px`;
      trail.style.transform = `rotate(${angle}deg)`;
      trail.style.transformOrigin = '0 50%';
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [draggingEmpId]);
  const [layoutMode, setLayoutMode] = useState<'tree' | 'mindmap'>(() => {
    try {
      const saved = localStorage.getItem('orgchart-layout-mode');
      if (saved === 'mindmap' || saved === 'tree') return saved;
    } catch { /* ignore corrupt storage */ }
    return 'tree';
  });

  useEffect(() => {
    try {
      localStorage.setItem('orgchart-layout-mode', layoutMode);
    } catch { /* quota exceeded, ignore */ }
  }, [layoutMode]);

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

  const positionNodes = useMemo(() => {
    let result: PositionNode[] = positions.map(pos => {
      const occupants = employees.filter(e => e.position_id === pos.id);
      return { position: pos, occupants };
    });

    if (groupBy === 'reporting') return result;

    const newNodes: PositionNode[] = [];
    const unitSet = new Set<string>();
    const deptSet = new Set<string>();
    const subSet = new Set<string>();

    result.forEach(node => {
      const pos = node.position;
      const unit = pos.business_unit?.trim() || 'General Unit';
      const dept = pos.department?.trim() || 'General Dept';
      
      const hasSub = !!pos.sub_function?.trim();
      const sub = pos.sub_function?.trim() || '';
      
      const unitId = `unit-${unit.toLowerCase()}`;
      const deptId = `${unitId}-dept-${dept.toLowerCase()}`;
      const subId = `${deptId}-sub-${sub.toLowerCase()}`;
      
      if (!unitSet.has(unitId)) {
        unitSet.add(unitId);
        newNodes.push({
          position: {
            id: unitId,
            title: 'Business Unit',
            department: '',
            business_unit: unit,
            reporting_to_position_id: null,
            status: 'A'
          },
          occupants: []
        });
      }

      if (!deptSet.has(deptId)) {
        deptSet.add(deptId);
        newNodes.push({
          position: {
            id: deptId,
            title: 'Department',
            department: dept,
            business_unit: unit,
            reporting_to_position_id: unitId,
            status: 'A'
          },
          occupants: []
        });
      }

      if (hasSub && !subSet.has(subId)) {
        subSet.add(subId);
        newNodes.push({
          position: {
            id: subId,
            title: 'Sub Function',
            sub_function: sub,
            department: dept,
            business_unit: unit,
            reporting_to_position_id: deptId,
            status: 'A'
          },
          occupants: []
        });
      }

      let newReportingTo: string = hasSub ? subId : deptId;
      if (pos.reporting_to_position_id) {
        const mgr = result.find(m => m.position.id === pos.reporting_to_position_id);
        if (mgr) {
            const mUnit = mgr.position.business_unit?.trim() || 'General Unit';
            const mDept = mgr.position.department?.trim() || 'General Dept';
            const mSub = mgr.position.sub_function?.trim() || '';
            if (mUnit.toLowerCase() === unit.toLowerCase() && 
                mDept.toLowerCase() === dept.toLowerCase() && 
                mSub.toLowerCase() === sub.toLowerCase()) {
                newReportingTo = mgr.position.id;
            }
        }
      }

      newNodes.push({
        position: { ...pos, reporting_to_position_id: newReportingTo },
        occupants: node.occupants
      });
    });
    
    return newNodes;
  }, [employees, positions, groupBy]);

  // Expand top levels by default on FIRST mount only (if no saved state)
  useEffect(() => {
    // If we already loaded from localStorage with real data, skip default expansion
    if (hasInitializedExpand.current) return;
    hasInitializedExpand.current = true;
    
    // If localStorage gave us a non-empty set, keep it as-is
    if (expandedNodes.size > 0) return;
    
    // Otherwise set sensible defaults
    const defaultExpanded = new Set<string>();
    positionNodes.forEach(n => {
      if (groupBy === 'department') {
        if (n.position.title === 'Business Unit') defaultExpanded.add(n.position.id);
      } else {
        if (!n.position.reporting_to_position_id || n.occupants.some(o => o.role_tier <= 2)) defaultExpanded.add(n.position.id);
      }
    });
    setExpandedNodes(defaultExpanded);
  }, [positionNodes, groupBy]);

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

    const rows = positionNodes.flatMap(node => {
      if (node.occupants.length === 0) {
        return [[node.position.id, node.position.title, '', node.position.title, node.position.department, node.position.business_unit, '', node.position.budgeted_ctc || 0, node.position.budgeted_ctc || 0, node.position.status, getManagerName(node.position.reporting_to_position_id)]];
      }
      return node.occupants.map(e => [
        e.emp_id || '', e.full_name, e.email_official || '', e.designation, e.department || '', e.business_unit || '', e.role_tier, e.ctc_annual || 0, e.budget_allocated || 0, e.employment_status, getManagerName(node.position.reporting_to_position_id)
      ]);
    });

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

  const getChildren = (n: PositionNode) => positionNodes.filter(x => x.position.reporting_to_position_id === n.position.id && x.position.id !== n.position.id);
  const getManager = (e: Employee) => e.reporting_to_id ? employees.find(x => x.id === e.reporting_to_id) : undefined;
  const getReports = (emp: Employee) => employees.filter(x => x.reporting_to_id === emp.id);

  // Filtering Logic
  const hasActiveFilter = search.trim() !== '' || buFilter !== '' || deptFilter !== '';

  const isMatch = (n: PositionNode) => {
    if (!hasActiveFilter) return true;
    const s = search.toLowerCase();
    const matchS = !s || n.position.title.toLowerCase().includes(s) || n.occupants.some(o => o.full_name.toLowerCase().includes(s));
    const matchBU = !buFilter || n.position.business_unit === buFilter;
    const matchD = !deptFilter || n.position.department === deptFilter;
    return matchS && matchBU && matchD;
  };

  // Pre-calculate matches and their ancestors so we can auto-expand paths to matches
  const matchContext = useMemo(() => {
    if (!hasActiveFilter) {
      return {
        matchedIds: new Set<string>(),
        effectiveParentMap: new Map<string, string | null>(),
        roots: positionNodes.filter(n => !n.position.reporting_to_position_id || !positionNodes.some(x => x.position.id === n.position.reporting_to_position_id))
      };
    }
    
    const posMap = new Map(positionNodes.map(n => [n.position.id, n]));
    const matched = positionNodes.filter(isMatch);
    const matchedIds = new Set(matched.map(n => n.position.id));
    
    const effectiveParentMap = new Map<string, string | null>();
    matched.forEach(n => {
      let curr = n.position.reporting_to_position_id;
      let effParent: string | null = null;
      while (curr && posMap.has(curr)) {
        if (matchedIds.has(curr)) {
          effParent = curr;
          break;
        }
        curr = posMap.get(curr)?.position.reporting_to_position_id ?? null;
      }
      effectiveParentMap.set(n.position.id, effParent);
    });

    const roots = matched.filter(n => effectiveParentMap.get(n.position.id) === null);

    return { matchedIds, effectiveParentMap, roots };
  }, [positionNodes, search, buFilter, deptFilter, hasActiveFilter]);

  // Auto-expand nodes that have matching children when filtering
  useEffect(() => {
    if (hasActiveFilter) {
      setExpandedNodes(new Set(matchContext.matchedIds));
    }
  }, [matchContext, hasActiveFilter]);

  if (!positionNodes.length) return (
    <div className="flex flex-col items-center justify-center py-28 text-slate-400">
      <Users className="w-14 h-14 mb-4 opacity-30" />
      <p className="font-bold text-lg">No employees to display</p>
    </div>
  );

  return (
    <div className="relative h-[calc(100vh-80px)] flex flex-col bg-slate-50 overflow-hidden rounded-3xl border border-slate-200/60 shadow-inner">
      
      {/* ── Vacancy Analytics Header ── */}
      <div className="absolute top-4 left-4 z-20 flex gap-4">
        <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-lg">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Recruitment Vacancy HC</p>
          <p className="text-xl font-black text-slate-800">
            {targets ? 
              (targets.global_planned_headcount ?? targets.departments.reduce((sum, d) => sum + (d.budgeted_hc || 0), 0))
              - employees.filter(e => e.employment_status === 'Active').length
              + positions.filter(p => p.status === 'RoR').length
              - positions.filter(p => p.status === 'OYJ').length
              - positions.filter(p => p.status === 'H').length
              - positions.filter(p => p.status === 'F').length
              - positions.filter(p => p.status === 'M').length
            : 0}
          </p>
        </div>
        <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-lg">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">CTC Vacancy</p>
          <p className="text-xl font-black text-slate-800">
            {fmtCTC(
              (targets ? targets.departments.reduce((sum, d) => sum + (d.budget_allocated || 0), 0) : 0)
              - employees.filter(e => e.employment_status === 'Active').reduce((sum, e) => sum + (e.ctc_annual || 0), 0)
              + employees.filter(e => e.employment_status === 'Resigned on Roll').reduce((sum, e) => sum + (e.ctc_annual || 0), 0)
              - positions.filter(p => p.status === 'OYJ').reduce((sum, p) => sum + (p.budgeted_ctc || 0), 0)
            )}
          </p>
        </div>
      </div>

      {/* ── Floating Toolbar ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white border border-slate-200/80 p-2 rounded-2xl shadow-lg">
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
          panning={{ disabled: !!draggingEmpId, excluded: ['drag-emp-card'] }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Toolbar Controls */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white border border-slate-200/80 p-2 rounded-xl shadow-lg">
                <button onClick={() => zoomOut()} className="px-3 py-1.5 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-colors">Zoom Out</button>
                <button onClick={() => resetTransform()} className="px-3 py-1.5 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-colors">Reset</button>
                <button onClick={() => zoomIn()} className="px-3 py-1.5 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-colors">Zoom In</button>
                <div className="w-px h-4 bg-slate-300 mx-1" />
                <button onClick={() => setExpandedNodes(new Set(positionNodes.map(n => n.position.id)))} className="px-3 py-1.5 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-colors">Expand All</button>
                <button onClick={() => setExpandedNodes(new Set())} className="px-3 py-1.5 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-colors">Collapse All</button>
              </div>

              <TransformComponent wrapperStyle={{ width: '100%', height: '100%', minHeight: 'calc(100vh - 4rem)' }} contentStyle={{ padding: '140px 100px 400px 100px', minWidth: '100%', display: 'flex', justifyContent: 'center' }}>
                <div ref={treeRef} className="pb-24 min-w-max">
                  <OrgTreeView
                    positionNodes={positionNodes}
                    selectEmp={selectEmp}
                    selected={selected}
                    getChildren={getChildren}
                    expandedNodes={expandedNodes}
                    toggleNode={toggleNode}
                    matchContext={matchContext}
                    hasActiveFilter={hasActiveFilter}
                    onDepartmentClick={onDepartmentClick}
                    onMoveEmployee={handleMoveEmployee}
                    showCTC={showCTC}
                    canCTC={canCTC}
                    layoutMode={layoutMode}
                    draggingEmpId={draggingEmpId}
                    setDraggingEmpId={setDraggingEmpId}
                    dragOverNodeId={dragOverNodeId}
                    setDragOverNodeId={setDragOverNodeId}
                    dropSuccessNodeId={dropSuccessNodeId}
                    dragSourceRef={dragSourceRef}
                    onDropEmployeeTrigger={(empId, targetNode) => setDropDialog({ empId, targetPosition: targetNode.position, targetNodeId: targetNode.position.id })}
                  />
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
        {/* Drag trail thread line */}
        <div ref={dragTrailRef} className="drag-trail-line" style={{ display: 'none' }} />
      </div>

      {/* ── Hidden Print Target for A4 Download ── */}
      {/* IMPORTANT: visibility:hidden at position:fixed top:0 left:0 lets the browser
          fully PAINT this element (unlike off-screen left:-9999px), so html2canvas
          can capture it with correct colors, fonts, and images. */}
      <div
        id="org-chart-download-target"
        style={{
          position: 'fixed',
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
          positionNodes={positionNodes}
          selectEmp={() => {}}
          selected={null}
          getChildren={getChildren}
          expandedNodes={hasActiveFilter ? new Set(matchContext.matchedIds) : new Set(positionNodes.map(n => n.position.id))}
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

      {/* ── Drop Action Dialog ── */}
      {dropDialog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-black text-slate-900 mb-2">Move Employee</h3>
            <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">
              You are moving an employee. Would you like them to report to <strong className="text-slate-800">{dropDialog.targetPosition.title}</strong> or merge into this position?
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  handleMoveEmployee(dropDialog.empId, dropDialog.targetPosition, dropDialog.targetNodeId, 'under');
                  setDropDialog(null);
                }}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-sm"
              >
                Report To (New Subordinate)
              </button>
              <button 
                onClick={() => {
                  handleMoveEmployee(dropDialog.empId, dropDialog.targetPosition, dropDialog.targetNodeId, 'merge');
                  setDropDialog(null);
                }}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition shadow-sm"
              >
                Merge Position
              </button>
              <button 
                onClick={() => setDropDialog(null)}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Recursive Tree Components ────────────────────────────────────────

interface TreeSharedProps {
  positionNodes: PositionNode[];
  selectEmp: (e: Employee) => void;
  selected: Employee | null;
  getChildren: (node: PositionNode) => PositionNode[];
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
  matchContext: {
    matchedIds: Set<string>;
    effectiveParentMap: Map<string, string | null>;
    roots: PositionNode[];
  };
  hasActiveFilter: boolean;
  isPrint?: boolean;
  onDepartmentClick?: (dept: string) => void;
  onMoveEmployee?: (empId: string, newPos: Position, dropNodeId: string, action: 'merge' | 'under') => void;
  showCTC?: boolean;
  canCTC?: boolean;
  layoutMode: 'tree' | 'mindmap';
  // Drag & Drop
  draggingEmpId?: string | null;
  setDraggingEmpId?: (id: string | null) => void;
  dragOverNodeId?: string | null;
  setDragOverNodeId?: (id: string | null) => void;
  dropSuccessNodeId?: string | null;
  dragSourceRef?: React.MutableRefObject<{ x: number; y: number } | null>;
  onDropEmployeeTrigger?: (empId: string, targetNode: PositionNode) => void;
}

const OrgTreeView: React.FC<TreeSharedProps> = (props) => {
  const { matchContext, hasActiveFilter, positionNodes, isPrint } = props;
  
  const posIds = useMemo(() => new Set(positionNodes.map(n => n.position.id)), [positionNodes]);
  const normalRoots = useMemo(() => {
    let rts = positionNodes.filter(n => !n.position.reporting_to_position_id || !posIds.has(n.position.reporting_to_position_id) || n.position.reporting_to_position_id === n.position.id);
    if (rts.length === 0 && positionNodes.length > 0) {
      rts = [positionNodes[0]];
    }
    return rts;
  }, [positionNodes, posIds]);

  const roots = hasActiveFilter ? matchContext.roots : normalRoots;
  const isMindmap = props.layoutMode === 'mindmap';

  return (
    <div 
      className={isPrint ? '' : (isMindmap ? 'flex flex-col items-start gap-12' : 'flex justify-center gap-12')} 
      style={isPrint ? {
        display: 'flex', flexDirection: isMindmap ? 'column' : 'row',
        justifyContent: isMindmap ? 'flex-start' : 'center', alignItems: isMindmap ? 'flex-start' : 'center',
      } : { animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both' }}
    >
      {roots.map(root => (
        <div key={root.position.id} style={isPrint ? (isMindmap ? { padding: '24px 0' } : { padding: '0 24px' }) : undefined}>
          <OrgTreeNode node={root} {...props} />
        </div>
      ))}
    </div>
  );
};

const OrgTreeNode: React.FC<TreeSharedProps & { node: PositionNode }> = (props) => {
  const { node, selectEmp, selected, getChildren, expandedNodes, toggleNode, matchContext, hasActiveFilter } = props;
  const { position, occupants } = node;
  
  const children = hasActiveFilter 
    ? Array.from(matchContext.matchedIds)
        .map(id => props.positionNodes.find(n => n.position.id === id)!)
        .filter(n => matchContext.effectiveParentMap.get(n.position.id) === position.id)
    : getChildren(node);

  const isExpanded = expandedNodes.has(position.id);
  const theme = BU_THEMES[position.business_unit] ?? DT;
  const active = occupants.some(emp => selected?.id === emp.id);
  const isPrint = props.isPrint;
  const isMindmap = props.layoutMode === 'mindmap';

  const isVacant = occupants.length === 0 && position.title !== 'Sub Function' && position.title !== 'Department' && position.title !== 'Business Unit';
  const opacityClass = isVacant ? 'opacity-70' : '';
  const isVirtualNode = position.title === 'Business Unit' || position.title === 'Department' || position.title === 'Sub Function';

  const isDragOver = props.dragOverNodeId === position.id;
  const isDropSuccess = props.dropSuccessNodeId === position.id;
  const isDraggingAny = !!props.draggingEmpId;
  const dragEnterCounterRef = useRef(0);

  const cardContent = (
    <div 
      onDragOver={(e) => {
        if (!isVirtualNode && isDraggingAny) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }
      }}
      onDragEnter={(e) => {
        if (!isVirtualNode && isDraggingAny) {
          e.preventDefault();
          dragEnterCounterRef.current++;
          props.setDragOverNodeId?.(position.id);
        }
      }}
      onDragLeave={() => {
        if (!isVirtualNode) {
          dragEnterCounterRef.current--;
          if (dragEnterCounterRef.current <= 0) {
            dragEnterCounterRef.current = 0;
            if (props.dragOverNodeId === position.id) {
              props.setDragOverNodeId?.(null);
            }
          }
        }
      }}
      onDrop={(e) => {
        if (!isVirtualNode) {
          e.preventDefault();
          dragEnterCounterRef.current = 0;
          const empId = e.dataTransfer.getData('text/plain');
          if (empId && props.onDropEmployeeTrigger) {
            props.onDropEmployeeTrigger(empId, node);
          }
          props.setDragOverNodeId?.(null);
        }
      }}
      onClick={(e) => {
        if (position.title === 'Department' && props.onDepartmentClick && position.department) {
          e.stopPropagation();
          props.onDepartmentClick(position.department);
        }
      }}
      className={[
        'w-64 border flex flex-col text-left transition-all duration-300 relative',
        isPrint ? 'border-slate-200 rounded-xl p-3 bg-white' : [
          isVirtualNode ? (
            position.title === 'Business Unit' ? 'rounded-2xl bg-slate-800 p-3 border-slate-700 shadow-lg text-white' :
            position.title === 'Department' ? 'rounded-2xl bg-indigo-100/60 p-3 border-indigo-200 shadow-sm text-indigo-900' :
            'rounded-2xl bg-blue-50 p-3 border-blue-200 shadow-sm text-blue-900'
          ) : 'rounded-2xl bg-white p-3',
          active && !isVirtualNode ? `border-indigo-400 shadow-xl ring-2 ring-indigo-500/50 z-10` : 
          position.title === 'Department' && props.onDepartmentClick 
            ? 'hover:border-indigo-300 hover:shadow-md cursor-pointer' 
            : isVirtualNode ? 'cursor-default' : 'border-slate-200/80 shadow-sm hover:shadow-md cursor-pointer',
          isDragOver && !isVirtualNode ? 'drag-over-valid' : '',
          isDropSuccess ? 'drop-success' : '',
        ].join(' ')
      ].join(' ')}
      style={isPrint ? { padding: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', borderRadius: '12px', position: 'relative', width: '256px', boxSizing: 'border-box' } : {}}
    >
      {/* Accent Strip */}
      {!isPrint && !isVirtualNode && (
        <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b ${theme.gradient}`} />
      )}

      {/* Position Header */}
      <div className="flex flex-col mb-2">
        <h4 className={`font-bold text-xs border-b pb-1 mb-2 flex justify-between items-center ${isVirtualNode ? (position.title === 'Business Unit' ? 'border-slate-600 text-white' : position.title === 'Department' ? 'border-indigo-200 text-indigo-900' : 'border-blue-200 text-blue-900') : 'text-slate-800 border-slate-100'}`}>
          <span className="truncate">{isVirtualNode ? (position.title === 'Business Unit' ? position.business_unit : position.title === 'Department' ? position.department : position.sub_function) : position.title}</span>
          {!isVirtualNode && (() => {
            let statusKey = STATUS_MAP[position.status] || 'Active';
            if (isVacant) statusKey = 'Vacant Position';
            const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG['Active'];
            return (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold flex items-center gap-1 ${cfg.bg} ${cfg.text} ${cfg.border}`} style={{ boxShadow: `0 0 8px ${cfg.glow}40` }}>
                <span>{cfg.letter}</span>
                <span>{cfg.label}</span>
              </span>
            );
          })()}
        </h4>
        <div className="flex items-center gap-1.5">
          {isVirtualNode && (
            <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${position.title === 'Business Unit' ? 'bg-slate-700 text-slate-300' : position.title === 'Department' ? 'bg-indigo-200/50 text-indigo-700' : 'bg-blue-200/50 text-blue-700'}`}>
              {position.title}
            </span>
          )}
          {!isVirtualNode && (
            <span 
              onClick={(e) => {
                if (props.onDepartmentClick && position.department) {
                  e.stopPropagation();
                  props.onDepartmentClick(position.department);
                }
              }}
              className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors"
            >
              {position.department}
            </span>
          )}
          {!isVirtualNode && position.sub_function && (
            <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600">
              {position.sub_function}
            </span>
          )}
        </div>
      </div>

      {/* Occupants */}
      {isVacant ? (
        <div className="flex items-center gap-3 mt-2 p-2 rounded-lg bg-slate-50 border border-slate-100 border-dashed">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white shadow-sm shrink-0">
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">Vacant Position</p>
            {props.canCTC && props.showCTC && position.budgeted_ctc ? (
              <p className="text-[10px] font-black text-amber-500 mt-0.5">Budget: {fmtCTC(position.budgeted_ctc)}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {occupants.map(emp => {
            // Legitimize NEW badge: only 30 days, ignore invalid or default dates
            const isNewEmployee = (() => {
              if (!emp.join_date) return false;
              const joinTs = new Date(emp.join_date).getTime();
              const nowTs = new Date().getTime();
              // check if valid and in the past 30 days
              if (isNaN(joinTs) || joinTs > nowTs) return false;
              return (nowTs - joinTs) <= (30 * 24 * 3600 * 1000);
            })();

            return (
              <div 
                key={emp.id}
                draggable={!isVirtualNode}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', emp.id);
                  e.dataTransfer.effectAllowed = 'move';
                  e.stopPropagation();
                  
                  // Track source position for trail line
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  if (props.dragSourceRef) {
                    props.dragSourceRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
                  }
                  props.setDraggingEmpId?.(emp.id);
                  
                  // Custom drag ghost
                  const ghost = document.createElement('div');
                  ghost.style.cssText = 'position:fixed;top:-1000px;left:-1000px;padding:8px 16px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border-radius:12px;font-size:12px;font-weight:800;font-family:Inter,sans-serif;box-shadow:0 8px 24px rgba(99,102,241,0.4);pointer-events:none;white-space:nowrap;z-index:99999;';
                  ghost.textContent = `↕ ${emp.full_name}`;
                  document.body.appendChild(ghost);
                  e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, ghost.offsetHeight / 2);
                  setTimeout(() => document.body.removeChild(ghost), 0);
                }}
                onDragEnd={() => {
                  props.setDraggingEmpId?.(null);
                  props.setDragOverNodeId?.(null);
                  if (props.dragSourceRef) props.dragSourceRef.current = null;
                }}
                onClick={(e) => { if(!isVirtualNode) { e.stopPropagation(); selectEmp(emp); } }}
                onMouseDown={(e) => { if (!isVirtualNode) e.stopPropagation(); }}
                onPointerDown={(e) => { if (!isVirtualNode) e.stopPropagation(); }}
                className={[
                  'flex items-center gap-3 p-1.5 rounded-xl transition-all duration-200',
                  !isVirtualNode ? 'drag-emp-card' : '',
                  selected?.id === emp.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50',
                  props.draggingEmpId === emp.id ? 'dragging-source' : '',
                ].join(' ')}
              >
                <div className="relative shrink-0">
                  <img src={emp.photo_url || DEFAULT_AVATAR} className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm" />
                  {isNewEmployee && (
                    <span className="absolute -top-1 -right-1 z-20">
                      <span className="flex items-center justify-center bg-emerald-500 text-white text-[7px] w-4 h-4 rounded-full border border-white font-extrabold" title="New Joiner">
                        N
                      </span>
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-[13px] text-slate-900 truncate">{emp.full_name}</p>
                  <p className="text-[10px] font-semibold text-slate-500 truncate">{emp.designation}</p>
                  {props.canCTC && props.showCTC && (
                    <p className="text-[9px] font-black text-emerald-600 mt-0.5">CTC: {fmtCTC(emp.ctc_annual)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* "Under" drop zone for creating a new position reporting to this one */}
      {!isVirtualNode && (
        <div 
          className="absolute -bottom-4 left-0 right-0 h-4 flex items-center justify-center opacity-0 hover:opacity-100 z-30 transition-opacity"
          onDragOver={(e) => {
            if (isDraggingAny) {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation(); // prevent bubbling to card drop
            const empId = e.dataTransfer.getData('text/plain');
            if (empId && props.onMoveEmployee) {
              props.onMoveEmployee(empId, position, position.id, 'under');
            }
          }}
        >
          <div className="w-1/2 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
        </div>
      )}
    </div>
  );

  if (isMindmap) {
    return (
      <div className={`flex items-center ${opacityClass}`}>
        <div className="relative group shrink-0">
          {cardContent}
          {!isPrint && children.length > 0 && (
            <button onClick={(e) => { e.stopPropagation(); toggleNode(position.id); }} className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-600 shadow-sm z-10 transition-colors">
              {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {!isExpanded && <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[8px] px-1 rounded-full">{children.length}</span>}
            </button>
          )}
        </div>
        {(isPrint || isExpanded) && children.length > 0 && (
          <div className="flex items-center">
            <div className={isPrint ? '' : 'w-8 h-0.5 bg-slate-300/70 shrink-0'} style={isPrint ? { width: '32px', height: '2px', backgroundColor: '#cbd5e1', flexShrink: 0 } : undefined} />
            <div className={isPrint ? '' : 'flex flex-col gap-6 relative border-l-2 border-slate-300/70 pl-6 py-2 animate-thread-v'} style={isPrint ? { display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', borderLeft: '2px solid #cbd5e1', paddingLeft: '24px', paddingTop: '8px', paddingBottom: '8px' } : undefined}>
              {children.map((child) => (
                <div key={child.position.id} className="flex items-center relative">
                  <div className={isPrint ? '' : 'absolute -left-6 w-6 h-0.5 bg-slate-300/70 animate-thread-h'} style={isPrint ? { position: 'absolute', left: '-24px', width: '24px', height: '2px', backgroundColor: '#cbd5e1' } : undefined} />
                  <OrgTreeNode {...props} node={child} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${opacityClass}`}>
      <div className="relative group">
        {cardContent}
        {!isPrint && children.length > 0 && (
          <button onClick={(e) => { e.stopPropagation(); toggleNode(position.id); }} className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-600 shadow-sm z-10 transition-colors">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {!isExpanded && <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[8px] px-1 rounded-full">{children.length}</span>}
          </button>
        )}
      </div>
      <div className={isPrint ? 'flex flex-col items-center' : `flex flex-col items-center transition-all duration-500 origin-top ${isExpanded ? 'opacity-100 scale-y-100 max-h-[10000px]' : 'opacity-0 scale-y-0 max-h-0 overflow-hidden'}`}>
        {children.length > 0 && (
          <>
            <div className={isPrint ? '' : 'w-0.5 h-8 bg-slate-300/70 rounded-full mt-2 animate-thread-v'} style={isPrint ? { width: '2px', height: '32px', backgroundColor: '#cbd5e1', borderRadius: '9999px', marginTop: '8px' } : undefined} />
            <div className="flex items-start">
              {children.map((child, idx) => {
                const isFirst = idx === 0, isLast = idx === children.length - 1, isOnly = children.length === 1;
                return (
                  <div key={child.position.id} className="flex flex-col items-center relative" style={{ padding: '0 16px' }}>
                    {!isOnly && <div className={isPrint ? '' : 'absolute top-0 h-0.5 bg-slate-300/70 animate-thread-h'} style={{ position: 'absolute', top: 0, height: '2px', backgroundColor: '#cbd5e1', left: isFirst ? '50%' : 0, right: isLast ? '50%' : 0, borderTopLeftRadius: isFirst ? 4 : 0, borderTopRightRadius: isLast ? 4 : 0 }} />}
                    <div className={isPrint ? '' : 'w-0.5 h-8 bg-slate-300/70 animate-thread-v'} style={isPrint ? { width: '2px', height: '32px', backgroundColor: '#cbd5e1' } : undefined} />
                    <OrgTreeNode {...props} node={child} />
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

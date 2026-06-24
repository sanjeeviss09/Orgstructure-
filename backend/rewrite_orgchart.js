const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/src/components/OrgChart.tsx');
let content = fs.readFileSync(file, 'utf8');

// A. Replace imports
content = content.replace(
  /import\s+\{\s*Employee,\s*DEFAULT_AVATAR,\s*fetchTargets,\s*HRTargets\s*\}\s*from\s*'..\/lib\/api';/g,
  "import { Employee, Position, DEFAULT_AVATAR, fetchTargets, HRTargets } from '../lib/api';"
);

// B. Replace OrgChartProps and add PositionNode + STATUS_CONFIG
content = content.replace(
  /interface\s+OrgChartProps\s*\{\s*employees:\s*Employee\[\];/g,
  `export interface PositionNode {
  position: Position;
  occupants: Employee[];
}

export const STATUS_CONFIG: Record<string, { letter: string; label: string; bg: string; text: string; border: string; glow: string }> = {
  'Active':             { letter: 'Ⓐ', label: 'Active',              bg: 'bg-emerald-500',  text: 'text-white', border: 'border-emerald-600', glow: '#10b981' },
  'Inactive':           { letter: 'Ⓥ', label: 'Vacant',              bg: 'bg-slate-400',    text: 'text-white', border: 'border-slate-500',   glow: '#94a3b8' },
  'Vacant Position':    { letter: 'Ⓥ', label: 'Vacant',              bg: 'bg-slate-400',    text: 'text-white', border: 'border-slate-500',   glow: '#94a3b8' },
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

interface OrgChartProps {
  employees: Employee[];
  positions: Position[];`
);

// C. Replace OrgChart component signature
content = content.replace(
  /export\s+const\s+OrgChart:\s*React\.FC<OrgChartProps>\s*=\s*\(\{\s*employees,\s*activeRole,\s*onNavigateToDetails,\s*onDepartmentClick\s*\}\)\s*=>\s*\{/g,
  "export const OrgChart: React.FC<OrgChartProps> = ({ employees, positions, activeRole, onNavigateToDetails, onDepartmentClick }) => {"
);

// 1. Replace the augmentedEmployees block (lines 65 to 244 approx)
const blockStart = content.indexOf('const augmentedEmployees = useMemo(() => {');
const blockEnd = content.indexOf('}, [employees, targets, groupBy]);') + '}, [employees, targets, groupBy]);'.length;

if (blockStart !== -1 && blockEnd !== -1) {
  const newBlock = `
  const positionNodes = useMemo(() => {
    let result: PositionNode[] = positions.map(pos => {
      const occupants = employees.filter(e => e.position_id === pos.id && e.employment_status !== 'Inactive');
      return { position: pos, occupants };
    });

    if (groupBy === 'reporting') return result;

    const newNodes: PositionNode[] = [];
    const buSet = new Set<string>();
    const deptSet = new Set<string>();

    result.forEach(node => {
      const pos = node.position;
      const bu = pos.business_unit?.trim();
      const dept = pos.department?.trim() || 'General';
      
      const buId = bu ? \`bu-\${bu}\` : null;
      const deptId = \`dept-\${bu || 'none'}-\${dept}\`;
      
      if (bu && !buSet.has(buId!)) {
        buSet.add(buId!);
        newNodes.push({
          position: {
            id: buId!,
            title: 'Business Unit',
            department: '',
            business_unit: bu,
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
            business_unit: bu || '',
            reporting_to_position_id: buId,
            status: 'A'
          },
          occupants: []
        });
      }

      let newReportingTo = deptId;
      if (pos.reporting_to_position_id) {
        const mgr = result.find(m => m.position.id === pos.reporting_to_position_id);
        if (mgr && mgr.position.department === pos.department && mgr.position.business_unit === pos.business_unit) {
          newReportingTo = mgr.position.id;
        }
      }

      newNodes.push({
        position: { ...pos, reporting_to_position_id: newReportingTo },
        occupants: node.occupants
      });
    });
    
    return newNodes;
  }, [employees, positions, groupBy]);
`;
  content = content.substring(0, blockStart) + newBlock + content.substring(blockEnd);
}

// 2. Replace augmentedEmployees with positionNodes throughout the rest of the file
content = content.replace(/augmentedEmployees/g, 'positionNodes');

// 3. Update exportToExcel to use positionNodes
content = content.replace(/const rows = positionNodes\.map\(e => \[([^\]]+)\]\);/, `
    const rows = positionNodes.flatMap(node => {
      if (node.occupants.length === 0) {
        return [[node.position.id, node.position.title, '', node.position.title, node.position.department, node.position.business_unit, '', node.position.budgeted_ctc || 0, node.position.budgeted_ctc || 0, node.position.status, getManagerName(node.position.reporting_to_position_id)]];
      }
      return node.occupants.map(e => [
        e.emp_id || '', e.full_name, e.email_official || '', e.designation, e.department || '', e.business_unit || '', e.role_tier, e.ctc_annual || 0, e.budget_allocated || 0, e.employment_status, getManagerName(node.position.reporting_to_position_id)
      ]);
    });
`);

// 4. Update the Vacancy Calculation in the header
const headerTarget = '<div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2';
const vacancyHeader = `
      {/* ── Vacancy Analytics Header ── */}
      <div className="absolute top-4 left-4 z-20 flex gap-4">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 p-3 rounded-2xl shadow-lg">
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
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 p-3 rounded-2xl shadow-lg">
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

`;
content = content.replace(headerTarget, vacancyHeader + headerTarget);

// Write back
fs.writeFileSync(file, content);
console.log('OrgChart basic rewrites done');

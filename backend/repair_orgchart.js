const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/src/components/OrgChart.tsx');
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings to LF for easier replacements
const originalLineEndings = content.includes('\r\n') ? '\r\n' : '\n';
content = content.replace(/\r\n/g, '\n');

// 1. Replace imports
content = content.replace(
  "import { Employee, DEFAULT_AVATAR, fetchTargets, HRTargets } from '../lib/api';",
  "import { Employee, Position, DEFAULT_AVATAR, fetchTargets, HRTargets } from '../lib/api';"
);

// 2. Replace OrgChartProps and add types
const oldProps = `interface OrgChartProps {
  employees: Employee[];
  activeRole: Role;
  onNavigateToDetails?: (id: string) => void;
  onDepartmentClick?: (dept: string) => void;
}`;

const newProps = `export interface PositionNode {
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

const STATUS_SYMBOLS: Record<string, string> = {
  'Active': 'Ⓐ', 'Vacant Position': 'Ⓥ', 'Inactive': 'Ⓥ', 'Offered Yet to Join': 'Ⓞ', 
  'Resigned on Roll': 'Ⓡ', 'Replacement Joined': 'Ⓟ', 'Hold': 'Ⓗ', 'Frozen': 'Ⓕ', 
  'Merged': 'Ⓜ️', 'Combined Position': 'Ⓒ', 'Transfer Pending': 'Ⓣ', 'Under Notice Period': 'Ⓡ'
};

const STATUS_TITLES: Record<string, string> = {
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
}`;

content = content.replace(oldProps, newProps);

// 3. OrgChart component declaration
content = content.replace(
  "export const OrgChart: React.FC<OrgChartProps> = ({ employees, activeRole, onNavigateToDetails, onDepartmentClick }) => {",
  "export const OrgChart: React.FC<OrgChartProps> = ({ employees, positions, activeRole, onNavigateToDetails, onDepartmentClick }) => {"
);

// 4. Replace augmentedEmployees memo block
const blockStart = content.indexOf('  const augmentedEmployees = useMemo(() => {');
const blockEnd = content.indexOf('  }, [employees, targets, groupBy]);') + '  }, [employees, targets, groupBy]);'.length;

if (blockStart === -1 || blockEnd === -1) {
  console.error("Could not find augmentedEmployees block");
  process.exit(1);
}

const newBlock = `  const positionNodes = useMemo(() => {
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
  }, [employees, positions, groupBy]);`;

content = content.substring(0, blockStart) + newBlock + content.substring(blockEnd);

// 5. Expand top levels on mount useEffect
const oldEffect = `  // Expand top levels by default on mount
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
  }, [augmentedEmployees, groupBy]);`;

const newEffect = `  // Expand top levels by default on mount
  useEffect(() => {
    const defaultExpanded = new Set<string>();
    positionNodes.forEach(n => {
      // Expand BU nodes by default, but keep Dept nodes collapsed to avoid huge empty horizontal lines
      if (groupBy === 'department') {
        if (n.position.title === "Business Unit") defaultExpanded.add(n.position.id);
        // Also expand Dept nodes if they are roots (meaning no BU)
        if (n.position.title === 'Department' && !n.position.reporting_to_position_id) defaultExpanded.add(n.position.id);
      } else {
        if (!n.position.reporting_to_position_id || n.occupants.some(o => o.role_tier <= 2)) defaultExpanded.add(n.position.id);
      }
    });
    setExpandedNodes(defaultExpanded);
  }, [positionNodes, groupBy]);`;

content = content.replace(oldEffect, newEffect);

// 6. Excel export rows calculation
const oldExcelRows = `    const rows = augmentedEmployees.map(e => [
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
    ]);`;

const newExcelRows = `    const rows = positionNodes.flatMap(node => {
      if (node.occupants.length === 0) {
        return [[node.position.id, node.position.title, '', node.position.title, node.position.department, node.position.business_unit, '', node.position.budgeted_ctc || 0, node.position.budgeted_ctc || 0, node.position.status, getManagerName(node.position.reporting_to_position_id)]];
      }
      return node.occupants.map(e => [
        e.emp_id || '', e.full_name, e.email_official || '', e.designation, e.department || '', e.business_unit || '', e.role_tier, e.ctc_annual || 0, e.budget_allocated || 0, e.employment_status, getManagerName(node.position.reporting_to_position_id)
      ]);
    });`;

content = content.replace(oldExcelRows, newExcelRows);

// 7. getReports / getManager / isMatch / matchContext
const oldHelpers = `  const getReports = (e: Employee) => augmentedEmployees.filter(x => x.reporting_to_id === e.id);
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
  }, [augmentedEmployees, search, buFilter, deptFilter, hasActiveFilter]);`;

const newHelpers = `  const getChildren = (n: PositionNode) => positionNodes.filter(x => x.position.reporting_to_position_id === n.position.id);
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
  }, [positionNodes, search, buFilter, deptFilter, hasActiveFilter]);`;

content = content.replace(oldHelpers, newHelpers);

// 8. Expand/Collapse all controls
content = content.replace(
  'setExpandedNodes(new Set(augmentedEmployees.map(e => e.id)))',
  'setExpandedNodes(new Set(positionNodes.map(n => n.position.id)))'
);

// 9. OrgTreeView invocations (both main and print target)
content = content.replace(
  `<OrgTreeView
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
                  />`,
  `<OrgTreeView
                    positionNodes={positionNodes}
                    selectEmp={selectEmp}
                    selected={selected}
                    getChildren={getChildren}
                    expandedNodes={expandedNodes}
                    toggleNode={toggleNode}
                    matchContext={matchContext}
                    hasActiveFilter={hasActiveFilter}
                    onDepartmentClick={onDepartmentClick}
                    showCTC={showCTC}
                    canCTC={canCTC}
                    layoutMode={layoutMode}
                  />`
);

content = content.replace(
  `<OrgTreeView
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
        />`,
  `<OrgTreeView
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
        />`
);

// 10. Vacancy analytics header
content = content.replace(
  `      {/* ── Floating Toolbar ── */}`,
  `      {/* ── Vacancy Analytics Header ── */}
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

      {/* ── Floating Toolbar ── */}`
);

// 11. Empty check
content = content.replace(
  `  if (!augmentedEmployees.length) return (`,
  `  if (!positionNodes.length) return (`
);

// 12. Replace the entire Tree Shared block with new position-centric layout
const treeStartIndex = content.indexOf('// ─── Recursive Tree Components ────────────────────────────────────────');
const treeEndIndex = content.indexOf('// ─── Sub-components ───────────────────────────────────────────────────');

if (treeStartIndex === -1 || treeEndIndex === -1) {
  console.error("Could not find tree components bounds");
  process.exit(1);
}

const newTreeComponents = `// ─── Recursive Tree Components ────────────────────────────────────────

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
  showCTC?: boolean;
  canCTC?: boolean;
  layoutMode: 'tree' | 'mindmap';
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

  const isVacant = occupants.length === 0 && position.title !== 'Department' && position.title !== 'Business Unit';
  const opacityClass = isVacant ? 'opacity-70' : '';
  const isVirtualNode = position.title === 'Business Unit' || position.title === 'Department';

  const cardContent = (
    <div className={[
        'w-64 border flex flex-col text-left transition-all duration-300 relative',
        isPrint ? 'border-slate-200 rounded-xl p-3 bg-white' : [
          'rounded-2xl bg-white p-3',
          active ? \`border-indigo-400 shadow-xl ring-2 ring-indigo-500/50 z-10\` : 
          isVirtualNode ? 'border-slate-200/80 shadow-sm cursor-default' : 'border-slate-200/80 shadow-sm hover:shadow-md cursor-pointer'
        ].join(' ')
      ].join(' ')}
      style={isPrint ? { padding: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', borderRadius: '12px', position: 'relative', width: '256px', boxSizing: 'border-box' } : {}}
    >
      {/* Accent Strip */}
      {!isPrint && (
        <div className={\`absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-gradient-to-b \${theme.gradient}\`} />
      )}

      {/* Position Header */}
      <div className="flex flex-col mb-2">
        <h4 className="font-bold text-xs text-slate-800 border-b border-slate-100 pb-1 mb-2 flex justify-between items-center">
          <span className="truncate">{position.title}</span>
          {!isVirtualNode && (() => {
            const statusKey = STATUS_MAP[position.status] || 'Active';
            const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG['Active'];
            return (
              <span className={\`text-[9px] px-1.5 py-0.5 rounded-full border font-bold flex items-center gap-1 \${cfg.bg} \${cfg.text} \${cfg.border}\`} style={{ boxShadow: \`0 0 8px \${cfg.glow}40\` }}>
                <span>{cfg.letter}</span>
                <span>{cfg.label}</span>
              </span>
            );
          })()}
        </h4>
        <div className="flex items-center gap-1.5">
          {!isVirtualNode && (
            <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              {position.department}
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
                onClick={(e) => { if(!isVirtualNode) { e.stopPropagation(); selectEmp(emp); } }}
                className={\`flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition-colors \${selected?.id === emp.id ? 'bg-indigo-50/50' : ''}\`}
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
    </div>
  );

  if (isMindmap) {
    return (
      <div className={\`flex items-center \${opacityClass}\`}>
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
            <div className={isPrint ? '' : 'flex flex-col gap-6 relative border-l-2 border-slate-300/70 pl-6 py-2'} style={isPrint ? { display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', borderLeft: '2px solid #cbd5e1', paddingLeft: '24px', paddingTop: '8px', paddingBottom: '8px' } : undefined}>
              {children.map((child) => (
                <div key={child.position.id} className="flex items-center relative">
                  <div className={isPrint ? '' : 'absolute -left-6 w-6 h-0.5 bg-slate-300/70'} style={isPrint ? { position: 'absolute', left: '-24px', width: '24px', height: '2px', backgroundColor: '#cbd5e1' } : undefined} />
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
    <div className={\`flex flex-col items-center \${opacityClass}\`}>
      <div className="relative group">
        {cardContent}
        {!isPrint && children.length > 0 && (
          <button onClick={(e) => { e.stopPropagation(); toggleNode(position.id); }} className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-600 shadow-sm z-10 transition-colors">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {!isExpanded && <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[8px] px-1 rounded-full">{children.length}</span>}
          </button>
        )}
      </div>
      <div className={isPrint ? 'flex flex-col items-center' : \`flex flex-col items-center transition-all duration-500 origin-top \${isExpanded ? 'opacity-100 scale-y-100 max-h-[10000px]' : 'opacity-0 scale-y-0 max-h-0 overflow-hidden'}\`}>
        {children.length > 0 && (
          <>
            <div className={isPrint ? '' : 'w-0.5 h-8 bg-slate-300/70 rounded-full mt-2'} style={isPrint ? { width: '2px', height: '32px', backgroundColor: '#cbd5e1', borderRadius: '9999px', marginTop: '8px' } : undefined} />
            <div className="flex items-start">
              {children.map((child, idx) => {
                const isFirst = idx === 0, isLast = idx === children.length - 1, isOnly = children.length === 1;
                return (
                  <div key={child.position.id} className="flex flex-col items-center relative" style={{ padding: '0 16px' }}>
                    {!isOnly && <div className={isPrint ? '' : 'absolute top-0 h-0.5 bg-slate-300/70'} style={{ position: 'absolute', top: 0, height: '2px', backgroundColor: '#cbd5e1', left: isFirst ? '50%' : 0, right: isLast ? '50%' : 0, borderTopLeftRadius: isFirst ? 4 : 0, borderTopRightRadius: isLast ? 4 : 0 }} />}
                    <div className={isPrint ? '' : 'w-0.5 h-8 bg-slate-300/70'} style={isPrint ? { width: '2px', height: '32px', backgroundColor: '#cbd5e1' } : undefined} />
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
`;

content = content.substring(0, treeStartIndex) + newTreeComponents + '\n' + content.substring(treeEndIndex);

// Re-normalize back to original line endings
content = content.replace(/\n/g, originalLineEndings);

fs.writeFileSync(file, content);
console.log('OrgChart fully repaired!');

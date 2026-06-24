const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/src/components/OrgChart.tsx');
let content = fs.readFileSync(file, 'utf8');

const treeComponentsStr = `// ─── Recursive Tree Components ────────────────────────────────────────

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
      {/* Position Header */}
      <div className="flex flex-col mb-2">
        <h4 className="font-bold text-xs text-slate-800 border-b border-slate-100 pb-1 mb-2 flex justify-between">
          <span className="truncate">{position.title}</span>
          <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{position.status}</span>
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
            const isNewEmployee = emp.join_date ? (new Date().getTime() - new Date(emp.join_date).getTime()) <= (30 * 24 * 3600 * 1000) : false;
            return (
              <div 
                key={emp.id}
                onClick={(e) => { if(!isVirtualNode) { e.stopPropagation(); selectEmp(emp); } }}
                className={\`flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition-colors \${selected?.id === emp.id ? 'bg-indigo-50/50' : ''}\`}
              >
                <div className="relative shrink-0">
                  <img src={emp.photo_url || DEFAULT_AVATAR} className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm" />
                  {isNewEmployee && <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>}
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

const startIndex = content.indexOf('// ─── Recursive Tree Components ────────────────────────────────────────');
const endIndex = content.indexOf('// ─── Sub-components ───────────────────────────────────────────────────');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + treeComponentsStr + '\n' + content.substring(endIndex);
  
  // also fix the tree rendering in the main component:
  // getReports -> getChildren, expandedNodes mapping
  content = content.replace(/const getReports = [^\n]+/, 'const getChildren = (n: PositionNode) => positionNodes.filter(x => x.position.reporting_to_position_id === n.position.id);');
  content = content.replace(/const getManager = [^\n]+/, 'const getManager = (e: Employee) => e.reporting_to_id ? employees.find(x => x.id === e.reporting_to_id) : undefined;');

  // fix isMatch and matchContext logic to work with positions
  const oldIsMatch = `  const isMatch = (e: Employee) => {
    if (!hasActiveFilter) return true;
    const s = search.toLowerCase();
    const matchS = !s || e.full_name.toLowerCase().includes(s) || e.designation.toLowerCase().includes(s);
    const matchBU = !buFilter || e.business_unit === buFilter;
    const matchD = !deptFilter || e.department === deptFilter;
    return matchS && matchBU && matchD;
  };`;
  const newIsMatch = `  const isMatch = (n: PositionNode) => {
    if (!hasActiveFilter) return true;
    const s = search.toLowerCase();
    const matchS = !s || n.position.title.toLowerCase().includes(s) || n.occupants.some(o => o.full_name.toLowerCase().includes(s));
    const matchBU = !buFilter || n.position.business_unit === buFilter;
    const matchD = !deptFilter || n.position.department === deptFilter;
    return matchS && matchBU && matchD;
  };`;
  content = content.replace(oldIsMatch, newIsMatch);
  
  const matchContextRegex = /const matchContext = useMemo\(\(\) => \{([\s\S]*?)return \{ matchedIds, effectiveParentMap, roots \};\n  \}, \[positionNodes, search, buFilter, deptFilter, hasActiveFilter\]\);/;
  
  const newMatchContext = `const matchContext = useMemo(() => {
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

  content = content.replace(matchContextRegex, newMatchContext);

  // Fix tree render invocation props
  content = content.replace(/employees={positionNodes}/g, 'positionNodes={positionNodes}');
  content = content.replace(/getReports={getReports}/g, 'getChildren={getChildren}');

  // Expand top levels on mount: fix this as well
  content = content.replace(/positionNodes\.forEach\(e => \{/g, 'positionNodes.forEach(n => {');
  content = content.replace(/if \(e\.designation === 'Business Unit'\) defaultExpanded\.add\(e\.id\);/g, 'if (n.position.title === "Business Unit") defaultExpanded.add(n.position.id);');

  // Fix the "No employees" to "No positions"
  content = content.replace(/!positionNodes\.length/, '!positionNodes.length');
  content = content.replace(/No employees to display/, 'No positions to display');

  // Fix `expandedNodes.has(emp.id)` and `new Set(positionNodes.map(e => e.id))`
  content = content.replace(/positionNodes\.map\(e => e\.id\)/g, 'positionNodes.map(n => n.position.id)');

  fs.writeFileSync(file, content);
  console.log('Tree rewrites done');
} else {
  console.log('Could not find tree components bounds');
}

const fs = require('fs');
const path = 'b:/Org Structure - Axxel/frontend/src/components/OrgChart.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Replace the groupBy tree building logic
const treeLogicOld = `    const newNodes: PositionNode[] = [];
    const deptSet = new Set<string>();

    result.forEach(node => {
      const pos = node.position;
      const dept = pos.department?.trim() || 'General';
      
      const deptId = \`dept-\${dept.toLowerCase()}\`;
      
      if (!deptSet.has(deptId)) {
        deptSet.add(deptId);
        newNodes.push({
          position: {
            id: deptId,
            title: 'Department',
            department: dept,
            business_unit: '',
            reporting_to_position_id: null,
            status: 'A'
          },
          occupants: []
        });
      }

      let newReportingTo: string = deptId;
      if (pos.reporting_to_position_id) {
        const mgr = result.find(m => m.position.id === pos.reporting_to_position_id);
        if (mgr && (mgr.position.department?.trim() || 'General').toLowerCase() === dept.toLowerCase()) {
          newReportingTo = mgr.position.id;
        }
      }

      newNodes.push({
        position: { ...pos, reporting_to_position_id: newReportingTo },
        occupants: node.occupants
      });
    });`;

const treeLogicNew = `    const newNodes: PositionNode[] = [];
    const unitSet = new Set<string>();
    const deptSet = new Set<string>();
    const subSet = new Set<string>();

    result.forEach(node => {
      const pos = node.position;
      const unit = pos.business_unit?.trim() || 'General Unit';
      const dept = pos.department?.trim() || 'General Dept';
      const sub = pos.sub_function?.trim() || 'General Sub';
      
      const unitId = \`unit-\${unit.toLowerCase()}\`;
      const deptId = \`\${unitId}-dept-\${dept.toLowerCase()}\`;
      const subId = \`\${deptId}-sub-\${sub.toLowerCase()}\`;
      
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

      if (!subSet.has(subId)) {
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

      let newReportingTo: string = subId;
      if (pos.reporting_to_position_id) {
        const mgr = result.find(m => m.position.id === pos.reporting_to_position_id);
        if (mgr) {
            const mUnit = mgr.position.business_unit?.trim() || 'General Unit';
            const mDept = mgr.position.department?.trim() || 'General Dept';
            const mSub = mgr.position.sub_function?.trim() || 'General Sub';
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
    });`;

content = content.replace(treeLogicOld, treeLogicNew);

// 2. Fix isVacant and isVirtualNode
content = content.replace(
  "const isVacant = occupants.length === 0 && position.title !== 'Department' && position.title !== 'Business Unit';",
  "const isVacant = occupants.length === 0 && position.title !== 'Sub Function' && position.title !== 'Department' && position.title !== 'Business Unit';"
);
content = content.replace(
  "const isVirtualNode = position.title === 'Business Unit' || position.title === 'Department';",
  "const isVirtualNode = position.title === 'Business Unit' || position.title === 'Department' || position.title === 'Sub Function';"
);

// 3. Fix the rendering title
content = content.replace(
  "<span className=\"truncate\">{isVirtualNode ? (position.title === 'Business Unit' ? position.business_unit : position.department) : position.title}</span>",
  "<span className=\"truncate\">{isVirtualNode ? (position.title === 'Business Unit' ? position.business_unit : position.title === 'Department' ? position.department : position.sub_function) : position.title}</span>"
);

// 4. Fix defaultExpanded logic
content = content.replace(
  "if (n.position.title === 'Department' && !n.position.reporting_to_position_id) defaultExpanded.add(n.position.id);",
  "if (n.position.title === 'Business Unit') defaultExpanded.add(n.position.id);"
);

fs.writeFileSync(path, content);
console.log('Fixed tree structure in OrgChart.tsx');

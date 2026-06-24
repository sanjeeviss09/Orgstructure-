const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/src/components/OrgChart.tsx');
let content = fs.readFileSync(file, 'utf8');

const consts = `const TIER_LABEL: Record<number, string> = { 1: 'C-Suite', 2: 'VP / CXO', 3: 'Head of Dept', 4: 'Manager', 5: 'Individual' };

const STATUS_SYMBOLS: Record<string, string> = {
  'Active': 'Ⓐ', 'Vacant Position': 'Ⓥ', 'Inactive': 'Ⓥ', 'Offered Yet to Join': 'Ⓞ', 
  'Resigned on Roll': 'Ⓡ', 'Replacement Joined': 'Ⓟ', 'Hold': 'Ⓗ', 'Frozen': 'Ⓕ', 
  'Merged': 'Ⓜ️', 'Combined Position': 'Ⓒ', 'Transfer Pending': 'Ⓣ', 'Under Notice Period': 'Ⓡ'
};
const STATUS_TITLES: Record<string, string> = {
  'Active': 'Active', 'Vacant Position': 'Vacant', 'Inactive': 'Vacant', 'Offered Yet to Join': 'Offered Yet to Join', 
  'Resigned on Roll': 'Resigned on Roll', 'Replacement Joined': 'Replacement Joined', 'Hold': 'Hold', 'Frozen': 'Frozen', 
  'Merged': 'Merged', 'Combined Position': 'Combined', 'Transfer Pending': 'Transfer Pending', 'Under Notice Period': 'Resigned on Roll'
};`;

content = content.replace("const TIER_LABEL: Record<number, string> = { 1: 'C-Suite', 2: 'VP / CXO', 3: 'Head of Dept', 4: 'Manager', 5: 'Individual' };", consts);

// Now in OrgTreeNode:
const nameDisplaySearch = `{emp.employment_status === 'Inactive' ? 'Vacant Position' : emp.full_name}`;
const nameDisplayReplacement = `{emp.employment_status === 'Inactive' ? 'Vacant Position' : emp.full_name}
          {!isVirtualNode && (
            <span 
              className="text-[14px] leading-none ml-1 cursor-help flex items-center justify-center text-slate-600" 
              title={STATUS_TITLES[emp.employment_status] || emp.employment_status}
            >
              {STATUS_SYMBOLS[emp.employment_status] || ''}
            </span>
          )}`;

content = content.replace(nameDisplaySearch, nameDisplayReplacement);

fs.writeFileSync(file, content);
console.log('Status symbols added');

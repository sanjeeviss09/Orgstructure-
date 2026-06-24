const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/src/components/EmployeeManager.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Fix parseCSV
const parseCSVSearch = `const parseCSV = (text: string): Record<string, string>[] => {
  const lines = text.trim().split('\\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });`;

const parseCSVReplace = `
const HEADER_MAP: Record<string, string> = {
  'emp id': 'emp_id', 'employee id': 'emp_id',
  'full name': 'full_name', 'name': 'full_name',
  'email': 'email_official', 'email address': 'email_official', 'official email': 'email_official',
  'designation': 'designation', 'role': 'designation',
  'department': 'department', 'dept': 'department',
  'sub function': 'sub_function', 'sub-function': 'sub_function',
  'business unit': 'business_unit', 'bu': 'business_unit',
  'role tier': 'role_tier', 'tier': 'role_tier',
  'ctc annual': 'ctc_annual', 'annual ctc': 'ctc_annual', 'ctc': 'ctc_annual',
  'budget allocated': 'budget_allocated', 'budget': 'budget_allocated',
  'ctc currency': 'ctc_currency', 'currency': 'ctc_currency',
  'employment status': 'employment_status', 'status': 'employment_status',
  'dashboard access': 'dashboard_access', 'access': 'dashboard_access',
  'reporting manager emp id': 'reporting_manager_emp_id', 'reporting manager': 'reporting_manager_emp_id', 'manager id': 'reporting_manager_emp_id',
  'company name': 'company_name', 'company': 'company_name',
  'past organization': 'past_organization',
  'total experience': 'total_experience', 'experience': 'total_experience',
  'education qualification': 'education_qualification', 'education': 'education_qualification'
};

const parseCSV = (text: string): Record<string, string>[] => {
  const lines = text.trim().split('\\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  
  const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  // Normalize headers
  const headers = rawHeaders.map(h => {
    const clean = h.toLowerCase().trim();
    return HEADER_MAP[clean] || h.replace(/\\s+/g, '_').toLowerCase();
  });

  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });`;

content = content.replace(parseCSVSearch, parseCSVReplace);

// 2. Add Status Symbols variables at the top of the file
const symbolsCode = `
const STATUS_SYMBOLS: Record<string, string> = {
  'Active': 'A', 'Vacant Position': 'V', 'Inactive': 'V', 'Offered Yet to Join': 'O', 
  'Resigned on Roll': 'R', 'Replacement Joined': 'P', 'Hold': 'H', 'Frozen': 'F', 
  'Merged': 'M', 'Combined Position': 'C', 'Transfer Pending': 'T', 'Under Notice Period': 'R'
};
const STATUS_COLORS: Record<string, string> = {
  'Active': 'text-green-700 bg-green-100 border-green-200',
  'Vacant Position': 'text-slate-600 bg-slate-100 border-slate-200',
  'Inactive': 'text-slate-600 bg-slate-100 border-slate-200',
  'Offered Yet to Join': 'text-blue-700 bg-blue-100 border-blue-200',
  'Resigned on Roll': 'text-orange-700 bg-orange-100 border-orange-200',
  'Replacement Joined': 'text-indigo-700 bg-indigo-100 border-indigo-200',
  'Under Notice Period': 'text-orange-700 bg-orange-100 border-orange-200',
  'Hold': 'text-red-700 bg-red-100 border-red-200',
  'Frozen': 'text-cyan-700 bg-cyan-100 border-cyan-200',
  'Merged': 'text-purple-700 bg-purple-100 border-purple-200',
  'Combined Position': 'text-fuchsia-700 bg-fuchsia-100 border-fuchsia-200',
  'Transfer Pending': 'text-amber-700 bg-amber-100 border-amber-200'
};
`;
// insert after DESIGNATION_MAP
content = content.replace(/const TIER_OPTS: Record<string, string> = {/, symbolsCode + '\nconst TIER_OPTS: Record<string, string> = {');


// 3. Render Status Symbols in the table row
const renderSearch = `{emp.full_name}`;
const renderReplace = `{emp.full_name}
                          <span 
                            title={emp.employment_status}
                            className={\`w-4 h-4 flex items-center justify-center rounded-full border text-[9px] font-bold shrink-0 \${STATUS_COLORS[emp.employment_status] || 'text-slate-600 bg-slate-100 border-slate-200'}\`}
                          >
                            {STATUS_SYMBOLS[emp.employment_status] || 'A'}
                          </span>`;

content = content.replace(renderSearch, renderReplace);

fs.writeFileSync(file, content);
console.log('Fixed EmployeeManager.tsx');

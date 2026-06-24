const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/src/components/EmployeeManager.tsx');
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings to LF
const originalLineEndings = content.includes('\r\n') ? '\r\n' : '\n';
content = content.replace(/\r\n/g, '\n');

// 1. Replace the edit form status dropdown options
const oldFormSelect = `            <div>
              <label className={lc}>Employment Status</label>
              <select value={form.employment_status} onChange={e => upd('employment_status', e.target.value)} className={fc}>
                <option>Active</option>
                <option>Under Notice Period</option>
                <option>Inactive</option>
              </select>
            </div>`;

const newFormSelect = `            <div>
              <label className={lc}>Employment Status</label>
              <select value={form.employment_status} onChange={e => upd('employment_status', e.target.value)} className={fc}>
                <option value="Active">Active</option>
                <option value="Under Notice Period">Under Notice Period</option>
                <option value="Inactive">Inactive</option>
                <option value="Offered Yet to Join">Offered Yet to Join</option>
                <option value="Resigned on Roll">Resigned on Roll</option>
                <option value="Replacement Joined">Replacement Joined</option>
                <option value="Hold">Hold</option>
                <option value="Frozen">Frozen</option>
                <option value="Merged">Merged</option>
                <option value="Combined Position">Combined Position</option>
                <option value="Transfer Pending">Transfer Pending</option>
              </select>
            </div>`;

content = content.replace(oldFormSelect, newFormSelect);

// 2. Replace the table row status cell block
const oldTableSelectStart = '                  <td className="px-5 py-3.5">';
const oldTableSelectContent = `                    {canEdit ? (
                      <div className="relative inline-block">
                        <select
                          value={emp.employment_status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            try {
                              const parsed: Partial<Employee> = {
                                employment_status: newStatus,
                              };
                              if (newStatus === 'Under Notice Period') {
                                parsed.notice_start_date = emp.notice_start_date || new Date().toISOString();
                              } else {
                                parsed.notice_start_date = null;
                              }
                              await updateEmployee(emp.id, parsed);
                              onRefresh();
                            } catch (err) {
                              setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to update status.' });
                            }
                          }}
                          className={\`appearance-none inline-flex items-center gap-1.5 px-3.5 pr-8 py-1 rounded-full text-xs font-bold border cursor-pointer outline-none transition-all \${
                            emp.employment_status === 'Active'
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100/70'
                              : emp.employment_status === 'Under Notice Period'
                                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100/70'
                                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200/70'
                          }\`}
                          style={{
                            backgroundImage: \`url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23\${
                              emp.employment_status === 'Active' ? '15803d' : emp.employment_status === 'Under Notice Period' ? 'b45309' : '475569'
                            }' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")\`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundSize: '1.25em 1.25em',
                            backgroundRepeat: 'no-repeat'
                          }}
                        >
                          <option value="Active">Active</option>
                          <option value="Under Notice Period">Under Notice Period</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    ) : (
                      <span className={\`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border \${
                        emp.employment_status === 'Active'
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : emp.employment_status === 'Under Notice Period'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                      }\`}>
                        <span className={\`w-1.5 h-1.5 rounded-full \${emp.employment_status === 'Active' ? 'bg-green-500' : emp.employment_status === 'Under Notice Period' ? 'bg-amber-500' : 'bg-slate-400'}\`} />
                        {emp.employment_status}
                      </span>
                    )}`;

const newTableSelectContent = `                    {canEdit ? (
                      <div className="relative inline-block">
                        <select
                          value={emp.employment_status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            try {
                              const parsed: Partial<Employee> = {
                                employment_status: newStatus,
                              };
                              if (newStatus === 'Under Notice Period') {
                                parsed.notice_start_date = emp.notice_start_date || new Date().toISOString();
                              } else {
                                parsed.notice_start_date = null;
                              }
                              await updateEmployee(emp.id, parsed);
                              onRefresh();
                            } catch (err) {
                              setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to update status.' });
                            }
                          }}
                          className="appearance-none inline-flex items-center gap-1.5 px-3.5 pr-8 py-1 rounded-full text-xs font-bold border cursor-pointer outline-none transition-all"
                          style={{
                            backgroundColor: '#f8fafc',
                            color: '#334155',
                            borderColor: '#cbd5e1',
                            backgroundImage: \`url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23475569' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")\`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundSize: '1.25em 1.25em',
                            backgroundRepeat: 'no-repeat'
                          }}
                        >
                          <option value="Active">Active</option>
                          <option value="Under Notice Period">Under Notice Period</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Offered Yet to Join">Offered Yet to Join</option>
                          <option value="Resigned on Roll">Resigned on Roll</option>
                          <option value="Replacement Joined">Replacement Joined</option>
                          <option value="Hold">Hold</option>
                          <option value="Frozen">Frozen</option>
                          <option value="Merged">Merged</option>
                          <option value="Combined Position">Combined Position</option>
                          <option value="Transfer Pending">Transfer Pending</option>
                        </select>
                      </div>
                    ) : (
                      (() => {
                        const sc = STATUS_CONFIG[emp.employment_status] || STATUS_CONFIG['Active'];
                        return (
                          <span className={\`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border \${sc.bg} \${sc.text} \${sc.border}\`} style={{ boxShadow: \`0 0 6px \${sc.glow}40\` }}>
                            <span>{sc.letter}</span>
                            <span>{sc.label}</span>
                          </span>
                        );
                      })()
                    )}`;

// We replace the specific section by finding the block
const targetStr = oldTableSelectStart + '\n' + oldTableSelectContent;
const replacementStr = oldTableSelectStart + '\n' + newTableSelectContent;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
} else {
  // Let's try replacing without exact newlines matching, or by chunking
  console.log("Could not find exact block, trying robust replacement");
  content = content.replace(oldTableSelectContent, newTableSelectContent);
}

// Re-normalize back to original line endings
content = content.replace(/\n/g, originalLineEndings);

fs.writeFileSync(file, content);
console.log('EmployeeManager status options successfully updated!');

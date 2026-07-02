import React, { useMemo } from 'react';
import { Employee, DEFAULT_AVATAR } from '../lib/api';
import { ArrowLeft, Mail, Building2, Tag, ChevronRight, UserCheck, FileText, Printer } from 'lucide-react';
import { GeneratedDocument, getEmployeeDocuments } from '../lib/template_api';

interface EmployeeDetailsProps {
  employeeId: string;
  employees: Employee[];
  onBack: () => void;
  onSelectEmployee: (id: string) => void;
}

const fmtCTC = (n: number) => {
  if (!n) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
};

export const EmployeeDetails: React.FC<EmployeeDetailsProps> = ({ employeeId, employees, onBack, onSelectEmployee }) => {
  const employee = useMemo(() => employees.find(e => e.id === employeeId), [employees, employeeId]);
  
  const [documents, setDocuments] = React.useState<GeneratedDocument[]>([]);

  React.useEffect(() => {
    if (employeeId) {
      getEmployeeDocuments(employeeId).then(setDocuments).catch(console.error);
    }
  }, [employeeId]);
  
  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <p className="font-bold text-lg mb-4">Employee not found.</p>
        <button onClick={onBack} className="btn-primary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const manager = employee.reporting_to_id ? employees.find(e => e.id === employee.reporting_to_id) : undefined;
  const directReports = employees.filter(e => e.reporting_to_id === employee.id);
  const peers = manager ? employees.filter(e => e.reporting_to_id === manager.id && e.id !== employee.id) : [];
  const replacedEmp = employee.replaced_employee_id ? employees.find(e => e.id === employee.replaced_employee_id) : undefined;

  const teamPayroll = directReports.reduce((sum, e) => sum + (e.ctc_annual || 0), 0);

  return (
    <div className="space-y-6 slide-up max-w-5xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-2">
        <ArrowLeft className="w-4 h-4" /> Back to Previous
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-elevated p-8 bg-white border border-slate-200/80 shadow-sm rounded-3xl">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <img src={employee.photo_url || DEFAULT_AVATAR} alt="" className="w-32 h-32 rounded-2xl border-4 border-slate-50 object-cover shadow-lg shrink-0" />
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">{employee.full_name}</h1>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200/60">
                    {employee.emp_id || 'N/A'}
                  </span>
                </div>
                <p className="text-indigo-600 font-bold text-lg">{employee.designation}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-200/50">
                    <Building2 className="w-4 h-4 text-slate-400" /> {employee.business_unit}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-200/50">
                    <Tag className="w-4 h-4 text-slate-400" /> {employee.department}
                  </span>
                  {employee.sub_function && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-200/50">
                      <Tag className="w-4 h-4 text-slate-400" /> {employee.sub_function}
                    </span>
                  )}
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                    employee.employment_status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : employee.employment_status === 'Under Notice Period' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {employee.employment_status}
                  </span>
                  {employee.employment_status === 'Under Notice Period' && employee.notice_start_date && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-black border border-amber-200/50">
                      Notice: {90 - Math.floor((new Date().getTime() - new Date(employee.notice_start_date).getTime()) / (1000 * 3600 * 24))} Days Left
                    </span>
                  )}
                </div>
                
                {replacedEmp && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-center md:justify-start">
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">History of Employer / Role</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-semibold">Replaced:</span>
                        <div onClick={() => onSelectEmployee(replacedEmp.id)} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 hover:bg-slate-100 cursor-pointer rounded-md border border-slate-200 text-xs text-slate-700 font-bold transition-colors">
                          <img src={replacedEmp.photo_url || DEFAULT_AVATAR} alt="" className="w-5 h-5 rounded-full border border-slate-200" />
                          {replacedEmp.full_name} <span className="text-[9px] font-medium text-slate-400 normal-case">({replacedEmp.employment_status})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center sm:text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role Tier</p>
                <p className="text-sm font-black text-slate-800">Tier {employee.role_tier}</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">System Access</p>
                <p className="text-sm font-black text-slate-800">{employee.dashboard_access}</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Actual CTC</p>
                <p className="text-sm font-black text-slate-800 font-mono">{fmtCTC(employee.ctc_annual)}</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Budget Allocated</p>
                <p className="text-sm font-black text-slate-800 font-mono">{fmtCTC(employee.budget_allocated)}</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center md:justify-start">
              <a href={`mailto:${employee.email_official}`} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold text-sm transition-colors border border-indigo-100">
                <Mail className="w-4 h-4" /> {employee.email_official}
              </a>
            </div>

            {/* Professional Background Section */}
            {(employee.past_organization || employee.total_experience || employee.education_qualification) && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Professional Background</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {employee.past_organization && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Past Organization</p>
                      <p className="text-sm font-bold text-slate-800">{employee.past_organization}</p>
                    </div>
                  )}
                  {employee.total_experience && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Experience</p>
                      <p className="text-sm font-bold text-slate-800">{employee.total_experience} Years</p>
                    </div>
                  )}
                  {employee.education_qualification && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Education</p>
                      <p className="text-sm font-bold text-slate-800">{employee.education_qualification}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* History Section */}
            {employee.history && employee.history.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Timeline & History</h3>
                <div className="space-y-4">
                  {employee.history.map((evt, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {evt.type === 'JOINED' ? 'Joined Company' : evt.type === 'CTC_REVISION' ? 'CTC Revised' : 'Status Changed'}
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold mb-1">
                          {new Date(evt.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                        {evt.type === 'CTC_REVISION' && (
                          <p className="text-xs text-slate-600">
                            <span className="line-through text-slate-400 mr-2">{fmtCTC(evt.old_value as number)}</span>
                            <span className="font-bold text-emerald-600">{fmtCTC(evt.new_value as number)}</span>
                          </p>
                        )}
                        {evt.type === 'STATUS_CHANGE' && (
                          <p className="text-xs text-slate-600">
                            <span className="text-slate-400 mr-2">{evt.old_value}</span> ➔ <span className="font-bold text-indigo-600">{evt.new_value}</span>
                          </p>
                        )}
                        {evt.notes && <p className="text-[10px] italic text-slate-500 mt-1">{evt.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents Section */}
            {documents.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Document History
                </h3>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-indigo-200 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{doc.document_name}</h4>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            Generated on {new Date(doc.generated_at).toLocaleDateString()} by {doc.generated_by}
                          </p>
                          <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-600">v{doc.version}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              printWindow.document.write(doc.html_content);
                              printWindow.document.close();
                              setTimeout(() => printWindow.print(), 500);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" /> View / Print
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Direct Reports Section */}
          {directReports.length > 0 && (
            <div className="card-elevated p-6 bg-white border border-slate-200/80 shadow-sm rounded-3xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-indigo-500" /> Direct Reports
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">{directReports.length} team members</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Team Payroll</div>
                  <div className="text-sm font-black text-slate-900 font-mono">{fmtCTC(teamPayroll)}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {directReports.map(emp => (
                  <div key={emp.id} onClick={() => onSelectEmployee(emp.id)}
                    className="flex items-center gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:shadow-md rounded-2xl cursor-pointer transition-all group">
                    <img src={emp.photo_url || DEFAULT_AVATAR} alt="" className="w-10 h-10 rounded-xl border border-slate-200 object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors">{emp.full_name}</div>
                      <div className="text-xs text-slate-400 font-semibold truncate">{emp.designation}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Manager */}
          {manager && (
            <div className="card-elevated p-6 bg-white border border-slate-200/80 shadow-sm rounded-3xl">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Reports To</h3>
              <div onClick={() => onSelectEmployee(manager.id)}
                className="flex items-center gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:shadow-md rounded-2xl cursor-pointer transition-all group">
                <img src={manager.photo_url || DEFAULT_AVATAR} alt="" className="w-12 h-12 rounded-xl border border-slate-200 object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors">{manager.full_name}</div>
                  <div className="text-xs text-slate-400 font-semibold truncate">{manager.designation}</div>
                  <div className="text-[10px] text-slate-400 font-bold mt-0.5 bg-slate-200/50 inline-block px-1.5 rounded">{manager.department}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 shrink-0" />
              </div>
            </div>
          )}

          {/* Peers */}
          {peers.length > 0 && (
            <div className="card-elevated p-6 bg-white border border-slate-200/80 shadow-sm rounded-3xl">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Peers ({peers.length})</h3>
              <div className="space-y-3">
                {peers.map(emp => (
                  <div key={emp.id} onClick={() => onSelectEmployee(emp.id)}
                    className="flex items-center gap-3 p-2 bg-transparent hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-2xl cursor-pointer transition-all group -mx-2 px-2">
                    <img src={emp.photo_url || DEFAULT_AVATAR} alt="" className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800 text-xs truncate group-hover:text-indigo-600 transition-colors">{emp.full_name}</div>
                      <div className="text-[10px] text-slate-400 font-semibold truncate">{emp.designation}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

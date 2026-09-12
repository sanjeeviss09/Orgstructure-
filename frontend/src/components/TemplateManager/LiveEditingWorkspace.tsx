import React, { useState, useEffect, useMemo } from 'react';
import { DocumentTemplate, FormulaComponent, getFormulasByTemplateId, updateTemplateConfig, generateDocument } from '../../lib/template_api';
import { ArrowLeft, ArrowRight, Save, Play, Settings, Users, FileText, Check, ChevronRight, Search, X } from 'lucide-react';
import * as mathjs from 'mathjs';
import { createPortal } from 'react-dom';
import { Employee, fetchEmployees, DEFAULT_AVATAR } from '../../lib/api';

interface Props {
  template: DocumentTemplate;
  onClose: () => void;
}

const MAPPING_OPTIONS = [
  { value: 'manual', label: 'Manual Input' },
  { value: 'system.current_date', label: 'System: Current Date' },
  { value: 'system.auto_ref', label: 'System: Auto Reference Number' },
  { value: 'emp.full_name', label: 'Employee: Full Name' },
  { value: 'emp.emp_id', label: 'Employee: ID' },
  { value: 'emp.designation', label: 'Employee: Designation' },
  { value: 'emp.department', label: 'Employee: Department' },
  { value: 'emp.business_unit', label: 'Employee: Business Unit' },
  { value: 'emp.ctc_annual', label: 'Employee: Annual CTC' },
  { value: 'emp.join_date', label: 'Employee: Joining Date' },
  { value: 'emp.company_name', label: 'Employee: Company Name' },
  { value: 'emp.email_official', label: 'Employee: Official Email' },
];

interface CTCComponent {
  name: string;
  amount: number;
  type: 'monthly' | 'annual';
  category: 'earnings' | 'employer_contribution';
  computed: boolean; // if true, it was auto-computed; user can override
}

// -----------------------------------------------------------------------
// CTC Formula Engine (mirrors Excel formula sheet)
// -----------------------------------------------------------------------
const calculateCTCFromAnnual = (annualCTC: number, category: string = 'Semi Skilled'): CTCComponent[] => {
  const M = annualCTC / 12; // monthly CTC

  // --- BASIC SALARY (C8) ---
  let basic = 0;
  const basicPct = M * 0.45;
  if (basicPct >= 55000) {
    basic = Math.round(basicPct / 10) * 10;
  } else if (basicPct >= 15000) {
    basic = Math.round(basicPct / 100) * 100;
  } else if (basicPct >= 8400 && basicPct <= 15000) {
    basic = 15000;
  } else if (category === 'Semi Skilled') {
    basic = 14918;
  } else if (basicPct >= 7000 && basicPct < 8000) {
    basic = 13739;
  } else {
    basic = 12026;
  }

  // --- SPECIAL ALLOWANCE (C9) ---
  let special = 0;
  const temp = (M - 833) / 2;
  if (temp < 11400) {
    special = 0;
  } else if (temp > 18000) {
    special = Math.max(temp - basic, 21100 - basic);
  } else {
    special = 21100 - basic;
  }
  special = Math.round(special);

  // --- TOTAL WAGES (C10) ---
  const totalWages = basic + special;

  // --- EPF (C14) ---
  const epf = Math.round(basic * 0.12);

  // --- ESI (C18) ---
  const esi = totalWages <= 21000 ? Math.round(totalWages * 0.0325) : 0;

  // --- EX-GRATIA (C19) ---
  const exGratia = 10000 / 12;

  // --- BONUS ADJ (C20) ---
  let bonusAdj = 0;
  if (totalWages > 21000) {
    bonusAdj = (10000 / 12) - exGratia;
  } else if (basic < 14918) {
    bonusAdj = (basic / 12) - exGratia;
  } else {
    bonusAdj = (14918 / 12) - exGratia;
  }

  // --- HRA (C12) ---
  let hra = 0;
  if (basic >= 15000) {
    if (special > 0) {
      const limit = M - totalWages - epf - esi - exGratia;
      hra = (basic * 0.70 < limit) ? (basic * 0.70) : limit;
    } else {
      if (M - 833 - basic > 2000) {
        hra = M - basic - special - epf - esi - exGratia;
      }
    }
    if (special === 0) {
      hra -= (14918 - 10000) / 12;
    }
  }
  hra = Math.max(0, Math.round(hra));

  // --- CA (Conveyance - Balancing Figure) (C13) ---
  const nonCaTotal = basic + special + epf + esi + exGratia + bonusAdj + hra;
  let ca = Math.round(M - nonCaTotal);
  if (ca < 0) ca = 0;

  return [
    { name: 'Basic', amount: basic, type: 'monthly', category: 'earnings', computed: true },
    { name: 'HRA', amount: hra, type: 'monthly', category: 'earnings', computed: true },
    { name: 'Special Allowance', amount: special, type: 'monthly', category: 'earnings', computed: true },
    { name: 'Conveyance (CA)', amount: ca, type: 'monthly', category: 'earnings', computed: true },
    { name: 'Gross Monthly Salary', amount: 0, type: 'monthly', category: 'earnings', computed: true }, // divider row
    { name: 'EPF', amount: epf, type: 'monthly', category: 'employer_contribution', computed: true },
    { name: 'ESI', amount: esi, type: 'monthly', category: 'employer_contribution', computed: true },
    { name: 'Ex-Gratia', amount: Math.round(exGratia), type: 'monthly', category: 'employer_contribution', computed: true },
    { name: 'Bonus Adj', amount: Math.round(bonusAdj), type: 'monthly', category: 'employer_contribution', computed: true },
  ];
};


export const LiveEditingWorkspace: React.FC<Props> = ({ template, onClose }) => {
  // Wizard step: 'employee' | 'ctc' | 'generate' | 'config'
  const [step, setStep] = useState<'employee' | 'ctc' | 'generate' | 'config'>('employee');
  const [formulas, setFormulas] = useState<FormulaComponent[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>(template.field_mappings || {});

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // CTC Breakdown
  const [includeCTC, setIncludeCTC] = useState(false);
  const [ctcCategory, setCtcCategory] = useState<string>('Semi Skilled');
  const [annualCTCInput, setAnnualCTCInput] = useState<number>(0);
  const [ctcComponents, setCtcComponents] = useState<CTCComponent[]>(calculateCTCFromAnnual(0, 'Semi Skilled'));

  // For XLSX salary calc
  const [testMonthlyCTC, setTestMonthlyCTC] = useState(50000);
  const [calculatedFormulas, setCalculatedFormulas] = useState<Record<string, number>>({});

  useEffect(() => {
    if (template.file_type === 'XLSX') {
      getFormulasByTemplateId(template.id).then(setFormulas);
    }
    fetchEmployees().then(setEmployees);
  }, [template.id, template.file_type]);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employees;
    const q = searchQuery.toLowerCase();
    return employees.filter(e =>
      e.full_name.toLowerCase().includes(q) ||
      (e.emp_id || '').toLowerCase().includes(q) ||
      e.designation.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  // Auto-fill fields when employee is selected
  const autoFillFromEmployee = (emp: Employee) => {
    const newValues: Record<string, string> = { ...fieldValues };
    template.editable_fields.forEach(field => {
      const mapping = fieldMappings[field] || 'manual';
      if (mapping === 'system.current_date') {
        newValues[field] = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
      } else if (mapping === 'system.auto_ref') {
        newValues[field] = `REF/HR/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
      } else if (mapping.startsWith('emp.')) {
        const empProp = mapping.split('.')[1] as keyof Employee;
        newValues[field] = String(emp[empProp] || '');
      }
    });
    setFieldValues(newValues);
    // Pre-fill CTC using formula engine if employee has annual CTC
    if (emp.ctc_annual && emp.ctc_annual > 0) {
      setAnnualCTCInput(emp.ctc_annual);
      setCtcComponents(calculateCTCFromAnnual(emp.ctc_annual, ctcCategory));
      setTestMonthlyCTC(Math.round(emp.ctc_annual / 12));
    }
  };

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    autoFillFromEmployee(emp);
  };

  const handleFieldChange = (field: string, val: string) => {
    setFieldValues(prev => ({ ...prev, [field]: val }));
  };

  const handleMappingChange = (field: string, val: string) => {
    setFieldMappings(prev => ({ ...prev, [field]: val }));
  };

  const handleCTCComponentChange = (idx: number, val: number) => {
    setCtcComponents(prev => prev.map((c, i) => i === idx ? { ...c, amount: val, computed: false } : c));
  };

  // Recalculate using formula engine whenever annual CTC input changes
  const handleAnnualCTCChange = (val: number, cat: string = ctcCategory) => {
    setAnnualCTCInput(val);
    if (val > 0) {
      setCtcComponents(calculateCTCFromAnnual(val, cat));
      setTestMonthlyCTC(Math.round(val / 12));
    }
  };

  const handleCategoryChange = (cat: string) => {
    setCtcCategory(cat);
    handleAnnualCTCChange(annualCTCInput, cat);
  };

  // Derived totals — exclude the 'Gross Monthly Salary' divider row
  const earningsComponents = ctcComponents.filter(c => c.category === 'earnings' && c.name !== 'Gross Monthly Salary');
  const employerComponents = ctcComponents.filter(c => c.category === 'employer_contribution');
  const grossMonthly = earningsComponents.filter(c => c.type === 'monthly').reduce((s, c) => s + c.amount, 0);
  const totalMonthlyCTC = grossMonthly + employerComponents.filter(c => c.type === 'monthly').reduce((s, c) => s + c.amount, 0);
  const totalAnnualCTC = totalMonthlyCTC * 12 + employerComponents.filter(c => c.type === 'annual').reduce((s, c) => s + c.amount, 0);
  const variance = annualCTCInput > 0 ? annualCTCInput - totalAnnualCTC : null;

  const getCTCHTML = () => {
    if (!includeCTC) return '';

    const fmtM = (n: number) => `₹${n.toLocaleString('en-IN')}`;
    const fmtA = (c: CTCComponent) => fmtM(c.type === 'monthly' ? c.amount * 12 : c.amount);

    const earningRows = earningsComponents.map(c => `
      <tr>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;">${c.name}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right;font-family:monospace;">${fmtM(c.amount)}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right;font-family:monospace;">${fmtA(c)}</td>
      </tr>
    `).join('');

    const grossRow = `
      <tr style="background:#f0f9ff;font-weight:700;">
        <td style="padding:8px 10px;border:1px solid #e2e8f0;">Gross Monthly Salary</td>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;text-align:right;font-family:monospace;">₹${grossMonthly.toLocaleString('en-IN')}</td>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;text-align:right;font-family:monospace;">₹${(grossMonthly * 12).toLocaleString('en-IN')}</td>
      </tr>`;

    const employerRows = employerComponents.map(c => `
      <tr>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;">${c.name}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right;font-family:monospace;">${c.type === 'monthly' ? fmtM(c.amount) : '—'}</td>
        <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right;font-family:monospace;">${fmtA(c)}</td>
      </tr>
    `).join('');

    return `
      <div style="page-break-inside:avoid;margin-top:32px;">
        <h3 style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:8px;border-bottom:2px solid #6366f1;padding-bottom:4px;">CTC Structure</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background:#6366f1;color:#fff;">
              <th style="padding:8px 10px;text-align:left;">Component</th>
              <th style="padding:8px 10px;text-align:right;">Monthly</th>
              <th style="padding:8px 10px;text-align:right;">Annual</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colspan="3" style="padding:4px 10px;background:#f8fafc;font-size:10px;font-weight:700;letter-spacing:.05em;color:#64748b;border:1px solid #e2e8f0;">A. EARNINGS</td></tr>
            ${earningRows}
            ${grossRow}
            <tr><td colspan="3" style="padding:4px 10px;background:#f8fafc;font-size:10px;font-weight:700;letter-spacing:.05em;color:#64748b;border:1px solid #e2e8f0;">B. EMPLOYER CONTRIBUTIONS</td></tr>
            ${employerRows}
          </tbody>
          <tfoot>
            <tr style="background:#1e293b;color:#fff;font-weight:700;">
              <td style="padding:10px;border:1px solid #334155;">Total Annual CTC</td>
              <td style="padding:10px;border:1px solid #334155;text-align:right;font-family:monospace;">₹${totalMonthlyCTC.toLocaleString('en-IN')}/mo</td>
              <td style="padding:10px;border:1px solid #334155;text-align:right;font-family:monospace;">₹${totalAnnualCTC.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  };

  const getPreviewHTML = () => {
    let html = template.parsed_html || '<div style="color:#94a3b8;padding:32px;text-align:center;">Preview not available</div>';
    template.editable_fields.forEach(field => {
      const val = fieldValues[field] || `<span style="background:#e0e7ff;color:#4338ca;padding:0 4px;border-radius:4px;">{{${field}}}</span>`;
      const regex = new RegExp(`\\{\\{${field}\\}\\}`, 'g');
      html = html.replace(regex, val);
    });
    if (includeCTC) {
      html += getCTCHTML();
    }
    return html;
  };

  const runSalaryCalculation = () => {
    const results: Record<string, number> = {};
    const scope: any = { monthly_ctc: testMonthlyCTC, annual_ctc: testMonthlyCTC * 12 };
    formulas.forEach(f => {
      try {
        const sanitized = f.expression.replace(/[A-Z]+[0-9]+/g, 'monthly_ctc');
        const res = mathjs.evaluate(sanitized, scope);
        results[f.cell_ref || f.id] = res;
        scope[f.cell_ref || f.id] = res;
      } catch (e) {
        results[f.cell_ref || f.id] = 0;
      }
    });
    setCalculatedFormulas(results);
  };

  const saveConfig = async () => {
    try {
      await updateTemplateConfig(template.id, fieldMappings);
      alert('Template configuration saved successfully!');
      setStep('employee');
    } catch (e) {
      alert('Failed to save config');
    }
  };

  const generateAndSave = async () => {
    try {
      await generateDocument({
        employee_id: selectedEmployee?.id || '',
        template_id: template.id,
        document_name: `${template.name} - ${selectedEmployee?.full_name || 'Generated'}`,
        html_content: getPreviewHTML(),
        field_values: fieldValues
      });
      alert('Document generated and saved to employee profile!');
      onClose();
    } catch (e) {
      alert('Failed to generate document');
    }
  };

  const STEPS = ['employee', 'ctc', 'generate'] as const;
  const stepIndex = step === 'config' ? -1 : STEPS.indexOf(step as any);
  const STEP_LABELS = ['Select Employee', 'CTC Structure', 'Preview & Generate'];

  return createPortal(
    <div className="fixed inset-0 bg-white z-[60] flex flex-col pop-in">

      {/* Header */}
      <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-900">{template.name}</h2>
            <p className="text-xs font-bold text-slate-500 uppercase">{template.type} • {template.file_type} • Version {template.version}</p>
          </div>
        </div>

        {/* Step Indicator + Config toggle */}
        <div className="flex items-center gap-4">
          {step !== 'config' && (
            <div className="hidden md:flex items-center gap-1">
              {STEP_LABELS.map((label, i) => (
                <React.Fragment key={label}>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    i === stepIndex
                      ? 'bg-indigo-600 text-white'
                      : i < stepIndex
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-400'
                  }`} onClick={() => {
                    if (i < stepIndex || (i === 1)) {
                      setStep(STEPS[i]);
                    }
                  }}>
                    {i < stepIndex ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
                    <span className="hidden lg:inline">{label}</span>
                  </div>
                  {i < STEP_LABELS.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                </React.Fragment>
              ))}
            </div>
          )}
          <button
            onClick={() => setStep(step === 'config' ? 'employee' : 'config')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${step === 'config' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Configure Fields</span>
          </button>
        </div>
      </div>

      {/* Body */}
      {step === 'config' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-2xl mx-auto p-8">
            <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" /> Field Mapping Configuration
            </h3>
            <p className="text-sm text-slate-500 mb-8">Map each detected template variable to an employee attribute or system variable.</p>
            {template.editable_fields.length === 0 && (
              <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-bold">No {'{{fields}}'} detected in this template.</p>
                <p className="text-sm mt-1">Add variables like {'{{employee_name}}'} to your template file.</p>
              </div>
            )}
            <div className="space-y-4">
              {template.editable_fields.map(field => (
                <div key={field} className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-2 font-mono text-indigo-600">{"{{"}{field}{"}}"}</label>
                  <select
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={fieldMappings[field] || 'manual'}
                    onChange={(e) => handleMappingChange(field, e.target.value)}
                  >
                    {MAPPING_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep('employee')} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">
                Cancel
              </button>
              <button onClick={saveConfig} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">
                <Save className="w-4 h-4" /> Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: Employee Selection */}
      {step === 'employee' && (
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel */}
          <div className="w-1/2 max-w-lg border-r border-slate-200 flex flex-col bg-white">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 mb-1 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" /> Select Employee
              </h3>
              <p className="text-xs text-slate-500 mb-4">Click on an employee to instantly auto-fill all mapped fields in the document.</p>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white transition-colors"
                  placeholder="Search by name, ID, department..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
              {filteredEmployees.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold">No employees match your search.</p>
                </div>
              )}
              {filteredEmployees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => handleSelectEmployee(emp)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left group ${
                    selectedEmployee?.id === emp.id
                      ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-indigo-200'
                  }`}
                >
                  <img src={emp.photo_url || DEFAULT_AVATAR} alt="" className="w-10 h-10 rounded-xl border border-slate-200 object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm truncate ${selectedEmployee?.id === emp.id ? 'text-indigo-700' : 'text-slate-800'}`}>{emp.full_name}</span>
                      {selectedEmployee?.id === emp.id && <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                    </div>
                    <div className="text-xs text-slate-500 font-semibold truncate">{emp.designation} • {emp.department}</div>
                    {emp.emp_id && <div className="text-[10px] font-mono text-slate-400 mt-0.5">{emp.emp_id}</div>}
                  </div>
                  {selectedEmployee?.id !== emp.id && (
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setStep('ctc')}
                disabled={!selectedEmployee}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next: CTC Structure <ArrowRight className="w-4 h-4" />
              </button>
              {!selectedEmployee && (
                <p className="text-center text-xs text-slate-400 mt-2">Select an employee to continue</p>
              )}
            </div>
          </div>

          {/* Right Panel: Filled Fields Preview */}
          <div className="flex-1 bg-slate-50 overflow-y-auto custom-scrollbar p-6">
            {!selectedEmployee ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Users className="w-16 h-16 mb-4 opacity-20" />
                <h3 className="text-lg font-bold">No employee selected</h3>
                <p className="text-sm mt-1">Click an employee on the left to see auto-filled fields</p>
              </div>
            ) : (
              <div>
                {/* Employee Card */}
                <div className="bg-white border border-indigo-100 rounded-2xl p-5 mb-6 shadow-sm flex items-center gap-4">
                  <img src={selectedEmployee.photo_url || DEFAULT_AVATAR} alt="" className="w-14 h-14 rounded-2xl border border-slate-200 object-cover shrink-0" />
                  <div>
                    <div className="text-base font-black text-slate-900">{selectedEmployee.full_name}</div>
                    <div className="text-sm text-indigo-600 font-bold">{selectedEmployee.designation}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{selectedEmployee.department} • {selectedEmployee.business_unit}</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Annual CTC</div>
                    <div className="text-sm font-black text-slate-900 font-mono">
                      ₹{(selectedEmployee.ctc_annual || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Auto-filled Fields */}
                <h4 className="text-xs font-black text-slate-500 uppercase mb-3">Auto-filled Fields</h4>
                <div className="space-y-2 mb-6">
                  {template.editable_fields
                    .filter(f => fieldMappings[f] && fieldMappings[f] !== 'manual')
                    .map(field => (
                    <div key={field} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <span className="text-xs font-mono font-bold text-emerald-700">{"{{"}{field}{"}}"}</span>
                      <span className="text-xs font-bold text-slate-700 text-right max-w-[60%] truncate">{fieldValues[field] || '—'}</span>
                    </div>
                  ))}
                  {template.editable_fields.filter(f => fieldMappings[f] && fieldMappings[f] !== 'manual').length === 0 && (
                    <p className="text-xs text-slate-400 italic p-3 bg-white border border-slate-100 rounded-xl">No auto-mapped fields. Go to "Configure Fields" to set them up.</p>
                  )}
                </div>

                {/* Manual Fields */}
                {template.editable_fields.filter(f => !fieldMappings[f] || fieldMappings[f] === 'manual').length > 0 && (
                  <>
                    <h4 className="text-xs font-black text-slate-500 uppercase mb-3">Manual Input Fields</h4>
                    <div className="space-y-3">
                      {template.editable_fields
                        .filter(f => !fieldMappings[f] || fieldMappings[f] === 'manual')
                        .map(field => (
                        <div key={field}>
                          <label className="block text-xs font-bold text-slate-600 mb-1.5">{field.replace(/_/g, ' ')}</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 transition-colors shadow-sm"
                            placeholder={`Enter ${field}...`}
                            value={fieldValues[field] || ''}
                            onChange={(e) => handleFieldChange(field, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: CTC Structure (Optional) */}
      {step === 'ctc' && (
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel: CTC Form */}
          <div className="w-1/2 max-w-lg border-r border-slate-200 flex flex-col bg-white">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 mb-1">CTC Structure</h3>
              <p className="text-xs text-slate-500 mb-4">Optionally include a CTC breakdown table in the generated document.</p>

              {/* Toggle */}
              <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:border-indigo-300 transition-colors">
                <div
                  onClick={() => setIncludeCTC(v => !v)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${includeCTC ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${includeCTC ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">{includeCTC ? 'CTC Structure Included' : 'Skip CTC Structure'}</div>
                  <div className="text-xs text-slate-500">{includeCTC ? 'A CTC breakdown table will be appended' : 'Document will not include a CTC table'}</div>
                </div>
              </label>
            </div>

            {includeCTC && (
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Annual CTC Input & Category */}
                <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-black text-indigo-700 uppercase mb-1.5">Annual CTC (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 font-bold text-sm">₹</span>
                      <input
                        type="text"
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-indigo-200 bg-white font-mono text-base font-bold focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter Annual CTC..."
                        value={annualCTCInput ? annualCTCInput.toLocaleString('en-IN') : ''}
                        onChange={e => {
                          const val = e.target.value.replace(/,/g, '');
                          if (!isNaN(Number(val))) handleAnnualCTCChange(Number(val));
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-40">
                    <label className="block text-xs font-black text-indigo-700 uppercase mb-1.5">Category</label>
                    <select
                      className="w-full px-3 py-2.5 rounded-xl border border-indigo-200 bg-white text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                      value={ctcCategory}
                      onChange={e => handleCategoryChange(e.target.value)}
                    >
                      <option value="Semi Skilled">Semi Skilled</option>
                      <option value="Skilled">Skilled</option>
                      <option value="Unskilled">Unskilled</option>
                    </select>
                  </div>
                </div>
                <div className="px-4 pt-2">
                  <p className="text-[11px] text-indigo-500 mb-2 font-semibold">Formula engine exactly mirrors Excel splitting rules ↓</p>
                </div>

                {/* Earnings Section */}
                <div className="px-4 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">A. Earnings (in-hand components)</span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {earningsComponents.map((comp) => (
                      <div key={comp.name} className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-200 p-2.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-700 truncate">{comp.name}</span>
                            {comp.computed && (
                              <span className="text-[9px] font-bold bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded shrink-0">AUTO</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-400">₹</span>
                          <input
                            type="text"
                            className="w-28 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-mono text-right focus:ring-2 focus:ring-indigo-400"
                            value={comp.amount ? comp.amount.toLocaleString('en-IN') : ''}
                            onChange={e => {
                              const val = e.target.value.replace(/,/g, '');
                              if (!isNaN(Number(val))) {
                                handleCTCComponentChange(
                                  ctcComponents.findIndex(c => c.name === comp.name), 
                                  Number(val)
                                );
                              }
                            }}
                          />
                          <span className="text-[10px] text-slate-400 w-6 shrink-0">{comp.type === 'monthly' ? '/mo' : '/yr'}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Gross Subtotal */}
                  <div className="flex justify-between items-center p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-4">
                    <span className="text-sm font-bold text-emerald-800">Gross Monthly</span>
                    <span className="text-sm font-black text-emerald-900 font-mono">₹{grossMonthly.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Employer Contributions */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">B. Employer Contributions</span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {employerComponents.map((comp) => (
                      <div key={comp.name} className="flex items-center gap-2 bg-amber-50/50 rounded-xl border border-amber-100 p-2.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-700 truncate">{comp.name}</span>
                            {comp.computed && (
                              <span className="text-[9px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded shrink-0">AUTO</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-400">₹</span>
                          <input
                            type="number"
                            className="w-28 px-2 py-1.5 rounded-lg border border-amber-200 bg-white text-sm font-mono text-right focus:ring-2 focus:ring-amber-400"
                            value={comp.amount}
                            onChange={e => handleCTCComponentChange(
                              ctcComponents.findIndex(c => c.name === comp.name),
                              Number(e.target.value)
                            )}
                          />
                          <span className="text-[10px] text-slate-400 w-6 shrink-0">{comp.type === 'monthly' ? '/mo' : '/yr'}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Grand Total */}
                  <div className="p-4 bg-slate-900 rounded-2xl mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-300">Total Monthly CTC</span>
                      <span className="text-sm font-black text-white font-mono">₹{totalMonthlyCTC.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-300">Total Annual CTC</span>
                      <span className="text-base font-black text-indigo-300 font-mono">₹{totalAnnualCTC.toLocaleString('en-IN')}</span>
                    </div>
                    {variance !== null && Math.abs(variance) > 100 && (
                      <div className={`mt-3 pt-3 border-t border-slate-700 flex justify-between items-center text-xs font-bold ${variance < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                        <span>Variance from entered CTC</span>
                        <span>{variance > 0 ? '+' : ''}₹{Math.abs(variance).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {variance !== null && Math.abs(variance) <= 100 && (
                      <div className="mt-3 pt-3 border-t border-slate-700 flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <Check className="w-3 h-3" /> Balanced — matches entered CTC
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!includeCTC && (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <div className="text-4xl mb-3">💼</div>
                  <p className="text-sm font-bold">CTC table is turned off</p>
                  <p className="text-xs mt-1">Toggle the switch above to include it</p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button onClick={() => setStep('employee')} className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep('generate')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Next: Preview <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Panel: Live preview */}
          <div className="flex-1 bg-slate-100 overflow-y-auto custom-scrollbar p-8 flex justify-center items-start">
            <div className="bg-white w-[700px] max-w-[95%] min-h-[1056px] shadow-lg border border-slate-200 p-12 mb-8 shrink-0">
              <div
                className="prose prose-slate max-w-none prose-sm prose-p:leading-relaxed prose-headings:font-bold"
                dangerouslySetInnerHTML={{ __html: getPreviewHTML() }}
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Preview & Generate */}
      {step === 'generate' && (
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel */}
          <div className="w-72 shrink-0 border-r border-slate-200 flex flex-col bg-white">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase mb-4">Summary</h3>

              {selectedEmployee && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <img src={selectedEmployee.photo_url || DEFAULT_AVATAR} alt="" className="w-10 h-10 rounded-xl border object-cover shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-indigo-900 truncate">{selectedEmployee.full_name}</div>
                      <div className="text-xs text-indigo-600 truncate">{selectedEmployee.designation}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {Object.entries(fieldValues).filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{k.replace(/_/g, ' ')}</span>
                    <span className="text-xs font-bold text-slate-700 truncate">{v}</span>
                  </div>
                ))}
                {includeCTC && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <div className="text-[10px] font-bold text-amber-700 uppercase mb-1">CTC Included</div>
                    <div className="text-xs font-bold text-amber-900">Annual: ₹{totalAnnualCTC.toLocaleString('en-IN')}</div>
                  </div>
                )}
              </div>
            </div>

            {/* XLSX Calc Engine */}
            {template.file_type === 'XLSX' && (
              <div className="p-4 border-b border-slate-100 bg-amber-50/50">
                <h3 className="text-xs font-black text-amber-900 uppercase mb-2 flex items-center justify-between">
                  CTC Calc Engine
                  <button onClick={runSalaryCalculation} className="bg-amber-100 text-amber-700 p-1.5 rounded-lg hover:bg-amber-200">
                    <Play className="w-3.5 h-3.5" />
                  </button>
                </h3>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white font-mono text-sm mb-3"
                  value={testMonthlyCTC}
                  onChange={e => setTestMonthlyCTC(Number(e.target.value))}
                />
                {formulas.slice(0, 4).map(f => (
                  <div key={f.id} className="text-xs mb-1">
                    <span className="font-bold text-slate-700">{f.component_name}: </span>
                    <span className="text-emerald-600 font-mono">{calculatedFormulas[f.cell_ref || f.id] !== undefined ? `₹${calculatedFormulas[f.cell_ref || f.id].toFixed(0)}` : '—'}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50 space-y-3">
              <button onClick={() => setStep('ctc')} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 text-sm">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={generateAndSave} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors">
                <FileText className="w-4 h-4" /> Generate & Save
              </button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="flex-1 bg-slate-100 overflow-y-auto custom-scrollbar p-8 flex justify-center items-start">
            <div className="bg-white w-[800px] max-w-[95%] min-h-[1056px] shadow-lg border border-slate-200 p-12 mb-8 shrink-0">
              <div
                className="prose prose-slate max-w-none prose-sm sm:prose-base prose-p:leading-relaxed prose-headings:font-bold prose-a:text-indigo-600"
                dangerouslySetInnerHTML={{ __html: getPreviewHTML() }}
              />
            </div>
          </div>
        </div>
      )}

    </div>,
    document.body
  );
};

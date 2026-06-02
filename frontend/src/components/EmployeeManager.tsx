import React, { useRef, useState, useMemo } from 'react';
import { Employee, createEmployee, updateEmployee, deleteEmployee, bulkDeleteEmployees, bulkImportEmployees, DEFAULT_AVATAR } from '../lib/api';
import { ConfirmDialog, AlertDialog } from './Dialogs';
import { Plus, Edit2, Trash2, Mail, Building2, Tag, Upload, Download, CheckCircle, AlertCircle, X, Search, ChevronDown } from 'lucide-react';
import type { Role } from '../App';
import { supabase } from '../lib/supabase';

interface EmployeeManagerProps {
  employees: Employee[];
  activeRole: Role;
  currentUser?: any;
  onRefresh: () => void;
}

// ─── CSV helpers ───────────────────────────────────────────────────────
const CSV_TEMPLATE_HEADERS = [
  'emp_id', 'full_name', 'email_official', 'designation', 'department', 'sub_function', 'business_unit',
  'role_tier', 'ctc_annual', 'budget_allocated', 'ctc_currency', 'employment_status', 'dashboard_access', 'reporting_manager_emp_id', 'company_name', 'photo_url', 'past_organization', 'total_experience', 'education_qualification'
];
const CSV_SAMPLE_ROW = [
  'APS007', 'Jane Doe', 'jane@axxel.com', 'Software Engineer', 'Software Engineering', 'Engineering Unit', 'Technology',
  '5', '1200000', '1500000', 'INR', 'Active', 'Employee', 'APS001', 'Axxel Corp', 'https://i.pravatar.cc/150?u=jane', 'TechCorp Inc.', '5', 'B.Tech in Computer Science'
];
const downloadTemplate = () => {
  const csv = [CSV_TEMPLATE_HEADERS.join(','), CSV_SAMPLE_ROW.join(',')].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'employee_import_template.csv'; a.click();
  URL.revokeObjectURL(url);
};
const parseCSV = (text: string): Record<string, string>[] => {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });

    // Auto-assign role tier and access based on designation if not provided
    if (obj.designation && DESIGNATION_MAP[obj.designation]) {
      const mapping = DESIGNATION_MAP[obj.designation];
      if (!obj.role_tier) obj.role_tier = String(mapping.tier);
      if (!obj.dashboard_access) obj.dashboard_access = mapping.access;
    }

    return obj;
  });
};

// ─── Designation → Role Tier + Dashboard Access auto-map ──────────────
const DESIGNATION_MAP: Record<string, { tier: number; access: string }> = {
  // Tier 1 – C-Suite
  'CEO': { tier: 1, access: 'Admin' }, 'Managing Director': { tier: 1, access: 'Admin' }, 'President': { tier: 1, access: 'Admin' },
  // Tier 2 – VP / CXO
  'CTO': { tier: 2, access: 'Management' }, 'CFO': { tier: 2, access: 'Management' }, 'COO': { tier: 2, access: 'Management' },
  'CMO': { tier: 2, access: 'Management' }, 'CRO': { tier: 2, access: 'Management' }, 'CHRO': { tier: 2, access: 'Management' },
  'VP of Engineering': { tier: 2, access: 'Management' }, 'VP of HR': { tier: 2, access: 'Management' },
  'VP of Finance': { tier: 2, access: 'Management' }, 'VP of Sales': { tier: 2, access: 'Management' },
  'VP of Marketing': { tier: 2, access: 'Management' }, 'VP of Operations': { tier: 2, access: 'Management' },
  'VP of Product': { tier: 2, access: 'Management' },
  // Tier 3 – Head of Dept
  'Director of Engineering': { tier: 3, access: 'HOD' }, 'Director of Sales': { tier: 3, access: 'HOD' },
  'Director of Operations': { tier: 3, access: 'HOD' }, 'Director of Marketing': { tier: 3, access: 'HOD' },
  'Director of HR': { tier: 3, access: 'HOD' }, 'Director of Finance': { tier: 3, access: 'HOD' },
  'Head of Product': { tier: 3, access: 'HOD' }, 'Head of Growth': { tier: 3, access: 'HOD' },
  'Head of Finance': { tier: 3, access: 'HOD' }, 'Head of HR': { tier: 3, access: 'HOD' },
  'Head of Marketing': { tier: 3, access: 'HOD' }, 'Head of Design': { tier: 3, access: 'HOD' },
  'Head of Engineering': { tier: 3, access: 'HOD' }, 'Head of Sales': { tier: 3, access: 'HOD' },
  'Head of Operations': { tier: 3, access: 'HOD' },
  // Tier 4 – Manager
  'Engineering Manager': { tier: 4, access: 'Manager' }, 'Product Manager': { tier: 4, access: 'Manager' },
  'QA Lead': { tier: 4, access: 'Manager' }, 'QA Manager': { tier: 4, access: 'Manager' },
  'Product Design Lead': { tier: 4, access: 'Manager' }, 'Digital Marketing Manager': { tier: 4, access: 'Manager' },
  'Enterprise Accounts Lead': { tier: 4, access: 'Manager' }, 'Sales Manager': { tier: 4, access: 'Manager' },
  'HR Manager': { tier: 4, access: 'Manager' }, 'Finance Manager': { tier: 4, access: 'Manager' },
  'Operations Manager': { tier: 4, access: 'Manager' }, 'Team Lead': { tier: 4, access: 'Manager' },
  'Tech Lead': { tier: 4, access: 'Manager' }, 'Project Manager': { tier: 4, access: 'Manager' },
  // Tier 5 – Individual Contributor
  'Senior Software Engineer': { tier: 5, access: 'Employee' }, 'Senior Frontend Engineer': { tier: 5, access: 'Employee' },
  'Senior Backend Engineer': { tier: 5, access: 'Employee' }, 'Backend Engineer': { tier: 5, access: 'Employee' },
  'Frontend Engineer': { tier: 5, access: 'Employee' }, 'Full Stack Engineer': { tier: 5, access: 'Employee' },
  'Software Engineer': { tier: 5, access: 'Employee' }, 'UI/UX Designer': { tier: 5, access: 'Employee' },
  'Graphic Designer': { tier: 5, access: 'Employee' }, 'QA Automation Specialist': { tier: 5, access: 'Employee' },
  'QA Engineer': { tier: 5, access: 'Employee' }, 'SEO Analyst': { tier: 5, access: 'Employee' },
  'Data Analyst': { tier: 5, access: 'Employee' }, 'Business Analyst': { tier: 5, access: 'Employee' },
  'Marketing Analyst': { tier: 5, access: 'Employee' }, 'Sales Executive': { tier: 5, access: 'Employee' },
  'Senior Sales Executive': { tier: 5, access: 'Employee' }, 'Account Executive': { tier: 5, access: 'Employee' },
  'HR Executive': { tier: 5, access: 'Employee' }, 'Finance Analyst': { tier: 5, access: 'Employee' },
  'Accountant': { tier: 5, access: 'Employee' }, 'DevOps Engineer': { tier: 5, access: 'Employee' },
  'Cloud Engineer': { tier: 5, access: 'Employee' }, 'Data Scientist': { tier: 5, access: 'Employee' },
  'ML Engineer': { tier: 5, access: 'Employee' }, 'Content Writer': { tier: 5, access: 'Employee' },
  'Customer Success Manager': { tier: 5, access: 'Employee' }, 'Trainee': { tier: 5, access: 'Employee' }, 'Intern': { tier: 5, access: 'Employee' },
};

const DESIG_BY_TIER: Record<number, string[]> = {
  1: ['CEO', 'Managing Director', 'President'],
  2: ['CTO', 'CFO', 'COO', 'CMO', 'CRO', 'CHRO', 'VP of Engineering', 'VP of HR', 'VP of Finance', 'VP of Sales', 'VP of Marketing', 'VP of Operations', 'VP of Product'],
  3: ['Director of Engineering', 'Director of Sales', 'Director of Operations', 'Director of Marketing', 'Director of HR', 'Director of Finance', 'Head of Product', 'Head of Growth', 'Head of Finance', 'Head of HR', 'Head of Marketing', 'Head of Design', 'Head of Engineering', 'Head of Sales', 'Head of Operations'],
  4: ['Engineering Manager', 'Product Manager', 'QA Lead', 'QA Manager', 'Product Design Lead', 'Digital Marketing Manager', 'Enterprise Accounts Lead', 'Sales Manager', 'HR Manager', 'Finance Manager', 'Operations Manager', 'Team Lead', 'Tech Lead', 'Project Manager'],
  5: ['Senior Software Engineer', 'Senior Frontend Engineer', 'Senior Backend Engineer', 'Backend Engineer', 'Frontend Engineer', 'Full Stack Engineer', 'Software Engineer', 'UI/UX Designer', 'Graphic Designer', 'QA Automation Specialist', 'QA Engineer', 'SEO Analyst', 'Data Analyst', 'Business Analyst', 'Marketing Analyst', 'Sales Executive', 'Senior Sales Executive', 'Account Executive', 'HR Executive', 'Finance Analyst', 'Accountant', 'DevOps Engineer', 'Cloud Engineer', 'Data Scientist', 'ML Engineer', 'Content Writer', 'Customer Success Manager', 'Trainee', 'Intern'],
};

const TIER_OPTS: Record<string, string> = {
  '1': '1 · C-Suite', '2': '2 · VP / CXO', '3': '3 · Head of Dept', '4': '4 · Manager', '5': '5 · Individual'
};

// Helper to resize and compress images using canvas in the browser returning a Blob
const resizeImageToBlob = (file: File, maxWidth = 256, maxHeight = 256): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Blob conversion failed'));
        }, 'image/jpeg', 0.85);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Main function to verify/create storage bucket and upload the file
const uploadPhotoToSupabase = async (file: File): Promise<string> => {
  try {
    // 1. Verify/create storage bucket
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const exists = buckets?.some((b: any) => b.name === 'employee-photos');
      if (!exists) {
        await supabase.storage.createBucket('employee-photos', {
          public: true,
          fileSizeLimit: 1048576, // 1MB
          allowedMimeTypes: ['image/*']
        });
      }
    } catch (e) {
      console.warn('Storage bucket verification failed, trying upload anyway:', e);
    }

    // 2. Resize and compress to Blob
    const compressedBlob = await resizeImageToBlob(file);

    // 3. Generate a clean random filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // 4. Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('employee-photos')
      .upload(filePath, compressedBlob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 5. Retrieve public URL
    const { data } = supabase.storage
      .from('employee-photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (err) {
    console.warn('Supabase photo upload failed, falling back to local object URL:', err);
    try {
      return URL.createObjectURL(file);
    } catch {
      return DEFAULT_AVATAR;
    }
  }
};


// ─── Add / Edit Employee Modal ─────────────────────────────────────────
const EmployeeModal: React.FC<{
  employee?: Employee;
  employees: Employee[];
  onClose: () => void;
  onSave: () => void;
}> = ({ employee, employees, onClose, onSave }) => {
  const isEdit = !!employee;

  // Derive unique departments and BUs dynamically from employees
  const allDepts = useMemo(() =>
    [...new Set(employees.map(e => e.department).filter(Boolean))].sort(), [employees]);
  const [customBUs, setCustomBUs] = useState<string[]>(() => {
    const saved = localStorage.getItem('axxel_custom_units');
    return saved ? JSON.parse(saved) : [];
  });
  const [showBUEditor, setShowBUEditor] = useState(false);
  const [newBU, setNewBU] = useState('');

  const allBUs = useMemo(() => {
    const fromEmps = employees.map(e => e.business_unit).filter(Boolean);
    return [...new Set([...fromEmps, ...customBUs])].sort();
  }, [employees, customBUs]);

  const addCustomBU = () => {
    if (newBU.trim() && !allBUs.includes(newBU.trim())) {
      const next = [...customBUs, newBU.trim()];
      setCustomBUs(next);
      localStorage.setItem('axxel_custom_units', JSON.stringify(next));
      upd('business_unit', newBU.trim());
      setNewBU('');
      setShowBUEditor(false);
    }
  };

  const removeCustomBU = (buToRemove: string) => {
    const next = customBUs.filter(bu => bu !== buToRemove);
    setCustomBUs(next);
    localStorage.setItem('axxel_custom_units', JSON.stringify(next));
    if (form.business_unit === buToRemove) {
      upd('business_unit', '');
    }
  };

  // Merge predefined designations with existing ones from employees
  const allDesignations = useMemo(() => {
    const fromEmp = employees.map(e => e.designation).filter(Boolean);
    return [...new Set([...Object.keys(DESIGNATION_MAP), ...fromEmp])];
  }, [employees]);

  const [form, setForm] = useState({
    emp_id:            employee?.emp_id || '',
    full_name:         employee?.full_name || '',
    email_official:    employee?.email_official || '',
    department:        employee?.department || '',
    designation:       employee?.designation || '',
    business_unit:     employee?.business_unit || '',
    company_name:      employee?.company_name || 'Axxel Corp',
    role_tier:         String(employee?.role_tier || '5'),
    dashboard_access:  employee?.dashboard_access || 'Employee',
    ctc_annual:        String(employee?.ctc_annual || ''),
    budget_allocated:  String(employee?.budget_allocated || ''),
    ctc_currency:      employee?.ctc_currency || 'INR',
    employment_status: employee?.employment_status || 'Active',
    reporting_to_id:   employee?.reporting_to_id || '',
    replaced_employee_id: employee?.replaced_employee_id || '',
    photo_url:         employee?.photo_url || '',
    past_organization: employee?.past_organization || '',
    total_experience:  employee?.total_experience || '',
    education_qualification: employee?.education_qualification || '',
    join_date:         employee?.join_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    notice_start_date: employee?.notice_start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
  });
  const [autoFilled, setAutoFilled] = useState({ tier: false, access: false });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');

  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleDesignation = (d: string) => {
    const m = DESIGNATION_MAP[d];
    if (m) {
      setForm(f => ({ ...f, designation: d, role_tier: String(m.tier), dashboard_access: m.access }));
      setAutoFilled({ tier: true, access: true });
    } else {
      upd('designation', d);
      setAutoFilled({ tier: false, access: false });
    }
  };

  // Reporting managers: allow managers across all departments
  const reportingMgrs = useMemo(() => {
    // Only allow managers (tier < 5)
    const base = employees.filter(e => e.id !== employee?.id && e.role_tier < 5);
    const sameDept = base.filter(e => form.department && e.department === form.department).sort((a, b) => a.role_tier - b.role_tier);
    const otherDept = base.filter(e => !form.department || e.department !== form.department).sort((a, b) => a.role_tier - b.role_tier);
    return { sameDept, otherDept };
  }, [employees, form.department, employee?.id]);

  const handleSave = async () => {
    if (!form.full_name.trim() || !form.email_official.trim() || !form.designation) {
      setError('Name, email, and designation are required.');
      return;
    }
    setSaving(true);
    setError('');
    const parsed = {
      ...form,
      role_tier:        parseInt(form.role_tier) || 5,
      ctc_annual:       parseFloat(form.ctc_annual) || 0,
      budget_allocated: parseFloat(form.budget_allocated) || (parseFloat(form.ctc_annual) || 0) * 1.2,
      reporting_to_id:  form.reporting_to_id || null,
      replaced_employee_id: form.replaced_employee_id || null,
      photo_url:        form.photo_url.trim(),
    };
    
    // Manage notice start date
    if (parsed.employment_status === 'Under Notice Period') {
      (parsed as any).notice_start_date = form.notice_start_date ? new Date(form.notice_start_date).toISOString() : new Date().toISOString();
    } else {
      (parsed as any).notice_start_date = null;
    }
    
    (parsed as any).join_date = form.join_date ? new Date(form.join_date).toISOString() : new Date().toISOString();

    try {
      if (isEdit && employee) await updateEmployee(employee.id, parsed);
      else await createEmployee(parsed);
      onSave();
    } catch (e: any) {
      setError(e.message || 'Failed to save employee.');
    } finally {
      setSaving(false);
    }
  };

  const fc = 'w-full bg-slate-50/60 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-900/10 transition-all font-medium';
  const lc = 'block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 fade-in">
      <div className="bg-white border border-slate-200/80 rounded-2xl w-full max-w-2xl shadow-2xl slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              {isEdit ? 'Edit Employee Record' : 'Add New Employee'}
              {isEdit && employee ? (
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">
                  {employee.emp_id}
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-md border border-indigo-100">
                  New Record
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Designation auto-fills tier & access level</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Form with inner scrolling to prevent being cut off on smaller screens */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto no-scrollbar">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-2.5 text-sm mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">

            {/* Profile Photo Section */}
            <div className="col-span-2 flex flex-col pb-3 border-b border-slate-100 mb-2">
              <label className={lc}>Profile Photo</label>
              <div className="flex items-center gap-4 mt-1.5">
                <div className="relative group w-16 h-16 rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm bg-slate-50 flex items-center justify-center shrink-0">
                  {uploadingPhoto ? (
                    <div className="flex items-center justify-center w-full h-full bg-slate-100">
                      <svg className="animate-spin w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    </div>
                  ) : form.photo_url ? (
                    <img 
                      src={form.photo_url} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl text-slate-400">👤</span>
                  )}
                  {/* Upload overlay */}
                  {!uploadingPhoto && (
                    <label className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[9px] font-bold uppercase tracking-wider">
                      Upload
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadingPhoto(true);
                            setError('');
                            try {
                              const url = await uploadPhotoToSupabase(file);
                              upd('photo_url', url);
                            } catch (err: any) {
                              console.error('Failed to upload image', err);
                              setError(err.message || 'Image upload failed');
                            } finally {
                              setUploadingPhoto(false);
                            }
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer border border-slate-200/60">
                      <Upload className="w-3.5 h-3.5 text-slate-500" /> 
                      {uploadingPhoto ? 'Uploading...' : 'Choose Photo File'}
                      <input 
                        type="file" 
                        disabled={uploadingPhoto}
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadingPhoto(true);
                            setError('');
                            try {
                              const url = await uploadPhotoToSupabase(file);
                              upd('photo_url', url);
                            } catch (err: any) {
                              console.error('Failed to upload image', err);
                              setError(err.message || 'Image upload failed');
                            } finally {
                              setUploadingPhoto(false);
                            }
                          }
                        }}
                      />
                    </label>
                    {form.photo_url && !uploadingPhoto && (
                      <button
                        type="button"
                        onClick={() => upd('photo_url', '')}
                        className="text-xs text-rose-500 hover:text-rose-600 font-bold transition-colors"
                      >
                        Reset Photo
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={form.photo_url}
                    onChange={e => upd('photo_url', e.target.value)}
                    placeholder="Or paste direct image URL (https://...)"
                    className={`${fc} text-xs py-1.5`}
                  />
                </div>
              </div>
            </div>

            {/* Row 1: Employee ID + Name + Email */}
            <div>
              <label className={lc}>Employee ID *</label>
              <input value={form.emp_id} onChange={e => upd('emp_id', e.target.value)}
                placeholder="APS001" className={fc} />
            </div>
            <div>
              <label className={lc}>Full Name *</label>
              <input value={form.full_name} onChange={e => upd('full_name', e.target.value)}
                placeholder="Jane Doe" className={fc} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className={lc}>Official Email *</label>
              <input value={form.email_official} onChange={e => upd('email_official', e.target.value)}
                placeholder="jane@axxel.com" className={fc} />
            </div>

            {/* Row 2: Department (dropdown) + Designation (dropdown → auto-fills) */}
            <div>
              <label className={lc}>Department</label>
              <select value={form.department} onChange={e => upd('department', e.target.value)} className={fc}>
                <option value="">— Select Department —</option>
                {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={lc}>Designation *</label>
              <select value={form.designation} onChange={e => handleDesignation(e.target.value)} className={fc}>
                <option value="">— Select Designation —</option>
                {[1, 2, 3, 4, 5].map(tier => (
                  <optgroup key={tier} label={`Tier ${tier} · ${['C-Suite', 'VP / CXO', 'Head of Dept', 'Manager', 'Individual'][tier - 1]}`}>
                    {[...new Set([
                      ...DESIG_BY_TIER[tier],
                      ...allDesignations.filter(d => {
                        const m = DESIGNATION_MAP[d];
                        return m ? m.tier === tier : false;
                      })
                    ])].map(d => <option key={d} value={d}>{d}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Row 3: Role Tier (auto-filled) + Dashboard Access (auto-filled) */}
            <div>
              <label className={lc}>
                Role Tier
                {autoFilled.tier && (
                  <span className="ml-2 text-emerald-600 normal-case font-bold text-[9px] tracking-normal">✓ Auto-set</span>
                )}
              </label>
              <select
                value={form.role_tier}
                onChange={e => { upd('role_tier', e.target.value); setAutoFilled(p => ({ ...p, tier: false })); }}
                className={`${fc} ${autoFilled.tier ? 'border-emerald-300 bg-emerald-50/60 focus:border-emerald-500' : ''}`}
              >
                {Object.entries(TIER_OPTS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={lc}>
                Dashboard Access
                {autoFilled.access && (
                  <span className="ml-2 text-emerald-600 normal-case font-bold text-[9px] tracking-normal">✓ Auto-set</span>
                )}
              </label>
              <select
                value={form.dashboard_access}
                onChange={e => { upd('dashboard_access', e.target.value); setAutoFilled(p => ({ ...p, access: false })); }}
                className={`${fc} ${autoFilled.access ? 'border-emerald-300 bg-emerald-50/60 focus:border-emerald-500' : ''}`}
              >
                {['Admin', 'Management', 'HOD', 'Manager', 'Employee'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>

            {/* Row 4: Business Unit + Company */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Business Unit</label>
                <button type="button" onClick={() => setShowBUEditor(!showBUEditor)} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600">
                  Manage Units
                </button>
              </div>
              {showBUEditor ? (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-3">
                  <div className="flex gap-2">
                    <input 
                      value={newBU} 
                      onChange={e => setNewBU(e.target.value)} 
                      placeholder="New Unit Name" 
                      className={`${fc} flex-1 bg-white`} 
                      autoFocus 
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomBU(); } }}
                    />
                    <button onClick={addCustomBU} type="button" className="bg-indigo-600 text-white px-3 rounded-lg text-xs font-bold hover:bg-indigo-700">Add</button>
                    <button onClick={() => setShowBUEditor(false)} type="button" className="text-slate-400 hover:text-slate-600 px-2"><X className="w-4 h-4"/></button>
                  </div>
                  {customBUs.length > 0 && (
                    <div className="space-y-1.5 max-h-28 overflow-y-auto pt-2 border-t border-slate-200/60">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Custom Units</p>
                      {customBUs.map(bu => (
                        <div key={bu} className="flex justify-between items-center bg-white border border-slate-100 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700">
                          <span>{bu}</span>
                          <button 
                            type="button" 
                            onClick={() => removeCustomBU(bu)} 
                            className="text-rose-500 hover:text-rose-600 p-1 transition-colors"
                            title={`Remove ${bu}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <select value={form.business_unit} onChange={e => upd('business_unit', e.target.value)} className={fc}>
                  <option value="">— Select Unit —</option>
                  {allBUs.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className={lc}>Company</label>
              <input value={form.company_name} onChange={e => upd('company_name', e.target.value)}
                placeholder="Axxel Corp" className={fc} />
            </div>

            {/* Row 5: CTC + Budget */}
            <div>
              <label className={lc}>Annual CTC (₹)</label>
              <input type="number" value={form.ctc_annual} onChange={e => upd('ctc_annual', e.target.value)}
                placeholder="1500000" className={fc} />
            </div>
            <div>
              <label className={lc}>Budget Allocated (₹)</label>
              <input type="number" value={form.budget_allocated} onChange={e => upd('budget_allocated', e.target.value)}
                placeholder="Auto (CTC × 1.2)" className={fc} />
            </div>

            {/* Row 6: Currency + Status */}
            <div>
              <label className={lc}>Currency</label>
              <select value={form.ctc_currency} onChange={e => upd('ctc_currency', e.target.value)} className={fc}>
                {['INR', 'USD', 'EUR', 'GBP'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={lc}>Employment Status</label>
              <select value={form.employment_status} onChange={e => upd('employment_status', e.target.value)} className={fc}>
                <option>Active</option>
                <option>Under Notice Period</option>
                <option>Inactive</option>
              </select>
            </div>

            {/* Row 6.25: Employment History */}
            <div>
              <label className={lc}>Past Organization</label>
              <input value={form.past_organization} onChange={e => upd('past_organization', e.target.value)} placeholder="Previous Company" className={fc} />
            </div>
            <div>
              <label className={lc}>Total Experience (Years)</label>
              <input value={form.total_experience} onChange={e => upd('total_experience', e.target.value)} placeholder="e.g. 5" className={fc} />
            </div>
            <div className="col-span-2">
              <label className={lc}>Education Qualification</label>
              <input value={form.education_qualification} onChange={e => upd('education_qualification', e.target.value)} placeholder="e.g. B.Tech in Computer Science" className={fc} />
            </div>

            {/* Row 6.5: Dates */}
            <div>
              <label className={lc}>Date of Joining (DOJ)</label>
              <input type="date" value={form.join_date} onChange={e => upd('join_date', e.target.value)} className={fc} />
            </div>
            <div>
              {form.employment_status === 'Under Notice Period' && (
                <>
                  <label className={lc}>Notice Start Date</label>
                  <input type="date" value={form.notice_start_date} onChange={e => upd('notice_start_date', e.target.value)} className={fc} />
                </>
              )}
            </div>
          </div>

          {/* Row 7: Reporting Manager — department-wise grouped */}
          <div className="mt-3">
            <label className={lc}>Reporting Manager</label>
            <select value={form.reporting_to_id} onChange={e => upd('reporting_to_id', e.target.value)} className={fc}>
              <option value="">— None (Top Level) —</option>
              {reportingMgrs.sameDept.length > 0 && (
                <optgroup label={`${form.department || 'Same'} Department`}>
                  {reportingMgrs.sameDept.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name} · {e.designation} (T{e.role_tier})</option>
                  ))}
                </optgroup>
              )}
              {reportingMgrs.otherDept.length > 0 && (
                <optgroup label="Other Departments">
                  {reportingMgrs.otherDept.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name} · {e.designation} (T{e.role_tier})</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Row 8: Replacement Link (Only show inactive or notice period employees) */}
          {!isEdit && (
            <div className="mt-3">
              <label className={lc}>
                Replacing Employee
                <span className="ml-2 text-slate-400 normal-case font-medium text-[10px]">
                  · optional (select an inactive or relived employee)
                </span>
              </label>
              <select value={form.replaced_employee_id} onChange={e => upd('replaced_employee_id', e.target.value)} className={fc}>
                <option value="">— None —</option>
                {employees.filter(e => e.employment_status !== 'Active').map(e => (
                  <option key={e.id} value={e.id}>{e.full_name} · {e.designation} (Status: {e.employment_status})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-900 font-semibold transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Employee'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Bulk Import Modal ──────────────────────────────────────────────────
const BulkImportModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => { setPreview(parseCSV(ev.target?.result as string)); setStatus('idle'); };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!preview.length) return;
    setStatus('loading');
    try {
      const result = await bulkImportEmployees(preview);
      setStatus('success'); setMessage(result.message);
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch (e: any) {
      setStatus('error'); setMessage(e.message || 'Bulk import failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl slide-up">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Bulk Import Employees</h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Upload a CSV file to import multiple employee profiles</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <div className="text-sm font-bold text-slate-800">Step 1 · Download Template</div>
              <div className="text-xs text-slate-400 font-semibold mt-0.5">Get the formatted CSV layout with CTC & Budget headers</div>
            </div>
            <button onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-lg text-sm font-bold transition-all shadow-sm">
              <Download className="w-4 h-4" /> Download Template
            </button>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800 mb-2">Step 2 · Upload CSV File</div>
            <div className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50"
              onClick={() => fileRef.current?.click()}>
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2.5" />
              {fileName
                ? <p className="text-sm text-slate-900 font-bold">{fileName}</p>
                : <p className="text-sm text-slate-500 font-semibold">Click to browse or drop CSV here</p>}
              <p className="text-xs text-slate-400 font-medium mt-1">Supports standard CSV sheets only</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>
          {preview.length > 0 && (
            <div>
              <div className="text-sm font-bold text-slate-800 mb-2">Preview · {preview.length} rows detected</div>
              <div className="overflow-auto rounded-xl border border-slate-200 max-h-48 shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                    <tr>{Object.keys(preview[0]).map(h => <th key={h} className="px-3 py-2 font-bold whitespace-nowrap">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {preview.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        {Object.values(row).map((v, j) => <td key={j} className="px-3 py-2 text-slate-600 font-medium whitespace-nowrap max-w-[120px] truncate">{v}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 5 && <div className="text-xs text-slate-400 font-semibold text-center py-2 bg-slate-50 border-t border-slate-100">… and {preview.length - 5} more rows</div>}
              </div>
            </div>
          )}
          {status === 'success' && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 rounded-xl px-4 py-3 text-sm font-semibold fade-in">
              <CheckCircle className="w-4 h-4 shrink-0" />{message}
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />{message}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-900 font-semibold transition-colors">Cancel</button>
          <button onClick={handleImport} disabled={!preview.length || status === 'loading' || status === 'success'}
            className="flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <Upload className="w-4 h-4" />
            {status === 'loading' ? 'Importing…' : `Import ${preview.length > 0 ? preview.length : ''} Employees`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Employee Manager ──────────────────────────────────────────────
export const EmployeeManager: React.FC<EmployeeManagerProps> = ({ employees, activeRole, currentUser, onRefresh }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [buFilter, setBuFilter] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void, isDestructive?: boolean, confirmText?: string}>({isOpen: false, title: '', message: '', onConfirm: () => {}});
  const [alertDialog, setAlertDialog] = useState<{isOpen: boolean, title: string, message: string}>({isOpen: false, title: '', message: ''});

  const canEdit    = activeRole === 'Admin';
  const canViewCTC = activeRole === 'Admin' || activeRole === 'Management' || activeRole === 'HOD';

  const departments  = [...new Set(employees.map(e => e.department).filter(Boolean))].sort();
  const businessUnits = [...new Set(employees.map(e => e.business_unit).filter(Boolean))].sort();

  const filtered = employees.filter(emp => {
    const q = search.toLowerCase();
    const matchSearch = !q || emp.full_name.toLowerCase().includes(q) || emp.email_official.toLowerCase().includes(q) || emp.designation.toLowerCase().includes(q);
    const matchDept = !deptFilter || emp.department === deptFilter;
    const matchBU   = !buFilter   || emp.business_unit === buFilter;
    return matchSearch && matchDept && matchBU;
  });

  const handleDelete = async (emp: Employee) => {
    const isInactive = emp.employment_status === 'Inactive';
    setConfirmDialog({
      isOpen: true,
      title: isInactive ? 'Delete Employee' : 'Relieve Employee',
      message: isInactive ? 'Are you sure you want to permanently delete this employee? This cannot be undone.' : 'Are you sure you want to relieve this employee? They will be marked as Inactive and shown as Vacant in the organization chart.',
      isDestructive: true,
      confirmText: isInactive ? 'Delete' : 'Relieve',
      onConfirm: async () => {
        setConfirmDialog(p => ({ ...p, isOpen: false }));
        setDeleting(emp.id);
        try { 
          if (isInactive) {
            await deleteEmployee(emp.id);
          } else {
            await updateEmployee(emp.id, { employment_status: 'Inactive', notice_start_date: null }); 
          }
          onRefresh(); 
        }
        catch { setAlertDialog({ isOpen: true, title: 'Error', message: 'Delete operation failed.' }); }
        finally { setDeleting(null); }
      }
    });
  };

  const handleBulkRelieve = async () => {
    if (!selectedIds.size) return;
    const targetIds = Array.from(selectedIds).filter(id => id !== currentUser?.employee_id);
    if (targetIds.length === 0) {
      setAlertDialog({ isOpen: true, title: 'Operation Prevented', message: 'You cannot relieve the currently logged-in user account.' });
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Relieve Selected',
      message: `Are you sure you want to relieve ${targetIds.length} selected employees? They will be marked as Inactive.`,
      isDestructive: true,
      confirmText: 'Relieve All',
      onConfirm: async () => {
        setConfirmDialog(p => ({ ...p, isOpen: false }));
        setDeleting('bulk-relieve');
        try { 
          await Promise.all(targetIds.map(id => updateEmployee(id, { employment_status: 'Inactive', notice_start_date: null })));
          setSelectedIds(new Set());
          onRefresh(); 
        }
        catch { setAlertDialog({ isOpen: true, title: 'Error', message: 'Bulk relieve operation failed.' }); }
        finally { setDeleting(null); }
      }
    });
  };

  const handleBulkDeletePermanent = async () => {
    if (!selectedIds.size) return;
    const targetIds = Array.from(selectedIds).filter(id => id !== currentUser?.employee_id);
    if (targetIds.length === 0) {
      setAlertDialog({ isOpen: true, title: 'Operation Prevented', message: 'You cannot permanently delete the currently logged-in user account.' });
      return;
    }
    const hasSkippedUser = selectedIds.has(currentUser?.employee_id || '');
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Selected',
      message: `Are you sure you want to permanently delete ${targetIds.length} selected employees? This action cannot be undone.${hasSkippedUser ? ' (The logged-in administrator account will be skipped to prevent lockout).' : ''}`,
      isDestructive: true,
      confirmText: 'Delete Permanently',
      onConfirm: async () => {
        setConfirmDialog(p => ({ ...p, isOpen: false }));
        setDeleting('bulk-delete');
        try { 
          await bulkDeleteEmployees(targetIds);
          setSelectedIds(new Set());
          onRefresh(); 
        }
        catch { setAlertDialog({ isOpen: true, title: 'Error', message: 'Bulk delete operation failed.' }); }
        finally { setDeleting(null); }
      }
    });
  };

  const handleDeleteAll = async () => {
    const targetIds = employees
      .filter(emp => emp.id !== currentUser?.employee_id)
      .map(emp => emp.id);

    if (targetIds.length === 0) {
      setAlertDialog({ isOpen: true, title: 'Operation Prevented', message: 'There are no other employee records to delete.' });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Delete All Employee Data',
      message: `Are you sure you want to permanently delete all ${targetIds.length} employee records? This action cannot be undone and will wipe all database statistics. (The logged-in administrator account will be preserved to prevent lockout).`,
      isDestructive: true,
      confirmText: 'Delete All Data',
      onConfirm: async () => {
        setConfirmDialog(p => ({ ...p, isOpen: false }));
        setDeleting('delete-all');
        try { 
          await bulkDeleteEmployees(targetIds);
          setSelectedIds(new Set());
          onRefresh(); 
        }
        catch { setAlertDialog({ isOpen: true, title: 'Error', message: 'Delete all data operation failed.' }); }
        finally { setDeleting(null); }
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(e => e.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <>
      <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(p => ({ ...p, isOpen: false }))} />
      <AlertDialog {...alertDialog} onClose={() => setAlertDialog(p => ({ ...p, isOpen: false }))} />
      {(showAdd || editingEmployee) && (
        <EmployeeModal
          employee={editingEmployee}
          employees={employees}
          onClose={() => { setShowAdd(false); setEditingEmployee(undefined); }}
          onSave={() => { setShowAdd(false); setEditingEmployee(undefined); onRefresh(); }}
        />
      )}
      {showBulk && <BulkImportModal onClose={() => setShowBulk(false)} onSuccess={onRefresh} />}

      <div className="card-elevated overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Employee Master</h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">{filtered.length} of {employees.length} employees listed</p>
          </div>
          <div className="flex-1" />
          {canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedIds.size > 0 && (
                <>
                  <button onClick={handleBulkRelieve} disabled={deleting !== null}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl text-xs font-bold transition-all shadow-sm">
                    <Trash2 className="w-3.5 h-3.5" /> Relieve Selected ({selectedIds.size})
                  </button>
                  <button onClick={handleBulkDeletePermanent} disabled={deleting !== null}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-all shadow-sm">
                    <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedIds.size})
                  </button>
                </>
              )}
              <button onClick={handleDeleteAll} disabled={deleting !== null || employees.length <= 1}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 rounded-xl text-xs font-bold transition-all shadow-sm">
                <Trash2 className="w-3.5 h-3.5" /> Delete All Data
              </button>
              <button onClick={() => setShowBulk(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-sm">
                <Upload className="w-3.5 h-3.5 text-slate-500" /> Bulk Import
              </button>
              <button onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-sm">
                <Download className="w-3.5 h-3.5 text-slate-500" /> Download Template
              </button>
              <button onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md">
                <Plus className="w-3.5 h-3.5" /> Add Employee
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap gap-3 bg-slate-50/50">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, designation…"
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 transition-colors font-medium" />
          </div>
          <div className="relative">
            <select value={buFilter} onChange={e => setBuFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg pl-3 pr-8 py-2.5 focus:outline-none focus:border-slate-800 cursor-pointer min-w-[160px] shadow-sm">
              <option value="">All Business Units</option>
              {businessUnits.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg pl-3 pr-8 py-2.5 focus:outline-none focus:border-slate-800 cursor-pointer min-w-[180px] shadow-sm">
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                {canEdit && (
                  <th className="px-4 py-3.5 w-10 text-center">
                    <input type="checkbox" 
                      checked={filtered.length > 0 && selectedIds.size === filtered.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                )}
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Business Unit</th>
                <th className="px-5 py-3.5">Department / Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Tier</th>
                {canViewCTC && <th className="px-5 py-3.5">Budget</th>}
                {canViewCTC && <th className="px-5 py-3.5">Actual CTC</th>}
                {canEdit && <th className="px-5 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={canViewCTC ? (canEdit ? 9 : 8) : (canEdit ? 7 : 6)} className="px-5 py-12 text-center text-slate-400 text-sm italic font-medium">
                    No employee records match your selected filter criteria.
                  </td>
                </tr>
              )}
              {filtered.map(emp => (
                <tr key={emp.id} className={`hover:bg-slate-50/30 transition-colors group ${selectedIds.has(emp.id) ? 'bg-indigo-50/30' : ''}`}>
                  {canEdit && (
                    <td className="px-4 py-3.5 text-center">
                      <input type="checkbox"
                        checked={selectedIds.has(emp.id)}
                        onChange={() => toggleSelect(emp.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <img src={emp.photo_url || DEFAULT_AVATAR} alt="" className="w-9 h-9 rounded-xl border border-slate-200 object-cover shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 text-sm truncate flex items-center gap-2">
                          {emp.full_name}
                          <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200" title="Employee ID">
                            {emp.emp_id || 'N/A'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{emp.email_official}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-xs">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{emp.business_unit}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-700 text-xs truncate max-w-[180px]">{emp.department}</div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 font-medium">
                      <Tag className="w-3 h-3 text-slate-300 shrink-0" />{emp.designation}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {canEdit ? (
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
                          className={`appearance-none inline-flex items-center gap-1.5 px-3.5 pr-8 py-1 rounded-full text-xs font-bold border cursor-pointer outline-none transition-all ${
                            emp.employment_status === 'Active'
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100/70'
                              : emp.employment_status === 'Under Notice Period'
                                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100/70'
                                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200/70'
                          }`}
                          style={{
                            backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23${
                              emp.employment_status === 'Active' ? '15803d' : emp.employment_status === 'Under Notice Period' ? 'b45309' : '475569'
                            }' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
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
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        emp.employment_status === 'Active'
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : emp.employment_status === 'Under Notice Period'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.employment_status === 'Active' ? 'bg-green-500' : emp.employment_status === 'Under Notice Period' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                        {emp.employment_status}
                      </span>
                    )}
                    {emp.employment_status === 'Under Notice Period' && emp.notice_start_date && (
                      <div className="text-[9px] font-bold text-amber-600 mt-1 pl-1">
                        {90 - Math.floor((new Date().getTime() - new Date(emp.notice_start_date).getTime()) / (1000 * 3600 * 24))} days left
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded border border-slate-200/50">T{emp.role_tier}</span>
                  </td>
                  {canViewCTC && (
                    <>
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-500">
                        ₹{(emp.budget_allocated || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-900">
                        ₹{emp.ctc_annual.toLocaleString('en-IN')}
                      </td>
                    </>
                  )}
                  {canEdit && (
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingEmployee(emp)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(emp)} disabled={deleting === emp.id}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

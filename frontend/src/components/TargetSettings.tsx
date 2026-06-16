import React, { useState, useEffect, useCallback } from 'react';
import { HRTargets, DeptTarget, DesignationTarget, fetchTargets, saveTargets, fetchEmployees } from '../lib/api';
import { Save, Upload, Target, Info, ChevronDown, ChevronRight, Plus, Trash2, Download, RefreshCw } from 'lucide-react';
import { ConfirmDialog, AlertDialog } from './Dialogs';

interface TargetSettingsProps {
  onSaved: () => void;
}

export const TargetSettings: React.FC<TargetSettingsProps> = ({ onSaved }) => {
  const [targets, setTargets] = useState<HRTargets>({
    target_hiring_velocity: 0,
    target_attrition_rate: 0,
    departments: []
  });
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  const [refreshing, setRefreshing] = useState(false);
  
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void, isDestructive?: boolean}>({isOpen: false, title: '', message: '', onConfirm: () => {}});
  const [alertDialog, setAlertDialog] = useState<{isOpen: boolean, title: string, message: string}>({isOpen: false, title: '', message: ''});

  const loadData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    try {
      const [fetchedTargets, emps] = await Promise.all([
        fetchTargets(),
        fetchEmployees()
      ]);
      
      setEmployees(emps);
      setTargets(fetchedTargets);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  const handleDeptChange = (bu: string, dept: string, field: keyof DeptTarget, value: number | string) => {
    setTargets(prev => ({
      ...prev,
      departments: prev.departments.map(d => 
        (d.business_unit || '') === bu && d.department === dept ? { ...d, [field]: value } : d
      )
    }));
  };

  const handleAddDesignation = (bu: string, dept: string) => {
    setTargets(prev => ({
      ...prev,
      departments: prev.departments.map(d => {
        if ((d.business_unit || '') === bu && d.department === dept) {
          return {
            ...d,
            designations: [...(d.designations || []), { designation: '', budgeted_hc: 0, budget_allocated: 0 }]
          };
        }
        return d;
      })
    }));
    // Auto-expand
    setExpandedDepts(prev => new Set(prev).add(`${bu}:::${dept}`));
  };

  const handleDesigChange = (bu: string, dept: string, index: number, field: keyof DesignationTarget, value: string | number) => {
    setTargets(prev => ({
      ...prev,
      departments: prev.departments.map(d => {
        if ((d.business_unit || '') === bu && d.department === dept && d.designations) {
          const newDesigs = [...d.designations];
          newDesigs[index] = { ...newDesigs[index], [field]: value };
          
          return {
            ...d,
            designations: newDesigs,
            budgeted_hc: newDesigs.reduce((sum, dg) => sum + (Number(dg.budgeted_hc) || 0), 0),
            budget_allocated: newDesigs.reduce((sum, dg) => sum + (Number(dg.budget_allocated) || 0), 0)
          };
        }
        return d;
      })
    }));
  };

  const handleRemoveDesignation = (bu: string, dept: string, index: number) => {
    setTargets(prev => ({
      ...prev,
      departments: prev.departments.map(d => {
        if ((d.business_unit || '') === bu && d.department === dept && d.designations) {
          const newDesigs = d.designations.filter((_, i) => i !== index);
          return {
            ...d,
            designations: newDesigs,
            budgeted_hc: newDesigs.reduce((sum, dg) => sum + (Number(dg.budgeted_hc) || 0), 0),
            budget_allocated: newDesigs.reduce((sum, dg) => sum + (Number(dg.budget_allocated) || 0), 0)
          };
        }
        return d;
      })
    }));
  };

  const handleRemoveDepartment = (bu: string, dept: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Department',
      message: `Are you sure you want to remove the target settings for ${dept}?`,
      isDestructive: true,
      onConfirm: () => {
        setTargets(prev => ({
          ...prev,
          departments: prev.departments.filter(d => !((d.business_unit || '') === bu && d.department === dept))
        }));
        setConfirmDialog(p => ({ ...p, isOpen: false }));
      }
    });
  };

  const toggleDept = (bu: string, dept: string) => {
    setExpandedDepts(prev => {
      const next = new Set(prev);
      const key = `${bu}:::${dept}`;
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        ...targets,
        target_hiring_velocity: Number(targets.target_hiring_velocity) || 0,
        target_attrition_rate: Number(targets.target_attrition_rate) || 0,
        global_planned_headcount: (targets.global_planned_headcount === undefined || targets.global_planned_headcount === null || (targets.global_planned_headcount as any) === '') ? undefined : Number(targets.global_planned_headcount),
        global_open_positions: (targets.global_open_positions === undefined || targets.global_open_positions === null || (targets.global_open_positions as any) === '') ? undefined : Number(targets.global_open_positions),
        departments: targets.departments.map(d => ({
          ...d,
          budgeted_hc: Number(d.budgeted_hc) || 0,
          budget_allocated: Number(d.budget_allocated) || 0,
          designations: d.designations?.map(desig => ({
            ...desig,
            budgeted_hc: Number(desig.budgeted_hc) || 0,
            budget_allocated: Number(desig.budget_allocated) || 0
          })) || []
        }))
      };
      await saveTargets(payload);
      onSaved();
    } catch (e) {
      setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to save targets' });
    } finally {
      setSaving(false);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      if (lines.length < 2) return;
      
      const newDeptsMap = new Map<string, DeptTarget>();
      
      targets.departments.forEach(d => {
        newDeptsMap.set(`${d.business_unit || ''}:::${d.department}`.toLowerCase(), { ...d, designations: [] });
      });

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [bu, dept, desig, hc, cost] = line.split(',').map(s => s?.trim().replace(/^"|"$/g, ''));
        if (!dept) continue;
        
        const deptKey = `${bu || ''}:::${dept}`.toLowerCase();
        if (!newDeptsMap.has(deptKey)) {
          newDeptsMap.set(deptKey, {
            business_unit: bu,
            department: dept,
            budgeted_hc: 0,
            budget_allocated: 0,
            target_attrition: 0,
            designations: []
          });
        }
        
        const existingDept = newDeptsMap.get(deptKey)!;
        if (desig) {
          existingDept.designations!.push({
            designation: desig,
            budgeted_hc: parseInt(hc) || 0,
            budget_allocated: parseFloat(cost) || 0
          });
        } else {
           existingDept.budgeted_hc += (parseInt(hc) || 0);
           existingDept.budget_allocated += (parseFloat(cost) || 0);
        }
      }
      
      const newDeptsArray = Array.from(newDeptsMap.values()).map(d => {
        if (d.designations && d.designations.length > 0) {
          d.budgeted_hc = d.designations.reduce((sum, curr) => sum + curr.budgeted_hc, 0);
          d.budget_allocated = d.designations.reduce((sum, curr) => sum + curr.budget_allocated, 0);
        }
        return d;
      });

      setTargets({ ...targets, departments: newDeptsArray });
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const headers = ['Business Unit', 'Department', 'Designation', 'Target HC', 'Target Cost'];
    const rows: string[][] = [];
    targets.departments.forEach(d => {
      if (d.designations && d.designations.length > 0) {
        d.designations.forEach(des => {
          rows.push([d.business_unit || '', d.department, des.designation, String(des.budgeted_hc), String(des.budget_allocated)]);
        });
      } else {
        rows.push([d.business_unit || '', d.department, '', String(d.budgeted_hc || 0), String(d.budget_allocated || 0)]);
      }
    });
    
    if (rows.length === 0) {
      rows.push(['Example BU', 'Example Department', 'Software Engineer', '5', '5000000']);
    }
    
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; 
    a.download = 'hr_targets_template.csv'; 
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAllData = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete All Target Data',
      message: "Are you sure you want to permanently delete all target data? This will remove all departments and their designations from HR targets.",
      isDestructive: true,
      onConfirm: async () => {
        setConfirmDialog(p => ({ ...p, isOpen: false }));
        
        const resetTargets: HRTargets = {
          target_hiring_velocity: 0,
          target_attrition_rate: 0,
          global_planned_headcount: undefined,
          global_open_positions: undefined,
          departments: []
        };

        setSaving(true);
        try {
          await saveTargets(resetTargets);
          setTargets(resetTargets);
          onSaved();
        } catch (e) {
          setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to clear targets' });
        } finally {
          setSaving(false);
        }
      }
    });
  };

  const handleReset = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Sync Targets',
      message: "Are you sure you want to sync targets with actuals? This will set all budgeted headcounts and allocations to match the actual employee data we have.",
      onConfirm: async () => {
        setConfirmDialog(p => ({ ...p, isOpen: false }));
        
        const activeEmps = employees.filter(e => e.employment_status !== 'Inactive');
        
        const deptMap = new Map<string, {
          business_unit: string;
          department: string;
          budgeted_hc: number;
          budget_allocated: number;
          target_attrition: number;
          designations: Map<string, {
            designation: string;
            budgeted_hc: number;
            budget_allocated: number;
          }>;
        }>();
        
        targets.departments.forEach(d => {
          const key = `${d.business_unit || ''}:::${d.department}`;
          deptMap.set(key, {
            business_unit: d.business_unit || '',
            department: d.department,
            budgeted_hc: 0,
            budget_allocated: 0,
            target_attrition: d.target_attrition || 8.5,
            designations: new Map()
          });
        });
        
        activeEmps.forEach(emp => {
          const bu = emp.business_unit || '';
          const dept = emp.department || 'Unassigned';
          const key = `${bu}:::${dept}`;
          if (!deptMap.has(key)) {
            deptMap.set(key, {
              business_unit: bu,
              department: dept,
              budgeted_hc: 0,
              budget_allocated: 0,
              target_attrition: 8.5,
              designations: new Map()
            });
          }
          
          const deptData = deptMap.get(key)!;
          deptData.budgeted_hc += 1;
          deptData.budget_allocated += (Number(emp.budget_allocated) || Number(emp.ctc_annual) || 0);
          
          if (emp.designation) {
            const desigMap = deptData.designations;
            if (!desigMap.has(emp.designation)) {
              desigMap.set(emp.designation, {
                designation: emp.designation,
                budgeted_hc: 0,
                budget_allocated: 0
              });
            }
            const desigData = desigMap.get(emp.designation)!;
            desigData.budgeted_hc += 1;
            desigData.budget_allocated += (Number(emp.budget_allocated) || Number(emp.ctc_annual) || 0);
          }
        });
        
        const departmentsArray: DeptTarget[] = Array.from(deptMap.values()).map(d => ({
          business_unit: d.business_unit,
          department: d.department,
          budgeted_hc: d.budgeted_hc,
          budget_allocated: d.budget_allocated,
          target_attrition: d.target_attrition,
          designations: Array.from(d.designations.values())
        }));
        
        const resetTargets: HRTargets = {
          target_hiring_velocity: 0,
          target_attrition_rate: 0,
          global_planned_headcount: undefined,
          global_open_positions: undefined,
          departments: departmentsArray
        };
        
        setSaving(true);
        try {
          await saveTargets(resetTargets);
          setTargets(resetTargets);
          onSaved();
        } catch (e) {
          setAlertDialog({ isOpen: true, title: 'Error', message: 'Failed to reset targets' });
        } finally {
          setSaving(false);
        }
      }
    });
  };

  if (loading) return <div className="p-10 text-center animate-pulse font-bold text-slate-500">Loading Configuration...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 slide-up">
      <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(p => ({ ...p, isOpen: false }))} />
      <AlertDialog {...alertDialog} onClose={() => setAlertDialog(p => ({ ...p, isOpen: false }))} />
      <div className="glass-panel p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-600" /> HR Target Settings
            </h2>
            <p className="text-sm font-semibold text-slate-500 mt-1">Configure budgets and headcount targets to drive Dashboard Analytics.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => loadData(false)} disabled={refreshing} className="btn-secondary flex items-center gap-2 bg-white text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200" title="Re-fetch targets from server">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />{refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button onClick={handleReset} className="btn-secondary flex items-center gap-2 bg-white text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200">
              <RefreshCw className="w-4 h-4" /> Sync Actuals
            </button>
            <button onClick={handleDeleteAllData} className="btn-secondary flex items-center gap-2 bg-white text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200">
              <Trash2 className="w-4 h-4" /> Delete All Data
            </button>
            <button onClick={downloadTemplate} className="btn-secondary flex items-center gap-2 bg-white">
              <Download className="w-4 h-4" /> Template
            </button>
            <label className="btn-secondary flex items-center gap-2 cursor-pointer bg-white">
              <Upload className="w-4 h-4" /> CSV Upload
              <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
            </label>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Targets'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Hiring Velocity (per month)</label>
            <input 
              type="number" 
              className="form-input w-full" 
              onWheel={e => (e.target as HTMLElement).blur()}
              value={targets.target_hiring_velocity as any} 
              onChange={e => setTargets({...targets, target_hiring_velocity: (e.target.value === '' ? '' : parseFloat(e.target.value)) as any})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Attrition Rate (%)</label>
            <input 
              type="number" step="0.1"
              className="form-input w-full" 
              onWheel={e => (e.target as HTMLElement).blur()}
              value={targets.target_attrition_rate as any} 
              onChange={e => setTargets({...targets, target_attrition_rate: (e.target.value === '' ? '' : parseFloat(e.target.value)) as any})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" title="Leave empty to calculate from departments">Planned Headcount (Override)</label>
            <input 
              type="number"
              placeholder="Auto-calculated"
              className="form-input w-full" 
              onWheel={e => (e.target as HTMLElement).blur()}
              value={(targets.global_planned_headcount ?? '') as any} 
              onChange={e => setTargets({...targets, global_planned_headcount: e.target.value === '' ? undefined : parseInt(e.target.value)} as any)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" title="Leave empty to auto-calculate">Open Positions (Override)</label>
            <input 
              type="number"
              placeholder="Auto-calculated"
              className="form-input w-full" 
              onWheel={e => (e.target as HTMLElement).blur()}
              value={(targets.global_open_positions ?? '') as any} 
              onChange={e => setTargets({...targets, global_open_positions: e.target.value === '' ? undefined : parseInt(e.target.value)} as any)}
            />
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Dashboard KPIs</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Budgeted Headcount</p>
            <p className="text-2xl font-black text-indigo-600">
              {targets.global_planned_headcount ?? targets.departments.reduce((sum, d) => sum + (d.budgeted_hc || 0), 0)}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Budgeted CTC</p>
            <p className="text-xl font-black text-emerald-600">
              ₹{(targets.departments.reduce((sum, d) => sum + (d.budget_allocated || 0), 0)).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Department-wise Budget</p>
            <p className="text-xl font-black text-slate-700">
              {targets.departments.filter(d => (d.budget_allocated || 0) > 0).length} <span className="text-sm font-semibold text-slate-400">Depts</span>
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Designation-wise Budget</p>
            <p className="text-xl font-black text-slate-700">
              {targets.departments.reduce((sum, d) => sum + (d.designations?.filter(ds => (ds.budget_allocated || 0) > 0).length || 0), 0)} <span className="text-sm font-semibold text-slate-400">Roles</span>
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Unit-wise Budget</p>
            <p className="text-xl font-black text-slate-700">
              {new Set(employees.map(e => e.business_unit).filter(Boolean)).size} <span className="text-sm font-semibold text-slate-400">Units</span>
            </p>
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Covered Modules & Analytics</h3>
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            'Manpower Budget Planning',
            'Budget vs Actual Analysis',
            'Recruitment Planning',
            'Position Management',
            'Replacement Tracking',
            'Organization Structure',
            'Workforce Analytics',
            'CTC Utilization'
          ].map(mod => (
            <span key={mod} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
              {mod}
            </span>
          ))}
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">Departmental Budgets & Headcount</h3>
        
        <div className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-[10px] uppercase text-slate-500 font-extrabold tracking-wider">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3 text-center">Budgeted HC</th>
                <th className="px-4 py-3 text-center bg-slate-200/50">Actual HC</th>
                <th className="px-4 py-3 text-center">Budget (₹)</th>
                <th className="px-4 py-3 text-center bg-slate-200/50">Actual Cost (₹)</th>
                <th className="px-4 py-3 text-center text-amber-600">Vacant</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {targets.departments.map((dept, i) => {
                const bu = dept.business_unit || '';
                const key = `${bu}:::${dept.department}`;
                const isExpanded = expandedDepts.has(key);
                
                const deptEmps = employees.filter(e => e.department === dept.department && (e.business_unit || '') === bu && e.employment_status !== 'Inactive');
                const actualHc = deptEmps.length;
                const actualCost = deptEmps.reduce((sum, e) => sum + (Number(e.ctc_annual) || 0), 0);
                const vacant = Math.max(0, (dept.budgeted_hc || 0) - actualHc);

                return (
                  <React.Fragment key={key + i}>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleDept(bu, dept.department)} className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{dept.department}</div>
                        {bu && <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">{bu}</div>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input 
                          type="number" 
                          className={`form-input w-24 mx-auto text-center font-bold ${dept.designations && dept.designations.length > 0 ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`} 
                          value={dept.budgeted_hc || 0}
                          readOnly={dept.designations && dept.designations.length > 0}
                          title={dept.designations && dept.designations.length > 0 ? 'Auto-calculated from designations' : ''}
                          onChange={(e) => handleDeptChange(bu, dept.department, 'budgeted_hc', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-indigo-600 bg-indigo-50/30">
                        {actualHc}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input 
                          type="number" 
                          className={`form-input w-32 mx-auto text-center font-bold ${dept.designations && dept.designations.length > 0 ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                          value={dept.budget_allocated || 0}
                          readOnly={dept.designations && dept.designations.length > 0}
                          title={dept.designations && dept.designations.length > 0 ? 'Auto-calculated from designations' : ''}
                          onChange={(e) => handleDeptChange(bu, dept.department, 'budget_allocated', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-indigo-600 bg-indigo-50/30">
                        {actualCost.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-amber-600">
                        {vacant}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => handleAddDesignation(bu, dept.department)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 hover:text-blue-700 rounded-md transition"
                            title="Add Designation Budget"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleRemoveDepartment(bu, dept.department)}
                            className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-md transition"
                            title="Remove Target"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="p-0 bg-slate-50 border-t-0">
                          <div className="pl-16 pr-8 py-4 border-l-4 border-blue-400">
                            {(!dept.designations || dept.designations.length === 0) ? (
                              <div className="text-xs text-slate-400 italic">No specific designation budgets set. Click + to add.</div>
                            ) : (
                              <table className="w-full text-left text-xs bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                                <thead className="bg-slate-100 text-slate-500 font-bold uppercase">
                                  <tr>
                                    <th className="px-3 py-2">Designation</th>
                                    <th className="px-3 py-2 text-center">Target HC</th>
                                    <th className="px-3 py-2 text-center bg-slate-200/50">Actual HC</th>
                                    <th className="px-3 py-2 text-center">Target Cost (₹)</th>
                                    <th className="px-3 py-2 text-center bg-slate-200/50">Actual Cost (₹)</th>
                                    <th className="px-3 py-2 text-center text-amber-600">Vacant</th>
                                    <th className="px-3 py-2 w-10"></th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {dept.designations.map((ds, idx) => {
                                    const desigEmps = deptEmps.filter(e => e.designation === ds.designation);
                                    const desigHc = desigEmps.length;
                                    const desigCost = desigEmps.reduce((sum, e) => sum + (Number(e.ctc_annual) || 0), 0);

                                    return (
                                      <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-3 py-2">
                                          <input 
                                            className="form-input w-full text-xs px-2 py-1"
                                            placeholder="Designation..."
                                            value={ds.designation}
                                            onChange={e => handleDesigChange(bu, dept.department, idx, 'designation', e.target.value)}
                                          />
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          <input 
                                            type="number" 
                                            className="form-input w-16 mx-auto text-center text-xs px-2 py-1" 
                                            value={ds.budgeted_hc || 0}
                                            onChange={e => handleDesigChange(bu, dept.department, idx, 'budgeted_hc', parseInt(e.target.value) || 0)}
                                          />
                                        </td>
                                        <td className="px-3 py-2 text-center font-bold text-slate-700 bg-slate-50/50">
                                          {desigHc}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          <input 
                                            type="number" 
                                            className="form-input w-24 mx-auto text-center text-xs px-2 py-1" 
                                            value={ds.budget_allocated || 0}
                                            onChange={e => handleDesigChange(bu, dept.department, idx, 'budget_allocated', parseInt(e.target.value) || 0)}
                                          />
                                        </td>
                                        <td className="px-3 py-2 text-center font-bold text-slate-700 bg-slate-50/50">
                                          {desigCost.toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-3 py-2 text-center font-bold text-amber-500">
                                          {Math.max(0, (ds.budgeted_hc || 0) - desigHc)}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          <button 
                                            onClick={() => handleRemoveDesignation(bu, dept.department, idx)}
                                            className="p-1 text-red-400 hover:text-red-600 transition"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex items-start gap-3 p-4 bg-blue-50/50 text-blue-800 rounded-xl border border-blue-100">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
          <p className="text-sm font-semibold">Values entered here will immediately update the "Executive KPIs" and "Headcount Planning Analytics" sections on the dashboard, and dynamically populate "Vacant" positions in the Org Chart mind map.</p>
        </div>

      </div>
    </div>
  );
};

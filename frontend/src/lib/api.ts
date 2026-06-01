
export const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

export interface EmployeeHistoryEvent {
  date: string;
  type: 'CTC_REVISION' | 'STATUS_CHANGE' | 'JOINED' | 'OTHER';
  old_value?: string | number;
  new_value: string | number;
  notes?: string;
}

export interface Employee {
  id: string;
  emp_id: string; // Manually assigned ID
  full_name: string;
  company_name: string;
  business_unit: string;
  department: string;
  designation: string;
  role_tier: number;
  employment_status: string;
  email_official: string;
  ctc_annual: number;
  ctc_currency: string;
  budget_allocated: number;
  dashboard_access: string;
  reporting_to_id: string | null;
  photo_url: string;
  
  join_date?: string;
  notice_start_date?: string | null;
  replaced_employee_id?: string | null;
  past_organization?: string;
  total_experience?: string;
  education_qualification?: string;
  history?: EmployeeHistoryEvent[];
}



export interface AuthUser {
  id: string;
  username: string;
  full_name: string;
  role: string;
  employee_id: string | null;
  avatar?: string;
}

export interface Stats {
  totalEmployees: number;
  activeEmployees: number;
  totalPayroll: number;
  totalBudget: number;
  avgCTC: number;
  totalRoles?: number;
  departments: Record<string, number>;
  businessUnits: Record<string, number>;
  tiers: Record<number, number>;
  deptPayroll: Record<string, number>;
  deptBudget: Record<string, number>;
  
  // Advanced Analytics
  plannedHeadcount: number;
  openPositions: number;
  hiringVelocity: number; // hires per month
  attritionRate: number; // percentage
  deptPlannedHC: Record<string, number>;
  salaryBands: Record<string, number>;
  hiringTrend: { month: string; actual: number; planned: number }[];
  attritionTrend: { month: string; rate: number }[];
  healthScore: number;
  designationBreakdown?: Record<string, { designation: string; planned: number; actual: number; open: number }[]>;
}

export interface DesignationTarget {
  designation: string;
  budgeted_hc: number;
  budget_allocated: number;
}

export interface DeptTarget {
  department: string;
  budgeted_hc: number;
  budget_allocated: number;
  target_attrition: number;
  designations?: DesignationTarget[];
}

export interface HRTargets {
  target_hiring_velocity: number;
  target_attrition_rate: number;
  global_planned_headcount?: number;
  global_open_positions?: number;
  departments: DeptTarget[];
}

// ─── WELLNESS & FEEDBACK TYPES ────────────────────────────────────────

export interface WellnessQuestion {
  id: string;
  type: 'MCQ_SINGLE' | 'MCQ_MULTI' | 'PARAGRAPH' | 'RATING';
  text: string;
  options?: string[];
}

export interface WellnessQuestionnaire {
  id: string;
  title: string;
  description: string;
  type: 'APTITUDE' | 'FEEDBACK' | 'WELLNESS' | 'GENERAL';
  created_by: string;
  created_at: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  questions: WellnessQuestion[];
}

export interface WellnessAssignment {
  id: string;
  questionnaire_id: string;
  employee_id: string;
  assigned_by: string;
  assigned_at: string;
  status: 'PENDING' | 'COMPLETED';
}

export interface WellnessAnswer {
  question_id: string;
  selected_options?: string[];
  text_response?: string;
  rating?: number;
}

export interface WellnessResponse {
  id: string;
  assignment_id: string;
  questionnaire_id: string;
  employee_id: string;
  submitted_at: string;
  answers: WellnessAnswer[];
  ai_suggestion?: string;
  ai_consolation?: string;
  admin_status: 'VALID' | 'NEEDS_CORRECTION';
}

export interface CounsellingMessage {
  id: string;
  sender_id: string;
  text: string;
  timestamp: string;
}

export interface CounsellingSession {
  id: string;
  employee_id: string;
  counsellor_id: string | null;
  topic: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  created_at: string;
  messages: CounsellingMessage[];
}

export interface DailyFeedback {
  id: string;
  employee_id: string;
  date: string;
  workload_rating: number;
  office_environment_queries: string;
  suggestions: string;
}

// ─── AUTH ─────────────────────────────────────────────────────────────
export const login = async (username: string, password: string): Promise<AuthUser> => {
  const res = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    throw new Error('Invalid credentials');
  }
  const data = await res.json();
  return data.user;
};

// ─── EMPLOYEES ────────────────────────────────────────────────────────
export const fetchEmployees = async (): Promise<Employee[]> => {
  try {
    const res = await fetch(`http://localhost:3001/api/employees?_=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    if (!res.ok) throw new Error('Failed to fetch employees');
    const data = await res.json();
    return (data || []).map((emp: any) => {
      let status = emp.employment_status || 'Active';
      let noticeDate = emp.notice_start_date;
      
      // Auto-evaluate 90-day notice period
      if (status === 'Under Notice Period' && noticeDate) {
        const daysPassed = Math.floor((new Date().getTime() - new Date(noticeDate).getTime()) / (1000 * 3600 * 24));
        if (daysPassed >= 90) {
          status = 'Inactive';
        }
      }
      
      return {
        ...emp,
        employment_status: status,
        join_date: emp.join_date || new Date().toISOString(),
      };
    });
  } catch (error: any) {
    console.warn('Backend fetch failed:', error.message);
    return [];
  }
};

const TARGETS_CACHE_KEY = 'ag_hr_targets_cache';

export const fetchTargets = async (): Promise<HRTargets> => {
  try {
    const res = await fetch(`http://localhost:3001/api/targets?_=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    if (!res.ok) throw new Error(`Failed to fetch targets: ${res.status}`);
    const data: HRTargets = await res.json();
    // Cache the successful result
    try { localStorage.setItem(TARGETS_CACHE_KEY, JSON.stringify(data)); } catch {}
    return data;
  } catch (e) {
    // Fall back to last cached data so the UI doesn't wipe targets on a transient error
    try {
      const cached = localStorage.getItem(TARGETS_CACHE_KEY);
      if (cached) return JSON.parse(cached) as HRTargets;
    } catch {}
    return {
      target_hiring_velocity: 0,
      target_attrition_rate: 0,
      global_planned_headcount: undefined,
      global_open_positions: undefined,
      departments: []
    };
  }
};

export const saveTargets = async (targets: HRTargets): Promise<HRTargets> => {
  const res = await fetch('http://localhost:3001/api/targets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(targets)
  });
  if (!res.ok) throw new Error('Failed to save targets');
  const data = await res.json();
  // Update cache on successful save
  try { localStorage.setItem(TARGETS_CACHE_KEY, JSON.stringify(data.targets)); } catch {}
  return data.targets;
};

export const getAiStrategy = async (metrics: any): Promise<string> => {
  const res = await fetch('http://localhost:3001/api/ai-strategy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metrics)
  });
  if (!res.ok) throw new Error('Failed to get strategy');
  const data = await res.json();
  return data.strategy;
};

export const fetchStats = async (): Promise<Stats> => {
  const [emps, targets] = await Promise.all([fetchEmployees(), fetchTargets()]);
  // Compute stats locally since we don't have a backend /stats endpoint anymore
  const totalEmployees = emps.length;
  const activeEmployees = emps.filter(e => e.employment_status === 'Active' || e.employment_status === 'Under Notice Period').length;
  const totalPayroll = emps.filter(e => e.employment_status === 'Active' || e.employment_status === 'Under Notice Period').reduce((acc, curr) => acc + (Number(curr.ctc_annual) || 0), 0);
  const avgCTC = activeEmployees ? totalPayroll / activeEmployees : 0;
  
  const uniqueRoles = new Set(emps.map(e => e.designation?.trim()).filter(Boolean));
  const totalRoles = uniqueRoles.size;
  
  const departments: Record<string, number> = {};
  const businessUnits: Record<string, number> = {};
  const tiers: Record<number, number> = {};
  const deptPayroll: Record<string, number> = {};
  const deptBudget: Record<string, number> = {};
  const salaryBands: Record<string, number> = {
    '< 5L': 0,
    '5L - 10L': 0,
    '10L - 20L': 0,
    '20L - 40L': 0,
    '> 40L': 0
  };

  emps.forEach(e => {
    const isActive = e.employment_status === 'Active' || e.employment_status === 'Under Notice Period';
    if (isActive) {
      departments[e.department] = (departments[e.department] || 0) + 1;
      businessUnits[e.business_unit] = (businessUnits[e.business_unit] || 0) + 1;
      tiers[e.role_tier] = (tiers[e.role_tier] || 0) + 1;
      deptPayroll[e.department] = (deptPayroll[e.department] || 0) + (Number(e.ctc_annual) || 0);

      const ctc = Number(e.ctc_annual) || 0;
      if (ctc < 500000) salaryBands['< 5L']++;
      else if (ctc < 1000000) salaryBands['5L - 10L']++;
      else if (ctc < 2000000) salaryBands['10L - 20L']++;
      else if (ctc < 4000000) salaryBands['20L - 40L']++;
      else salaryBands['> 40L']++;
    }
  });

  // Apply actual targets
  const deptPlannedHC: Record<string, number> = {};
  const designationBreakdown: Record<string, { designation: string; planned: number; actual: number; open: number }[]> = {};
  let plannedHeadcount = 0;
  let totalBudget = 0;
  let openPositions = 0;
  
  // First, group actual employees by department AND designation
  const actualEmpsByDeptDesig: Record<string, Record<string, number>> = {};
  const actualEmpsByDept: Record<string, number> = {};
  
  emps.forEach(e => {
    const isActive = e.employment_status === 'Active' || e.employment_status === 'Under Notice Period';
    if (isActive) {
      const d = e.department?.trim() || 'General';
      const des = e.designation?.trim() || 'General';
      if (!actualEmpsByDeptDesig[d]) actualEmpsByDeptDesig[d] = {};
      actualEmpsByDeptDesig[d][des] = (actualEmpsByDeptDesig[d][des] || 0) + 1;
      actualEmpsByDept[d] = (actualEmpsByDept[d] || 0) + 1;
    }
  });

  targets.departments.forEach(t => {
    const dept = t.department.trim();
    designationBreakdown[dept] = [];
    let deptHc = 0;
    let deptCost = 0;
    let deptOpen = 0;
    const actualDeptTotal = actualEmpsByDept[dept] || 0;
    
    if (t.designations && t.designations.length > 0) {
      let accountedActualInDesignations = 0;
      const targetDesignationsProcessed = new Set<string>();

      t.designations.forEach(d => {
        const desigName = d.designation.trim();
        targetDesignationsProcessed.add(desigName);
        const targetHc = Number(d.budgeted_hc) || 0;
        const targetCost = Number(d.budget_allocated) || 0;
        const actualDesig = actualEmpsByDeptDesig[dept]?.[desigName] || 0;
        
        const plannedDesig = Math.max(targetHc, actualDesig);
        const openDesig = Math.max(0, targetHc - actualDesig);

        designationBreakdown[dept].push({
          designation: desigName,
          planned: plannedDesig,
          actual: actualDesig,
          open: openDesig
        });
        
        deptHc += plannedDesig;
        deptCost += targetCost;
        deptOpen += openDesig;
        accountedActualInDesignations += actualDesig;
      });
      
      // Keep actual employees in the department who weren't in the specific target designations
      if (actualEmpsByDeptDesig[dept]) {
        Object.keys(actualEmpsByDeptDesig[dept]).forEach(desigName => {
          if (!targetDesignationsProcessed.has(desigName)) {
            const actualDesig = actualEmpsByDeptDesig[dept][desigName];
            designationBreakdown[dept].push({
              designation: desigName,
              planned: actualDesig,
              actual: actualDesig,
              open: 0
            });
            deptHc += actualDesig;
            accountedActualInDesignations += actualDesig;
          }
        });
      }
    } else {
      const targetHc = Number(t.budgeted_hc) || 0;
      deptCost = Number(t.budget_allocated) || 0;
      
      if (targetHc === 0) {
        deptHc = actualDeptTotal; // Default to actual if no target set
      } else {
        deptHc = Math.max(targetHc, actualDeptTotal);
        deptOpen = Math.max(0, targetHc - actualDeptTotal);
      }

      if (actualEmpsByDeptDesig[dept]) {
        Object.keys(actualEmpsByDeptDesig[dept]).forEach(desigName => {
          const actualDesig = actualEmpsByDeptDesig[dept][desigName];
          designationBreakdown[dept].push({
            designation: desigName,
            planned: actualDesig,
            actual: actualDesig,
            open: 0
          });
        });
      }

      if (deptOpen > 0) {
        designationBreakdown[dept].push({
          designation: "Vacant Position (Unspecified Role)",
          planned: deptOpen,
          actual: 0,
          open: deptOpen
        });
      }
    }
    
    deptPlannedHC[t.department] = deptHc;
    deptBudget[t.department] = deptCost;
    plannedHeadcount += deptHc;
    totalBudget += deptCost;
    openPositions += deptOpen;
  });

  // Fallback for departments not in targets
  Object.keys(actualEmpsByDept).forEach(dept => {
    if (deptPlannedHC[dept] === undefined) {
      const actual = actualEmpsByDept[dept];
      deptPlannedHC[dept] = actual;
      plannedHeadcount += actual;
      deptBudget[dept] = deptPayroll[dept] || 0; // fallback budget to actual cost if undefined
      
      designationBreakdown[dept] = [];
      if (actualEmpsByDeptDesig[dept]) {
        Object.keys(actualEmpsByDeptDesig[dept]).forEach(desigName => {
          const actualDesig = actualEmpsByDeptDesig[dept][desigName];
          designationBreakdown[dept].push({
            designation: desigName,
            planned: actualDesig,
            actual: actualDesig,
            open: 0
          });
        });
      }
    }
  });

  // Also fallback budget for departments that had target=0 and no designations
  Object.keys(deptBudget).forEach(dept => {
    if (deptBudget[dept] === 0 && deptPayroll[dept] > 0) {
       deptBudget[dept] = deptPayroll[dept];
       totalBudget += deptPayroll[dept];
    }
  });

  if (typeof targets.global_planned_headcount === 'number' && !isNaN(targets.global_planned_headcount) && targets.global_planned_headcount > 0) {
    plannedHeadcount = targets.global_planned_headcount;
  }

  if (typeof targets.global_open_positions === 'number' && !isNaN(targets.global_open_positions) && targets.global_open_positions > 0) {
    openPositions = targets.global_open_positions;
    if (plannedHeadcount < activeEmployees + openPositions) {
      plannedHeadcount = activeEmployees + openPositions;
    }
  }

  // Calculate Actual Hiring Velocity (Hires in last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const hiringVelocity = emps.filter(e => e.join_date && new Date(e.join_date) >= thirtyDaysAgo).length;

  // Calculate Actual Attrition Rate ((Inactive / Total) * 100)
  const inactiveEmployees = emps.filter(e => e.employment_status === 'Inactive').length;
  const attritionRate = totalEmployees > 0 ? Number(((inactiveEmployees / totalEmployees) * 100).toFixed(1)) : 0;

  // Calculate Org Health Score (Starts at 100, penalize for high attrition and open positions)
  const attritionPenalty = (attritionRate / 5) * 10;
  const openPosPercent = plannedHeadcount > 0 ? (openPositions / plannedHeadcount) * 100 : 0;
  const openPosPenalty = (openPosPercent / 10) * 10;
  const healthScore = Math.max(0, Math.min(100, Math.round(100 - attritionPenalty - openPosPenalty)));

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hiringTrend = [];
  const attritionTrend = [];
  
  const now = new Date();

  // Calculate average actual hires per month from employee DOJs in the trend window
  let totalHiresInTrend = 0;
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const hiresThisMonth = emps.filter(e => {
      if (!e.join_date) return false;
      const jd = new Date(e.join_date);
      return jd.getMonth() === d.getMonth() && jd.getFullYear() === d.getFullYear();
    }).length;
    totalHiresInTrend += hiresThisMonth;
  }


  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = monthNames[d.getMonth()];
    
    const hiresThisMonth = emps.filter(e => {
      if (!e.join_date) return false;
      const jd = new Date(e.join_date);
      return jd.getMonth() === d.getMonth() && jd.getFullYear() === d.getFullYear();
    }).length;
    
    const exitsThisMonth = emps.filter(e => {
      if (e.employment_status !== 'Inactive') return false;
      const inactiveEvent = e.history?.find(h => h.type === 'STATUS_CHANGE' && h.new_value === 'Inactive');
      if (inactiveEvent) {
        const hd = new Date(inactiveEvent.date);
        return hd.getMonth() === d.getMonth() && hd.getFullYear() === d.getFullYear();
      }
      return false;
    }).length;
    
    const monthAttritionRate = activeEmployees > 0 ? Number(((exitsThisMonth / activeEmployees) * 100).toFixed(1)) : 0;
    
    hiringTrend.push({
      month: monthStr,
      actual: hiresThisMonth,
      planned: Number(targets.target_hiring_velocity) || 0
    });
    
    attritionTrend.push({
      month: monthStr,
      rate: monthAttritionRate
    });
  }

  return {
    totalEmployees, activeEmployees, totalPayroll, totalBudget, avgCTC, totalRoles,
    departments, businessUnits, tiers, deptPayroll, deptBudget,
    plannedHeadcount, openPositions, hiringVelocity, attritionRate,
    deptPlannedHC, salaryBands, hiringTrend, attritionTrend, healthScore,
    designationBreakdown
  };
};

export const createEmployee = async (emp: Omit<Employee, 'id'>): Promise<Employee> => {
  const res = await fetch('http://localhost:3001/api/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...emp,
      join_date: emp.join_date || new Date().toISOString()
    })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to create');
  }
  const data = await res.json();
  return data.employee;
};

export const updateEmployee = async (id: string, emp: Partial<Employee>): Promise<Employee> => {
  const res = await fetch(`http://localhost:3001/api/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emp)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to update');
  }
  const data = await res.json();
  return data.employee;
};

export const deleteEmployee = async (id: string): Promise<void> => {
  const res = await fetch(`http://localhost:3001/api/employees/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to delete');
  }
};

export const bulkDeleteEmployees = async (ids: string[]): Promise<void> => {
  if (!ids.length) return;
  const res = await fetch('http://localhost:3001/api/employees/bulk-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to bulk delete employees');
  }
};


export const bulkImportEmployees = async (
  employees: Record<string, string>[]
): Promise<{ added: number; message: string }> => {
  const res = await fetch('http://localhost:3001/api/employees/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employees })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Bulk import failed');
  }
  return res.json();
};

// ─── WELLNESS MODULE API ──────────────────────────────────────────────

export const fetchQuestionnaires = async (): Promise<WellnessQuestionnaire[]> => {
  const res = await fetch('http://localhost:3001/api/wellness/questionnaires');
  if (!res.ok) throw new Error('Failed to fetch questionnaires');
  return res.json();
};

export const createQuestionnaire = async (q: Partial<WellnessQuestionnaire>): Promise<WellnessQuestionnaire> => {
  const res = await fetch('http://localhost:3001/api/wellness/questionnaires', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(q)
  });
  if (!res.ok) throw new Error('Failed to create questionnaire');
  return res.json();
};

export const fetchAssignments = async (empId?: string): Promise<WellnessAssignment[]> => {
  const url = empId ? `http://localhost:3001/api/wellness/assignments?empId=${empId}` : 'http://localhost:3001/api/wellness/assignments';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch assignments');
  return res.json();
};

export const createAssignment = async (a: Partial<WellnessAssignment>): Promise<WellnessAssignment> => {
  const res = await fetch('http://localhost:3001/api/wellness/assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(a)
  });
  if (!res.ok) throw new Error('Failed to create assignment');
  return res.json();
};

export const submitWellnessResponse = async (data: Partial<WellnessResponse>): Promise<WellnessResponse> => {
  const res = await fetch('http://localhost:3001/api/wellness/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to submit response');
  return res.json();
};

export const fetchCounsellingSessions = async (empId?: string): Promise<CounsellingSession[]> => {
  const url = empId ? `http://localhost:3001/api/wellness/counselling?empId=${empId}` : 'http://localhost:3001/api/wellness/counselling';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
};

export const createCounsellingSession = async (s: Partial<CounsellingSession>): Promise<CounsellingSession> => {
  const res = await fetch('http://localhost:3001/api/wellness/counselling', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(s)
  });
  if (!res.ok) throw new Error('Failed to create session');
  return res.json();
};

export const sendCounsellingMessage = async (sessionId: string, text: string, senderId: string): Promise<CounsellingMessage> => {
  const res = await fetch(`http://localhost:3001/api/wellness/counselling/${sessionId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, sender_id: senderId })
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
};

export const fetchDailyFeedbacks = async (): Promise<DailyFeedback[]> => {
  const res = await fetch('http://localhost:3001/api/wellness/daily-feedback');
  if (!res.ok) throw new Error('Failed to fetch daily feedbacks');
  return res.json();
};

export const submitDailyFeedback = async (data: Partial<DailyFeedback>): Promise<DailyFeedback> => {
  const res = await fetch('http://localhost:3001/api/wellness/daily-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to submit daily feedback');
  return res.json();
};

// ─── INTERNS ────────────────────────────────────────────────────────
export interface Intern {
  id: string;
  name: string;
  dob: string;
  address: string;
  start_date: string;
  end_date: string;
  documents_url: string[];
  is_active: boolean;
  is_certified: boolean;
  created_at: string;
  // Admin only additions
  certificate_url?: string; 
}

export interface InternReport {
  id: string;
  intern_id: string;
  date: string;
  learnings: string;
  feedback: string;
  needs_improvement: string;
  status: string;
  created_at: string;
  interns?: { name: string };
}

export const registerIntern = async (data: any): Promise<Intern> => {
  const res = await fetch('http://localhost:3001/api/interns/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to register intern');
  return res.json();
};

export const loginIntern = async (internId: string, password: string): Promise<Intern> => {
  const res = await fetch('http://localhost:3001/api/interns/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ internId, password })
  });
  if (!res.ok) throw new Error('Invalid intern credentials');
  return res.json();
};

export const fetchInterns = async (): Promise<Intern[]> => {
  const res = await fetch('http://localhost:3001/api/interns');
  if (!res.ok) throw new Error('Failed to fetch interns');
  return res.json();
};

export const updateIntern = async (id: string, updates: Partial<Intern>): Promise<Intern> => {
  const res = await fetch(`http://localhost:3001/api/interns/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update intern');
  return res.json();
};

export const submitInternReport = async (data: Partial<InternReport>): Promise<InternReport> => {
  const res = await fetch('http://localhost:3001/api/interns/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to submit report or report already submitted for today');
  return res.json();
};

export const fetchInternReports = async (internId?: string): Promise<InternReport[]> => {
  const url = internId ? `http://localhost:3001/api/interns/reports/${internId}` : 'http://localhost:3001/api/interns/reports';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch intern reports');
  return res.json();
};

import { supabase } from './supabase';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

export interface EmployeeHistoryEvent {
  date: string;
  type: 'CTC_REVISION' | 'STATUS_CHANGE' | 'JOINED' | 'OTHER';
  old_value?: string | number;
  new_value: string | number;
  notes?: string;
}

export type PositionStatus = 'A' | 'V' | 'OYJ' | 'RoR' | 'RP' | 'H' | 'F' | 'M' | 'C' | 'T';

export interface Position {
  id: string; // e.g., P001
  title: string; // e.g., Software Engineer
  department: string;
  business_unit: string;
  sub_function?: string;
  reporting_to_position_id: string | null;
  status: PositionStatus;
  merged_into_position_id?: string;
  budgeted_ctc?: number;
}

export interface Employee {
  id: string;
  emp_id: string; // Manually assigned ID
  position_id?: string;
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
  sub_function?: string;
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
  totalOffered: number;
  totalHold: number;
  avgCTC: number;
  totalRoles?: number;
  departments: Record<string, number>;
  businessUnits: Record<string, number>;
  tiers: Record<number, number>;
  deptPayroll: Record<string, number>;
  deptBudget: Record<string, number>;
  deptOffered: Record<string, number>;
  deptHold: Record<string, number>;
  
  // Executive KPIs
  budgetPositions: number;
  activePositions: number;
  vacantPositions: number;
  oyjPositions: number;
  replacementPositions: number;
  holdPositions: number;
  frozenPositions: number;
  
  employeeCount: number;
  budgetHC: number;
  activeHC: number;
  vacancyHC: number;
  resignedHC: number;
  
  budgetCTC: number;
  activeCTC: number;
  vacancyCTC: number;
  resignedCTC: number;
  ctcUtilization: number;

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
  designationBreakdown?: Record<string, { designation: string; planned: number; actual: number; open: number; budgeted_ctc?: number }[]>;
  workforcePlanningTable: any[];
}

export interface DesignationTarget {
  designation: string;
  budgeted_hc: number;
  budget_allocated: number;
}

export interface DeptTarget {
  department: string;
  business_unit?: string;
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
  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('username', username)
    .single();
    
  if (error || !data) {
    throw new Error('Invalid credentials');
  }
  
  if (data.password !== password) {
    throw new Error('Invalid credentials');
  }
  
  return data as AuthUser;
};

export const register = async (username: string, password: string, full_name: string): Promise<AuthUser> => {
  const newId = `USR_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const { data, error } = await supabase
    .from('app_users')
    .insert({ id: newId, username, password, full_name, role: 'Employee', employee_id: '' })
    .select('*')
    .single();
    
  if (error) {
    throw new Error(error.message || 'Registration failed');
  }
  return data as AuthUser;
};

export const updateUserRole = async (userId: string, role: string): Promise<AuthUser> => {
  const { data, error } = await supabase
    .from('app_users')
    .update({ role })
    .eq('id', userId)
    .select('*')
    .single();
    
  if (error) {
    throw new Error(error.message || 'Failed to update role');
  }
  return data as AuthUser;
};

export const fetchUsers = async (): Promise<AuthUser[]> => {
  const { data, error } = await supabase
    .from('app_users')
    .select('*');
    
  if (error) throw new Error(error.message || 'Failed to fetch users');
  return data as AuthUser[];
};

// ─── EMPLOYEES ────────────────────────────────────────────────────────
export const fetchEmployees = async (retries = 3): Promise<Employee[]> => {
  try {
    const { data, error } = await supabase.from('employees').select('*');
    if (error) throw error;
    
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
        join_date: emp.join_date || null,
      };
    });
  } catch (error: any) {
    if (retries > 0) {
      console.warn(`Backend fetch failed, retrying in 1s... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchEmployees(retries - 1);
    }
    console.warn('Backend fetch failed:', error.message);
    return [];
  }
};

const TARGETS_CACHE_KEY = 'ag_hr_targets_cache';

export const fetchTargets = async (): Promise<HRTargets> => {
  try {
    const { data, error } = await supabase.from('hr_targets').select('*').eq('id', 1).single();
    if (error) throw error;
    
    // Cache the successful result
    try { localStorage.setItem(TARGETS_CACHE_KEY, JSON.stringify(data)); } catch {}
    return data as HRTargets;
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
  const { data, error } = await supabase.from('hr_targets').upsert({ id: 1, ...targets }).select('*').single();
  if (error) throw new Error('Failed to save targets: ' + error.message);
  
  // Update cache on successful save
  try { localStorage.setItem(TARGETS_CACHE_KEY, JSON.stringify(data)); } catch {}
  return data as HRTargets;
};

export const getAiStrategy = async (metrics: any): Promise<string> => {
  const res = await fetch(API_BASE + '/api/ai-strategy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metrics)
  });
  if (!res.ok) throw new Error('Failed to get strategy');
  const data = await res.json();
  return data.strategy;
};

export const fetchStats = async (buFilter?: string, deptFilter?: string): Promise<Stats> => {
  const fetchOffersCall = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/recruitment/offers`);
      if (res.ok) return await res.json();
    } catch {}
    return [];
  };

  let [emps, targets, positions, offers] = await Promise.all([fetchEmployees(), fetchTargets(), fetchPositions(), fetchOffersCall()]);

  // Apply Hierarchy Filters
  if (buFilter) {
    emps = emps.filter(e => e.business_unit === buFilter);
    positions = positions.filter(p => p.business_unit === buFilter);
  }
  if (deptFilter) {
    emps = emps.filter(e => e.department === deptFilter);
    positions = positions.filter(p => p.department === deptFilter);
  }

  // Compute stats locally
  const totalEmployees = emps.length;
  const activeEmployees = emps.filter(e => 
    e.employment_status === 'Active' || 
    e.employment_status === 'Under Notice Period' ||
    e.employment_status === 'Resigned on Roll' ||
    e.employment_status === 'Replacement Joined'
  ).length;
  
  const totalPayroll = emps.filter(e => 
    e.employment_status === 'Active' || 
    e.employment_status === 'Under Notice Period' ||
    e.employment_status === 'Resigned on Roll' ||
    e.employment_status === 'Replacement Joined'
  ).reduce((acc, curr) => acc + (Number(curr.ctc_annual) || 0), 0);
  
  const avgCTC = activeEmployees ? totalPayroll / activeEmployees : 0;
  
  const budgetCTC = positions.reduce((sum, p) => {
    const empForPos = emps.find(e => e.position_id === p.id);
    return sum + ((empForPos ? (Number(empForPos.budget_allocated) || Number(empForPos.ctc_annual) || 0) : 0) || (Number(p.budgeted_ctc) || 0));
  }, 0);
  const activeCTC = totalPayroll;
  const ctcUtilization = budgetCTC > 0 ? Math.round((activeCTC / budgetCTC) * 100) : 0;

  const uniqueRoles = new Set(emps.map(e => e.designation?.trim()).filter(Boolean));
  const totalRoles = uniqueRoles.size;
  
  const departments: Record<string, number> = {};
  const businessUnits: Record<string, number> = {};
  const tiers: Record<number, number> = {};
  const deptPayroll: Record<string, number> = {};
  const deptBudget: Record<string, number> = {};
  const deptOffered: Record<string, number> = {};
  const deptHold: Record<string, number> = {};
  const salaryBands: Record<string, number> = {
    '< 5L': 0,
    '5L - 10L': 0,
    '10L - 20L': 0,
    '20L - 40L': 0,
    '> 40L': 0
  };

  emps.forEach(e => {
    const isActive = e.employment_status === 'Active' || 
                     e.employment_status === 'Under Notice Period' ||
                     e.employment_status === 'Resigned on Roll' ||
                     e.employment_status === 'Replacement Joined';
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
  const designationBreakdown: Record<string, { designation: string; planned: number; actual: number; open: number; budgeted_ctc?: number }[]> = {};
  let plannedHeadcount = 0;
  let totalBudget = 0;
  let openPositions = 0;
  
  // First, group actual employees by department AND designation
  const actualEmpsByDeptDesig: Record<string, Record<string, number>> = {};
  const actualEmpsByDept: Record<string, number> = {};
  
  emps.forEach(e => {
    const isActive = e.employment_status === 'Active' || 
                     e.employment_status === 'Under Notice Period' ||
                     e.employment_status === 'Resigned on Roll' ||
                     e.employment_status === 'Replacement Joined';
    if (isActive) {
      const d = e.department?.trim() || 'General';
      const des = e.designation?.trim() || 'General';
      if (!actualEmpsByDeptDesig[d]) actualEmpsByDeptDesig[d] = {};
      actualEmpsByDeptDesig[d][des] = (actualEmpsByDeptDesig[d][des] || 0) + 1;
      actualEmpsByDept[d] = (actualEmpsByDept[d] || 0) + 1;
    }
  });

  // Use strict position budgets for totalBudget and deptBudget
  totalBudget = 0;
  Object.keys(deptBudget).forEach(k => delete deptBudget[k]);
  positions.forEach(p => {
    const empForPos = emps.find(e => e.position_id === p.id);
    const b = (empForPos ? (Number(empForPos.budget_allocated) || Number(empForPos.ctc_annual) || 0) : 0) || (Number(p.budgeted_ctc) || 0);
    totalBudget += b;
    deptBudget[p.department] = (deptBudget[p.department] || 0) + b;
  });

  // Build Workforce Planning Intelligence Table
  const titleMap = new Map<string, any>();
  let totalOffered = 0;
  let totalHold = 0;

  positions.forEach(p => {
    // Find active employees linked to this position
    const activeEmps = emps.filter(e => e.position_id === p.id && (
      e.employment_status === 'Active' || 
      e.employment_status === 'Replacement Joined'
    ));
    
    const resignedEmps = emps.filter(e => e.position_id === p.id && (
      e.employment_status === 'Under Notice Period' ||
      e.employment_status === 'Resigned on Roll'
    ));
    // Find offers linked to this position
    const posOffers = offers.filter((o: any) => o.position_id === p.id && o.status !== 'Offer Declined' && o.status !== 'Offer Expired');
    
    const empForPos = activeEmps[0] || emps.find(e => e.position_id === p.id);
    const budgetedCTC = (empForPos ? (Number(empForPos.budget_allocated) || Number(empForPos.ctc_annual) || 0) : 0) || (Number(p.budgeted_ctc) || 0);
    const activeCTC = activeEmps.reduce((sum, e) => sum + (Number(e.ctc_annual) || 0), 0);
    const activeHC = activeEmps.length;
    
    const resignedCTC = resignedEmps.reduce((sum, e) => sum + (Number(e.ctc_annual) || 0), 0);
    const resignedHC = resignedEmps.length;
    
    let offeredCTC = 0;
    let offeredHC = 0;
    let holdCTC = 0;
    let holdHC = 0;

    // Check if there is an employee with status "Offered Yet to Join"
    const oyjEmp = emps.find(e => e.position_id === p.id && e.employment_status === 'Offered Yet to Join');
    if (oyjEmp) {
      offeredHC = 1;
      offeredCTC = Number(oyjEmp.ctc_annual) || 0;
    }

    // Check if position status itself is Offered Yet to Join (OYJ)
    if (!oyjEmp && p.status === 'OYJ') {
      offeredHC = 1;
      offeredCTC = budgetedCTC;
    }
    
    posOffers.forEach((o: any) => {
      if (o.status === 'Offer Declined' || o.status === 'Offer Expired' || o.status === 'Joined') return;

      if (o.status === 'Pending Budget Exception' || o.status.startsWith('Pending')) {
        holdCTC += Number(o.offered_ctc) || 0;
        holdHC += 1;
      } else {
        if (offeredHC === 0) {
          offeredCTC += Number(o.offered_ctc) || 0;
          offeredHC += 1;
        }
      }
    });

    if (holdHC === 0 && p.status === 'H') {
      holdHC = 1;
      holdCTC = budgetedCTC;
    }

    totalOffered += offeredCTC;
    totalHold += holdCTC;

    if (p.department) {
      deptOffered[p.department] = (deptOffered[p.department] || 0) + offeredCTC;
      deptHold[p.department] = (deptHold[p.department] || 0) + holdCTC;
    }

    const totalCommitted = activeCTC + resignedCTC + offeredCTC + holdCTC;
    const availableBudget = budgetedCTC - totalCommitted;
    
    let vacancyHC = 0;
    let posVacancyCTC = 0;
    
    if (activeHC === 0 && resignedHC === 0 && offeredHC === 0 && holdHC === 0) {
      vacancyHC = 1;
      posVacancyCTC = Math.max(0, availableBudget);
    }

    const key = `${p.title.trim()}|${p.business_unit}|${p.department}`;
    if (!titleMap.has(key)) {
      titleMap.set(key, {
        position: p.title.trim(),
        grade: 'N/A',
        business_unit: p.business_unit,
        department: p.department,
        budgetHC: 0, budgetedCTC: 0,
        activeHC: 0, activeCTC: 0,
        resignedHC: 0, resignedCTC: 0,
        offeredHC: 0, offeredCTC: 0,
        holdHC: 0, holdCTC: 0,
        vacancyHC: 0, vacancyCTC: 0,
        savingsAmount: 0
      });
    }
    const row = titleMap.get(key);
    row.budgetHC += 1;
    row.budgetedCTC += budgetedCTC;
    row.activeHC += activeHC;
    row.activeCTC += activeCTC;
    row.resignedHC += resignedHC;
    row.resignedCTC += resignedCTC;
    row.offeredHC += offeredHC;
    row.offeredCTC += offeredCTC;
    row.holdHC += holdHC;
    row.holdCTC += holdCTC;
    row.vacancyHC += vacancyHC;
    row.vacancyCTC += posVacancyCTC;
    row.savingsAmount += availableBudget;
  });

  // Calculate department totals
  const deptTotals: Record<string, { budget: number, active: number, offered: number, hold: number, rawVacancy: number }> = {};
  for (const row of titleMap.values()) {
    const d = row.department || '';
    if (!deptTotals[d]) {
      deptTotals[d] = { budget: 0, active: 0, offered: 0, hold: 0, rawVacancy: 0 };
    }
    deptTotals[d].budget += row.budgetedCTC;
    deptTotals[d].active += row.activeCTC;
    deptTotals[d].offered += row.offeredCTC;
    deptTotals[d].hold += row.holdCTC;
    deptTotals[d].rawVacancy += row.vacancyCTC;
  }

  const workforcePlanningTable = Array.from(titleMap.values()).map(row => {
    const d = row.department || '';
    const dt = deptTotals[d];
    
    // Department level available budget
    const dAvailable = Math.max(0, dt.budget - dt.active - dt.offered - dt.hold);
    
    const rawVacancyCTC = row.vacancyCTC;
    // Scale vacancy CTC so it doesn't exceed the department's available budget
    const scaledVacancyCTC = Math.min(rawVacancyCTC, dt.rawVacancy > 0 ? Math.round(dAvailable * (rawVacancyCTC / dt.rawVacancy)) : 0);
    
    // The true Variance/Savings is what's left AFTER paying for the Vacancy CTC
    const trueVariance = row.savingsAmount - scaledVacancyCTC;
    const variancePercentage = row.budgetedCTC > 0 ? (trueVariance / row.budgetedCTC) * 100 : 0;
    
    return { ...row, vacancyCTC: scaledVacancyCTC, savingsAmount: trueVariance, savingsPercentage: variancePercentage };
  });

  let vacancyCTC = workforcePlanningTable.reduce((sum, row) => sum + (row.vacancyCTC || 0), 0);

  const budgetHC = workforcePlanningTable.reduce((sum, row) => sum + (row.budgetHC || 0), 0);
  const activeHC = workforcePlanningTable.reduce((sum, row) => sum + (row.activeHC || 0), 0);
  const resignedHC = workforcePlanningTable.reduce((sum, row) => sum + (row.resignedHC || 0), 0);
  const vacancyHC = workforcePlanningTable.reduce((sum, row) => sum + (row.vacancyHC || 0), 0);
  const oyjPositions = workforcePlanningTable.reduce((sum, row) => sum + (row.offeredHC || 0), 0);
  const holdPositions = workforcePlanningTable.reduce((sum, row) => sum + (row.holdHC || 0), 0);

  const wpActiveCTC = workforcePlanningTable.reduce((sum, row) => sum + (row.activeCTC || 0), 0);
  const wpResignedCTC = workforcePlanningTable.reduce((sum, row) => sum + (row.resignedCTC || 0), 0);
  const wpBudgetCTC = workforcePlanningTable.reduce((sum, row) => sum + (row.budgetedCTC || 0), 0);

  const budgetPositions = budgetHC;
  const activePositions = activeHC;
  const vacantPositions = vacancyHC;
  const replacementPositions = positions.filter(p => p.status === 'RP').length;
  const frozenPositions = positions.filter(p => p.status === 'F').length;

  const employeeCount = totalEmployees;

  // Populate designationBreakdown and deptPlannedHC from workforcePlanningTable
  for (const row of workforcePlanningTable) {
    const dept = row.department || 'General';
    if (!designationBreakdown[dept]) {
      designationBreakdown[dept] = [];
    }
    designationBreakdown[dept].push({
      designation: row.position,
      planned: row.budgetHC,
      actual: row.activeHC,
      open: row.vacancyHC,
      budgeted_ctc: row.budgetedCTC
    });
    deptPlannedHC[dept] = (deptPlannedHC[dept] || 0) + row.budgetHC;
  }

  if (typeof targets.global_planned_headcount === 'number' && !isNaN(targets.global_planned_headcount) && targets.global_planned_headcount > 0) {
    plannedHeadcount = targets.global_planned_headcount;
  } else {
    plannedHeadcount = budgetHC;
  }

  if (typeof targets.global_open_positions === 'number' && !isNaN(targets.global_open_positions) && targets.global_open_positions > 0) {
    openPositions = targets.global_open_positions;
    if (plannedHeadcount < activeEmployees + openPositions) {
      plannedHeadcount = activeEmployees + openPositions;
    }
  } else {
    openPositions = vacancyHC;
  }

  // Calculate Actual Hiring Velocity (Hires in last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const hiringVelocity = emps.filter(e => e.join_date && new Date(e.join_date) >= thirtyDaysAgo).length;

  const inactiveEmployees = emps.filter(e => e.employment_status === 'Inactive').length;
  const attritionRate = activeEmployees > 0 ? Number(((inactiveEmployees / activeEmployees) * 100).toFixed(1)) : 0;

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
    totalEmployees,
    activeEmployees,
    totalPayroll,
    totalBudget,
    totalOffered,
    totalHold,
    avgCTC,
    totalRoles,
    departments,
    businessUnits,
    tiers,
    deptPayroll,
    deptBudget,
    deptOffered,
    deptHold,
    
    // Executive KPIs
    budgetPositions,
    activePositions,
    vacantPositions,
    oyjPositions,
    replacementPositions,
    holdPositions,
    frozenPositions,
    employeeCount,
    budgetHC,
    activeHC,
    vacancyHC,
    resignedHC,
    budgetCTC: wpBudgetCTC,
    activeCTC: wpActiveCTC,
    vacancyCTC,
    resignedCTC: wpResignedCTC,
    ctcUtilization,

    // Advanced Analytics
    plannedHeadcount,
    openPositions,
    hiringVelocity,
    attritionRate,
    deptPlannedHC,
    salaryBands,
    hiringTrend,
    attritionTrend,
    healthScore,
    designationBreakdown,
    workforcePlanningTable
  };
};

export const createEmployee = async (emp: Omit<Employee, 'id'>): Promise<Employee> => {
  const newId = emp.emp_id || `EMP_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const payload = {
    ...emp,
    id: newId,
    join_date: emp.join_date || new Date().toISOString()
  };
  const { data, error } = await supabase.from('employees').insert(payload).select('*').single();
  if (error) throw new Error(error.message || 'Failed to create employee');
    
  let role = 'Employee';
  switch (data.role_tier) {
    case 1: role = 'Admin'; break;
    case 2: role = 'Management'; break;
    case 3: role = 'HOD'; break;
    case 4: role = 'Manager'; break;
  }
    
  await supabase.from('app_users').upsert({
    id: `USR_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    username: data.email_official || `user_${data.emp_id}`,
    password: 'password123', // default password
    full_name: data.full_name,
    role: role,
    employee_id: data.id
  }, { onConflict: 'employee_id' });

  return data;
};

export const updateEmployee = async (id: string, emp: Partial<Employee>): Promise<Employee> => {
  const { data, error } = await supabase.from('employees').update(emp).eq('id', id).select('*').single();
  if (error) throw new Error(error.message || 'Failed to update employee');
  return data;
};

export const deleteEmployee = async (id: string): Promise<void> => {
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) throw new Error(error.message || 'Failed to delete employee');
};

export const bulkDeleteEmployees = async (ids: string[]): Promise<void> => {
  if (!ids.length) return;
  const { error } = await supabase.from('employees').delete().in('id', ids);
  if (error) throw new Error(error.message || 'Failed to bulk delete employees');
};

export const bulkImportEmployees = async (
  rawEmployees: Record<string, string>[]
): Promise<{ added: number; message: string }> => {
  if (!rawEmployees.length) return { added: 0, message: 'No rows to import.' };

  const parsedEmployees: any[] = [];
  const positionsToCreate: any[] = [];

  rawEmployees.forEach(e => {
    const positionId = `P_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const empId = e.id || e.emp_id || `EMP_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const department = e.department || 'General';
    const designation = e.designation || 'Staff';
    
    const ctcAnnualStr = e.ctc_annual ? String(e.ctc_annual).replace(/,/g, '') : '';
    const budgetAllocatedStr = e.budget_allocated ? String(e.budget_allocated).replace(/,/g, '') : '';
    const ctcAnnual = parseFloat(ctcAnnualStr) || 0;
    const budgetAllocated = parseFloat(budgetAllocatedStr) || ctcAnnual * 1.2;
    
    const businessUnit = e.business_unit || 'General';
    const subFunction = e.sub_function || '';

    positionsToCreate.push({
      id: positionId,
      title: designation,
      department: department,
      business_unit: businessUnit,
      sub_function: subFunction,
      status: 'A',
      budgeted_ctc: budgetAllocated
    });

    parsedEmployees.push({
      id: empId,
      emp_id: e.emp_id || `EMP${Math.floor(1000 + Math.random() * 9000)}`,
      position_id: positionId,
      full_name: e.full_name || 'Unnamed Employee',
      company_name: e.company_name || 'Axxel Corp',
      business_unit: businessUnit,
      department: department,
      designation: designation,
      role_tier: parseInt(e.role_tier) || 5,
      employment_status: e.employment_status || 'Active',
      email_official: e.email_official || `emp_${Date.now()}@axxel.com`,
      ctc_annual: ctcAnnual,
      ctc_currency: e.ctc_currency || 'INR',
      budget_allocated: budgetAllocated,
      dashboard_access: e.dashboard_access || 'Employee',
      reporting_to_id: e.reporting_manager_emp_id || null,
      photo_url: e.photo_url || '',
      sub_function: subFunction
    });
  });

  const { error: posError } = await supabase.from('positions').upsert(positionsToCreate);
  if (posError) throw new Error(posError.message || 'Failed to create positions for bulk import');

  const { data, error } = await supabase.from('employees').upsert(parsedEmployees).select();
  if (error) throw new Error(error.message || 'Bulk import failed');
    
  if (data) {
    const usersToCreate = data.map((emp: any) => {
      let role = 'Employee';
      switch (emp.role_tier) {
        case 1: role = 'Admin'; break;
        case 2: role = 'Management'; break;
        case 3: role = 'HOD'; break;
        case 4: role = 'Manager'; break;
      }
      return {
        id: `USR_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        username: emp.email_official || `user_${emp.emp_id}`,
        password: 'password123',
        full_name: emp.full_name,
        role: role,
        employee_id: emp.id
      };
    });
    // onConflict 'employee_id' prevents duplicate users for the same employee if re-imported
    await supabase.from('app_users').upsert(usersToCreate, { onConflict: 'employee_id' });
  }

  return { added: data ? data.length : parsedEmployees.length, message: `Successfully imported ${data ? data.length : parsedEmployees.length} employees.` };
};

// ─── WELLNESS MODULE API ──────────────────────────────────────────────

export const fetchQuestionnaires = async (): Promise<WellnessQuestionnaire[]> => {
  const res = await fetch(API_BASE + '/api/wellness/questionnaires');
  if (!res.ok) throw new Error('Failed to fetch questionnaires');
  return res.json();
};

export const createQuestionnaire = async (q: Partial<WellnessQuestionnaire>): Promise<WellnessQuestionnaire> => {
  const res = await fetch(API_BASE + '/api/wellness/questionnaires', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(q)
  });
  if (!res.ok) throw new Error('Failed to create questionnaire');
  return res.json();
};

export const fetchAssignments = async (empId?: string): Promise<WellnessAssignment[]> => {
  const url = empId ? `${API_BASE}/api/wellness/assignments?empId=${empId}` : API_BASE + '/api/wellness/assignments';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch assignments');
  return res.json();
};

export const createAssignment = async (a: Partial<WellnessAssignment>): Promise<WellnessAssignment> => {
  const res = await fetch(API_BASE + '/api/wellness/assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(a)
  });
  if (!res.ok) throw new Error('Failed to create assignment');
  return res.json();
};

export const submitWellnessResponse = async (data: Partial<WellnessResponse>): Promise<WellnessResponse> => {
  const res = await fetch(API_BASE + '/api/wellness/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to submit response');
  return res.json();
};

export const fetchCounsellingSessions = async (empId?: string): Promise<CounsellingSession[]> => {
  const url = empId ? `${API_BASE}/api/wellness/counselling?empId=${empId}` : API_BASE + '/api/wellness/counselling';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
};

export const createCounsellingSession = async (s: Partial<CounsellingSession>): Promise<CounsellingSession> => {
  const res = await fetch(API_BASE + '/api/wellness/counselling', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(s)
  });
  if (!res.ok) throw new Error('Failed to create session');
  return res.json();
};

export const sendCounsellingMessage = async (sessionId: string, text: string, senderId: string): Promise<CounsellingMessage> => {
  const res = await fetch(`${API_BASE}/api/wellness/counselling/${sessionId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, sender_id: senderId })
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
};

export const fetchDailyFeedbacks = async (): Promise<DailyFeedback[]> => {
  const res = await fetch(API_BASE + '/api/wellness/daily-feedback');
  if (!res.ok) throw new Error('Failed to fetch daily feedbacks');
  return res.json();
};

export const submitDailyFeedback = async (data: Partial<DailyFeedback>): Promise<DailyFeedback> => {
  const res = await fetch(API_BASE + '/api/wellness/daily-feedback', {
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
  const res = await fetch(API_BASE + '/api/interns/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to register intern');
  return res.json();
};

export const loginIntern = async (internId: string, password: string): Promise<Intern> => {
  const res = await fetch(API_BASE + '/api/interns/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ internId, password })
  });
  if (!res.ok) throw new Error('Invalid intern credentials');
  return res.json();
};


export const fetchPositions = async (retries = 3): Promise<Position[]> => {
  try {
    const { data, error } = await supabase.from('positions').select('*');
    if (error) throw error;
    return data || [];
  } catch (error: any) {
    if (retries > 0) {
      console.warn(`Backend fetch failed for positions, retrying in 1s... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchPositions(retries - 1);
    }
    console.warn('Backend fetch failed:', error.message);
    return [];
  }
};

export const createPosition = async (pos: Partial<Position>): Promise<Position> => {
  const newId = pos.id || `POS_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const payload = { ...pos, id: newId };
  const { data, error } = await supabase.from('positions').insert(payload).select('*').single();
  if (error) throw new Error(error.message || 'Failed to create position');
  return data;
};

export const updatePosition = async (id: string, pos: Partial<Position>): Promise<Position> => {
  const { data, error } = await supabase.from('positions').update(pos).eq('id', id).select('*').single();
  if (error) throw new Error(error.message || 'Failed to update position');
  return data;
};

export const deletePosition = async (id: string): Promise<void> => {
  const { error } = await supabase.from('positions').delete().eq('id', id);
  if (error) throw new Error(error.message || 'Failed to delete position');
};

export const fetchInterns = async (): Promise<Intern[]> => {
  const res = await fetch(API_BASE + '/api/interns');
  if (!res.ok) throw new Error('Failed to fetch interns');
  return res.json();
};

export const updateIntern = async (id: string, updates: Partial<Intern>): Promise<Intern> => {
  const res = await fetch(`${API_BASE}/api/interns/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update intern');
  return res.json();
};

export const submitInternReport = async (data: Partial<InternReport>): Promise<InternReport> => {
  const res = await fetch(API_BASE + '/api/interns/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to submit report or report already submitted for today');
  return res.json();
};

export const fetchInternReports = async (internId?: string): Promise<InternReport[]> => {
  const url = internId ? `${API_BASE}/api/interns/reports/${internId}` : API_BASE + '/api/interns/reports';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch intern reports');
  return res.json();
};

export const resetDatabase = async (): Promise<{ success: boolean; message: string }> => {
  const res = await fetch(API_BASE + '/api/system/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to reset database data');
  return res.json();
};

// ─── USER ENGAGEMENT ANALYTICS ───────────────────────────────────────
export interface UserEngagement {
  employee_id: string;
  full_name: string;
  department: string;
  designation: string;
  business_unit: string;
  dashboard_access: string;
  employment_status: string;
  photo_url: string;
  join_date?: string;
  feedback_count: number;
  chat_count: number;
  login_days: number;
  feedback_score: number;
  chat_score: number;
  login_score: number;
  score: number;
  rating: 'Good' | 'Okay' | 'Low Interactive';
}

export const fetchUserEngagement = async (): Promise<UserEngagement[]> => {
  const { data: employees, error: empError } = await supabase.from('employees').select('*');
  if (empError) throw new Error(empError.message);
  
  const now = Date.now();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: feedbacks } = await supabase
    .from('daily_feedbacks')
    .select('employee_id')
    .gte('date', thirtyDaysAgo);

  const { data: sessions } = await supabase
    .from('counselling_sessions')
    .select('messages');
    
  const feedbackCountMap = new Map<string, number>();
  if (feedbacks) {
    for (const f of feedbacks) {
      feedbackCountMap.set(f.employee_id, (feedbackCountMap.get(f.employee_id) || 0) + 1);
    }
  }

  const chatCountMap = new Map<string, number>();
  if (sessions) {
    for (const s of sessions) {
      const msgs = Array.isArray(s.messages) ? s.messages : [];
      for (const m of msgs) {
        if (m && m.sender_id) {
          chatCountMap.set(m.sender_id, (chatCountMap.get(m.sender_id) || 0) + 1);
        }
      }
    }
  }

  const result: UserEngagement[] = (employees || []).map((emp: any) => {
    const feedbackCount = feedbackCountMap.get(emp.id) || 0;
    const feedbackScore = Math.min(40, feedbackCount * 8); 

    const chatCount = chatCountMap.get(emp.id) || 0;
    const chatScore = Math.min(30, chatCount * 6);

    const loginDays = 0;
    const loginScore = 0;

    const score = feedbackScore + chatScore + loginScore;
    const rating: 'Good' | 'Okay' | 'Low Interactive' =
      score >= 70 ? 'Good' : score >= 40 ? 'Okay' : 'Low Interactive';

    return {
      employee_id: emp.id,
      full_name: emp.full_name,
      department: emp.department,
      designation: emp.designation,
      business_unit: emp.business_unit,
      dashboard_access: emp.dashboard_access,
      employment_status: emp.employment_status,
      photo_url: emp.photo_url || '',
      join_date: emp.join_date,
      feedback_count: feedbackCount,
      chat_count: chatCount,
      login_days: loginDays,
      feedback_score: feedbackScore,
      chat_score: chatScore,
      login_score: loginScore,
      score,
      rating
    };
  });
  
  return result;
};

// ─── KNOWLEDGE BASE API ────────────────────────────────────────────────────────

export interface KnowledgeDocument {
  id: string;
  filename: string;
  type: string;
  size: number;
  uploadDate: string;
  status: 'Processing' | 'Active' | 'Failed';
  contentSnippet?: string;
}

export const fetchKnowledgeDocuments = async (): Promise<KnowledgeDocument[]> => {
  const res = await fetch(`${API_BASE}/api/knowledge`);
  if (!res.ok) throw new Error('Failed to fetch knowledge documents');
  return res.json();
};

export const uploadKnowledgeDocument = async (file: File): Promise<KnowledgeDocument> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/knowledge/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            type: file.type || file.name.split('.').pop() || 'unknown',
            size: file.size,
            contentBase64: reader.result
          })
        });
        if (!res.ok) throw new Error('Upload failed');
        resolve(await res.json());
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

export const deleteKnowledgeDocument = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/api/knowledge/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete document');
};

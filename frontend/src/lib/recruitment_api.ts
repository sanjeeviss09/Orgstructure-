const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface JobRequisition {
  id: string;
  position_title: string;
  position_code: string;
  department: string;
  business_unit: string;
  location: string;
  reporting_manager_id: string | null;
  position_type: 'New Position' | 'Replacement Position';
  budgeted_ctc: number;
  grade: string;
  employment_type: string;
  number_of_openings: number;
  required_experience: string;
  qualification: string;
  key_skills: string;
  job_description: string;
  hiring_justification: string;
  expected_joining_date: string;
  status: 'Pending HR' | 'Pending Finance' | 'Pending Final' | 'Approved' | 'Rejected';
  created_at: string;
  is_active_link: boolean;
  link_views: number;
  applications_received: number;
}

export type CandidateStatus = 'Applied' | 'Pre-Screening' | 'HR Review' | 'Interview Scheduling' | 'Interview Completed' | 'Selected' | 'Offer Approval' | 'Offer Released' | 'Offer Accepted' | 'Joining' | 'Employee Creation' | 'Rejected' | 'Hold' | 'Withdrawn';

export interface Candidate {
  id: string;
  requisition_id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  location: string;
  
  current_company: string;
  current_designation: string;
  total_experience: string;
  relevant_experience: string;
  current_ctc: number;
  expected_ctc: number;
  notice_period: string;
  reason_for_change?: string;
  
  resume_url: string;
  payslips_url: string;
  increment_letter_url?: string;
  offer_letter_url?: string;
  relieving_letter_url?: string;
  education_certificates_url?: string;

  status: CandidateStatus;
  applied_at: string;
  
  // Pre-screening
  qualification_match?: number;
  experience_match?: number;
  industry_relevance?: number;
  technical_fit?: number;
  communication_skills?: number;
  salary_alignment?: number;
  notice_period_feasibility?: number;
  recruiter_recommendation?: 'Shortlist' | 'Reject' | 'Hold';
  recruiter_remarks?: string;

  hr_approval_status?: 'Pending' | 'Approved' | 'Rejected' | 'Hold';
}

export interface Interview {
  id: string;
  candidate_id: string;
  type: 'Online' | 'Face-to-Face';
  platform?: string;
  date: string;
  time: string;
  interview_panel: string[];
  venue_or_link: string;
  notes: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  technical_score?: number;
  communication_score?: number;
  domain_knowledge_score?: number;
  problem_solving_score?: number;
  behavioural_score?: number;
  cultural_fit_score?: number;
  overall_recommendation?: 'Select' | 'Hold' | 'Reject';
  evaluation_remarks?: string;
}

export interface Offer {
  id: string;
  candidate_id: string;
  position_id?: string;
  offered_ctc: number;
  grade: string;
  designation: string;
  joining_date: string;
  reporting_manager_id: string;
  status: 'Pending Recruiter' | 'Pending Budget Exception' | 'Pending HR Head' | 'Pending Dept Head' | 'Pending Final' | 'Offer Sent' | 'Offer Accepted' | 'Offer Declined' | 'Offer Expired' | 'Joined';
  created_at: string;
}

export interface BudgetException {
  id: string;
  offer_id: string;
  position_id: string;
  department: string;
  business_unit: string;
  budgeted_ctc: number;
  offered_ctc: number;
  variance_amount: number;
  status: 'Pending Dept Head' | 'Pending HR Head' | 'Pending Management' | 'Approved' | 'Rejected';
  created_at: string;
}

export const fetchRequisitions = async (): Promise<JobRequisition[]> => {
  const res = await fetch(API_BASE + '/api/recruitment/requisitions');
  return res.json();
};

export const createRequisition = async (req: Partial<JobRequisition>): Promise<JobRequisition> => {
  const res = await fetch(API_BASE + '/api/recruitment/requisitions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  return res.json();
};

export const updateRequisition = async (id: string, updates: Partial<JobRequisition>): Promise<JobRequisition> => {
  const res = await fetch(API_BASE + `/api/recruitment/requisitions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return res.json();
};

export const fetchCandidates = async (): Promise<Candidate[]> => {
  const res = await fetch(API_BASE + '/api/recruitment/candidates');
  return res.json();
};

export const updateCandidateStatus = async (id: string, status: string): Promise<Candidate> => {
  const res = await fetch(API_BASE + `/api/recruitment/candidates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return res.json();
};

export const submitPreScreening = async (id: string, data: any): Promise<Candidate> => {
  const res = await fetch(API_BASE + `/api/recruitment/candidates/${id}/prescreen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const submitHRApproval = async (id: string, action: string): Promise<Candidate> => {
  const res = await fetch(API_BASE + `/api/recruitment/candidates/${id}/hrapproval`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  });
  return res.json();
};

export const fetchInterviews = async (): Promise<Interview[]> => {
  const res = await fetch(API_BASE + '/api/recruitment/interviews');
  return res.json();
};

export const scheduleInterview = async (data: Partial<Interview>): Promise<Interview> => {
  const res = await fetch(API_BASE + '/api/recruitment/interviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const submitInterviewEvaluation = async (id: string, data: any): Promise<Interview> => {
  const res = await fetch(API_BASE + `/api/recruitment/interviews/${id}/evaluate`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const fetchOffers = async (): Promise<Offer[]> => {
  const res = await fetch(API_BASE + '/api/recruitment/offers');
  return res.json();
};

export const createOffer = async (data: Partial<Offer>): Promise<Offer> => {
  const res = await fetch(API_BASE + '/api/recruitment/offers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const approveOffer = async (id: string, role: string, action: string): Promise<Offer> => {
  const res = await fetch(API_BASE + `/api/recruitment/offers/${id}/approve`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, action })
  });
  return res.json();
};

export const submitCandidateApplication = async (formData: FormData): Promise<Candidate> => {
  const res = await fetch(API_BASE + '/api/recruitment/candidates/apply', {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const d = await res.json();
    throw new Error(d.error || 'Failed to submit application');
  }
  return res.json();
};

export const fetchDashboardMetrics = async () => {
  const res = await fetch(API_BASE + '/api/recruitment/dashboard');
  return res.json();
};

export const deleteRequisition = async (id: string): Promise<any> => {
  const res = await fetch(API_BASE + `/api/recruitment/requisitions/${id}`, {
    method: 'DELETE'
  });
  return res.json();
};

export const deleteCandidate = async (id: string): Promise<any> => {
  const res = await fetch(API_BASE + `/api/recruitment/candidates/${id}`, {
    method: 'DELETE'
  });
  return res.json();
};

export const fetchBudgetExceptions = async (): Promise<BudgetException[]> => {
  const res = await fetch(API_BASE + '/api/recruitment/budget-exceptions');
  return res.json();
};

export const approveBudgetException = async (id: string, action: 'Approve' | 'Reject', role: 'Dept Head' | 'HR Head' | 'Management'): Promise<BudgetException> => {
  const res = await fetch(API_BASE + `/api/recruitment/budget-exceptions/${id}/approve`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, role })
  });
  return res.json();
};

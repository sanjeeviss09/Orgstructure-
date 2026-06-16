import express from 'express';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import {
  getJobRequisitions, addJobRequisition, updateJobRequisition, getJobRequisitionById, deleteJobRequisition,
  getCandidates, addCandidate, updateCandidate, getCandidateById, deleteCandidate, Candidate, JobRequisition,
  getInterviews, addInterview, updateInterview, getInterviewById, Interview,
  getOffers, addOffer, updateOffer, getOfferById, Offer,
  getEmployees, addEmployee, updatePosition, Employee, PositionStatus, Position, getPositions, addPosition,
  addBudgetException, BudgetException, getBudgetExceptions, updateBudgetException, getBudgetExceptionById
} from './data/database';

export const recruitmentRouter = express.Router();

// ─── SETUP MULTER FOR FILE UPLOADS ────────────────────────────────────
const UPLOAD_BASE_DIR = 'B:\\Resume';

// Ensure base dir exists
if (!fs.existsSync(UPLOAD_BASE_DIR)) {
  fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Generate a unique folder per candidate based on email or a temporary id
    const candidateIdentifier = req.body.email || `temp_${Date.now()}`;
    // Sanitize identifier
    const safeIdentifier = candidateIdentifier.replace(/[^a-zA-Z0-9_-]/g, '_');
    const destDir = path.join(UPLOAD_BASE_DIR, safeIdentifier);
    
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    cb(null, destDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// ─── SETUP EMAIL SERVICE ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.supabase.co', // Use Supabase SMTP or generic
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'test-user',
    pass: process.env.SMTP_PASS || 'test-pass',
  },
});

const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Axxel HR Suite" <noreply@axxel.com>',
        to,
        subject,
        text
      });
      console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
    } else {
      console.log(`[MOCK EMAIL SENT] To: ${to} | Subject: ${subject}\nContent: ${text}`);
    }
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};

// ─── REQUISITIONS ──────────────────────────────────────────────────
recruitmentRouter.get('/requisitions', (req, res) => {
  res.json(getJobRequisitions());
});

recruitmentRouter.post('/requisitions', (req, res) => {
  try {
    const newReq: JobRequisition = {
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      ...req.body,
      status: 'Pending HR',
      created_at: new Date().toISOString(),
      is_active_link: false,
      link_views: 0,
      applications_received: 0
    };
    addJobRequisition(newReq);
    res.status(201).json(newReq);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create requisition' });
  }
});

recruitmentRouter.put('/requisitions/:id', (req, res) => {
  const updates = req.body;
  if (updates.status === 'Approved') {
    updates.is_active_link = true;
  }
  const updated = updateJobRequisition(req.params.id, updates);
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Requisition not found' });
  }
});

recruitmentRouter.get('/requisitions/:id', (req, res) => {
  const reqObj = getJobRequisitionById(req.params.id);
  if (reqObj) {
    // If tracking link views, maybe increment here if public flag is sent, but let's just return it
    res.json(reqObj);
  } else {
    res.status(404).json({ error: 'Requisition not found' });
  }
});

recruitmentRouter.delete('/requisitions/:id', (req, res) => {
  const deleted = deleteJobRequisition(req.params.id);
  if (deleted) {
    res.json({ success: true, message: 'Requisition deleted successfully', requisition: deleted });
  } else {
    res.status(404).json({ error: 'Requisition not found' });
  }
});

// ─── CANDIDATES ────────────────────────────────────────────────────
recruitmentRouter.get('/candidates', (req, res) => {
  res.json(getCandidates());
});

recruitmentRouter.get('/candidates/:id', (req, res) => {
  const cand = getCandidateById(req.params.id);
  if (cand) {
    res.json(cand);
  } else {
    res.status(404).json({ error: 'Candidate not found' });
  }
});

recruitmentRouter.delete('/candidates/:id', (req, res) => {
  const deleted = deleteCandidate(req.params.id);
  if (deleted) {
    res.json({ success: true, message: 'Candidate deleted successfully', candidate: deleted });
  } else {
    res.status(404).json({ error: 'Candidate not found' });
  }
});

// Public application endpoint
recruitmentRouter.post(
  '/candidates/apply',
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'payslips', maxCount: 3 },
    { name: 'increment_letter', maxCount: 1 },
    { name: 'offer_letter', maxCount: 1 },
    { name: 'relieving_letter', maxCount: 1 },
    { name: 'education_certificates', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const body = req.body;

      const newCand: Candidate = {
        id: `CAND-${Math.floor(10000 + Math.random() * 90000)}`,
        requisition_id: body.requisition_id,
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        mobile_number: body.mobile_number,
        location: body.location,
        
        current_company: body.current_company,
        current_designation: body.current_designation,
        total_experience: body.total_experience,
        relevant_experience: body.relevant_experience,
        current_ctc: Number(body.current_ctc),
        expected_ctc: Number(body.expected_ctc),
        notice_period: body.notice_period,
        reason_for_change: body.reason_for_change,
        
        resume_url: files['resume']?.[0]?.path || '',
        payslips_url: files['payslips']?.[0]?.path || '',
        increment_letter_url: files['increment_letter']?.[0]?.path,
        offer_letter_url: files['offer_letter']?.[0]?.path,
        relieving_letter_url: files['relieving_letter']?.[0]?.path,
        education_certificates_url: files['education_certificates']?.[0]?.path,

        status: 'Applied',
        applied_at: new Date().toISOString()
      };

      addCandidate(newCand);

      // Increment application count on requisition
      if (body.requisition_id) {
        const reqObj = getJobRequisitionById(body.requisition_id);
        if (reqObj) {
          updateJobRequisition(body.requisition_id, {
            applications_received: (reqObj.applications_received || 0) + 1
          });
        }
      }

      await sendEmail(
        newCand.email,
        'Application Received - Axxel Corp',
        `Dear ${newCand.first_name},\n\nThank you for applying to Axxel. Your candidate ID is ${newCand.id}. Our HR team will review your application.\n\nBest,\nAxxel Talent Acquisition`
      );

      res.status(201).json(newCand);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to submit application' });
    }
  }
);

recruitmentRouter.put('/candidates/:id', async (req, res) => {
  const cand = getCandidateById(req.params.id);
  if (!cand) return res.status(404).json({ error: 'Candidate not found' });
  
  const oldStatus = cand.status;
  const updated = updateCandidate(req.params.id, req.body);
  
  if (updated && updated.status !== oldStatus) {
    if (updated.status === 'Rejected') {
      await sendEmail(updated.email, 'Application Update - Axxel', 'We regret to inform you that we will not be moving forward with your application at this time.');
    }
    if (updated.status === 'Joining' && oldStatus !== 'Joining') {
      // Integration point: Automatic Employee Creation
      handleCandidateJoining(updated);
    }
  }
  
  res.json(updated);
});

// ─── PRE-SCREENING & HR APPROVAL ──────────────────────────────────
recruitmentRouter.post('/candidates/:id/prescreen', async (req, res) => {
  const updated = updateCandidate(req.params.id, {
    ...req.body,
    status: 'HR Review'
  });
  if (updated) {
    // Notify Head HR
    await sendEmail('head.hr@axxel.com', `Candidate Evaluation Ready: ${updated.first_name} ${updated.last_name}`, `Recruiter evaluation submitted for Candidate ${updated.id}. Please review in the portal.`);
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Candidate not found' });
  }
});

recruitmentRouter.post('/candidates/:id/hrapproval', async (req, res) => {
  const { action } = req.body; // 'Approve', 'Reject', 'Hold'
  const newStatus = action === 'Approve' ? 'Interview Scheduling' : action === 'Reject' ? 'Rejected' : 'Hold';
  
  const updated = updateCandidate(req.params.id, {
    hr_approval_status: action,
    status: newStatus
  });

  if (updated) {
    if (action === 'Reject') {
      await sendEmail(updated.email, 'Application Update - Axxel', 'We regret to inform you that we will not be moving forward with your application at this time.');
    }
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Candidate not found' });
  }
});

// ─── INTERVIEWS ────────────────────────────────────────────────────
recruitmentRouter.get('/interviews', (req, res) => {
  res.json(getInterviews());
});

recruitmentRouter.post('/interviews', async (req, res) => {
  try {
    let venueOrLink = req.body.venue_or_link;
    if (req.body.type === 'Online' && req.body.platform === 'MS Teams' && (!venueOrLink || venueOrLink.trim() === '')) {
      venueOrLink = `https://teams.microsoft.com/l/meetup-join/19%3ameeting_${crypto.randomBytes(8).toString('hex')}%40thread.v2/0?context=%7b%22Tid%22%3a%22mock-tenant-id%22%2c%22Oid%22%3a%22mock-oid%22%7d`;
    }

    const i: Interview = {
      id: `INT-${Math.floor(1000 + Math.random() * 9000)}`,
      ...req.body,
      venue_or_link: venueOrLink,
      status: 'Scheduled'
    };
    addInterview(i);
    
    // Update candidate status
    updateCandidate(i.candidate_id, { status: 'Interview Scheduling' });
    
    const cand = getCandidateById(i.candidate_id);
    if (cand) {
      // Email to Candidate
      const platformStr = i.type === 'Online' ? ` via ${i.platform || 'Online'}` : '';
      await sendEmail(
        cand.email,
        'Interview Scheduled - Axxel',
        `Dear ${cand.first_name},\n\nYour interview has been scheduled for ${i.date} at ${i.time}${platformStr}.\n\nVenue/Link: ${i.venue_or_link}\n\nPlease be prepared.\n\nBest,\nAxxel Talent Acquisition`
      );

      // Email to HR
      await sendEmail(
        'head.hr@axxel.com',
        'Interview Scheduled Notification',
        `An interview has been scheduled for candidate ${cand.first_name} ${cand.last_name}.\n\nDate: ${i.date}\nTime: ${i.time}\nMode: ${i.type}${platformStr}\nVenue/Link: ${i.venue_or_link}`
      );
    }

    res.status(201).json(i);
  } catch (e) {
    res.status(500).json({ error: 'Failed to schedule interview' });
  }
});

recruitmentRouter.put('/interviews/:id/evaluate', async (req, res) => {
  const updated = updateInterview(req.params.id, {
    ...req.body,
    status: 'Completed'
  });
  if (updated) {
    const candStatus = updated.overall_recommendation === 'Select' ? 'Selected' : 
                       updated.overall_recommendation === 'Reject' ? 'Rejected' : 'Hold';
    updateCandidate(updated.candidate_id, { status: candStatus });
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Interview not found' });
  }
});

// ─── OFFERS ────────────────────────────────────────────────────────
recruitmentRouter.get('/offers', (req, res) => {
  res.json(getOffers());
});

recruitmentRouter.post('/offers', async (req, res) => {
  try {
    const cand = getCandidateById(req.body.candidate_id);
    const reqObj = cand?.requisition_id ? getJobRequisitionById(cand.requisition_id) : null;
    const dept = reqObj?.department || '';
    const title = reqObj?.position_title || cand?.current_designation || '';

    // Find a vacant position in the given department
    const positions = getPositions();
    const vacantPos = positions.find(p => p.status === 'V' && p.department === dept && (p.title === title || p.title === 'Unspecified Role'));

    const positionId = vacantPos ? vacantPos.id : `P_${crypto.randomUUID().substring(0, 8)}`;
    const budgetedCtc = vacantPos ? (vacantPos.budgeted_ctc || 0) : 0;

    const activeOffers = getOffers().filter(o => o.position_id === positionId && (o.status !== 'Offer Declined' && o.status !== 'Offer Expired'));
    const offeredCtcSoFar = activeOffers.reduce((sum, o) => sum + o.offered_ctc, 0);

    const availableBudget = budgetedCtc - offeredCtcSoFar;
    const offeredCtc = Number(req.body.offered_ctc);
    const exceedsBudget = offeredCtc > availableBudget;

    const o: Offer = {
      id: `OFF-${Math.floor(1000 + Math.random() * 9000)}`,
      ...req.body,
      position_id: positionId,
      status: exceedsBudget ? 'Pending Budget Exception' : 'Pending HR Head',
      created_at: new Date().toISOString()
    };

    addOffer(o);

    if (exceedsBudget) {
      const exc: BudgetException = {
        id: `BEXC-${Math.floor(1000 + Math.random() * 9000)}`,
        offer_id: o.id,
        position_id: positionId,
        department: dept,
        business_unit: vacantPos?.business_unit || '',
        budgeted_ctc: budgetedCtc,
        offered_ctc: offeredCtc,
        variance_amount: offeredCtc - availableBudget,
        status: 'Pending Dept Head',
        created_at: new Date().toISOString()
      };
      addBudgetException(exc);
      updateCandidate(o.candidate_id, { status: 'Offer Approval' });
      res.status(201).json({ ...o, budget_exception: true });
    } else {
      updateCandidate(o.candidate_id, { status: 'Offer Approval' });
      res.status(201).json(o);
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to create offer' });
  }
});

recruitmentRouter.get('/budget-exceptions', (req, res) => {
  res.json(getBudgetExceptions());
});

recruitmentRouter.put('/budget-exceptions/:id/approve', async (req, res) => {
  const { action, role } = req.body;
  const exc = getBudgetExceptionById(req.params.id);
  if (!exc) return res.status(404).json({ error: 'Exception not found' });

  let newStatus = exc.status;
  if (role === 'Dept Head' && action === 'Approve') newStatus = 'Pending HR Head';
  else if (role === 'HR Head' && action === 'Approve') newStatus = 'Pending Management';
  else if (role === 'Management' && action === 'Approve') newStatus = 'Approved';
  else if (action === 'Reject') newStatus = 'Rejected';

  const updatedExc = updateBudgetException(req.params.id, { status: newStatus });
  
  // If fully approved, resume offer workflow
  if (newStatus === 'Approved') {
    const offer = getOfferById(exc.offer_id);
    if (offer) {
      updateOffer(offer.id, { status: 'Pending HR Head' });
    }
  } else if (newStatus === 'Rejected') {
    const offer = getOfferById(exc.offer_id);
    if (offer) {
      updateOffer(offer.id, { status: 'Offer Declined' });
      updateCandidate(offer.candidate_id, { status: 'Rejected' });
    }
  }

  res.json(updatedExc);
});

recruitmentRouter.put('/offers/:id/approve', async (req, res) => {
  const { action, role } = req.body; 
  const offer = getOfferById(req.params.id);
  if (!offer) return res.status(404).json({ error: 'Offer not found' });

  let newStatus = offer.status;
  if (role === 'HR Head' && action === 'Approve') newStatus = 'Pending Dept Head';
  else if (role === 'Dept Head' && action === 'Approve') newStatus = 'Pending Final';
  else if (role === 'Final' && action === 'Approve') {
    newStatus = 'Offer Sent';
    updateCandidate(offer.candidate_id, { status: 'Offer Released' });
    const cand = getCandidateById(offer.candidate_id);
    if (cand) {
      await sendEmail(
        cand.email,
        'Offer of Employment - Axxel',
        `Congratulations ${cand.first_name}! We are pleased to offer you the position. Please log in to accept the offer.`
      );
    }
  } else if (action === 'Reject') {
    newStatus = 'Offer Declined'; // Internal rejection stops the offer
  }

  const updated = updateOffer(req.params.id, { status: newStatus });
  res.json(updated);
});

recruitmentRouter.put('/offers/:id/candidate-action', async (req, res) => {
  const { action } = req.body; // 'Accept', 'Decline'
  const newStatus = action === 'Accept' ? 'Offer Accepted' : 'Offer Declined';
  
  const updated = updateOffer(req.params.id, { status: newStatus });
  if (updated) {
    updateCandidate(updated.candidate_id, { status: action === 'Accept' ? 'Offer Accepted' : 'Withdrawn' });
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Offer not found' });
  }
});

// ─── DASHBOARD ANALYTICS ──────────────────────────────────────────
recruitmentRouter.get('/dashboard', (req, res) => {
  const cands = getCandidates();
  const reqs = getJobRequisitions();
  
  const openPositions = reqs.filter(r => r.status === 'Approved').reduce((acc, r) => acc + r.number_of_openings, 0);
  const shortlisted = cands.filter(c => c.status === 'HR Review' || c.status === 'Interview Scheduling' || c.status === 'Interview Completed').length;
  const interviewed = cands.filter(c => c.status === 'Interview Scheduling' || c.status === 'Interview Completed' || c.status === 'Selected' || c.status === 'Offer Released' || c.status === 'Offer Accepted' || c.status === 'Joining' || c.status === 'Employee Creation').length;
  const selected = cands.filter(c => c.status === 'Selected' || c.status === 'Offer Released' || c.status === 'Offer Accepted' || c.status === 'Joining' || c.status === 'Employee Creation').length;

  // Dynamic Department Hiring Trend (last 6 months)
  const departments = [...new Set(reqs.map(r => r.department))];
  const last6Months = Array.from({length: 6}, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.getMonth();
  });
  
  const deptHiringTrend = departments.map(d => {
    const deptCands = cands.filter(c => c.requisition_id && reqs.find(r => r.id === c.requisition_id)?.department === d);
    const trend = last6Months.map(month => {
      return deptCands.filter(c => new Date(c.applied_at).getMonth() === month).length;
    });
    return { department: d, trend };
  });

  // Dynamic Recruiter Productivity (using department as proxy since there's no recruiter_id)
  const recruiterProductivity = departments.map(d => {
    const deptCands = cands.filter(c => c.requisition_id && reqs.find(r => r.id === c.requisition_id)?.department === d);
    const screened = deptCands.filter(c => c.status !== 'Applied').length;
    const closed = reqs.filter(r => r.department === d && !r.is_active_link).length;
    return { name: d, positionsClosed: closed, candidatesScreened: screened };
  });

  const applicationsReceived = cands.length;
  const offered = cands.filter(c => c.status === 'Offer Released' || c.status === 'Offer Accepted' || c.status === 'Joining' || c.status === 'Employee Creation').length;
  const joined = cands.filter(c => c.status === 'Employee Creation' || c.status === 'Joining').length;
  const rejected = cands.filter(c => c.status === 'Rejected').length;
  const hold = cands.filter(c => c.status === 'Hold').length;
  
  // Calculate Time to Hire & Cost per Hire from accepted offers
  const acceptedOffers = getOffers().filter(o => o.status === 'Offer Accepted' || o.status === 'Joined');
  let totalTimeToHire = 0;
  let totalCostPerHire = 0;
  let countAccepted = 0;
  
  acceptedOffers.forEach(o => {
    const cand = cands.find(c => c.id === o.candidate_id);
    if (cand) {
      const days = (new Date(o.created_at).getTime() - new Date(cand.applied_at).getTime()) / (1000 * 3600 * 24);
      totalTimeToHire += Math.max(0, days);
      totalCostPerHire += (o.offered_ctc * 0.0833); // 1 month salary as proxy for agency fee
      countAccepted++;
    }
  });

  const timeToHire = countAccepted > 0 ? Math.round(totalTimeToHire / countAccepted) : 0;
  const costPerHire = countAccepted > 0 ? Math.round(totalCostPerHire / countAccepted) : 0;

  res.json({
    openPositions,
    applicationsReceived,
    shortlisted,
    interviewed,
    selected,
    offered,
    joined,
    rejected,
    hold,
    offerAcceptanceRate: offered > 0 ? (cands.filter(c => c.status === 'Offer Accepted' || c.status === 'Joining' || c.status === 'Employee Creation').length / offered) * 100 : 0,
    timeToHire,
    costPerHire,
    vacancyClosureRate: openPositions > 0 ? Math.round((joined / (openPositions + joined)) * 100) : 0,
    deptHiringTrend,
    recruiterProductivity
  });
});

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────

const handleCandidateJoining = (cand: Candidate) => {
  // Check if they are already converted
  const existingEmployees = getEmployees();
  if (existingEmployees.some(e => e.email_official === cand.email)) return;

  const reqObj = cand.requisition_id ? getJobRequisitionById(cand.requisition_id) : null;
  const offerObj = getOffers().find(o => o.candidate_id === cand.id);

  // Determine Position ID logic
  const positions = getPositions();
  let posId = `P_${crypto.randomUUID().substring(0, 8)}`;
  
  if (reqObj) {
    if (reqObj.position_type === 'Replacement Position') {
      // Find a vacant position in that department with that title? Or just create a new one representing the replacement
      const vacantPos = positions.find(p => p.department === reqObj.department && p.title === reqObj.position_title && p.status === 'V');
      if (vacantPos) {
        posId = vacantPos.id;
        updatePosition(vacantPos.id, { status: 'A' });
      }
    } else {
      // New Position, headcount automatically increases as we just create a new position
      const newPos: Position = {
        id: posId,
        title: reqObj.position_title,
        department: reqObj.department,
        business_unit: reqObj.business_unit,
        reporting_to_position_id: null,
        status: 'A',
        budgeted_ctc: offerObj ? offerObj.offered_ctc : reqObj.budgeted_ctc
      };
      addPosition(newPos);
    }
  }

  const newEmp: Employee = {
    id: crypto.randomUUID(),
    emp_id: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
    full_name: `${cand.first_name} ${cand.last_name}`,
    company_name: 'Axxel Corp',
    business_unit: reqObj ? reqObj.business_unit : 'HQ',
    department: reqObj ? reqObj.department : 'General',
    designation: offerObj ? offerObj.designation : (reqObj ? reqObj.position_title : 'New Employee'),
    role_tier: 5,
    employment_status: 'Active',
    email_official: cand.email,
    ctc_annual: offerObj ? offerObj.offered_ctc : cand.expected_ctc,
    ctc_currency: 'INR',
    budget_allocated: offerObj ? offerObj.offered_ctc * 1.2 : cand.expected_ctc * 1.2,
    dashboard_access: 'Employee',
    reporting_to_id: offerObj ? offerObj.reporting_manager_id : null,
    photo_url: `https://i.pravatar.cc/150?u=${cand.id}`,
    join_date: offerObj ? offerObj.joining_date : new Date().toISOString(),
    past_organization: cand.current_company,
    total_experience: cand.total_experience,
    education_qualification: cand.qualification_match ? 'Matched' : 'Pending',
    position_id: posId
  };

  addEmployee(newEmp);
  if (offerObj) {
    updateOffer(offerObj.id, { status: 'Joined' as any });
  }
  updateCandidate(cand.id, { status: 'Employee Creation' });
  console.log(`[SYSTEM] Candidate ${cand.id} automatically converted to Employee ${newEmp.emp_id}`);

  // Auto-close requisition link if openings met
  if (reqObj) {
    const hiredCount = getCandidates().filter(c => c.requisition_id === reqObj.id && (c.status === 'Employee Creation' || c.status === 'Joining')).length;
    if (hiredCount >= reqObj.number_of_openings) {
      updateJobRequisition(reqObj.id, { is_active_link: false });
      console.log(`[SYSTEM] Requisition ${reqObj.id} filled. Link disabled.`);
    }
  }
};

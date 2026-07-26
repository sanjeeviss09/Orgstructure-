import express from 'express'; 
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
const pdfParse = require('pdf-parse');
import {
  getJobRequisitions, addJobRequisition, updateJobRequisition, getJobRequisitionById, deleteJobRequisition,
  getCandidates, addCandidate, updateCandidate, getCandidateById, deleteCandidate, Candidate, JobRequisition,
  getInterviews, addInterview, updateInterview, getInterviewById, Interview,
  getOffers, addOffer, updateOffer, getOfferById, Offer,
  getEmployees, addEmployee, updatePosition, Employee, PositionStatus, Position, getPositions, addPosition,
  addBudgetException, BudgetException, getBudgetExceptions, updateBudgetException, getBudgetExceptionById
} from './data/database';

export const recruitmentRouter = express.Router();

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

// ─── SETUP MULTER FOR FILE UPLOADS ────────────────────────────────────
// Using memory storage so we can upload the buffer directly to Supabase or send via email
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Setup Nodemailer moved down

// Helper function to upload file to Supabase Storage
export const uploadFileToSupabase = async (file: Express.Multer.File | undefined, candidateId: string): Promise<string | undefined> => {
  if (!file) return undefined;
  try {
    const ext = path.extname(file.originalname);
    const fileName = `${candidateId}/${file.fieldname}_${Date.now()}${ext}`;
    
    const { error } = await supabase.storage.from('resumes').upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });
    
    if (error) {
      console.error('Supabase upload error:', error.message);
      return undefined;
    }
    
    const { data } = supabase.storage.from('resumes').getPublicUrl(fileName);
    return data.publicUrl;
  } catch (err) {
    console.error('Error uploading file:', err);
    return undefined;
  }
};

// Helper function to delete candidate files from Supabase Storage
const deleteCandidateFiles = async (candidateId: string) => {
  try {
    const { data, error } = await supabase.storage.from('resumes').list(candidateId);
    if (error || !data || data.length === 0) return;
    
    const filesToRemove = data.map(file => `${candidateId}/${file.name}`);
    const { error: removeError } = await supabase.storage.from('resumes').remove(filesToRemove);
    if (removeError) {
      console.error('Failed to remove files from Supabase:', removeError.message);
    } else {
      console.log(`[SYSTEM] Deleted files for candidate ${candidateId} from Supabase.`);
    }
  } catch (err) {
    console.error('Error deleting files:', err);
  }
};

// ─── SETUP EMAIL SERVICE ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sanjeevinick09@gmail.com',
    pass: 'nbkb drco vkqo julw'
  }
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

recruitmentRouter.post('/requisitions', upload.fields([{ name: 'jd_file', maxCount: 1 }, { name: 'poster_file', maxCount: 1 }]), async (req, res) => {
  try {
    const reqId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    let jd_url = '';
    let extractedJDText = '';
    let poster_url = '';

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (files && files['jd_file'] && files['jd_file'][0]) {
      const file = files['jd_file'][0];
      jd_url = await uploadFileToSupabase(file, reqId) || '';
      if (file.mimetype === 'application/pdf') {
        const pdfData = await pdfParse(file.buffer);
        extractedJDText = pdfData.text.trim();
      }
    }

    if (files && files['poster_file'] && files['poster_file'][0]) {
      const file = files['poster_file'][0];
      poster_url = await uploadFileToSupabase(file, reqId) || '';
    }

    let reqPositionId = undefined;

    if (req.body.position_type === 'Replacement Position' && req.body.replaced_employee_id) {
      const replacedEmp = getEmployees().find(e => e.id === req.body.replaced_employee_id);
      if (replacedEmp && replacedEmp.position_id) {
        reqPositionId = replacedEmp.position_id;
      }
    } else {
      reqPositionId = `P_${crypto.randomUUID().substring(0, 8)}`;
      let reportingToPosId = null;
      if (req.body.reporting_manager_id) {
        const manager = getEmployees().find(e => e.id === req.body.reporting_manager_id);
        if (manager && manager.position_id) {
          reportingToPosId = manager.position_id;
        }
      }

      const newPos: Position = {
        id: reqPositionId,
        title: req.body.position_title,
        department: req.body.department,
        business_unit: req.body.business_unit,
        reporting_to_position_id: reportingToPosId,
        status: 'V',
        budgeted_ctc: Number(req.body.budgeted_ctc) || 0
      };
      addPosition(newPos);
    }

    const newReq: JobRequisition = {
      id: reqId,
      ...req.body,
      job_description: extractedJDText ? `${req.body.job_description}\n\n[Parsed from JD Document]:\n${extractedJDText}` : req.body.job_description,
      jd_url,
      poster_url,
      position_id: reqPositionId,
      replaced_employee_id: req.body.replaced_employee_id,
      status: 'Pending HR',
      created_at: new Date().toISOString(),
      is_active_link: false,
      link_views: 0,
      applications_received: 0
    };
    addJobRequisition(newReq);
    res.status(201).json(newReq);
  } catch (e) {
    console.error(e);
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

recruitmentRouter.delete('/candidates/:id', async (req, res) => {
  const deleted = deleteCandidate(req.params.id);
  if (deleted) {
    await deleteCandidateFiles(req.params.id);
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
      const candId = `CAND-${Math.floor(10000 + Math.random() * 90000)}`;

      // Upload files to Supabase
      const resume_url = await uploadFileToSupabase(files['resume']?.[0], candId);
      const payslips_url = await uploadFileToSupabase(files['payslips']?.[0], candId);
      const increment_letter_url = await uploadFileToSupabase(files['increment_letter']?.[0], candId);
      const offer_letter_url = await uploadFileToSupabase(files['offer_letter']?.[0], candId);
      const relieving_letter_url = await uploadFileToSupabase(files['relieving_letter']?.[0], candId);
      const education_certificates_url = await uploadFileToSupabase(files['education_certificates']?.[0], candId);

      const newCand: Candidate = {
        id: candId,
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
        
        resume_url: resume_url || '',
        payslips_url: payslips_url || '',
        increment_letter_url: increment_letter_url,
        offer_letter_url: offer_letter_url,
        relieving_letter_url: relieving_letter_url,
        education_certificates_url: education_certificates_url,

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

// ─── AI RESUME UPLOAD ────────────────────────────────────────────────
recruitmentRouter.post(
  '/candidates/ai-upload',
  upload.single('resume'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Resume file is required' });
      }

      // 1. Extract text from PDF
      const pdfData = await pdfParse(req.file.buffer);
      const resumeText = pdfData.text.substring(0, 4000); // Limit context length

      // 2. Prepare Context (either specific req or all active reqs for auto-match)
      let contextText = '';
      let isAutoMatch = false;
      const specificReqId = req.body.requisition_id;
      
      if (specificReqId) {
        const reqObj = getJobRequisitionById(specificReqId);
        if (!reqObj) return res.status(404).json({ error: 'Requisition not found' });
        contextText = `
        Job Requisition Title: ${reqObj.position_title} (ID: ${reqObj.id})
        Required Experience: ${reqObj.required_experience}
        Key Skills: ${reqObj.key_skills}
        Job Description: ${reqObj.job_description}
        `;
      } else {
        isAutoMatch = true;
        const allReqs = getJobRequisitions().filter(r => ['Approved', 'Pending HR'].includes(r.status));
        const reqsList = allReqs.map(r => `ID: ${r.id} | Title: ${r.position_title} | Skills: ${r.key_skills} | Description Snippet: ${r.job_description ? r.job_description.substring(0, 1000) : ''}`).join('\n\n');
        contextText = `
        Available Job Requisitions:
        ${reqsList}
        `;
      }

      // 3. Call NVIDIA AI to extract info and evaluate suitability
      const promptText = `
        You are an expert HR AI Assistant. 
        Extract the candidate details from the provided resume text.
        
        ${isAutoMatch ? 'You MUST evaluate the candidate against the Available Job Requisitions provided above and output the ID of the single best matching requisition in "matched_requisition_id". If no good match, output the ID of the closest match.' : 'Evaluate the candidate for the provided Job Requisition.'}
        
        CRITICAL EXTRACTION RULES:
        1. "total_experience": Calculate the precise total duration of all work experiences if not explicitly stated. Output clearly (e.g., '5 Years').
        2. "relevant_experience": Estimate the exact years of experience highly relevant to their primary role or the matched requisition.
        3. "location": Extract the candidate's current residential city and state (or country) EXACTLY as written in their contact information. Do NOT guess or hallucinate locations.
        
        Context:
        ${contextText}

        Resume Text:
        ${resumeText}

        Respond ONLY with a valid JSON object matching this exact structure (no markdown formatting, just raw JSON):
        {
          "matched_requisition_id": "String (Only required if auto-matching)",
          "first_name": "String",
          "last_name": "String",
          "email": "String (extract or guess if missing)",
          "mobile_number": "String (extract or guess if missing)",
          "location": "String",
          "highest_qualification": "String",
          "current_company": "String",
          "current_designation": "String",
          "total_experience": "String (e.g. '5 Years')",
          "relevant_experience": "String",
          "qualification_match": "Number 1-10",
          "experience_match": "Number 1-10",
          "industry_relevance": "Number 1-10",
          "technical_fit": "Number 1-10",
          "communication_skills": "Number 1-10"
        }
      `;

      const aiRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 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'
        },
        body: JSON.stringify({
          model: 'meta/llama-3.1-8b-instruct',
          messages: [
            { role: 'system', content: 'You are an HR AI parsing resumes and outputting ONLY strict raw JSON.' },
            { role: 'user', content: promptText }
          ],
          temperature: 0.1,
          max_tokens: 800
        })
      });

      let aiData;
      let extracted;
      if (aiRes.ok) {
        aiData = await aiRes.json();
        try {
          let content = aiData.choices[0].message.content.trim();
          if (content.startsWith('```json')) {
            content = content.replace(/^```json/, '').replace(/```$/, '').trim();
          } else if (content.startsWith('```')) {
            content = content.replace(/^```/, '').replace(/```$/, '').trim();
          }
          extracted = JSON.parse(content);
        } catch (e) {
          console.error('Failed to parse AI JSON:', aiData.choices[0].message.content);
        }
      }

      if (!extracted) {
         return res.status(500).json({ error: 'AI failed to extract structured JSON' });
      }

      const candId = `CAND-${Math.floor(10000 + Math.random() * 90000)}`;
      const resume_url = await uploadFileToSupabase(req.file, candId);

      const finalReqId = isAutoMatch ? extracted.matched_requisition_id : specificReqId;
      const reqObj = getJobRequisitionById(finalReqId);
      if (!reqObj) {
         return res.status(404).json({ error: `Matched Requisition ${finalReqId} not found` });
      }

      const newCand: Candidate = {
        id: candId,
        requisition_id: finalReqId,
        first_name: extracted.first_name || 'Unknown',
        last_name: extracted.last_name || 'Unknown',
        email: extracted.email || 'unknown@example.com',
        mobile_number: extracted.mobile_number || 'N/A',
        location: extracted.location || 'Unknown',
        highest_qualification: extracted.highest_qualification || '',
        current_company: extracted.current_company || '',
        current_designation: extracted.current_designation || '',
        total_experience: String(extracted.total_experience || '0 Years'),
        relevant_experience: String(extracted.relevant_experience || ''),
        current_ctc: 0,
        expected_ctc: 0,
        notice_period: extracted.notice_period || 'N/A',
        resume_url: resume_url || '',
        payslips_url: '',
        
        status: 'HR Review', // Automatically Shortlisted
        applied_at: new Date().toISOString(),
        
        // Auto Pre-Screen Scores
        qualification_match: Number(extracted.qualification_match) || 5,
        experience_match: Number(extracted.experience_match) || 5,
        industry_relevance: Number(extracted.industry_relevance) || 5,
        technical_fit: Number(extracted.technical_fit) || 5,
        communication_skills: Number(extracted.communication_skills) || 5,
        salary_alignment: 5, // Default/Placeholder
        recruiter_recommendation: 'Shortlist',
        recruiter_remarks: 'AI Evaluated and automatically Shortlisted based on resume parse.'
      };

      addCandidate(newCand);
      
      updateJobRequisition(reqObj.id, {
        applications_received: (reqObj.applications_received || 0) + 1
      });

      res.status(201).json(newCand);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to process AI resume upload' });
    }
  }
);

recruitmentRouter.put('/candidates/:id', async (req, res) => {
  const cand = getCandidateById(req.params.id);
  if (!cand) return res.status(404).json({ error: 'Candidate not found' });
  
  const oldStatus = cand.status;
  const updated = updateCandidate(req.params.id, req.body);
  
  if (updated && updated.status !== oldStatus) {
    if (updated.status === 'Rejected' || updated.status === 'Withdrawn') {
      await sendEmail(updated.email, 'Application Update - Axxel', 'We regret to inform you that we will not be moving forward with your application at this time.');
      await deleteCandidateFiles(updated.id);
    } else if (updated.status === 'Joining' && oldStatus !== 'Joining') {
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
      await deleteCandidateFiles(updated.id);
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
    if (candStatus === 'Rejected') {
      await deleteCandidateFiles(updated.candidate_id);
    }
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
      await deleteCandidateFiles(offer.candidate_id);
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
    updateCandidate(offer.candidate_id, { status: 'Rejected' });
    await deleteCandidateFiles(offer.candidate_id);
  }

  const updated = updateOffer(req.params.id, { status: newStatus });
  res.json(updated);
});

recruitmentRouter.put('/offers/:id/candidate-action', async (req, res) => {
  const { action, message } = req.body; // 'Accept', 'Decline', 'Clarification'
  
  const offer = getOfferById(req.params.id);
  if (!offer) {
    return res.status(404).json({ error: 'Offer not found' });
  }

  let newStatus = offer.status;
  let candStatus: string = '';

  if (action === 'Accept') {
    newStatus = 'Offer Accepted';
    candStatus = 'Offer Accepted';
    // Send confirmation email
    const cand = getCandidateById(offer.candidate_id);
    if (cand) {
      try {
        await transporter.sendMail({
          from: '"ORG Enterprise HR" <sanjeevinick09@gmail.com>',
          to: cand.email,
          subject: `Offer Accepted - Welcome to ORG Enterprise!`,
          html: `
            <div style="font-family: sans-serif; color: #333;">
              <h2>Welcome aboard, ${cand.first_name}! 🎉</h2>
              <p>We have successfully received your offer acceptance. We are thrilled to have you join our team.</p>
              <p>The HR team will reach out shortly regarding your onboarding schedule.</p>
              <br/>
              <p>Best regards,<br/>ORG Enterprise Talent Team</p>
            </div>
          `
        });
      } catch (e) {
        console.error('Failed to send confirmation email', e);
      }
    }
  } else if (action === 'Decline') {
    newStatus = 'Offer Declined';
    candStatus = 'Withdrawn';
  } else if (action === 'Clarification') {
    newStatus = 'Clarification Requested' as any; // Adding dynamic cast for new status
    candStatus = 'Offer Released'; // still released, just asking questions
    // In a real app we'd save the message/chat to DB
    console.log(`Candidate ${offer.candidate_id} requested clarification on Offer ${offer.id}: ${message}`);
  }
  
  const updated = updateOffer(req.params.id, { status: newStatus });
  if (updated) {
    updateCandidate(updated.candidate_id, { status: candStatus as any });
    if (action === 'Decline') {
      await deleteCandidateFiles(updated.candidate_id);
    }
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Offer not found' });
  }
});

// Send Email Route
recruitmentRouter.post('/offers/:id/send-email', upload.array('attachments'), async (req, res) => {
  try {
    const offer = getOfferById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    
    const cand = getCandidateById(offer.candidate_id);
    if (!cand) return res.status(404).json({ error: 'Candidate not found' });

    const emailBody = req.body.body || `
      <div style="font-family: sans-serif; color: #333;">
        <h2>Offer from ORG Enterprise</h2>
        <p>Dear ${cand.first_name},</p>
        <p>We are delighted to extend you an offer for the position of <strong>${offer.designation}</strong>.</p>
        <p>Your Total CTC is <strong>₹${offer.offered_ctc.toLocaleString('en-IN')}</strong>.</p>
        <p>Please review the attached documents and let us know your decision via the candidate portal.</p>
        <br/>
        <p>Best regards,<br/>ORG Enterprise Talent Team</p>
      </div>
    `;

    // Prepare attachments: The auto-generated offer letter + any user uploaded files
    const attachments: any[] = [];

    // Mock generated Offer Letter PDF (using HTML content as a PDF replacement for now, or just plain HTML attachment)
    const offerLetterContent = `
      <h1>Offer Letter</h1>
      <p>Candidate: ${cand.first_name} ${cand.last_name}</p>
      <p>Designation: ${offer.designation}</p>
      <p>CTC: ${offer.offered_ctc}</p>
      <p>Joining Date: ${offer.joining_date}</p>
      <p>Welcome to the team!</p>
    `;
    attachments.push({
      filename: `Offer_Letter_${cand.first_name}.html`,
      content: offerLetterContent
    });

    // Add user uploaded attachments
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        attachments.push({
          filename: file.originalname,
          content: file.buffer
        });
      }
    }

    // Send via Nodemailer
    await transporter.sendMail({
      from: '"ORG Enterprise HR" <sanjeevinick09@gmail.com>',
      to: cand.email,
      subject: req.body.subject || `Offer of Employment: ${offer.designation} at ORG Enterprise`,
      html: emailBody,
      attachments
    });

    // Update statuses
    updateOffer(offer.id, { status: 'Offer Sent' });
    updateCandidate(cand.id, { status: 'Offer Released' });

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('Email send error:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
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
  let posId = `P_${crypto.randomUUID().substring(0, 8)}`;
  
  if (reqObj && reqObj.position_id) {
    posId = reqObj.position_id;
    // Update the position to Active, and update final budgeted CTC based on offer if needed
    updatePosition(posId, { 
      status: 'A',
      budgeted_ctc: offerObj ? offerObj.offered_ctc : reqObj.budgeted_ctc
    });
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

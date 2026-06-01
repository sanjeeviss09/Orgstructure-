import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import {
  getEmployees, getEmployeeById, addEmployee, updateEmployee,
  deleteEmployee, bulkDeleteEmployees, bulkAddEmployees, getUserByUsername, Employee
} from './data/database';
import { internsRouter } from './interns';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Define rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Security middlewares
app.use(helmet()); // Sets various HTTP headers for security
app.use(limiter); // Applies rate limiting to all requests

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Mount interns router
app.use('/api/interns', internsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Antigravity Backend running.' });
});

// ─── AUTHENTICATION ─────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const user = getUserByUsername(username.trim());
  if (user && user.password === password) {
    const { password: _pw, ...safeUser } = user;
    return res.json({ success: true, user: safeUser });
  }
  return res.status(401).json({ error: 'Invalid credentials. Please check your username and password.' });
});

// ─── EMPLOYEES ────────────────────────────────────────────────────────
app.get('/api/employees', (req, res) => {
  res.json(getEmployees());
});

app.get('/api/employees/:id', (req, res) => {
  const emp = getEmployeeById(req.params.id);
  if (emp) res.json(emp);
  else res.status(404).json({ error: 'Employee not found' });
});

app.post('/api/employees', (req, res) => {
  try {
    const ctc = parseFloat(req.body.ctc_annual) || 0;
    const newEmp: Employee = {
      id: crypto.randomUUID(),
      ctc_currency: 'INR',
      budget_allocated: parseFloat(req.body.budget_allocated) || ctc * 1.2,
      ...req.body
    };
    res.status(201).json({ message: 'Employee added', employee: addEmployee(newEmp) });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// ─── BULK IMPORT ──────────────────────────────────────────────────────
app.post('/api/employees/bulk', (req, res) => {
  try {
    const { employees } = req.body;
    if (!Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({ error: 'No employees provided' });
    }
    const allEmployees = getEmployees();
    const empIdToId: Record<string, string> = {};
    const emailToId: Record<string, string> = {};
    allEmployees.forEach(e => {
      if (e.emp_id) empIdToId[e.emp_id.trim()] = e.id;
      if (e.email_official) emailToId[e.email_official.trim().toLowerCase()] = e.id;
    });

    const newEmployeesWithIds = employees.map((emp: any) => {
      const id = crypto.randomUUID();
      if (emp.emp_id) {
        empIdToId[emp.emp_id.trim()] = id;
      }
      if (emp.email_official) {
        emailToId[emp.email_official.trim().toLowerCase()] = id;
      }
      return { ...emp, id };
    });

    const mapped: Employee[] = newEmployeesWithIds.map((emp: any, idx: number) => {
      const ctc = parseFloat(emp.ctc_annual) || 0;
      const budget = parseFloat(emp.budget_allocated) || ctc * 1.2;

      let reporting_to_id = null;
      const repKey = emp.reporting_manager_emp_id || emp.reporting || emp.reporting_to || emp.manager_id;
      if (repKey) {
        reporting_to_id = empIdToId[String(repKey).trim()] || null;
      } else if (emp.reporting_to_email) {
        reporting_to_id = emailToId[emp.reporting_to_email.trim().toLowerCase()] || null;
      } else if (emp.reporting_to_id) {
        reporting_to_id = empIdToId[emp.reporting_to_id.trim()] || emailToId[emp.reporting_to_id.trim().toLowerCase()] || emp.reporting_to_id;
      }

      return {
        id: emp.id,
        emp_id: emp.emp_id || `EMP${String(Math.floor(1000 + Math.random() * 9000))}`,
        full_name: emp.full_name || '',
        company_name: emp.company_name || 'Axxel Corp',
        business_unit: emp.business_unit || '',
        department: emp.department || '',
        designation: emp.designation || '',
        role_tier: parseInt(emp.role_tier) || 5,
        employment_status: emp.employment_status || 'Active',
        email_official: emp.email_official || '',
        ctc_annual: ctc,
        ctc_currency: emp.ctc_currency || 'INR',
        budget_allocated: budget,
        dashboard_access: emp.dashboard_access || 'Employee',
        reporting_to_id: reporting_to_id,
        photo_url: emp.photo_url || `https://i.pravatar.cc/150?u=bulk${Date.now()}${idx}`,
        past_organization: emp.past_organization || '',
        total_experience: emp.total_experience || '',
        education_qualification: emp.education_qualification || '',
        join_date: emp.join_date || emp.DOJ || emp.doj || emp['Date of Joining'] || emp.date_of_joining || new Date().toISOString(),
        notice_start_date: emp.notice_start_date || null,
        replaced_employee_id: emp.replaced_employee_id || null,
      } as any;
    });

    const added = bulkAddEmployees(mapped);
    res.json({ success: true, added: added.length, message: `${added.length} employees imported successfully.` });
  } catch (e) {
    res.status(500).json({ error: 'Bulk import failed' });
  }
});


app.put('/api/employees/:id', (req, res) => {
  try {
    const updated = updateEmployee(req.params.id, req.body);
    if (updated) res.json({ message: 'Updated', employee: updated });
    else res.status(404).json({ error: 'Employee not found' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

app.post('/api/employees/bulk-delete', (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }
    bulkDeleteEmployees(ids);
    res.json({ success: true, message: `${ids.length} employees deleted successfully.` });
  } catch (e) {
    res.status(500).json({ error: 'Failed to bulk delete' });
  }
});

app.delete('/api/employees/:id', (req, res) => {
  try {
    const deleted = deleteEmployee(req.params.id);
    if (deleted) res.json({ message: 'Deleted successfully' });
    else res.status(404).json({ error: 'Employee not found' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// ─── STATS ────────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const employees = getEmployees();
  const active = employees.filter(e => e.employment_status === 'Active');
  const totalPayroll = employees.reduce((sum, e) => sum + (e.ctc_annual || 0), 0);
  const totalBudget = employees.reduce((sum, e) => sum + (e.budget_allocated || 0), 0);

  const departments: Record<string, number> = {};
  const businessUnits: Record<string, number> = {};
  const tiers: Record<number, number> = {};
  const deptPayroll: Record<string, number> = {};
  const deptBudget: Record<string, number> = {};

  employees.forEach(emp => {
    if (emp.department) {
      departments[emp.department] = (departments[emp.department] || 0) + 1;
      deptPayroll[emp.department] = (deptPayroll[emp.department] || 0) + (emp.ctc_annual || 0);
      deptBudget[emp.department] = (deptBudget[emp.department] || 0) + (emp.budget_allocated || 0);
    }
    if (emp.business_unit) businessUnits[emp.business_unit] = (businessUnits[emp.business_unit] || 0) + 1;
    if (emp.role_tier) tiers[emp.role_tier] = (tiers[emp.role_tier] || 0) + 1;
  });

  res.json({
    totalEmployees: employees.length,
    activeEmployees: active.length,
    totalPayroll,
    totalBudget,
    avgCTC: employees.length > 0 ? Math.round(totalPayroll / employees.length) : 0,
    departments,
    businessUnits,
    tiers,
    deptPayroll,
    deptBudget,
  });
});

// ─── HR TARGETS ───────────────────────────────────────────────────────
import { getHRTargets, updateHRTargets } from './data/database';

app.get('/api/targets', (req, res) => {
  res.json(getHRTargets());
});

app.post('/api/targets', (req, res) => {
  try {
    const updated = updateHRTargets(req.body);
    res.json({ message: 'Targets updated', targets: updated });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update targets' });
  }
});

// ─── AI ENGINE (NVIDIA PHI-4) ─────────────────────────────────────────
app.post('/api/ai-strategy', async (req, res) => {
  try {
    const promptText = `Analyze the following HR metrics and provide strategic insights and actionable recommendations for the Admin. Metrics: ${JSON.stringify(req.body)}`;
    const aiRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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'
      },
      body: JSON.stringify({
        model: 'microsoft/phi-4',
        messages: [
          { role: 'system', content: 'You are an Executive HR Strategist AI. Provide 3 bullet points of strategic insights based on the provided metrics. Keep it concise.' },
          { role: 'user', content: promptText }
        ],
        temperature: 0.7,
        max_tokens: 250
      })
    });
    
    if (aiRes.ok) {
      const data = await aiRes.json();
      res.json({ strategy: data.choices[0].message.content });
    } else {
      res.status(500).json({ error: 'AI engine failed to generate strategy' });
    }
  } catch (e) {
    res.status(500).json({ error: 'AI engine error' });
  }
});

// ─── WELLNESS & FEEDBACK MODULE ──────────────────────────────────────────

import {
  getQuestionnaires, addQuestionnaire, getAssignments, addAssignment,
  updateAssignmentStatus, getResponses, addResponse, getCounsellingSessions,
  addCounsellingSession, addCounsellingMessage, getDailyFeedbacks, addDailyFeedback,
  Questionnaire, Assignment, Response, CounsellingSession, DailyFeedback
} from './data/database';

app.get('/api/wellness/questionnaires', (req, res) => {
  res.json(getQuestionnaires());
});

app.post('/api/wellness/questionnaires', (req, res) => {
  try {
    const q: Questionnaire = {
      id: crypto.randomUUID(),
      ...req.body,
      created_at: new Date().toISOString()
    };
    addQuestionnaire(q);
    res.status(201).json(q);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create questionnaire' });
  }
});

app.get('/api/wellness/assignments', (req, res) => {
  const empId = req.query.empId as string;
  res.json(getAssignments(empId));
});

app.post('/api/wellness/assignments', (req, res) => {
  try {
    const a: Assignment = {
      id: crypto.randomUUID(),
      ...req.body,
      assigned_at: new Date().toISOString(),
      status: 'PENDING'
    };
    addAssignment(a);
    
    // Mock Email Notification
    console.log(`[MOCK EMAIL] Sent assignment notification to employee ${a.employee_id}`);
    
    res.status(201).json(a);
  } catch (e) {
    res.status(500).json({ error: 'Failed to assign' });
  }
});

app.post('/api/wellness/submit', async (req, res) => {
  try {
    const r: Response = {
      id: crypto.randomUUID(),
      ...req.body,
      submitted_at: new Date().toISOString(),
      admin_status: 'VALID'
    };
    
    // Call local LM Studio for AI suggestions if it's a feedback or wellness type
    try {
      // Create a prompt describing the answers
      const promptText = `Analyze the following employee feedback and provide a 1-sentence supportive consolation message, followed by a 1-sentence actionable suggestion for HR. Feedback data: ${JSON.stringify(r.answers)}`;
      
      const aiRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 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'
        },
        body: JSON.stringify({
          model: 'microsoft/phi-4', // Assuming microsoft/phi-4 or phi-4-mini mapping for NVIDIA NIM
          messages: [
            { role: 'system', content: 'You are an HR AI assistant providing emotional wellness support and organizational suggestions. Respond strictly in JSON format: {"consolation": "message", "suggestion": "message"}' },
            { role: 'user', content: promptText }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });
      
      if (aiRes.ok) {
        const data = await aiRes.json();
        const content = data.choices[0].message.content;
        try {
          const parsed = JSON.parse(content);
          r.ai_consolation = parsed.consolation;
          r.ai_suggestion = parsed.suggestion;
        } catch {
          // Fallback if not valid JSON
          r.ai_consolation = "Thank you for your feedback. We appreciate your honesty.";
          r.ai_suggestion = "Review specific responses for actionable areas of improvement.";
        }
      } else {
        r.ai_consolation = "Your concerns are important and respected.";
        r.ai_suggestion = "Employee engagement activities may improve morale.";
      }
    } catch (e) {
      console.warn("LM Studio not running. Using fallback mock AI messages.", e);
      r.ai_consolation = "Your concerns are important and respected. Support is available whenever needed.";
      r.ai_suggestion = "Communication between teams can be strengthened.";
    }

    addResponse(r);
    updateAssignmentStatus(r.assignment_id, 'COMPLETED');
    res.status(201).json(r);
  } catch (e) {
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

app.get('/api/wellness/counselling', (req, res) => {
  const empId = req.query.empId as string;
  res.json(getCounsellingSessions(empId));
});

app.post('/api/wellness/counselling', (req, res) => {
  try {
    const s: CounsellingSession = {
      id: crypto.randomUUID(),
      ...req.body,
      status: 'OPEN',
      created_at: new Date().toISOString(),
      messages: []
    };
    addCounsellingSession(s);
    res.status(201).json(s);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

app.post('/api/wellness/counselling/:id/message', (req, res) => {
  try {
    const msg = {
      id: crypto.randomUUID(),
      ...req.body,
      timestamp: new Date().toISOString()
    };
    addCounsellingMessage(req.params.id, msg);
    res.status(201).json(msg);
  } catch (e) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.get('/api/wellness/daily-feedback', (req, res) => {
  res.json(getDailyFeedbacks());
});

app.post('/api/wellness/daily-feedback', (req, res) => {
  try {
    const f: DailyFeedback = {
      id: crypto.randomUUID(),
      ...req.body,
      date: new Date().toISOString()
    };
    addDailyFeedback(f);
    res.status(201).json(f);
  } catch (e) {
    res.status(500).json({ error: 'Failed to submit daily feedback' });
  }
});

app.listen(port, () => {
  console.log(`\n✅ Antigravity Backend running on http://localhost:${port}`);
});

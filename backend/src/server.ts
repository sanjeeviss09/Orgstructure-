import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import {
  getEmployees, getEmployeeById, addEmployee, updateEmployee,
  deleteEmployee, bulkDeleteEmployees, bulkAddEmployees, getUserByUsername, Employee,
  resetDatabaseData, getPositions, savePositions, addPosition, updatePosition, deletePosition, Position, getOffers, createUser, updateUserRole, getUsers
} from './data/database';
import { internsRouter } from './interns';
import { recruitmentRouter } from './recruitment';
import { templatesRouter } from './templates';
import { opbieRouter } from './opbie';
import { knowledgeRouter, getActiveKnowledgeContext } from './knowledge';
import { getOpbieKnowledge } from './data/database';

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

// Mount recruitment router
app.use('/api/recruitment', recruitmentRouter);

// Mount templates router
app.use('/api/templates', templatesRouter);

// Mount OPBIE router
app.use('/api/opbie', opbieRouter);

// Mount Knowledge router
app.use('/api/knowledge', knowledgeRouter);

// Serve candidate uploads statically
import fs from 'fs';
const UPLOAD_BASE_DIR = 'B:\\Resume';
if (!fs.existsSync(UPLOAD_BASE_DIR)) {
  fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOAD_BASE_DIR));

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

app.get('/api/auth/users', (req, res) => {
  const users = getUsers().map(u => {
    const { password, ...safeUser } = u;
    return safeUser;
  });
  return res.json(users);
});

app.post('/api/auth/register', (req, res) => {
  const { username, password, full_name } = req.body;
  if (!username || !password || !full_name) {
    return res.status(400).json({ error: 'Username, password, and full name are required' });
  }
  try {
    const empId = `E_${crypto.randomUUID().substring(0, 8)}`;
    const newEmp = addEmployee({
      id: empId,
      emp_id: empId,
      full_name,
      company_name: 'Axxel',
      business_unit: 'General',
      department: 'General',
      designation: 'New Employee',
      role_tier: 5,
      employment_status: 'Active',
      email_official: `${username.trim()}@axxel.com`,
      ctc_annual: 0,
      ctc_currency: 'INR',
      budget_allocated: 0,
      dashboard_access: 'Employee',
      reporting_to_id: null,
      photo_url: '',
      join_date: new Date().toISOString()
    });

    const newUser = createUser({
      id: `U_${crypto.randomUUID().substring(0, 8)}`,
      username: username.trim(),
      password,
      full_name,
      role: 'Employee',
      employee_id: newEmp.id
    });
    const { password: _pw, ...safeUser } = newUser;
    return res.json({ success: true, user: safeUser });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

app.put('/api/auth/users/:id/role', (req, res) => {
  const { role } = req.body;
  if (!role) {
    return res.status(400).json({ error: 'Role is required' });
  }
  const updatedUser = updateUserRole(req.params.id, role);
  if (!updatedUser) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { password: _pw, ...safeUser } = updatedUser;
  return res.json({ success: true, user: safeUser });
});

// ─── SYSTEM MAINTENANCE ────────────────────────────────────────────────────────
app.post('/api/reset', (req, res) => {
  try {
    resetDatabaseData();
    res.json({ success: true, message: 'Database reset to mock state' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// ─── AI COMPANION CHAT ─────────────────────────────────────────────────────────
app.post('/api/ai-companion/chat', async (req, res) => {
  try {
    const { message, role, activeTab, context, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    // Role personality prefix
    const rolePersonality: Record<string, string> = {
      Admin:      'You are assisting an Admin who has full platform access.',
      Management: 'You are assisting a Senior Executive/Management user focused on strategic workforce insights.',
      HOD:        'You are assisting a Head of Department focused on their team and department metrics.',
      Manager:    'You are assisting a Team Manager focused on their direct team.',
      Employee:   'You are assisting an Employee with their personal HR queries.',
      Intern:     'You are assisting an Intern with their internship queries.'
    };

    const fullSystemPrompt = `You are Aira, the Enterprise AI Companion built into the ORG Enterprise Intelligence Platform.
${rolePersonality[role] || rolePersonality['Employee']}

Platform Context: Will be provided in a separate system message.
Active Company Knowledge Documents: ${getActiveKnowledgeContext()}

Currency: Always use ₹ (Indian Rupee / INR). Never use $ or USD.

## YOUR PERSONA & MISSION:
- You have full platform access and deep intelligence across all modules.
- You are highly proactive: whenever possible, offer your own intelligent suggestions, strategic insights, and future planning advice tailored to the user's role.
- You exist in real-time, working alongside the user as a living digital employee, not just a static bot.
- You must interact deeply with Managers, HODs, and Employees, motivating them, celebrating their successes, and providing a highly friendly, warm, and engaging feel.
Currency: Always use ₹ (Indian Rupee / INR). Never use $ or USD.

## CRITICAL RESPONSE RULES — YOU MUST FOLLOW THESE:

1. **NEVER tell the user to navigate, click tabs, or go to a page.** Never say things like "Go to the Reports tab", "Click on Recruitment", "Navigate to the Dashboard". This is FORBIDDEN.

2. **ALWAYS answer the question directly here**, inline in this chat panel. If you have data (employee counts, vacancy numbers, budget figures, candidate counts, etc.) from the Platform Context, use it to answer immediately.

3. **Use markdown formatting for clean presentation:**
   - Use **bold** for labels and key numbers
   - Use bullet lists (- item) for lists of items
   - Use markdown tables (| Col | Col |) for comparative or multi-column data
   - Use clear paragraph breaks

4. **If seeing the full page/report would give extra value**, add ONE navigation token at the very END of your reply in this exact format:
   [NAVIGATE:tabname:Button Label]
   Valid tab names: dashboard, orgchart, directory, recruitment, wellness, reports, templates, targets, manage_interns, user_analytics
   Example: [NAVIGATE:reports:View Full Reports]
   Only include ONE navigate token maximum. Never include it in the middle of your response.

5. **Use the context data to give real answers.** If asked about employees, use the active employee count. If asked about vacancies, use the vacant positions number. Extrapolate sensibly.

6. **Budget/CTC**: Always format numbers in Indian format (₹ X,XX,XXX or ₹ X Lakh).

7. **Be concise but complete.** 3-8 lines is ideal. Use tables when comparing 2+ categories.

8. **Tone**: Warm, professional, confident. You are an expert HR partner.

## OPBIE Enterprise Psychology Knowledge Base:
You have access to the following organizational behavioral insights and policies. Use these to guide your answers on culture, engagement, leadership, and policies. Do not attempt to guess individual employee truths, instead rely on these organizational trends and guidelines:

${getOpbieKnowledge().map(k => `### ${k.title} (${k.category})\n${k.content}`).join('\n\n')}`;

    // Inject dynamic calculated Attrition Rate
    const emps = getEmployees();
    const totalEmps = emps.length;
    const resignedEmps = emps.filter(e => e.employment_status === 'Resigned on Roll' || e.employment_status === 'Inactive').length;
    const attritionRate = totalEmps > 0 ? ((resignedEmps / totalEmps) * 100).toFixed(1) + '%' : '0%';
    const enrichedContext = `${context || 'No context provided.'}\nReal-time Attrition Rate: ${attritionRate} (Total: ${totalEmps}, Left: ${resignedEmps})`;

    const messages = [
      { role: 'system', content: fullSystemPrompt },
      { role: 'system', content: `Current Platform Context:\n${enrichedContext}` },
      ...(history || []).slice(-8),
      { role: 'user', content: message }
    ];

    const aiRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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'
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages,
        temperature: 0.4,
        max_tokens: 500
      })
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      console.error('AI Companion error:', err);
      return res.status(500).json({ error: 'AI service unavailable' });
    }

    const aiData = await aiRes.json();
    const reply = aiData.choices?.[0]?.message?.content?.trim() || "I'm not sure how to answer that. Could you rephrase?";
    return res.json({ reply });
  } catch (err) {
    console.error('AI Companion chat error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
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

// ─── POSITIONS ────────────────────────────────────────────────────────
app.get('/api/positions', (req, res) => {
  res.json(getPositions());
});

app.post('/api/positions', (req, res) => {
  try {
    const newPos: Position = {
      id: req.body.id || crypto.randomUUID(),
      ...req.body
    };
    res.status(201).json({ message: 'Position added', position: addPosition(newPos) });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create position' });
  }
});

app.put('/api/positions/:id', (req, res) => {
  const updated = updatePosition(req.params.id, req.body);
  if (updated) res.json(updated);
  else res.status(404).json({ error: 'Position not found' });
});

app.delete('/api/positions/:id/cleanup', (req, res) => {
  const employees = getEmployees();
  const occupants = employees.filter(e => e.position_id === req.params.id);
  const positions = getPositions();
  const subordinates = positions.filter(p => p.reporting_to_position_id === req.params.id);
  
  if (occupants.length === 0 && subordinates.length === 0) {
    deletePosition(req.params.id);
    return res.json({ success: true, message: 'Vacant position cleaned up' });
  }
  return res.json({ success: false, message: 'Position not empty' });
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

    const parseMoney = (val: any): number => {
      if (val === undefined || val === null) return 0;
      if (typeof val === 'number') return val;
      const cleaned = String(val).replace(/,/g, '').trim();
      return parseFloat(cleaned) || 0;
    };

    const mapped: Employee[] = newEmployeesWithIds.map((emp: any, idx: number) => {
      const ctc = parseMoney(emp.ctc_annual);
      const budget = parseMoney(emp.budget_allocated) || ctc * 1.2;

      let reporting_to_id = null;
      const repKey = emp.reporting_manager_emp_id || emp.reporting || emp.reporting_to || emp.manager_id;
      if (repKey) {
        reporting_to_id = empIdToId[String(repKey).trim()] || null;
      } else if (emp.reporting_to_email) {
        reporting_to_id = emailToId[emp.reporting_to_email.trim().toLowerCase()] || null;
      } else if (emp.reporting_to_id) {
        reporting_to_id = empIdToId[emp.reporting_to_id.trim()] || emailToId[emp.reporting_to_id.trim().toLowerCase()] || emp.reporting_to_id;
      }

      if (reporting_to_id === emp.id) {
        reporting_to_id = null;
      }

      return {
        id: emp.id,
        emp_id: emp.emp_id || `EMP${String(Math.floor(1000 + Math.random() * 9000))}`,
        full_name: emp.full_name || '',
        company_name: emp.company_name || 'Axxel Corp',
        business_unit: emp.business_unit || '',
        department: emp.department || '',
        sub_function: emp.sub_function || '',
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
        join_date: emp.join_date || emp.DOJ || emp.doj || emp['Date of Joining'] || emp.date_of_joining || null,
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
  const positions = getPositions();
  const offers = getOffers();
  const active = employees.filter(e => 
    e.employment_status === 'Active' || 
    e.employment_status === 'Under Notice Period' ||
    e.employment_status === 'Resigned on Roll' ||
    e.employment_status === 'Replacement Joined'
  );

  let totalPayroll = 0;
  let totalBudget = 0;
  let totalOffered = 0;
  let totalHold = 0;

  const departments: Record<string, number> = {};
  const businessUnits: Record<string, number> = {};
  const tiers: Record<number, number> = {};
  
  const deptPayroll: Record<string, number> = {};
  const deptBudget: Record<string, number> = {};
  const deptOffered: Record<string, number> = {};
  const deptHold: Record<string, number> = {};

  // Aggregate Budgeted CTC from Positions
  positions.forEach(p => {
    const b = p.budgeted_ctc || 0;
    totalBudget += b;
    if (p.department) {
      deptBudget[p.department] = (deptBudget[p.department] || 0) + b;
    }
  });

  // Aggregate Actual CTC from Active Employees
  active.forEach(emp => {
    const ctc = emp.ctc_annual || 0;
    totalPayroll += ctc;
    
    if (emp.department) {
      departments[emp.department] = (departments[emp.department] || 0) + 1;
      deptPayroll[emp.department] = (deptPayroll[emp.department] || 0) + ctc;
    }
    if (emp.business_unit) businessUnits[emp.business_unit] = (businessUnits[emp.business_unit] || 0) + 1;
    if (emp.role_tier) tiers[emp.role_tier] = (tiers[emp.role_tier] || 0) + 1;
  });

  // Aggregate Offered and Hold CTC
  offers.forEach(o => {
    if (o.status === 'Offer Declined' || o.status === 'Offer Expired') return;
    
    // Find department from position
    const pos = positions.find(p => p.id === o.position_id);
    const dpt = pos ? pos.department : '';

    if (o.status === 'Pending Budget Exception' || o.status.startsWith('Pending')) {
      // Hold CTC
      totalHold += o.offered_ctc;
      if (dpt) deptHold[dpt] = (deptHold[dpt] || 0) + o.offered_ctc;
    } else {
      // Offered CTC
      totalOffered += o.offered_ctc;
      if (dpt) deptOffered[dpt] = (deptOffered[dpt] || 0) + o.offered_ctc;
    }
  });

  res.json({
    totalEmployees: employees.length,
    activeEmployees: active.length,
    totalPayroll,
    totalBudget,
    totalOffered,
    totalHold,
    avgCTC: active.length > 0 ? Math.round(totalPayroll / active.length) : 0,
    departments,
    businessUnits,
    tiers,
    deptPayroll,
    deptBudget,
    deptOffered,
    deptHold
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

app.post('/api/system/reset', (req, res) => {
  try {
    resetDatabaseData();
    res.json({ success: true, message: 'Database reset to original seeded data successfully.' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to reset database data' });
  }
});

// ─── USER ENGAGEMENT ANALYTICS ───────────────────────────────────────
app.get('/api/analytics/user-engagement', (req, res) => {
  try {
    const employees = getEmployees();
    const dailyFeedbacks = getDailyFeedbacks();
    const counsellingSessions = getCounsellingSessions();

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Precompute feedbacks per employee
    const feedbackCountMap = new Map<string, number>();
    for (const f of dailyFeedbacks) {
      if (new Date(f.date).getTime() >= thirtyDaysAgo) {
        feedbackCountMap.set(f.employee_id, (feedbackCountMap.get(f.employee_id) || 0) + 1);
      }
    }

    // Precompute chat messages per employee
    const chatCountMap = new Map<string, number>();
    for (const s of counsellingSessions) {
      for (const m of s.messages) {
        chatCountMap.set(m.sender_id, (chatCountMap.get(m.sender_id) || 0) + 1);
      }
    }

    const result = employees
      .map(emp => {
        // Signal 1: daily feedback submissions (last 30 days) → 40pts max
        const feedbackCount = feedbackCountMap.get(emp.id) || 0;
        const feedbackScore = Math.min(40, feedbackCount * 8); // each submission = 8pts, cap 40

        // Signal 2: chat messages sent (all time, reflects overall comms) → 30pts max
        const chatCount = chatCountMap.get(emp.id) || 0;
        const chatScore = Math.min(30, chatCount * 6); // each msg = 6pts, cap 30

        // Signal 3: seeded login activity based on join date hash → 30pts max
        // Produces a stable 0–30 value per employee without real telemetry
        const seed = emp.id && emp.id.length > 0 ? emp.id.charCodeAt(0) + emp.id.charCodeAt(emp.id.length - 1) : 0;
        const joinMs = emp.join_date ? new Date(emp.join_date).getTime() : 0;
        const daysSinceJoin = Math.floor((now - joinMs) / (1000 * 60 * 60 * 24));
        const loginDays = Math.min(30, Math.max(0, Math.floor(((seed * 7 + daysSinceJoin) % 30))));
        const loginScore = Math.round((loginDays / 30) * 30);

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
          photo_url: emp.photo_url,
          join_date: emp.join_date,
          feedback_count: feedbackCount,
          chat_count: chatCount,
          login_days: loginDays,
          feedback_score: feedbackScore,
          chat_score: chatScore,
          login_score: loginScore,
          score,
          rating,
        };
      });

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to compute user engagement analytics', details: (e as any).message });
  }
});

// ─── ANALYTICS ENHANCEMENTS ───────────────────────────────────────────
import { getJobRequisitions } from './data/database';

app.get('/api/analytics/attrition', (req, res) => {
  const employees = getEmployees();
  const positions = getPositions();
  
  const inactive = employees.filter(e => e.employment_status === 'Inactive');
  const active = employees.filter(e => 
    e.employment_status === 'Active' || 
    e.employment_status === 'Under Notice Period' ||
    e.employment_status === 'Resigned on Roll' ||
    e.employment_status === 'Replacement Joined'
  );
  const totalEmployees = employees.length;
  const attritionRate = active.length > 0 ? Number(((inactive.length / totalEmployees) * 100).toFixed(1)) : 0;
  
  // Real Monthly Attrition (last 6 months)
  const monthlyCounts: Record<string, number> = {};
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    monthlyCounts[d.toLocaleString('default', { month: 'short' })] = 0;
  }
  
  inactive.forEach(emp => {
    let inactiveDate = new Date();
    if (emp.history) {
      const inactiveEvent = emp.history.find(h => h.type === 'STATUS_CHANGE' && h.new_value === 'Inactive');
      if (inactiveEvent) {
        inactiveDate = new Date(inactiveEvent.date);
      }
    }
    const mStr = inactiveDate.toLocaleString('default', { month: 'short' });
    if (monthlyCounts[mStr] !== undefined) {
      monthlyCounts[mStr]++;
    }
  });

  const monthlyAttrition = Object.keys(monthlyCounts).map(month => ({
    month,
    rate: totalEmployees > 0 ? Number(((monthlyCounts[month] / totalEmployees) * 100).toFixed(1)) : 0
  })).reverse();

  // Dept & BU Attrition
  const deptMap: Record<string, { total: number, inactive: number }> = {};
  const buMap: Record<string, { total: number, inactive: number }> = {};

  employees.forEach(emp => {
    const dept = emp.department || 'Unknown';
    const bu = emp.business_unit || 'Unknown';
    
    if (!deptMap[dept]) deptMap[dept] = { total: 0, inactive: 0 };
    if (!buMap[bu]) buMap[bu] = { total: 0, inactive: 0 };
    
    deptMap[dept].total++;
    buMap[bu].total++;
    
    if (emp.employment_status === 'Inactive') {
      deptMap[dept].inactive++;
      buMap[bu].inactive++;
    }
  });

  const deptAttrition = Object.keys(deptMap).map(dept => ({
    department: dept,
    rate: deptMap[dept].total > 0 ? Number(((deptMap[dept].inactive / deptMap[dept].total) * 100).toFixed(1)) : 0
  }));

  const buAttrition = Object.keys(buMap).map(bu => ({
    bu,
    rate: buMap[bu].total > 0 ? Number(((buMap[bu].inactive / buMap[bu].total) * 100).toFixed(1)) : 0
  }));

  const resignationImpact = inactive.length;
  const replacementRequirement = positions.filter(p => p.status === 'V' || p.status === 'RoR').length;
  const costImpact = inactive.reduce((sum, e) => sum + (e.ctc_annual || 0), 0);

  res.json({
    attritionRate,
    monthlyAttrition,
    deptAttrition,
    buAttrition,
    resignationImpact,
    replacementRequirement,
    costImpact
  });
});

app.get('/api/analytics/forecasting', (req, res) => {
  const employees = getEmployees();
  const positions = getPositions();
  const offers = getOffers();
  const reqs = getJobRequisitions();
  
  const budgetHC = positions.length;
  
  const activeHC = employees.filter(e => 
    e.employment_status === 'Active' || 
    e.employment_status === 'Under Notice Period' ||
    e.employment_status === 'Resigned on Roll' ||
    e.employment_status === 'Replacement Joined'
  ).length;

  const activeOffers = offers.filter(o => !['Offer Declined', 'Offer Expired', 'Rejected'].includes(o.status));
  
  const offeredHC = positions.filter(p => {
    const hasActive = employees.some(e => e.position_id === p.id && (
      e.employment_status === 'Active' || 
      e.employment_status === 'Under Notice Period' ||
      e.employment_status === 'Resigned on Roll' ||
      e.employment_status === 'Replacement Joined'
    ));
    if (hasActive) return false;
    const hasOffer = employees.some(e => e.position_id === p.id && e.employment_status === 'Offered Yet to Join') ||
                     activeOffers.some(o => o.position_id === p.id);
    return hasOffer;
  }).length;

  const expectedJoiningHC = employees.filter(e => e.employment_status === 'Offered Yet to Join').length +
                            activeOffers.filter(o => o.status === 'Offer Accepted').length;

  const vacancyHC = budgetHC - activeHC - offeredHC; // Ensures exact mathematical consistency: budgetHC = activeHC + offeredHC + vacancyHC
  
  const forecastedHC = activeHC + expectedJoiningHC;
  
  const budgetCTC = positions.reduce((sum, p) => sum + (p.budgeted_ctc || 0), 0);
  const currentPayroll = employees.filter(e => 
    e.employment_status === 'Active' || 
    e.employment_status === 'Under Notice Period' ||
    e.employment_status === 'Resigned on Roll' ||
    e.employment_status === 'Replacement Joined'
  ).reduce((sum, e) => sum + (e.ctc_annual || 0), 0);
  
  const offeredCTC = activeOffers.reduce((sum, o) => sum + (o.offered_ctc || 0), 0);
  
  const futurePayrollCost = currentPayroll + offeredCTC;
  const futureBudgetUtilization = budgetCTC > 0 ? (futurePayrollCost / budgetCTC) * 100 : 0;
  const expectedSavings = budgetCTC - futurePayrollCost;

  const avgHiringSpeed = 5;
  const expectedClosureMonths = vacancyHC > 0 ? (vacancyHC / avgHiringSpeed).toFixed(1) : 0;

  res.json({
    budgetHC,
    activeHC,
    offeredHC,
    vacancyHC,
    expectedJoiningHC,
    forecastedHC,
    futureBudgetUtilization,
    futurePayrollCost,
    expectedSavings,
    hiringRequirementForecast: vacancyHC,
    forecastCompletionDates: {
      vacancies: vacancyHC,
      avgHiringSpeed,
      expectedClosureMonths
    }
  });
});

app.listen(port, () => {
  console.log(`\n✅ Antigravity Backend running on http://localhost:${port}`);
});
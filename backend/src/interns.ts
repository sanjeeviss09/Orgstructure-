import { Router } from 'express';
import { supabase } from './services/supabase';
import { sendReminderEmail } from './services/email';

export const internsRouter = Router();

// Generate a unique INTxxx ID
const generateInternId = async () => {
  const { data, error } = await supabase.from('interns').select('id').order('created_at', { ascending: false }).limit(1);
  if (error || !data || data.length === 0) return 'INT001';
  
  const lastId = data[0].id;
  const num = parseInt(lastId.replace('INT', ''), 10);
  return `INT${String(num + 1).padStart(3, '0')}`;
};

// 1. Register Intern
internsRouter.post('/register', async (req, res) => {
  try {
    const { name, dob, address, password, startDate, endDate, documentsUrl } = req.body;
    const internId = await generateInternId();
    
    const { data, error } = await supabase.from('interns').insert([{
      id: internId,
      name,
      dob,
      address,
      password, // Note: In production this should be hashed, keeping simple for demo
      start_date: startDate,
      end_date: endDate,
      documents_url: documentsUrl,
      is_active: true,
      is_certified: false
    }]).select().single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to register intern' });
  }
});

// 2. Login Intern
internsRouter.post('/login', async (req, res) => {
  try {
    const { internId, password } = req.body;
    const { data, error } = await supabase.from('interns').select('*').eq('id', internId).single();
    
    if (error || !data || data.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!data.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }
    
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// 3. Get all interns (for Admin)
internsRouter.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('interns').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch interns' });
  }
});

// 4. Update intern (Admin overrides)
internsRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { data, error } = await supabase.from('interns').update(updates).eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update intern' });
  }
});

// 5. Submit Daily Report
internsRouter.post('/reports', async (req, res) => {
  try {
    const { intern_id, date, learnings, feedback, needs_improvement } = req.body;
    
    // Check if report already exists for this date
    const { data: existing } = await supabase.from('intern_reports')
      .select('id').eq('intern_id', intern_id).eq('date', date).single();
      
    if (existing) {
      return res.status(400).json({ error: 'Report already submitted for this date' });
    }
    
    const { data, error } = await supabase.from('intern_reports').insert([{
      intern_id,
      date,
      learnings,
      feedback,
      needs_improvement,
      status: 'COMPLETE'
    }]).select().single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// 6. Get Intern Reports
internsRouter.get('/reports/:internId', async (req, res) => {
  try {
    const { internId } = req.params;
    const { data, error } = await supabase.from('intern_reports').select('*').eq('intern_id', internId).order('date', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// 7. Get All Reports (For Admin)
internsRouter.get('/reports', async (req, res) => {
  try {
    const { data, error } = await supabase.from('intern_reports').select('*, interns(name)').order('date', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all reports' });
  }
});

// Mock Cron Route (To manually trigger cron tasks for testing)
internsRouter.post('/cron', async (req, res) => {
  try {
    // 1. Fetch all active interns
    const { data: interns, error } = await supabase.from('interns').select('*').eq('is_active', true);
    if (error || !interns) throw error;

    const today = new Date();
    today.setHours(0,0,0,0);

    for (const intern of interns) {
      const endDate = new Date(intern.end_date);
      endDate.setHours(0,0,0,0);
      
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Deactivate if passed end date
      if (diffDays < 0) {
        await supabase.from('interns').update({ is_active: false }).eq('id', intern.id);
        console.log(`Deactivated expired intern ${intern.id}`);
      }
      
      // Send reminder 3 days before
      if (diffDays === 3) {
        // Send email
        await sendReminderEmail('sanjeevinick09@gmail.com', intern.name, 3);
      }
    }
    
    res.json({ message: 'Cron executed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Cron failed' });
  }
});

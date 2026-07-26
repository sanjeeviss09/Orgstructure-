import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import ws from 'ws';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xeyfpuwuefbudwuxsajy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhleWZwdXd1ZWZidWR3dXhzYWp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQyODkyMCwiZXhwIjoyMDk1MDA0OTIwfQ.GU7h-tpvBOS4e-omituBGmUEFQaSJLT4Ftuot7V_9Us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws as any } // Provide the ws package for RealtimeClient
});

const DB_PATH = path.join(__dirname, '../data/db.json');

async function migrate() {
  console.log('Starting migration to Supabase...');
  
  if (!fs.existsSync(DB_PATH)) {
    console.error('db.json not found!');
    return;
  }

  const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  
  const tables = [
    'users',
    'employees',
    'positions',
    'appraisals',
    'templates',
    'candidates',
    'job_requisitions',
    'interviews',
    'offers',
    'budget_exceptions',
    'questionnaires',
    'assignments',
    'responses',
    'counselling_sessions',
    'daily_feedbacks'
  ];

  for (const table of tables) {
    if (data[table] && Array.isArray(data[table]) && data[table].length > 0) {
      console.log(`Migrating ${data[table].length} rows to ${table}...`);
      
      const tableName = table === 'users' ? 'app_users' : table;

      let { error } = await supabase.from(tableName).upsert(data[table]);
      
      if (error && table === 'employees') {
        console.warn(`Initial employee migration failed (${error.message}). Retrying with core columns...`);
        const sanitized = data.employees.map((e: any) => ({
          id: String(e.id),
          emp_id: e.emp_id,
          full_name: e.full_name,
          company_name: e.company_name,
          business_unit: e.business_unit,
          department: e.department,
          designation: e.designation,
          role_tier: e.role_tier,
          employment_status: e.employment_status,
          email_official: e.email_official,
          ctc_annual: e.ctc_annual,
          ctc_currency: e.ctc_currency,
          budget_allocated: e.budget_allocated,
          dashboard_access: e.dashboard_access,
          reporting_to_id: e.reporting_to_id,
          photo_url: e.photo_url,
          join_date: e.join_date,
          history: e.history,
          notice_start_date: e.notice_start_date,
          position_id: e.position_id,
          sub_function: e.sub_function
        }));
        const retryRes = await supabase.from('employees').upsert(sanitized);
        error = retryRes.error;
      }

      if (error && table === 'counselling_sessions') {
        console.warn(`Retrying counselling_sessions with core columns...`);
        const sanitized = data.counselling_sessions.map((c: any) => ({
          id: String(c.id),
          employee_id: c.employee_id,
          status: c.status,
          created_at: c.created_at,
          messages: c.messages
        }));
        const retryRes = await supabase.from('counselling_sessions').upsert(sanitized);
        error = retryRes.error;
      }

      if (error) {
        console.error(`Failed to migrate ${table} (mapped to ${tableName}):`, error.message);
      } else {
        console.log(`Successfully migrated ${table}.`);
      }
    }
  }

  if (data.hr_targets) {
    console.log('Migrating hr_targets...');
    const { error } = await supabase.from('hr_targets').upsert({ id: 1, ...data.hr_targets });
    if (error) console.error('Failed to migrate hr_targets:', error.message);
    else console.log('Successfully migrated hr_targets.');
  }
  
  console.log('Migration complete.');
}

migrate();

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

import ws from 'ws';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { transport: ws as any }
});

const DB_PATH = path.join(__dirname, 'data', 'db.json');

async function seed() {
  console.log('Reading local db.json from:', DB_PATH);
  const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  const localEmployees = data.employees || [];
  const localUsers = data.users || [];

  console.log(`Found ${localEmployees.length} employees and ${localUsers.length} users in local db.json.`);

  // 1. Generate UUID mapping for employees
  const employeeIdMap = new Map<string, string>();
  localEmployees.forEach((emp: any) => {
    employeeIdMap.set(emp.id, crypto.randomUUID());
  });

  // 2. Clear remote tables (delete app_users first, then employees due to FK constraint)
  console.log('Clearing remote app_users table...');
  const { error: delUsersError } = await supabase.from('app_users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delUsersError) {
    console.error('Error clearing app_users:', delUsersError);
    return;
  }

  console.log('Clearing remote employees table...');
  const { error: delEmpError } = await supabase.from('employees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delEmpError) {
    console.error('Error clearing employees:', delEmpError);
    return;
  }

  // 3. Prepare employees for insertion
  const employeesToInsert = localEmployees.map((emp: any) => {
    const newId = employeeIdMap.get(emp.id)!;
    const newReportingToId = emp.reporting_to_id ? (employeeIdMap.get(String(emp.reporting_to_id)) || null) : null;
    return {
      id: newId,
      full_name: emp.full_name,
      company_name: emp.company_name,
      business_unit: emp.business_unit,
      department: emp.department,
      designation: emp.designation,
      role_tier: emp.role_tier,
      employment_status: emp.employment_status,
      email_official: emp.email_official,
      ctc_annual: emp.ctc_annual,
      ctc_currency: emp.ctc_currency,
      budget_allocated: emp.budget_allocated,
      dashboard_access: emp.dashboard_access,
      reporting_to_id: newReportingToId,
      photo_url: emp.photo_url
    };
  });

  console.log('Inserting employees into Supabase...');
  const { error: insertEmpError } = await supabase.from('employees').insert(employeesToInsert);
  if (insertEmpError) {
    console.error('Error inserting employees:', insertEmpError);
    return;
  }
  console.log('Successfully inserted employees.');

  // 4. Prepare users for insertion
  const usersToInsert = localUsers.map((user: any) => {
    const matchedEmployeeUuid = user.employee_id ? employeeIdMap.get(String(user.employee_id)) : null;
    return {
      id: crypto.randomUUID(),
      username: user.username,
      password: user.password,
      full_name: user.full_name,
      role: user.role,
      employee_id: matchedEmployeeUuid,
      avatar: user.avatar
    };
  });

  console.log('Inserting users into Supabase...');
  const { error: insertUsersError } = await supabase.from('app_users').insert(usersToInsert);
  if (insertUsersError) {
    console.error('Error inserting users:', insertUsersError);
    return;
  }
  console.log('Successfully inserted users.');
  console.log('Supabase Database seeding complete!');
}

seed().catch(console.error);

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import ws from 'ws';
import crypto from 'crypto';

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

async function clearAndFreshSeed() {
  console.log('Clearing remote app_users table...');
  const { error: delUsersError } = await supabase
    .from('app_users')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (delUsersError) {
    console.error('Error clearing app_users:', delUsersError);
    return;
  }

  console.log('Clearing remote employees table...');
  const { error: delEmpError } = await supabase
    .from('employees')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (delEmpError) {
    console.error('Error clearing employees:', delEmpError);
    return;
  }

  // Generate a fresh UUID for the single root employee (Marcus Sterling, CEO)
  const ceoEmployeeId = crypto.randomUUID();

  // Create Marcus Sterling as the single root CEO employee
  const freshEmployee = {
    id: ceoEmployeeId,
    full_name: 'Marcus Sterling',
    company_name: 'Axxel Corp',
    business_unit: 'Executive',
    department: 'Executive',
    designation: 'CEO',
    role_tier: 1,
    employment_status: 'Active',
    email_official: 'marcus@axxel.com',
    ctc_annual: 3000000,
    ctc_currency: 'INR',
    budget_allocated: 3600000,
    dashboard_access: 'Admin',
    reporting_to_id: null,
    photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop'
  };

  console.log('Inserting root CEO employee (Marcus Sterling)...');
  const { error: insertEmpError } = await supabase.from('employees').insert([freshEmployee]);
  if (insertEmpError) {
    console.error('Error inserting CEO employee:', insertEmpError);
    return;
  }
  console.log('CEO employee created successfully.');

  // Create standard login users (Quick Logins)
  const usersToInsert = [
    {
      id: crypto.randomUUID(),
      username: 'marcus',
      password: 'password123',
      full_name: 'Marcus Sterling',
      role: 'Admin',
      employee_id: ceoEmployeeId,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop'
    },
    {
      id: crypto.randomUUID(),
      username: 'elena',
      password: 'password123',
      full_name: 'Elena Vance',
      role: 'Management',
      employee_id: null,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop'
    },
    {
      id: crypto.randomUUID(),
      username: 'liam',
      password: 'password123',
      full_name: 'Liam Carter',
      role: 'HOD',
      employee_id: null,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop'
    },
    {
      id: crypto.randomUUID(),
      username: 'michael',
      password: 'password123',
      full_name: 'Michael Chang',
      role: 'Manager',
      employee_id: null,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop'
    },
    {
      id: crypto.randomUUID(),
      username: 'alex',
      password: 'password123',
      full_name: 'Alex Rivera',
      role: 'Employee',
      employee_id: null,
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop'
    }
  ];

  console.log('Inserting standard user accounts (marcus, elena, liam, michael, alex)...');
  const { error: insertUsersError } = await supabase.from('app_users').insert(usersToInsert);
  if (insertUsersError) {
    console.error('Error inserting users:', insertUsersError);
    return;
  }
  
  console.log('Standard user accounts created successfully.');
  console.log('Supabase Database reset and fresh seed complete!');
}

clearAndFreshSeed().catch(console.error);

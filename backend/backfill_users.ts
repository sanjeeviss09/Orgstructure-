import { createClient } from '@supabase/supabase-js'; import dotenv from 'dotenv'; import ws from 'ws'; dotenv.config(); const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }, realtime: { transport: ws as any } }); 
async function run() {
  const { data: employees } = await supabase.from('employees').select('*');
  const { data: users } = await supabase.from('app_users').select('employee_id');
  if (!employees) return;
  const existingEmpIds = new Set((users || []).map(u => u.employee_id));
  const newEmployees = employees.filter(e => !existingEmpIds.has(e.id));
  
  const usersToCreate = newEmployees.map(emp => {
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
  if (usersToCreate.length === 0) { console.log('No new users to create.'); return; }
  const res = await supabase.from('app_users').insert(usersToCreate);
  console.log('Migrated', res);
}
run();

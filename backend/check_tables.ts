import { createClient } from '@supabase/supabase-js'; import dotenv from 'dotenv'; import ws from 'ws'; dotenv.config(); const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }, realtime: { transport: ws as any } }); 
async function run() {
  const { data: users } = await supabase.from('app_users').select('*');
  console.log('USERS IN DB:', users);
  const { data: emp } = await supabase.from('employees').select('id, emp_id, full_name, email_official');
  console.log('EMPLOYEES IN DB:', emp);
}
run();

import { createClient } from '@supabase/supabase-js'; import dotenv from 'dotenv'; import ws from 'ws'; dotenv.config(); const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }, realtime: { transport: ws as any } }); 
supabase.from('employees').select('*').limit(1).then(res => {
  if (res.data && res.data.length > 0) console.log('employees:', Object.keys(res.data[0]));
  else console.log('employees table empty, cannot infer columns this way. Wait, insert dummy row to see.');
  return supabase.from('employees').insert([{ id: 'test', full_name: 'test', company_name: 't', business_unit: 't', department: 't', designation: 't', role_tier: 1, employment_status: 'Active', email_official: 't', ctc_annual: 0, ctc_currency: 'INR', budget_allocated: 0, dashboard_access: 't', reporting_to_id: null }]).select();
}).then(res => {
  if (res.data) console.log('employees cols:', Object.keys(res.data[0]));
  return supabase.from('employees').delete().eq('id', 'test');
}).catch(console.error);

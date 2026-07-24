import { createClient } from '@supabase/supabase-js'; import dotenv from 'dotenv'; import ws from 'ws'; dotenv.config(); const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }, realtime: { transport: ws as any } }); 
supabase.from('positions').insert([{ id: 'test_pos', title: 'test', department: 'test', business_unit: 'test', sub_function: 'test', status: 'A', budgeted_ctc: 0 }]).select().then(res => {
  if (res.error) console.error(res.error);
  if (res.data) console.log('positions cols:', Object.keys(res.data[0]));
  return supabase.from('positions').delete().eq('id', 'test_pos');
}).catch(console.error);

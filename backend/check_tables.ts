import { createClient } from '@supabase/supabase-js'; import dotenv from 'dotenv'; import ws from 'ws'; dotenv.config(); const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }, realtime: { transport: ws as any } }); 
async function run() {
  const { data: d1 } = await supabase.from('daily_feedbacks').select('*').limit(1);
  console.log('daily_feedbacks:', d1 ? 'exists' : 'does not exist');
  const { data: d2 } = await supabase.from('counselling_sessions').select('*').limit(1);
  console.log('counselling_sessions:', d2 ? 'exists' : 'does not exist');
}
run();

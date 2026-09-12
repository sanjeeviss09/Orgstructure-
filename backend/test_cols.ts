import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { transport: ws as any }
});

async function run() {
  try {
    const res = await supabase.from('employees').select('*').limit(1);
    if (res.data && res.data.length > 0) {
      console.log('employees:', Object.keys(res.data[0]));
    } else {
      console.log('employees table empty, cannot infer columns this way. Wait, insert dummy row to see.');
    }

    const insertRes = await supabase.from('employees').insert([{
      id: 'test',
      full_name: 'test',
      company_name: 't',
      business_unit: 't',
      department: 't',
      designation: 't',
      role_tier: 1,
      employment_status: 'Active',
      email_official: 't',
      ctc_annual: 0,
      ctc_currency: 'INR',
      budget_allocated: 0,
      dashboard_access: 't',
      reporting_to_id: null
    }]).select();

    if (insertRes.data && insertRes.data.length > 0) {
      console.log('employees cols:', Object.keys(insertRes.data[0]));
    }

    await supabase.from('employees').delete().eq('id', 'test');
  } catch (error) {
    console.error(error);
  }
}

run();

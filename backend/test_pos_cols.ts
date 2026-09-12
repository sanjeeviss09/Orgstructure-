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
    const res = await supabase.from('positions').insert([{
      id: 'test_pos',
      title: 'test',
      department: 'test',
      business_unit: 'test',
      sub_function: 'test',
      status: 'A',
      budgeted_ctc: 0
    }]).select();

    if (res.error) {
      console.error(res.error);
    }
    if (res.data && res.data.length > 0) {
      console.log('positions cols:', Object.keys(res.data[0]));
    }

    await supabase.from('positions').delete().eq('id', 'test_pos');
  } catch (error) {
    console.error(error);
  }
}

run();

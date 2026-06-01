import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  },
  realtime: {
    transport: ws as any
  }
});

async function inspect() {
  console.log('Connecting to Supabase at:', supabaseUrl);
  
  // Try querying a generic table to see if it exists
  const { data: tables, error: tablesError } = await supabase
    .from('employees')
    .select('*')
    .limit(1);
    
  if (tablesError) {
    console.error('Error querying employees table:', tablesError);
  } else {
    console.log('Successfully queried employees table. Data:', tables);
  }
}

inspect();

import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function discover() {
  const url = `${supabaseUrl}/rest/v1/`;
  console.log('Fetching database schema from:', url);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const schema = await response.json() as any;
    console.log('Schema title:', schema.info?.title);
    console.log('Exposed Paths (Tables/Views/RPCs):');
    const paths = Object.keys(schema.paths || {});
    if (paths.length === 0) {
      console.log('No tables or endpoints are exposed in this Supabase database.');
    } else {
      paths.forEach(p => console.log('  -', p));
    }
  } catch (error) {
    console.error('Error discovering schema:', error);
  }
}

discover();

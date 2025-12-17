// Script simplificado para auditar tabelas no Supabase
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rwpmtuohcvnciemtsjge.supabase.co';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cG10dW9oY3ZuY2llbXRzamdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMxMzU3NiwiZXhwIjoyMDgwODg5NTc2fQ.d1c1WPyOtRBkJ1E3DwYUtoQ7FUJ0iSGA14dokqx_8ww';

const TABLES = [
  'users',
  'projects',
  'locations',
  'location_photos',
  'suppliers',
  'tags',
  'location_tags',
  'project_locations',
  'project_location_stages',
  'visits',
  'contracts',
  'agenda_events',
  'notifications',
];

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  console.log('AUDIT SUPABASE DATABASE\n');

  const existing = [];
  const missing = [];

  for (const table of TABLES) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    if (error) {
      console.log('MISSING: ' + table + ' - ' + error.code);
      missing.push(table);
    } else {
      console.log('OK: ' + table + ' (' + (count || 0) + ' rows)');
      existing.push(table);
    }
  }

  console.log('\n--- SUMMARY ---');
  console.log('Existing: ' + existing.length);
  console.log('Missing: ' + missing.length);
  if (missing.length > 0) {
    console.log('Missing tables: ' + missing.join(', '));
  }
}

main().catch(e => console.log('ERROR: ' + e.message));

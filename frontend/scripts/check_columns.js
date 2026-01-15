// Script para verificar as colunas da tabela agenda_events
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mjrjjslawywdcgvaxtzv.supabase.co';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cG10dW9oY3ZuY2llbXRzamdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMxMzU3NiwiZXhwIjoyMDgwODg5NTc2fQ.d1c1WPyOtRBkJ1E3DwYUtoQ7FUJ0iSGA14dokqx_8ww';

async function checkColumns() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Tentar inserir um evento de teste para ver o erro exato
  const testEvent = {
    title: 'Test Event',
    start_date: new Date().toISOString(),
  };

  console.log('Inserting test event:', testEvent);

  const { data, error } = await supabase
    .from('agenda_events')
    .insert([testEvent])
    .select();

  if (error) {
    console.log('Error:', error.message);
    console.log('Details:', error.details);
  } else {
    console.log('Success! Created event:', data);
    // Delete test event
    if (data && data[0]) {
      await supabase.from('agenda_events').delete().eq('id', data[0].id);
      console.log('Deleted test event');
    }
  }
}

checkColumns().catch(console.error);

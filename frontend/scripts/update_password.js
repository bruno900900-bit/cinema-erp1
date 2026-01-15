// Atualizar senha do admin
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mjrjjslawywdcgvaxtzv.supabase.co';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cG10dW9oY3ZuY2llbXRzamdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMxMzU3NiwiZXhwIjoyMDgwODg5NTc2fQ.d1c1WPyOtRBkJ1E3DwYUtoQ7FUJ0iSGA14dokqx_8ww';

async function updatePassword() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const userId = '67230947-2ded-420a-863f-ff6b098f6a24';
  const newPassword = 'Admin123!';

  console.log('🔐 Atualizando senha do usuário admin...');

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  console.log('✅ Senha atualizada com sucesso!');
  console.log('\n📧 Credenciais:');
  console.log('   Email: admin@cinema.com');
  console.log('   Senha: Admin123!');
}

updatePassword().catch(console.error);

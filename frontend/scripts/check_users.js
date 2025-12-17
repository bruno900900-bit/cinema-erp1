// Verificar usuários existentes
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rwpmtuohcvnciemtsjge.supabase.co';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cG10dW9oY3ZuY2llbXRzamdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMxMzU3NiwiZXhwIjoyMDgwODg5NTc2fQ.d1c1WPyOtRBkJ1E3DwYUtoQ7FUJ0iSGA14dokqx_8ww';

async function checkUsers() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('📋 Listando usuários no Auth...\n');

  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  console.log('Usuários encontrados:', data.users?.length || 0);

  if (data.users && data.users.length > 0) {
    data.users.forEach((user, i) => {
      console.log(`\n--- Usuário ${i + 1} ---`);
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Confirmado:', user.email_confirmed_at ? 'Sim' : 'Não');
      console.log('Criado em:', user.created_at);
    });
  } else {
    console.log('\n⚠️ Nenhum usuário encontrado no Auth!');
    console.log('Você precisa criar o usuário pelo Dashboard:');
    console.log('Authentication > Users > Add User');
  }

  // Verificar tabela users também
  console.log('\n\n📋 Verificando tabela public.users...');
  const { data: profiles, error: pError } = await supabase
    .from('users')
    .select('*');

  if (pError) {
    console.error('❌ Erro ao buscar profiles:', pError);
  } else {
    console.log('Perfis encontrados:', profiles?.length || 0);
    profiles?.forEach((p, i) => {
      console.log(`\n--- Perfil ${i + 1} ---`);
      console.log('ID:', p.id);
      console.log('Email:', p.email);
      console.log('Role:', p.role);
      console.log('Auth ID:', p.auth_id);
    });
  }
}

checkUsers().catch(console.error);

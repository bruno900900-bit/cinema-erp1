// Script para corrigir trigger e criar admin
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rwpmtuohcvnciemtsjge.supabase.co';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cG10dW9oY3ZuY2llbXRzamdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMxMzU3NiwiZXhwIjoyMDgwODg5NTc2fQ.d1c1WPyOtRBkJ1E3DwYUtoQ7FUJ0iSGA14dokqx_8ww';

async function fixTriggerAndCreateAdmin() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('🔧 Passo 1: Corrigindo trigger handle_new_user...');

  // Atualizar a trigger para incluir password_hash
  const fixTriggerSQL = `
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.users (email, full_name, auth_id, role, password_hash)
      VALUES (
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        new.id,
        'viewer',
        'supabase_managed'
      )
      ON CONFLICT (email) DO UPDATE
      SET auth_id = EXCLUDED.auth_id,
          updated_at = NOW();
      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  const { error: sqlError } = await supabase.rpc('exec_sql', {
    sql: fixTriggerSQL,
  });

  if (sqlError) {
    console.log('⚠️ Não foi possível usar RPC, tentando método direto...');

    // Alternativa: desabilitar constraint temporariamente
    // Isso não é possível diretamente, então vamos tentar alterar a coluna
    const alterSQL = `ALTER TABLE public.users ALTER COLUMN password_hash SET DEFAULT 'supabase_managed'`;

    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: alterSQL,
    });

    if (alterError) {
      console.log('⚠️ Não é possível executar SQL diretamente via API.');
      console.log('\n📋 INSTRUÇÕES MANUAIS:');
      console.log('1. Acesse: https://supabase.com/dashboard');
      console.log('2. Vá em SQL Editor');
      console.log('3. Execute:');
      console.log(
        "   ALTER TABLE public.users ALTER COLUMN password_hash SET DEFAULT 'supabase_managed';"
      );
      console.log('4. Depois vá em Authentication > Users > Add User');
      console.log('   Email: admin@cinema.com | Password: Admin123!');
      return;
    }
  }

  console.log('✅ Trigger/tabela corrigida!');

  console.log('\n🔐 Passo 2: Criando usuário admin...');

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: 'admin@cinema.com',
      password: 'Admin123!',
      email_confirm: true,
      user_metadata: { full_name: 'Administrador' },
    });

  if (authError) {
    console.error('❌ Erro:', authError.message);
  } else {
    console.log('✅ Usuário criado:', authData.user.id);

    // Promover para admin
    await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('email', 'admin@cinema.com');

    console.log('✅ Promovido para admin!');
  }

  console.log('\n========================================');
  console.log('📧 Credenciais:');
  console.log('   Email: admin@cinema.com');
  console.log('   Senha: Admin123!');
  console.log('========================================');
}

fixTriggerAndCreateAdmin().catch(console.error);

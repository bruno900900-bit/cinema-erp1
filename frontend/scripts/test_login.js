// Script para verificar se o login funciona
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rwpmtuohcvnciemtsjge.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cG10dW9oY3ZuY2llbXRzamdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTM1NzYsImV4cCI6MjA4MDg4OTU3Nn0.Wpkkzef7vTKQGQ5CZX41-qXHoQu4r_r67lK-fmvWQV8';

async function testLogin() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log('🔐 Testando login com admin@cinema.com...');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@cinema.com',
    password: 'Admin123!',
  });

  if (error) {
    console.error('❌ Login falhou:', error.message);
    return false;
  }

  console.log('✅ Login bem-sucedido!');
  console.log('   User ID:', data.user.id);
  console.log('   Email:', data.user.email);
  console.log(
    '   Token:',
    data.session?.access_token?.substring(0, 50) + '...'
  );

  // Verificar perfil na tabela users
  console.log('\n📋 Verificando perfil na tabela users...');
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', data.user.id)
    .single();

  if (profileError) {
    console.log('⚠️ Perfil não encontrado por auth_id, tentando por email...');
    const { data: p2 } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@cinema.com')
      .single();

    if (p2) {
      console.log('✅ Perfil encontrado:', p2);
    } else {
      console.log('❌ Perfil não encontrado');
    }
  } else {
    console.log('✅ Perfil encontrado:', profile);
  }

  return true;
}

testLogin()
  .then(success => {
    if (success) {
      console.log('\n🎉 Tudo funcionando! Você pode fazer login no sistema.');
    }
  })
  .catch(console.error);

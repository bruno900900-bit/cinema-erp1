/**
 * Script para configurar políticas RLS nos buckets do Supabase Storage
 * Execute com: node scripts/setup-storage-policies.cjs
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mjrjjslawywdcgvaxtzv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cG10dW9oY3ZuY2llbXRzamdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMxMzU3NiwiZXhwIjoyMDgwODg5NTc2fQ.d1c1WPyOtRBkJ1E3DwYUtoQ7FUJ0iSGA14dokqx_8ww';

// Cliente admin com service_role key
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupStoragePolicies() {
  console.log('🔐 Configurando políticas RLS para Storage...\n');

  const buckets = ['images', 'locations', 'avatars'];

  for (const bucketName of buckets) {
    try {
      // Atualizar bucket para ser público e permitir uploads anônimos
      const { error: updateError } = await supabaseAdmin.storage.updateBucket(
        bucketName,
        {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
          ],
        }
      );

      if (updateError) {
        console.error(
          `❌ Erro ao atualizar bucket '${bucketName}':`,
          updateError.message
        );
      } else {
        console.log(`✅ Bucket '${bucketName}' configurado como público.`);
      }
    } catch (err) {
      console.error(
        `❌ Erro ao processar bucket '${bucketName}':`,
        err.message
      );
    }
  }

  // Criar políticas SQL via API REST
  console.log('\n📝 Criando políticas RLS via SQL...\n');

  const policies = [
    // Permitir SELECT público para todos os buckets
    `CREATE POLICY IF NOT EXISTS "Allow public read access" ON storage.objects FOR SELECT USING (bucket_id IN ('images', 'locations', 'avatars'));`,
    // Permitir INSERT para usuários anônimos
    `CREATE POLICY IF NOT EXISTS "Allow public upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('images', 'locations', 'avatars'));`,
    // Permitir UPDATE para todos
    `CREATE POLICY IF NOT EXISTS "Allow public update" ON storage.objects FOR UPDATE USING (bucket_id IN ('images', 'locations', 'avatars'));`,
    // Permitir DELETE para todos
    `CREATE POLICY IF NOT EXISTS "Allow public delete" ON storage.objects FOR DELETE USING (bucket_id IN ('images', 'locations', 'avatars'));`,
  ];

  for (const policySQL of policies) {
    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: policySQL });
      if (error) {
        // RPC pode não existir, isso é esperado
        console.log(
          `⚠️ Não foi possível executar SQL via RPC (isso é normal se a função não existir)`
        );
        break;
      }
      console.log(`✅ Política criada com sucesso`);
    } catch (err) {
      console.log(
        `⚠️ Exceção ao executar SQL (provavelmente função RPC não existe)`
      );
      break;
    }
  }

  console.log('\n✨ Processo concluído!');
  console.log(
    '\n📋 IMPORTANTE: Se o upload ainda não funcionar, você precisa:'
  );
  console.log(
    '   1. Acesse: https://supabase.com/dashboard/project/mjrjjslawywdcgvaxtzv/storage/buckets'
  );
  console.log('   2. Clique no bucket "images"');
  console.log('   3. Vá na aba "Policies"');
  console.log('   4. Clique "New Policy" → "Get started quickly"');
  console.log(
    '   5. Selecione "Allow full access to everyone" para INSERT e SELECT'
  );
  console.log('   6. Repita para os outros buckets se necessário');
}

setupStoragePolicies().catch(console.error);

/**
 * Script para criar o bucket 'images' no Supabase Storage
 * Execute com: npx ts-node scripts/create-storage-bucket.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mjrjjslawywdcgvaxtzv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cG10dW9oY3ZuY2llbXRzamdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMxMzU3NiwiZXhwIjoyMDgwODg5NTc2fQ.d1c1WPyOtRBkJ1E3DwYUtoQ7FUJ0iSGA14dokqx_8ww';

// Cliente admin com service_role key
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createStorageBuckets() {
  console.log('🚀 Criando buckets no Supabase Storage...\n');

  const buckets = [
    {
      name: 'images',
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    },
    {
      name: 'locations',
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    },
    {
      name: 'avatars',
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    },
  ];

  for (const bucket of buckets) {
    try {
      // Verificar se bucket já existe
      const { data: existingBucket, error: getError } =
        await supabaseAdmin.storage.getBucket(bucket.name);

      if (existingBucket) {
        console.log(`✅ Bucket '${bucket.name}' já existe.`);
        continue;
      }

      // Criar bucket
      const { data, error } = await supabaseAdmin.storage.createBucket(
        bucket.name,
        {
          public: bucket.public,
          fileSizeLimit: bucket.fileSizeLimit,
          allowedMimeTypes: bucket.allowedMimeTypes,
        }
      );

      if (error) {
        console.error(
          `❌ Erro ao criar bucket '${bucket.name}':`,
          error.message
        );
      } else {
        console.log(`✅ Bucket '${bucket.name}' criado com sucesso!`);
      }
    } catch (err: any) {
      console.error(
        `❌ Erro ao processar bucket '${bucket.name}':`,
        err.message
      );
    }
  }

  console.log('\n✨ Processo concluído!');
}

createStorageBuckets().catch(console.error);

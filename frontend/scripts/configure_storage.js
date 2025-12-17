// Script para configurar Supabase Storage para imagens
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rwpmtuohcvnciemtsjge.supabase.co';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cG10dW9oY3ZuY2llbXRzamdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMxMzU3NiwiZXhwIjoyMDgwODg5NTc2fQ.d1c1WPyOtRBkJ1E3DwYUtoQ7FUJ0iSGA14dokqx_8ww';

async function configureStorage() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('📦 Verificando buckets de storage...\n');

  // 1. Listar buckets existentes
  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets();

  if (listError) {
    console.error('❌ Erro ao listar buckets:', listError);
    return;
  }

  console.log(
    'Buckets encontrados:',
    buckets.map(b => b.name).join(', ') || 'Nenhum'
  );

  // 2. Verificar se bucket location-photos existe
  const bucketName = 'location-photos';
  const existingBucket = buckets.find(b => b.name === bucketName);

  if (existingBucket) {
    console.log(`\n✅ Bucket '${bucketName}' já existe!`);
    console.log('   - Público:', existingBucket.public ? 'Sim' : 'Não');
  } else {
    console.log(`\n🆕 Criando bucket '${bucketName}'...`);

    const { data: created, error: createError } =
      await supabase.storage.createBucket(bucketName, {
        public: true, // Permite acesso público às imagens
        fileSizeLimit: 10485760, // 10MB max
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
        ],
      });

    if (createError) {
      console.error('❌ Erro ao criar bucket:', createError);
    } else {
      console.log('✅ Bucket criado com sucesso!');
    }
  }

  // 3. Atualizar bucket para ser público (caso não seja)
  console.log('\n🔧 Garantindo que bucket é público...');
  const { error: updateError } = await supabase.storage.updateBucket(
    bucketName,
    {
      public: true,
      fileSizeLimit: 10485760,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    }
  );

  if (updateError) {
    console.log('⚠️ Aviso ao atualizar bucket:', updateError.message);
  } else {
    console.log('✅ Bucket configurado como público!');
  }

  // 4. Testar upload
  console.log('\n📤 Testando upload de imagem...');

  // Criar uma imagem de teste (1x1 pixel PNG transparente)
  const testImageBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const testImageBuffer = Buffer.from(testImageBase64, 'base64');
  const testFileName = `test/test_${Date.now()}.png`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(testFileName, testImageBuffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (uploadError) {
    console.error('❌ Erro no upload de teste:', uploadError);
  } else {
    console.log('✅ Upload de teste bem-sucedido!');

    // Obter URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(testFileName);

    console.log('🔗 URL pública da imagem de teste:', publicUrl);

    // Limpar arquivo de teste
    await supabase.storage.from(bucketName).remove([testFileName]);
    console.log('🗑️ Arquivo de teste removido');
  }

  // 5. Verificar tabela location_photos
  console.log('\n📋 Verificando tabela location_photos...');
  const { data: photos, error: photosError } = await supabase
    .from('location_photos')
    .select('id, url, location_id')
    .limit(5);

  if (photosError) {
    console.error('❌ Erro ao consultar location_photos:', photosError.message);
  } else {
    console.log(
      `✅ Tabela location_photos OK! ${photos?.length || 0} fotos encontradas.`
    );
    if (photos && photos.length > 0) {
      console.log('\nExemplos de URLs de fotos existentes:');
      photos.forEach(p =>
        console.log(`   - ID ${p.id}: ${p.url?.substring(0, 80)}...`)
      );
    }
  }

  console.log('\n========================================');
  console.log('✅ Configuração de storage concluída!');
  console.log('========================================');
}

configureStorage().catch(console.error);

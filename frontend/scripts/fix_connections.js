// Script para verificar conexões e popular dados de teste
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mjrjjslawywdcgvaxtzv.supabase.co';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cG10dW9oY3ZuY2llbXRzamdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTMxMzU3NiwiZXhwIjoyMDgwODg5NTc2fQ.d1c1WPyOtRBkJ1E3DwYUtoQ7FUJ0iSGA14dokqx_8ww';

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  console.log('=== VERIFICANDO CONEXÕES E DADOS ===\n');

  // 1. Verificar usuário
  const { data: user } = await supabase.from('users').select('*').single();
  console.log('Usuário encontrado:', user?.email, '(ID:', user?.id, ')');

  // 2. Verificar projeto
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .single();
  console.log(
    'Projeto encontrado:',
    project?.name,
    '(ID:',
    project?.id,
    ', created_by:',
    project?.created_by,
    ')'
  );

  // 3. Verificar locações
  const { data: locations } = await supabase.from('locations').select('*');
  console.log('Locações encontradas:', locations?.length);
  locations?.forEach(l =>
    console.log('  -', l.id, ':', l.title, '- status:', l.status)
  );

  // 4. Verificar fotos
  const { data: photos } = await supabase.from('location_photos').select('*');
  console.log('\nFotos encontradas:', photos?.length);
  photos?.forEach(p =>
    console.log(
      '  -',
      p.id,
      ': location_id=',
      p.location_id,
      '- url:',
      p.url?.substring(0, 60),
      '...'
    )
  );

  // 5. Verificar conexão projeto <-> usuário
  console.log('\n=== VERIFICANDO FOREIGN KEYS ===\n');

  if (project && user) {
    const connection = project.created_by === user.id;
    console.log(
      'Projeto → Usuário (created_by):',
      connection ? 'OK' : 'PROBLEMA'
    );
    if (!connection) {
      console.log('  Projeto.created_by =', project.created_by);
      console.log('  User.id =', user.id);
      console.log('  CORRIGINDO...');
      await supabase
        .from('projects')
        .update({ created_by: user.id })
        .eq('id', project.id);
      console.log('  CORRIGIDO!');
    }
  }

  // 6. Verificar fotos têm locação válida
  if (photos && locations) {
    const locationIds = locations.map(l => l.id);
    for (const photo of photos) {
      const valid = locationIds.includes(photo.location_id);
      console.log(
        'Foto',
        photo.id,
        '→ Location',
        photo.location_id,
        ':',
        valid ? 'OK' : 'ÓRFÃ'
      );
    }
  }

  // 7. Verificar se cover_photo_url está definido nas locações
  console.log('\n=== VERIFICANDO COVER PHOTOS ===\n');
  for (const loc of locations || []) {
    console.log('Locação', loc.id, '(', loc.title, '):');
    console.log('  cover_photo_url:', loc.cover_photo_url || 'NÃO DEFINIDO');

    // Buscar primeira foto desta locação para usar como cover
    if (!loc.cover_photo_url && photos) {
      const locPhotos = photos.filter(p => p.location_id === loc.id);
      if (locPhotos.length > 0) {
        const primaryPhoto = locPhotos.find(p => p.is_primary) || locPhotos[0];
        console.log(
          '  → Atualizando cover_photo_url para:',
          primaryPhoto.url?.substring(0, 50),
          '...'
        );
        await supabase
          .from('locations')
          .update({ cover_photo_url: primaryPhoto.url })
          .eq('id', loc.id);
        console.log('  → ATUALIZADO!');
      }
    }
  }

  console.log('\n=== AUDITORIA CONCLUÍDA ===');
}

main().catch(e => console.log('ERROR:', e.message));

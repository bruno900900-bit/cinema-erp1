/**
 * Script de Migração: Criar Etapas Padrão para Project Locations Existentes
 *
 * Este script cria as 11 etapas padrão para todas as project_locations
 * que ainda não possuem etapas.
 *
 * Como usar:
 * 1. Copie este código no console do navegador na aplicação
 * 2. Execute a função: await migrateProjectLocationStages()
 * 3. Aguarde a conclusão e veja o resumo
 */

import { supabase } from '../config/supabaseClient';

interface ProjectLocationStageTemplate {
  stage_type: string;
  title: string;
  description: string;
  status: string;
  weight: number;
  is_milestone: boolean;
  is_critical: boolean;
  completion_percentage: number;
}

const DEFAULT_STAGES: ProjectLocationStageTemplate[] = [
  {
    stage_type: 'prospeccao',
    title: 'Prospecção',
    description: 'Busca e identificação inicial da locação',
    status: 'pending',
    weight: 1.0,
    is_milestone: false,
    is_critical: false,
    completion_percentage: 0.0,
  },
  {
    stage_type: 'visitacao',
    title: 'Visitação Inicial',
    description: 'Primeira visita ao local para avaliação geral',
    status: 'pending',
    weight: 1.5,
    is_milestone: true,
    is_critical: true,
    completion_percentage: 0.0,
  },
  {
    stage_type: 'avaliacao_tecnica',
    title: 'Avaliação Técnica',
    description: 'Avaliação técnica detalhada do local',
    status: 'pending',
    weight: 1.5,
    is_milestone: false,
    is_critical: true,
    completion_percentage: 0.0,
  },
  {
    stage_type: 'aprovacao_cliente',
    title: 'Aprovação do Cliente',
    description: 'Apresentação e aprovação pelo cliente',
    status: 'pending',
    weight: 2.0,
    is_milestone: true,
    is_critical: true,
    completion_percentage: 0.0,
  },
  {
    stage_type: 'negociacao',
    title: 'Negociação',
    description: 'Negociação de preços e condições',
    status: 'pending',
    weight: 2.0,
    is_milestone: false,
    is_critical: true,
    completion_percentage: 0.0,
  },
  {
    stage_type: 'contratacao',
    title: 'Contratação',
    description: 'Assinatura do contrato',
    status: 'pending',
    weight: 1.5,
    is_milestone: true,
    is_critical: true,
    completion_percentage: 0.0,
  },
  {
    stage_type: 'preparacao',
    title: 'Preparação',
    description: 'Preparação do local para gravação',
    status: 'pending',
    weight: 1.0,
    is_milestone: false,
    is_critical: false,
    completion_percentage: 0.0,
  },
  {
    stage_type: 'setup',
    title: 'Setup e Montagem',
    description: 'Montagem de equipamentos',
    status: 'pending',
    weight: 1.0,
    is_milestone: false,
    is_critical: false,
    completion_percentage: 0.0,
  },
  {
    stage_type: 'gravacao',
    title: 'Gravação/Filmagem',
    description: 'Período de gravação',
    status: 'pending',
    weight: 3.0,
    is_milestone: true,
    is_critical: true,
    completion_percentage: 0.0,
  },
  {
    stage_type: 'desmontagem',
    title: 'Desmontagem',
    description: 'Desmontagem e limpeza',
    status: 'pending',
    weight: 1.0,
    is_milestone: false,
    is_critical: false,
    completion_percentage: 0.0,
  },
  {
    stage_type: 'entrega',
    title: 'Entrega Final',
    description: 'Entrega do local',
    status: 'pending',
    weight: 1.5,
    is_milestone: true,
    is_critical: true,
    completion_percentage: 0.0,
  },
];

export async function migrateProjectLocationStages(): Promise<{
  success: boolean;
  created: number;
  skipped: number;
  errors: number;
  details: string[];
}> {
  console.log('🚀 Iniciando migração de etapas de project_locations...');

  const result = {
    success: true,
    created: 0,
    skipped: 0,
    errors: 0,
    details: [] as string[],
  };

  try {
    // 1. Buscar todas as project_locations
    const { data: projectLocations, error: fetchError } = await supabase
      .from('project_locations')
      .select('id, project_id, location_id, locations(title)');

    if (fetchError) {
      console.error('❌ Erro ao buscar project_locations:', fetchError);
      result.success = false;
      result.errors++;
      result.details.push(
        `Erro ao buscar project_locations: ${fetchError.message}`
      );
      return result;
    }

    if (!projectLocations || projectLocations.length === 0) {
      console.log('ℹ️ Nenhuma project_location encontrada');
      result.details.push('Nenhuma project_location encontrada');
      return result;
    }

    console.log(`📋 Encontradas ${projectLocations.length} project_locations`);

    // 2. Para cada project_location, verificar se tem etapas
    for (const projectLocation of projectLocations) {
      try {
        // Verificar se já tem etapas
        const { data: existingStages, error: stagesError } = await supabase
          .from('project_location_stages')
          .select('id')
          .eq('project_location_id', projectLocation.id);

        if (stagesError) {
          console.error(
            `❌ Erro ao verificar etapas para project_location ${projectLocation.id}:`,
            stagesError
          );
          result.errors++;
          result.details.push(
            `Erro ao verificar project_location ${projectLocation.id}: ${stagesError.message}`
          );
          continue;
        }

        // Se já tem etapas, pular
        if (existingStages && existingStages.length > 0) {
          console.log(
            `⏭️ Project_location ${projectLocation.id} já possui ${existingStages.length} etapas`
          );
          result.skipped++;
          continue;
        }

        // Criar as 11 etapas padrão
        const stagesToCreate = DEFAULT_STAGES.map(stage => ({
          ...stage,
          project_location_id: projectLocation.id,
        }));

        const { error: insertError } = await supabase
          .from('project_location_stages')
          .insert(stagesToCreate);

        if (insertError) {
          console.error(
            `❌ Erro ao criar etapas para project_location ${projectLocation.id}:`,
            insertError
          );
          result.errors++;
          result.details.push(
            `Erro ao criar etapas para project_location ${projectLocation.id}: ${insertError.message}`
          );
          continue;
        }

        const locationTitle =
          (projectLocation.locations as any)?.title || 'Sem título';
        console.log(
          `✅ Criadas 11 etapas para: "${locationTitle}" (ID: ${projectLocation.id})`
        );
        result.created++;
        result.details.push(
          `✅ Criadas etapas para "${locationTitle}" (ID: ${projectLocation.id})`
        );
      } catch (error: any) {
        console.error(
          `❌ Erro inesperado ao processar project_location ${projectLocation.id}:`,
          error
        );
        result.errors++;
        result.details.push(
          `Erro inesperado para project_location ${projectLocation.id}: ${error.message}`
        );
      }
    }

    // 3. Resumo final
    console.log('\n========================================');
    console.log('🎉 Migração Concluída!');
    console.log('========================================');
    console.log(`✅ Project locations com etapas criadas: ${result.created}`);
    console.log(`⏭️ Project locations que já tinham etapas: ${result.skipped}`);
    console.log(`❌ Erros encontrados: ${result.errors}`);
    console.log('========================================\n');

    return result;
  } catch (error: any) {
    console.error('❌ Erro fatal na migração:', error);
    result.success = false;
    result.errors++;
    result.details.push(`Erro fatal: ${error.message}`);
    return result;
  }
}

// Para uso no console do navegador:
// (window as any).migrateProjectLocationStages = migrateProjectLocationStages;

export default migrateProjectLocationStages;

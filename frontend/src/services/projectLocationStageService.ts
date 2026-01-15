import { supabase } from '../config/supabaseClient';
import { StageStatus, ProjectLocationStage } from '../types/user';

export interface StageStatusUpdate {
  status: StageStatus;
  notes?: string;
}

export interface StageHistoryEntry {
  id: number;
  stage_id: number;
  previous_status: StageStatus | null;
  new_status: StageStatus;
  previous_completion: number | null;
  new_completion: number;
  changed_by_user_id: number;
  changed_by: {
    id: number;
    full_name: string;
    avatar_url?: string;
    email: string;
  };
  change_notes?: string;
  changed_at: string;
  created_at: string;
}

class ProjectLocationStageService {
  private baseUrl = '/project-location-stages';

  /**
   * Atualiza o status de uma etapa com rastreamento de usuário
   */
  async updateStageStatus(
    stageId: number,
    status: StageStatus,
    notes?: string
  ): Promise<ProjectLocationStage> {
    const { data, error } = await supabase
      .from('project_location_stages')
      .update({
        status,
        status_changed_at: new Date().toISOString(),
        ...(notes && { notes }),
      })
      .eq('id', stageId)
      .select(
        `
        *,
        responsible_user:users!responsible_user_id(id, full_name, avatar_url, email),
        coordinator_user:users!coordinator_user_id(id, full_name, avatar_url, email),
        status_changed_by_user:users!status_changed_by_user_id(id, full_name, avatar_url, email)
      `
      )
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Obtém o histórico completo de mudanças de uma etapa
   */
  async getStageHistory(stageId: number): Promise<StageHistoryEntry[]> {
    const { data, error } = await supabase
      .from('project_location_stage_history')
      .select(
        `
        *,
        changed_by:users!changed_by_user_id(id, full_name, avatar_url, email)
      `
      )
      .eq('stage_id', stageId)
      .order('changed_at', { ascending: false });

    if (error) {
      console.error('Error fetching stage history:', error);
      return [];
    }
    return data || [];
  }

  /**
   * Busca etapas por projeto
   */
  async getStagesByProject(projectId: number): Promise<ProjectLocationStage[]> {
    const { data, error } = await supabase
      .from('project_location_stages')
      .select(
        `
        *,
        project_location!inner(project_id),
        responsible_user:users!responsible_user_id(id, full_name, avatar_url),
        coordinator_user:users!coordinator_user_id(id, full_name, avatar_url),
        status_changed_by_user:users!status_changed_by_user_id(id, full_name, avatar_url)
      `
      )
      .eq('project_location.project_id', projectId)
      .order('planned_start_date', { ascending: true });

    if (error) {
      console.error('Error fetching stages by project:', error);
      return [];
    }
    return data || [];
  }

  /**
   * Busca etapas por locação
   */
  async getStagesByProjectLocation(
    projectLocationId: number
  ): Promise<ProjectLocationStage[]> {
    const { data, error } = await supabase
      .from('project_location_stages')
      .select(
        `
        *,
        responsible_user:users!responsible_user_id(id, full_name, avatar_url),
        coordinator_user:users!coordinator_user_id(id, full_name, avatar_url),
        status_changed_by_user:users!status_changed_by_user_id(id, full_name, avatar_url)
      `
      )
      .eq('project_location_id', projectLocationId)
      .order('planned_start_date', { ascending: true });

    if (error) {
      console.error('Error fetching stages:', error);
      return [];
    }
    return data || [];
  }

  /**
   * Obtém uma etapa específica
   */
  async getById(id: number): Promise<ProjectLocationStage | null> {
    const { data, error } = await supabase
      .from('project_location_stages')
      .select(
        `
        *,
        responsible_user:users!responsible_user_id(id, full_name, avatar_url),
        coordinator_user:users!coordinator_user_id(id, full_name, avatar_url),
        status_changed_by_user:users!status_changed_by_user_id(id, full_name, avatar_url)
      `
      )
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Cria uma nova etapa
   */
  async create(
    data: Partial<ProjectLocationStage>
  ): Promise<ProjectLocationStage> {
    const { data: result, error } = await supabase
      .from('project_location_stages')
      .insert([data])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return result;
  }

  /**
   * Atualiza uma etapa
   */
  async update(
    id: number,
    data: Partial<ProjectLocationStage>
  ): Promise<ProjectLocationStage> {
    const { data: result, error } = await supabase
      .from('project_location_stages')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return result;
  }

  /**
   * Cria etapas padrão para uma locação - APENAS 7 ETAPAS
   */
  async createDefaultStages(
    projectLocationId: number
  ): Promise<ProjectLocationStage[]> {
    const { data, error } = await supabase
      .from('project_location_stages')
      .insert([
        // 1. Prospecção
        {
          project_location_id: projectLocationId,
          stage_type: 'prospeccao',
          title: 'Prospecção',
          description: 'Identificação e pesquisa do local',
          status: 'pending',
          weight: 1.0,
          is_milestone: false,
          is_critical: false,
        },
        // 2. Visita Inicial
        {
          project_location_id: projectLocationId,
          stage_type: 'visitacao',
          title: 'Visita Inicial',
          description: 'Primeira visita ao local',
          status: 'pending',
          weight: 1.5,
          is_milestone: true,
          is_critical: true,
        },
        // 3. Avaliação Técnica
        {
          project_location_id: projectLocationId,
          stage_type: 'avaliacao_tecnica',
          title: 'Avaliação Técnica',
          description: 'Análise de infraestrutura',
          status: 'pending',
          weight: 1.5,
          is_milestone: false,
          is_critical: true,
        },
        // 4. Negociação
        {
          project_location_id: projectLocationId,
          stage_type: 'negociacao',
          title: 'Negociação',
          description: 'Negociação de valores',
          status: 'pending',
          weight: 2.0,
          is_milestone: false,
          is_critical: true,
        },
        // 5. Aprovação
        {
          project_location_id: projectLocationId,
          stage_type: 'aprovacao_cliente',
          title: 'Aprovação',
          description: 'Aprovação final',
          status: 'pending',
          weight: 2.0,
          is_milestone: true,
          is_critical: true,
        },
        // 6. Contrato
        {
          project_location_id: projectLocationId,
          stage_type: 'contratacao',
          title: 'Contrato',
          description: 'Assinatura do contrato',
          status: 'pending',
          weight: 1.5,
          is_milestone: true,
          is_critical: true,
        },
        // 7. Liberação
        {
          project_location_id: projectLocationId,
          stage_type: 'entrega',
          title: 'Liberação',
          description: 'Liberação para filmagem',
          status: 'pending',
          weight: 1.5,
          is_milestone: true,
          is_critical: true,
        },
      ])
      .select();

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Remove uma etapa
   */
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('project_location_stages')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }
}

export const projectLocationStageService = new ProjectLocationStageService();
export default projectLocationStageService;

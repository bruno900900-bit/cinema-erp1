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
   * Cria etapas padrão para uma locação
   */
  async createDefaultStages(
    projectLocationId: number
  ): Promise<ProjectLocationStage[]> {
    const { data, error } = await supabase
      .from('project_location_stages')
      .insert([
        // Prospecção
        {
          project_location_id: projectLocationId,
          stage_type: 'prospeccao',
          title: 'Prospecção',
          description: 'Busca e identificação inicial da locação',
          status: 'pending',
          weight: 1.0,
          is_milestone: false,
          is_critical: false,
        },
        // Visitação
        {
          project_location_id: projectLocationId,
          stage_type: 'visitacao',
          title: 'Visitação Inicial',
          description: 'Primeira visita ao local para avaliação geral',
          status: 'pending',
          weight: 1.5,
          is_milestone: true,
          is_critical: true,
        },
        // Avaliação Técnica
        {
          project_location_id: projectLocationId,
          stage_type: 'avaliacao_tecnica',
          title: 'Avaliação Técnica',
          description: 'Avaliação técnica detalhada do local',
          status: 'pending',
          weight: 1.5,
          is_milestone: false,
          is_critical: true,
        },
        // Aprovação Cliente
        {
          project_location_id: projectLocationId,
          stage_type: 'aprovacao_cliente',
          title: 'Aprovação do Cliente',
          description: 'Apresentação e aprovação pelo cliente',
          status: 'pending',
          weight: 2.0,
          is_milestone: true,
          is_critical: true,
        },
        // Negociação
        {
          project_location_id: projectLocationId,
          stage_type: 'negociacao',
          title: 'Negociação',
          description: 'Negociação de preços e condições',
          status: 'pending',
          weight: 2.0,
          is_milestone: false,
          is_critical: true,
        },
        // Contratação
        {
          project_location_id: projectLocationId,
          stage_type: 'contratacao',
          title: 'Contratação',
          description: 'Assinatura do contrato',
          status: 'pending',
          weight: 1.5,
          is_milestone: true,
          is_critical: true,
        },
        // Preparação
        {
          project_location_id: projectLocationId,
          stage_type: 'preparacao',
          title: 'Preparação',
          description: 'Preparação do local para gravação',
          status: 'pending',
          weight: 1.0,
          is_milestone: false,
          is_critical: false,
        },
        // Setup
        {
          project_location_id: projectLocationId,
          stage_type: 'setup',
          title: 'Setup e Montagem',
          description: 'Montagem de equipamentos',
          status: 'pending',
          weight: 1.0,
          is_milestone: false,
          is_critical: false,
        },
        // Gravação
        {
          project_location_id: projectLocationId,
          stage_type: 'gravacao',
          title: 'Gravação/Filmagem',
          description: 'Período de gravação',
          status: 'pending',
          weight: 3.0,
          is_milestone: true,
          is_critical: true,
        },
        // Desmontagem
        {
          project_location_id: projectLocationId,
          stage_type: 'desmontagem',
          title: 'Desmontagem',
          description: 'Desmontagem e limpeza',
          status: 'pending',
          weight: 1.0,
          is_milestone: false,
          is_critical: false,
        },
        // Entrega
        {
          project_location_id: projectLocationId,
          stage_type: 'entrega',
          title: 'Entrega Final',
          description: 'Entrega do local',
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

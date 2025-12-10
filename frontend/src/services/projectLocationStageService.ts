import { apiService } from './api';
import {
  ProjectLocationStage,
  StageStatus,
  LocationStageType,
} from '../types/user';

export interface ProjectLocationStageCreate {
  project_location_id: number;
  stage_type: LocationStageType;
  title: string;
  description?: string;
  planned_start_date?: Date;
  planned_end_date?: Date;
  responsible_user_id?: number;
  coordinator_user_id?: number;
  weight?: number;
  is_milestone?: boolean;
  is_critical?: boolean;
  notes?: string;
  attachments_json?: Record<string, any>;
  dependencies_json?: number[];
}

export interface ProjectLocationStageUpdate {
  title?: string;
  description?: string;
  status?: StageStatus;
  completion_percentage?: number;
  planned_start_date?: Date;
  planned_end_date?: Date;
  actual_start_date?: Date;
  actual_end_date?: Date;
  responsible_user_id?: number;
  coordinator_user_id?: number;
  weight?: number;
  is_milestone?: boolean;
  is_critical?: boolean;
  notes?: string;
  attachments_json?: Record<string, any>;
  dependencies_json?: number[];
  modified_by_user_id?: number; // ID do usuário que fez a alteração (para audit trail)
}

export interface ProjectLocationStageFilter {
  project_location_ids?: number[];
  stage_types?: LocationStageType[];
  status?: StageStatus[];
  responsible_user_ids?: number[];
  is_overdue?: boolean;
  is_critical?: boolean;
  date_from?: Date;
  date_to?: Date;
}

export interface ProjectLocationStageBulkUpdate {
  stage_ids: number[];
  status?: StageStatus;
  completion_percentage?: number;
  responsible_user_id?: number;
  notes?: string;
}

export interface ProjectLocationStageTemplate {
  stage_type: LocationStageType;
  title: string;
  description: string;
  default_duration_days: number;
  weight: number;
  is_milestone: boolean;
  is_critical: boolean;
  default_responsible_role?: string;
}

export interface ProjectProgressSummary {
  total_stages: number;
  completed_stages: number;
  in_progress_stages: number;
  overdue_stages: number;
  critical_stages: number;
  overall_progress: number;
  upcoming_critical_stages: ProjectLocationStage[];
  completion_rate: number;
}

class ProjectLocationStageService {
  private baseUrl = '/project-location-stages';

  // Criar nova etapa
  async createStage(
    stageData: ProjectLocationStageCreate
  ): Promise<ProjectLocationStage> {
    try {
      const response = await apiService.post(this.baseUrl, stageData);
      return response as ProjectLocationStage;
    } catch (error) {
      console.error('Erro ao criar etapa:', error);
      throw error;
    }
  }

  // Buscar etapas com filtros
  async getStages(params?: {
    skip?: number;
    limit?: number;
    project_location_id?: number;
    project_id?: number;
    stage_types?: string;
    status?: string;
    responsible_user_ids?: string;
    is_overdue?: boolean;
    is_critical?: boolean;
    date_from?: string;
    date_to?: string;
  }): Promise<ProjectLocationStage[]> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.skip !== undefined)
        queryParams.append('skip', params.skip.toString());
      if (params?.limit !== undefined)
        queryParams.append('limit', params.limit.toString());
      if (params?.project_location_id)
        queryParams.append(
          'project_location_id',
          params.project_location_id.toString()
        );
      if (params?.project_id)
        queryParams.append('project_id', params.project_id.toString());
      if (params?.stage_types)
        queryParams.append('stage_types', params.stage_types);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.responsible_user_ids)
        queryParams.append('responsible_user_ids', params.responsible_user_ids);
      if (params?.is_overdue !== undefined)
        queryParams.append('is_overdue', params.is_overdue.toString());
      if (params?.is_critical !== undefined)
        queryParams.append('is_critical', params.is_critical.toString());
      if (params?.date_from) queryParams.append('date_from', params.date_from);
      if (params?.date_to) queryParams.append('date_to', params.date_to);

      const url = `${this.baseUrl}?${queryParams.toString()}`;
      const response = await apiService.get(url);
      return response as ProjectLocationStage[];
    } catch (error) {
      console.error('Erro ao buscar etapas:', error);
      throw error;
    }
  }

  // Buscar etapa específica
  async getStage(stageId: number): Promise<ProjectLocationStage> {
    try {
      const response = await apiService.get(`${this.baseUrl}/${stageId}`);
      return response as ProjectLocationStage;
    } catch (error) {
      console.error('Erro ao buscar etapa:', error);
      throw error;
    }
  }

  // Atualizar etapa
  async updateStage(
    stageId: number,
    stageData: ProjectLocationStageUpdate
  ): Promise<ProjectLocationStage> {
    try {
      const response = await apiService.put(
        `${this.baseUrl}/${stageId}`,
        stageData
      );
      return response as ProjectLocationStage;
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error);
      throw error;
    }
  }

  // Excluir etapa
  async deleteStage(stageId: number): Promise<void> {
    try {
      await apiService.delete(`${this.baseUrl}/${stageId}`);
    } catch (error) {
      console.error('Erro ao excluir etapa:', error);
      throw error;
    }
  }

  // Atualização em lote
  async bulkUpdateStages(
    bulkData: ProjectLocationStageBulkUpdate
  ): Promise<{ message: string }> {
    try {
      const response = await apiService.post(
        `${this.baseUrl}/bulk-update`,
        bulkData
      );
      return response as { message: string };
    } catch (error) {
      console.error('Erro ao atualizar etapas em lote:', error);
      throw error;
    }
  }

  // Criar etapas padrão
  async createDefaultStages(
    projectLocationId: number,
    templates?: ProjectLocationStageTemplate[]
  ): Promise<{ message: string; stages: ProjectLocationStage[] }> {
    try {
      const response = await apiService.post(
        `${this.baseUrl}/create-default/${projectLocationId}`,
        templates || null
      );
      return response as { message: string; stages: ProjectLocationStage[] };
    } catch (error) {
      console.error('Erro ao criar etapas padrão:', error);
      throw error;
    }
  }

  // Criar etapas padrão para uma locação específica (wrapper para compatibilidade)
  async createDefaultStagesForLocation(
    projectId: number,
    locationId: number
  ): Promise<{ message: string; stages: ProjectLocationStage[] }> {
    try {
      // Buscar o project_location_id a partir do project_id e location_id
      const response = await apiService.post(
        `${this.baseUrl}/create-default-for-location`,
        { project_id: projectId, location_id: locationId }
      );
      return response as { message: string; stages: ProjectLocationStage[] };
    } catch (error) {
      console.error('Erro ao criar etapas padrão para locação:', error);
      throw error;
    }
  }

  // Obter resumo do progresso do projeto
  async getProjectProgressSummary(
    projectId: number
  ): Promise<ProjectProgressSummary> {
    try {
      const response = await apiService.get(
        `${this.baseUrl}/project/${projectId}/progress`
      );
      return response as ProjectProgressSummary;
    } catch (error) {
      console.error('Erro ao obter resumo do progresso:', error);
      throw error;
    }
  }

  // Obter templates padrão
  async getDefaultTemplates(): Promise<{
    templates: ProjectLocationStageTemplate[];
  }> {
    try {
      const response = await apiService.get(
        `${this.baseUrl}/templates/default`
      );
      return response as { templates: ProjectLocationStageTemplate[] };
    } catch (error) {
      console.error('Erro ao obter templates padrão:', error);
      throw error;
    }
  }

  // Métodos auxiliares
  getStageTypeLabel(type: LocationStageType): string {
    const labels: Record<LocationStageType, string> = {
      [LocationStageType.PROSPECCAO]: 'Prospecção',
      [LocationStageType.VISITACAO]: 'Visitação',
      [LocationStageType.AVALIACAO_TECNICA]: 'Avaliação Técnica',
      [LocationStageType.APROVACAO_CLIENTE]: 'Aprovação Cliente',
      [LocationStageType.NEGOCIACAO]: 'Negociação',
      [LocationStageType.CONTRATACAO]: 'Contratação',
      [LocationStageType.PREPARACAO]: 'Preparação',
      [LocationStageType.SETUP]: 'Setup',
      [LocationStageType.GRAVACAO]: 'Gravação',
      [LocationStageType.DESMONTAGEM]: 'Desmontagem',
      [LocationStageType.ENTREGA]: 'Entrega',
    };
    return labels[type] || type;
  }

  getStatusLabel(status: StageStatus): string {
    const labels: Record<StageStatus, string> = {
      [StageStatus.PENDING]: 'Pendente',
      [StageStatus.IN_PROGRESS]: 'Em Andamento',
      [StageStatus.COMPLETED]: 'Concluída',
      [StageStatus.CANCELLED]: 'Cancelada',
      [StageStatus.ON_HOLD]: 'Em Espera',
    };
    return labels[status] || status;
  }

  getStatusColor(status: StageStatus): string {
    const colors: Record<StageStatus, string> = {
      [StageStatus.COMPLETED]: '#4caf50',
      [StageStatus.IN_PROGRESS]: '#2196f3',
      [StageStatus.ON_HOLD]: '#ff9800',
      [StageStatus.CANCELLED]: '#f44336',
      [StageStatus.PENDING]: '#9e9e9e',
    };
    return colors[status] || '#9e9e9e';
  }

  // Calcular progresso geral de um conjunto de etapas
  calculateOverallProgress(stages: ProjectLocationStage[]): number {
    if (stages.length === 0) return 0;

    const totalWeight = stages.reduce((sum, stage) => sum + stage.weight, 0);
    if (totalWeight === 0) return 0;

    const weightedProgress = stages.reduce(
      (sum, stage) => sum + stage.completion_percentage * stage.weight,
      0
    );

    return weightedProgress / totalWeight;
  }

  // Verificar se uma etapa está atrasada
  isStageOverdue(stage: ProjectLocationStage): boolean {
    if (!stage.planned_end_date || stage.status === StageStatus.COMPLETED) {
      return false;
    }
    return new Date() > new Date(stage.planned_end_date);
  }

  // Obter próximas etapas críticas
  getUpcomingCriticalStages(
    stages: ProjectLocationStage[]
  ): ProjectLocationStage[] {
    return stages
      .filter(
        stage =>
          stage.is_critical &&
          stage.status === StageStatus.PENDING &&
          stage.planned_start_date
      )
      .sort((a, b) => {
        const dateA = new Date(a.planned_start_date!);
        const dateB = new Date(b.planned_start_date!);
        return dateA.getTime() - dateB.getTime();
      });
  }

  // Obter etapas atrasadas
  getOverdueStages(stages: ProjectLocationStage[]): ProjectLocationStage[] {
    return stages.filter(stage => this.isStageOverdue(stage));
  }

  // Obter etapas por status
  getStagesByStatus(
    stages: ProjectLocationStage[],
    status: StageStatus
  ): ProjectLocationStage[] {
    return stages.filter(stage => stage.status === status);
  }

  // Obter marcos (milestones)
  getMilestones(stages: ProjectLocationStage[]): ProjectLocationStage[] {
    return stages.filter(stage => stage.is_milestone);
  }

  // Obter etapas críticas
  getCriticalStages(stages: ProjectLocationStage[]): ProjectLocationStage[] {
    return stages.filter(stage => stage.is_critical);
  }
}

export const projectLocationStageService = new ProjectLocationStageService();

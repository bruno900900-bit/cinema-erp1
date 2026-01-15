/**
 * Service para gerenciar Etapas do Projeto (Project Stages)
 */
import { apiService } from './api';

// ========== Tipos ==========

export type ProjectStageType =
  | 'planning'
  | 'pre_production'
  | 'location_search'
  | 'location_approval'
  | 'technical_visit'
  | 'preparation'
  | 'production'
  | 'post_production'
  | 'delivery'
  | 'custom';

export type ProjectStageStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'on_hold'
  | 'cancelled';

export interface UserBrief {
  id: number;
  full_name?: string;
  email?: string;
}

export interface StageTask {
  id: number;
  stage_id: number;
  title: string;
  description?: string;
  status: ProjectStageStatus;
  priority: string;
  due_date?: string;
  completed_at?: string;
  estimated_hours?: number;
  actual_hours?: number;
  assigned_user_id?: number;
  created_by_user_id: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  assigned_user?: UserBrief;
}

export interface StageTaskCreate {
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
  assigned_user_id?: number;
}

export interface StageTaskUpdate {
  title?: string;
  description?: string;
  status?: ProjectStageStatus;
  priority?: string;
  due_date?: string;
  assigned_user_id?: number;
  actual_hours?: number;
  notes?: string;
}

export interface ProjectStage {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  stage_type: ProjectStageType;
  status: ProjectStageStatus;
  order_index: number;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  budget_allocated?: number;
  budget_spent?: number;
  responsible_user_id?: number;
  coordinator_user_id?: number;
  supervisor_user_id?: number;
  is_sequential: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  responsible_user?: UserBrief;
  coordinator_user?: UserBrief;
  supervisor_user?: UserBrief;
  tasks: StageTask[];
}

export interface ProjectStageBrief {
  id: number;
  project_id: number;
  name: string;
  stage_type: ProjectStageType;
  status: ProjectStageStatus;
  order_index: number;
  planned_end_date?: string;
  tasks_count: number;
  completed_tasks_count: number;
}

export interface ProjectStageCreate {
  project_id: number;
  name: string;
  description?: string;
  stage_type: ProjectStageType;
  order_index?: number;
  planned_start_date?: string;
  planned_end_date?: string;
  responsible_user_id?: number;
  notes?: string;
}

export interface ProjectStageUpdate {
  name?: string;
  description?: string;
  stage_type?: ProjectStageType;
  status?: ProjectStageStatus;
  order_index?: number;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  responsible_user_id?: number;
  budget_allocated?: number;
  budget_spent?: number;
  notes?: string;
}

// ========== Service ==========

const BASE_URL = '/api/v1/project-stages';

export const projectStageService = {
  // ========== Stages ==========

  /**
   * Lista etapas de um projeto
   */
  async getByProject(projectId: number): Promise<ProjectStage[]> {
    return apiService.get(`${BASE_URL}/projects/${projectId}/stages`);
  },

  /**
   * Obtém uma etapa específica
   */
  async getById(stageId: number): Promise<ProjectStage> {
    return apiService.get(`${BASE_URL}/${stageId}`);
  },

  /**
   * Cria uma nova etapa
   */
  async create(data: ProjectStageCreate): Promise<ProjectStage> {
    return apiService.post(`${BASE_URL}/`, data);
  },

  /**
   * Inicializa etapas padrão para um projeto
   */
  async initializeDefaults(projectId: number): Promise<ProjectStageBrief[]> {
    return apiService.post(
      `${BASE_URL}/projects/${projectId}/stages/initialize`
    );
  },

  /**
   * Atualiza uma etapa
   */
  async update(
    stageId: number,
    data: ProjectStageUpdate
  ): Promise<ProjectStage> {
    return apiService.put(`${BASE_URL}/${stageId}`, data);
  },

  /**
   * Remove uma etapa
   */
  async delete(stageId: number): Promise<void> {
    await apiService.delete(`${BASE_URL}/${stageId}`);
  },

  /**
   * Reordena etapas
   */
  async reorder(
    projectId: number,
    stageIds: number[]
  ): Promise<ProjectStageBrief[]> {
    return apiService.post(
      `${BASE_URL}/projects/${projectId}/stages/reorder`,
      stageIds
    );
  },

  // ========== Tasks ==========

  /**
   * Lista tarefas de uma etapa
   */
  async getTasks(stageId: number): Promise<StageTask[]> {
    return apiService.get(`${BASE_URL}/${stageId}/tasks`);
  },

  /**
   * Cria uma tarefa em uma etapa
   */
  async createTask(
    stageId: number,
    data: StageTaskCreate,
    userId = 1
  ): Promise<StageTask> {
    const params = new URLSearchParams({
      title: data.title,
      ...(data.description && { description: data.description }),
      ...(data.priority && { priority: data.priority }),
      ...(data.due_date && { due_date: data.due_date }),
      ...(data.assigned_user_id && {
        assigned_user_id: String(data.assigned_user_id),
      }),
      user_id: String(userId),
    });
    return apiService.post(`${BASE_URL}/${stageId}/tasks?${params.toString()}`);
  },

  /**
   * Atualiza uma tarefa
   */
  async updateTask(taskId: number, data: StageTaskUpdate): Promise<StageTask> {
    return apiService.put(`${BASE_URL}/tasks/${taskId}`, data);
  },

  /**
   * Marca tarefa como concluída
   */
  async completeTask(taskId: number): Promise<StageTask> {
    return apiService.post(`${BASE_URL}/tasks/${taskId}/complete`);
  },

  /**
   * Remove uma tarefa
   */
  async deleteTask(taskId: number): Promise<void> {
    await apiService.delete(`${BASE_URL}/tasks/${taskId}`);
  },
};

// Helpers
export const STAGE_TYPE_LABELS: Record<ProjectStageType, string> = {
  planning: 'Planejamento',
  pre_production: 'Pré-Produção',
  location_search: 'Busca de Locações',
  location_approval: 'Aprovação de Locações',
  technical_visit: 'Visita Técnica',
  preparation: 'Preparação',
  production: 'Filmagem',
  post_production: 'Pós-Produção',
  delivery: 'Entrega Final',
  custom: 'Customizado',
};

export const STAGE_STATUS_LABELS: Record<ProjectStageStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
  on_hold: 'Em Pausa',
  cancelled: 'Cancelada',
};

export const STAGE_STATUS_COLORS: Record<ProjectStageStatus, string> = {
  pending: '#9e9e9e',
  in_progress: '#ff9800',
  completed: '#4caf50',
  on_hold: '#2196f3',
  cancelled: '#f44336',
};

export default projectStageService;

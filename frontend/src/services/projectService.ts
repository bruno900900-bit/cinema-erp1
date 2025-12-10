import { apiService, normalizeListResponse } from './api';
import {
  Project,
  TaskType,
  TaskStatus,
  ProjectTask,
  LocationTag,
} from '@/types/user';
import { PayloadValidator, validatePayload } from '../utils/validation';

// Helper functions
function extractClientName(source: any): string | undefined {
  return (
    source.client_name ??
    source.clientName ??
    source.customer_name ??
    source.customerName
  );
}

function toDateOnly(date: any): string | undefined {
  if (!date) return undefined;
  // Se já for string no formato YYYY-MM-DD
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;

  const d = new Date(date);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().split('T')[0];
}

function buildProjectPayload(
  project: Partial<Project>,
  { forUpdate = false }: { forUpdate?: boolean } = {}
): Record<string, any> {
  const source: any = project || {};
  const payload: Record<string, any> = {};

  const title = source.title || source.name;
  if (title) payload.title = String(title);

  const clientName = extractClientName(source);
  if (clientName !== undefined) payload.client_name = clientName;

  // Novos campos adicionados
  if (source.client_email) payload.client_email = source.client_email;
  if (source.client_phone) payload.client_phone = source.client_phone;
  if (source.notes) payload.notes = source.notes;

  if (source.description !== undefined)
    payload.description = source.description;
  if (source.status !== undefined) payload.status = source.status;

  if (source.budget !== undefined)
    payload.budget =
      typeof source.budget === 'number' ? source.budget : Number(source.budget);
  else if (source.budget_total !== undefined)
    payload.budget =
      typeof source.budget_total === 'number'
        ? source.budget_total
        : Number(source.budget_total);

  if (source.budget_spent !== undefined)
    payload.budget_spent =
      typeof source.budget_spent === 'number'
        ? source.budget_spent
        : Number(source.budget_spent);

  const startDate = toDateOnly(source.start_date ?? source.startDate);
  if (startDate) payload.start_date = startDate;

  const endDate = toDateOnly(source.end_date ?? source.endDate);
  if (endDate) payload.end_date = endDate;

  const responsible =
    source.responsibleUserId ??
    source.responsible_user_id ??
    source.responsibleuserId;
  if (responsible !== undefined && responsible !== null && responsible !== '') {
    payload.responsibleUserId = String(responsible);
  }

  const coverPhoto = source.cover_photo_url ?? source.coverPhotoUrl;
  if (coverPhoto) payload.cover_photo_url = coverPhoto;

  // Remover campos explícitos que nunca devem ser enviados
  const disallowedKeys = [
    'id',
    'locations',
    'tasks',
    'tags',
    'created_at',
    'updated_at',
    'budget_remaining',
    'owner',
  ];
  for (const key of disallowedKeys) {
    delete payload[key];
  }

  // Limpar valores undefined/null
  Object.keys(payload).forEach(key => {
    if (payload[key] === undefined || payload[key] === null) {
      delete payload[key];
    }
  });

  if (forUpdate) {
    // Em updates permitimos payload vazio (será tratado pela API)
    return payload;
  }

  return payload;
}

async function fetchProject(id: string): Promise<Project> {
  try {
    console.log(`📋 ProjectService.getProject - Buscando projeto ID: ${id}`);

    const response = await apiService.get<Project>(`/projects/${id}`);

    if (!response) {
      throw new Error('Resposta vazia do servidor');
    }

    console.log('✅ ProjectService.getProject - Sucesso:', response);
    return response;
  } catch (error) {
    console.error('❌ ProjectService.getProject - Erro:', error);

    throw new Error(`Projeto com ID ${id} não encontrado`);
  }
}

export const projectService = {
  // Buscar todos os projetos
  getProjects: async (): Promise<Project[]> => {
    try {
      console.log('📋 ProjectService.getProjects - Iniciando busca');

      const response = await apiService.get<any>('/projects');
      const result = normalizeListResponse<Project>(response, [
        'projects',
        'items',
        'results',
      ]);

      console.log(
        '✅ ProjectService.getProjects - Sucesso:',
        result.length,
        'projetos'
      );
      return result as Project[];
    } catch (error) {
      console.error('❌ ProjectService.getProjects - Erro:', error);
      throw new Error('Não foi possível carregar os projetos');
    }
  },

  // Buscar projeto por ID
  getProject: fetchProject,

  // Alias para compatibilidade de chamadas existentes
  getProjectById: fetchProject,

  // Criar novo projeto
  createProject: async (project: Partial<Project>): Promise<Project> => {
    try {
      console.log(
        '📋 ProjectService.createProject - Validando dados do projeto'
      );

      // Mapear campos para compatibilidade (aceitar camelCase e enviar snake_case)
      const normalized = buildProjectPayload(project, { forUpdate: false });

      // Validar payload antes de enviar
      const validatedData = validatePayload(
        normalized,
        PayloadValidator.validateProjectCreate,
        'criação de projeto'
      );

      console.log(
        '✅ ProjectService.createProject - Dados validados, enviando para API'
      );
      const response = await apiService.post<Project>(
        '/projects',
        validatedData
      );

      console.log(
        '✅ ProjectService.createProject - Projeto criado com sucesso:',
        response
      );
      return response;
    } catch (error: any) {
      console.error('❌ ProjectService.createProject - Erro:', error);

      // Se for erro de validação, relançar com mensagem clara
      if (error.message.includes('Dados inválidos')) {
        throw error;
      }

      throw new Error('Não foi possível criar o projeto');
    }
  },

  // Atualizar projeto
  updateProject: async (
    id: string,
    project: Partial<Project>
  ): Promise<Project> => {
    try {
      const payload = buildProjectPayload(project, { forUpdate: true });
      const response = await apiService.put<Project>(
        `/projects/${id}`,
        payload
      );
      return response;
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      throw new Error('Não foi possível atualizar o projeto');
    }
  },

  // Excluir projeto
  deleteProject: async (id: string): Promise<void> => {
    try {
      await apiService.delete(`/projects/${id}`);
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      throw new Error('Não foi possível excluir o projeto');
    }
  },

  // Buscar projetos por usuário responsável
  getProjectsByUser: async (userId: string): Promise<Project[]> => {
    try {
      const response = await apiService.get<Project[]>(
        `/projects/user/${userId}`
      );
      return response;
    } catch (error) {
      console.error('Erro ao buscar projetos por usuário:', error);
      return [];
    }
  },

  // Buscar projetos por status
  getProjectsByStatus: async (status: string): Promise<Project[]> => {
    try {
      const response = await apiService.get<Project[]>('/projects/status', {
        params: { status },
      });
      return response;
    } catch (error) {
      console.error('Erro ao buscar projetos por status:', error);
      return [];
    }
  },

  // Atualizar status do projeto
  updateProjectStatus: async (id: string, status: string): Promise<Project> => {
    try {
      const response = await apiService.patch<Project>(
        `/projects/${id}/status`,
        {
          status,
        }
      );
      return response;
    } catch (error) {
      console.error('Erro ao atualizar status do projeto:', error);
      throw new Error('Não foi possível atualizar o status do projeto');
    }
  },

  // Buscar estatísticas de projetos
  getProjectStats: async (): Promise<any> => {
    try {
      const response = await apiService.get('/projects/stats');
      return response;
    } catch (error) {
      console.error('Erro ao buscar estatísticas de projetos:', error);
      return {
        total: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
      };
    }
  },

  // Exportar projetos
  exportProjects: async (filters?: any): Promise<Blob> => {
    try {
      const response = await apiService.get<Blob>('/projects/export', {
        params: filters,
        responseType: 'blob',
      });
      return response;
    } catch (error) {
      console.error('Erro ao exportar projetos:', error);
      throw new Error('Não foi possível exportar os projetos');
    }
  },

  // Adicionar tarefa ao projeto
  addTaskToProject: async (
    projectId: string,
    task: any
  ): Promise<ProjectTask> => {
    try {
      const response = await apiService.post<ProjectTask>(
        `/projects/${projectId}/tasks`,
        task
      );
      return response;
    } catch (error) {
      console.error('Erro ao adicionar tarefa ao projeto:', error);
      throw new Error('Não foi possível adicionar a tarefa ao projeto');
    }
  },

  // Atualizar tarefa do projeto
  updateProjectTask: async (
    projectId: string,
    taskId: string,
    task: any
  ): Promise<ProjectTask> => {
    try {
      const response = await apiService.put<ProjectTask>(
        `/projects/${projectId}/tasks/${taskId}`,
        task
      );
      return response;
    } catch (error) {
      console.error('Erro ao atualizar tarefa do projeto:', error);
      throw new Error('Não foi possível atualizar a tarefa do projeto');
    }
  },

  // Remover tarefa do projeto
  removeTaskFromProject: async (
    projectId: string,
    taskId: string
  ): Promise<void> => {
    try {
      await apiService.delete(`/projects/${projectId}/tasks/${taskId}`);
    } catch (error) {
      console.error('Erro ao remover tarefa do projeto:', error);
      throw new Error('Não foi possível remover a tarefa do projeto');
    }
  },

  // Adicionar Tag ao projeto
  addTagToProject: async (
    projectId: string,
    tag: { name: string; kind: string; color?: string }
  ): Promise<LocationTag> => {
    try {
      const response = await apiService.post<LocationTag>(
        `/projects/${projectId}/tags`,
        tag
      );
      return response;
    } catch (error) {
      console.error('Erro ao adicionar tag ao projeto:', error);
      throw new Error('Não foi possível adicionar a tag ao projeto');
    }
  },

  // Remover Tag do projeto
  removeTagFromProject: async (
    projectId: string,
    tagId: string
  ): Promise<void> => {
    try {
      await apiService.delete(`/projects/${projectId}/tags/${tagId}`);
    } catch (error) {
      console.error('Erro ao remover tag do projeto:', error);
      throw new Error('Não foi possível remover a tag do projeto');
    }
  },

  // Buscar projetos por período
  getProjectsByDateRange: async (
    startDate: Date,
    endDate: Date
  ): Promise<Project[]> => {
    try {
      // Garantir que são objetos Date válidos
      const start = startDate instanceof Date ? startDate : new Date(startDate);
      const end = endDate instanceof Date ? endDate : new Date(endDate);

      // Verificar se as datas são válidas antes de chamar toISOString
      if (isNaN(start.getTime())) {
        console.error(
          'Invalid start date provided to getProjectsByDateRange:',
          startDate
        );
        return [];
      }
      if (isNaN(end.getTime())) {
        console.error(
          'Invalid end date provided to getProjectsByDateRange:',
          endDate
        );
        return [];
      }

      const response = await apiService.get<Project[]>('/projects/date-range', {
        params: {
          start_date: start.toISOString(),
          end_date: end.toISOString(),
        },
      });
      return response;
    } catch (error) {
      console.error('Erro ao buscar projetos por período:', error);
      return [];
    }
  },

  // Buscar projetos por orçamento
  getProjectsByBudget: async (
    minBudget: number,
    maxBudget: number
  ): Promise<Project[]> => {
    try {
      const response = await apiService.get<Project[]>('/projects/budget', {
        params: {
          min_budget: minBudget,
          max_budget: maxBudget,
        },
      });
      return response;
    } catch (error) {
      console.error('Erro ao buscar projetos por orçamento:', error);
      return [];
    }
  },
};

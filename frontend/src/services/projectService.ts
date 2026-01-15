import { supabase } from '../config/supabaseClient';
import {
  Project,
  TaskType,
  TaskStatus,
  ProjectTask,
  LocationTag,
} from '@/types/user';
import { PayloadValidator, validatePayload } from '../utils/validation';
import { tagService } from './tagService';
import { syncProjectToAgenda } from './projectAgendaSyncService';

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

async function resolveAuthIdToUserId(
  authId: string
): Promise<number | undefined> {
  if (!authId || typeof authId !== 'string') return undefined;
  // Check if it looks like a UUID (simple check)
  if (authId.length < 20) return undefined;

  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authId)
    .single();

  return data?.id;
}

function buildProjectPayload(
  project: Partial<Project>,
  { forUpdate = false }: { forUpdate?: boolean } = {}
): Record<string, any> {
  const source: any = project || {};
  const payload: Record<string, any> = {};

  const title = source.title || source.name;
  if (title) {
    payload.title = String(title);
    payload.name = String(title); // Supabase DB uses 'name' column
  }

  const clientName = extractClientName(source);
  if (clientName !== undefined) payload.client_name = clientName;

  // Novos campos adicionados
  if (source.client_email) payload.client_email = source.client_email;
  if (source.client_phone) payload.client_phone = source.client_phone;
  if (source.notes) payload.notes = source.notes;

  if (source.description !== undefined)
    payload.description = source.description;

  // Normalize status to valid enum values
  // Valid: 'active', 'archived', 'completed', 'on_hold', 'cancelled'
  if (source.status !== undefined) {
    const validStatuses = [
      'active',
      'archived',
      'completed',
      'on_hold',
      'cancelled',
    ];
    const normalizedStatus = String(source.status)
      .toLowerCase()
      .replace(/ /g, '_');
    if (validStatuses.includes(normalizedStatus)) {
      payload.status = normalizedStatus;
    } else {
      // Default to 'active' if invalid status
      payload.status = 'active';
    }
  } else {
    // Set default status for new projects
    payload.status = 'active';
  }

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
    // Correcting key for Supabase
    payload.responsible_user_id = String(responsible);
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

    // Supabase fetch
    const { data, error } = await supabase
      .from('projects')
      .select(
        `
        *,
        locations (*),
        tasks:project_tasks (*),
        tags:project_tags (*),
        project_locations (*)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Projeto não encontrado');

    const project = data as Project;
    console.log('✅ ProjectService.getProject - Sucesso:', project);
    return project;
  } catch (error: any) {
    console.error('❌ ProjectService.getProject - Erro (Supabase):', error);
    throw new Error(`Projeto com ID ${id} não encontrado`);
  }
}

export const projectService = {
  // Buscar todos os projetos
  getProjects: async (): Promise<Project[]> => {
    try {
      console.log('📋 ProjectService.getProjects - Iniciando busca (Supabase)');

      const { data, error } = await supabase.from('projects').select(`
          *,
          project_locations (
            *,
            location:locations (*)
          )
        `);

      if (error) throw error;

      // Map project_locations to locations for compatibility
      const projectsWithLocations = (data || []).map((p: any) => ({
        ...p,
        locations: p.project_locations || [],
      }));

      console.log(
        '✅ ProjectService.getProjects - Sucesso:',
        projectsWithLocations?.length,
        'projetos'
      );
      return projectsWithLocations as Project[];
    } catch (error: any) {
      console.error('❌ ProjectService.getProjects - Erro (Supabase):', error);
      throw new Error('Não foi possível carregar os projetos');
    }
  },

  // Buscar projeto por ID
  getProject: fetchProject,

  // Alias para compatibilidade de chamadas existentes
  getProjectById: fetchProject,

  // Criar novo projeto
  createProject: async (project: Partial<Project>): Promise<Project> => {
    const startTime = Date.now();

    try {
      console.log(
        '📋 ProjectService.createProject - Validando dados (Supabase)'
      );

      const normalized = buildProjectPayload(project, { forUpdate: false });

      // Validação local pode ser omitida se confiarmos no Supabase ou manter se for útil
      const validatedData = validatePayload(
        normalized,
        PayloadValidator.validateProjectCreate,
        'criação de projeto'
      );

      // Adicionar campos obrigatórios para Supabase se faltar
      if (!validatedData.created_by) {
        // Get current user ID
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('Usuário não autenticado. Faça login novamente.');
        }

        // Precisamos do ID numérico da tabela users, vinculado ao Auth ID
        const { data: uData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (uData) {
          validatedData.created_by = uData.id;
        } else {
          console.error(
            'Perfil de usuário não encontrado para o Auth ID:',
            user.id
          );
          throw new Error(
            'Perfil de usuário não encontrado. Entre em contato com o suporte.'
          );
        }
      }

      // Resolver responsible_user_id se for UUID
      if (
        validatedData.responsible_user_id &&
        typeof validatedData.responsible_user_id === 'string' &&
        isNaN(Number(validatedData.responsible_user_id))
      ) {
        const resolvedId = await resolveAuthIdToUserId(
          validatedData.responsible_user_id
        );
        if (resolvedId) {
          validatedData.responsible_user_id = resolvedId;
        }
      }

      console.log('✅ ProjectService.createProject - Enviando para Supabase');

      const { data, error } = await supabase
        .from('projects')
        .insert([validatedData])
        .select()
        .single();

      if (error) {
        // Detectar e reportar erro RLS específico
        if (error.code === '42501' || error.message?.includes('policy')) {
          console.error(
            '🚫 ERRO RLS detectado ao criar projeto:',
            '\n',
            'Tabela: projects',
            '\n',
            'Operação: INSERT',
            '\n',
            'Verifique as políticas RLS no Supabase Dashboard.',
            '\n',
            'Erro detalhado:',
            error
          );
        }
        throw error;
      }

      console.log('✅ ProjectService.createProject - Sucesso:', data);
      console.log(`⏱️ Tempo de operação: ${Date.now() - startTime}ms`);

      // ✨ Sincronizar datas com agenda (não bloqueia mesmo se falhar)
      syncProjectToAgenda(data as Project).catch(err =>
        console.warn('Erro ao sincronizar projeto com agenda:', err)
      );

      return data as Project;
    } catch (error: any) {
      console.error(
        '❌ ProjectService.createProject - Erro (Supabase):',
        error
      );
      console.error(`⏱️ Falhou após: ${Date.now() - startTime}ms`);

      if (error.message?.includes('Dados inválidos')) throw error;
      throw new Error('Não foi possível criar o projeto: ' + error.message);
    }
  },

  // Atualizar projeto
  updateProject: async (
    id: string,
    project: Partial<Project>
  ): Promise<Project> => {
    try {
      const payload = buildProjectPayload(project, { forUpdate: true });

      // Resolver responsible_user_id se for UUID
      if (
        payload.responsible_user_id &&
        typeof payload.responsible_user_id === 'string' &&
        isNaN(Number(payload.responsible_user_id))
      ) {
        const resolvedId = await resolveAuthIdToUserId(
          payload.responsible_user_id
        );
        if (resolvedId) {
          payload.responsible_user_id = resolvedId;
        }
      }

      const { data, error } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    } catch (error: any) {
      console.error('Erro ao atualizar projeto (Supabase):', error);
      throw new Error('Não foi possível atualizar o projeto');
    }
  },

  // Excluir projeto
  // Excluir projeto com cascata manual
  deleteProject: async (id: string): Promise<void> => {
    try {
      console.log(
        `🗑️ ProjectService.deleteProject - Excluindo dependências do projeto ${id}`
      );

      // 1. Excluir Tasks
      const { error: tasksError } = await supabase
        .from('project_tasks')
        .delete()
        .eq('project_id', id);
      if (tasksError)
        console.warn('Erro ao excluir tarefas do projeto:', tasksError);

      // 2. Excluir Project Locations
      const { error: locsError } = await supabase
        .from('project_locations')
        .delete()
        .eq('project_id', id);
      if (locsError)
        console.warn('Erro ao excluir locações do projeto:', locsError);

      // 3. Excluir Project Tags
      const { error: tagsError } = await supabase
        .from('project_tags')
        .delete()
        .eq('project_id', id);
      if (tagsError)
        console.warn('Erro ao excluir tags do projeto:', tagsError);

      // 4. Excluir Visits (se houver link direto com projeto)
      const { error: visitsError } = await supabase
        .from('visits')
        .delete()
        .eq('project_id', id);
      if (visitsError)
        console.warn('Erro ao excluir visitas do projeto:', visitsError);

      // 5. Finalmente excluir o projeto
      console.log('🗑️ ProjectService.deleteProject - Excluindo projeto');
      const { error } = await supabase.from('projects').delete().eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao excluir projeto (Supabase):', error);
      throw new Error(
        'Não foi possível excluir o projeto. Verifique se existem registros vinculados que impedem a exclusão.'
      );
    }
  },

  // Buscar projetos por usuário responsável
  getProjectsByUser: async (userId: string): Promise<Project[]> => {
    try {
      let query = supabase.from('projects').select('*');

      // Tentar converter para numérico se for string numérica
      if (!isNaN(Number(userId))) {
        query = query.or(
          `responsible_user_id.eq.${userId},manager_id.eq.${userId},coordinator_id.eq.${userId}`
        );
      } else {
        // Fallback para string (se houver coluna de UUID ou legacy)
        query = query.eq('responsible_user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as Project[]) || [];
    } catch (error: any) {
      console.error('Erro ao buscar projetos por usuário (Supabase):', error);
      return [];
    }
  },

  // Buscar projetos por status
  getProjectsByStatus: async (status: string): Promise<Project[]> => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', status);
      if (error) throw error;
      return (data as Project[]) || [];
    } catch (error: any) {
      console.error('Erro ao buscar projetos por status (Supabase):', error);
      return [];
    }
  },

  // Atualizar status do projeto
  updateProjectStatus: async (id: string, status: string): Promise<Project> => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    } catch (error: any) {
      console.error('Erro ao atualizar status do projeto (Supabase):', error);
      throw new Error('Não foi possível atualizar o status do projeto');
    }
  },

  // Buscar estatísticas de projetos
  getProjectStats: async (): Promise<any> => {
    try {
      const { count, error } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      // TODO: Implementar agregação real se necessário
      return {
        total: count || 0,
        active: 0,
        completed: 0,
        cancelled: 0,
      };
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas (Supabase):', error);
      return { total: 0, active: 0, completed: 0, cancelled: 0 };
    }
  },

  // Exportar projetos
  exportProjects: async (filters?: any): Promise<Blob> => {
    console.warn('Export functionality not migrated to Supabase yet.');
    throw new Error(
      'Funcionalidade de exportação temporariamente indisponível durante migração.'
    );
  },

  // Adicionar tarefa ao projeto
  addTask: async (
    projectId: string,
    task: Partial<ProjectTask>
  ): Promise<ProjectTask> => {
    try {
      const payload = {
        title: task.title,
        description: task.description,
        status: task.status || TaskStatus.PENDING,
        priority: task.priority || 'medium',
        due_date: task.due_date,
        project_id: projectId,
        assigned_to_id: task.assigned_to_id,
        parent_task_id: task.parent_task_id,
      };

      const { data, error } = await supabase
        .from('project_tasks')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data as ProjectTask;
    } catch (error: any) {
      console.error('Erro ao adicionar tarefa (Supabase):', error);
      throw new Error('Não foi possível adicionar a tarefa');
    }
  },

  // Atualizar status da tarefa
  updateTaskStatus: async (
    taskId: string,
    status: TaskStatus
  ): Promise<ProjectTask> => {
    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .update({ status })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectTask;
    } catch (error: any) {
      console.error('Erro ao atualizar status da tarefa (Supabase):', error);
      throw new Error('Não foi possível atualizar a tarefa');
    }
  },

  // Excluir tarefa
  deleteTask: async (taskId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', taskId);
      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao excluir tarefa (Supabase):', error);
      throw new Error('Não foi possível excluir a tarefa');
    }
  },

  // Buscar tags disponíveis
  getTags: async (): Promise<string[]> => {
    // Delegate to tagService but return names for compatibility if UI expects strings
    // Ideally UI should update to use Tag objects
    const tags = await tagService.getTags();
    return tags.map(t => t.name);
  },

  // Adicionar tag ao projeto
  addTag: async (projectId: string, tagName: string): Promise<void> => {
    try {
      // 1. Ensure tag exists and get ID
      const tag = await tagService.ensureTag(tagName);
      // 2. Link
      await tagService.addTagToResource('project', projectId, tag.id);
    } catch (error: any) {
      console.error('Erro ao adicionar tag (Supabase):', error);
      // Ignore unique violation usually
    }
  },

  // Remover tag do projeto
  removeTag: async (projectId: string, tagName: string): Promise<void> => {
    try {
      // Need ID to remove
      // 1. Find tag by name
      const tags = await tagService.searchTagsByName(tagName);
      const tag = tags.find(
        t => t.name.toLowerCase() === tagName.toLowerCase()
      );

      if (tag) {
        await tagService.removeTagFromResource('project', projectId, tag.id);
      }
    } catch (error: any) {
      console.error('Erro ao remover tag (Supabase):', error);
      throw new Error('Não foi possível remover a tag');
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

      let query = supabase.from('projects').select('*');

      if (!isNaN(start.getTime())) {
        query = query.gte('start_date', start.toISOString());
      }
      if (!isNaN(end.getTime())) {
        query = query.lte('end_date', end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as Project[]) || [];
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
      let query = supabase.from('projects').select('*');
      if (minBudget !== undefined) query = query.gte('budget_total', minBudget);
      if (maxBudget !== undefined) query = query.lte('budget_total', maxBudget);

      const { data, error } = await query;
      if (error) throw error;
      return (data as Project[]) || [];
    } catch (error) {
      console.error('Erro ao buscar projetos por orçamento:', error);
      return [];
    }
  },
};

import { supabase } from '../config/supabaseClient';

export interface UserProject {
  id: number;
  user_id: number;
  project_id: number;
  role?: string;
  project_name?: string;
  permissions?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface BulkProjectAssignment {
  project_ids: number[];
  role: string; // Changed from access_level to match database
}

export interface UserProjectListResponse {
  user_projects: UserProject[];
  projects: UserProject[];
  total: number;
}

export const userProjectService = {
  async getUserProjects(userId: number): Promise<UserProjectListResponse> {
    try {
      // Ensure userId is treated as a number, not UUID
      const numericUserId = Number(userId);

      if (isNaN(numericUserId)) {
        console.error('Invalid userId provided:', userId);
        return { user_projects: [], projects: [], total: 0 };
      }

      const { data, error } = await supabase
        .from('user_projects')
        .select('*')
        .eq('user_id', numericUserId);

      if (error) {
        console.warn('user_projects table may not exist:', error.message);
        return { user_projects: [], projects: [], total: 0 };
      }
      const userProjects = data || [];
      return {
        user_projects: userProjects,
        projects: userProjects,
        total: userProjects.length,
      };
    } catch (error) {
      console.error('Error fetching user projects:', error);
      return { user_projects: [], projects: [], total: 0 };
    }
  },

  async addUserToProject(
    userId: number,
    data: Partial<UserProject>
  ): Promise<UserProject> {
    const { data: result, error } = await supabase
      .from('user_projects')
      .insert([{ ...data, user_id: userId }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return result;
  },

  async addUserToMultipleProjects(
    userId: number,
    projectIds: number[]
  ): Promise<{ message: string; count: number }> {
    const inserts = projectIds.map(project_id => ({
      user_id: userId,
      project_id,
    }));

    const { error } = await supabase.from('user_projects').insert(inserts);

    if (error) throw new Error(error.message);
    return {
      message: 'Projetos adicionados com sucesso',
      count: projectIds.length,
    };
  },

  async removeUserFromProject(
    userId: number,
    projectId: number
  ): Promise<void> {
    const { error } = await supabase
      .from('user_projects')
      .delete()
      .eq('user_id', userId)
      .eq('project_id', projectId);

    if (error) throw new Error(error.message);
  },

  async getProjectUsers(projectId: number): Promise<UserProject[]> {
    try {
      const { data, error } = await supabase
        .from('user_projects')
        .select('*')
        .eq('project_id', projectId);

      if (error) return [];
      return data || [];
    } catch (error) {
      return [];
    }
  },

  async bulkAssignProjects(
    userId: number,
    data: BulkProjectAssignment
  ): Promise<{ message: string; count: number }> {
    const inserts = data.project_ids.map(project_id => ({
      user_id: userId,
      project_id,
      role: data.role, // Changed from access_level to role
    }));

    const { error } = await supabase.from('user_projects').insert(inserts);

    if (error) throw new Error(error.message);
    return {
      message: 'Projetos atribuídos com sucesso',
      count: data.project_ids.length,
    };
  },

  async removeProjectAccess(userId: number, projectId: number): Promise<void> {
    const { error } = await supabase
      .from('user_projects')
      .delete()
      .eq('user_id', userId)
      .eq('project_id', projectId);

    if (error) throw new Error(error.message);
  },
};

export default userProjectService;

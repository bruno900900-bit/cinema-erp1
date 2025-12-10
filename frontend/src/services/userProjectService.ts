import { apiService } from './api';

export interface UserProject {
  id: number;
  user_id: number;
  project_id: number;
  access_level: 'viewer' | 'editor' | 'admin';
  created_at: string;
  updated_at?: string;
  project_name?: string;
  project_status?: string;
}

export interface UserProjectListResponse {
  projects: UserProject[];
  total: number;
}

export interface UserProjectCreate {
  project_id: number;
  access_level: 'viewer' | 'editor' | 'admin';
}

export interface BulkProjectAssignment {
  project_ids: number[];
  access_level: 'viewer' | 'editor' | 'admin';
}

class UserProjectService {
  /**
   * Get all projects a user has access to
   */
  async getUserProjects(userId: number): Promise<UserProjectListResponse> {
    return apiService.get<UserProjectListResponse>(`/users/${userId}/projects`);
  }

  /**
   * Assign a project to a user
   */
  async assignProject(
    userId: number,
    data: UserProjectCreate
  ): Promise<UserProject> {
    return apiService.post<UserProject>(`/users/${userId}/projects`, data);
  }

  /**
   * Bulk assign projects to a user
   */
  async bulkAssignProjects(
    userId: number,
    data: BulkProjectAssignment
  ): Promise<{ message: string; count: number }> {
    return apiService.post<{ message: string; count: number }>(
      `/users/${userId}/projects/bulk`,
      data
    );
  }

  /**
   * Remove project access from a user
   */
  async removeProjectAccess(userId: number, projectId: number): Promise<void> {
    return apiService.delete<void>(`/users/${userId}/projects/${projectId}`);
  }
}

export const userProjectService = new UserProjectService();

import { apiService, normalizeListResponse } from './api';
import { User, UserRole, UserList } from '../types/user';

export interface UserCreate {
  email: string;
  full_name: string;
  password: string;
  bio?: string;
  phone?: string;
  avatar_url?: string;
  role?: UserRole;
  timezone?: string;
  locale?: string;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  bio?: string;
  phone?: string;
  avatar_url?: string;
  role?: UserRole;
  is_active?: boolean;
  password?: string;
  timezone?: string;
  locale?: string;
  preferences_json?: Record<string, unknown>;
  permissions_json?: Record<string, unknown>;
}

// UserList moved to types/user.ts

export interface UserListResponse {
  users: UserList[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface UserPasswordChange {
  current_password: string;
  new_password: string;
}

export interface UserBulkAction {
  user_ids: number[];
  action: 'activate' | 'deactivate' | 'delete' | 'change_role';
  role?: UserRole;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  role_distribution: Record<string, number>;
}

export const userService = {
  // Criar usuário
  createUser: async (userData: UserCreate): Promise<User> => {
    try {
      const response = await apiService.post<User>('/users', userData);
      return response;
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      throw new Error(
        error.message || error.response?.data?.detail || 'Erro ao criar usuário'
      );
    }
  },

  // Buscar usuários com filtros e paginação
  getUsers: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    is_active?: boolean;
  }): Promise<UserListResponse> => {
    try {
      const response = await apiService.get<any>('/users/', { params });

      // Normalizar resposta se necessário
      if (response && Array.isArray(response.users)) {
        return response;
      }

      // Fallback para lista simples
      if (Array.isArray(response)) {
        return {
          users: response,
          total: response.length,
          page: 0,
          size: response.length,
          total_pages: 1,
        };
      }

      return {
        users: [],
        total: 0,
        page: 0,
        size: 10,
        total_pages: 0,
      };
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error);
      throw new Error('Erro ao buscar lista de usuários');
    }
  },

  // Buscar usuário por ID
  getUser: async (userId: number): Promise<User> => {
    try {
      const response = await apiService.get<User>(`/users/${userId}`);
      return response;
    } catch (error: any) {
      console.error('Erro ao buscar usuário:', error);
      throw new Error('Usuário não encontrado');
    }
  },

  // Atualizar usuário
  updateUser: async (userId: number, userData: UserUpdate): Promise<User> => {
    try {
      const response = await apiService.put<User>(`/users/${userId}`, userData);
      return response;
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      throw new Error('Erro ao atualizar usuário');
    }
  },

  // Deletar usuário
  deleteUser: async (userId: number): Promise<void> => {
    try {
      await apiService.delete(`/users/${userId}`);
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      throw new Error('Erro ao excluir usuário');
    }
  },

  // Ativar usuário
  activateUser: async (userId: number): Promise<void> => {
    try {
      await apiService.patch(`/users/${userId}/activate`);
    } catch (error: any) {
      console.error('Erro ao ativar usuário:', error);
      throw new Error('Erro ao ativar usuário');
    }
  },

  // Desativar usuário
  deactivateUser: async (userId: number): Promise<void> => {
    try {
      await apiService.patch(`/users/${userId}/deactivate`);
    } catch (error: any) {
      console.error('Erro ao desativar usuário:', error);
      throw new Error(error.message || 'Erro ao desativar usuário');
    }
  },

  // Alterar senha
  changePassword: async (
    userId: number,
    passwordData: UserPasswordChange
  ): Promise<void> => {
    try {
      await apiService.patch(`/users/${userId}/change-password`, passwordData);
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      throw new Error('Erro ao alterar senha');
    }
  },

  // Ação em lote
  bulkAction: async (
    actionData: UserBulkAction
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiService.post<{
        success: boolean;
        message: string;
      }>('/users/bulk-action', actionData);
      return response;
    } catch (error: any) {
      console.error('Erro na ação em lote:', error);
      throw new Error('Não foi possível executar a ação em lote');
    }
  },

  // Buscar usuários por role
  getUsersByRole: async (role: UserRole): Promise<UserList[]> => {
    try {
      const response = await apiService.get<any>(`/users/role/${role}`);
      return normalizeListResponse<UserList>(response, [
        'users',
        'items',
        'results',
      ]);
    } catch (error: any) {
      console.error('Erro ao buscar usuários por role:', error);
      return [];
    }
  },

  // Estatísticas de usuários
  getUserStats: async (): Promise<UserStats> => {
    try {
      const response = await apiService.get<UserStats>('/users/stats/summary');
      return response;
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas:', error);
      // Retornar objeto vazio seguro em caso de erro
      return {
        total_users: 0,
        active_users: 0,
        inactive_users: 0,
        role_distribution: {},
      };
    }
  },

  // Usuários disponíveis para atribuição
  getUsersForAssignment: async (): Promise<UserList[]> => {
    try {
      const response = await apiService.get<any>('/users/assignment/available');
      return normalizeListResponse<UserList>(response, [
        'users',
        'items',
        'results',
      ]);
    } catch (error: any) {
      console.error('Erro ao buscar usuários para atribuição:', error);
      return [];
    }
  },

  // Resumo de atividades do usuário
  getUserActivitySummary: async (
    userId: number
  ): Promise<{ activities: unknown[]; summary: Record<string, unknown> }> => {
    try {
      const response = await apiService.get<{
        activities: unknown[];
        summary: Record<string, unknown>;
      }>(`/users/${userId}/activity`);
      return response;
    } catch (error: any) {
      console.error('Erro ao buscar resumo de atividades:', error);
      return { activities: [], summary: {} };
    }
  },

  // Perfil do usuário atual
  getMyProfile: async (): Promise<User> => {
    try {
      const response = await apiService.get<User>('/users/me/profile');
      return response;
    } catch (error: any) {
      console.error('Erro ao buscar perfil do usuário:', error);
      throw new Error('Não foi possível carregar o perfil do usuário');
    }
  },

  // Atualizar perfil do usuário atual
  updateMyProfile: async (userData: UserUpdate): Promise<User> => {
    try {
      const response = await apiService.put<User>(
        '/users/me/profile',
        userData as Record<string, unknown>
      );
      return response;
    } catch (error: any) {
      console.error(
        'Erro ao atualizar perfil do usuário:',
        error?.response?.data || error
      );
      throw new Error('Não foi possível atualizar o perfil do usuário');
    }
  },

  // Atualizar permissões do usuário
  updateUserPermissions: async (
    userId: number,
    permissions: Record<string, unknown>
  ): Promise<void> => {
    try {
      await userService.updateUser(userId, { permissions_json: permissions });
    } catch (error: any) {
      console.error('Erro ao atualizar permissões do usuário:', error);
      throw new Error('Não foi possível atualizar as permissões do usuário');
    }
  },
};

export const getUserRoleLabel = (role: UserRole): string => {
  const labels = {
    [UserRole.ADMIN]: 'Administrador',
    [UserRole.MANAGER]: 'Gerente',
    [UserRole.COORDINATOR]: 'Coordenador',
    [UserRole.OPERATOR]: 'Operador',
    [UserRole.VIEWER]: 'Visualizador',
    [UserRole.CLIENT]: 'Cliente',
    [UserRole.CONTRIBUTOR]: 'Contribuidor (Novo)',
  };
  return labels[role] || role;
};

export const getUserRoleColor = (role: UserRole): string => {
  const colors: Record<string, string> = {
    [UserRole.ADMIN]: 'error',
    [UserRole.MANAGER]: 'warning',
    [UserRole.COORDINATOR]: 'info',
    [UserRole.OPERATOR]: 'primary',
    [UserRole.VIEWER]: 'secondary',
    [UserRole.CLIENT]: 'success',
    [UserRole.CONTRIBUTOR]: 'default',
  };
  return colors[role] || 'default';
};

export default userService;

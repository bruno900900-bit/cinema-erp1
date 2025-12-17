// src/services/userService.ts
import { supabase } from '../config/supabaseClient';
import {
  User,
  UserRole,
  UserList,
  UserCreate,
  UserUpdate,
  UserPasswordChange,
  UserBulkAction,
  UserStats,
} from '../types/user';
import { withDiagnostic } from '../utils/withDiagnostic';

// Cache de requests em andamento para evitar duplicatas
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Wrapper para requests com deduplication
 * Evita múltiplas chamadas simultâneas para o mesmo recurso
 */
async function withDeduplication<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  // Se já existe uma request em andamento, reutiliza
  if (pendingRequests.has(key)) {
    console.log(`🔄 Reusing pending user request for: ${key}`);
    return pendingRequests.get(key) as Promise<T>;
  }

  // Cria nova request
  const request = requestFn().finally(() => {
    // Remove do cache quando completar
    pendingRequests.delete(key);
  });

  // Armazena no cache
  pendingRequests.set(key, request);

  return request;
}

export const userService = {
  // Create user
  createUser: (userData: UserCreate) =>
    withDiagnostic('userService.createUser', async () => {
      const payload = { ...userData, password_hash: 'managed_by_auth' };
      // @ts-ignore: remove password if present
      delete payload.password;
      const { data, error } = await supabase
        .from('users')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data as User;
    }),

  // Create user as admin (with Supabase Auth integration)
  createUserAsAdmin: (userData: {
    email: string;
    full_name: string;
    role: UserRole;
    permissions_json?: Record<string, boolean>;
    phone?: string;
    bio?: string;
  }) =>
    withDiagnostic('userService.createUserAsAdmin', async () => {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email: userData.email,
            full_name: userData.full_name,
            role: userData.role,
            permissions_json: userData.permissions_json || {},
            phone: userData.phone,
            bio: userData.bio,
            is_active: true,
            password_hash: '', // Managed by Supabase Auth
          },
        ])
        .select()
        .single();
      if (error) throw error;
      return data as User;
    }),

  // Get users with filters & pagination
  getUsers: (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    is_active?: boolean;
  }) => {
    const cacheKey = `users-${JSON.stringify(params || {})}`;

    return withDeduplication(cacheKey, () =>
      withDiagnostic('userService.getUsers', async () => {
        let query = supabase.from('users').select('*', { count: 'exact' });
        if (params?.role) query = query.eq('role', params.role);
        if (params?.is_active !== undefined)
          query = query.eq('is_active', params.is_active);
        if (params?.search) {
          query = query.or(
            `email.ilike.%${params.search}%,full_name.ilike.%${params.search}%`
          );
        }
        if (params?.limit) {
          const from = params.skip || 0;
          const to = from + params.limit - 1;
          query = query.range(from, to);
        }
        const { data, error, count } = await query;
        if (error) throw error;
        const size = params?.limit || 10;
        const page =
          params?.skip && params?.limit
            ? Math.floor(params.skip / params.limit)
            : 0;
        const total = count || 0;
        const total_pages = Math.ceil(total / size);
        return {
          users: (data as UserList[]) || [],
          total,
          page,
          size,
          total_pages,
        };
      })
    );
  },

  // Get single user by ID
  getUser: (userId: number) =>
    withDiagnostic('userService.getUser', async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      if (!data) throw new Error('User not found');
      return data as User;
    }),

  // Update user
  updateUser: (userId: number, userData: UserUpdate) =>
    withDiagnostic('userService.updateUser', async () => {
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return data as User;
    }),

  // Delete user
  deleteUser: (userId: number) =>
    withDiagnostic('userService.deleteUser', async () => {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
    }),

  // Activate user
  activateUser: (userId: number) =>
    withDiagnostic('userService.activateUser', async () => {
      const { error } = await supabase
        .from('users')
        .update({ is_active: true })
        .eq('id', userId);
      if (error) throw error;
    }),

  // Deactivate user
  deactivateUser: (userId: number) =>
    withDiagnostic('userService.deactivateUser', async () => {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId);
      if (error) throw error;
    }),

  // Change password – delegated to auth service
  changePassword: async () => {
    throw new Error('Use authService.changePassword() for password changes');
  },

  // Bulk actions
  bulkAction: (actionData: UserBulkAction) =>
    withDiagnostic('userService.bulkAction', async () => {
      if (actionData.action === 'delete') {
        const { error } = await supabase
          .from('users')
          .delete()
          .in('id', actionData.user_ids);
        if (error) throw error;
      } else if (actionData.action === 'activate') {
        const { error } = await supabase
          .from('users')
          .update({ is_active: true })
          .in('id', actionData.user_ids);
        if (error) throw error;
      } else if (actionData.action === 'deactivate') {
        const { error } = await supabase
          .from('users')
          .update({ is_active: false })
          .in('id', actionData.user_ids);
        if (error) throw error;
      } else if (actionData.action === 'change_role' && actionData.role) {
        const { error } = await supabase
          .from('users')
          .update({ role: actionData.role })
          .in('id', actionData.user_ids);
        if (error) throw error;
      }
      return { success: true, message: 'Bulk action completed' };
    }),

  // Users by role
  getUsersByRole: (role: UserRole) =>
    withDiagnostic('userService.getUsersByRole', async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', role);
      if (error) throw error;
      return (data as UserList[]) || [];
    }),

  // User statistics
  getUserStats: () =>
    withDiagnostic('userService.getUserStats', async () => {
      const [all, active, inactive, roles] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', false),
        supabase.from('users').select('role'),
      ]);
      const roleDist: Record<string, number> = {};
      (roles.data || []).forEach((u: any) => {
        const r = u.role || 'unknown';
        roleDist[r] = (roleDist[r] || 0) + 1;
      });
      return {
        total_users: all.count || 0,
        active_users: active.count || 0,
        inactive_users: inactive.count || 0,
        role_distribution: roleDist,
      };
    }),

  // Users for assignment (active only)
  getUsersForAssignment: () =>
    withDiagnostic('userService.getUsersForAssignment', async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return (data as UserList[]) || [];
    }),

  // Current user profile
  getMyProfile: () =>
    withDiagnostic('userService.getMyProfile', async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();
      if (error) throw error;
      return data as User;
    }),

  // Update current user profile
  updateMyProfile: (userData: UserUpdate) =>
    withDiagnostic('userService.updateMyProfile', async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('email', user.email)
        .select()
        .single();
      if (error) throw error;
      return data as User;
    }),

  // Update user permissions
  updateUserPermissions: (
    userId: number,
    permissions: Record<string, unknown>
  ) =>
    withDiagnostic('userService.updateUserPermissions', async () => {
      await userService.updateUser(userId, {
        permissions_json: permissions,
      } as any);
    }),
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

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

// Re-exporta tipos para componentes que importam a partir do service
export type {
  User,
  UserList,
  UserCreate,
  UserUpdate,
  UserPasswordChange,
  UserBulkAction,
  UserStats,
} from '../types/user';
// UserRole é enum (valor), re-exportado como valor
export { UserRole } from '../types/user';

// Cache de requests em andamento para evitar duplicatas
const pendingRequests = new Map<string, Promise<any>>();

// Flag global para suprimir eventos de auth durante criação de usuário pelo admin
// Evita que o onAuthStateChange reaja ao SIGNED_IN disparado pelo signUp()
export let isAdminCreatingUser = false;

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
  // This creates the user in Supabase Auth AND in our users table
  createUserAsAdmin: (userData: {
    email: string;
    full_name: string;
    role: UserRole;
    password: string;
    permissions_json?: Record<string, boolean>;
    phone?: string;
    bio?: string;
  }) =>
    withDiagnostic('userService.createUserAsAdmin', async () => {
      // Step 0: Check if email already exists in database
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, email, auth_id')
        .eq('email', userData.email)
        .maybeSingle();

      if (existingUser) {
        throw new Error(
          `O email "${userData.email}" já está cadastrado. Por favor, use outro email.`
        );
      }

      // ⚠️ FIX: Save admin session BEFORE signUp to avoid being redirected
      // Supabase's signUp() automatically logs in as the new user, kicking the admin out
      const { data: currentSessionData } = await supabase.auth.getSession();
      const adminSession = currentSessionData?.session;

      // 🚩 Ativa flag para suprimir eventos de auth durante a criação
      isAdminCreatingUser = true;
      console.log(
        '🚩 [AdminCreate] Suprimindo eventos de auth durante criação de usuário'
      );

      let authData: any;
      let authError: any;

      try {
        // Step 1: Create user in Supabase Auth using signUp
        const result = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              full_name: userData.full_name,
              role: userData.role,
            },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });
        authData = result.data;
        authError = result.error;
      } finally {
        // ✅ Immediately restore admin session before anything else
        if (adminSession?.access_token && adminSession?.refresh_token) {
          await supabase.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token,
          });
          console.log('✅ Admin session restored after user creation');
        }
        // 🚩 Desativa flag após restaurar sessão do admin
        isAdminCreatingUser = false;
        console.log('🚩 [AdminCreate] Flag de supressão desativada');
      }

      if (authError) {
        console.error('Error creating user in Supabase Auth:', authError);
        throw new Error(`Erro ao criar usuário no Auth: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Falha ao criar usuário no Supabase Auth');
      }

      const authUserId = authData.user.id;

      // Step 2: Create user record in our users table with auth_id
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            auth_id: authUserId,
            email: userData.email,
            full_name: userData.full_name,
            role: userData.role,
            permissions_json: userData.permissions_json || {},
            phone: userData.phone,
            bio: userData.bio,
            is_active: true,
            password_hash: 'managed_by_supabase_auth',
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating user in database:', error);
        console.warn(
          `⚠️ Rollback needed for auth user ${authUserId} - please delete via Supabase dashboard if user is orphaned`
        );
        throw new Error(
          `Usuário criado no Auth mas falhou ao salvar no banco: ${error.message}. Entre em contato com o administrador.`
        );
      }

      console.log('✅ User created successfully in Auth and database:', data);
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

  // Delete user with cascade cleanup
  deleteUser: (userId: number) =>
    withDiagnostic('userService.deleteUser', async () => {
      console.log(`🗑️ Deleting user ${userId} and cleaning up dependencies`);

      // 1. Delete user_projects (user-project associations)
      const { error: userProjectsError } = await supabase
        .from('user_projects')
        .delete()
        .eq('user_id', userId);
      if (userProjectsError)
        console.warn('Error deleting user_projects:', userProjectsError);

      // 2. Delete user_notifications
      const { error: notificationsError } = await supabase
        .from('user_notifications')
        .delete()
        .eq('user_id', userId);
      if (notificationsError)
        console.warn('Error deleting user_notifications:', notificationsError);

      // 3. Delete user_settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', userId);
      if (settingsError)
        console.warn('Error deleting user_settings:', settingsError);

      // 4. Unassign from location_demands (preserve demands, just remove assignment)
      const { error: demandsError } = await supabase
        .from('location_demands')
        .update({ assigned_user_id: null })
        .eq('assigned_user_id', userId);
      if (demandsError)
        console.warn('Error unassigning location_demands:', demandsError);

      // 5. Unassign from project_tasks (preserve tasks, just remove assignment)
      const { error: tasksError } = await supabase
        .from('project_tasks')
        .update({ assigned_to: null })
        .eq('assigned_to', userId);
      if (tasksError)
        console.warn('Error unassigning project_tasks:', tasksError);

      // 6. Update projects - nullify user references to preserve projects
      // Use separate updates for each role to avoid complex OR queries
      await supabase
        .from('projects')
        .update({ manager_id: null })
        .eq('manager_id', userId);

      await supabase
        .from('projects')
        .update({ coordinator_id: null })
        .eq('coordinator_id', userId);

      await supabase
        .from('projects')
        .update({ supervisor_id: null })
        .eq('supervisor_id', userId);

      await supabase
        .from('projects')
        .update({ responsible_user_id: null })
        .eq('responsible_user_id', userId);

      // 7. Finally, delete the user record
      console.log('🗑️ Deleting user record from database');
      const { error } = await supabase.from('users').delete().eq('id', userId);

      if (error) {
        console.error('❌ Error deleting user:', error);
        throw error;
      }

      console.log('✅ User and all dependencies cleaned up successfully');
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

  // ===== Aliases de compatibilidade (componentes legados) =====
  getUsersList: (): Promise<UserList[]> =>
    withDiagnostic('userService.getUsersList', async () => {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return (data as UserList[]) || [];
    }),

  createUserNew: (userData: any): Promise<User> =>
    userService.createUser(userData as UserCreate),

  updateUserNew: (userId: number, userData: any): Promise<User> =>
    userService.updateUser(userId, userData as UserUpdate),

  deleteUserNew: (userId: number): Promise<void> =>
    userService.deleteUser(userId),

  // Update user permissions
  updateUserPermissions: (
    userId: number,
    permissions: Record<string, unknown>
  ) =>
    withDiagnostic('userService.updateUserPermissions', async () => {
      const { data, error } = await supabase
        .from('users')
        .update({ permissions_json: permissions })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user permissions:', error);
        throw error;
      }

      console.log('✅ User permissions updated successfully');
      return data as User;
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

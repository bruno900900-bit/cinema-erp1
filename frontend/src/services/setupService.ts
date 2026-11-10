// Setup Service - Migrated to return static "complete" status
// No backend needed - setup is managed via Supabase directly
import { userService } from './userService';
import { UserRole } from '../types/user';

export interface SetupStatus {
  is_setup_complete: boolean;
  message?: string;
}

export const setupService = {
  async getSetupStatus(): Promise<SetupStatus> {
    // Setup is always complete when using Supabase
    return {
      is_setup_complete: true,
      message: 'Sistema configurado com Supabase',
    };
  },

  async initializeSystem(): Promise<{ message: string }> {
    // No initialization needed - Supabase handles everything
    return { message: 'Sistema já inicializado' };
  },

  // Cria o usuário administrador inicial do sistema
  async createAdminUser(data: {
    full_name: string;
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<void> {
    await userService.createUserAsAdmin({
      email: data.email,
      full_name: data.full_name,
      password: data.password,
      role: data.role || UserRole.ADMIN,
    });
  },
};

export default setupService;

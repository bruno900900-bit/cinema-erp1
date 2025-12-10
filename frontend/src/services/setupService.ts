import { apiService } from './api';

export interface SetupStatus {
  is_configured: boolean;
  user_count: number;
  message: string;
}

export const setupService = {
  // Verificar status do setup
  getSetupStatus: async (): Promise<SetupStatus> => {
    const response = await apiService.get<SetupStatus>('/setup/status');
    return response;
  },

  // Criar usuário administrador
  createAdminUser: async (userData: {
    full_name: string;
    email: string;
    password: string;
    role: string;
  }): Promise<any> => {
    const response = await apiService.post<any>(
      '/setup/create-admin',
      userData
    );
    return response;
  },
};

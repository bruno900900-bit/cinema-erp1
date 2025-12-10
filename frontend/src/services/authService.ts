import { apiService } from './api';
import { User } from '../types/user';

interface LoginResponse {
  user: User;
  token: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiService.post<LoginResponse>(
        '/auth/login',
        credentials
      );
      return response;
    } catch (error) {
      console.error('Erro no login:', error);
      throw new Error('Credenciais inválidas');
    }
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      localStorage.removeItem('auth_token');
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiService.get<User>('/auth/me');
      return response;
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      // Retornar usuário mock para demonstração
      return this.getMockUser();
    }
  }

  private getMockUser(): User {
    return {
      id: '1',
      full_name: 'João Silva',
      name: 'João Silva',
      email: 'joao.silva@cinema.com',
      role: 'admin' as any,
      avatar_url: undefined,
      is_active: true,
      timezone: 'America/Sao_Paulo',
      locale: 'pt-BR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async refreshToken(): Promise<{ token: string }> {
    try {
      const response = await apiService.post<{ token: string }>(
        '/auth/refresh'
      );
      return response;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      throw new Error('Não foi possível renovar o token');
    }
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      await apiService.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      throw new Error('Não foi possível alterar a senha');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      await apiService.post('/auth/forgot-password', { email });
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      throw new Error('Não foi possível processar a solicitação');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await apiService.post('/auth/reset-password', {
        token,
        new_password: newPassword,
      });
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      throw new Error('Não foi possível redefinir a senha');
    }
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token;
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}

export const authService = new AuthService();

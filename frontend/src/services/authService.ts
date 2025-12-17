import { supabase } from '../config/supabaseClient';
import { User, UserRole } from '../types/user';

interface LoginResponse {
  user: User;
  token: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface SignUpRequest {
  email: string;
  password: string;
  full_name: string;
}

class AuthService {
  async signUp(data: SignUpRequest): Promise<void> {
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro no cadastro (Supabase):', error);
      throw new Error('Não foi possível criar a conta: ' + error.message);
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Usuário não encontrado');

      // Buscar dados do perfil público via auth_id
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', data.user.id) // Query by UUID
        .single();

      if (profileError) {
        console.warn(
          'Perfil público não encontrado, usando dados básicos de auth'
        );
      }

      const user: User = (profile as User) || {
        id: String(data.user.id), // Supabase Auth ID is UUID string usually, but if numeric ID needed from table
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || 'Usuário',
        role: (data.user.app_metadata?.role as any) || 'viewer',
        created_at: data.user.created_at,
        updated_at: data.user.updated_at || data.user.created_at,
        is_active: true,
        timezone: 'America/Sao_Paulo',
        locale: 'pt-BR',
      };

      return {
        user,
        token: data.session?.access_token || '',
      };
    } catch (error: any) {
      console.error('Erro no login (Supabase):', error);
      throw new Error('Credenciais inválidas ou erro no login');
    }
  }

  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Erro no logout (Supabase):', error);
    } finally {
      localStorage.removeItem('auth_token');
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Tentar buscar perfil completo usando auth_id (UUID)
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      if (profile) return profile as User;

      // Fallback
      return {
        id: '0', // Temp ID as string
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'Usuário',
        role: 'viewer', // Default
        is_active: true,
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
        timezone: 'America/Sao_Paulo',
        locale: 'pt-BR',
      } as User;
    } catch (error) {
      console.error('Erro ao obter usuário atual (Supabase):', error);
      throw error;
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
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!data.session) throw new Error('No session');

      return { token: data.session.access_token };
    } catch (error) {
      console.error('Erro ao obter sessão:', error);
      throw new Error('Não foi possível renovar o token');
    }
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao alterar senha (Supabase):', error);
      throw new Error('Não foi possível alterar a senha');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      console.error(
        'Erro ao solicitar recuperação de senha (Supabase):',
        error
      );
      throw new Error('Não foi possível processar a solicitação');
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Supabase trata reset via link mágico que loga o usuário.
      // Estando logado, usamos updateUser
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao redefinir senha (Supabase):', error);
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

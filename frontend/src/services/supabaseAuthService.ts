/**
 * Serviço de autenticação usando Supabase Auth
 * Substitui o Firebase Auth com funcionalidades equivalentes
 */

import { supabase } from '../config/supabaseClient';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface SupabaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

class SupabaseAuthService {
  /**
   * Login com email e senha
   */
  async login(email: string, password: string): Promise<SupabaseUser> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Usuário não encontrado');

      return this.mapUser(data.user);
    } catch (error: any) {
      console.error('Erro no login Supabase:', error);
      throw new Error(this.getErrorMessage(error.message));
    }
  }

  /**
   * Registro de novo usuário
   */
  async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<SupabaseUser> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Erro ao criar usuário');

      return this.mapUser(data.user);
    } catch (error: any) {
      console.error('Erro no registro Supabase:', error);
      throw new Error(this.getErrorMessage(error.message));
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error('Erro no logout Supabase:', error);
      throw new Error('Erro ao fazer logout');
    }
  }

  /**
   * Obter usuário atual
   */
  getCurrentUser(): SupabaseUser | null {
    const { data } = supabase.auth.getSession();
    // This is synchronous, but session might not be loaded yet
    // Better to use onAuthStateChanged
    const user = data.session?.user;
    return user ? this.mapUser(user) : null;
  }

  /**
   * Obter sessão atual
   */
  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Erro ao obter sessão:', error);
      return null;
    }
    return data.session;
  }

  /**
   * Observar mudanças no estado de autenticação
   */
  onAuthStateChanged(
    callback: (user: SupabaseUser | null) => void
  ): () => void {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        callback(this.mapUser(session.user));
      } else {
        callback(null);
      }
    });

    // Retorna função para cancelar a subscription
    return () => {
      data.subscription.unsubscribe();
    };
  }

  /**
   * Recuperar senha
   */
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao enviar email de recuperação:', error);
      throw new Error(this.getErrorMessage(error.message));
    }
  }

  /**
   * Alterar senha (requer usuário autenticado)
   */
  async changePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      throw new Error(this.getErrorMessage(error.message));
    }
  }

  /**
   * Atualizar perfil do usuário
   */
  async updateProfile(displayName: string, photoURL?: string): Promise<void> {
    try {
      const updates: any = {
        data: {
          display_name: displayName,
        },
      };

      if (photoURL) {
        updates.data.photo_url = photoURL;
      }

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      throw new Error('Erro ao atualizar perfil');
    }
  }

  /**
   * Obter token de acesso
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) return null;
      return data.session.access_token;
    } catch (error) {
      console.error('Erro ao obter token:', error);
      return null;
    }
  }

  /**
   * Verificar se usuário está autenticado
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return !!session;
  }

  /**
   * Mapear User do Supabase para SupabaseUser
   */
  private mapUser(user: User): SupabaseUser {
    return {
      uid: user.id,
      email: user.email || null,
      displayName:
        user.user_metadata?.display_name || user.email?.split('@')[0] || null,
      photoURL:
        user.user_metadata?.photo_url || user.user_metadata?.avatar_url || null,
      emailVerified: !!user.email_confirmed_at,
    };
  }

  /**
   * Converter mensagens de erro
   */
  private getErrorMessage(errorMessage: string): string {
    const errorMessages: { [key: string]: string } = {
      'Invalid login credentials': 'Email ou senha incorretos',
      'User already registered': 'Este email já está em uso',
      'Password should be at least 6 characters':
        'A senha deve ter pelo menos 6 caracteres',
      'Invalid email': 'Email inválido',
      'Email not confirmed': 'Email não confirmado',
      'User not found': 'Usuário não encontrado',
    };

    // Procurar por correspondência parcial
    for (const [key, value] of Object.entries(errorMessages)) {
      if (errorMessage.includes(key)) {
        return value;
      }
    }

    return 'Erro de autenticação';
  }
}

// Exportar instância única
export const supabaseAuthService = new SupabaseAuthService();
export default supabaseAuthService;

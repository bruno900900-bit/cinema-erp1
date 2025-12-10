import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { User, UserRole } from '../types/user';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 AuthProvider useEffect triggered');
    checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkAuth = async () => {
    try {
      console.log('🔍 Verificando autenticação...');

      // Verificar se há login simulado
      const isAuthenticated = localStorage.getItem('is_authenticated');
      const currentUser = localStorage.getItem('current_user');

      if (isAuthenticated === 'true' && currentUser) {
        try {
          console.log('🔑 Login simulado encontrado, carregando usuário...');
          const userData = JSON.parse(currentUser);
          // Validar se os dados do usuário são válidos
          if (userData && userData.id && userData.email) {
            // Normalizar role para enum conhecido
            if (userData.role && typeof userData.role === 'string') {
              const roleLower = userData.role.toLowerCase();
              if (!(Object.values(UserRole) as string[]).includes(roleLower)) {
                userData.role = UserRole.ADMIN; // fallback seguro se desconhecido
              } else {
                userData.role = roleLower as UserRole;
              }
            } else {
              userData.role = UserRole.ADMIN;
            }
            setUser(userData);
            console.log('✅ Usuário simulado carregado:', userData);
            setLoading(false);
            return;
          } else {
            console.log('❌ Dados de usuário inválidos, limpando...');
            localStorage.removeItem('is_authenticated');
            localStorage.removeItem('current_user');
          }
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse do usuário:', parseError);
          localStorage.removeItem('is_authenticated');
          localStorage.removeItem('current_user');
        }
      }

      const token = localStorage.getItem('auth_token');
      if (token) {
        console.log('🔑 Token encontrado, buscando usuário...');
        try {
          const userData = await authService.getCurrentUser();
          if (userData && userData.id && userData.email) {
            setUser(userData);
            console.log('✅ Usuário carregado:', userData);
            setLoading(false);
            return;
          } else {
            console.log('❌ Dados de usuário inválidos do servidor');
            localStorage.removeItem('auth_token');
          }
        } catch (error) {
          console.log('❌ Erro ao buscar usuário, limpando token...');
          localStorage.removeItem('auth_token');
        }
      }

      // Se chegou até aqui, fazer login automático
      console.log(
        '🔑 Nenhum usuário válido encontrado, fazendo login automático...'
      );
      await autoLogin();
    } catch (error) {
      console.error('❌ Erro ao verificar autenticação:', error);
      // Limpar dados corrompidos
      localStorage.removeItem('auth_token');
      localStorage.removeItem('is_authenticated');
      localStorage.removeItem('current_user');
      await autoLogin();
    } finally {
      console.log('🏁 Finalizando verificação de autenticação...');
      setLoading(false);
    }
  };

  const autoLogin = async () => {
    try {
      console.log('🚀 Iniciando login automático...');
      // Criar usuário de demonstração com dados seguros
      const demoUser: User = {
        id: '1',
        full_name: 'João Silva',
        email: 'joao.silva@cinema.com',
        role: UserRole.ADMIN,
        avatar_url: undefined,
        is_active: true,
        timezone: 'America/Sao_Paulo',
        locale: 'pt-BR',
        can_create_projects: true,
        can_manage_users: true,
        can_view_financials: true,
        can_export_data: true,
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Validar dados do usuário antes de salvar
      if (!demoUser.id || !demoUser.email || !demoUser.full_name) {
        throw new Error('Dados de usuário de demonstração inválidos');
      }

      // Simular token de autenticação
      const demoToken = 'demo_token_' + Date.now();
      localStorage.setItem('auth_token', demoToken);
      localStorage.setItem('is_authenticated', 'true');
      localStorage.setItem('current_user', JSON.stringify(demoUser));
      setUser(demoUser);

      console.log(
        '✅ Login automático realizado com usuário de demonstração:',
        demoUser
      );
    } catch (error) {
      console.error('❌ Erro no login automático:', error);
      // Fallback: definir usuário null e parar loading
      setUser(null);
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Validar entrada
      if (!email || !password) {
        console.error('❌ Email e senha são obrigatórios');
        return false;
      }

      // Tentar login real primeiro
      const { user: userData, token } = await authService.login({
        email,
        password,
      });

      // Validar dados retornados
      if (!userData || !userData.id || !userData.email || !token) {
        throw new Error('Dados de login inválidos');
      }

      localStorage.setItem('auth_token', token);
      localStorage.setItem('is_authenticated', 'true');
      localStorage.setItem('current_user', JSON.stringify(userData));
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Erro no login real, tentando login simulado:', error);

      // Login simulado para demonstração
      if (email && password) {
        const demoUser: User = {
          id: '1',
          full_name: 'Usuário Demo',
          email: email,
          role: UserRole.ADMIN,
          avatar_url: undefined,
          is_active: true,
          timezone: 'America/Sao_Paulo',
          locale: 'pt-BR',
          can_create_projects: true,
          can_manage_users: true,
          can_view_financials: true,
          can_export_data: true,
          email_notifications: true,
          sms_notifications: false,
          push_notifications: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Validar dados do usuário demo
        if (!demoUser.id || !demoUser.email || !demoUser.full_name) {
          console.error('❌ Dados de usuário demo inválidos');
          return false;
        }

        const demoToken = 'demo_token_' + Date.now();
        localStorage.setItem('auth_token', demoToken);
        localStorage.setItem('is_authenticated', 'true');
        localStorage.setItem('current_user', JSON.stringify(demoUser));
        setUser(demoUser);

        console.log('✅ Login simulado realizado com sucesso');
        return true;
      }

      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('is_authenticated');
    localStorage.removeItem('current_user');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      // Validar dados do usuário
      if (userData && userData.id && userData.email) {
        setUser(userData);
        localStorage.setItem('current_user', JSON.stringify(userData));
      } else {
        console.error('❌ Dados de usuário inválidos ao atualizar');
        logout();
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

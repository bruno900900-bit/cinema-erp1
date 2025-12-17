import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { User, UserRole } from '../types/user';
import { supabase } from '../config/supabaseClient';

// Build timestamp: 2025-12-11T03:20:00 - Forces new hash
console.log('[Auth] Build: 2025-12-11T03:22');

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
  const initializedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    console.log('🔄 AuthProvider useEffect triggered');
    mountedRef.current = true;

    const initialize = async () => {
      try {
        console.log('🔍 [SESSION RESTORE] Verificando sessão Supabase...');
        const startTime = Date.now();

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const elapsed = Date.now() - startTime;
        console.log(`⏱️ [SESSION RESTORE] Tempo de verificação: ${elapsed}ms`);

        if (!mountedRef.current) return;

        if (session?.user) {
          console.log(
            '✅ [SESSION RESTORE] Sessão encontrada:',
            session.user.email
          );
          if (session.expires_at) {
            console.log(
              '🔑 [SESSION RESTORE] Token expira em:',
              new Date(session.expires_at * 1000).toLocaleString()
            );
          }
          await loadUserProfile(session.user.id);
        } else {
          console.log('❌ [SESSION RESTORE] Nenhuma sessão ativa');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ [SESSION RESTORE] Erro ao verificar sessão:', error);
        if (mountedRef.current) setUser(null);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          initializedRef.current = true;
        }
      }
    };

    initialize();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state changed:', event);

      // Skip initial session event if we haven't initialized
      if (event === 'INITIAL_SESSION' && !initializedRef.current) {
        return;
      }

      if (!mountedRef.current) return;

      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    // Removido: Safety timeout que causava erro AUTH TIMEOUT desnecessariamente
    // A verificação de sessão é rápida (<100ms) e o setLoading(false) já é chamado
    // na função initialize() dentro do bloco finally

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // Ref for mutex-like locking - storing the Promise itself
  const loadingProfilePromise = useRef<Promise<void> | null>(null);

  // Simplified profile loading - removed timeout race condition
  const loadUserProfile = async (authId: string, authUserFallback?: User) => {
    // If already fetching, return the existing promise to ensure caller waits
    if (loadingProfilePromise.current) {
      console.warn('⏳ [PROFILE] Carregamento já em andamento, aguardando...');
      try {
        await loadingProfilePromise.current;
        console.log('✅ [PROFILE] Carregamento anterior concluído');
      } catch (error) {
        console.error('❌ [PROFILE] Erro no carregamento anterior:', error);
      }
      return;
    }

    // Create the process
    const process = async () => {
      console.log(
        '📋 [PROFILE] Iniciando carregamento para authId:',
        authId.substring(0, 8) + '...'
      );
      const startTime = Date.now();

      try {
        // Direct query without timeout race
        console.log('🔍 [PROFILE] Buscando na tabela users...');
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', authId)
          .maybeSingle();

        const elapsed = Date.now() - startTime;
        console.log(`⏱️ [PROFILE] Query completou em ${elapsed}ms`);

        if (error) {
          console.error('❌ [PROFILE RLS?] Erro ao buscar perfil:', error);
          console.error(
            '❌ [PROFILE] Código:',
            error.code,
            'Mensagem:',
            error.message
          );
          throw error;
        }

        if (profile) {
          console.log('✅ [PROFILE] Perfil encontrado:', profile.email);
          if (mountedRef.current) {
            setUser(profile as User);
            setLoading(false); // ✅ Garantir que loading seja false
          }
          return;
        }

        // No profile found - use fallback
        console.warn(
          '⚠️ [PROFILE] Perfil não encontrado no banco, usando fallback'
        );
        throw new Error('Profile not found');
      } catch (error: any) {
        console.error(
          '❌ [PROFILE] Erro ao carregar perfil:',
          error.message || error
        );

        if (mountedRef.current) {
          let fallbackUser = authUserFallback;
          if (!fallbackUser) {
            console.log('🔄 [PROFILE] Tentando fallback com auth.getUser()...');
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              console.log(
                '✅ [PROFILE] User encontrado no Auth, criando fallback'
              );
              fallbackUser = {
                id: user.id,
                email: user.email || '',
                full_name: user.user_metadata?.full_name || 'Usuário',
                role: 'viewer' as UserRole,
                is_active: true,
                created_at: user.created_at,
                updated_at: user.updated_at || user.created_at,
                timezone: 'America/Sao_Paulo',
                locale: 'pt-BR',
              } as User;
            }
          }

          if (fallbackUser) {
            console.log('✅ [PROFILE] Usando usuário de fallback (Auth).');
            setUser(fallbackUser);
            setLoading(false); // ✅ Garantir que loading seja false
          } else {
            console.error(
              '❌ [PROFILE] Nenhum fallback disponível, user = null'
            );
            setUser(null);
            setLoading(false); // ✅ Garantir que loading seja false
          }
        }
      } finally {
        loadingProfilePromise.current = null;
      }
    };

    // Store and await
    loadingProfilePromise.current = process();
    return loadingProfilePromise.current;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      if (!email || !password) {
        console.error('❌ Email e senha são obrigatórios');
        return false;
      }

      setLoading(true);
      console.log('🔐 Tentando login com Supabase...');

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Erro no login:', error.message);
        setLoading(false);
        return false;
      }

      if (!data.user) {
        setLoading(false);
        return false;
      }

      console.log('✅ Login realizado com sucesso:', data.user.email);
      // Wait for profile load to complete before returning
      // We pass the auth user to potentially speed up fallback
      const fallbackUser = {
        id: data.user.id,
        email: data.user.email || '',
        full_name: data.user.user_metadata?.full_name || 'Usuário',
        role: 'viewer' as UserRole,
        is_active: true,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at || data.user.created_at,
        timezone: 'America/Sao_Paulo',
        locale: 'pt-BR',
      } as User;

      await loadUserProfile(data.user.id, fallbackUser);

      return true;
    } catch (error: any) {
      console.error('❌ Falha no login:', error.message);
      setLoading(false);
      return false;
    } finally {
      // Ensure loading is always false at the end of explicit login attempt
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true); // Show loading during logout
      console.log('🚪 Fazendo logout...');

      // 1. Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Aviso no signOut Supabase:', error.message);

      // 2. Clear local state immediately for UI responsiveness
      setUser(null);
      // Removido: localStorage.removeItem('auth_token');
      // O Supabase gerencia sua própria sessão no localStorage

      console.log('✅ Logout local realizado');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    } finally {
      setLoading(false); // Restore UI
    }
  };

  const refreshUser = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      setUser(null);
    } finally {
      setLoading(false);
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

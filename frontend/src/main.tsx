import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './hooks/useAuth';
import { initSupabase } from './config/supabaseClient';
import ErrorBoundary from './components/Common/ErrorBoundary';

// Configuração do tema Material-UI
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ec4899',
      light: '#f472b6',
      dark: '#db2777',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
    },
    divider: 'rgba(148, 163, 184, 0.12)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600, letterSpacing: '0.02em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          padding: '8px 20px',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
          backgroundColor: '#132f4c',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(10, 25, 41, 0.7)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'none',
        },
      },
    },
  },
});

//Configuração do React Query - Otimizada
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry logic inteligente baseado no tipo de erro
      retry: (failureCount, error: any) => {
        // Erros que não devem ser retentados
        const nonRetriableErrors = [
          'ValidationError',
          'ForbiddenError',
          'UnauthorizedError',
          'NotFoundError',
        ];

        if (
          error?.name &&
          nonRetriableErrors.some(name => error.name.includes(name))
        ) {
          console.warn('⏭️ Non-retriable error, skipping retry:', error.name);
          return false;
        }

        // RLS errors não devem ser retentados
        if (error?.code === '42501' || error?.message?.includes('policy')) {
          console.error('🚫 RLS Error detected - não retentando');
          return false;
        }

        // Network errors - retry até 3 vezes
        if (error?.name === 'NetworkError' || error?.code === 'ERR_NETWORK') {
          return failureCount < 3;
        }

        // Timeout errors - retry até 2 vezes
        if (
          error?.code === 'ETIMEDOUT' ||
          error?.message?.includes('timeout')
        ) {
          return failureCount < 2;
        }

        // Outros erros - retry 1 vez
        return failureCount < 1;
      },

      // Backoff exponencial com limite máximo
      retryDelay: attemptIndex => {
        const delay = Math.min(1000 * 2 ** attemptIndex, 30000);
        console.log(`⏳ Retry attempt ${attemptIndex + 1}, waiting ${delay}ms`);
        return delay;
      },

      // Refetch estratégico
      refetchOnWindowFocus: false, // Evita refetch desnecessário ao focar janela
      refetchOnMount: true, // Refetch ao montar componente
      refetchOnReconnect: true, // Refetch ao reconectar

      // Cache otimizado - aumentado de 30s para 5min
      // Dados raramente mudam, então podemos manter em cache por mais tempo
      staleTime: 5 * 60 * 1000, // 5 minutos

      // Garbage collection - aumentado para 15min
      gcTime: 15 * 60 * 1000, // 15 minutos

      // Network mode
      networkMode: 'online',

      // Estrutured error handling
      throwOnError: false, // Permite tratamento de erro no componente

      // Query deduplication - evita queries duplicadas
      // Esta é uma configuração global, mas cada query pode sobrescrever
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Mutations não devem ser retentadas automaticamente em caso de validation errors
        if (
          error?.name === 'ValidationError' ||
          error?.message?.includes('invalid')
        ) {
          return false;
        }

        // Network errors em mutations - retry 1 vez apenas
        if (error?.name === 'NetworkError' || error?.code === 'ERR_NETWORK') {
          return failureCount < 1;
        }

        // Outros erros - não retentar
        return false;
      },

      retryDelay: 1000,

      networkMode: 'online',

      // Mutations sempre lançam erro para o componente tratar
      throwOnError: true,
    },
  },
});

console.log('🎬 Main.tsx - Starting app initialization...');

// Inicializar aplicação após Supabase estar pronto
(async () => {
  try {
    console.log('🔄 Main.tsx - Waiting for Supabase initialization...');
    await initSupabase();
    console.log('✅ Main.tsx - Supabase initialized successfully!');

    ReactDOM.createRoot(document.getElementById('root')!).render(
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
              <AuthProvider>
                <App />
              </AuthProvider>
            </BrowserRouter>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    );

    console.log('✅ Main.tsx - App rendered successfully!');
  } catch (error) {
    console.error('❌ Main.tsx - Error during initialization:', error);
    // Renderizar mensagem de erro para o usuário
    document.getElementById('root')!.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: #f1f5f9; font-family: Inter, sans-serif; flex-direction: column; padding: 20px; text-align: center;">
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">❌ Erro ao Inicializar</h1>
        <p style="color: #94a3b8; max-width: 500px;">Não foi possível conectar ao servidor. Por favor, recarregue a página ou entre em contato com o suporte.</p>
        <button onclick="window.location.reload()" style="margin-top: 2rem; padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
          Recarregar Página
        </button>
      </div>
    `;
  }
})();

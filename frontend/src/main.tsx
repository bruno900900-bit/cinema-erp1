import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './hooks/useAuth';
import ErrorBoundary from './components/Common/ErrorBoundary';
// Removed previous URL rewrite shim that altered Cloud Run API calls.

// Configuração do tema Material-UI
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6', // More vibrant blue
      light: '#60a5fa',
      dark: '#2563eb',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ec4899', // Pink/Magenta for accents
      light: '#f472b6',
      dark: '#db2777',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0f172a', // Slate 900 - Richer dark
      paper: '#1e293b', // Slate 800 - Good contrast with default
    },
    text: {
      primary: '#f1f5f9', // Slate 100 - High contrast
      secondary: '#94a3b8', // Slate 400 - Readable secondary
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
          backgroundColor: '#132f4c', // Match paper
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

// Configuração do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Não tentar novamente para erros de validação ou autenticação
        if (
          error?.name === 'ValidationError' ||
          error?.name === 'ForbiddenError'
        ) {
          return false;
        }

        // Para erros de rede, tentar até 2 vezes
        if (error?.name === 'NetworkError' || error?.code === 'ERR_NETWORK') {
          return failureCount < 2;
        }

        // Para outros erros, tentar apenas 1 vez
        return failureCount < 1;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (antes era cacheTime)
      refetchOnMount: true,
      refetchOnReconnect: true,
      networkMode: 'online',
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Não tentar novamente para erros de validação
        if (error?.name === 'ValidationError') {
          return false;
        }

        // Para erros de rede, tentar 1 vez
        if (error?.name === 'NetworkError' || error?.code === 'ERR_NETWORK') {
          return failureCount < 1;
        }

        return false;
      },
      retryDelay: 1000,
      networkMode: 'online',
    },
  },
});

console.log('🎬 Main.tsx - Starting app...');

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

console.log('🎬 Main.tsx - App rendered!');

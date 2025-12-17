import React, { Component, ReactNode } from 'react';
import {
  Box,
  Typography,
  Alert,
  Button,
  Card,
  CardContent,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Refresh,
  Home,
  ExpandMore,
  ExpandLess,
  BugReport,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorType?: 'network' | 'auth' | 'rls' | 'validation' | 'unknown';
  showDetails: boolean;
  retryCount: number;
}

/**
 * ErrorBoundary melhorado com:
 * - Classificação de erros
 * - UI mais amigável
 * - Tratamento específico por tipo de erro
 * - Limite de retry
 */
class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      showDetails: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    console.error('🚨 ErrorBoundary - Error caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      '🚨 ErrorBoundary - Component stack:',
      errorInfo.componentStack
    );
    console.error('🚨 ErrorBoundary - Error details:', error);

    // Classificar tipo de erro
    const errorType = this.classifyError(error);

    // Log estruturado para debugging
    const errorLog = {
      timestamp: new Date().toISOString(),
      type: errorType,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    };

    console.error(
      '📊 Structured Error Log:',
      JSON.stringify(errorLog, null, 2)
    );

    this.setState({ error, errorInfo, errorType });
  }

  /**
   * Classifica o erro baseado na mensagem e propriedades
   */
  private classifyError(error: Error): State['errorType'] {
    const message = error.message?.toLowerCase() || '';
    const name = error.name?.toLowerCase() || '';

    // Network errors
    if (
      name.includes('network') ||
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout')
    ) {
      return 'network';
    }

    // Auth errors
    if (
      message.includes('auth') ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      name.includes('auth')
    ) {
      return 'auth';
    }

    // RLS (Row Level Security) errors
    if (
      message.includes('policy') ||
      message.includes('rls') ||
      (error as any).code === '42501'
    ) {
      return 'rls';
    }

    // Validation errors
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      name.includes('validation')
    ) {
      return 'validation';
    }

    return 'unknown';
  }

  /**
   * Obter mensagem amigável baseada no tipo de erro
   */
  private getUserFriendlyMessage(): {
    title: string;
    description: string;
    suggestion: string;
  } {
    const { errorType, error } = this.state;

    switch (errorType) {
      case 'network':
        return {
          title: '🌐 Erro de Conexão',
          description:
            'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
          suggestion:
            'Tente novamente em alguns instantes ou verifique sua conexão.',
        };

      case 'auth':
        return {
          title: '🔐 Erro de Autenticação',
          description: 'Houve um problema com sua autenticação.',
          suggestion:
            'Faça login novamente ou entre em contato com o administrador.',
        };

      case 'rls':
        return {
          title: '🚫 Erro de Permissão',
          description: 'Você não tem permissão para acessar este recurso.',
          suggestion:
            'Entre em contato com o administrador para solicitar acesso.',
        };

      case 'validation':
        return {
          title: '⚠️ Dados Inválidos',
          description: 'Os dados fornecidos são inválidos.',
          suggestion: 'Verifique os campos e tente novamente.',
        };

      default:
        return {
          title: '❌ Erro Inesperado',
          description: error?.message || 'Ocorreu um erro inesperado.',
          suggestion:
            'Tente recarregar a página ou entre em contato com o suporte.',
        };
    }
  }

  /**
   * Retry com limite
   */
  private handleRetry = () => {
    const { retryCount } = this.state;

    if (retryCount >= this.maxRetries) {
      alert(
        `Você já tentou ${this.maxRetries} vezes. Por favor, recarregue a página ou entre em contato com o suporte.`
      );
      return;
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorType: undefined,
      retryCount: retryCount + 1,
    });
  };

  /**
   * Reset completo
   */
  private handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorType: undefined,
      showDetails: false,
      retryCount: 0,
    });
  };

  render() {
    if (this.state.hasError) {
      // Se fornecido fallback customizado, use-o
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { title, description, suggestion } = this.getUserFriendlyMessage();
      const { error, errorInfo, showDetails, retryCount } = this.state;

      return (
        <Box
          sx={{
            p: 4,
            maxWidth: 900,
            mx: 'auto',
            mt: 4,
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Card
            sx={{
              width: '100%',
              boxShadow: 3,
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {/* Header com ícone */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <BugReport sx={{ fontSize: 48, color: 'error.main', mr: 2 }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {description}
                  </Typography>
                </Box>
              </Box>

              {/* Mensagem principal */}
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {suggestion}
                </Typography>
                {retryCount > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Tentativas: {retryCount}/{this.maxRetries}
                  </Typography>
                )}
              </Alert>

              {/* Detalhes técnicos (colapsável) */}
              <Box sx={{ mb: 3 }}>
                <Button
                  size="small"
                  onClick={() => this.setState({ showDetails: !showDetails })}
                  endIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
                  sx={{ mb: 1 }}
                >
                  {showDetails ? 'Ocultar' : 'Ver'} Detalhes Técnicos
                </Button>

                <Collapse in={showDetails}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'background.default',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {error && (
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          mb: 2,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        <strong>Erro:</strong> {error.message}
                        {error.stack && (
                          <>
                            <br />
                            <br />
                            <strong>Stack Trace:</strong>
                            <br />
                            {error.stack}
                          </>
                        )}
                      </Typography>
                    )}
                    {errorInfo && (
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        <strong>Component Stack:</strong>
                        {errorInfo.componentStack}
                      </Typography>
                    )}
                  </Box>
                </Collapse>
              </Box>

              {/* Actions */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleRetry}
                  disabled={retryCount >= this.maxRetries}
                  size="large"
                >
                  Tentar Novamente
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => window.location.reload()}
                  size="large"
                >
                  Recarregar Página
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Home />}
                  onClick={() => (window.location.href = '/')}
                  size="large"
                >
                  Ir para Início
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Footer com informações adicionais */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 3, textAlign: 'center' }}
          >
            Se o problema persistir, entre em contato com o suporte técnico.
            <br />
            Timestamp: {new Date().toLocaleString()}
          </Typography>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

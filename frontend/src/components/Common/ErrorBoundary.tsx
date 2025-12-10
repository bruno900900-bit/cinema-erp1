import React, { Component, ReactNode } from 'react'
import { Box, Typography, Alert, Button } from '@mui/material'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🚨 ErrorBoundary - Error caught:', error)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ErrorBoundary - Component stack:', errorInfo.componentStack)
    console.error('🚨 ErrorBoundary - Error details:', error)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, maxWidth: 800, mx: 'auto', mt: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              ❌ Erro na Aplicação
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Ocorreu um erro inesperado. Verifique o console para mais detalhes.
            </Typography>
            {this.state.error && (
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', mb: 2 }}>
                <strong>Erro:</strong> {this.state.error.message}
              </Typography>
            )}
            {this.state.errorInfo && (
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', mb: 2 }}>
                <strong>Stack:</strong> {this.state.errorInfo.componentStack}
              </Typography>
            )}
          </Alert>

          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{ mr: 2 }}
          >
            🔄 Recarregar Página
          </Button>

          <Button
            variant="outlined"
            onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
          >
            🔄 Tentar Novamente
          </Button>
        </Box>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

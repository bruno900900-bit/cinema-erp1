import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCanAccessRoute } from '../../hooks/usePermissions';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  fallbackPath?: string;
}

export default function ProtectedRoute({
  children,
  requiredPermission,
  fallbackPath = '/dashboard',
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const canAccess = useCanAccessRoute(location.pathname);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Verificando permissões...
        </Typography>
      </Box>
    );
  }

  // Se não há usuário autenticado, redirecionar para login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se não pode acessar a rota, mostrar erro ou redirecionar
  if (!canAccess) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Acesso Negado
          </Typography>
          <Typography>
            Você não tem permissão para acessar esta página. Sua função atual (
            {user.role}) não possui os privilégios necessários.
          </Typography>
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Entre em contato com um administrador se você acredita que deveria ter
          acesso a esta funcionalidade.
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
}


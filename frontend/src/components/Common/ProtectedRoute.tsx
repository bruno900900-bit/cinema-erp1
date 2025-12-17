import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  useCanAccessRoute,
  usePermissions,
  Permissions,
} from '../../hooks/usePermissions';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: keyof Permissions;
  fallbackPath?: string;
}

export default function ProtectedRoute({
  children,
  requiredPermission,
  fallbackPath = '/unauthorized',
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const canAccessRoute = useCanAccessRoute(location.pathname);
  const permissions = usePermissions();

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

  // Verificar permissão específica se fornecida
  if (requiredPermission && !permissions[requiredPermission]) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Verificar permissão baseada na rota
  if (!requiredPermission && !canAccessRoute) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}

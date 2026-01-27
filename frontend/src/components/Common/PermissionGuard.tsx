import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions, Permissions } from '../../hooks/usePermissions';
import { Box, Typography, Button } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

interface PermissionGuardProps {
  permission: keyof Permissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export default function PermissionGuard({
  permission,
  children,
  fallback,
  redirectTo,
}: PermissionGuardProps) {
  const permissions = usePermissions();
  const hasPermission = permissions[permission];

  if (!hasPermission) {
    // Se tiver um redirect, redirecionar
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    // Se tiver um fallback customizado, usar
    if (fallback) {
      return <>{fallback}</>;
    }

    // Fallback padrão
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          textAlign: 'center',
          p: 3,
        }}
      >
        <LockIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Acesso Negado
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Você não tem permissão para acessar este recurso.
        </Typography>
        <Button variant="contained" onClick={() => window.history.back()}>
          Voltar
        </Button>
      </Box>
    );
  }

  return <>{children}</>;
}

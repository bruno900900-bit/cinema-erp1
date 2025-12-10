import React, { useState, useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  userService,
  UserList,
  getUserRoleLabel,
} from '../../services/userService';
import { UserRole } from '../../types/user';
import { usePermissions } from '../../hooks/usePermissions';

interface UserRegistrationNotificationProps {
  onViewUser?: (user: UserList) => void;
}

export default function UserRegistrationNotification({
  onViewUser,
}: UserRegistrationNotificationProps) {
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const [dismissedUsers, setDismissedUsers] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState(true);

  // Buscar usuários inativos (novos cadastros)
  const { data: inactiveUsersResponse } = useQuery({
    queryKey: ['users', 'inactive'],
    queryFn: () => userService.getUsers({ is_active: false, limit: 10 }),
    enabled: permissions.canManageUsers,
    refetchInterval: 30000, // Verificar a cada 30 segundos
  });

  // Extrair array de usuários da resposta
  const inactiveUsers = inactiveUsersResponse?.users || [];

  const activateUserMutation = useMutation({
    mutationFn: (userId: number) => userService.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    },
  });

  const newUsers = inactiveUsers.filter(
    (user: UserList) => !dismissedUsers.has(user.id)
  );

  const handleDismiss = (userId: number) => {
    setDismissedUsers(prev => new Set(prev).add(userId));
  };

  const handleDismissAll = () => {
    const allUserIds = newUsers.map((user: UserList) => user.id);
    setDismissedUsers(prev => new Set([...prev, ...allUserIds]));
  };

  const handleActivateUser = (userId: number) => {
    activateUserMutation.mutate(userId);
    handleDismiss(userId);
  };

  const getRoleColor = (role: UserRole) => {
    const colors = {
      [UserRole.ADMIN]: 'error',
      [UserRole.MANAGER]: 'warning',
      [UserRole.COORDINATOR]: 'info',
      [UserRole.OPERATOR]: 'primary',
      [UserRole.VIEWER]: 'secondary',
      [UserRole.CLIENT]: 'default',
    };
    return colors[role] || 'default';
  };

  if (!permissions.canManageUsers || newUsers.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Alert
        severity="info"
        icon={<PersonAddIcon />}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              size="small"
              onClick={handleDismissAll}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              Dispensar Todos
            </Button>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ ml: 1 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        }
      >
        <AlertTitle>
          {newUsers.length} Novo{newUsers.length > 1 ? 's' : ''} Usuário
          {newUsers.length > 1 ? 's' : ''} Aguardando Aprovação
        </AlertTitle>
        <Typography variant="body2">
          {newUsers.length === 1
            ? 'Um novo usuário se cadastrou e está aguardando ativação.'
            : `${newUsers.length} novos usuários se cadastraram e estão aguardando ativação.`}
        </Typography>
      </Alert>

      <Collapse in={expanded}>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {newUsers.map((user: UserList) => (
            <Alert
              key={user.id}
              severity="warning"
              sx={{
                display: 'flex',
                alignItems: 'center',
                '& .MuiAlert-message': { flex: 1 },
              }}
              action={
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => onViewUser?.(user)}
                  >
                    Ver
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<ApproveIcon />}
                    onClick={() => handleActivateUser(user.id)}
                    disabled={activateUserMutation.isPending}
                  >
                    Ativar
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => handleDismiss(user.id)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  width: '100%',
                }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user.full_name.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">{user.full_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>
                <Chip
                  label={getUserRoleLabel(user.role)}
                  color={getRoleColor(user.role) as any}
                  size="small"
                />
                <Typography variant="caption" color="text.secondary">
                  {(() => {
                    const date = new Date(user.created_at);
                    return isNaN(date.getTime())
                      ? 'data inválida'
                      : date.toLocaleDateString('pt-BR');
                  })()}
                </Typography>
              </Box>
            </Alert>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

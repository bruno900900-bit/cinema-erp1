import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Avatar,
  Chip,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  Group as CoordinatorIcon,
  Build as OperatorIcon,
  Visibility as ViewerIcon,
  Business as ClientIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { getUserRoleLabel, getUserRoleColor } from '../../services/userService';
import { UserRole, User } from '../../types/user';

interface UserDetailModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

const roleIcons = {
  [UserRole.ADMIN]: <AdminIcon />,
  [UserRole.MANAGER]: <ManagerIcon />,
  [UserRole.COORDINATOR]: <CoordinatorIcon />,
  [UserRole.OPERATOR]: <OperatorIcon />,
  [UserRole.VIEWER]: <ViewerIcon />,
  [UserRole.CLIENT]: <ClientIcon />,
};

const rolePermissions = {
  [UserRole.ADMIN]: [
    'Acesso total ao sistema',
    'Gerenciar usuários',
    'Gerenciar projetos',
    'Gerenciar locações',
    'Visualizar relatórios financeiros',
    'Exportar dados',
    'Configurar sistema',
  ],
  [UserRole.MANAGER]: [
    'Gerenciar projetos',
    'Gerenciar locações',
    'Visualizar relatórios financeiros',
    'Exportar dados',
    'Gerenciar equipe',
  ],
  [UserRole.COORDINATOR]: [
    'Gerenciar projetos',
    'Gerenciar locações',
    'Visualizar relatórios básicos',
    'Coordenar equipe',
  ],
  [UserRole.OPERATOR]: [
    'Criar e editar projetos',
    'Criar e editar locações',
    'Visualizar dados básicos',
    'Gerenciar agenda',
  ],
  [UserRole.VIEWER]: [
    'Visualizar projetos',
    'Visualizar locações',
    'Visualizar agenda',
    'Visualizar relatórios básicos',
  ],
  [UserRole.CLIENT]: [
    'Visualizar projetos próprios',
    'Visualizar locações relacionadas',
    'Receber notificações',
  ],
  [UserRole.CONTRIBUTOR]: [
    'Acesso restrito',
    'Requer aprovação para visualização',
  ],
};

export default function UserDetailModal({
  open,
  onClose,
  user,
}: UserDetailModalProps) {
  if (!user) return null;

  const getRoleIcon = (role: UserRole) => {
    return roleIcons[role] || <PersonIcon />;
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não informada';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data inválida';
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
            {user.full_name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6">{user.full_name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Informações Básicas */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <PersonIcon />
                  Informações Básicas
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Nome Completo
                  </Typography>
                  <Typography variant="body1">{user.full_name}</Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{user.email}</Typography>
                </Box>

                {user.phone && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Telefone
                    </Typography>
                    <Typography variant="body1">{user.phone}</Typography>
                  </Box>
                )}

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    icon={user.is_active ? <ActiveIcon /> : <InactiveIcon />}
                    label={user.is_active ? 'Ativo' : 'Inativo'}
                    color={user.is_active ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Função e Permissões */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <SecurityIcon />
                  Função e Permissões
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Função
                  </Typography>
                  <Chip
                    icon={getRoleIcon(user.role)}
                    label={getUserRoleLabel(user.role)}
                    color={getRoleColor(user.role) as any}
                    size="small"
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Permissões
                  </Typography>
                  <List dense>
                    {rolePermissions[user.role]?.map((permission, index) => (
                      <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                            }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={permission}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Configurações */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <SettingsIcon />
                  Configurações
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Fuso Horário
                  </Typography>
                  <Typography variant="body1">{user.timezone}</Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Idioma
                  </Typography>
                  <Typography variant="body1">{user.locale}</Typography>
                </Box>

                {user.bio && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Biografia
                    </Typography>
                    <Typography variant="body1">{user.bio}</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Informações de Sistema */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <CalendarIcon />
                  Informações de Sistema
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Data de Criação
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(user.created_at)}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Última Atualização
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(user.updated_at)}
                  </Typography>
                </Box>

                {user.last_login && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Último Login
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(user.last_login)}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}

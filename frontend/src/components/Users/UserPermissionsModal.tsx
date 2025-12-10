import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  Dashboard as DashboardIcon,
  LocationOn as LocationIcon,
  Assignment as ProjectIcon,
  Event as AgendaIcon,
  People as UsersIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  Group as CoordinatorIcon,
  Build as OperatorIcon,
  Visibility as ViewerIcon,
  Business as ClientIcon,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, getUserRoleLabel } from '../../services/userService';
import { UserRole, UserList } from '../../types/user';
import { Permissions } from '../../hooks/usePermissions';

interface UserPermissionsModalProps {
  open: boolean;
  onClose: () => void;
  user: UserList | null;
}

// Definição das permissões organizadas por categoria
const PERMISSION_CATEGORIES = {
  navigation: {
    title: 'Navegação e Acesso',
    icon: <DashboardIcon />,
    description: 'Controle quais páginas o usuário pode acessar',
    permissions: [
      {
        key: 'canViewDashboard',
        label: 'Dashboard',
        description: 'Acessar página inicial',
      },
      {
        key: 'canManageLocations',
        label: 'Locações',
        description: 'Acessar e gerenciar locações',
      },
      {
        key: 'canManageProjects',
        label: 'Projetos',
        description: 'Acessar e gerenciar projetos',
      },
      {
        key: 'canViewAgenda',
        label: 'Agenda',
        description: 'Visualizar agenda de eventos',
      },
      {
        key: 'canViewReports',
        label: 'Relatórios',
        description: 'Acessar relatórios e análises',
      },
      {
        key: 'canManageSettings',
        label: 'Configurações',
        description: 'Acessar configurações do sistema',
      },
    ],
  },
  userManagement: {
    title: 'Gerenciamento de Usuários',
    icon: <UsersIcon />,
    description: 'Controle sobre usuários e permissões',
    permissions: [
      {
        key: 'canManageUsers',
        label: 'Gerenciar Usuários',
        description: 'Criar, editar e visualizar usuários',
      },
      {
        key: 'canManageUserRoles',
        label: 'Gerenciar Funções',
        description: 'Alterar funções de usuários',
      },
      {
        key: 'canActivateUsers',
        label: 'Ativar Usuários',
        description: 'Ativar usuários inativos',
      },
      {
        key: 'canDeactivateUsers',
        label: 'Desativar Usuários',
        description: 'Desativar usuários ativos',
      },
      {
        key: 'canDeleteUsers',
        label: 'Excluir Usuários',
        description: 'Remover usuários do sistema',
      },
    ],
  },
  projectManagement: {
    title: 'Gerenciamento de Projetos',
    icon: <ProjectIcon />,
    description: 'Controle sobre projetos e operações',
    permissions: [
      {
        key: 'canCreateProjects',
        label: 'Criar Projetos',
        description: 'Criar novos projetos',
      },
      {
        key: 'canEditProjects',
        label: 'Editar Projetos',
        description: 'Modificar projetos existentes',
      },
      {
        key: 'canDeleteProjects',
        label: 'Excluir Projetos',
        description: 'Remover projetos',
      },
    ],
  },
  financial: {
    title: 'Informações Financeiras',
    icon: <ReportsIcon />,
    description: 'Acesso a dados financeiros e orçamentos',
    permissions: [
      {
        key: 'canViewFinancials',
        label: 'Visualizar Financeiro',
        description: 'Ver informações financeiras',
      },
      {
        key: 'canExportData',
        label: 'Exportar Dados',
        description: 'Exportar relatórios e dados',
      },
    ],
  },
};

const ROLE_ICONS = {
  [UserRole.ADMIN]: <AdminIcon />,
  [UserRole.MANAGER]: <ManagerIcon />,
  [UserRole.COORDINATOR]: <CoordinatorIcon />,
  [UserRole.OPERATOR]: <OperatorIcon />,
  [UserRole.VIEWER]: <ViewerIcon />,
  [UserRole.CLIENT]: <ClientIcon />,
};

const ROLE_COLORS = {
  [UserRole.ADMIN]: 'error',
  [UserRole.MANAGER]: 'warning',
  [UserRole.COORDINATOR]: 'info',
  [UserRole.OPERATOR]: 'primary',
  [UserRole.VIEWER]: 'secondary',
  [UserRole.CLIENT]: 'default',
};

export default function UserPermissionsModal({
  open,
  onClose,
  user,
}: UserPermissionsModalProps) {
  const queryClient = useQueryClient();
  const [permissions, setPermissions] = useState<Permissions>({
    canViewDashboard: false,
    canManageUsers: false,
    canManageProjects: false,
    canManageLocations: false,
    canViewAgenda: false,
    canViewReports: false,
    canManageSettings: false,
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canViewFinancials: false,
    canExportData: false,
    canManageUserRoles: false,
    canActivateUsers: false,
    canDeactivateUsers: false,
    canDeleteUsers: false,
  });
  const [hasChanges, setHasChanges] = useState(false);

  const updatePermissionsMutation = useMutation({
    mutationFn: (data: { userId: number; permissions: Permissions }) =>
      userService.updateUserPermissions(
        data.userId,
        data.permissions as unknown as Record<string, unknown>
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSnackbar({
        open: true,
        message: 'Permissões atualizadas com sucesso!',
        severity: 'success',
      });
      onClose();
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.message || 'Erro ao atualizar permissões',
        severity: 'error',
      });
    },
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // Carregar permissões do usuário quando o modal abrir
  useEffect(() => {
    if (user && open) {
      // Simular carregamento de permissões personalizadas
      // Em um sistema real, isso viria do backend
      const userPermissions =
        (user.custom_permissions as unknown as Permissions) ||
        getDefaultPermissionsForRole(user.role);
      setPermissions(userPermissions);
      setHasChanges(false);
    }
  }, [user, open]);

  const getDefaultPermissionsForRole = (role: UserRole): Permissions => {
    // Retornar permissões padrão baseadas no role
    const defaultPermissions: Record<UserRole, Permissions> = {
      [UserRole.ADMIN]: {
        canViewDashboard: true,
        canManageUsers: true,
        canManageProjects: true,
        canManageLocations: true,
        canViewAgenda: true,
        canViewReports: true,
        canManageSettings: true,
        canCreateProjects: true,
        canEditProjects: true,
        canDeleteProjects: true,
        canViewFinancials: true,
        canExportData: true,
        canManageUserRoles: true,
        canActivateUsers: true,
        canDeactivateUsers: true,
        canDeleteUsers: true,
      },
      [UserRole.MANAGER]: {
        canViewDashboard: true,
        canManageUsers: false,
        canManageProjects: true,
        canManageLocations: true,
        canViewAgenda: true,
        canViewReports: true,
        canManageSettings: false,
        canCreateProjects: true,
        canEditProjects: true,
        canDeleteProjects: false,
        canViewFinancials: true,
        canExportData: true,
        canManageUserRoles: false,
        canActivateUsers: false,
        canDeactivateUsers: false,
        canDeleteUsers: false,
      },
      [UserRole.COORDINATOR]: {
        canViewDashboard: true,
        canManageUsers: false,
        canManageProjects: true,
        canManageLocations: true,
        canViewAgenda: true,
        canViewReports: false,
        canManageSettings: false,
        canCreateProjects: true,
        canEditProjects: true,
        canDeleteProjects: false,
        canViewFinancials: false,
        canExportData: false,
        canManageUserRoles: false,
        canActivateUsers: false,
        canDeactivateUsers: false,
        canDeleteUsers: false,
      },
      [UserRole.OPERATOR]: {
        canViewDashboard: true,
        canManageUsers: false,
        canManageProjects: false,
        canManageLocations: false,
        canViewAgenda: true,
        canViewReports: false,
        canManageSettings: false,
        canCreateProjects: false,
        canEditProjects: false,
        canDeleteProjects: false,
        canViewFinancials: false,
        canExportData: false,
        canManageUserRoles: false,
        canActivateUsers: false,
        canDeactivateUsers: false,
        canDeleteUsers: false,
      },
      [UserRole.VIEWER]: {
        canViewDashboard: true,
        canManageUsers: false,
        canManageProjects: false,
        canManageLocations: false,
        canViewAgenda: true,
        canViewReports: false,
        canManageSettings: false,
        canCreateProjects: false,
        canEditProjects: false,
        canDeleteProjects: false,
        canViewFinancials: false,
        canExportData: false,
        canManageUserRoles: false,
        canActivateUsers: false,
        canDeactivateUsers: false,
        canDeleteUsers: false,
      },
      [UserRole.CLIENT]: {
        canViewDashboard: false,
        canManageUsers: false,
        canManageProjects: false,
        canManageLocations: false,
        canViewAgenda: false,
        canViewReports: false,
        canManageSettings: false,
        canCreateProjects: false,
        canEditProjects: false,
        canDeleteProjects: false,
        canViewFinancials: false,
        canExportData: false,
        canManageUserRoles: false,
        canActivateUsers: false,
        canDeactivateUsers: false,
        canDeleteUsers: false,
      },
      [UserRole.CONTRIBUTOR]: {
        canViewDashboard: false,
        canManageUsers: false,
        canManageProjects: false,
        canManageLocations: false,
        canViewAgenda: false,
        canViewReports: false,
        canManageSettings: false,
        canCreateProjects: false,
        canEditProjects: false,
        canDeleteProjects: false,
        canViewFinancials: false,
        canExportData: false,
        canManageUserRoles: false,
        canActivateUsers: false,
        canDeactivateUsers: false,
        canDeleteUsers: false,
      },
    };

    return defaultPermissions[role] || defaultPermissions[UserRole.VIEWER];
  };

  const handlePermissionChange = (
    permissionKey: keyof Permissions,
    value: boolean
  ) => {
    setPermissions(prev => ({
      ...prev,
      [permissionKey]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (user) {
      updatePermissionsMutation.mutate({
        userId: user.id,
        permissions,
      });
    }
  };

  const handleResetToDefault = () => {
    if (user) {
      const defaultPermissions = getDefaultPermissionsForRole(user.role);
      setPermissions(defaultPermissions);
      setHasChanges(true);
    }
  };

  const handleClose = () => {
    setHasChanges(false);
    onClose();
  };

  if (!user) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, minHeight: '80vh' },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SecurityIcon color="primary" />
            <Box>
              <Typography variant="h6">Gerenciar Permissões</Typography>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user.full_name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">{user.full_name}</Typography>
                  <Chip
                    icon={ROLE_ICONS[user.role]}
                    label={getUserRoleLabel(user.role)}
                    color={ROLE_COLORS[user.role] as any}
                    size="small"
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Personalização de Permissões:</strong> Você pode
                personalizar as permissões deste usuário independentemente de
                sua função. As permissões personalizadas sobrescrevem as
                permissões padrão da função.
              </Typography>
            </Alert>

            {Object.entries(PERMISSION_CATEGORIES).map(
              ([categoryKey, category]) => (
                <Accordion key={categoryKey} defaultExpanded sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {category.icon}
                      <Box>
                        <Typography variant="h6">{category.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {category.description}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {category.permissions.map(permission => (
                        <Grid item xs={12} sm={6} md={4} key={permission.key}>
                          <Card
                            variant="outlined"
                            sx={{
                              height: '100%',
                              border: permissions[
                                permission.key as keyof Permissions
                              ]
                                ? '2px solid'
                                : '1px solid',
                              borderColor: permissions[
                                permission.key as keyof Permissions
                              ]
                                ? 'primary.main'
                                : 'divider',
                              backgroundColor: permissions[
                                permission.key as keyof Permissions
                              ]
                                ? 'primary.50'
                                : 'background.paper',
                            }}
                          >
                            <CardContent sx={{ p: 2 }}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={
                                      permissions[
                                        permission.key as keyof Permissions
                                      ]
                                    }
                                    onChange={e =>
                                      handlePermissionChange(
                                        permission.key as keyof Permissions,
                                        e.target.checked
                                      )
                                    }
                                    color="primary"
                                  />
                                }
                                label={
                                  <Box>
                                    <Typography variant="subtitle2">
                                      {permission.label}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {permission.description}
                                    </Typography>
                                  </Box>
                                }
                                sx={{
                                  width: '100%',
                                  alignItems: 'flex-start',
                                  '& .MuiFormControlLabel-label': {
                                    width: '100%',
                                  },
                                }}
                              />
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              )
            )}

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={handleResetToDefault}
                disabled={updatePermissionsMutation.isPending}
              >
                Restaurar Padrões da Função
              </Button>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!hasChanges || updatePermissionsMutation.isPending}
            startIcon={
              updatePermissionsMutation.isPending ? (
                <CircularProgress size={20} />
              ) : (
                <SecurityIcon />
              )
            }
          >
            {updatePermissionsMutation.isPending
              ? 'Salvando...'
              : 'Salvar Permissões'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      {snackbar.open && (
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }}
        >
          {snackbar.message}
        </Alert>
      )}
    </>
  );
}

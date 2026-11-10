import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  AdminPanelSettings,
  ManageAccounts,
  SupervisorAccount,
  Engineering,
  Visibility,
  Person,
  GroupAdd,
} from '@mui/icons-material';
import { ROLE_PERMISSIONS } from '../hooks/usePermissions';
import { UserRole } from '../types/user';

// Permission labels and descriptions
const PERMISSION_INFO: Record<string, { label: string; description: string }> =
  {
    canViewDashboard: {
      label: 'Ver Dashboard',
      description: 'Acesso à página inicial com métricas e resumos',
    },
    canManageUsers: {
      label: 'Gerenciar Usuários',
      description: 'Criar, editar e deletar usuários',
    },
    canManageProjects: {
      label: 'Gerenciar Projetos',
      description: 'Gerenciar todos os aspectos dos projetos',
    },
    canManageLocations: {
      label: 'Gerenciar Locações',
      description: 'Adicionar, editar e remover locações',
    },
    canViewAgenda: {
      label: 'Ver Agenda',
      description: 'Visualizar calendário e eventos',
    },
    canViewReports: {
      label: 'Ver Relatórios',
      description: 'Acessar relatórios e analytics',
    },
    canManageSettings: {
      label: 'Gerenciar Configurações',
      description: 'Alterar configurações do sistema',
    },
    canCreateProjects: {
      label: 'Criar Projetos',
      description: 'Criar novos projetos',
    },
    canEditProjects: {
      label: 'Editar Projetos',
      description: 'Editar informações de projetos existentes',
    },
    canDeleteProjects: {
      label: 'Deletar Projetos',
      description: 'Remover projetos do sistema',
    },
    canViewFinancials: {
      label: 'Ver Financeiro',
      description: 'Visualizar informações financeiras',
    },
    canExportData: {
      label: 'Exportar Dados',
      description: 'Exportar dados para planilhas',
    },
    canManageUserRoles: {
      label: 'Gerenciar Cargos',
      description: 'Atribuir e modificar cargos de usuários',
    },
    canActivateUsers: {
      label: 'Ativar Usuários',
      description: 'Ativar contas de usuários',
    },
    canDeactivateUsers: {
      label: 'Desativar Usuários',
      description: 'Desativar contas de usuários',
    },
    canDeleteUsers: {
      label: 'Deletar Usuários',
      description: 'Remover usuários permanentemente',
    },
    canViewProjects: {
      label: 'Ver Projetos',
      description: 'Visualizar lista de projetos',
    },
    canManageContracts: {
      label: 'Gerenciar Contratos',
      description: 'Criar e editar contratos',
    },
    canViewContracts: {
      label: 'Ver Contratos',
      description: 'Visualizar contratos',
    },
    canManageTags: {
      label: 'Gerenciar Tags',
      description: 'Criar e editar tags do sistema',
    },
    canManageFiles: {
      label: 'Gerenciar Arquivos',
      description: 'Upload e gerenciamento de arquivos',
    },
    canViewFiles: {
      label: 'Ver Arquivos',
      description: 'Visualizar arquivos do sistema',
    },
  };

// Permission categories
const PERMISSION_CATEGORIES = {
  'Dashboard & Visualização': [
    'canViewDashboard',
    'canViewAgenda',
    'canViewProjects',
  ],
  'Gerenciamento de Projetos': [
    'canManageProjects',
    'canCreateProjects',
    'canEditProjects',
    'canDeleteProjects',
  ],
  'Gerenciamento de Locações': ['canManageLocations'],
  Contratos: ['canManageContracts', 'canViewContracts'],
  'Gerenciamento de Usuários': [
    'canManageUsers',
    'canManageUserRoles',
    'canActivateUsers',
    'canDeactivateUsers',
    'canDeleteUsers',
  ],
  'Relatórios & Dados': [
    'canViewReports',
    'canViewFinancials',
    'canExportData',
  ],
  'Arquivos & Tags': ['canManageFiles', 'canViewFiles', 'canManageTags'],
  Sistema: ['canManageSettings'],
};

// Role information
const ROLE_INFO: Record<
  UserRole,
  { label: string; icon: React.ReactNode; color: string; description: string }
> = {
  [UserRole.ADMIN]: {
    label: 'Administrador',
    icon: <AdminPanelSettings />,
    color: '#ef4444',
    description: 'Acesso total ao sistema sem restrições',
  },
  [UserRole.MANAGER]: {
    label: 'Gerente',
    icon: <ManageAccounts />,
    color: '#f97316',
    description: 'Gerencia projetos, locações e relatórios',
  },
  [UserRole.COORDINATOR]: {
    label: 'Coordenador',
    icon: <SupervisorAccount />,
    color: '#3b82f6',
    description: 'Coordena projetos e locações específicas',
  },
  [UserRole.OPERATOR]: {
    label: 'Operador',
    icon: <Engineering />,
    color: '#8b5cf6',
    description: 'Acesso operacional para visualização',
  },
  [UserRole.VIEWER]: {
    label: 'Visualizador',
    icon: <Visibility />,
    color: '#64748b',
    description: 'Apenas visualização de dashboard e agenda',
  },
  [UserRole.CLIENT]: {
    label: 'Cliente',
    icon: <Person />,
    color: '#10b981',
    description: 'Acesso limitado para clientes externos',
  },
  [UserRole.CONTRIBUTOR]: {
    label: 'Contribuidor',
    icon: <GroupAdd />,
    color: '#6b7280',
    description: 'Novo usuário sem permissões',
  },
};

export default function AdminRolesPage() {
  const theme = useTheme();

  // Count permissions per role
  const countPermissions = (role: UserRole) => {
    const permissions = ROLE_PERMISSIONS[role];
    return Object.values(permissions).filter(Boolean).length;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Gerenciamento de Cargos e Permissões
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Visualize todas as permissões atribuídas a cada cargo do sistema. Esta
        página mostra o que cada tipo de usuário pode ver e fazer no Cinema ERP.
      </Typography>

      {/* Role Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Object.values(UserRole).map(role => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={role}>
            <Card
              sx={{
                height: '100%',
                border: `2px solid ${alpha(ROLE_INFO[role].color, 0.3)}`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8],
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                    color: ROLE_INFO[role].color,
                  }}
                >
                  {ROLE_INFO[role].icon}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {ROLE_INFO[role].label}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {ROLE_INFO[role].description}
                </Typography>
                <Chip
                  label={`${countPermissions(role)} permissões`}
                  size="small"
                  sx={{
                    bgcolor: alpha(ROLE_INFO[role].color, 0.1),
                    color: ROLE_INFO[role].color,
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Permission Matrix by Category */}
      {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
        <Box key={category} sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              fontWeight: 'bold',
              color: theme.palette.primary.main,
            }}
          >
            {category}
          </Typography>

          <TableContainer
            component={Paper}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}
                >
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>
                    Permissão
                  </TableCell>
                  {Object.values(UserRole).map(role => (
                    <TableCell
                      key={role}
                      align="center"
                      sx={{
                        fontWeight: 'bold',
                        color: ROLE_INFO[role].color,
                        minWidth: 100,
                      }}
                    >
                      {ROLE_INFO[role].label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {permissions.map(permission => (
                  <TableRow
                    key={permission}
                    sx={{
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                      },
                    }}
                  >
                    <TableCell>
                      <Tooltip
                        title={PERMISSION_INFO[permission]?.description || ''}
                        arrow
                        placement="right"
                      >
                        <Box sx={{ cursor: 'help' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {PERMISSION_INFO[permission]?.label || permission}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>
                    {Object.values(UserRole).map(role => {
                      const hasPermission =
                        ROLE_PERMISSIONS[role]?.[permission] || false;
                      return (
                        <TableCell key={role} align="center">
                          {hasPermission ? (
                            <CheckCircle
                              sx={{ color: '#10b981', fontSize: 20 }}
                            />
                          ) : (
                            <Cancel sx={{ color: '#ef4444', fontSize: 20 }} />
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}

      {/* Admin Note */}
      <Paper
        sx={{
          p: 3,
          mt: 4,
          bgcolor: alpha(theme.palette.info.main, 0.05),
          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          ℹ️ Nota Importante
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • <strong>Administradores</strong> sempre têm acesso total,
          independente de permissões customizadas.
          <br />• Outros cargos podem ter permissões customizadas por usuário
          através do campo <code>permissions_json</code>.
          <br />• Esta visualização mostra as permissões <strong>
            padrão
          </strong>{' '}
          de cada cargo.
        </Typography>
      </Paper>
    </Box>
  );
}

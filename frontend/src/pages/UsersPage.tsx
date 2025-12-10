import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  Avatar,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  InputAdornment,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  Group as CoordinatorIcon,
  Build as OperatorIcon,
  Visibility as ViewerIcon,
  Business as ClientIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Refresh as RefreshIcon,
  Download as ExportIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCreate,
  UserUpdate,
  getUserRoleLabel,
  getUserRoleColor,
  UserStats,
  userService,
} from '../services/userService';
import { UserRole, UserList, User } from '../types/user';
import UserDetailModal from '../components/Users/UserDetailModal';
import UserRegistrationModal from '../components/Users/UserRegistrationModal';
import UserRegistrationNotification from '../components/Users/UserRegistrationNotification';
import UserPermissionsModal from '../components/Users/UserPermissionsModal';
import UserProjectAccessModal from '../components/Users/UserProjectAccessModal';
import { usePermissions } from '../hooks/usePermissions';
import { FolderOpen as ProjectsIcon } from '@mui/icons-material';

interface UserFilters {
  search: string;
  role: UserRole | '';
  is_active: string;
}

const roleIcons = {
  [UserRole.ADMIN]: <AdminIcon />,
  [UserRole.MANAGER]: <ManagerIcon />,
  [UserRole.COORDINATOR]: <CoordinatorIcon />,
  [UserRole.OPERATOR]: <OperatorIcon />,
  [UserRole.VIEWER]: <ViewerIcon />,
  [UserRole.CLIENT]: <ClientIcon />,
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    is_active: 'all',
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRegistrationDialogOpen, setIsRegistrationDialogOpen] =
    useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isProjectAccessDialogOpen, setIsProjectAccessDialogOpen] =
    useState(false);
  const [selectedUser, setSelectedUser] = useState<UserList | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(
    null
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // Form states
  const [formData, setFormData] = useState<UserCreate>({
    email: '',
    full_name: '',
    password: '',
    bio: '',
    phone: '',
    role: UserRole.OPERATOR,
    timezone: 'America/Sao_Paulo',
    locale: 'pt-BR',
  });

  // Queries
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ['users', page, rowsPerPage, filters],
    queryFn: () =>
      userService.getUsers({
        skip: page * rowsPerPage,
        limit: rowsPerPage,
        search: filters.search || undefined,
        role: filters.role || undefined,
        is_active:
          filters.is_active === 'active'
            ? true
            : filters.is_active === 'inactive'
            ? false
            : undefined,
      }),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: statsData } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => userService.getUserStats(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (userData: UserCreate) => userService.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      setIsCreateDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Usuário criado com sucesso!',
        severity: 'success',
      });
      resetForm();
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Erro ao criar usuário',
        severity: 'error',
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdate }) =>
      userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      setIsEditDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Usuário atualizado com sucesso!',
        severity: 'success',
      });
      resetForm();
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Erro ao atualizar usuário',
        severity: 'error',
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => userService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      setIsDeleteDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Usuário excluído com sucesso!',
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Erro ao excluir usuário',
        severity: 'error',
      });
    },
  });

  const activateUserMutation = useMutation({
    mutationFn: (userId: number) => userService.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      setSnackbar({
        open: true,
        message: 'Usuário ativado com sucesso!',
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: 'Erro ao ativar usuário',
        severity: 'error',
      });
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: (userId: number) => userService.deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      setSnackbar({
        open: true,
        message: 'Usuário desativado com sucesso!',
        severity: 'success',
      });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error?.message || 'Erro ao desativar usuário',
        severity: 'error',
      });
    },
  });

  const users = (usersData as any)?.users || [];
  const totalUsers = (usersData as any)?.total || 0;
  const stats = (statsData as any) || {};

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      password: '',
      bio: '',
      phone: '',
      role: UserRole.OPERATOR,
      timezone: 'America/Sao_Paulo',
      locale: 'pt-BR',
    });
  };

  const handleCreateUser = () => {
    createUserMutation.mutate(formData);
  };

  const handleEditUser = () => {
    if (selectedUser) {
      updateUserMutation.mutate({
        id: selectedUser.id,
        data: {
          email: formData.email,
          full_name: formData.full_name,
          bio: formData.bio,
          phone: formData.phone,
          role: formData.role,
          timezone: formData.timezone,
          locale: formData.locale,
        },
      });
    }
  };

  const handleDeleteUser = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const handleActivateUser = (userId: number) => {
    activateUserMutation.mutate(userId);
  };

  const openEditDialog = (user: UserList) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name,
      password: '',
      bio: '',
      phone: user.phone || '',
      role: user.role,
      timezone: 'America/Sao_Paulo',
      locale: 'pt-BR',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: UserList) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const openDetailDialog = async (user: UserList) => {
    try {
      const userDetail = await userService.getUser(user.id);
      setSelectedUserDetail(userDetail);
      setIsDetailDialogOpen(true);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao carregar detalhes do usuário',
        severity: 'error',
      });
    }
  };

  const openPermissionsDialog = (user: UserList) => {
    setSelectedUser(user);
    setIsPermissionsDialogOpen(true);
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    user: UserList
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

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

  if (usersError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Erro ao carregar usuários. Tente novamente.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Gerenciamento de Usuários
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {permissions.canManageUsers && (
            <>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsCreateDialogOpen(true)}
              >
                Novo Usuário
              </Button>
              <Button
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={() => setIsRegistrationDialogOpen(true)}
              >
                Cadastro Público
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Notificações de Novos Cadastros */}
      <UserRegistrationNotification
        onViewUser={user => {
          openDetailDialog(user);
        }}
      />

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total de Usuários
                    </Typography>
                    <Typography variant="h5">
                      {stats.total_users || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ActiveIcon color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Usuários Ativos
                    </Typography>
                    <Typography variant="h5">
                      {stats.active_users || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <InactiveIcon color="error" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Usuários Inativos
                    </Typography>
                    <Typography variant="h5">
                      {stats.inactive_users || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AdminIcon color="warning" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Administradores
                    </Typography>
                    <Typography variant="h5">
                      {stats.role_distribution?.admin || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar usuários..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Função</InputLabel>
              <Select
                value={filters.role}
                label="Função"
                onChange={e => handleFilterChange('role', e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {Object.values(UserRole).map(role => (
                  <MenuItem key={role} value={role}>
                    {getUserRoleLabel(role)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.is_active}
                label="Status"
                onChange={e => handleFilterChange('is_active', e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="active">Ativos</MenuItem>
                <MenuItem value="inactive">Inativos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setFilters({ search: '', role: '', is_active: 'all' });
                setPage(0);
              }}
            >
              Limpar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Usuário</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Função</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Último Login</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usersLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      Nenhum usuário encontrado
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user: UserList) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {user.full_name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {user.full_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            ID: {user.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        icon={getRoleIcon(user.role)}
                        label={getUserRoleLabel(user.role)}
                        color={getRoleColor(user.role) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={
                          user.is_active ? <ActiveIcon /> : <InactiveIcon />
                        }
                        label={user.is_active ? 'Ativo' : 'Inativo'}
                        color={user.is_active ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user.last_login
                        ? (() => {
                            const date = new Date(user.last_login);
                            return isNaN(date.getTime())
                              ? 'Data inválida'
                              : date.toLocaleDateString('pt-BR');
                          })()
                        : 'Nunca'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={e => handleMenuClick(e, user)}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="Usuários por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            if (selectedUser) {
              openDetailDialog(selectedUser);
              handleMenuClose();
            }
          }}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver Detalhes</ListItemText>
        </MenuItem>
        {permissions.canManageUsers && (
          <MenuItem
            onClick={() => {
              if (selectedUser) {
                openEditDialog(selectedUser);
                handleMenuClose();
              }
            }}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
        )}
        {permissions.canManageUserRoles && (
          <MenuItem
            onClick={() => {
              if (selectedUser) {
                openPermissionsDialog(selectedUser);
                handleMenuClose();
              }
            }}
          >
            <ListItemIcon>
              <SecurityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Permissões</ListItemText>
          </MenuItem>
        )}
        {permissions.canManageUsers && (
          <MenuItem
            onClick={() => {
              if (selectedUser) {
                setIsProjectAccessDialogOpen(true);
                handleMenuClose();
              }
            }}
          >
            <ListItemIcon>
              <ProjectsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Gerenciar Projetos</ListItemText>
          </MenuItem>
        )}
        {selectedUser &&
          !selectedUser.is_active &&
          permissions.canActivateUsers && (
            <MenuItem
              onClick={() => {
                if (selectedUser) {
                  handleActivateUser(selectedUser.id);
                  handleMenuClose();
                }
              }}
            >
              <ListItemIcon>
                <ActiveIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Ativar</ListItemText>
            </MenuItem>
          )}
        {selectedUser &&
          selectedUser.is_active &&
          permissions.canActivateUsers && (
            <MenuItem
              onClick={() => {
                if (selectedUser) {
                  deactivateUserMutation.mutate(selectedUser.id);
                  handleMenuClose();
                }
              }}
              sx={{ color: 'warning.main' }}
            >
              <ListItemIcon>
                <InactiveIcon fontSize="small" color="warning" />
              </ListItemIcon>
              <ListItemText>Desativar</ListItemText>
            </MenuItem>
          )}
        {permissions.canDeleteUsers && (
          <MenuItem
            onClick={() => {
              if (selectedUser) {
                openDeleteDialog(selectedUser);
                handleMenuClose();
              }
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Excluir</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Create User Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Criar Novo Usuário</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome Completo"
                value={formData.full_name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, full_name: e.target.value }))
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={e =>
                  setFormData(prev => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Senha"
                type="password"
                value={formData.password}
                onChange={e =>
                  setFormData(prev => ({ ...prev, password: e.target.value }))
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={formData.phone}
                onChange={e =>
                  setFormData(prev => ({ ...prev, phone: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Função</InputLabel>
                <Select
                  value={formData.role}
                  label="Função"
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      role: e.target.value as UserRole,
                    }))
                  }
                >
                  {Object.values(UserRole).map(role => (
                    <MenuItem key={role} value={role}>
                      {getUserRoleLabel(role)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fuso Horário"
                value={formData.timezone}
                onChange={e =>
                  setFormData(prev => ({ ...prev, timezone: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Biografia"
                multiline
                rows={3}
                value={formData.bio}
                onChange={e =>
                  setFormData(prev => ({ ...prev, bio: e.target.value }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleCreateUser}
            variant="contained"
            disabled={createUserMutation.isPending}
          >
            {createUserMutation.isPending ? (
              <CircularProgress size={20} />
            ) : (
              'Criar'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Editar Usuário</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome Completo"
                value={formData.full_name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, full_name: e.target.value }))
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={e =>
                  setFormData(prev => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={formData.phone}
                onChange={e =>
                  setFormData(prev => ({ ...prev, phone: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Função</InputLabel>
                <Select
                  value={formData.role}
                  label="Função"
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      role: e.target.value as UserRole,
                    }))
                  }
                >
                  {Object.values(UserRole).map(role => (
                    <MenuItem key={role} value={role}>
                      {getUserRoleLabel(role)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Biografia"
                multiline
                rows={3}
                value={formData.bio}
                onChange={e =>
                  setFormData(prev => ({ ...prev, bio: e.target.value }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleEditUser}
            variant="contained"
            disabled={updateUserMutation.isPending}
          >
            {updateUserMutation.isPending ? (
              <CircularProgress size={20} />
            ) : (
              'Salvar'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o usuário{' '}
            <strong>{selectedUser?.full_name}</strong>? Esta ação não pode ser
            desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleDeleteUser}
            color="error"
            variant="contained"
            disabled={deleteUserMutation.isPending}
          >
            {deleteUserMutation.isPending ? (
              <CircularProgress size={20} />
            ) : (
              'Excluir'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Detail Modal */}
      <UserDetailModal
        open={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
        user={selectedUserDetail}
      />

      {/* User Registration Modal */}
      <UserRegistrationModal
        open={isRegistrationDialogOpen}
        onClose={() => setIsRegistrationDialogOpen(false)}
        onSuccess={() => {
          setSnackbar({
            open: true,
            message: 'Usuário cadastrado com sucesso!',
            severity: 'success',
          });
        }}
      />

      {/* User Permissions Modal */}
      <UserPermissionsModal
        open={isPermissionsDialogOpen}
        onClose={() => setIsPermissionsDialogOpen(false)}
        user={selectedUser}
      />

      {/* User Project Access Modal */}
      {selectedUser && (
        <UserProjectAccessModal
          open={isProjectAccessDialogOpen}
          onClose={() => setIsProjectAccessDialogOpen(false)}
          userId={selectedUser.id}
          userName={selectedUser.full_name}
        />
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

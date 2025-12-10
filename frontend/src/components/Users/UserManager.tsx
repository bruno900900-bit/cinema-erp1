import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Tooltip,
  Alert,
  Checkbox,
  FormGroup,
  FormControlLabel as MuiFormControlLabel,
  Avatar,
  Stack,
  Pagination,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AdminPanelSettings as AdminIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Block as BlockIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  userService,
  User,
  UserCreate,
  UserUpdate,
  getUserRoleLabel,
  getUserRoleColor,
  UserBulkAction,
} from '../../services/userService';
import { UserRole } from '../../types/user';

interface UserManagerProps {
  onUserSelect?: (user: User) => void;
  showSelectButton?: boolean;
}

const UserManager: React.FC<UserManagerProps> = ({
  onUserSelect,
  showSelectButton = false,
}) => {
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<boolean | ''>('');
  const [page, setPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
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

  const queryClient = useQueryClient();
  const pageSize = 10;

  // Buscar usuários
  const {
    data: usersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users', page, searchTerm, roleFilter, statusFilter],
    queryFn: () =>
      userService.getUsers({
        skip: (page - 1) * pageSize,
        limit: pageSize,
        search: searchTerm || undefined,
        role: roleFilter || undefined,
        is_active: statusFilter !== '' ? statusFilter : undefined,
      }),
  });

  // Buscar estatísticas
  const { data: stats } = useQuery({
    queryKey: ['userStats'],
    queryFn: userService.getUserStats,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdate }) =>
      userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: userService.activateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
    },
  });

  const bulkActionMutation = useMutation({
    mutationFn: userService.bulkAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      setSelectedUsers([]);
      setBulkAction('');
    },
  });

  const handleOpen = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        full_name: user.full_name,
        password: '',
        bio: user.bio || '',
        phone: user.phone || '',
        role: user.role,
        timezone: user.timezone,
        locale: user.locale,
      });
    } else {
      setEditingUser(null);
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
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingUser(null);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUser) {
      const updateData: UserUpdate = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }
      updateMutation.mutate({
        id: editingUser.id,
        data: updateData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (user: User) => {
    if (
      window.confirm(
        `Tem certeza que deseja deletar o usuário "${user.full_name}"?`
      )
    ) {
      deleteMutation.mutate(user.id);
    }
  };

  const handleActivate = (user: User) => {
    if (user.is_active) {
      if (
        window.confirm(
          `Tem certeza que deseja desativar o usuário "${user.full_name}"?`
        )
      ) {
        deleteMutation.mutate(user.id);
      }
    } else {
      activateMutation.mutate(user.id);
    }
  };

  const handleBulkAction = () => {
    if (selectedUsers.length === 0 || !bulkAction) return;

    const actionData: UserBulkAction = {
      user_ids: selectedUsers,
      action: bulkAction as any,
    };

    bulkActionMutation.mutate(actionData);
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === usersData?.users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(usersData?.users.map(user => user.id) || []);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
    setPage(1);
  };

  if (error) {
    return (
      <Alert severity="error">Erro ao carregar usuários: {error.message}</Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Gerenciar Usuários
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Novo Usuário
        </Button>
      </Box>

      {/* Estatísticas */}
      {stats && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <GroupIcon color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{stats.total_users}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total de Usuários
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{stats.active_users}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Usuários Ativos
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <CancelIcon color="error" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{stats.inactive_users}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Usuários Inativos
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AdminIcon color="warning" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">
                      {stats.role_distribution.admin || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Administradores
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Buscar"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value as UserRole)}
                label="Role"
              >
                <MenuItem value="">Todos</MenuItem>
                {Object.values(UserRole).map(role => (
                  <MenuItem key={role} value={role}>
                    {getUserRoleLabel(role)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as boolean)}
                label="Status"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="true">Ativo</MenuItem>
                <MenuItem value="false">Inativo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button variant="outlined" onClick={clearFilters} fullWidth>
              Limpar Filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Ações em lote */}
      {selectedUsers.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2">
              {selectedUsers.length} usuário(s) selecionado(s)
            </Typography>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Ação</InputLabel>
              <Select
                value={bulkAction}
                onChange={e => setBulkAction(e.target.value)}
                label="Ação"
              >
                <MenuItem value="activate">Ativar</MenuItem>
                <MenuItem value="deactivate">Desativar</MenuItem>
                <MenuItem value="delete">Deletar</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={handleBulkAction}
              disabled={!bulkAction}
            >
              Executar
            </Button>
            <Button variant="outlined" onClick={() => setSelectedUsers([])}>
              Cancelar
            </Button>
          </Box>
        </Paper>
      )}

      {/* Tabela de Usuários */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={
                    selectedUsers.length === usersData?.users.length &&
                    usersData?.users.length > 0
                  }
                  indeterminate={
                    selectedUsers.length > 0 &&
                    selectedUsers.length < (usersData?.users.length || 0)
                  }
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Usuário</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Contato</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Criado em</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : usersData?.users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              usersData?.users.map(user => (
                <TableRow key={user.id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2, width: 40, height: 40 }}>
                        {user.full_name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {user.full_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getUserRoleLabel(user.role)}
                      color={getUserRoleColor(user.role) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      {user.phone && (
                        <Box display="flex" alignItems="center" mb={0.5}>
                          <PhoneIcon sx={{ fontSize: 14, mr: 0.5 }} />
                          <Typography variant="caption">
                            {user.phone}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_active ? 'Ativo' : 'Inativo'}
                      color={user.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {(() => {
                        const date = new Date(user.created_at);
                        return isNaN(date.getTime())
                          ? 'data inválida'
                          : date.toLocaleDateString('pt-BR');
                      })()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleOpen(user)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={user.is_active ? 'Desativar' : 'Ativar'}>
                        <IconButton
                          size="small"
                          onClick={() => handleActivate(user)}
                          color={user.is_active ? 'error' : 'success'}
                        >
                          {user.is_active ? <BlockIcon /> : <CheckCircleIcon />}
                        </IconButton>
                      </Tooltip>
                      {showSelectButton && (
                        <Tooltip title="Selecionar">
                          <IconButton
                            size="small"
                            onClick={() => onUserSelect?.(user)}
                          >
                            <PersonAddIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginação */}
      {usersData && usersData.total_pages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={usersData.total_pages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}

      {/* Dialog de Criação/Edição */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome Completo *"
                  value={formData.full_name}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email *"
                  type="email"
                  value={formData.email}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={
                    editingUser
                      ? 'Nova Senha (deixe em branco para manter)'
                      : 'Senha *'
                  }
                  type="password"
                  value={formData.password}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, password: e.target.value }))
                  }
                  required={!editingUser}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Telefone"
                  value={formData.phone}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, phone: e.target.value }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Role *</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        role: e.target.value as UserRole,
                      }))
                    }
                    label="Role *"
                    required
                  >
                    {Object.values(UserRole).map(role => (
                      <MenuItem key={role} value={role}>
                        {getUserRoleLabel(role)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Timezone"
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
            <Button onClick={handleClose}>Cancelar</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingUser ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default UserManager;

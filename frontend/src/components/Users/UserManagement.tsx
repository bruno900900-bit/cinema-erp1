import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Person,
  Email,
  Phone,
  AdminPanelSettings,
  Security,
  Block,
  CheckCircle,
} from '@mui/icons-material';
import { userService } from '../../services/userService';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  permissions: string[];
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: string;
  is_active: boolean;
  permissions: string[];
}

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'manager', label: 'Gerente' },
  { value: 'user', label: 'Usuário' },
  { value: 'viewer', label: 'Visualizador' },
];

const PERMISSIONS = [
  { value: 'canManageUsers', label: 'Gerenciar Usuários' },
  { value: 'canManageLocations', label: 'Gerenciar Locações' },
  { value: 'canManageProjects', label: 'Gerenciar Projetos' },
  { value: 'canViewReports', label: 'Visualizar Relatórios' },
  { value: 'canManageContracts', label: 'Gerenciar Contratos' },
  { value: 'canViewAgenda', label: 'Visualizar Agenda' },
  { value: 'canExportData', label: 'Exportar Dados' },
];

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'user',
    is_active: true,
    permissions: [],
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await userService.getUsersList();
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
      is_active: true,
      permissions: [],
    });
    setDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      is_active: user.is_active,
      permissions: user.permissions,
    });
    setDialogOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        await userService.updateUserNew(editingUser.id, formData);
      } else {
        await userService.createUserNew(formData);
      }
      setDialogOpen(false);
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar usuário');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      await userService.deleteUserNew(userId);
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir usuário');
    }
  };

  const handleToggleUserStatus = async (userId: number, isActive: boolean) => {
    try {
      await userService.updateUserNew(userId, { is_active: !isActive });
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar status do usuário');
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission),
    }));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'manager':
        return 'warning';
      case 'user':
        return 'primary';
      case 'viewer':
        return 'default';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    const roleObj = ROLES.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Typography>Carregando usuários...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" component="h1">
          👥 Gestão de Usuários
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateUser}
        >
          Novo Usuário
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Person color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{users.length}</Typography>
                  <Typography color="text.secondary">
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
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {users.filter(u => u.is_active).length}
                  </Typography>
                  <Typography color="text.secondary">
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
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AdminPanelSettings
                  color="error"
                  sx={{ mr: 2, fontSize: 40 }}
                />
                <Box>
                  <Typography variant="h4">
                    {users.filter(u => u.role === 'admin').length}
                  </Typography>
                  <Typography color="text.secondary">
                    Administradores
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
                <Block color="warning" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {users.filter(u => !u.is_active).length}
                  </Typography>
                  <Typography color="text.secondary">
                    Usuários Inativos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuário</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Função</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Último Login</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">{user.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {user.id}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Email sx={{ mr: 1, fontSize: 16 }} />
                    {user.email}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getRoleLabel(user.role)}
                    color={getRoleColor(user.role)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.is_active ? 'Ativo' : 'Inativo'}
                    color={user.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {user.last_login
                    ? new Date(user.last_login).toLocaleDateString('pt-BR')
                    : 'Nunca'}
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={user.is_active ? 'Desativar' : 'Ativar'}>
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleToggleUserStatus(user.id, user.is_active)
                      }
                    >
                      {user.is_active ? <Block /> : <CheckCircle />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* User Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
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
                required={!editingUser}
                helperText={
                  editingUser ? 'Deixe em branco para manter a senha atual' : ''
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Função</InputLabel>
                <Select
                  value={formData.role}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, role: e.target.value }))
                  }
                  label="Função"
                >
                  {ROLES.map(role => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        is_active: e.target.checked,
                      }))
                    }
                  />
                }
                label="Usuário Ativo"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Permissões
              </Typography>
              <Grid container spacing={1}>
                {PERMISSIONS.map(permission => (
                  <Grid item xs={12} sm={6} key={permission.value}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.permissions.includes(
                            permission.value
                          )}
                          onChange={e =>
                            handlePermissionChange(
                              permission.value,
                              e.target.checked
                            )
                          }
                        />
                      }
                      label={permission.label}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveUser} variant="contained">
            {editingUser ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

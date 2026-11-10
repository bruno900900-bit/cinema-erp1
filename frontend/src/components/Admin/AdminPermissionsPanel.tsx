import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import {
  userService,
  getUserRoleLabel,
  getUserRoleColor,
} from '../../services/userService';
import { UserRole, UserList } from '../../types/user';
import UserPermissionsModal from '../Users/UserPermissionsModal';

export default function AdminPermissionsPanel() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [activeFilter, setActiveFilter] = useState<boolean | ''>('');
  const [selectedUser, setSelectedUser] = useState<UserList | null>(null);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);

  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['users', search, roleFilter, activeFilter],
    queryFn: () =>
      userService.getUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        is_active: activeFilter !== '' ? activeFilter : undefined,
        limit: 100,
      }),
  });

  const handleEditPermissions = (user: UserList) => {
    setSelectedUser(user);
    setPermissionsModalOpen(true);
  };

  const handleClosePermissionsModal = () => {
    setPermissionsModalOpen(false);
    setSelectedUser(null);
    refetch();
  };

  const getPermissionsSummary = (user: UserList): string => {
    if (user.role === UserRole.ADMIN) {
      return 'Acesso Total';
    }

    if (
      user.custom_permissions &&
      Object.keys(user.custom_permissions).length > 0
    ) {
      const customCount = Object.values(user.custom_permissions).filter(
        Boolean
      ).length;
      return `${customCount} permissões customizadas`;
    }

    return 'Permissões padrão do role';
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Erro ao carregar usuários: {(error as Error).message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" gutterBottom>
            Gerenciamento de Permissões
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Controle granular de permissões por usuário
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
        >
          Atualizar
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={e => setRoleFilter(e.target.value as UserRole | '')}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value={UserRole.ADMIN}>Administrador</MenuItem>
              <MenuItem value={UserRole.MANAGER}>Gerente</MenuItem>
              <MenuItem value={UserRole.COORDINATOR}>Coordenador</MenuItem>
              <MenuItem value={UserRole.OPERATOR}>Operador</MenuItem>
              <MenuItem value={UserRole.VIEWER}>Visualizador</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={activeFilter}
              label="Status"
              onChange={e => setActiveFilter(e.target.value as boolean | '')}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value={true as any}>Ativos</MenuItem>
              <MenuItem value={false as any}>Inativos</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Permissões</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : usersData?.users && usersData.users.length > 0 ? (
              usersData.users.map(user => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {user.full_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getUserRoleLabel(user.role)}
                      color={getUserRoleColor(user.role) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_active ? 'Ativo' : 'Inativo'}
                      color={user.is_active ? 'success' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {getPermissionsSummary(user)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar Permissões">
                      <IconButton
                        size="small"
                        onClick={() => handleEditPermissions(user)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Enviar Notificação">
                      <IconButton size="small" color="default">
                        <NotificationsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Nenhum usuário encontrado
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Total Count */}
      {usersData && (
        <Box
          sx={{
            mt: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Total: {usersData.total} usuário(s)
          </Typography>
        </Box>
      )}

      {/* Permissions Modal */}
      {selectedUser && (
        <UserPermissionsModal
          open={permissionsModalOpen}
          onClose={handleClosePermissionsModal}
          user={selectedUser}
        />
      )}
    </Box>
  );
}

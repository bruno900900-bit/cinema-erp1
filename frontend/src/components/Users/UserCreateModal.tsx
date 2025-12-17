import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  FormGroup,
  FormControlLabel,
  Switch,
  Box,
  Alert,
} from '@mui/material';
import { UserRole } from '../../types/user';
import { userService, getUserRoleLabel } from '../../services/userService';

interface UserCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const defaultPermissions = {
  canViewDashboard: true,
  canManageUsers: false,
  canManageProjects: false,
  canManageLocations: false,
  canViewFinancials: false,
  canExportData: false,
};

export default function UserCreateModal({
  open,
  onClose,
  onSuccess,
}: UserCreateModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: UserRole.VIEWER,
    phone: '',
    bio: '',
  });

  const [permissions, setPermissions] = useState(defaultPermissions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      await userService.createUserAsAdmin({
        ...formData,
        permissions_json: permissions,
      });

      onSuccess();
      onClose();

      // Reset form
      setFormData({
        email: '',
        full_name: '',
        role: UserRole.VIEWER,
        phone: '',
        bio: '',
      });
      setPermissions(defaultPermissions);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Criar Novo Usuário</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={e =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome Completo"
                value={formData.full_name}
                onChange={e =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      role: e.target.value as UserRole,
                    })
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

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={formData.phone}
                onChange={e =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Bio"
                value={formData.bio}
                onChange={e =>
                  setFormData({ ...formData, bio: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Permissões
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={permissions.canViewDashboard}
                      onChange={e =>
                        setPermissions({
                          ...permissions,
                          canViewDashboard: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Ver Dashboard"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={permissions.canManageUsers}
                      onChange={e =>
                        setPermissions({
                          ...permissions,
                          canManageUsers: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Gerenciar Usuários"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={permissions.canManageProjects}
                      onChange={e =>
                        setPermissions({
                          ...permissions,
                          canManageProjects: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Gerenciar Projetos"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={permissions.canManageLocations}
                      onChange={e =>
                        setPermissions({
                          ...permissions,
                          canManageLocations: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Gerenciar Locações"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={permissions.canViewFinancials}
                      onChange={e =>
                        setPermissions({
                          ...permissions,
                          canViewFinancials: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Ver Financeiro"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={permissions.canExportData}
                      onChange={e =>
                        setPermissions({
                          ...permissions,
                          canExportData: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Exportar Dados"
                />
              </FormGroup>
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info">
                O usuário receberá um email para definir sua senha e poderá
                fazer login imediatamente.
              </Alert>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.email || !formData.full_name}
        >
          {loading ? 'Criando...' : 'Criar Usuário'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

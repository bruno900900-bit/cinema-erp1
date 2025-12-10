import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  Card,
  CardContent,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Save as SaveIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, getUserRoleLabel } from '../services/userService';
import { UserRole } from '../types/user';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    timezone: user?.timezone || 'America/Sao_Paulo',
    locale: user?.locale || 'pt-BR',
    email_notifications: user?.email_notifications || true,
    sms_notifications: user?.sms_notifications || false,
    push_notifications: user?.push_notifications || true,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => userService.updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      refreshUser();
      setSnackbar({
        open: true,
        message: 'Perfil atualizado com sucesso!',
        severity: 'success',
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.message || 'Erro ao atualizar perfil',
        severity: 'error',
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      timezone: user?.timezone || 'America/Sao_Paulo',
      locale: user?.locale || 'pt-BR',
      email_notifications: user?.email_notifications || true,
      sms_notifications: user?.sms_notifications || false,
      push_notifications: user?.push_notifications || true,
    });
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Erro ao carregar informações do usuário.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Meu Perfil
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gerencie suas informações pessoais e preferências
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Informações Pessoais */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Typography
                variant="h6"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <PersonIcon />
                Informações Pessoais
              </Typography>
              {!isEditing && (
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                  variant="outlined"
                >
                  Editar
                </Button>
              )}
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nome Completo"
                  value={formData.full_name}
                  onChange={e => handleInputChange('full_name', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Telefone"
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel>Fuso Horário</InputLabel>
                  <Select
                    value={formData.timezone}
                    label="Fuso Horário"
                    onChange={e =>
                      handleInputChange('timezone', e.target.value)
                    }
                  >
                    <MenuItem value="America/Sao_Paulo">
                      São Paulo (GMT-3)
                    </MenuItem>
                    <MenuItem value="America/New_York">
                      Nova York (GMT-5)
                    </MenuItem>
                    <MenuItem value="Europe/London">Londres (GMT+0)</MenuItem>
                    <MenuItem value="Europe/Paris">Paris (GMT+1)</MenuItem>
                    <MenuItem value="Asia/Tokyo">Tóquio (GMT+9)</MenuItem>
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
                  onChange={e => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Conte um pouco sobre você..."
                />
              </Grid>
            </Grid>

            {isEditing && (
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={
                    updateProfileMutation.isPending ? (
                      <CircularProgress size={20} />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button variant="outlined" onClick={handleCancel}>
                  Cancelar
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Avatar e Informações Básicas */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'primary.main',
                  mx: 'auto',
                  mb: 2,
                  fontSize: '2rem',
                }}
              >
                {user.full_name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h6" gutterBottom>
                {user.full_name}
              </Typography>
              <Chip
                label={getUserRoleLabel(user.role as UserRole)}
                color="primary"
                size="small"
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Membro desde{' '}
                {(() => {
                  const date = new Date(user.created_at);
                  return isNaN(date.getTime())
                    ? 'data inválida'
                    : date.toLocaleDateString('pt-BR');
                })()}
              </Typography>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Paper sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
            >
              <NotificationsIcon />
              Notificações
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.email_notifications}
                  onChange={e =>
                    handleInputChange('email_notifications', e.target.checked)
                  }
                  disabled={!isEditing}
                />
              }
              label="Email"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.sms_notifications}
                  onChange={e =>
                    handleInputChange('sms_notifications', e.target.checked)
                  }
                  disabled={!isEditing}
                />
              }
              label="SMS"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.push_notifications}
                  onChange={e =>
                    handleInputChange('push_notifications', e.target.checked)
                  }
                  disabled={!isEditing}
                />
              }
              label="Push"
            />
          </Paper>
        </Grid>
      </Grid>

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

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
  Alert,
  CircularProgress,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  userService,
  UserCreate,
  getUserRoleLabel,
} from '../../services/userService';
import { UserRole } from '../../types/user';

interface UserRegistrationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function UserRegistrationModal({
  open,
  onClose,
  onSuccess,
}: UserRegistrationModalProps) {
  const queryClient = useQueryClient();
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createUserMutation = useMutation({
    mutationFn: (userData: UserCreate) => userService.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      setSnackbar({
        open: true,
        message: 'Usuário cadastrado com sucesso!',
        severity: 'success',
      });
      handleClose();
      onSuccess?.();
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.message || 'Erro ao cadastrar usuário',
        severity: 'error',
      });
    },
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nome completo é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    if (formData.phone && !/^[\d\s\(\)\-\+]+$/.test(formData.phone)) {
      newErrors.phone = 'Telefone inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      createUserMutation.mutate(formData);
    }
  };

  const handleClose = () => {
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
    setConfirmPassword('');
    setErrors({});
    onClose();
  };

  const handleInputChange = (field: keyof UserCreate, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAddIcon color="primary" />
            <Typography variant="h6">Cadastrar Novo Usuário</Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Informações Pessoais */}
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <PersonAddIcon fontSize="small" />
              Informações Pessoais
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nome Completo"
                  value={formData.full_name}
                  onChange={e => handleInputChange('full_name', e.target.value)}
                  error={!!errors.full_name}
                  helperText={errors.full_name}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Telefone"
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  error={!!errors.phone}
                  helperText={errors.phone}
                  placeholder="(11) 99999-9999"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Função</InputLabel>
                  <Select
                    value={formData.role}
                    label="Função"
                    onChange={e =>
                      handleInputChange('role', e.target.value as UserRole)
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
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Segurança */}
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <LockIcon fontSize="small" />
              Segurança
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Senha"
                  type="password"
                  value={formData.password}
                  onChange={e => handleInputChange('password', e.target.value)}
                  error={!!errors.password}
                  helperText={errors.password}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirmar Senha"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  required
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Informações Adicionais */}
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <BusinessIcon fontSize="small" />
              Informações Adicionais
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Biografia"
                  multiline
                  rows={3}
                  value={formData.bio}
                  onChange={e => handleInputChange('bio', e.target.value)}
                  placeholder="Conte um pouco sobre o usuário..."
                />
              </Grid>
            </Grid>

            {/* Informações sobre Roles */}
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Funções disponíveis:</strong>
                <br />• <strong>Administrador:</strong> Acesso total ao sistema
                <br />• <strong>Gerente:</strong> Pode gerenciar projetos e
                locações
                <br />• <strong>Coordenador:</strong> Pode coordenar projetos
                <br />• <strong>Operador:</strong> Acesso básico para operações
                <br />• <strong>Visualizador:</strong> Apenas visualização
                <br />• <strong>Cliente:</strong> Acesso limitado
              </Typography>
            </Alert>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createUserMutation.isPending}
            startIcon={
              createUserMutation.isPending ? (
                <CircularProgress size={20} />
              ) : (
                <PersonAddIcon />
              )
            }
          >
            {createUserMutation.isPending
              ? 'Cadastrando...'
              : 'Cadastrar Usuário'}
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

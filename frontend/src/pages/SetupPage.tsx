import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Container,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  AdminPanelSettings as AdminIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { UserRole } from '../types/user';
import { setupService } from '../services/setupService';

interface SetupStatus {
  is_configured: boolean;
  user_count: number;
  message: string;
}

const SetupPage: React.FC = () => {
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      setLoading(true);
      const status = await setupService.getSetupStatus();
      setSetupStatus(status as SetupStatus);
    } catch (error) {
      console.error('Erro ao verificar status do setup:', error);
      setError('Erro ao verificar status do sistema');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      setError('Nome completo é obrigatório');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Senha é obrigatória');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Senhas não coincidem');
      return false;
    }
    return true;
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setCreating(true);
      setError(null);

      await setupService.createAdminUser({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        role: UserRole.ADMIN,
      });

      setSuccess('Usuário administrador criado com sucesso!');
      setFormData({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: '',
      });

      // Atualizar status
      await checkSetupStatus();
    } catch (error: any) {
      console.error('Erro ao criar usuário administrador:', error);
      setError(
        error.response?.data?.detail || 'Erro ao criar usuário administrador'
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
          }}
        >
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (setupStatus?.is_configured) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircleIcon
            sx={{ fontSize: 80, color: 'success.main', mb: 2 }}
          />
          <Typography variant="h4" gutterBottom>
            Sistema Configurado
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            O sistema já foi configurado e possui {setupStatus.user_count}{' '}
            usuário(s) cadastrado(s).
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/login')}
            sx={{ borderRadius: 2 }}
          >
            Ir para Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <AdminIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Configuração Inicial
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Crie o primeiro usuário administrador para começar a usar o sistema
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              <PersonAddIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Criar Usuário Administrador
            </Typography>

            <form onSubmit={handleCreateAdmin}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nome Completo"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    disabled={creating}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={creating}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Senha"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={creating}
                    helperText="Mínimo de 6 caracteres"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirmar Senha"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    disabled={creating}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={creating}
                      startIcon={
                        creating ? (
                          <CircularProgress size={20} />
                        ) : (
                          <PersonAddIcon />
                        )
                      }
                      sx={{ minWidth: 200 }}
                    >
                      {creating ? 'Criando...' : 'Criar Administrador'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Informações sobre o Administrador:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Acesso total ao sistema
            <br />
            • Pode gerenciar todos os usuários
            <br />
            • Pode criar e gerenciar projetos
            <br />
            • Acesso a todas as funcionalidades
            <br />• Pode exportar dados e relatórios
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default SetupPage;

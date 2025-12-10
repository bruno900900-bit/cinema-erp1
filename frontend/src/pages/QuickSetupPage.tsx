import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Login as LoginIcon,
} from '@mui/icons-material';

const validationSchema = yup.object({
  email: yup
    .string()
    .email('Digite um email válido')
    .required('Email é obrigatório'),
  full_name: yup.string().required('Nome completo é obrigatório'),
  password: yup
    .string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres')
    .required('Senha é obrigatória'),
  role: yup.string().required('Role é obrigatória'),
});

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function QuickSetupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      full_name: '',
      password: '',
      role: 'admin',
    },
    validationSchema: validationSchema,
    onSubmit: async values => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        // Sistema de cadastro local (temporário)
        const newUser: User = {
          id: Date.now(), // ID temporário
          email: values.email,
          full_name: values.full_name,
          role: values.role,
          is_active: true,
          created_at: new Date().toISOString(),
        };

        // Salvar no localStorage
        const existingUsers = JSON.parse(
          localStorage.getItem('temp_users') || '[]'
        );
        existingUsers.push(newUser);
        localStorage.setItem('temp_users', JSON.stringify(existingUsers));

        setSuccess(`Usuário ${newUser.full_name} criado com sucesso!`);
        formik.resetForm();
        loadUsers(); // Recarregar lista de usuários
      } catch (err: any) {
        setError(err.message || 'Erro ao criar usuário');
      } finally {
        setLoading(false);
      }
    },
  });

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      // Carregar usuários do localStorage
      const storedUsers = localStorage.getItem('temp_users');
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        setUsers(users);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!window.confirm('Tem certeza que deseja deletar este usuário?')) {
      return;
    }

    try {
      // Deletar do localStorage
      const storedUsers = localStorage.getItem('temp_users');
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        const filteredUsers = users.filter((user: User) => user.id !== userId);
        localStorage.setItem('temp_users', JSON.stringify(filteredUsers));
      }

      setSuccess('Usuário deletado com sucesso!');
      loadUsers(); // Recarregar lista
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar usuário');
    }
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      admin: 'error',
      manager: 'warning',
      coordinator: 'info',
      operator: 'primary',
      viewer: 'secondary',
      client: 'default',
    };
    return colors[role] || 'default';
  };

  // Carregar usuários ao montar o componente
  React.useEffect(() => {
    loadUsers();
  }, []);

  const createDefaultAdmin = () => {
    const defaultAdmin: User = {
      id: 1,
      email: 'admin@cinema.com',
      full_name: 'Administrador Sistema',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const existingUsers = JSON.parse(
      localStorage.getItem('temp_users') || '[]'
    );
    const adminExists = existingUsers.some(
      (user: User) => user.email === defaultAdmin.email
    );

    if (!adminExists) {
      existingUsers.push(defaultAdmin);
      localStorage.setItem('temp_users', JSON.stringify(existingUsers));
      setSuccess('Usuário administrador padrão criado com sucesso!');
      loadUsers();
    } else {
      setError('Usuário administrador já existe!');
    }
  };

  const simulateLogin = (user: User) => {
    // Simular login salvando no localStorage
    localStorage.setItem('current_user', JSON.stringify(user));
    localStorage.setItem('is_authenticated', 'true');
    setSuccess(`Login simulado para ${user.full_name}! Redirecionando...`);

    // Redirecionar após 2 segundos
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 2000);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Box sx={{ maxWidth: 1200, width: '100%' }}>
        <Paper elevation={24} sx={{ borderRadius: 4, p: 4, mb: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              🎬 Cinema ERP - Cadastro Rápido
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sistema de cadastro rápido para teste da aplicação
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="full_name"
                  name="full_name"
                  label="Nome Completo"
                  value={formik.values.full_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.full_name && Boolean(formik.errors.full_name)
                  }
                  helperText={
                    formik.touched.full_name && formik.errors.full_name
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="Senha"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.password && Boolean(formik.errors.password)
                  }
                  helperText={formik.touched.password && formik.errors.password}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="role"
                  name="role"
                  label="Role"
                  select
                  SelectProps={{ native: true }}
                  value={formik.values.role}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.role && Boolean(formik.errors.role)}
                  helperText={formik.touched.role && formik.errors.role}
                >
                  <option value="admin">Administrador</option>
                  <option value="manager">Gerente</option>
                  <option value="coordinator">Coordenador</option>
                  <option value="operator">Operador</option>
                  <option value="viewer">Visualizador</option>
                  <option value="client">Cliente</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <Button
                  color="primary"
                  variant="contained"
                  fullWidth
                  type="submit"
                  sx={{ py: 1.5, borderRadius: 2 }}
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <AddIcon />
                    )
                  }
                >
                  {loading ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <Button
                  color="secondary"
                  variant="outlined"
                  fullWidth
                  onClick={createDefaultAdmin}
                  sx={{ py: 1.5, borderRadius: 2 }}
                >
                  Criar Admin Padrão
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>

        {/* Lista de Usuários */}
        <Paper elevation={24} sx={{ borderRadius: 4, p: 4 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography variant="h5" gutterBottom>
              Usuários Cadastrados
            </Typography>
            <Button
              variant="outlined"
              onClick={loadUsers}
              disabled={loadingUsers}
              startIcon={loadingUsers ? <CircularProgress size={20} /> : null}
            >
              {loadingUsers ? 'Carregando...' : 'Atualizar'}
            </Button>
          </Box>

          {users.length === 0 ? (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ textAlign: 'center', py: 4 }}
            >
              Nenhum usuário cadastrado ainda
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {users.map(user => (
                <Grid item xs={12} sm={6} md={4} key={user.id}>
                  <Card sx={{ position: 'relative' }}>
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {user.full_name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            {user.email}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            display: 'flex',
                            gap: 0.5,
                          }}
                        >
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => simulateLogin(user)}
                            title="Fazer login como este usuário"
                          >
                            <LoginIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => deleteUser(user.id)}
                            title="Deletar usuário"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip
                          label={user.role}
                          color={getRoleColor(user.role) as any}
                          size="small"
                        />
                        <Chip
                          label={user.is_active ? 'Ativo' : 'Inativo'}
                          color={user.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>

                      <Typography variant="caption" color="text.secondary">
                        Criado em:{' '}
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>

        {/* Botão para ir para o login */}
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => navigate('/login')}
            sx={{ px: 4, py: 1.5 }}
          >
            Ir para Login
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  InputAdornment,
  IconButton,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Phone,
  LocationOn,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';

// Validation schemas
const loginSchema = yup.object({
  email: yup
    .string()
    .email('Digite um email válido')
    .required('Email é obrigatório'),
  password: yup
    .string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres')
    .required('Senha é obrigatória'),
});

const registerSchema = yup.object({
  full_name: yup
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .required('Nome é obrigatório'),
  email: yup
    .string()
    .email('Digite um email válido')
    .required('Email é obrigatório'),
  phone: yup.string().nullable(),
  password: yup
    .string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres')
    .required('Senha é obrigatória'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'As senhas devem ser iguais')
    .required('Confirme sua senha'),
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function LoginPage() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  // Login form
  const loginFormik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async values => {
      setError('');
      setLoading(true);
      try {
        const result = await login(values.email, values.password);
        if (!result) {
          setError('Credenciais inválidas. Verifique seu email e senha.');
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao fazer login. Tente novamente.');
      } finally {
        setLoading(false);
      }
    },
  });

  // Register form
  const registerFormik = useFormik({
    initialValues: {
      full_name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: registerSchema,
    onSubmit: async values => {
      setError('');
      setSuccess('');
      setLoading(true);
      try {
        // Use Supabase Auth for registration
        await authService.signUp({
          email: values.email,
          password: values.password,
          full_name: values.full_name,
        });
        setSuccess('Conta criada com sucesso! Você já pode fazer login.');
        setTabValue(0);
        registerFormik.resetForm();
      } catch (err: any) {
        setError(
          err.response?.data?.detail || 'Erro ao criar conta. Tente novamente.'
        );
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, #1a1a2e 50%, ${theme.palette.background.default} 100%)`,
        p: 2,
      }}
    >
      <Paper
        elevation={24}
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          maxWidth: 440,
          width: '100%',
          bgcolor: 'background.paper',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            p: 4,
            textAlign: 'center',
          }}
        >
          <LocationOn sx={{ fontSize: 56, mb: 1 }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Cinema ERP
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
            Sistema de Gestão de Locações
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={(_, v) => {
              setTabValue(v);
              setError('');
              setSuccess('');
            }}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                py: 2,
                fontWeight: 600,
              },
            }}
          >
            <Tab label="Entrar" />
            <Tab label="Criar Conta" />
          </Tabs>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              severity="success"
              sx={{ mb: 2 }}
              onClose={() => setSuccess('')}
            >
              {success}
            </Alert>
          )}

          {/* Login Tab */}
          <TabPanel value={tabValue} index={0}>
            <form onSubmit={loginFormik.handleSubmit}>
              <TextField
                fullWidth
                id="login-email"
                name="email"
                label="Email"
                value={loginFormik.values.email}
                onChange={loginFormik.handleChange}
                onBlur={loginFormik.handleBlur}
                error={
                  loginFormik.touched.email && Boolean(loginFormik.errors.email)
                }
                helperText={
                  loginFormik.touched.email && loginFormik.errors.email
                }
                disabled={loading}
                sx={{ mb: 2.5 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                id="login-password"
                name="password"
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                value={loginFormik.values.password}
                onChange={loginFormik.handleChange}
                onBlur={loginFormik.handleBlur}
                error={
                  loginFormik.touched.password &&
                  Boolean(loginFormik.errors.password)
                }
                helperText={
                  loginFormik.touched.password && loginFormik.errors.password
                }
                disabled={loading}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Entrar'
                )}
              </Button>

              <Button
                fullWidth
                variant="text"
                size="small"
                sx={{ mt: 2, textTransform: 'none' }}
                disabled={loading}
              >
                Esqueci minha senha
              </Button>
            </form>
          </TabPanel>

          {/* Register Tab */}
          <TabPanel value={tabValue} index={1}>
            <form onSubmit={registerFormik.handleSubmit}>
              <TextField
                fullWidth
                id="register-name"
                name="full_name"
                label="Nome Completo"
                value={registerFormik.values.full_name}
                onChange={registerFormik.handleChange}
                onBlur={registerFormik.handleBlur}
                error={
                  registerFormik.touched.full_name &&
                  Boolean(registerFormik.errors.full_name)
                }
                helperText={
                  registerFormik.touched.full_name &&
                  registerFormik.errors.full_name
                }
                disabled={loading}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                id="register-email"
                name="email"
                label="Email"
                value={registerFormik.values.email}
                onChange={registerFormik.handleChange}
                onBlur={registerFormik.handleBlur}
                error={
                  registerFormik.touched.email &&
                  Boolean(registerFormik.errors.email)
                }
                helperText={
                  registerFormik.touched.email && registerFormik.errors.email
                }
                disabled={loading}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                id="register-phone"
                name="phone"
                label="Telefone (opcional)"
                value={registerFormik.values.phone}
                onChange={registerFormik.handleChange}
                disabled={loading}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                id="register-password"
                name="password"
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                value={registerFormik.values.password}
                onChange={registerFormik.handleChange}
                onBlur={registerFormik.handleBlur}
                error={
                  registerFormik.touched.password &&
                  Boolean(registerFormik.errors.password)
                }
                helperText={
                  registerFormik.touched.password &&
                  registerFormik.errors.password
                }
                disabled={loading}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                id="register-confirm-password"
                name="confirmPassword"
                label="Confirmar Senha"
                type={showPassword ? 'text' : 'password'}
                value={registerFormik.values.confirmPassword}
                onChange={registerFormik.handleChange}
                onBlur={registerFormik.handleBlur}
                error={
                  registerFormik.touched.confirmPassword &&
                  Boolean(registerFormik.errors.confirmPassword)
                }
                helperText={
                  registerFormik.touched.confirmPassword &&
                  registerFormik.errors.confirmPassword
                }
                disabled={loading}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </form>
          </TabPanel>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 2,
            textAlign: 'center',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            © 2024 Cinema ERP. Todos os direitos reservados.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

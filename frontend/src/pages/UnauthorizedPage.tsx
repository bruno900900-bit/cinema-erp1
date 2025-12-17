import React from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 6,
            textAlign: 'center',
            maxWidth: 500,
          }}
        >
          <LockIcon
            sx={{
              fontSize: 80,
              color: 'error.main',
              mb: 2,
            }}
          />
          <Typography variant="h4" gutterBottom>
            Acesso Negado
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Você não tem permissão para acessar esta página. Entre em contato
            com o administrador se você acredita que deveria ter acesso.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="contained" onClick={() => navigate('/dashboard')}>
              Voltar ao Dashboard
            </Button>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Voltar
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

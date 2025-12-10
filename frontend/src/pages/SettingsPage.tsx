import React from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material'
import {
  Settings,
} from '@mui/icons-material'

export default function SettingsPage() {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Configurações
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure preferências e parâmetros do sistema
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<Settings />}
          size="large"
          sx={{ borderRadius: 2 }}
        >
          Salvar
        </Button>
      </Box>

      {/* Conteúdo temporário */}
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Settings sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          Página em Desenvolvimento
        </Typography>
        <Typography variant="body2" color="text.secondary">
          A funcionalidade de configurações será implementada em breve.
        </Typography>
      </Paper>
    </Box>
  )
}

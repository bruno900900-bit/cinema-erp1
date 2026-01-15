import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import { Close, Settings } from '@mui/icons-material';
import { Project, ProjectLocation } from '../../types/user';
import { useQueryClient } from '@tanstack/react-query';
import ProjectLocationManager from './ProjectLocationManager';
import { LocationDemandsPanel } from '../Demands';
import ProjectSettingsManager from './ProjectSettingsManager';
import { formatDateBR } from '../../utils/date';

interface ProjectDetailModalProps {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

export default function ProjectDetailModal({
  open,
  project,
  onClose,
  onEdit,
  onDelete,
}: ProjectDetailModalProps) {
  const [expandedLocation, setExpandedLocation] = useState<number | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const queryClient = useQueryClient();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: any) => formatDateBR(dateString);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!project || !project.title) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, minHeight: '80vh' },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h5" component="h2">
            {project.title}
          </Typography>
          <Box display="flex" gap={1}>
            <Tooltip title="Configurações">
              <IconButton onClick={() => setIsSettingsOpen(true)} size="small">
                <Settings />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Informações do Projeto */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Informações do Projeto
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {project.description || 'Sem descrição'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip
                    label={project.status || 'Sem status'}
                    color="primary"
                    size="small"
                  />
                  <Chip
                    label={project.client_name || 'Sem cliente'}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Orçamento e Prazos
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant="body2">Orçamento Total:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(project.budget || 0)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant="body2">Gasto:</Typography>
                    <Typography variant="body2" color="error">
                      {formatCurrency(project.budget_spent || 0)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant="body2">Restante:</Typography>
                    <Typography variant="body2" color="success.main">
                      {formatCurrency(project.budget_remaining || 0)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant="body2">Prazo:</Typography>
                    <Typography variant="body2">
                      {project.end_date
                        ? formatDate(project.end_date)
                        : 'Sem prazo definido'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Abas para diferentes seções */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="project details tabs"
          >
            <Tab label="Locações" />
            <Tab label="Demandas" />
          </Tabs>
        </Box>

        {/* Conteúdo das Abas */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Gerenciamento de Locações
            </Typography>
            <ProjectLocationManager
              projectId={parseInt(project.id)}
              projectTitle={project.title}
            />
          </Box>
        )}

        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <LocationDemandsPanel
              projectId={parseInt(project.id)}
              projectLocations={project.locations || []}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Fechar
        </Button>
        {onEdit && (
          <Button onClick={() => onEdit(project)} variant="contained">
            Editar Projeto
          </Button>
        )}
        {onDelete && (
          <Button
            onClick={() => onDelete(project)}
            variant="outlined"
            color="error"
          >
            Excluir Projeto
          </Button>
        )}
      </DialogActions>

      {/* Modal de Configurações */}
      <ProjectSettingsManager
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        project={project}
        users={[]} // TODO: Buscar usuários
        onSave={async settings => {
          console.log('Salvando configurações:', settings);
          // TODO: Implementar salvamento das configurações
        }}
      />
    </Dialog>
  );
}

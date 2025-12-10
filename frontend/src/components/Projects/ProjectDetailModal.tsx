import React, { useState, useEffect } from 'react';
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
  CardActions,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  Badge,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Close,
  ExpandMore,
  CheckCircle,
  RadioButtonUnchecked,
  PauseCircle,
  Cancel,
  Add,
  Edit,
  Delete,
  LocationOn,
  Schedule,
  AttachMoney,
  Person,
  Warning,
  CheckCircleOutline,
  Timeline,
  Flag,
  PlayArrow,
  Pause,
  Settings,
} from '@mui/icons-material';
import {
  Project,
  Location,
  ProjectLocation,
  ProjectLocationStage,
} from '../../types/user';
import { projectLocationStageService } from '../../services/projectLocationStageService';
import { projectLocationService } from '../../services/projectLocationService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProjectLocationManager from './ProjectLocationManager';
import LocationStagesProgress from './LocationStagesProgress';
import ProjectLocationStagesManager from './ProjectLocationStagesManager';
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

  // Reativar as queries que estão desabilitadas
  const {
    data: stagesSummary,
    isLoading: isLoadingSummary,
    error: stagesSummaryError,
  } = useQuery<ProjectLocationStagesSummary>({
    queryKey: ['project-stages-summary', project?.id],
    queryFn: () =>
      projectLocationStageService.getProjectStagesSummary(Number(project!.id)),
    enabled: !!project?.id, // Reativar quando houver projeto
    retry: 1, // Reduzir tentativas de retry
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  const {
    data: allStages,
    isLoading: isLoadingStages,
    error: allStagesError,
  } = useQuery<ProjectLocationStage[]>({
    queryKey: ['project-stages', project?.id],
    queryFn: () =>
      projectLocationStageService.getStagesByProject(Number(project!.id)),
    enabled: !!project?.id, // Reativar quando houver projeto
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Mutation para atualizar status da etapa (desabilitado temporariamente)
  const updateStageStatusMutation = useMutation({
    mutationFn: ({
      stageId,
      status,
      notes,
    }: {
      stageId: number;
      status: string;
      notes?: string;
    }) => projectLocationStageService.updateStageStatus(stageId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-stages-summary', project?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['project-stages', project?.id],
      });
    },
  });

  // Mutation para criar etapas padrão (desabilitado temporariamente)
  const createDefaultStagesMutation = useMutation({
    mutationFn: ({
      projectId,
      locationId,
    }: {
      projectId: number;
      locationId: number;
    }) =>
      projectLocationStageService.createDefaultStagesForLocation(
        projectId,
        locationId
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-stages-summary', project?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['project-stages', project?.id],
      });
    },
  });

  const handleStageStatusUpdate = (
    stageId: number,
    newStatus: string,
    notes?: string
  ) => {
    updateStageStatusMutation.mutate({ stageId, status: newStatus, notes });
  };

  const handleCreateDefaultStages = (locationId: number) => {
    if (project) {
      createDefaultStagesMutation.mutate({
        projectId: Number(project.id),
        locationId,
      });
    }
  };

  const getStagesByLocation = (locationId: number): ProjectLocationStage[] => {
    return allStages?.filter(stage => stage.location_id === locationId) || [];
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle color="success" />;
      case 'in_progress':
        return <RadioButtonUnchecked color="primary" />;
      case 'on_hold':
        return <PauseCircle color="warning" />;
      case 'cancelled':
      case 'rejected':
        return <Cancel color="error" />;
      default:
        return <RadioButtonUnchecked color="disabled" />;
    }
  };

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

  const handleStageUpdate = async (
    stageId: number,
    updates: Partial<ProjectLocationStage>
  ) => {
    try {
      await projectLocationStageService.updateStage(stageId, updates);
      // Recarregar os dados após a atualização
      queryClient.invalidateQueries(['project-stages-summary', project?.id]);
      queryClient.invalidateQueries(['project-stages', project?.id]);
      queryClient.invalidateQueries(['projects']);
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error);
    }
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
            <Tab label="Etapas" />
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
            {/* Resumo do Progresso Geral */}
            {stagesSummaryError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Erro ao carregar resumo das etapas: {stagesSummaryError.message}
              </Alert>
            )}
            {isLoadingSummary ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Carregando dados das etapas...
                </Typography>
              </Box>
            ) : stagesSummary ? (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Resumo Geral das Etapas
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {stagesSummary.total_stages}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total de Etapas
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {stagesSummary.completed_stages}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Concluídas
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="info.main">
                          {stagesSummary.in_progress_stages}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Em Andamento
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">
                          {stagesSummary.overdue_stages}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Atrasadas
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Progresso Geral:{' '}
                      {stagesSummary.overall_progress.toFixed(1)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={stagesSummary.overall_progress}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            ) : null}

            {/* Progresso das Locações */}
            <Typography variant="h6" gutterBottom>
              Progresso por Locação
            </Typography>

            {project.locations &&
            Array.isArray(project.locations) &&
            project.locations.length > 0 ? (
              project.locations.map(projectLocation => (
                <LocationStagesProgress
                  key={projectLocation.id}
                  projectLocation={projectLocation}
                  onStageUpdate={handleStageUpdate}
                  compact={false}
                />
              ))
            ) : (
              <Alert severity="info">
                Nenhuma locação adicionada ao projeto ainda.
              </Alert>
            )}
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

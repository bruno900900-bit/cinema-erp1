import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Assignment,
  Event,
  Description,
  AccountBalance,
  ExpandMore,
  ExpandLess,
  Close,
  Notifications,
  CalendarMonth,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Project, TaskStatus, ProjectLocation } from '@/types/user';
import { projectService } from '@/services/projectService';
import { locationService } from '@/services/locationService';
import {
  projectLocationService,
  ProjectLocationUpdate,
} from '@/services/projectLocationService';
import userService from '@/services/userService';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import ProjectLocationsOverview from '@/components/Projects/ProjectLocationsOverview';
import ProjectBudgetDashboard from '@/components/Projects/ProjectBudgetDashboard';
import LocationSelectionModal from '@/components/Projects/LocationSelectionModal';
import ProjectReportModal from '@/components/Projects/ProjectReportModal';
import ProjectWorkflowPanel from '@/components/Projects/ProjectWorkflowPanel';
import ProjectVisitLocationsPanel from '@/components/Projects/ProjectVisitLocationsPanel';
import ProjectTimelineHub from '@/components/Projects/ProjectTimelineHub';
import ProjectPhotosGallery from '@/components/Projects/ProjectPhotosGallery';
import ProjectQuickActions from '@/components/Projects/ProjectQuickActions';
import ProjectDemandsList from '@/components/Demands/ProjectDemandsList';
import { formatDateBR, toInputDate } from '@/utils/date';
import { toast } from 'react-toastify';

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showBudgetDashboard, setShowBudgetDashboard] = useState(false);
  const [isLocationSelectionOpen, setIsLocationSelectionOpen] = useState(false);
  const [editingLocation, setEditingLocation] =
    useState<ProjectLocation | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const {
    data: project,
    isLoading,
    error,
  } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getProjectById(projectId!),
    enabled: !!projectId,
  });

  const { data: responsibleUser } = useQuery({
    queryKey: ['user', project?.responsibleUserId],
    queryFn: () => userService.getUser(parseInt(project!.responsibleUserId)),
    enabled: !!project?.responsibleUserId,
  });

  // Fetch available locations when modal opens
  const { data: availableLocations = [] } = useQuery({
    queryKey: ['locations-for-selection'],
    queryFn: () => locationService.searchLocations({ page_size: 100 }),
    enabled: isLocationSelectionOpen,
    staleTime: 5 * 60 * 1000,
    select: data => data?.locations || [],
  });

  // Fetch project locations for demands list
  const { data: projectLocations = [] } = useQuery({
    queryKey: ['project-locations', projectId],
    queryFn: () =>
      projectLocationService.getProjectLocations(Number(projectId)),
    enabled: !!projectId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Mutation to add project locations
  const addLocationsMutation = useMutation({
    mutationFn: async (projectLocations: ProjectLocation[]) => {
      const results = [];
      for (const loc of projectLocations) {
        const result = await projectLocationService.createProjectLocation({
          project_id: Number(projectId),
          location_id: loc.location_id,
          rental_start:
            typeof loc.rental_start === 'string'
              ? loc.rental_start
              : new Date(loc.rental_start).toISOString().split('T')[0],
          rental_end:
            typeof loc.rental_end === 'string'
              ? loc.rental_end
              : new Date(loc.rental_end).toISOString().split('T')[0],
          daily_rate: loc.daily_rate || 0,
          notes: loc.notes,
          // Datas de produção
          visit_date: loc.visit_date
            ? String(loc.visit_date).split('T')[0]
            : undefined,
          technical_visit_date: loc.technical_visit_date
            ? String(loc.technical_visit_date).split('T')[0]
            : undefined,
          filming_start_date: loc.filming_start_date
            ? String(loc.filming_start_date).split('T')[0]
            : undefined,
          filming_end_date: loc.filming_end_date
            ? String(loc.filming_end_date).split('T')[0]
            : undefined,
          delivery_date: loc.delivery_date
            ? String(loc.delivery_date).split('T')[0]
            : undefined,
        });
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-locations', projectId],
      });
      setIsLocationSelectionOpen(false);
      toast.success('Locações adicionadas com sucesso!');
    },
    onError: error => {
      console.error('Erro ao adicionar locações:', error);
      toast.error('Erro ao adicionar locações.');
    },
  });

  // Delete location mutation
  const deleteProjectLocationMutation = useMutation({
    mutationFn: (locationId: number) =>
      projectLocationService.deleteProjectLocation(locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({
        queryKey: ['project-locations', projectId],
      });
      toast.success('Locação removida com sucesso');
    },
    onError: error => {
      console.error('Erro ao remover locação:', error);
      toast.error('Erro ao remover locação');
    },
  });

  const handleLocationsSelected = (projectLocations: ProjectLocation[]) => {
    addLocationsMutation.mutate(projectLocations);
  };

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProjectLocationUpdate }) =>
      projectLocationService.updateProjectLocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({
        queryKey: ['project-locations', projectId],
      });
      setIsEditModalOpen(false);
      setEditingLocation(null);
      toast.success('Locação atualizada com sucesso');
    },
    onError: error => {
      console.error('Erro ao atualizar locação:', error);
      toast.error('Erro ao atualizar locação');
    },
  });

  const handleEditLocation = (location: ProjectLocation) => {
    setEditingLocation(location);
    setIsEditModalOpen(true);
  };

  const handleSaveLocationEdit = () => {
    if (!editingLocation) return;

    // Helper para formatar data
    const formatDate = (
      date: Date | string | undefined
    ): string | undefined => {
      if (!date) return undefined;
      if (date instanceof Date) return date.toISOString().split('T')[0];
      return String(date).split('T')[0];
    };

    const updateData: ProjectLocationUpdate = {
      rental_start:
        editingLocation.rental_start instanceof Date
          ? editingLocation.rental_start.toISOString().split('T')[0]
          : String(editingLocation.rental_start).split('T')[0],
      rental_end:
        editingLocation.rental_end instanceof Date
          ? editingLocation.rental_end.toISOString().split('T')[0]
          : String(editingLocation.rental_end).split('T')[0],
      daily_rate: editingLocation.daily_rate,
      notes: editingLocation.notes,
      // Datas de produção
      visit_date: formatDate(editingLocation.visit_date),
      technical_visit_date: formatDate(editingLocation.technical_visit_date),
      filming_start_date: formatDate(editingLocation.filming_start_date),
      filming_end_date: formatDate(editingLocation.filming_end_date),
      delivery_date: formatDate(editingLocation.delivery_date),
    };

    updateLocationMutation.mutate({
      id: Number(editingLocation.id),
      data: updateData,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Handler for Export Report
  const handleExportReport = async () => {
    try {
      if (!project) return;

      toast.info('Gerando relatório...');

      // Fetch fresh location data with all details for the report
      const locations = await projectLocationService.getProjectLocations(
        project.id
      );

      const { projectReportService } =
        await import('@/services/projectReportService');
      projectReportService.exportProjectReport(project, locations);

      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast.error('Erro ao gerar relatório.');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error)
    return <Typography color="error">Erro ao carregar projeto</Typography>;
  if (!project) return <Typography>Projeto não encontrado</Typography>;

  const calculateProgress = () => {
    if (project.tasks && project.tasks.length > 0) {
      const completedTasks = project.tasks.filter(
        task => task.status === 'completed'
      ).length;
      return (completedTasks / project.tasks.length) * 100;
    }
    return 0;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Enhanced Header */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            component="button"
            variant="body1"
            onClick={() => navigate('/projects')}
            underline="hover"
            color="inherit"
          >
            Projetos
          </Link>
          <Typography color="text.primary">{project.title}</Typography>
        </Breadcrumbs>

        {/* Project Title Card */}
        <Paper
          sx={{
            p: 3,
            background:
              'linear-gradient(135deg, rgba(33,150,243,0.05) 0%, rgba(156,39,176,0.05) 100%)',
            borderLeft: '4px solid',
            borderLeftColor: 'primary.main',
            mb: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}
              >
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  🎬 {project.title}
                </Typography>
                <Chip
                  label={
                    project.status === 'completed'
                      ? '✅ Concluído'
                      : project.status === 'in_progress'
                        ? '🚧 Em Andamento'
                        : project.status === 'planning'
                          ? '📋 Planejamento'
                          : '⏸️ Pausado'
                  }
                  color={
                    project.status === 'completed'
                      ? 'success'
                      : project.status === 'in_progress'
                        ? 'warning'
                        : project.status === 'planning'
                          ? 'info'
                          : 'default'
                  }
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    px: 2,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: 2,
                    },
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    👤 Responsável
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {responsibleUser?.full_name || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    🏢 Cliente
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {project.client_name || 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    💰 Orçamento
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    color={
                      (project.budget_spent || 0) > (project.budget || 0)
                        ? 'error.main'
                        : 'success.main'
                    }
                  >
                    {formatCurrency(project.budget || 0)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  onClick={() => navigate(`/projects/${projectId}/edit`)}
                  sx={{
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  Editar
                </Button>
              </Box>

              {/* Quick Actions */}
              <ProjectQuickActions
                onGenerateReport={() => setIsReportModalOpen(true)}
                onExportPDF={handleExportReport}
              />
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Informações do Projeto */}
      <Grid container spacing={3}>
        {/* Resumo */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Descrição
            </Typography>
            <Typography color="text.secondary" paragraph>
              {project.description || 'Sem descrição'}
            </Typography>

            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Cliente
                </Typography>
                <Typography variant="body1">
                  {project.client_name || 'Não definido'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Responsável
                </Typography>
                <Typography variant="body1">
                  {responsibleUser?.full_name || 'Não definido'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Email do Cliente
                </Typography>
                <Typography variant="body1">
                  {project.client_email || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Telefone do Cliente
                </Typography>
                <Typography variant="body1">
                  {project.client_phone || '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Data de Início
                </Typography>
                <Typography variant="body1">
                  {formatDateBR(project.start_date)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Prazo Final
                </Typography>
                <Typography variant="body1">
                  {formatDateBR(project.end_date)}
                </Typography>
              </Grid>
              {project.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Notas
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {project.notes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Locações */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <ProjectLocationsOverview
              projectId={project.id}
              projectTitle={project.title}
              onAddLocation={() => setIsLocationSelectionOpen(true)}
              onEditLocation={handleEditLocation}
              onDeleteLocation={locationId =>
                deleteProjectLocationMutation.mutate(locationId)
              }
            />
          </Paper>

          {/* Timeline Hub - Temporarily disabled for debugging */}
          {/* <Box sx={{ mb: 3 }}>
            <ProjectTimelineHub
              projectId={
                typeof project.id === 'number'
                  ? project.id
                  : parseInt(project.id)
              }
            />
          </Box> */}

          {/* Galeria de Fotos - Temporarily disabled for debugging */}
          {/* <Box sx={{ mb: 3 }}>
            <ProjectPhotosGallery
              projectId={
                typeof project.id === 'number'
                  ? project.id
                  : parseInt(project.id)
              }
            />
          </Box> */}

          {/* Locações Visitadas */}
          <Paper sx={{ p: 0, mb: 3 }}>
            <ProjectVisitLocationsPanel
              projectId={
                typeof project.id === 'number'
                  ? project.id
                  : parseInt(project.id)
              }
            />
          </Paper>

          {/* Lista de Demandas */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <ProjectDemandsList
              projectId={
                typeof project.id === 'number'
                  ? project.id
                  : parseInt(project.id)
              }
              projectLocations={projectLocations}
            />
          </Paper>

          {/* Dashboard de Orçamento (Expandido) */}
          <Collapse in={showBudgetDashboard}>
            <Paper sx={{ p: 3 }}>
              <ProjectBudgetDashboard
                projectId={
                  typeof project.id === 'number'
                    ? project.id
                    : parseInt(project.id)
                }
                budget={project.budget || 0}
                budgetSpent={project.budget_spent || 0}
                projectName={project.title}
              />
            </Paper>
          </Collapse>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Orçamento */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography variant="h6">Orçamento</Typography>
              <Button
                size="small"
                startIcon={<AccountBalance />}
                onClick={() => setShowBudgetDashboard(!showBudgetDashboard)}
                endIcon={showBudgetDashboard ? <ExpandLess /> : <ExpandMore />}
              >
                {showBudgetDashboard ? 'Resumo' : 'Ver Detalhes'}
              </Button>
            </Box>
            <Collapse in={!showBudgetDashboard}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Total:</Typography>
                  <Typography variant="h6">
                    {formatCurrency(project.budget || 0)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Utilizado:</Typography>
                  <Typography color="error">
                    {formatCurrency(project.budget_spent || 0)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Restante:</Typography>
                  <Typography color="success.main">
                    {formatCurrency(project.budget_remaining || 0)}
                  </Typography>
                </Box>
              </Box>
            </Collapse>
          </Paper>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {project.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag.name}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </Paper>
          )}

          {/* Ações */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ações
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Description />}
                fullWidth
                onClick={() => {
                  /* Implementar geração de contrato */
                }}
              >
                Gerar Contrato
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                fullWidth
                onClick={() => {
                  /* Implementar exclusão */
                }}
              >
                Excluir Projeto
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Modal de Seleção de Locações */}
      <LocationSelectionModal
        open={isLocationSelectionOpen}
        onClose={() => setIsLocationSelectionOpen(false)}
        onConfirm={handleLocationsSelected}
        availableLocations={
          Array.isArray(availableLocations)
            ? availableLocations
            : (availableLocations as any).locations || []
        }
        projectStartDate={
          project.start_date ? new Date(project.start_date) : undefined
        }
        projectEndDate={
          project.end_date ? new Date(project.end_date) : undefined
        }
      />

      {/* Modal de Edição de Locação */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingLocation(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography variant="h6">Editar Locação</Typography>
              <Typography variant="subtitle1" color="primary" fontWeight="bold">
                {editingLocation?.location?.title || 'Locação'}
              </Typography>
            </Box>
            <IconButton
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingLocation(null);
              }}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {editingLocation && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  📍 {editingLocation.location?.city},{' '}
                  {editingLocation.location?.state}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Data de Início"
                  type="date"
                  value={toInputDate(editingLocation.rental_start)}
                  onChange={e =>
                    setEditingLocation({
                      ...editingLocation,
                      rental_start: new Date(e.target.value),
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Data de Fim"
                  type="date"
                  value={toInputDate(editingLocation.rental_end)}
                  onChange={e =>
                    setEditingLocation({
                      ...editingLocation,
                      rental_end: new Date(e.target.value),
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Taxa Diária (R$)"
                  type="number"
                  value={editingLocation.daily_rate || 0}
                  onChange={e =>
                    setEditingLocation({
                      ...editingLocation,
                      daily_rate: Number(e.target.value),
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Custo Total (R$)"
                  value={(() => {
                    const days = Math.max(
                      1,
                      Math.ceil(
                        (new Date(editingLocation.rental_end).getTime() -
                          new Date(editingLocation.rental_start).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    );
                    return ((editingLocation.daily_rate || 0) * days).toFixed(
                      2
                    );
                  })()}
                  InputProps={{ readOnly: true }}
                  helperText="Calculado automaticamente"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observações"
                  multiline
                  rows={3}
                  value={editingLocation.notes || ''}
                  onChange={e =>
                    setEditingLocation({
                      ...editingLocation,
                      notes: e.target.value,
                    })
                  }
                />
              </Grid>

              {/* Datas de Produção */}
              <Grid item xs={12}>
                <Typography
                  variant="subtitle2"
                  color="primary"
                  fontWeight="bold"
                  sx={{ mt: 2, mb: 1 }}
                >
                  📅 Datas de Produção
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="🟣 Data de Visitação"
                  type="date"
                  value={
                    editingLocation.visit_date
                      ? String(editingLocation.visit_date).split('T')[0]
                      : ''
                  }
                  onChange={e =>
                    setEditingLocation({
                      ...editingLocation,
                      visit_date: e.target.value || undefined,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  helperText="Primeira visita ao local"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="🔵 Visita Técnica"
                  type="date"
                  value={
                    editingLocation.technical_visit_date
                      ? String(editingLocation.technical_visit_date).split(
                          'T'
                        )[0]
                      : ''
                  }
                  onChange={e =>
                    setEditingLocation({
                      ...editingLocation,
                      technical_visit_date: e.target.value || undefined,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  helperText="Avaliação técnica"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="🟢 Início de Gravação"
                  type="date"
                  value={
                    editingLocation.filming_start_date
                      ? String(editingLocation.filming_start_date).split('T')[0]
                      : ''
                  }
                  onChange={e =>
                    setEditingLocation({
                      ...editingLocation,
                      filming_start_date: e.target.value || undefined,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="🟢 Fim de Gravação"
                  type="date"
                  value={
                    editingLocation.filming_end_date
                      ? String(editingLocation.filming_end_date).split('T')[0]
                      : ''
                  }
                  onChange={e =>
                    setEditingLocation({
                      ...editingLocation,
                      filming_end_date: e.target.value || undefined,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="🟠 Entrega da Locação"
                  type="date"
                  value={
                    editingLocation.delivery_date
                      ? String(editingLocation.delivery_date).split('T')[0]
                      : ''
                  }
                  onChange={e =>
                    setEditingLocation({
                      ...editingLocation,
                      delivery_date: e.target.value || undefined,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  helperText="Data de devolução do local"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setIsEditModalOpen(false);
              setEditingLocation(null);
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveLocationEdit}
            variant="contained"
            disabled={updateLocationMutation.isPending}
          >
            {updateLocationMutation.isPending
              ? 'Salvando...'
              : 'Salvar Alterações'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Modal */}
      <ProjectReportModal
        open={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        projectId={Number(projectId)}
        projectName={project?.title}
      />
    </Box>
  );
};

export default ProjectDetailPage;

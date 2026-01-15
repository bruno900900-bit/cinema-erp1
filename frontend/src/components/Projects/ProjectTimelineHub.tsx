/**
 * ProjectTimelineHub - Componente principal da linha do tempo do projeto
 * Exibe etapas com timeline visual, cards de status, e vistas alternativas
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Collapse,
  useTheme,
  alpha,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  CheckCircle,
  Schedule,
  PlayArrow,
  Pause,
  Cancel,
  ExpandMore,
  ExpandLess,
  MoreVert,
  ViewKanban,
  ViewList,
  CalendarMonth,
  Flag,
  Timer,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  projectStageService,
  ProjectStage,
  ProjectStageStatus,
  ProjectStageType,
  STAGE_STATUS_LABELS,
  STAGE_STATUS_COLORS,
  STAGE_TYPE_LABELS,
  ProjectStageCreate,
  ProjectStageUpdate,
  StageTaskCreate,
} from '../../services/projectStageService';
import { userService } from '../../services/userService';

interface ProjectTimelineHubProps {
  projectId: number;
}

type ViewMode = 'timeline' | 'kanban' | 'list';

const ProjectTimelineHub: React.FC<ProjectTimelineHubProps> = ({
  projectId,
}) => {
  const theme = useTheme();
  const queryClient = useQueryClient();

  // States
  const [isExpanded, setIsExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [addStageOpen, setAddStageOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<ProjectStage | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuStage, setMenuStage] = useState<ProjectStage | null>(null);

  // Form states
  const [stageForm, setStageForm] = useState<Partial<ProjectStageCreate>>({
    name: '',
    stage_type: 'custom',
    description: '',
  });
  const [taskForm, setTaskForm] = useState<StageTaskCreate>({
    title: '',
    description: '',
    priority: 'medium',
  });

  // Query
  const {
    data: stages = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['projectStages', projectId],
    queryFn: () => projectStageService.getByProject(projectId),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await userService.getUsers();
      return response.users || [];
    },
  });

  // Mutations
  const initializeStagesMutation = useMutation({
    mutationFn: () => projectStageService.initializeDefaults(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectStages', projectId] });
      toast.success('Etapas padrão criadas!');
    },
    onError: () => toast.error('Erro ao criar etapas'),
  });

  const createStageMutation = useMutation({
    mutationFn: (data: ProjectStageCreate) => projectStageService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectStages', projectId] });
      setAddStageOpen(false);
      setStageForm({ name: '', stage_type: 'custom', description: '' });
      toast.success('Etapa criada!');
    },
    onError: () => toast.error('Erro ao criar etapa'),
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProjectStageUpdate }) =>
      projectStageService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectStages', projectId] });
      toast.success('Etapa atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar etapa'),
  });

  const deleteStageMutation = useMutation({
    mutationFn: (id: number) => projectStageService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectStages', projectId] });
      toast.success('Etapa removida!');
    },
    onError: () => toast.error('Erro ao remover etapa'),
  });

  const createTaskMutation = useMutation({
    mutationFn: ({
      stageId,
      data,
    }: {
      stageId: number;
      data: StageTaskCreate;
    }) => projectStageService.createTask(stageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectStages', projectId] });
      setAddTaskOpen(false);
      setTaskForm({ title: '', description: '', priority: 'medium' });
      toast.success('Tarefa criada!');
    },
    onError: () => toast.error('Erro ao criar tarefa'),
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: number) => projectStageService.completeTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectStages', projectId] });
      toast.success('Tarefa concluída!');
    },
    onError: () => toast.error('Erro ao atualizar tarefa'),
  });

  // Handlers
  const handleStageStatusChange = (
    stage: ProjectStage,
    newStatus: ProjectStageStatus
  ) => {
    updateStageMutation.mutate({ id: stage.id, data: { status: newStatus } });
    setMenuAnchor(null);
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    stage: ProjectStage
  ) => {
    setMenuAnchor(event.currentTarget);
    setMenuStage(stage);
  };

  const handleCreateStage = () => {
    if (!stageForm.name?.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    createStageMutation.mutate({
      project_id: projectId,
      name: stageForm.name!,
      description: stageForm.description,
      stage_type: (stageForm.stage_type as ProjectStageType) || 'custom',
      order_index: stages.length,
    });
  };

  const handleCreateTask = () => {
    if (!taskForm.title.trim() || !selectedStage) {
      toast.error('Título é obrigatório');
      return;
    }
    createTaskMutation.mutate({ stageId: selectedStage.id, data: taskForm });
  };

  // Stats
  const totalStages = stages.length;
  const completedStages = stages.filter(s => s.status === 'completed').length;
  const inProgressStages = stages.filter(
    s => s.status === 'in_progress'
  ).length;
  const progress = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

  // Safe accessor for tasks
  const getStageTasks = (stage: ProjectStage) => stage.tasks || [];

  const getStatusIcon = (status: ProjectStageStatus) => {
    switch (status) {
      case 'completed':
        return (
          <CheckCircle
            fontSize="small"
            sx={{ color: STAGE_STATUS_COLORS.completed }}
          />
        );
      case 'in_progress':
        return (
          <PlayArrow
            fontSize="small"
            sx={{ color: STAGE_STATUS_COLORS.in_progress }}
          />
        );
      case 'on_hold':
        return (
          <Pause fontSize="small" sx={{ color: STAGE_STATUS_COLORS.on_hold }} />
        );
      case 'cancelled':
        return (
          <Cancel
            fontSize="small"
            sx={{ color: STAGE_STATUS_COLORS.cancelled }}
          />
        );
      default:
        return (
          <Schedule
            fontSize="small"
            sx={{ color: STAGE_STATUS_COLORS.pending }}
          />
        );
    }
  };

  return (
    <Paper
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.1
          )} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Flag color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Linha do Tempo
          </Typography>
          <Chip
            size="small"
            label={`${completedStages}/${totalStages} etapas`}
            color={progress === 100 ? 'success' : 'default'}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* View Mode Toggle */}
          <Box
            sx={{
              display: 'flex',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: 1,
            }}
          >
            <Tooltip title="Timeline">
              <IconButton
                size="small"
                onClick={() => setViewMode('timeline')}
                sx={{
                  color:
                    viewMode === 'timeline' ? 'primary.main' : 'text.secondary',
                }}
              >
                <Flag fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Kanban">
              <IconButton
                size="small"
                onClick={() => setViewMode('kanban')}
                sx={{
                  color:
                    viewMode === 'kanban' ? 'primary.main' : 'text.secondary',
                }}
              >
                <ViewKanban fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Lista">
              <IconButton
                size="small"
                onClick={() => setViewMode('list')}
                sx={{
                  color:
                    viewMode === 'list' ? 'primary.main' : 'text.secondary',
                }}
              >
                <ViewList fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Button
            size="small"
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddStageOpen(true)}
          >
            Nova Etapa
          </Button>
          <IconButton onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={isExpanded}>
        {/* Progress Bar */}
        <Box sx={{ px: 2, pt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progresso Geral
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background:
                  progress === 100
                    ? theme.palette.success.main
                    : `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              },
            }}
          />
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ p: 2 }}>
          <Grid item xs={6} sm={3}>
            <Card
              sx={{
                textAlign: 'center',
                bgcolor: alpha(theme.palette.grey[500], 0.1),
                boxShadow: 'none',
              }}
            >
              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color="text.secondary"
                >
                  {stages.filter(s => s.status === 'pending').length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pendentes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card
              sx={{
                textAlign: 'center',
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                boxShadow: 'none',
              }}
            >
              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="h5" fontWeight="bold" color="warning.main">
                  {inProgressStages}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Em Andamento
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card
              sx={{
                textAlign: 'center',
                bgcolor: alpha(theme.palette.success.main, 0.1),
                boxShadow: 'none',
              }}
            >
              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  {completedStages}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Concluídas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card
              sx={{
                textAlign: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                boxShadow: 'none',
              }}
            >
              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  {totalStages}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider />

        {/* Content */}
        {isLoading ? (
          <Box sx={{ p: 3 }}>
            <LinearProgress />
          </Box>
        ) : stages.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Flag sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhuma etapa cadastrada
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
              Crie etapas para acompanhar o progresso do projeto
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => initializeStagesMutation.mutate()}
                disabled={initializeStagesMutation.isPending}
              >
                {initializeStagesMutation.isPending
                  ? 'Criando...'
                  : 'Criar Etapas Padrão'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => setAddStageOpen(true)}
              >
                Etapa Customizada
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            {/* Timeline View */}
            {viewMode === 'timeline' && (
              <Stepper orientation="vertical" activeStep={-1}>
                {stages.map((stage, index) => (
                  <Step
                    key={stage.id}
                    completed={stage.status === 'completed'}
                    active={stage.status === 'in_progress'}
                  >
                    <StepLabel
                      StepIconComponent={() => (
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: alpha(
                              STAGE_STATUS_COLORS[stage.status],
                              0.2
                            ),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          onClick={e => handleMenuOpen(e as any, stage)}
                        >
                          {getStatusIcon(stage.status)}
                        </Box>
                      )}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {stage.name}
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Chip
                              size="small"
                              label={STAGE_STATUS_LABELS[stage.status]}
                              sx={{
                                bgcolor: alpha(
                                  STAGE_STATUS_COLORS[stage.status],
                                  0.1
                                ),
                                color: STAGE_STATUS_COLORS[stage.status],
                              }}
                            />
                            {getStageTasks(stage).length > 0 && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {
                                  getStageTasks(stage).filter(
                                    t => t.status === 'completed'
                                  ).length
                                }
                                /{getStageTasks(stage).length} tarefas
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Adicionar Tarefa">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedStage(stage);
                                setAddTaskOpen(true);
                              }}
                            >
                              <Add fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <IconButton
                            size="small"
                            onClick={e => handleMenuOpen(e, stage)}
                          >
                            <MoreVert fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </StepLabel>
                    <StepContent>
                      {stage.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {stage.description}
                        </Typography>
                      )}
                      {getStageTasks(stage).length > 0 && (
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                          }}
                        >
                          {getStageTasks(stage).map(task => (
                            <Paper
                              key={task.id}
                              variant="outlined"
                              sx={{
                                p: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderLeft: `3px solid ${
                                  STAGE_STATUS_COLORS[task.status]
                                }`,
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    if (task.status !== 'completed') {
                                      completeTaskMutation.mutate(task.id);
                                    }
                                  }}
                                >
                                  {getStatusIcon(task.status)}
                                </IconButton>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    textDecoration:
                                      task.status === 'completed'
                                        ? 'line-through'
                                        : 'none',
                                    color:
                                      task.status === 'completed'
                                        ? 'text.disabled'
                                        : 'text.primary',
                                  }}
                                >
                                  {task.title}
                                </Typography>
                              </Box>
                              {task.assigned_user && (
                                <Chip
                                  size="small"
                                  label={task.assigned_user.full_name}
                                  variant="outlined"
                                />
                              )}
                            </Paper>
                          ))}
                        </Box>
                      )}
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            )}

            {/* Kanban View */}
            {viewMode === 'kanban' && (
              <Grid container spacing={2}>
                {(
                  [
                    'pending',
                    'in_progress',
                    'completed',
                  ] as ProjectStageStatus[]
                ).map(status => (
                  <Grid item xs={12} md={4} key={status}>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: alpha(STAGE_STATUS_COLORS[status], 0.05),
                        border: `1px solid ${alpha(
                          STAGE_STATUS_COLORS[status],
                          0.2
                        )}`,
                        minHeight: 200,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{ mb: 2, color: STAGE_STATUS_COLORS[status] }}
                      >
                        {STAGE_STATUS_LABELS[status]} (
                        {stages.filter(s => s.status === status).length})
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                        }}
                      >
                        {stages
                          .filter(s => s.status === status)
                          .map(stage => (
                            <Paper
                              key={stage.id}
                              sx={{
                                p: 1.5,
                                cursor: 'pointer',
                                '&:hover': { boxShadow: 2 },
                              }}
                              onClick={e => handleMenuOpen(e, stage)}
                            >
                              <Typography variant="subtitle2" fontWeight={500}>
                                {stage.name}
                              </Typography>
                              {getStageTasks(stage).length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={
                                      (getStageTasks(stage).filter(
                                        t => t.status === 'completed'
                                      ).length /
                                        getStageTasks(stage).length) *
                                      100
                                    }
                                    sx={{ height: 4, borderRadius: 2 }}
                                  />
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {
                                      getStageTasks(stage).filter(
                                        t => t.status === 'completed'
                                      ).length
                                    }
                                    /{getStageTasks(stage).length} tarefas
                                  </Typography>
                                </Box>
                              )}
                            </Paper>
                          ))}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {stages.map(stage => (
                  <Paper
                    key={stage.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderLeft: `4px solid ${
                        STAGE_STATUS_COLORS[stage.status]
                      }`,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                      },
                    }}
                    onClick={e => handleMenuOpen(e, stage)}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                      >
                        {getStatusIcon(stage.status)}
                        <Typography variant="subtitle1" fontWeight={500}>
                          {stage.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={STAGE_STATUS_LABELS[stage.status]}
                          sx={{
                            bgcolor: alpha(
                              STAGE_STATUS_COLORS[stage.status],
                              0.1
                            ),
                            color: STAGE_STATUS_COLORS[stage.status],
                          }}
                        />
                      </Box>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                      >
                        {getStageTasks(stage).length > 0 && (
                          <Typography variant="body2" color="text.secondary">
                            {
                              getStageTasks(stage).filter(
                                t => t.status === 'completed'
                              ).length
                            }
                            /{getStageTasks(stage).length} tarefas
                          </Typography>
                        )}
                        <IconButton size="small">
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Collapse>

      {/* Stage Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem disabled sx={{ fontWeight: 600 }}>
          Alterar Status
        </MenuItem>
        <Divider />
        {(
          [
            'pending',
            'in_progress',
            'completed',
            'on_hold',
          ] as ProjectStageStatus[]
        ).map(status => (
          <MenuItem
            key={status}
            onClick={() =>
              menuStage && handleStageStatusChange(menuStage, status)
            }
            selected={menuStage?.status === status}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getStatusIcon(status)}
              {STAGE_STATUS_LABELS[status]}
            </Box>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={() => {
            setSelectedStage(menuStage);
            setAddTaskOpen(true);
            setMenuAnchor(null);
          }}
        >
          <Add fontSize="small" sx={{ mr: 1 }} /> Adicionar Tarefa
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuStage && window.confirm('Excluir esta etapa?')) {
              deleteStageMutation.mutate(menuStage.id);
            }
            setMenuAnchor(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} /> Excluir Etapa
        </MenuItem>
      </Menu>

      {/* Add Stage Dialog */}
      <Dialog
        open={addStageOpen}
        onClose={() => setAddStageOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nova Etapa</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Nome da Etapa"
              value={stageForm.name || ''}
              onChange={e =>
                setStageForm({ ...stageForm, name: e.target.value })
              }
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={stageForm.stage_type || 'custom'}
                label="Tipo"
                onChange={e =>
                  setStageForm({
                    ...stageForm,
                    stage_type: e.target.value as ProjectStageType,
                  })
                }
              >
                {Object.entries(STAGE_TYPE_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Descrição"
              value={stageForm.description || ''}
              onChange={e =>
                setStageForm({ ...stageForm, description: e.target.value })
              }
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddStageOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreateStage}
            disabled={createStageMutation.isPending}
          >
            {createStageMutation.isPending ? 'Criando...' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog
        open={addTaskOpen}
        onClose={() => setAddTaskOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nova Tarefa - {selectedStage?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Título da Tarefa"
              value={taskForm.title}
              onChange={e =>
                setTaskForm({ ...taskForm, title: e.target.value })
              }
              fullWidth
              required
            />
            <TextField
              label="Descrição"
              value={taskForm.description || ''}
              onChange={e =>
                setTaskForm({ ...taskForm, description: e.target.value })
              }
              fullWidth
              multiline
              rows={2}
            />
            <FormControl fullWidth>
              <InputLabel>Prioridade</InputLabel>
              <Select
                value={taskForm.priority || 'medium'}
                label="Prioridade"
                onChange={e =>
                  setTaskForm({ ...taskForm, priority: e.target.value })
                }
              >
                <MenuItem value="low">Baixa</MenuItem>
                <MenuItem value="medium">Média</MenuItem>
                <MenuItem value="high">Alta</MenuItem>
                <MenuItem value="urgent">Urgente</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTaskOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreateTask}
            disabled={createTaskMutation.isPending}
          >
            {createTaskMutation.isPending ? 'Criando...' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ProjectTimelineHub;

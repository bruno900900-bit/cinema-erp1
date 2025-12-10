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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Collapse,
  useTheme,
  alpha,
  Divider,
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
  Assignment,
  Flag,
  AccessTime,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Project, ProjectTask, TaskStatus } from '../../types/user';
import { projectService } from '../../services/projectService';
import { formatDateBR, toInputDate } from '../../utils/date';
import { toast } from 'react-toastify';

interface ProjectWorkflowPanelProps {
  project: Project;
  projectId: string;
}

export default function ProjectWorkflowPanel({
  project,
  projectId,
}: ProjectWorkflowPanelProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [isExpanded, setIsExpanded] = useState(true);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [taskForm, setTaskForm] = useState<Partial<ProjectTask>>({
    title: '',
    description: '',
    status: TaskStatus.NOT_STARTED,
    due_date: new Date().toISOString(),
  });

  const tasks = project.tasks || [];

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: (task: Partial<ProjectTask>) =>
      projectService.createProjectTask(projectId, task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setIsTaskDialogOpen(false);
      resetForm();
      toast.success('Tarefa criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar tarefa'),
  });

  const updateTaskMutation = useMutation({
    mutationFn: (task: ProjectTask) =>
      projectService.updateProjectTask(projectId, task.id, task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setIsTaskDialogOpen(false);
      setSelectedTask(null);
      resetForm();
      toast.success('Tarefa atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar tarefa'),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) =>
      projectService.deleteProjectTask(projectId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Tarefa removida!');
    },
    onError: () => toast.error('Erro ao remover tarefa'),
  });

  const resetForm = () => {
    setTaskForm({
      title: '',
      description: '',
      status: TaskStatus.NOT_STARTED,
      due_date: new Date().toISOString(),
    });
  };

  const handleOpenNewTask = () => {
    setSelectedTask(null);
    resetForm();
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (task: ProjectTask) => {
    setSelectedTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      status: task.status,
      due_date: task.due_date,
    });
    setIsTaskDialogOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleSaveTask = () => {
    if (!taskForm.title?.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    if (selectedTask) {
      updateTaskMutation.mutate({
        ...selectedTask,
        ...taskForm,
      } as ProjectTask);
    } else {
      createTaskMutation.mutate(taskForm);
    }
  };

  const handleQuickStatusChange = (
    task: ProjectTask,
    newStatus: TaskStatus
  ) => {
    updateTaskMutation.mutate({
      ...task,
      status: newStatus,
    });
  };

  // Filtered tasks
  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.status === TaskStatus.COMPLETED;
    if (filter === 'pending') return task.status !== TaskStatus.COMPLETED;
    return true;
  });

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    t => t.status === TaskStatus.COMPLETED
  ).length;
  const inProgressTasks = tasks.filter(
    t => t.status === TaskStatus.IN_PROGRESS
  ).length;
  const pendingTasks = tasks.filter(
    t => t.status === TaskStatus.NOT_STARTED
  ).length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Status helpers
  const getStatusConfig = (status: TaskStatus) => {
    const configs: Record<
      TaskStatus,
      { color: string; icon: React.ReactNode; label: string }
    > = {
      [TaskStatus.NOT_STARTED]: {
        color: theme.palette.grey[500],
        icon: <Schedule fontSize="small" />,
        label: 'Não Iniciada',
      },
      [TaskStatus.IN_PROGRESS]: {
        color: theme.palette.warning.main,
        icon: <PlayArrow fontSize="small" />,
        label: 'Em Andamento',
      },
      [TaskStatus.COMPLETED]: {
        color: theme.palette.success.main,
        icon: <CheckCircle fontSize="small" />,
        label: 'Concluída',
      },
      [TaskStatus.ON_HOLD]: {
        color: theme.palette.info.main,
        icon: <Pause fontSize="small" />,
        label: 'Em Pausa',
      },
      [TaskStatus.CANCELLED]: {
        color: theme.palette.error.main,
        icon: <Cancel fontSize="small" />,
        label: 'Cancelada',
      },
    };
    return configs[status] || configs[TaskStatus.NOT_STARTED];
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
          )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Assignment color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Workflow do Projeto
          </Typography>
          <Chip
            size="small"
            label={`${completedTasks}/${totalTasks} concluídas`}
            color={progress === 100 ? 'success' : 'default'}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenNewTask}
          >
            Nova Tarefa
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
                    : `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
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
                  {pendingTasks}
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
                  {inProgressTasks}
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
                  {completedTasks}
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
                  {totalTasks}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter */}
        <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 1 }}>
          {(['all', 'pending', 'completed'] as const).map(f => (
            <Chip
              key={f}
              label={
                f === 'all'
                  ? 'Todas'
                  : f === 'pending'
                  ? 'Pendentes'
                  : 'Concluídas'
              }
              onClick={() => setFilter(f)}
              color={filter === f ? 'primary' : 'default'}
              variant={filter === f ? 'filled' : 'outlined'}
              size="small"
            />
          ))}
        </Box>

        <Divider />

        {/* Task List */}
        <Box sx={{ p: 2 }}>
          {filteredTasks.length === 0 ? (
            <Box
              sx={{
                py: 4,
                textAlign: 'center',
                bgcolor: alpha(theme.palette.grey[500], 0.05),
                borderRadius: 2,
              }}
            >
              <Assignment
                sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }}
              />
              <Typography color="text.secondary">
                {filter === 'all'
                  ? 'Nenhuma tarefa cadastrada'
                  : `Nenhuma tarefa ${
                      filter === 'pending' ? 'pendente' : 'concluída'
                    }`}
              </Typography>
              {filter === 'all' && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  sx={{ mt: 2 }}
                  onClick={handleOpenNewTask}
                >
                  Adicionar Primeira Tarefa
                </Button>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {filteredTasks.map(task => {
                const statusConfig = getStatusConfig(task.status);
                const isOverdue =
                  task.due_date &&
                  new Date(task.due_date) < new Date() &&
                  task.status !== TaskStatus.COMPLETED;

                return (
                  <Paper
                    key={task.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      borderLeft: `4px solid ${statusConfig.color}`,
                      bgcolor:
                        task.status === TaskStatus.COMPLETED
                          ? alpha(theme.palette.success.main, 0.02)
                          : 'background.paper',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: theme.shadows[2],
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                      },
                    }}
                  >
                    <Box
                      sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}
                    >
                      {/* Quick Status Toggle */}
                      <Tooltip
                        title={
                          task.status === TaskStatus.COMPLETED
                            ? 'Reabrir'
                            : 'Marcar como concluída'
                        }
                      >
                        <IconButton
                          size="small"
                          sx={{ color: statusConfig.color }}
                          onClick={() =>
                            handleQuickStatusChange(
                              task,
                              task.status === TaskStatus.COMPLETED
                                ? TaskStatus.NOT_STARTED
                                : TaskStatus.COMPLETED
                            )
                          }
                        >
                          {statusConfig.icon}
                        </IconButton>
                      </Tooltip>

                      {/* Task Content */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle1"
                          fontWeight={500}
                          sx={{
                            textDecoration:
                              task.status === TaskStatus.COMPLETED
                                ? 'line-through'
                                : 'none',
                            color:
                              task.status === TaskStatus.COMPLETED
                                ? 'text.secondary'
                                : 'text.primary',
                          }}
                        >
                          {task.title}
                        </Typography>
                        {task.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            {task.description}
                          </Typography>
                        )}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            mt: 1,
                          }}
                        >
                          <Chip
                            size="small"
                            label={statusConfig.label}
                            sx={{
                              bgcolor: alpha(statusConfig.color, 0.1),
                              color: statusConfig.color,
                              fontWeight: 500,
                            }}
                          />
                          {task.due_date && (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                color: isOverdue
                                  ? 'error.main'
                                  : 'text.secondary',
                              }}
                            >
                              <AccessTime fontSize="small" />
                              <Typography variant="caption">
                                {formatDateBR(task.due_date)}
                              </Typography>
                              {isOverdue && (
                                <Chip
                                  size="small"
                                  label="Atrasada"
                                  color="error"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          )}
                        </Box>
                      </Box>

                      {/* Actions */}
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleEditTask(task)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Box>
      </Collapse>

      {/* Task Dialog */}
      <Dialog
        open={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          {selectedTask ? 'Editar Tarefa' : 'Nova Tarefa'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Título"
              value={taskForm.title || ''}
              onChange={e =>
                setTaskForm(prev => ({ ...prev, title: e.target.value }))
              }
              fullWidth
              required
              autoFocus
            />
            <TextField
              label="Descrição"
              value={taskForm.description || ''}
              onChange={e =>
                setTaskForm(prev => ({ ...prev, description: e.target.value }))
              }
              fullWidth
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={taskForm.status || TaskStatus.NOT_STARTED}
                onChange={e =>
                  setTaskForm(prev => ({
                    ...prev,
                    status: e.target.value as TaskStatus,
                  }))
                }
                label="Status"
              >
                {Object.values(TaskStatus).map(status => (
                  <MenuItem key={status} value={status}>
                    {getStatusConfig(status).label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Prazo"
              type="date"
              value={toInputDate(taskForm.due_date)}
              onChange={e =>
                setTaskForm(prev => ({
                  ...prev,
                  due_date: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : undefined,
                }))
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsTaskDialogOpen(false)} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleSaveTask}
            variant="contained"
            disabled={
              !taskForm.title?.trim() ||
              createTaskMutation.isPending ||
              updateTaskMutation.isPending
            }
          >
            {createTaskMutation.isPending || updateTaskMutation.isPending
              ? 'Salvando...'
              : selectedTask
              ? 'Salvar'
              : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Close,
  Add,
  Edit,
  Delete,
  CheckCircle,
  Schedule,
  Assignment,
  Person,
  Notes,
  CalendarToday,
  LocationOn,
} from '@mui/icons-material';
import {
  Project,
  ProjectLocation,
  ProjectTask,
  TaskType,
  TaskStatus,
  RentalStatus,
} from '../../types/user';
import { formatDateBR, toInputDate } from '../../utils/date';

interface ProjectWorkflowModalProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  onSaveTasks: (tasks: ProjectTask[]) => Promise<void>;
}

export default function ProjectWorkflowModal({
  open,
  onClose,
  project,
  onSaveTasks,
}: ProjectWorkflowModalProps) {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);

  useEffect(() => {
    if (open && project) {
      const defaultTasks = generateDefaultTasks(project);
      setTasks(defaultTasks);
    } else if (!open) {
      setTasks([]);
    }
  }, [project, open]);

  const toDate = (d: any): Date => {
    if (!d) return new Date();
    if (d instanceof Date) return d;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const generateDefaultTasks = (project: Project): ProjectTask[] => {
    const defaultTasks: ProjectTask[] = [];
    const locs = Array.isArray(project.locations) ? project.locations : [];
    locs.forEach((projectLocation, locationIndex) => {
      const location = projectLocation.location;

      // Tarefas de Preparação
      defaultTasks.push({
        id: `prep_${location.id}_${Date.now()}`,
        title: `Preparar ${location.title}`,
        description: `Verificar disponibilidade e preparar ${location.title} para o projeto`,
        type: TaskType.PREPARATION,
        status: TaskStatus.PENDING,
        due_date: new Date(
          toDate(projectLocation.rental_start).getTime() - 24 * 60 * 60 * 1000
        ),
        notes: `Preparação da locação ${location.title} para o projeto ${project.title}`,
      });

      // Tarefas de Setup
      defaultTasks.push({
        id: `setup_${location.id}_${Date.now()}`,
        title: `Configurar ${location.title}`,
        description: `Realizar setup e configuração inicial de ${location.title}`,
        type: TaskType.SETUP,
        status: TaskStatus.PENDING,
        due_date: toDate(projectLocation.rental_start),
        notes: `Setup da locação ${location.title}`,
      });

      // Tarefas de Monitoramento
      defaultTasks.push({
        id: `monitor_${location.id}_${Date.now()}`,
        title: `Monitorar ${location.title}`,
        description: `Monitorar uso e estado de ${location.title} durante o projeto`,
        type: TaskType.MONITORING,
        status: TaskStatus.PENDING,
        due_date: new Date(
          toDate(projectLocation.rental_start).getTime() + 24 * 60 * 60 * 1000
        ),
        notes: `Monitoramento da locação ${location.title}`,
      });

      // Tarefas de Limpeza
      defaultTasks.push({
        id: `cleanup_${location.id}_${Date.now()}`,
        title: `Limpar ${location.title}`,
        description: `Realizar limpeza e organização de ${location.title} após uso`,
        type: TaskType.CLEANUP,
        status: TaskStatus.PENDING,
        due_date: toDate(projectLocation.rental_end),
        notes: `Limpeza da locação ${location.title}`,
      });

      // Tarefas de Inspeção
      defaultTasks.push({
        id: `inspect_${location.id}_${Date.now()}`,
        title: `Inspecionar ${location.title}`,
        description: `Inspecionar estado de ${location.title} antes da devolução`,
        type: TaskType.INSPECTION,
        status: TaskStatus.PENDING,
        due_date: new Date(
          toDate(projectLocation.rental_end).getTime() + 2 * 60 * 60 * 1000
        ),
        notes: `Inspeção da locação ${location.title}`,
      });

      // Tarefas de Devolução
      defaultTasks.push({
        id: `return_${location.id}_${Date.now()}`,
        title: `Devolver ${location.title}`,
        description: `Finalizar processo e devolver ${location.title} ao proprietário`,
        type: TaskType.RETURN,
        status: TaskStatus.PENDING,
        due_date: new Date(
          toDate(projectLocation.rental_end).getTime() + 4 * 60 * 60 * 1000
        ),
        notes: `Devolução da locação ${location.title}`,
      });
    });

    return defaultTasks;
  };

  const handleAddTask = () => {
    const newTask: ProjectTask = {
      id: `custom_${Date.now()}`,
      title: '',
      description: '',
      type: TaskType.PREPARATION,
      status: TaskStatus.PENDING,
      due_date: new Date(),
      notes: '',
    };
    setEditingTask(newTask);
    setIsAddingTask(true);
  };

  const handleEditTask = (task: ProjectTask) => {
    setEditingTask(task);
    setIsAddingTask(false);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleSaveTask = () => {
    if (!editingTask || !editingTask.title.trim()) return;

    if (isAddingTask) {
      setTasks(prev => [...prev, editingTask]);
    } else {
      setTasks(prev =>
        prev.map(t => (t.id === editingTask.id ? editingTask : t))
      );
    }

    setEditingTask(null);
    setIsAddingTask(false);
  };

  const handleTaskStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            status: newStatus,
            completed_at:
              newStatus === TaskStatus.COMPLETED ? new Date() : undefined,
          };
        }
        return task;
      })
    );
  };

  const handleSaveAll = async () => {
    try {
      setLoading(true);
      await onSaveTasks(tasks);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskTypeLabel = (type: TaskType) => {
    const labels: Record<TaskType, string> = {
      [TaskType.PREPARATION]: 'Preparação',
      [TaskType.SETUP]: 'Setup',
      [TaskType.MONITORING]: 'Monitoramento',
      [TaskType.CLEANUP]: 'Limpeza',
      [TaskType.INSPECTION]: 'Inspeção',
      [TaskType.RETURN]: 'Devolução',
      [TaskType.RESEARCH]: 'Pesquisa',
      [TaskType.PREPRODUCTION]: 'Pré-produção',
      [TaskType.FILMING]: 'Filmagem',
      [TaskType.DEVELOPMENT]: 'Desenvolvimento',
    };
    return labels[type];
  };

  const getTaskTypeColor = (type: TaskType) => {
    const colors: Record<
      TaskType,
      | 'default'
      | 'primary'
      | 'secondary'
      | 'error'
      | 'info'
      | 'success'
      | 'warning'
    > = {
      [TaskType.PREPARATION]: 'info',
      [TaskType.SETUP]: 'warning',
      [TaskType.MONITORING]: 'primary',
      [TaskType.CLEANUP]: 'secondary',
      [TaskType.INSPECTION]: 'success',
      [TaskType.RETURN]: 'error',
      [TaskType.RESEARCH]: 'info',
      [TaskType.PREPRODUCTION]: 'warning',
      [TaskType.FILMING]: 'primary',
      [TaskType.DEVELOPMENT]: 'secondary',
    };
    return colors[type];
  };

  const getStatusColor = (status: TaskStatus) => {
    const colors: Record<
      TaskStatus,
      | 'default'
      | 'primary'
      | 'secondary'
      | 'error'
      | 'info'
      | 'success'
      | 'warning'
    > = {
      [TaskStatus.PENDING]: 'default',
      [TaskStatus.IN_PROGRESS]: 'warning',
      [TaskStatus.COMPLETED]: 'success',
      [TaskStatus.CANCELLED]: 'error',
    };
    return colors[status];
  };

  const getStatusLabel = (status: TaskStatus) => {
    const labels: Record<TaskStatus, string> = {
      [TaskStatus.PENDING]: 'Pendente',
      [TaskStatus.IN_PROGRESS]: 'Em Andamento',
      [TaskStatus.COMPLETED]: 'Concluída',
      [TaskStatus.CANCELLED]: 'Cancelada',
    };
    return labels[status];
  };

  const formatDate = (date: any) => formatDateBR(date);

  const completedTasks = tasks.filter(
    t => t.status === TaskStatus.COMPLETED
  ).length;
  const totalTasks = tasks.length;
  const progressPercentage =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (!project) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
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
            Workflow do Projeto: {project.title}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Resumo do Projeto */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Cliente
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {project.client_name}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Locações
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {Array.isArray(project.locations)
                  ? project.locations.length
                  : 0}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Progresso
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {completedTasks}/{totalTasks} tarefas
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={project.status}
                color="primary"
                size="small"
                variant="outlined"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Barra de Progresso */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Typography variant="subtitle2">Progresso Geral</Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(progressPercentage)}%
            </Typography>
          </Box>
          <Box
            sx={{
              width: '100%',
              bgcolor: 'grey.200',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: `${progressPercentage}%`,
                height: 8,
                bgcolor: 'success.main',
                transition: 'width 0.3s ease',
              }}
            />
          </Box>
        </Box>

        {/* Cabeçalho das Tarefas */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6">
            Tarefas do Projeto ({totalTasks})
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddTask}
            size="small"
          >
            Adicionar Tarefa
          </Button>
        </Box>

        {/* Lista de Tarefas */}
        <Grid container spacing={2}>
          {tasks.map(task => (
            <Grid item xs={12} md={6} key={task.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{ flex: 1 }}
                    >
                      {task.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Chip
                        label={getTaskTypeLabel(task.type)}
                        color={getTaskTypeColor(task.type)}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={getStatusLabel(task.status)}
                        color={getStatusColor(task.status)}
                        size="small"
                      />
                    </Box>
                  </Box>

                  {task.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {task.description}
                    </Typography>
                  )}

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(task.due_date)}
                    </Typography>
                  </Box>

                  {task.notes && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Notes
                        sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2 }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: '0.875rem' }}
                      >
                        {task.notes}
                      </Typography>
                    </Box>
                  )}

                  {task.assigned_to && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {task.assigned_to}
                      </Typography>
                    </Box>
                  )}
                </CardContent>

                <CardActions
                  sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}
                >
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => handleEditTask(task)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={task.status}
                      onChange={e =>
                        handleTaskStatusChange(
                          task.id,
                          e.target.value as TaskStatus
                        )
                      }
                      size="small"
                    >
                      {Object.values(TaskStatus).map(status => (
                        <MenuItem key={status} value={status}>
                          {getStatusLabel(status)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Modal de Edição/Adição de Tarefa */}
        {editingTask && (
          <Dialog
            open={!!editingTask}
            onClose={() => setEditingTask(null)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              {isAddingTask ? 'Adicionar Tarefa' : 'Editar Tarefa'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Título da Tarefa"
                    value={editingTask.title}
                    onChange={e =>
                      setEditingTask(prev =>
                        prev ? { ...prev, title: e.target.value } : null
                      )
                    }
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descrição"
                    value={editingTask.description || ''}
                    onChange={e =>
                      setEditingTask(prev =>
                        prev ? { ...prev, description: e.target.value } : null
                      )
                    }
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Tarefa</InputLabel>
                    <Select
                      value={editingTask.type}
                      onChange={e =>
                        setEditingTask(prev =>
                          prev
                            ? { ...prev, type: e.target.value as TaskType }
                            : null
                        )
                      }
                      label="Tipo de Tarefa"
                    >
                      {Object.values(TaskType).map(type => (
                        <MenuItem key={type} value={type}>
                          {getTaskTypeLabel(type)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Data de Vencimento"
                    type="date"
                    value={toInputDate(editingTask.due_date)}
                    onChange={e =>
                      setEditingTask(prev =>
                        prev
                          ? { ...prev, due_date: new Date(e.target.value) }
                          : null
                      )
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Observações"
                    value={editingTask.notes || ''}
                    onChange={e =>
                      setEditingTask(prev =>
                        prev ? { ...prev, notes: e.target.value } : null
                      )
                    }
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditingTask(null)}>Cancelar</Button>
              <Button onClick={handleSaveTask} variant="contained">
                {isAddingTask ? 'Adicionar' : 'Salvar'}
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSaveAll}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
        >
          {loading ? 'Salvando...' : 'Salvar Workflow'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

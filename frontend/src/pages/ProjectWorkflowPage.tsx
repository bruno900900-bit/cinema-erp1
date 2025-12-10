import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  IconButton,
  Breadcrumbs,
  Link,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack,
  Assignment,
  CheckCircle,
  RadioButtonUnchecked,
  Add,
  Edit,
  Delete,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Project, ProjectTask, TaskStatus } from '@/types/user';
import { projectService } from '@/services/projectService';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import { formatDateBR } from '@/utils/date';

const WorkflowPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [taskForm, setTaskForm] = useState<Partial<ProjectTask>>({
    title: '',
    description: '',
    status: TaskStatus.NOT_STARTED,
    due_date: new Date().toISOString(),
  });

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getProject(projectId!),
    enabled: !!projectId,
  });

  const updateTaskMutation = useMutation({
    mutationFn: (task: ProjectTask) =>
      projectService.updateProjectTask(projectId!, task.id, task),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', projectId]);
      setIsTaskDialogOpen(false);
      setSelectedTask(null);
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (task: Partial<ProjectTask>) =>
      projectService.createProjectTask(projectId!, task),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', projectId]);
      setIsTaskDialogOpen(false);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) =>
      projectService.deleteProjectTask(projectId!, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', projectId]);
    },
  });

  const handleSaveTask = () => {
    if (selectedTask) {
      updateTaskMutation.mutate({
        ...selectedTask,
        ...taskForm,
      } as ProjectTask);
    } else {
      createTaskMutation.mutate(taskForm);
    }
  };

  const handleEditTask = (task: ProjectTask) => {
    setSelectedTask(task);
    setTaskForm(task);
    setIsTaskDialogOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'success.main';
      case TaskStatus.IN_PROGRESS:
        return 'warning.main';
      case TaskStatus.ON_HOLD:
        return 'info.main';
      case TaskStatus.CANCELLED:
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.NOT_STARTED:
        return 'Não Iniciada';
      case TaskStatus.IN_PROGRESS:
        return 'Em Andamento';
      case TaskStatus.COMPLETED:
        return 'Concluída';
      case TaskStatus.ON_HOLD:
        return 'Em Pausa';
      case TaskStatus.CANCELLED:
        return 'Cancelada';
      default:
        return status;
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!project) return <Typography>Projeto não encontrado</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate('/projects')}
        >
          Projetos
        </Link>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate(`/projects/${projectId}`)}
        >
          {project.title}
        </Link>
        <Typography color="text.primary">Workflow</Typography>
      </Breadcrumbs>

      {/* Cabeçalho */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(`/projects/${projectId}`)}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Workflow do Projeto
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setSelectedTask(null);
            setTaskForm({
              title: '',
              description: '',
              status: TaskStatus.NOT_STARTED,
              due_date: new Date().toISOString(),
            });
            setIsTaskDialogOpen(true);
          }}
        >
          Nova Tarefa
        </Button>
      </Box>

      {/* Conteúdo Principal */}
      <Grid container spacing={3}>
        {/* Lista de Tarefas */}
        <Grid item xs={12} md={8}>
          <Paper>
            <List>
              {project.tasks && project.tasks.length > 0 ? (
                project.tasks.map((task, index) => (
                  <React.Fragment key={task.id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      secondaryAction={
                        <Box>
                          <IconButton
                            edge="end"
                            onClick={() => handleEditTask(task)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemIcon>
                        {task.status === TaskStatus.COMPLETED ? (
                          <CheckCircle color="success" />
                        ) : (
                          <RadioButtonUnchecked />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        secondary={
                          <>
                            {task.description}
                            <br />
                            Status: {getStatusLabel(task.status)} | Prazo:{' '}
                            {formatDateBR(task.due_date)}
                          </>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="Nenhuma tarefa cadastrada" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Resumo */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumo do Workflow
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h4" color="primary">
                    {project.tasks?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de Tarefas
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" color="success.main">
                    {project.tasks?.filter(
                      t => t.status === TaskStatus.COMPLETED
                    ).length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Concluídas
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Filtros (implementação futura) */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filtros
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Funcionalidade em desenvolvimento
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog de Tarefa */}
      <Dialog
        open={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedTask ? 'Editar Tarefa' : 'Nova Tarefa'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Título"
              value={taskForm.title}
              onChange={e =>
                setTaskForm(prev => ({ ...prev, title: e.target.value }))
              }
              fullWidth
              required
            />
            <TextField
              label="Descrição"
              value={taskForm.description}
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
                value={taskForm.status}
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
                    {getStatusLabel(status)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Prazo"
              type="date"
              value={taskForm.due_date?.split('T')[0]}
              onChange={e =>
                setTaskForm(prev => ({
                  ...prev,
                  due_date: new Date(e.target.value).toISOString(),
                }))
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTaskDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleSaveTask}
            variant="contained"
            disabled={!taskForm.title}
          >
            {selectedTask ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowPage;

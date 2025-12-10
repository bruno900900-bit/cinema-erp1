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
  Switch,
  FormControlLabel,
  Autocomplete,
  Slider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon,
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
  Timeline,
  Flag,
  Warning,
  PlayArrow,
  Pause,
  Save,
  Refresh,
} from '@mui/icons-material';
import {
  ProjectLocation,
  ProjectLocationStage,
  StageStatus,
  LocationStageType,
  User,
} from '../../types/user';
import { formatDateBR, toInputDate } from '../../utils/date';

interface ProjectLocationStagesManagerProps {
  open: boolean;
  onClose: () => void;
  projectLocation: ProjectLocation | null;
  users: User[];
  onSaveStages: (stages: ProjectLocationStage[]) => Promise<void>;
  onCreateDefaultStages: () => Promise<void>;
}

const stageTypeOptions = [
  { value: LocationStageType.PROSPECCAO, label: 'Prospecção' },
  { value: LocationStageType.VISITACAO, label: 'Visitação' },
  { value: LocationStageType.AVALIACAO_TECNICA, label: 'Avaliação Técnica' },
  { value: LocationStageType.APROVACAO_CLIENTE, label: 'Aprovação Cliente' },
  { value: LocationStageType.NEGOCIACAO, label: 'Negociação' },
  { value: LocationStageType.CONTRATACAO, label: 'Contratação' },
  { value: LocationStageType.PREPARACAO, label: 'Preparação' },
  { value: LocationStageType.SETUP, label: 'Setup' },
  { value: LocationStageType.GRAVACAO, label: 'Gravação' },
  { value: LocationStageType.DESMONTAGEM, label: 'Desmontagem' },
  { value: LocationStageType.ENTREGA, label: 'Entrega' },
];

const statusOptions = [
  { value: StageStatus.PENDING, label: 'Pendente' },
  { value: StageStatus.IN_PROGRESS, label: 'Em Andamento' },
  { value: StageStatus.COMPLETED, label: 'Concluída' },
  { value: StageStatus.ON_HOLD, label: 'Em Espera' },
  { value: StageStatus.CANCELLED, label: 'Cancelada' },
];

export default function ProjectLocationStagesManager({
  open,
  onClose,
  projectLocation,
  users,
  onSaveStages,
  onCreateDefaultStages,
}: ProjectLocationStagesManagerProps) {
  const [stages, setStages] = useState<ProjectLocationStage[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingStage, setEditingStage] = useState<ProjectLocationStage | null>(
    null
  );
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (open && projectLocation) {
      setStages(projectLocation.stages || []);
      setEditingStage(null);
      setIsAddingStage(false);
      setActiveStep(0);
    } else if (!open) {
      setStages([]);
    }
  }, [projectLocation, open]);

  const handleSaveStages = async () => {
    setLoading(true);
    try {
      await onSaveStages(stages);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar etapas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDefaultStages = async () => {
    setLoading(true);
    try {
      await onCreateDefaultStages();
      // Recarregar as etapas após criação
      if (projectLocation) {
        setStages(projectLocation.stages || []);
      }
    } catch (error) {
      console.error('Erro ao criar etapas padrão:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStage = () => {
    const newStage: ProjectLocationStage = {
      id: Date.now(), // ID temporário
      project_location_id:
        typeof projectLocation?.id === 'string'
          ? parseInt(projectLocation.id)
          : projectLocation?.id || 0,
      stage_type: LocationStageType.VISITACAO,
      title: '',
      description: '',
      status: StageStatus.PENDING,
      completion_percentage: 0,
      weight: 1.0,
      is_milestone: false,
      is_critical: false,
      is_overdue: false,
      is_delayed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStages([...stages, newStage]);
    setEditingStage(newStage);
    setIsAddingStage(true);
  };

  const handleEditStage = (stage: ProjectLocationStage) => {
    setEditingStage(stage);
    setIsAddingStage(false);
  };

  const handleDeleteStage = (stageId: number) => {
    setStages(stages.filter(s => s.id !== stageId));
  };

  const handleUpdateStage = (
    stageId: number,
    updates: Partial<ProjectLocationStage>
  ) => {
    setStages(
      stages.map(stage =>
        stage.id === stageId
          ? { ...stage, ...updates, updated_at: new Date().toISOString() }
          : stage
      )
    );
  };

  const handleCancelEdit = () => {
    setEditingStage(null);
    setIsAddingStage(false);
  };

  const getStatusColor = (status: StageStatus): string => {
    switch (status) {
      case StageStatus.COMPLETED:
        return '#4caf50';
      case StageStatus.IN_PROGRESS:
        return '#2196f3';
      case StageStatus.ON_HOLD:
        return '#ff9800';
      case StageStatus.CANCELLED:
        return '#f44336';
      case StageStatus.PENDING:
      default:
        return '#9e9e9e';
    }
  };

  const getStageTypeLabel = (type: LocationStageType): string => {
    const option = stageTypeOptions.find(opt => opt.value === type);
    return option?.label || type;
  };

  const getStatusLabel = (status: StageStatus): string => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.label || status;
  };

  const completedStages = stages.filter(
    s => s.status === StageStatus.COMPLETED
  ).length;
  const totalStages = stages.length;
  const progressPercentage =
    totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6">Gerenciar Etapas da Locação</Typography>
            {projectLocation && (
              <Typography variant="body2" color="text.secondary">
                {projectLocation.location.title}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {!projectLocation ? (
          <Alert severity="warning">Nenhuma locação selecionada</Alert>
        ) : (
          <Box>
            {/* Resumo do Progresso */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={2}
                >
                  <Typography variant="h6">Progresso Geral</Typography>
                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={handleCreateDefaultStages}
                      disabled={loading}
                      size="small"
                    >
                      Criar Etapas Padrão
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleAddStage}
                      size="small"
                    >
                      Nova Etapa
                    </Button>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Box flex={1}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      {completedStages}/{totalStages} etapas concluídas
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box flex={1}>
                        <Box
                          sx={{
                            height: 20,
                            backgroundColor: '#e0e0e0',
                            borderRadius: 10,
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              height: '100%',
                              width: `${progressPercentage}%`,
                              backgroundColor: '#4caf50',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2" fontWeight="medium">
                        {Math.round(progressPercentage)}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {stages.filter(s => s.is_milestone).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Marcos
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main">
                        {stages.filter(s => s.is_critical).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Críticas
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="error.main">
                        {stages.filter(s => s.is_overdue).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Atrasadas
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {completedStages}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Concluídas
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Lista de Etapas */}
            <Typography variant="h6" gutterBottom>
              Etapas ({stages.length})
            </Typography>

            {stages.length === 0 ? (
              <Alert severity="info">
                Nenhuma etapa criada ainda. Clique em "Criar Etapas Padrão" para
                começar.
              </Alert>
            ) : (
              <List>
                {stages.map((stage, index) => (
                  <ListItem
                    key={stage.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      backgroundColor:
                        editingStage?.id === stage.id
                          ? 'action.hover'
                          : 'background.paper',
                    }}
                  >
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: getStatusColor(stage.status),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      >
                        {index + 1}
                      </Box>
                    </ListItemIcon>

                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {stage.title || 'Etapa sem título'}
                          </Typography>
                          {stage.is_milestone && (
                            <Chip
                              icon={<Flag />}
                              label="Marco"
                              size="small"
                              color="primary"
                            />
                          )}
                          {stage.is_critical && (
                            <Chip
                              label="Crítica"
                              size="small"
                              color="warning"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {getStageTypeLabel(stage.stage_type)} •{' '}
                            {getStatusLabel(stage.status)}
                          </Typography>
                          {stage.responsible_user && (
                            <Typography variant="body2" color="text.secondary">
                              Responsável: {stage.responsible_user.full_name}
                            </Typography>
                          )}
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={2}
                            mt={1}
                          >
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2">
                                Progresso:
                              </Typography>
                              <Box
                                sx={{
                                  width: 100,
                                  height: 6,
                                  backgroundColor: '#e0e0e0',
                                  borderRadius: 3,
                                  overflow: 'hidden',
                                }}
                              >
                                <Box
                                  sx={{
                                    width: `${stage.completion_percentage}%`,
                                    height: '100%',
                                    backgroundColor: getStatusColor(
                                      stage.status
                                    ),
                                    transition: 'width 0.3s ease',
                                  }}
                                />
                              </Box>
                              <Typography variant="body2">
                                {stage.completion_percentage}%
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      }
                    />

                    <ListItemSecondaryAction>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleEditStage(stage)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteStage(stage.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}

            {/* Formulário de Edição */}
            {editingStage && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {isAddingStage ? 'Nova Etapa' : 'Editar Etapa'}
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Título da Etapa"
                        value={editingStage.title}
                        onChange={e =>
                          handleUpdateStage(editingStage.id, {
                            title: e.target.value,
                          })
                        }
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Tipo de Etapa</InputLabel>
                        <Select
                          value={editingStage.stage_type}
                          onChange={e =>
                            handleUpdateStage(editingStage.id, {
                              stage_type: e.target.value as LocationStageType,
                            })
                          }
                        >
                          {stageTypeOptions.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Descrição"
                        multiline
                        rows={3}
                        value={editingStage.description || ''}
                        onChange={e =>
                          handleUpdateStage(editingStage.id, {
                            description: e.target.value,
                          })
                        }
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={editingStage.status}
                          onChange={e =>
                            handleUpdateStage(editingStage.id, {
                              status: e.target.value as StageStatus,
                            })
                          }
                        >
                          {statusOptions.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Responsável</InputLabel>
                        <Select
                          value={editingStage.responsible_user_id || ''}
                          onChange={e =>
                            handleUpdateStage(editingStage.id, {
                              responsible_user_id: e.target.value || null,
                            })
                          }
                        >
                          <MenuItem value="">Nenhum</MenuItem>
                          {users.map(user => (
                            <MenuItem key={user.id} value={user.id}>
                              {user.full_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box>
                        <Typography gutterBottom>
                          Progresso: {editingStage.completion_percentage}%
                        </Typography>
                        <Slider
                          value={editingStage.completion_percentage}
                          onChange={(_, value) =>
                            handleUpdateStage(editingStage.id, {
                              completion_percentage: value as number,
                            })
                          }
                          min={0}
                          max={100}
                          step={5}
                          marks={[
                            { value: 0, label: '0%' },
                            { value: 50, label: '50%' },
                            { value: 100, label: '100%' },
                          ]}
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Peso (para cálculo de progresso)"
                        type="number"
                        value={editingStage.weight}
                        onChange={e =>
                          handleUpdateStage(editingStage.id, {
                            weight: parseFloat(e.target.value),
                          })
                        }
                        inputProps={{ min: 0, max: 10, step: 0.1 }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Data de Término Planejada"
                        type="date"
                        value={
                          editingStage.planned_end_date
                            ? toInputDate(editingStage.planned_end_date)
                            : ''
                        }
                        onChange={e =>
                          handleUpdateStage(editingStage.id, {
                            planned_end_date: e.target.value
                              ? new Date(e.target.value)
                              : null,
                          })
                        }
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Box display="flex" gap={2}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={editingStage.is_milestone}
                              onChange={e =>
                                handleUpdateStage(editingStage.id, {
                                  is_milestone: e.target.checked,
                                })
                              }
                            />
                          }
                          label="É um Marco"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={editingStage.is_critical}
                              onChange={e =>
                                handleUpdateStage(editingStage.id, {
                                  is_critical: e.target.checked,
                                })
                              }
                            />
                          }
                          label="É Crítica"
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Observações"
                        multiline
                        rows={2}
                        value={editingStage.notes || ''}
                        onChange={e =>
                          handleUpdateStage(editingStage.id, {
                            notes: e.target.value,
                          })
                        }
                      />
                    </Grid>
                  </Grid>
                </CardContent>

                <CardActions>
                  <Button onClick={handleCancelEdit}>Cancelar</Button>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={() => {
                      setEditingStage(null);
                      setIsAddingStage(false);
                    }}
                  >
                    Salvar
                  </Button>
                </CardActions>
              </Card>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSaveStages}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
        >
          Salvar Todas as Etapas
        </Button>
      </DialogActions>
    </Dialog>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Timeline,
  Flag,
  Warning,
  CheckCircle,
  Schedule,
  PlayArrow,
  Pause,
  Error,
  Person,
  CalendarToday,
  LocationOn,
  Assignment,
} from '@mui/icons-material';
import {
  ProjectLocation,
  ProjectLocationStage,
  StageStatus,
  LocationStageType,
  User,
} from '../../types/user';
import { projectLocationStageService } from '../../services/projectLocationStageService';
import { formatDateBR } from '../../utils/date';

interface ProjectStagesCalendarProps {
  projectId: number;
  startDate: Date;
  endDate: Date;
  onStageClick?: (stage: ProjectLocationStage) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  stage: ProjectLocationStage;
  projectLocation: ProjectLocation;
  color: string;
  type: 'milestone' | 'stage' | 'deadline';
}

export default function ProjectStagesCalendar({
  projectId,
  startDate,
  endDate,
  onStageClick,
}: ProjectStagesCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] =
    useState<ProjectLocationStage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadProjectStages();
  }, [projectId, startDate, endDate]);

  const loadProjectStages = async () => {
    setLoading(true);
    setError(null);
    try {
      // Garantir que startDate e endDate são objetos Date válidos
      const validStartDate =
        startDate instanceof Date ? startDate : new Date(startDate);
      const validEndDate =
        endDate instanceof Date ? endDate : new Date(endDate);

      const stages = await projectLocationStageService.getStages({
        project_id: projectId,
        date_from: validStartDate.toISOString().split('T')[0],
        date_to: validEndDate.toISOString().split('T')[0],
      });

      if (!Array.isArray(stages) || stages.length === 0) {
        setEvents([]);
        return;
      }
      const calendarEvents: CalendarEvent[] = [];

      stages.forEach(stage => {
        // Evento para início da etapa
        if (stage.planned_start_date) {
          const startDate = new Date(stage.planned_start_date);
          const endDate = stage.planned_end_date
            ? new Date(stage.planned_end_date)
            : new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // 1 dia se não houver data de fim

          calendarEvents.push({
            id: `stage-${stage.id}-start`,
            title: `${stage.title} (Início)`,
            start: startDate,
            end: endDate,
            stage,
            projectLocation: stage.project_location as any,
            color: getStageColor(stage),
            type: stage.is_milestone ? 'milestone' : 'stage',
          });
        }

        // Evento para prazo da etapa
        if (stage.planned_end_date) {
          const deadlineDate = new Date(stage.planned_end_date);
          calendarEvents.push({
            id: `stage-${stage.id}-deadline`,
            title: `${stage.title} (Prazo)`,
            start: deadlineDate,
            end: deadlineDate,
            stage,
            projectLocation: stage.project_location as any,
            color: stage.is_overdue ? '#f44336' : '#ff9800',
            type: 'deadline',
          });
        }
      });

      setEvents(calendarEvents);
    } catch (err) {
      setError('Erro ao carregar etapas do projeto');
      console.error('Erro ao carregar etapas:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: ProjectLocationStage): string => {
    if (stage.status === StageStatus.COMPLETED) return '#4caf50';
    if (stage.status === StageStatus.IN_PROGRESS) return '#2196f3';
    if (stage.is_overdue) return '#f44336';
    if (stage.is_critical) return '#ff9800';
    return '#9e9e9e';
  };

  const getStageIcon = (stage: ProjectLocationStage) => {
    if (stage.is_milestone) return <Flag />;
    if (stage.is_overdue) return <Warning />;
    if (stage.status === StageStatus.COMPLETED) return <CheckCircle />;
    if (stage.status === StageStatus.IN_PROGRESS) return <PlayArrow />;
    if (stage.status === StageStatus.ON_HOLD) return <Pause />;
    if (stage.status === StageStatus.CANCELLED) return <Error />;
    return <Schedule />;
  };

  const getStatusLabel = (status: StageStatus): string => {
    const labels: Record<StageStatus, string> = {
      [StageStatus.PENDING]: 'Pendente',
      [StageStatus.IN_PROGRESS]: 'Em Andamento',
      [StageStatus.COMPLETED]: 'Concluída',
      [StageStatus.CANCELLED]: 'Cancelada',
      [StageStatus.ON_HOLD]: 'Em Espera',
    };
    return labels[status] || status;
  };

  const getStageTypeLabel = (type: LocationStageType): string => {
    return projectLocationStageService.getStageTypeLabel(type);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedStage(event.stage);
    setDialogOpen(true);
    if (onStageClick) {
      onStageClick(event.stage);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedStage(null);
  };

  // Agrupar eventos por data
  const eventsByDate = events.reduce((acc, event) => {
    const eventStart =
      event.start instanceof Date ? event.start : new Date(event.start);
    const dateKey = eventStart.toISOString().split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  // Ordenar datas
  const sortedDates = Object.keys(eventsByDate).sort();

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography>Carregando etapas do projeto...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
            Etapas do Projeto
          </Typography>

          {events.length === 0 ? (
            <Typography color="text.secondary">
              Nenhuma etapa encontrada para este período.
            </Typography>
          ) : (
            <Box>
              {/* Resumo */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="primary">
                      {events.filter(e => e.type === 'milestone').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Marcos
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="warning.main">
                      {events.filter(e => e.stage.is_critical).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Críticas
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="error.main">
                      {events.filter(e => e.stage.is_overdue).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Atrasadas
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="success.main">
                      {
                        events.filter(
                          e => e.stage.status === StageStatus.COMPLETED
                        ).length
                      }
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Concluídas
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Lista de eventos por data */}
              {sortedDates.map(date => (
                <Box key={date} sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {formatDateBR(new Date(date))}
                  </Typography>

                  {eventsByDate[date].map(event => (
                    <Card
                      key={event.id}
                      variant="outlined"
                      sx={{
                        mb: 1,
                        cursor: 'pointer',
                        borderLeft: `4px solid ${event.color}`,
                        '&:hover': {
                          boxShadow: 2,
                        },
                      }}
                      onClick={() => handleEventClick(event)}
                    >
                      <CardContent sx={{ py: 1.5 }}>
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            flex={1}
                          >
                            {getStageIcon(event.stage)}
                            <Box>
                              <Typography
                                variant="subtitle2"
                                fontWeight="medium"
                              >
                                {event.title}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {event.projectLocation?.location?.title ||
                                  'Locação não encontrada'}
                              </Typography>
                            </Box>
                          </Box>

                          <Box display="flex" alignItems="center" gap={1}>
                            {event.stage.is_milestone && (
                              <Chip
                                icon={<Flag />}
                                label="Marco"
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                            {event.stage.is_critical && (
                              <Chip
                                label="Crítica"
                                size="small"
                                color="warning"
                              />
                            )}
                            <Chip
                              label={getStatusLabel(event.stage.status)}
                              size="small"
                              sx={{
                                backgroundColor: getStageColor(event.stage),
                                color: 'white',
                              }}
                            />
                          </Box>
                        </Box>

                        <Box sx={{ mt: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={event.stage.completion_percentage}
                            sx={{ height: 4, borderRadius: 2 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {event.stage.completion_percentage}% concluída
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalhes da etapa */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedStage && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                {getStageIcon(selectedStage)}
                <Typography variant="h6">{selectedStage.title}</Typography>
                {selectedStage.is_milestone && (
                  <Chip
                    icon={<Flag />}
                    label="Marco"
                    size="small"
                    color="primary"
                  />
                )}
                {selectedStage.is_critical && (
                  <Chip label="Crítica" size="small" color="warning" />
                )}
              </Box>
            </DialogTitle>

            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Tipo de Etapa
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {getStageTypeLabel(selectedStage.stage_type)}
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>
                    Status
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {getStatusLabel(selectedStage.status)}
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>
                    Progresso
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box flex={1}>
                      <LinearProgress
                        variant="determinate"
                        value={selectedStage.completion_percentage}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Typography variant="body2">
                      {selectedStage.completion_percentage}%
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  {selectedStage.planned_start_date && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Data de Início Planejada
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        {formatDateBR(selectedStage.planned_start_date)}
                      </Typography>
                    </>
                  )}

                  {selectedStage.planned_end_date && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Data de Término Planejada
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        {formatDateBR(selectedStage.planned_end_date)}
                      </Typography>
                    </>
                  )}

                  {selectedStage.responsible_user && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Responsável
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Person sx={{ fontSize: 16 }} />
                        <Typography variant="body2" color="text.secondary">
                          {selectedStage.responsible_user.full_name}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Grid>

                {selectedStage.description && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Descrição
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedStage.description}
                    </Typography>
                  </Grid>
                )}

                {selectedStage.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Observações
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedStage.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>

            <DialogActions>
              <Button onClick={handleCloseDialog}>Fechar</Button>
              <Button
                variant="contained"
                onClick={() => {
                  // Aqui você pode adicionar lógica para editar a etapa
                  handleCloseDialog();
                }}
              >
                Editar Etapa
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

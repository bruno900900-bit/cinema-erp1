import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Grid,
  Avatar,
  Divider,
  Alert,
  Badge,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Schedule,
  Warning,
  Error,
  Pause,
  PlayArrow,
  Person,
  Assignment,
  CalendarToday,
  Flag,
  Timeline,
} from '@mui/icons-material';
import {
  ProjectLocation,
  ProjectLocationStage,
  StageStatus,
  LocationStageType,
  User,
} from '../../types/user';
import { formatDateBR } from '../../utils/date';

interface LocationStagesProgressProps {
  projectLocation: ProjectLocation;
  onStageUpdate?: (
    stageId: number,
    updates: Partial<ProjectLocationStage>
  ) => void;
  compact?: boolean;
}

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

const getStatusIcon = (status: StageStatus) => {
  switch (status) {
    case StageStatus.COMPLETED:
      return <CheckCircle sx={{ color: getStatusColor(status) }} />;
    case StageStatus.IN_PROGRESS:
      return <PlayArrow sx={{ color: getStatusColor(status) }} />;
    case StageStatus.ON_HOLD:
      return <Pause sx={{ color: getStatusColor(status) }} />;
    case StageStatus.CANCELLED:
      return <Error sx={{ color: getStatusColor(status) }} />;
    case StageStatus.PENDING:
    default:
      return <Schedule sx={{ color: getStatusColor(status) }} />;
  }
};

const getStageTypeLabel = (type: LocationStageType): string => {
  const labels: Record<LocationStageType, string> = {
    [LocationStageType.PROSPECCAO]: 'Prospecção',
    [LocationStageType.VISITACAO]: 'Visitação',
    [LocationStageType.AVALIACAO_TECNICA]: 'Avaliação Técnica',
    [LocationStageType.APROVACAO_CLIENTE]: 'Aprovação Cliente',
    [LocationStageType.NEGOCIACAO]: 'Negociação',
    [LocationStageType.CONTRATACAO]: 'Contratação',
    [LocationStageType.PREPARACAO]: 'Preparação',
    [LocationStageType.SETUP]: 'Setup',
    [LocationStageType.GRAVACAO]: 'Gravação',
    [LocationStageType.DESMONTAGEM]: 'Desmontagem',
    [LocationStageType.ENTREGA]: 'Entrega',
  };
  return labels[type] || type;
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

export default function LocationStagesProgress({
  projectLocation,
  onStageUpdate,
  compact = false,
}: LocationStagesProgressProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  const stages = projectLocation.stages || [];
  const completedStages = stages.filter(
    s => s.status === StageStatus.COMPLETED
  ).length;
  const totalStages = stages.length;
  const progressPercentage =
    totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

  const criticalStages = stages.filter(s => s.is_critical);
  const overdueStages = stages.filter(s => s.is_overdue);
  const milestones = stages.filter(s => s.is_milestone);

  const handleStageClick = (stage: ProjectLocationStage) => {
    if (selectedStage === stage.id) {
      setSelectedStage(null);
    } else {
      setSelectedStage(stage.id);
    }
  };

  const handleStageStatusUpdate = (stageId: number, newStatus: StageStatus) => {
    if (onStageUpdate) {
      onStageUpdate(stageId, { status: newStatus });
    }
  };

  if (compact) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6" gutterBottom>
                {projectLocation.location.title}
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <LinearProgress
                  variant="determinate"
                  value={progressPercentage}
                  sx={{ width: 200, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {Math.round(progressPercentage)}%
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={1}>
              {overdueStages.length > 0 && (
                <Chip
                  icon={<Warning />}
                  label={`${overdueStages.length} atrasadas`}
                  color="error"
                  size="small"
                />
              )}
              {criticalStages.length > 0 && (
                <Chip
                  icon={<Flag />}
                  label={`${criticalStages.length} críticas`}
                  color="warning"
                  size="small"
                />
              )}
              <IconButton onClick={() => setExpanded(!expanded)} size="small">
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {/* Cabeçalho */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Box>
            <Typography variant="h6" gutterBottom>
              <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
              Progresso da Locação: {projectLocation.location.title}
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <LinearProgress
                variant="determinate"
                value={progressPercentage}
                sx={{ width: 300, height: 10, borderRadius: 5 }}
              />
              <Typography variant="body2" color="text.secondary">
                {completedStages}/{totalStages} etapas concluídas (
                {Math.round(progressPercentage)}%)
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setExpanded(!expanded)} size="small">
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        {/* Alertas */}
        {(overdueStages.length > 0 || criticalStages.length > 0) && (
          <Box mb={2}>
            {overdueStages.length > 0 && (
              <Alert severity="error" sx={{ mb: 1 }}>
                <strong>{overdueStages.length}</strong> etapa(s) atrasada(s)
              </Alert>
            )}
            {criticalStages.length > 0 && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                <strong>{criticalStages.length}</strong> etapa(s) crítica(s)
                pendente(s)
              </Alert>
            )}
          </Box>
        )}

        {/* Lista de Etapas */}
        <Collapse in={expanded}>
          <Grid container spacing={2}>
            {stages.map(stage => (
              <Grid item xs={12} md={6} key={stage.id}>
                <Card
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    border: stage.is_critical
                      ? '2px solid #ff9800'
                      : '1px solid',
                    borderColor: stage.is_overdue ? 'error.main' : 'divider',
                    '&:hover': {
                      boxShadow: 2,
                    },
                  }}
                  onClick={() => handleStageClick(stage)}
                >
                  <CardContent sx={{ py: 2 }}>
                    <Box
                      display="flex"
                      alignItems="flex-start"
                      justifyContent="space-between"
                    >
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          {getStatusIcon(stage.status)}
                          <Typography variant="subtitle1" fontWeight="medium">
                            {stage.title}
                          </Typography>
                          {stage.is_milestone && (
                            <Chip
                              icon={<Flag />}
                              label="Marco"
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                          {stage.is_critical && (
                            <Chip
                              label="Crítica"
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          mb={1}
                        >
                          {getStageTypeLabel(stage.stage_type)}
                        </Typography>

                        <Box display="flex" alignItems="center" gap={2} mb={1}>
                          <Chip
                            label={getStatusLabel(stage.status)}
                            size="small"
                            sx={{
                              backgroundColor: getStatusColor(stage.status),
                              color: 'white',
                            }}
                          />
                          <Typography variant="body2">
                            {stage.completion_percentage}% concluída
                          </Typography>
                        </Box>

                        {stage.planned_end_date && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <CalendarToday
                              sx={{ fontSize: 16, color: 'text.secondary' }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              Prazo: {formatDateBR(stage.planned_end_date)}
                            </Typography>
                          </Box>
                        )}

                        {stage.responsible_user && (
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            mt={1}
                          >
                            <Person
                              sx={{ fontSize: 16, color: 'text.secondary' }}
                            />
                            <Avatar
                              src={stage.responsible_user.avatar_url}
                              sx={{ width: 20, height: 20 }}
                            >
                              {stage.responsible_user.full_name.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" color="text.secondary">
                              {stage.responsible_user.full_name}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        gap={1}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={stage.completion_percentage}
                          sx={{ width: 60, height: 6, borderRadius: 3 }}
                        />
                        {stage.is_overdue && (
                          <Badge color="error" variant="dot">
                            <Warning sx={{ color: 'error.main' }} />
                          </Badge>
                        )}
                      </Box>
                    </Box>

                    {/* Detalhes expandidos */}
                    {selectedStage === stage.id && (
                      <Box
                        mt={2}
                        pt={2}
                        borderTop="1px solid"
                        borderColor="divider"
                      >
                        {stage.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            mb={2}
                          >
                            {stage.description}
                          </Typography>
                        )}

                        {stage.notes && (
                          <Box mb={2}>
                            <Typography
                              variant="body2"
                              fontWeight="medium"
                              mb={1}
                            >
                              Observações:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {stage.notes}
                            </Typography>
                          </Box>
                        )}

                        <Box display="flex" gap={1} flexWrap="wrap">
                          {stage.status !== StageStatus.COMPLETED && (
                            <Chip
                              label="Marcar como Concluída"
                              size="small"
                              onClick={e => {
                                e.stopPropagation();
                                handleStageStatusUpdate(
                                  stage.id,
                                  StageStatus.COMPLETED
                                );
                              }}
                              color="success"
                              variant="outlined"
                            />
                          )}
                          {stage.status === StageStatus.PENDING && (
                            <Chip
                              label="Iniciar"
                              size="small"
                              onClick={e => {
                                e.stopPropagation();
                                handleStageStatusUpdate(
                                  stage.id,
                                  StageStatus.IN_PROGRESS
                                );
                              }}
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Collapse>

        {/* Resumo dos Marcos */}
        {milestones.length > 0 && (
          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom>
              Marcos Importantes:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {milestones.map(milestone => (
                <Chip
                  key={milestone.id}
                  icon={getStatusIcon(milestone.status)}
                  label={milestone.title}
                  size="small"
                  color={
                    milestone.status === StageStatus.COMPLETED
                      ? 'success'
                      : 'default'
                  }
                  variant={
                    milestone.status === StageStatus.COMPLETED
                      ? 'filled'
                      : 'outlined'
                  }
                />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

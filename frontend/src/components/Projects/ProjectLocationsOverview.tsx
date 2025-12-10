import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Grid,
  Avatar,
  AvatarGroup,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Paper,
  Badge,
} from '@mui/material';
import {
  Add,
  LocationOn,
  Person,
  CalendarToday,
  CheckCircle,
  Schedule,
  PlayArrow,
  Pause,
  Error,
  Warning,
  Flag,
  ExpandMore,
  ExpandLess,
  Edit,
  Visibility,
  Search,
  Delete,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Project,
  ProjectLocation,
  StageStatus,
  LocationStageType,
  User,
} from '../../types/user';
import { projectLocationService } from '../../services/projectLocationService';
import { projectLocationStageService } from '../../services/projectLocationStageService';
import { userService } from '../../services/userService';
import { formatDateBR } from '../../utils/date';
import LocationStageTimeline from './LocationStageTimeline';
import { useAuth } from '../../hooks/useAuth';

interface ProjectLocationsOverviewProps {
  projectId: number | string;
  projectTitle: string;
  onAddLocation?: () => void;
  onEditLocation?: (location: ProjectLocation) => void;
  onViewLocation?: (location: ProjectLocation) => void;
  onDeleteLocation?: (locationId: number) => void;
}

// Cores para os status
const statusColors: Record<string, string> = {
  reserved: '#9c27b0',
  confirmed: '#4caf50',
  in_use: '#2196f3',
  returned: '#607d8b',
  overdue: '#f44336',
  cancelled: '#9e9e9e',
};

const statusLabels: Record<string, string> = {
  reserved: 'Reservada',
  confirmed: 'Confirmada',
  in_use: 'Em Uso',
  returned: 'Devolvida',
  overdue: 'Atrasada',
  cancelled: 'Cancelada',
};

export default function ProjectLocationsOverview({
  projectId,
  projectTitle,
  onAddLocation,
  onEditLocation,
  onViewLocation,
  onDeleteLocation,
}: ProjectLocationsOverviewProps) {
  const [expandedLocationId, setExpandedLocationId] = useState<number | null>(
    null
  );
  const [selectedLocation, setSelectedLocation] =
    useState<ProjectLocation | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Buscar locações do projeto
  const { data: projectLocations = [], isLoading } = useQuery({
    queryKey: ['project-locations', projectId],
    queryFn: () =>
      projectLocationService.getProjectLocations(Number(projectId)),
  });

  // Buscar usuários para exibir responsáveis
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  });

  // Mutation para atualizar status de etapa
  const updateStageMutation = useMutation({
    mutationFn: ({
      stageId,
      updates,
    }: {
      stageId: number;
      updates: {
        status?: StageStatus;
        completion_percentage?: number;
        modified_by_user_id?: number;
      };
    }) => projectLocationStageService.updateStage(stageId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-locations', projectId],
      });
    },
  });

  const handleToggleExpand = (locationId: number) => {
    setExpandedLocationId(
      expandedLocationId === locationId ? null : locationId
    );
  };

  const handleViewDetails = (location: ProjectLocation) => {
    setSelectedLocation(location);
    setDetailDialogOpen(true);
  };

  const handleStageStatusUpdate = (stageId: number, newStatus: StageStatus) => {
    updateStageMutation.mutate({
      stageId,
      updates: {
        status: newStatus,
        modified_by_user_id: user?.id ? Number(user.id) : undefined,
      },
    });
  };

  const getUserById = (userId?: number): User | undefined => {
    if (!userId) return undefined;
    return users.find(u => Number(u.id) === userId);
  };

  // Calcular estatísticas gerais
  const totalLocations = projectLocations.length;
  const completedLocations = projectLocations.filter(
    loc => loc.status === 'returned' || loc.completion_percentage === 100
  ).length;
  const inProgressLocations = projectLocations.filter(
    loc => loc.status === 'in_use' || loc.status === 'confirmed'
  ).length;
  const overdueLocations = projectLocations.filter(
    loc => loc.is_overdue
  ).length;

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Carregando locações do projeto...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Cabeçalho com Estatísticas */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          color: 'white',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Locações do Projeto
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {projectTitle}
            </Typography>
          </Box>
          {onAddLocation && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={onAddLocation}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' },
              }}
            >
              Nova Locação
            </Button>
          )}
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight="bold">
                {totalLocations}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h3"
                fontWeight="bold"
                sx={{ color: '#a5d6a7' }}
              >
                {completedLocations}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Concluídas
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h3"
                fontWeight="bold"
                sx={{ color: '#90caf9' }}
              >
                {inProgressLocations}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Em Andamento
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h3"
                fontWeight="bold"
                sx={{ color: '#ef9a9a' }}
              >
                {overdueLocations}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Atrasadas
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Lista de Locações */}
      {projectLocations.length === 0 ? (
        <Alert
          severity="info"
          sx={{ borderRadius: 2 }}
          action={
            onAddLocation && (
              <Button color="inherit" size="small" onClick={onAddLocation}>
                Adicionar
              </Button>
            )
          }
        >
          Nenhuma locação vinculada a este projeto ainda.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {projectLocations.map(location => {
            const isExpanded = expandedLocationId === location.id;
            const responsibleUser = getUserById(location.responsible_user_id);
            const coordinatorUser = getUserById(location.coordinator_user_id);
            const stages = location.stages || [];
            const completedStages = stages.filter(
              s => s.status === StageStatus.COMPLETED
            ).length;
            const progressPercentage =
              stages.length > 0 ? (completedStages / stages.length) * 100 : 0;

            return (
              <Card
                key={location.id}
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: location.is_overdue
                    ? '2px solid #f44336'
                    : '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {/* Barra de progresso no topo */}
                <LinearProgress
                  variant="determinate"
                  value={progressPercentage}
                  sx={{
                    height: 4,
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: location.is_overdue
                        ? '#f44336'
                        : '#4caf50',
                    },
                  }}
                />

                <CardContent sx={{ p: 3 }}>
                  {/* Cabeçalho da Locação */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <LocationOn
                          sx={{ color: 'primary.main', fontSize: 28 }}
                        />
                        <Typography
                          variant="h5"
                          fontWeight="bold"
                          color="primary.main"
                        >
                          {location.location?.title || 'Locação'}
                        </Typography>
                        {location.is_overdue && (
                          <Chip
                            icon={<Warning />}
                            label="Atrasada"
                            color="error"
                            size="small"
                          />
                        )}
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {location.location?.city &&
                          `${location.location.city}, ${location.location.state}`}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={
                            statusLabels[location.status] || location.status
                          }
                          size="small"
                          sx={{
                            backgroundColor:
                              statusColors[location.status] || '#9e9e9e',
                            color: 'white',
                          }}
                        />
                        <Chip
                          icon={<CalendarToday sx={{ fontSize: 14 }} />}
                          label={`${formatDateBR(
                            location.rental_start
                          )} - ${formatDateBR(location.rental_end)}`}
                          size="small"
                          variant="outlined"
                        />
                        {location.duration_days && (
                          <Chip
                            label={`${location.duration_days} dias`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 1,
                      }}
                    >
                      {/* Responsáveis */}
                      <AvatarGroup max={3} sx={{ mb: 1 }}>
                        {responsibleUser && (
                          <Tooltip
                            title={`Responsável: ${responsibleUser.full_name}`}
                          >
                            <Avatar
                              src={responsibleUser.avatar_url}
                              sx={{
                                width: 32,
                                height: 32,
                                border: '2px solid #4caf50',
                              }}
                            >
                              {responsibleUser.full_name?.charAt(0)}
                            </Avatar>
                          </Tooltip>
                        )}
                        {coordinatorUser && (
                          <Tooltip
                            title={`Coordenador: ${coordinatorUser.full_name}`}
                          >
                            <Avatar
                              src={coordinatorUser.avatar_url}
                              sx={{
                                width: 32,
                                height: 32,
                                border: '2px solid #2196f3',
                              }}
                            >
                              {coordinatorUser.full_name?.charAt(0)}
                            </Avatar>
                          </Tooltip>
                        )}
                      </AvatarGroup>

                      {/* Progresso */}
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {Math.round(progressPercentage)}%
                        </Typography>
                        <Box
                          sx={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            background: `conic-gradient(#4caf50 ${
                              progressPercentage * 3.6
                            }deg, #e0e0e0 0deg)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Box
                            sx={{
                              width: 50,
                              height: 50,
                              borderRadius: '50%',
                              backgroundColor: 'background.paper',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography variant="body2" fontWeight="bold">
                              {completedStages}/{stages.length}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Timeline de Etapas (resumida) */}
                  <LocationStageTimeline
                    stages={stages}
                    compact={!isExpanded}
                    onStageClick={stage => console.log('Stage clicked:', stage)}
                    onStageStatusUpdate={handleStageStatusUpdate}
                  />

                  {/* Ações */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 2,
                      pt: 2,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => handleViewDetails(location)}
                      >
                        Detalhes
                      </Button>
                      {onEditLocation && (
                        <Button
                          size="small"
                          startIcon={<Edit />}
                          onClick={() => onEditLocation(location)}
                        >
                          Editar
                        </Button>
                      )}
                      {onDeleteLocation && (
                        <Button
                          size="small"
                          color="error"
                          startIcon={<Delete />}
                          onClick={() => {
                            if (
                              window.confirm(
                                'Tem certeza que deseja excluir esta locação?'
                              )
                            ) {
                              onDeleteLocation(Number(location.id));
                            }
                          }}
                        >
                          Excluir
                        </Button>
                      )}
                    </Box>
                    <IconButton
                      onClick={() => handleToggleExpand(Number(location.id))}
                      size="small"
                    >
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>

                  {/* Detalhes Expandidos */}
                  {isExpanded && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        backgroundColor: 'action.hover',
                        borderRadius: 2,
                      }}
                    >
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            Informações Financeiras
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.5,
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                              }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Taxa Diária:
                              </Typography>
                              <Typography variant="body2">
                                R${' '}
                                {location.daily_rate?.toLocaleString('pt-BR')}
                              </Typography>
                            </Box>
                            {location.hourly_rate && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Taxa Horária:
                                </Typography>
                                <Typography variant="body2">
                                  R${' '}
                                  {location.hourly_rate?.toLocaleString(
                                    'pt-BR'
                                  )}
                                </Typography>
                              </Box>
                            )}
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                              }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                fontWeight="bold"
                              >
                                Custo Total:
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                color="primary"
                              >
                                R${' '}
                                {location.total_cost?.toLocaleString('pt-BR')}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            Notas
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {location.notes || 'Nenhuma nota adicionada.'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Dialog de Detalhes */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn color="primary" />
            <Typography variant="h6">
              {selectedLocation?.location?.title || 'Detalhes da Locação'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedLocation && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Etapas do Processo
              </Typography>
              <LocationStageTimeline
                stages={selectedLocation.stages || []}
                compact={false}
                onStageStatusUpdate={handleStageStatusUpdate}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Badge,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  Assignment,
  AssignmentTurnedIn,
  Schedule,
  Warning,
  Search,
  FilterList,
  FolderOpen,
  LocationOn,
  ArrowForward,
  CheckCircle,
  PlayArrow,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  locationDemandService,
  LocationDemand,
  DemandStatus,
  DemandPriority,
  priorityLabels,
  priorityColors,
  statusLabels,
  statusColors,
} from '../../services/locationDemandService';
import DemandCard from './DemandCard';

interface GroupedDemands {
  [projectId: number]: {
    projectName: string;
    locations: {
      [locationId: number]: {
        locationName: string;
        demands: LocationDemand[];
      };
    };
  };
}

interface UserDemandsListProps {
  showCreatedDemands?: boolean;
}

export default function UserDemandsList({
  showCreatedDemands = false,
}: UserDemandsListProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<DemandStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<DemandPriority | 'all'>(
    'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(
    new Set()
  );

  // Fetch user demands
  const {
    data: demands = [],
    isLoading,
    error,
  } = useQuery<LocationDemand[]>({
    queryKey: ['my-demands', user?.id, showCreatedDemands],
    queryFn: () =>
      locationDemandService.getMyDemands(
        Number(user?.id) || 0,
        showCreatedDemands
      ),
    enabled: !!user?.id,
  });

  // Mutation for status updates
  const updateStatusMutation = useMutation({
    mutationFn: ({
      demandId,
      status,
    }: {
      demandId: number;
      status: DemandStatus;
    }) => locationDemandService.updateStatus(demandId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-demands'] });
    },
  });

  // Filter demands
  const filteredDemands = useMemo(() => {
    return demands.filter(demand => {
      // Status filter
      if (statusFilter !== 'all' && demand.status !== statusFilter) {
        return false;
      }
      // Priority filter
      if (priorityFilter !== 'all' && demand.priority !== priorityFilter) {
        return false;
      }
      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        return (
          demand.title.toLowerCase().includes(search) ||
          demand.description?.toLowerCase().includes(search) ||
          demand.location_name?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [demands, statusFilter, priorityFilter, searchQuery]);

  // Group demands by project and location
  const groupedDemands = useMemo(() => {
    const grouped: GroupedDemands = {};

    filteredDemands.forEach(demand => {
      const projectId = demand.project_id;
      const locationId = demand.project_location_id;

      if (!grouped[projectId]) {
        grouped[projectId] = {
          projectName: `Projeto ${projectId}`,
          locations: {},
        };
      }

      if (!grouped[projectId].locations[locationId]) {
        grouped[projectId].locations[locationId] = {
          locationName: demand.location_name || `Locação ${locationId}`,
          demands: [],
        };
      }

      grouped[projectId].locations[locationId].demands.push(demand);
    });

    return grouped;
  }, [filteredDemands]);

  // Handle project expand toggle
  const handleProjectToggle = (projectId: number) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  // Handle status change
  const handleStatusChange = (demandId: number, status: DemandStatus) => {
    updateStatusMutation.mutate({ demandId, status });
  };

  // Navigate to demand in project
  const handleViewDemand = (demand: LocationDemand) => {
    navigate(
      `/projects/${demand.project_id}?tab=demands&demandId=${demand.id}`
    );
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    return {
      total: demands.length,
      pending: demands.filter(d => d.status === 'pending').length,
      inProgress: demands.filter(d => d.status === 'in_progress').length,
      completed: demands.filter(d => d.status === 'completed').length,
      overdue: demands.filter(d => d.is_overdue).length,
    };
  }, [demands]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Erro ao carregar demandas: {(error as Error).message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Summary Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Chip
          icon={<Assignment />}
          label={`Total: ${summaryStats.total}`}
          color="default"
          variant="outlined"
        />
        <Chip
          icon={<Schedule />}
          label={`Pendentes: ${summaryStats.pending}`}
          sx={{ bgcolor: statusColors.pending, color: '#fff' }}
        />
        <Chip
          icon={<PlayArrow />}
          label={`Em Andamento: ${summaryStats.inProgress}`}
          sx={{ bgcolor: statusColors.in_progress, color: '#fff' }}
        />
        <Chip
          icon={<CheckCircle />}
          label={`Concluídas: ${summaryStats.completed}`}
          sx={{ bgcolor: statusColors.completed, color: '#fff' }}
        />
        {summaryStats.overdue > 0 && (
          <Chip
            icon={<Warning />}
            label={`Atrasadas: ${summaryStats.overdue}`}
            color="error"
          />
        )}
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Buscar demandas..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={e =>
                setStatusFilter(e.target.value as DemandStatus | 'all')
              }
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="pending">Pendente</MenuItem>
              <MenuItem value="in_progress">Em Andamento</MenuItem>
              <MenuItem value="completed">Concluída</MenuItem>
              <MenuItem value="cancelled">Cancelada</MenuItem>
              <MenuItem value="on_hold">Em Espera</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Prioridade</InputLabel>
            <Select
              value={priorityFilter}
              label="Prioridade"
              onChange={e =>
                setPriorityFilter(e.target.value as DemandPriority | 'all')
              }
            >
              <MenuItem value="all">Todas</MenuItem>
              <MenuItem value="urgent">Urgente</MenuItem>
              <MenuItem value="high">Alta</MenuItem>
              <MenuItem value="medium">Média</MenuItem>
              <MenuItem value="low">Baixa</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Demands grouped by project/location */}
      {Object.keys(groupedDemands).length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Nenhuma demanda encontrada
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {showCreatedDemands
              ? 'Você ainda não tem demandas atribuídas ou criadas.'
              : 'Você ainda não tem demandas atribuídas.'}
          </Typography>
        </Paper>
      ) : (
        Object.entries(groupedDemands).map(([projectIdStr, projectData]) => {
          const projectId = parseInt(projectIdStr);
          const locations = projectData.locations;
          const locationCount = Object.keys(locations).length;
          const demandCount = (
            Object.values(locations) as Array<{
              locationName: string;
              demands: LocationDemand[];
            }>
          ).reduce((sum, loc) => sum + loc.demands.length, 0);
          const overdueCount = (
            Object.values(locations) as Array<{
              locationName: string;
              demands: LocationDemand[];
            }>
          ).reduce(
            (sum, loc) => sum + loc.demands.filter(d => d.is_overdue).length,
            0
          );

          return (
            <Accordion
              key={projectId}
              expanded={expandedProjects.has(projectId)}
              onChange={() => handleProjectToggle(projectId)}
              sx={{ mb: 2 }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    gap: 2,
                  }}
                >
                  <FolderOpen color="primary" />
                  <Typography sx={{ fontWeight: 600, flexGrow: 1 }}>
                    {projectData.projectName}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${demandCount} demandas`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={`${locationCount} locações`}
                    color="default"
                    variant="outlined"
                  />
                  {overdueCount > 0 && (
                    <Chip
                      size="small"
                      icon={<Warning />}
                      label={`${overdueCount} atrasadas`}
                      color="error"
                      variant="filled"
                    />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {(
                  Object.entries(projectData.locations) as Array<
                    [
                      string,
                      { locationName: string; demands: LocationDemand[] },
                    ]
                  >
                ).map(([locationIdStr, locationData]) => (
                  <Box key={locationIdStr} sx={{ mb: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 2,
                        pb: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <LocationOn color="action" fontSize="small" />
                      <Typography variant="subtitle1" fontWeight={500}>
                        {locationData.locationName}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${locationData.demands.length}`}
                        sx={{ ml: 1 }}
                      />
                    </Box>
                    <List disablePadding>
                      {locationData.demands.map(demand => (
                        <ListItem
                          key={demand.id}
                          sx={{
                            bgcolor: 'background.paper',
                            mb: 1,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: demand.is_overdue
                              ? 'error.main'
                              : 'divider',
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                          }}
                        >
                          <ListItemIcon>
                            <Box
                              sx={{
                                width: 8,
                                height: 40,
                                borderRadius: 1,
                                bgcolor: priorityColors[demand.priority],
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <Typography variant="body1" fontWeight={500}>
                                  {demand.title}
                                </Typography>
                                {demand.is_overdue && (
                                  <Chip
                                    size="small"
                                    label="Atrasada"
                                    color="error"
                                    sx={{ height: 20 }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box
                                sx={{
                                  display: 'flex',
                                  gap: 1,
                                  mt: 0.5,
                                  alignItems: 'center',
                                }}
                              >
                                <Chip
                                  size="small"
                                  label={statusLabels[demand.status]}
                                  sx={{
                                    bgcolor: statusColors[demand.status],
                                    color: '#fff',
                                    height: 20,
                                    fontSize: '0.7rem',
                                  }}
                                />
                                <Chip
                                  size="small"
                                  label={priorityLabels[demand.priority]}
                                  variant="outlined"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.7rem',
                                    borderColor:
                                      priorityColors[demand.priority],
                                    color: priorityColors[demand.priority],
                                  }}
                                />
                                {demand.due_date && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Venc:{' '}
                                    {new Date(
                                      demand.due_date
                                    ).toLocaleDateString('pt-BR')}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {demand.status === 'pending' && (
                                <Tooltip title="Iniciar">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() =>
                                      handleStatusChange(
                                        demand.id,
                                        'in_progress'
                                      )
                                    }
                                  >
                                    <PlayArrow />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {demand.status === 'in_progress' && (
                                <Tooltip title="Concluir">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() =>
                                      handleStatusChange(demand.id, 'completed')
                                    }
                                  >
                                    <CheckCircle />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Ver no Projeto">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewDemand(demand)}
                                >
                                  <ArrowForward />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          );
        })
      )}
    </Box>
  );
}

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Collapse,
  IconButton,
  LinearProgress,
  Skeleton,
  Alert,
  Divider,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Add,
  ExpandMore,
  ExpandLess,
  LocationOn,
  FilterList,
  Refresh,
  Warning,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  locationDemandService,
  LocationDemand,
  DemandStatus,
  LocationDemandSummary,
  priorityColors,
} from '../../services/locationDemandService';
import { ProjectLocation } from '../../types/user';
import DemandCard from './DemandCard';
import DemandFormModal from './DemandFormModal';

interface LocationDemandsPanelProps {
  projectId: number;
  projectLocations: ProjectLocation[];
  onRefresh?: () => void;
}

export default function LocationDemandsPanel({
  projectId,
  projectLocations,
  onRefresh,
}: LocationDemandsPanelProps) {
  const queryClient = useQueryClient();
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(
    new Set()
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDemand, setEditingDemand] = useState<LocationDemand | null>(
    null
  );
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    null
  );

  // Fetch all demands for the project
  const {
    data: demands,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['project-demands', projectId],
    queryFn: () => locationDemandService.getDemandsByProject(projectId),
    enabled: !!projectId,
  });

  // Fetch summary
  const { data: summary } = useQuery({
    queryKey: ['project-demands-summary', projectId],
    queryFn: () => locationDemandService.getSummary(projectId),
    enabled: !!projectId,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({
      demandId,
      status,
    }: {
      demandId: number;
      status: DemandStatus;
    }) => locationDemandService.updateStatus(demandId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-demands', projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ['project-demands-summary', projectId],
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (demandId: number) =>
      locationDemandService.deleteDemand(demandId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-demands', projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ['project-demands-summary', projectId],
      });
    },
  });

  const toggleLocation = (locationId: string) => {
    setExpandedLocations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) {
        newSet.delete(locationId);
      } else {
        newSet.add(locationId);
      }
      return newSet;
    });
  };

  const handleAddDemand = (locationId?: number) => {
    setSelectedLocationId(locationId || null);
    setEditingDemand(null);
    setIsFormOpen(true);
  };

  const handleEditDemand = (demand: LocationDemand) => {
    setSelectedLocationId(demand.project_location_id);
    setEditingDemand(demand);
    setIsFormOpen(true);
  };

  const handleDeleteDemand = (demand: LocationDemand) => {
    if (
      window.confirm(`Deseja realmente excluir a demanda "${demand.title}"?`)
    ) {
      deleteMutation.mutate(demand.id);
    }
  };

  const handleStatusChange = (demandId: number, status: DemandStatus) => {
    updateStatusMutation.mutate({ demandId, status });
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingDemand(null);
    setSelectedLocationId(null);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['project-demands', projectId] });
    queryClient.invalidateQueries({
      queryKey: ['project-demands-summary', projectId],
    });
    handleFormClose();
  };

  // Group demands by location
  const demandsByLocation = React.useMemo(() => {
    if (!demands) return new Map<number, LocationDemand[]>();
    const map = new Map<number, LocationDemand[]>();
    demands.forEach(demand => {
      const locationId = demand.project_location_id;
      if (!map.has(locationId)) {
        map.set(locationId, []);
      }
      map.get(locationId)!.push(demand);
    });
    return map;
  }, [demands]);

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={100} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={100} sx={{ mb: 1 }} />
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
      {/* Summary header */}
      {summary && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6">Demandas do Projeto</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Atualizar">
                  <IconButton size="small" onClick={() => refetch()}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
                <Button
                  startIcon={<Add />}
                  variant="contained"
                  size="small"
                  onClick={() => handleAddDemand()}
                >
                  Nova Demanda
                </Button>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {summary.total}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="grey.500">
                  {summary.pending}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pendentes
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {summary.in_progress}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Em Andamento
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {summary.completed}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Concluídas
                </Typography>
              </Box>
              {summary.overdue > 0 && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">
                    {summary.overdue}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Atrasadas
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Progress bar */}
            {summary.total > 0 && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={(summary.completed / summary.total) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {Math.round((summary.completed / summary.total) * 100)}%
                  concluído
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Demands by location */}
      {projectLocations.length === 0 ? (
        <Alert severity="info">
          Nenhuma locação adicionada ao projeto ainda.
        </Alert>
      ) : (
        projectLocations.map(projectLocation => {
          const locationId = parseInt(projectLocation.id);
          const locationDemands = demandsByLocation.get(locationId) || [];
          const isExpanded = expandedLocations.has(projectLocation.id);
          const overdueDemands = locationDemands.filter(d => d.is_overdue);
          const completedCount = locationDemands.filter(
            d => d.status === 'completed'
          ).length;

          return (
            <Card key={projectLocation.id} sx={{ mb: 2 }}>
              <CardHeader
                avatar={<LocationOn color="primary" />}
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {projectLocation.location?.title || 'Locação'}
                    </Typography>
                    {overdueDemands.length > 0 && (
                      <Badge badgeContent={overdueDemands.length} color="error">
                        <Warning color="error" fontSize="small" />
                      </Badge>
                    )}
                  </Box>
                }
                subheader={
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip
                      label={`${locationDemands.length} demandas`}
                      size="small"
                      variant="outlined"
                    />
                    {completedCount > 0 && (
                      <Chip
                        label={`${completedCount} concluídas`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
                action={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={e => {
                        e.stopPropagation();
                        handleAddDemand(locationId);
                      }}
                    >
                      Adicionar
                    </Button>
                    <IconButton
                      onClick={() => toggleLocation(projectLocation.id)}
                    >
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                }
                sx={{ cursor: 'pointer' }}
                onClick={() => toggleLocation(projectLocation.id)}
              />

              <Collapse in={isExpanded}>
                <Divider />
                <CardContent>
                  {locationDemands.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Nenhuma demanda cadastrada para esta locação
                      </Typography>
                      <Button
                        startIcon={<Add />}
                        variant="outlined"
                        size="small"
                        onClick={() => handleAddDemand(locationId)}
                      >
                        Criar primeira demanda
                      </Button>
                    </Box>
                  ) : (
                    locationDemands.map(demand => (
                      <DemandCard
                        key={demand.id}
                        demand={demand}
                        onEdit={handleEditDemand}
                        onDelete={handleDeleteDemand}
                        onStatusChange={handleStatusChange}
                      />
                    ))
                  )}
                </CardContent>
              </Collapse>
            </Card>
          );
        })
      )}

      {/* Form Modal */}
      <DemandFormModal
        open={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        projectId={projectId}
        projectLocationId={selectedLocationId || undefined}
        projectLocations={projectLocations}
        demand={editingDemand}
      />
    </Box>
  );
}

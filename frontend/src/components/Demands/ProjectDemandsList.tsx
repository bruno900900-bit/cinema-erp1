import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Tooltip,
  Chip,
  Button,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  Skeleton,
  Alert,
  Collapse,
} from '@mui/material';
import {
  Add,
  CheckCircle,
  PlayArrow,
  Pause,
  Delete,
  Edit,
  MoreVert,
  Person,
  LocationOn,
  Warning,
  Flag,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { ProjectLocation } from '../../types/user';
import DemandFormModal from './DemandFormModal';

interface ProjectDemandsListProps {
  projectId: number;
  projectLocations: ProjectLocation[];
}

export default function ProjectDemandsList({
  projectId,
  projectLocations,
}: ProjectDemandsListProps) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDemand, setEditingDemand] = useState<LocationDemand | null>(
    null
  );
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    null
  );
  const [menuAnchor, setMenuAnchor] = useState<{
    element: HTMLElement;
    demand: LocationDemand;
  } | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  // Fetch all demands for the project
  const { data: demands = [], isLoading } = useQuery({
    queryKey: ['project-demands', projectId],
    queryFn: () => locationDemandService.getDemandsByProject(projectId),
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
    },
  });

  const handleAddDemand = (locationId?: number) => {
    setEditingDemand(null);
    setSelectedLocationId(locationId || null);
    setIsFormOpen(true);
  };

  const handleEditDemand = (demand: LocationDemand) => {
    setEditingDemand(demand);
    setSelectedLocationId(demand.project_location_id);
    setIsFormOpen(true);
    setMenuAnchor(null);
  };

  const handleDeleteDemand = (demand: LocationDemand) => {
    if (window.confirm(`Excluir demanda "${demand.title}"?`)) {
      deleteMutation.mutate(demand.id);
    }
    setMenuAnchor(null);
  };

  const handleStatusChange = (demandId: number, status: DemandStatus) => {
    updateStatusMutation.mutate({ demandId, status });
    setMenuAnchor(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingDemand(null);
    setSelectedLocationId(null);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['project-demands', projectId] });
    handleFormClose();
  };

  // Get location name by ID
  const getLocationName = (locationId: number): string => {
    const location = projectLocations.find(l => parseInt(l.id) === locationId);
    return location?.location?.title || `Locação ${locationId}`;
  };

  // Get days until due
  const getDaysUntilDue = (
    demand: LocationDemand
  ): { text: string; color: string; isOverdue: boolean } | null => {
    if (!demand.due_date) return null;
    const now = new Date();
    const due = new Date(demand.due_date);
    const diffDays = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (demand.status === 'completed') {
      return { text: '✓', color: '#4CAF50', isOverdue: false };
    }
    if (diffDays < 0) {
      return {
        text: `${Math.abs(diffDays)}d atrás`,
        color: '#F44336',
        isOverdue: true,
      };
    }
    if (diffDays === 0) {
      return { text: 'Hoje', color: '#FF9800', isOverdue: false };
    }
    if (diffDays <= 3) {
      return { text: `${diffDays}d`, color: '#FF9800', isOverdue: false };
    }
    return { text: `${diffDays}d`, color: '#9E9E9E', isOverdue: false };
  };

  // Group demands by location
  const demandsByLocation = demands.reduce((acc, demand) => {
    const locId = demand.project_location_id;
    if (!acc[locId]) acc[locId] = [];
    acc[locId].push(demand);
    return acc;
  }, {} as Record<number, LocationDemand[]>);

  // Sort demands within each location by priority and status
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  const statusOrder = {
    pending: 0,
    in_progress: 1,
    on_hold: 2,
    completed: 3,
    cancelled: 4,
  };

  Object.keys(demandsByLocation).forEach(locId => {
    demandsByLocation[Number(locId)].sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  });

  // Filter out completed unless showCompleted is true
  const filteredDemandsByLocation = Object.fromEntries(
    Object.entries(demandsByLocation).map(([locId, locDemands]) => [
      locId,
      showCompleted
        ? locDemands
        : locDemands.filter(d => d.status !== 'completed'),
    ])
  );

  // Summary stats
  const totalDemands = demands.length;
  const pendingDemands = demands.filter(
    d => d.status === 'pending' || d.status === 'in_progress'
  ).length;
  const completedDemands = demands.filter(d => d.status === 'completed').length;
  const overdueDemands = demands.filter(d => d.is_overdue).length;

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with summary */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Flag sx={{ color: 'primary.main' }} />
            Demandas do Projeto
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {pendingDemands} pendente{pendingDemands !== 1 ? 's' : ''}
            </Typography>
            <Typography variant="body2" color="success.main">
              {completedDemands} concluída{completedDemands !== 1 ? 's' : ''}
            </Typography>
            {overdueDemands > 0 && (
              <Typography
                variant="body2"
                color="error.main"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <Warning sx={{ fontSize: 14 }} />
                {overdueDemands} atrasada{overdueDemands !== 1 ? 's' : ''}
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            onClick={() => setShowCompleted(!showCompleted)}
            variant={showCompleted ? 'contained' : 'outlined'}
          >
            {showCompleted ? 'Ocultar Concluídas' : 'Mostrar Concluídas'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleAddDemand()}
          >
            Nova Demanda
          </Button>
        </Box>
      </Box>

      {/* Demands list by location */}
      {totalDemands === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Nenhuma demanda cadastrada ainda. Clique em "Nova Demanda" para
          começar.
        </Alert>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {Object.entries(filteredDemandsByLocation).map(
            ([locIdStr, locDemands], groupIndex) => {
              const locId = Number(locIdStr);
              const locationName = getLocationName(locId);
              const locCompletedCount = locDemands.filter(
                d => d.status === 'completed'
              ).length;
              const locPendingCount = locDemands.length - locCompletedCount;

              if (locDemands.length === 0 && !showCompleted) return null;

              return (
                <Box key={locId}>
                  {groupIndex > 0 && <Divider />}

                  {/* Location header */}
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      bgcolor: 'primary.50',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn
                        sx={{ color: 'primary.main', fontSize: 20 }}
                      />
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        color="primary.main"
                      >
                        {locationName}
                      </Typography>
                      <Chip
                        label={`${locPendingCount} pendente${
                          locPendingCount !== 1 ? 's' : ''
                        }`}
                        size="small"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={() => handleAddDemand(locId)}
                    >
                      Adicionar
                    </Button>
                  </Box>

                  {/* Demands for this location */}
                  <List dense disablePadding>
                    {locDemands.map((demand, index) => {
                      const dueInfo = getDaysUntilDue(demand);
                      const isCompleted = demand.status === 'completed';

                      return (
                        <React.Fragment key={demand.id}>
                          {index > 0 && (
                            <Divider component="li" variant="inset" />
                          )}
                          <ListItem
                            sx={{
                              py: 1.5,
                              px: 2,
                              opacity: isCompleted ? 0.6 : 1,
                              bgcolor: demand.is_overdue
                                ? 'error.50'
                                : 'transparent',
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            {/* Priority indicator */}
                            <Box
                              sx={{
                                width: 5,
                                height: 40,
                                borderRadius: 1,
                                bgcolor: priorityColors[demand.priority],
                                mr: 2,
                              }}
                            />

                            {/* Assigned user avatar */}
                            <ListItemAvatar sx={{ minWidth: 44 }}>
                              {demand.assigned_user_name ? (
                                <Tooltip
                                  title={`Responsável: ${demand.assigned_user_name}`}
                                >
                                  <Avatar
                                    sx={{
                                      width: 36,
                                      height: 36,
                                      fontSize: '0.9rem',
                                      bgcolor: 'primary.main',
                                    }}
                                  >
                                    {demand.assigned_user_name
                                      .charAt(0)
                                      .toUpperCase()}
                                  </Avatar>
                                </Tooltip>
                              ) : (
                                <Tooltip title="Sem responsável atribuído">
                                  <Avatar
                                    sx={{
                                      width: 36,
                                      height: 36,
                                      bgcolor: 'grey.300',
                                    }}
                                  >
                                    <Person
                                      sx={{ fontSize: 20, color: 'grey.500' }}
                                    />
                                  </Avatar>
                                </Tooltip>
                              )}
                            </ListItemAvatar>

                            {/* Content */}
                            <ListItemText
                              primary={
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                  }}
                                >
                                  <Typography
                                    variant="body1"
                                    fontWeight="medium"
                                    sx={{
                                      textDecoration: isCompleted
                                        ? 'line-through'
                                        : 'none',
                                    }}
                                  >
                                    {demand.title}
                                  </Typography>
                                  {demand.category && (
                                    <Chip
                                      label={demand.category}
                                      size="small"
                                      variant="outlined"
                                      sx={{ height: 20, fontSize: '0.7rem' }}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    mt: 0.5,
                                  }}
                                >
                                  <Chip
                                    label={statusLabels[demand.status]}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.7rem',
                                      bgcolor: `${
                                        statusColors[demand.status]
                                      }20`,
                                      color: statusColors[demand.status],
                                    }}
                                  />
                                  <Chip
                                    label={priorityLabels[demand.priority]}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.7rem',
                                      bgcolor: `${
                                        priorityColors[demand.priority]
                                      }20`,
                                      color: priorityColors[demand.priority],
                                    }}
                                  />
                                  {dueInfo && (
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                      }}
                                    >
                                      {dueInfo.isOverdue && (
                                        <Warning
                                          sx={{
                                            fontSize: 14,
                                            color: dueInfo.color,
                                          }}
                                        />
                                      )}
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: dueInfo.color,
                                          fontWeight: dueInfo.isOverdue
                                            ? 'bold'
                                            : 'normal',
                                        }}
                                      >
                                        {dueInfo.text}
                                      </Typography>
                                    </Box>
                                  )}
                                  {demand.assigned_user_name && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      → {demand.assigned_user_name}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />

                            {/* Actions */}
                            <ListItemSecondaryAction>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}
                              >
                                {!isCompleted && (
                                  <Tooltip title="Marcar como concluída">
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleStatusChange(
                                          demand.id,
                                          'completed'
                                        )
                                      }
                                      sx={{ color: 'success.main' }}
                                    >
                                      <CheckCircle />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="Editar">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditDemand(demand)}
                                  >
                                    <Edit />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Excluir">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteDemand(demand)}
                                    sx={{ color: 'error.main' }}
                                  >
                                    <Delete />
                                  </IconButton>
                                </Tooltip>
                                <IconButton
                                  size="small"
                                  onClick={e =>
                                    setMenuAnchor({
                                      element: e.currentTarget,
                                      demand,
                                    })
                                  }
                                >
                                  <MoreVert />
                                </IconButton>
                              </Box>
                            </ListItemSecondaryAction>
                          </ListItem>
                        </React.Fragment>
                      );
                    })}
                  </List>
                </Box>
              );
            }
          )}
        </Paper>
      )}

      {/* Context menu */}
      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        {menuAnchor?.demand.status === 'pending' && (
          <MenuItem
            onClick={() =>
              handleStatusChange(menuAnchor.demand.id, 'in_progress')
            }
          >
            <ListItemIcon>
              <PlayArrow fontSize="small" />
            </ListItemIcon>
            <ListItemText>Iniciar</ListItemText>
          </MenuItem>
        )}
        {menuAnchor?.demand.status === 'in_progress' && (
          <MenuItem
            onClick={() =>
              handleStatusChange(menuAnchor.demand.id, 'completed')
            }
          >
            <ListItemIcon>
              <CheckCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText>Concluir</ListItemText>
          </MenuItem>
        )}
        {(menuAnchor?.demand.status === 'pending' ||
          menuAnchor?.demand.status === 'in_progress') && (
          <MenuItem
            onClick={() => handleStatusChange(menuAnchor.demand.id, 'on_hold')}
          >
            <ListItemIcon>
              <Pause fontSize="small" />
            </ListItemIcon>
            <ListItemText>Pausar</ListItemText>
          </MenuItem>
        )}
        {menuAnchor?.demand.status === 'completed' && (
          <MenuItem
            onClick={() => handleStatusChange(menuAnchor.demand.id, 'pending')}
          >
            <ListItemIcon>
              <Flag fontSize="small" />
            </ListItemIcon>
            <ListItemText>Reabrir</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Form modal */}
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

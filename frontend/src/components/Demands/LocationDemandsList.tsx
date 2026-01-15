import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Skeleton,
  Badge,
  Divider,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
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
  Schedule,
  Flag,
  AssignmentTurnedIn,
  Warning,
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

interface LocationDemandsListProps {
  projectId: number;
  location: ProjectLocation;
  compact?: boolean;
}

export default function LocationDemandsList({
  projectId,
  location,
  compact = true,
}: LocationDemandsListProps) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDemand, setEditingDemand] = useState<LocationDemand | null>(
    null
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{
    element: HTMLElement;
    demand: LocationDemand;
  } | null>(null);

  const locationId = parseInt(location.id);

  // Fetch demands for this location
  const { data: demands = [], isLoading } = useQuery({
    queryKey: ['location-demands', locationId],
    queryFn: () => locationDemandService.getDemandsByLocation(locationId),
    enabled: !!locationId,
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
        queryKey: ['location-demands', locationId],
      });
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
        queryKey: ['location-demands', locationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['project-demands', projectId],
      });
    },
  });

  const handleAddDemand = () => {
    setEditingDemand(null);
    setIsFormOpen(true);
  };

  const handleEditDemand = (demand: LocationDemand) => {
    setEditingDemand(demand);
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
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ['location-demands', locationId],
    });
    queryClient.invalidateQueries({ queryKey: ['project-demands', projectId] });
    handleFormClose();
  };

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

  // Group demands by priority for display
  const urgentDemands = demands.filter(
    d => d.priority === 'urgent' && d.status !== 'completed'
  );
  const highDemands = demands.filter(
    d => d.priority === 'high' && d.status !== 'completed'
  );
  const pendingDemands = demands.filter(
    d => d.status === 'pending' || d.status === 'in_progress'
  );
  const completedDemands = demands.filter(d => d.status === 'completed');
  const overdueDemands = demands.filter(d => d.is_overdue);

  // Show limited items in compact mode
  const displayDemands =
    compact && !isExpanded
      ? [
          ...urgentDemands,
          ...highDemands.slice(0, 2 - urgentDemands.length),
        ].slice(0, 3)
      : demands;

  const hasMore = demands.length > displayDemands.length;

  if (isLoading) {
    return (
      <Box sx={{ py: 1 }}>
        <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1 }}>
      {/* Header with summary */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentTurnedIn sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="subtitle2" color="text.secondary">
            Demandas
          </Typography>
          {demands.length > 0 && (
            <>
              <Chip
                label={`${pendingDemands.length} pendente${
                  pendingDemands.length !== 1 ? 's' : ''
                }`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  bgcolor: 'grey.100',
                }}
              />
              {overdueDemands.length > 0 && (
                <Chip
                  icon={<Warning sx={{ fontSize: 12 }} />}
                  label={overdueDemands.length}
                  size="small"
                  color="error"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
              <Typography variant="caption" color="text.secondary">
                {completedDemands.length}/{demands.length} concluídas
              </Typography>
            </>
          )}
        </Box>
        <Button
          size="small"
          startIcon={<Add />}
          onClick={handleAddDemand}
          sx={{ fontSize: '0.75rem' }}
        >
          Nova
        </Button>
      </Box>

      {/* Demands list */}
      {demands.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            textAlign: 'center',
            bgcolor: 'action.hover',
            borderStyle: 'dashed',
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Nenhuma demanda cadastrada
          </Typography>
          <Button size="small" startIcon={<Add />} onClick={handleAddDemand}>
            Criar primeira demanda
          </Button>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ bgcolor: 'background.paper' }}>
          <List dense disablePadding>
            {displayDemands.map((demand, index) => {
              const dueInfo = getDaysUntilDue(demand);
              const isCompleted = demand.status === 'completed';

              return (
                <React.Fragment key={demand.id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem
                    sx={{
                      py: 1,
                      px: 1.5,
                      opacity: isCompleted ? 0.6 : 1,
                      bgcolor: demand.is_overdue ? 'error.50' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    {/* Priority indicator */}
                    <Box
                      sx={{
                        width: 4,
                        height: 32,
                        borderRadius: 1,
                        bgcolor: priorityColors[demand.priority],
                        mr: 1.5,
                      }}
                    />

                    {/* Assigned user avatar */}
                    <ListItemAvatar sx={{ minWidth: 36 }}>
                      {demand.assigned_user_name ? (
                        <Tooltip
                          title={`Responsável: ${demand.assigned_user_name}`}
                        >
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              fontSize: '0.8rem',
                              bgcolor: 'primary.main',
                            }}
                          >
                            {demand.assigned_user_name.charAt(0).toUpperCase()}
                          </Avatar>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Sem responsável atribuído">
                          <Avatar
                            sx={{ width: 28, height: 28, bgcolor: 'grey.300' }}
                          >
                            <Person sx={{ fontSize: 16, color: 'grey.500' }} />
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
                            gap: 0.5,
                          }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight="medium"
                            sx={{
                              textDecoration: isCompleted
                                ? 'line-through'
                                : 'none',
                              flex: 1,
                            }}
                            noWrap
                          >
                            {demand.title}
                          </Typography>
                          {demand.category && (
                            <Chip
                              label={demand.category}
                              size="small"
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mt: 0.25,
                          }}
                        >
                          <Chip
                            label={statusLabels[demand.status]}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              bgcolor: `${statusColors[demand.status]}20`,
                              color: statusColors[demand.status],
                            }}
                          />
                          {dueInfo && (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.25,
                              }}
                            >
                              {dueInfo.isOverdue && (
                                <Warning
                                  sx={{ fontSize: 12, color: dueInfo.color }}
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
                              noWrap
                              sx={{ maxWidth: 80 }}
                            >
                              → {demand.assigned_user_name.split(' ')[0]}
                            </Typography>
                          )}
                        </Box>
                      }
                      sx={{ my: 0 }}
                    />

                    {/* Quick actions */}
                    <ListItemSecondaryAction>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        {!isCompleted && (
                          <Tooltip title="Concluir">
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleStatusChange(demand.id, 'completed')
                              }
                              sx={{ color: 'success.main' }}
                            >
                              <CheckCircle sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        <IconButton
                          size="small"
                          onClick={e =>
                            setMenuAnchor({ element: e.currentTarget, demand })
                          }
                        >
                          <MoreVert sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>

          {/* Show more button */}
          {hasMore && (
            <Box
              sx={{
                textAlign: 'center',
                py: 1,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Button
                size="small"
                onClick={() => setIsExpanded(!isExpanded)}
                endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
              >
                {isExpanded
                  ? 'Mostrar menos'
                  : `Ver mais ${
                      demands.length - displayDemands.length
                    } demandas`}
              </Button>
            </Box>
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
        <MenuItem
          onClick={() => menuAnchor && handleEditDemand(menuAnchor.demand)}
        >
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => menuAnchor && handleDeleteDemand(menuAnchor.demand)}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>

      {/* Form modal */}
      <DemandFormModal
        open={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        projectId={projectId}
        projectLocationId={locationId}
        projectLocations={[location]}
        demand={editingDemand}
      />
    </Box>
  );
}

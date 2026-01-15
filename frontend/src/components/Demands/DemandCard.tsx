import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle,
  PlayArrow,
  Pause,
  Delete,
  Edit,
  MoreVert,
  Schedule,
  Person,
  Warning,
  Flag,
} from '@mui/icons-material';
import {
  LocationDemand,
  DemandPriority,
  DemandStatus,
  priorityLabels,
  priorityColors,
  statusLabels,
  statusColors,
} from '../../services/locationDemandService';

interface DemandCardProps {
  demand: LocationDemand;
  onEdit?: (demand: LocationDemand) => void;
  onDelete?: (demand: LocationDemand) => void;
  onStatusChange?: (demandId: number, status: DemandStatus) => void;
  compact?: boolean;
}

export default function DemandCard({
  demand,
  onEdit,
  onDelete,
  onStatusChange,
  compact = false,
}: DemandCardProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = (status: DemandStatus) => {
    if (onStatusChange) {
      onStatusChange(demand.id, status);
    }
    handleMenuClose();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  const getDaysUntilDue = (): { text: string; color: string } | null => {
    if (!demand.due_date) return null;
    const now = new Date();
    const due = new Date(demand.due_date);
    const diffDays = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (demand.status === 'completed') {
      return { text: 'Concluída', color: '#4CAF50' };
    }
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} dias atrás`, color: '#F44336' };
    }
    if (diffDays === 0) {
      return { text: 'Vence hoje', color: '#FF9800' };
    }
    if (diffDays <= 3) {
      return { text: `Vence em ${diffDays} dias`, color: '#FF9800' };
    }
    return { text: `Vence em ${diffDays} dias`, color: '#9E9E9E' };
  };

  const dueInfo = getDaysUntilDue();

  return (
    <Card
      sx={{
        mb: 1.5,
        borderLeft: `4px solid ${priorityColors[demand.priority]}`,
        opacity: demand.status === 'cancelled' ? 0.6 : 1,
        transition: 'box-shadow 0.2s, transform 0.2s',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent
        sx={{
          py: compact ? 1 : 2,
          px: 2,
          '&:last-child': { pb: compact ? 1 : 2 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          {/* Main Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Title Row */}
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <Typography
                variant={compact ? 'body2' : 'subtitle1'}
                fontWeight="medium"
                sx={{
                  textDecoration:
                    demand.status === 'completed' ? 'line-through' : 'none',
                  color:
                    demand.status === 'completed'
                      ? 'text.secondary'
                      : 'text.primary',
                }}
                noWrap
              >
                {demand.title}
              </Typography>

              {/* Priority indicator */}
              <Chip
                label={priorityLabels[demand.priority]}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  bgcolor: `${priorityColors[demand.priority]}20`,
                  color: priorityColors[demand.priority],
                  fontWeight: 'bold',
                }}
              />
            </Box>

            {/* Description */}
            {!compact && demand.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {demand.description}
              </Typography>
            )}

            {/* Meta info row */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              {/* Status */}
              <Chip
                label={statusLabels[demand.status]}
                size="small"
                sx={{
                  height: 22,
                  bgcolor: `${statusColors[demand.status]}20`,
                  color: statusColors[demand.status],
                }}
              />

              {/* Category */}
              {demand.category && (
                <Chip
                  label={demand.category}
                  size="small"
                  variant="outlined"
                  sx={{ height: 22, fontSize: '0.75rem' }}
                />
              )}

              {/* Due date */}
              {dueInfo && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {demand.is_overdue && (
                    <Warning sx={{ fontSize: 16, color: dueInfo.color }} />
                  )}
                  <Schedule sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography
                    variant="caption"
                    sx={{
                      color: dueInfo.color,
                      fontWeight: demand.is_overdue ? 'bold' : 'normal',
                    }}
                  >
                    {dueInfo.text}
                  </Typography>
                </Box>
              )}

              {/* Assigned user */}
              {demand.assigned_user_name && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                    {demand.assigned_user_name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="caption" color="text.secondary">
                    {demand.assigned_user_name}
                  </Typography>
                </Box>
              )}

              {/* Location name */}
              {demand.location_name && (
                <Typography variant="caption" color="text.secondary">
                  📍 {demand.location_name}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            {/* Quick complete button */}
            {demand.status !== 'completed' && demand.status !== 'cancelled' && (
              <Tooltip title="Marcar como concluída">
                <IconButton
                  size="small"
                  onClick={() => handleStatusChange('completed')}
                  sx={{ color: 'success.main' }}
                >
                  <CheckCircle fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {/* More options menu */}
            <IconButton size="small" onClick={handleMenuClick}>
              <MoreVert fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </CardContent>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {demand.status === 'pending' && (
          <MenuItem onClick={() => handleStatusChange('in_progress')}>
            <ListItemIcon>
              <PlayArrow fontSize="small" />
            </ListItemIcon>
            <ListItemText>Iniciar</ListItemText>
          </MenuItem>
        )}
        {demand.status === 'in_progress' && (
          <MenuItem onClick={() => handleStatusChange('completed')}>
            <ListItemIcon>
              <CheckCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText>Concluir</ListItemText>
          </MenuItem>
        )}
        {(demand.status === 'pending' || demand.status === 'in_progress') && (
          <MenuItem onClick={() => handleStatusChange('on_hold')}>
            <ListItemIcon>
              <Pause fontSize="small" />
            </ListItemIcon>
            <ListItemText>Pausar</ListItemText>
          </MenuItem>
        )}
        {demand.status === 'on_hold' && (
          <MenuItem onClick={() => handleStatusChange('in_progress')}>
            <ListItemIcon>
              <PlayArrow fontSize="small" />
            </ListItemIcon>
            <ListItemText>Retomar</ListItemText>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            onEdit?.(demand);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            onDelete?.(demand);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
}

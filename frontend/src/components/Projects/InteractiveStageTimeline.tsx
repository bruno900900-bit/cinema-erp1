import React, { useState } from 'react';
import {
  Box,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Cancel,
  HourglassEmpty,
  Pause,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { ProjectLocationStage, StageStatus } from '../../types/user';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InteractiveStageTimelineProps {
  stages: ProjectLocationStage[];
  onStatusChange: (stageId: number, newStatus: StageStatus) => Promise<void>;
}

const getStatusIcon = (
  status: StageStatus,
  size: 'small' | 'medium' = 'small'
) => {
  const props = { fontSize: size };

  switch (status) {
    case StageStatus.COMPLETED:
      return <CheckCircle {...props} sx={{ color: '#4caf50' }} />;
    case StageStatus.IN_PROGRESS:
      return <HourglassEmpty {...props} sx={{ color: '#ff9800' }} />;
    case StageStatus.CANCELLED:
      return <Cancel {...props} sx={{ color: '#f44336' }} />;
    case StageStatus.ON_HOLD:
      return <Pause {...props} sx={{ color: '#9e9e9e' }} />;
    default:
      return <RadioButtonUnchecked {...props} sx={{ color: '#9e9e9e' }} />;
  }
};

const getStatusColor = (
  status: StageStatus
): 'success' | 'warning' | 'error' | 'default' => {
  switch (status) {
    case StageStatus.COMPLETED:
      return 'success';
    case StageStatus.IN_PROGRESS:
      return 'warning';
    case StageStatus.CANCELLED:
      return 'error';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: StageStatus): string => {
  const labels: Record<StageStatus, string> = {
    [StageStatus.PENDING]: 'Pendente',
    [StageStatus.IN_PROGRESS]: 'Em Progresso',
    [StageStatus.COMPLETED]: 'Concluída',
    [StageStatus.CANCELLED]: 'Cancelada',
    [StageStatus.ON_HOLD]: 'Em Espera',
  };
  return labels[status] || status;
};

export default function InteractiveStageTimeline({
  stages,
  onStatusChange,
}: InteractiveStageTimelineProps) {
  const [anchorEl, setAnchorEl] = useState<{
    element: HTMLElement;
    stageId: number;
  } | null>(null);
  const [updatingStageId, setUpdatingStageId] = useState<number | null>(null);

  const sortedStages = [...stages].sort(
    (a, b) => (a.weight || 0) - (b.weight || 0)
  );

  const completedCount = sortedStages.filter(
    s => s.status === StageStatus.COMPLETED
  ).length;
  const progress = (completedCount / sortedStages.length) * 100;

  const handleStageClick = (
    event: React.MouseEvent<HTMLElement>,
    stageId: number
  ) => {
    setAnchorEl({ element: event.currentTarget, stageId });
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleStatusSelect = async (newStatus: StageStatus) => {
    if (!anchorEl) return;

    const stageId = anchorEl.stageId;
    setUpdatingStageId(stageId);
    handleClose();

    try {
      await onStatusChange(stageId, newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingStageId(null);
    }
  };

  const statusOptions: {
    value: StageStatus;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: StageStatus.PENDING,
      label: 'Pendente',
      icon: getStatusIcon(StageStatus.PENDING, 'small'),
    },
    {
      value: StageStatus.IN_PROGRESS,
      label: 'Em Progresso',
      icon: getStatusIcon(StageStatus.IN_PROGRESS, 'small'),
    },
    {
      value: StageStatus.COMPLETED,
      label: 'Concluída',
      icon: getStatusIcon(StageStatus.COMPLETED, 'small'),
    },
    {
      value: StageStatus.ON_HOLD,
      label: 'Em Espera',
      icon: getStatusIcon(StageStatus.ON_HOLD, 'small'),
    },
    {
      value: StageStatus.CANCELLED,
      label: 'Cancelada',
      icon: getStatusIcon(StageStatus.CANCELLED, 'small'),
    },
  ];

  return (
    <Box sx={{ mt: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TimelineIcon sx={{ color: 'primary.main' }} />
        <Typography variant="subtitle2" color="text.secondary">
          Etapas de Produção
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ ml: 'auto' }}
        >
          {completedCount} / {sortedStages.length} concluídas
        </Typography>
      </Box>

      {/* Progress Bar */}
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ mb: 3, height: 6, borderRadius: 3 }}
      />

      {/* Timeline */}
      <Box sx={{ position: 'relative', pl: 3 }}>
        {/* Vertical Line */}
        <Box
          sx={{
            position: 'absolute',
            left: 11,
            top: 12,
            bottom: 12,
            width: 2,
            bgcolor: 'divider',
          }}
        />

        {sortedStages.map((stage, index) => {
          const isUpdating = updatingStageId === stage.id;
          const modifiedDate = stage.status_changed_at
            ? formatDistanceToNow(new Date(stage.status_changed_at), {
                addSuffix: true,
                locale: ptBR,
              })
            : null;

          const modifiedBy = stage.status_changed_by_user?.full_name;

          return (
            <Box
              key={stage.id}
              sx={{
                position: 'relative',
                mb: index < sortedStages.length - 1 ? 3 : 0,
              }}
            >
              {/* Timeline Dot */}
              <Box
                sx={{
                  position: 'absolute',
                  left: -23,
                  top: 4,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: 'background.paper',
                  border: 2,
                  borderColor:
                    stage.status === StageStatus.COMPLETED
                      ? 'success.main'
                      : stage.status === StageStatus.IN_PROGRESS
                      ? 'warning.main'
                      : 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                }}
              >
                {getStatusIcon(stage.status, 'small')}
              </Box>

              {/* Stage Content */}
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    {stage.title}
                  </Typography>

                  <Chip
                    label={getStatusLabel(stage.status)}
                    size="small"
                    color={getStatusColor(stage.status)}
                    variant={
                      stage.status === StageStatus.COMPLETED
                        ? 'filled'
                        : 'outlined'
                    }
                    onClick={e => handleStageClick(e, stage.id)}
                    disabled={isUpdating}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: 1,
                      },
                    }}
                  />

                  {stage.is_critical && (
                    <Chip
                      label="Crítica"
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  )}
                </Box>

                {/* User Attribution */}
                {(modifiedBy || modifiedDate) && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block' }}
                  >
                    {modifiedBy && `Por: ${modifiedBy}`}
                    {modifiedBy && modifiedDate && ' • '}
                    {modifiedDate}
                  </Typography>
                )}

                {!modifiedBy &&
                  !modifiedDate &&
                  stage.status === StageStatus.PENDING && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontStyle: 'italic' }}
                    >
                      Clique no status para atualizar
                    </Typography>
                  )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Status Selection Menu */}
      <Menu
        anchorEl={anchorEl?.element}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {statusOptions.map(option => (
          <MenuItem
            key={option.value}
            onClick={() => handleStatusSelect(option.value)}
            selected={
              anchorEl &&
              stages.find(s => s.id === anchorEl.stageId)?.status ===
                option.value
            }
          >
            <ListItemIcon>{option.icon}</ListItemIcon>
            <ListItemText>{option.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

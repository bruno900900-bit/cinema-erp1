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
    case StageStatus.SKIPPED:
      return <Cancel {...props} sx={{ color: '#757575' }} />;
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
    [StageStatus.SKIPPED]: 'Pulada',
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
      value: StageStatus.SKIPPED,
      label: '⏭️ Pular Etapa',
      icon: getStatusIcon(StageStatus.SKIPPED, 'small'),
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

      {/* Timeline Horizontal */}
      <Box sx={{ position: 'relative', overflowX: 'auto', pb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            gap: 0,
            minWidth: 'max-content',
            position: 'relative',
          }}
        >
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
              <React.Fragment key={stage.id}>
                {/* Stage Item */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: 120,
                    position: 'relative',
                  }}
                >
                  {/* Timeline Dot */}
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: 'background.paper',
                      border: 3,
                      borderColor:
                        stage.status === StageStatus.COMPLETED
                          ? 'success.main'
                          : stage.status === StageStatus.IN_PROGRESS
                          ? 'warning.main'
                          : stage.status === StageStatus.SKIPPED
                          ? 'grey.400'
                          : 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                      mb: 1,
                    }}
                  >
                    {getStatusIcon(stage.status, 'small')}
                  </Box>

                  {/* Stage Content */}
                  <Box sx={{ textAlign: 'center', px: 1 }}>
                    <Typography
                      variant="caption"
                      fontWeight="medium"
                      sx={{ display: 'block', mb: 0.5 }}
                    >
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
                        fontSize: '0.65rem',
                        height: 20,
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: 1,
                        },
                      }}
                    />

                    {/* User Attribution */}
                    {(modifiedBy || modifiedDate) && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5, fontSize: '0.65rem' }}
                      >
                        {modifiedBy && `${modifiedBy}`}
                        {modifiedDate && (
                          <Box
                            component="span"
                            sx={{ display: 'block', fontSize: '0.6rem' }}
                          >
                            {modifiedDate}
                          </Box>
                        )}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Horizontal Connector Line */}
                {index < sortedStages.length - 1 && (
                  <Box
                    sx={{
                      alignSelf: 'flex-start',
                      mt: '16px',
                      height: 3,
                      flex: '1 1 40px',
                      minWidth: 40,
                      maxWidth: 80,
                      bgcolor:
                        stage.status === StageStatus.COMPLETED
                          ? 'success.main'
                          : 'divider',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </Box>
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

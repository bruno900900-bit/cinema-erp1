import React from 'react';
import { Box, Chip, Typography, Tooltip } from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Cancel,
  Schedule,
  HourglassEmpty,
} from '@mui/icons-material';
import { ProjectLocationStage, StageStatus } from '../../types/user';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LocationStageTimelineProps {
  stages: ProjectLocationStage[];
  onAddStage?: () => void;
  onDeleteStage?: (stageId: number) => void;
  onUpdateStage?: (stageId: number, status: string) => void;
  maxStages?: number;
}

const getStatusIcon = (status: StageStatus) => {
  const iconProps = { fontSize: 'small' as const };

  switch (status) {
    case 'completed':
      return <CheckCircle {...iconProps} sx={{ color: '#4caf50' }} />;
    case 'in_progress':
      return <HourglassEmpty {...iconProps} sx={{ color: '#ff9800' }} />;
    case 'blocked':
      return <Cancel {...iconProps} sx={{ color: '#f44336' }} />;
    case 'pending':
      return <Schedule {...iconProps} sx={{ color: '#9e9e9e' }} />;
    default:
      return <RadioButtonUnchecked {...iconProps} sx={{ color: '#9e9e9e' }} />;
  }
};

const getStatusColor = (
  status: StageStatus
): 'success' | 'warning' | 'error' | 'default' => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'warning';
    case 'blocked':
      return 'error';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: StageStatus): string => {
  const labels: Record<StageStatus, string> = {
    pending: 'Pendente',
    in_progress: 'Em Progresso',
    completed: 'Concluída',
    blocked: 'Bloqueada',
    cancelled: 'Cancelada',
  };
  return labels[status] || status;
};

export default function LocationStageTimeline({
  stages,
  onAddStage,
  onDeleteStage,
  onUpdateStage,
  maxStages = 7,
}: LocationStageTimelineProps) {
  if (!stages || stages.length === 0) {
    return null;
  }

  // Sort by order/index and limit to maxStages
  const sortedStages = [...stages]
    .sort(
      (a, b) =>
        ((a as any).order || (a as any).order_index || 0) -
        ((b as any).order || (b as any).order_index || 0)
    )
    .slice(0, maxStages);

  const completedCount = sortedStages.filter(
    s => s.status === 'completed'
  ).length;

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Etapas: {completedCount}/{sortedStages.length}
        </Typography>
        {onAddStage && sortedStages.length < maxStages && (
          <Chip
            label="+ Etapa"
            size="small"
            onClick={onAddStage}
            sx={{
              fontSize: 10,
              height: 20,
              cursor: 'pointer',
              bgcolor: '#667eea',
              color: '#fff',
              '&:hover': { bgcolor: '#5a6fd6' },
            }}
          />
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {sortedStages.map((stage, index) => {
          const tooltipContent = (
            <Box sx={{ p: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                {stage.title}
              </Typography>
              <br />
              <Typography variant="caption">
                {getStatusLabel(stage.status)}
              </Typography>
              {stage.responsible_user?.full_name && (
                <>
                  <br />
                  <Typography variant="caption">
                    👤 {stage.responsible_user.full_name}
                  </Typography>
                </>
              )}
            </Box>
          );

          return (
            <React.Fragment key={stage.id}>
              <Tooltip title={tooltipContent} arrow>
                <Chip
                  icon={getStatusIcon(stage.status)}
                  label={`${index + 1}`}
                  size="small"
                  color={getStatusColor(stage.status)}
                  variant={stage.status === 'completed' ? 'filled' : 'outlined'}
                  onClick={
                    onUpdateStage
                      ? () =>
                          onUpdateStage(
                            stage.id,
                            stage.status === 'completed'
                              ? 'pending'
                              : 'completed'
                          )
                      : undefined
                  }
                  onDelete={
                    onDeleteStage ? () => onDeleteStage(stage.id) : undefined
                  }
                  sx={{
                    fontSize: 11,
                    height: 24,
                    cursor: onUpdateStage ? 'pointer' : 'default',
                    '& .MuiChip-deleteIcon': {
                      fontSize: 14,
                      display: 'none',
                    },
                    '&:hover .MuiChip-deleteIcon': {
                      display: 'block',
                    },
                  }}
                />
              </Tooltip>

              {index < sortedStages.length - 1 && (
                <Box
                  sx={{
                    width: 8,
                    height: 2,
                    backgroundColor:
                      sortedStages[index + 1].status === 'completed'
                        ? '#4caf50'
                        : '#404040',
                    alignSelf: 'center',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </Box>

      {stages.length > maxStages && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 0.5, display: 'block' }}
        >
          +{stages.length - maxStages} etapas ocultas
        </Typography>
      )}
    </Box>
  );
}

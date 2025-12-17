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
}: LocationStageTimelineProps) {
  if (!stages || stages.length === 0) {
    return null;
  }

  const sortedStages = [...stages].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="subtitle2"
        gutterBottom
        sx={{ mb: 2, color: 'text.secondary' }}
      >
        📊 Timeline das Etapas
      </Typography>

      <Box
        sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}
      >
        {sortedStages.map((stage, index) => {
          const modifiedDate = stage.status_changed_at
            ? formatDistanceToNow(new Date(stage.status_changed_at), {
                addSuffix: true,
                locale: ptBR,
              })
            : null;

          const modifiedBy =
            stage.status_changed_by_user?.full_name ||
            stage.responsible_user?.full_name;

          const tooltipContent = (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                {stage.title}
              </Typography>
              <br />
              <Typography variant="caption">
                Status: {getStatusLabel(stage.status)}
              </Typography>
              {modifiedBy && (
                <>
                  <br />
                  <Typography variant="caption">Por: {modifiedBy}</Typography>
                </>
              )}
              {modifiedDate && (
                <>
                  <br />
                  <Typography variant="caption">{modifiedDate}</Typography>
                </>
              )}
            </Box>
          );

          return (
            <React.Fragment key={stage.id}>
              <Tooltip title={tooltipContent} arrow>
                <Chip
                  icon={getStatusIcon(stage.status)}
                  label={stage.title}
                  size="small"
                  color={getStatusColor(stage.status)}
                  variant={stage.status === 'completed' ? 'filled' : 'outlined'}
                  sx={{
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                    },
                  }}
                />
              </Tooltip>

              {index < sortedStages.length - 1 && (
                <Box
                  sx={{
                    width: 16,
                    height: 2,
                    backgroundColor:
                      sortedStages[index + 1].status === 'completed'
                        ? '#4caf50'
                        : '#e0e0e0',
                    alignSelf: 'center',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </Box>

      <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary">
          {sortedStages.filter(s => s.status === 'completed').length} /{' '}
          {sortedStages.length} concluídas
        </Typography>
        {sortedStages.some(s => s.status === 'in_progress') && (
          <Chip
            label="Em andamento"
            size="small"
            color="warning"
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
        )}
        {sortedStages.some(s => s.status === 'blocked') && (
          <Chip
            label="Bloqueada"
            size="small"
            color="error"
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
        )}
      </Box>
    </Box>
  );
}

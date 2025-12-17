import React from 'react';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  PlayArrow,
  Pause,
  Schedule,
  Cancel,
  TrendingFlat,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import {
  projectLocationStageService,
  StageHistoryEntry,
} from '../../services/projectLocationStageService';
import { StageStatus } from '../../types/user';
import { formatDateBR } from '../../utils/date';

interface StageHistoryTimelineProps {
  stageId: number;
}

const statusConfig: Record<
  StageStatus,
  { label: string; icon: React.ReactNode; color: string }
> = {
  [StageStatus.PENDING]: {
    label: 'Pendente',
    icon: <Schedule sx={{ fontSize: 16 }} />,
    color: '#9e9e9e',
  },
  [StageStatus.IN_PROGRESS]: {
    label: 'Em Andamento',
    icon: <PlayArrow sx={{ fontSize: 16 }} />,
    color: '#2196f3',
  },
  [StageStatus.COMPLETED]: {
    label: 'Concluída',
    icon: <CheckCircle sx={{ fontSize: 16 }} />,
    color: '#4caf50',
  },
  [StageStatus.ON_HOLD]: {
    label: 'Em Espera',
    icon: <Pause sx={{ fontSize: 16 }} />,
    color: '#ff9800',
  },
  [StageStatus.CANCELLED]: {
    label: 'Cancelada',
    icon: <Cancel sx={{ fontSize: 16 }} />,
    color: '#f44336',
  },
};

export function StageHistoryTimeline({ stageId }: StageHistoryTimelineProps) {
  const {
    data: history = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['stage-history', stageId],
    queryFn: () => projectLocationStageService.getStageHistory(stageId),
  });

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
        Erro ao carregar histórico. Tente novamente.
      </Alert>
    );
  }

  if (history.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Ainda não há histórico de mudanças para esta etapa.
      </Alert>
    );
  }

  return (
    <Timeline position="right">
      {history.map((entry, index) => {
        const config = statusConfig[entry.new_status];
        const prevConfig = entry.previous_status
          ? statusConfig[entry.previous_status]
          : null;

        return (
          <TimelineItem key={entry.id}>
            <TimelineOppositeContent
              color="text.secondary"
              sx={{ flex: 0.3, pr: 2 }}
            >
              <Typography variant="caption" display="block">
                {new Date(entry.changed_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Typography>
              <Typography
                variant="caption"
                display="block"
                color="text.disabled"
              >
                {new Date(entry.changed_at).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
            </TimelineOppositeContent>

            <TimelineSeparator>
              <TimelineDot
                sx={{
                  backgroundColor: config.color,
                  borderColor: config.color,
                }}
              >
                {config.icon}
              </TimelineDot>
              {index < history.length - 1 && <TimelineConnector />}
            </TimelineSeparator>

            <TimelineContent>
              <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                {/* Status Change */}
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  {prevConfig && (
                    <>
                      <Chip
                        label={prevConfig.label}
                        size="small"
                        sx={{
                          backgroundColor: `${prevConfig.color}20`,
                          color: prevConfig.color,
                          borderColor: prevConfig.color,
                        }}
                        variant="outlined"
                      />
                      <TrendingFlat sx={{ color: 'text.secondary' }} />
                    </>
                  )}
                  <Chip
                    label={config.label}
                    size="small"
                    sx={{
                      backgroundColor: `${config.color}20`,
                      color: config.color,
                      borderColor: config.color,
                      fontWeight: 'bold',
                    }}
                    variant="outlined"
                  />
                  {entry.new_completion !== entry.previous_completion && (
                    <Typography variant="caption" color="text.secondary">
                      ({entry.previous_completion?.toFixed(0)}% →{' '}
                      {entry.new_completion.toFixed(0)}%)
                    </Typography>
                  )}
                </Box>

                {/* User Info */}
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}
                >
                  <Avatar
                    src={entry.changed_by.avatar_url}
                    sx={{ width: 24, height: 24 }}
                  >
                    {entry.changed_by.full_name?.charAt(0)}
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    {entry.changed_by.full_name}
                  </Typography>
                </Box>

                {/* Notes */}
                {entry.change_notes && (
                  <Box
                    sx={{
                      mt: 1,
                      p: 1,
                      backgroundColor: 'action.hover',
                      borderRadius: 1,
                      borderLeft: `3px solid ${config.color}`,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {entry.change_notes}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}

export default StageHistoryTimeline;

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import {
  History,
  CheckCircle,
  PlayArrow,
  Schedule,
  Pause,
  Cancel,
} from '@mui/icons-material';
import { ProjectLocationStage, StageStatus } from '../../types/user';
import StageStatusManager from './StageStatusManager';
import StageHistoryTimeline from './StageHistoryTimeline';

interface SimpleStageListProps {
  stages: ProjectLocationStage[];
}

const statusIcons: Record<StageStatus, React.ReactNode> = {
  [StageStatus.PENDING]: <Schedule sx={{ fontSize: 16 }} />,
  [StageStatus.IN_PROGRESS]: <PlayArrow sx={{ fontSize: 16 }} />,
  [StageStatus.COMPLETED]: <CheckCircle sx={{ fontSize: 16 }} />,
  [StageStatus.ON_HOLD]: <Pause sx={{ fontSize: 16 }} />,
  [StageStatus.CANCELLED]: <Cancel sx={{ fontSize: 16 }} />,
};

const statusColors: Record<StageStatus, string> = {
  [StageStatus.PENDING]: '#9e9e9e',
  [StageStatus.IN_PROGRESS]: '#2196f3',
  [StageStatus.COMPLETED]: '#4caf50',
  [StageStatus.ON_HOLD]: '#ff9800',
  [StageStatus.CANCELLED]: '#f44336',
};

export default function SimpleStageList({ stages }: SimpleStageListProps) {
  const [historyDialogOpen, setHistoryDialogOpen] = React.useState(false);
  const [selectedStageId, setSelectedStageId] = React.useState<number | null>(
    null
  );

  if (!stages || stages.length === 0) {
    return (
      <Paper
        sx={{ p: 3, textAlign: 'center', backgroundColor: 'action.hover' }}
      >
        <Typography color="text.secondary">Nenhuma etapa encontrada</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {stages.map(stage => (
        <Paper key={stage.id} elevation={1} sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="h6" gutterBottom>
                {stage.title}
              </Typography>
              {stage.description && (
                <Typography variant="body2" color="text.secondary">
                  {stage.description}
                </Typography>
              )}
            </Box>
            <Button
              size="small"
              startIcon={<History />}
              onClick={() => {
                setSelectedStageId(stage.id);
                setHistoryDialogOpen(true);
              }}
            >
              Histórico
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: 1, maxWidth: 300 }}>
              <StageStatusManager stage={stage} compact={false} />
            </Box>

            {stage.status_changed_by_user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  src={stage.status_changed_by_user.avatar_url}
                  sx={{ width: 24, height: 24 }}
                >
                  {stage.status_changed_by_user.full_name?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {stage.status_changed_by_user.full_name}
                  </Typography>
                  {stage.status_changed_at && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', fontSize: '0.7rem' }}
                    >
                      {new Date(stage.status_changed_at).toLocaleString(
                        'pt-BR',
                        {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            <Chip
              label={`${stage.completion_percentage?.toFixed(0) || 0}%`}
              size="small"
              sx={{ minWidth: 60 }}
            />
          </Box>
        </Paper>
      ))}

      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Histórico de Mudanças</DialogTitle>
        <DialogContent>
          {selectedStageId && (
            <StageHistoryTimeline stageId={selectedStageId} />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

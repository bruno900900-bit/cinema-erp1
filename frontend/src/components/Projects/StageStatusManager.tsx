import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  TextField,
  Alert,
  Box,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  PlayArrow,
  Pause,
  Schedule,
  Cancel,
} from '@mui/icons-material';
import { StageStatus, ProjectLocationStage } from '../../types/user';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectLocationStageService } from '../../services/projectLocationStageService';

interface StageStatusManagerProps {
  stage: ProjectLocationStage;
  onStatusChange?: (newStatus: StageStatus) => void;
  compact?: boolean;
}

const statusConfig: Record<
  StageStatus,
  { label: string; icon: React.ReactNode; color: string }
> = {
  [StageStatus.PENDING]: {
    label: 'Pendente',
    icon: <Schedule />,
    color: '#9e9e9e',
  },
  [StageStatus.IN_PROGRESS]: {
    label: 'Em Andamento',
    icon: <PlayArrow />,
    color: '#2196f3',
  },
  [StageStatus.COMPLETED]: {
    label: 'Concluída',
    icon: <CheckCircle />,
    color: '#4caf50',
  },
  [StageStatus.ON_HOLD]: {
    label: 'Em Espera',
    icon: <Pause />,
    color: '#ff9800',
  },
  [StageStatus.CANCELLED]: {
    label: 'Cancelada',
    icon: <Cancel />,
    color: '#f44336',
  },
};

export function StageStatusManager({
  stage,
  onStatusChange,
  compact = false,
}: StageStatusManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<StageStatus | null>(
    null
  );
  const [notes, setNotes] = useState('');

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({
      stageId,
      status,
      notes,
    }: {
      stageId: number;
      status: StageStatus;
      notes?: string;
    }) => projectLocationStageService.updateStageStatus(stageId, status, notes),
    onSuccess: data => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['project-stages'] });
      queryClient.invalidateQueries({ queryKey: ['project-locations'] });

      // Call callback if provided
      if (onStatusChange && selectedStatus) {
        onStatusChange(selectedStatus);
      }

      // Close dialog
      setDialogOpen(false);
      setNotes('');
      setSelectedStatus(null);
    },
    onError: error => {
      console.error('Error updating stage status:', error);
    },
  });

  const handleStatusSelectChange = (event: SelectChangeEvent<StageStatus>) => {
    const newStatus = event.target.value as StageStatus;
    setSelectedStatus(newStatus);
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedStatus) return;

    updateMutation.mutate({
      stageId: stage.id,
      status: selectedStatus,
      notes: notes.trim() || undefined,
    });
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setNotes('');
    setSelectedStatus(null);
  };

  return (
    <>
      <FormControl
        size="small"
        fullWidth={!compact}
        sx={{ minWidth: compact ? 140 : 200 }}
      >
        {!compact && <InputLabel>Status</InputLabel>}
        <Select
          value={stage.status}
          onChange={handleStatusSelectChange}
          label={!compact ? 'Status' : undefined}
          size="small"
          disabled={updateMutation.isPending}
          sx={{
            backgroundColor: `${statusConfig[stage.status]?.color}15`,
            '& .MuiSelect-select': {
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            },
          }}
        >
          {Object.entries(statusConfig).map(([status, config]) => (
            <MenuItem key={status} value={status}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ color: config.color, display: 'flex' }}>
                  {config.icon}
                </Box>
                {config.label}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Dialog open={dialogOpen} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmar Mudança de Status</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Alert severity="info">
              Você está alterando de{' '}
              <strong>{statusConfig[stage.status]?.label}</strong> para{' '}
              <strong>
                {selectedStatus && statusConfig[selectedStatus]?.label}
              </strong>
            </Alert>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notas (opcional)"
              placeholder="Adicione observações sobre esta mudança..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              helperText="Estas notas ficarão registradas no histórico da etapa"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} disabled={updateMutation.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            disabled={updateMutation.isPending || !selectedStatus}
            startIcon={
              updateMutation.isPending && <CircularProgress size={16} />
            }
          >
            {updateMutation.isPending ? 'Atualizando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default StageStatusManager;

import React from 'react';
import { Box, Typography, Paper, Button, Chip, Stack } from '@mui/material';
import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  locationDemandService,
  LocationDemand,
  priorityColors,
  priorityLabels,
  statusLabels,
  statusColors,
} from '../../services/locationDemandService';
import DemandFormModal from '../Demands/DemandFormModal';
import { useState } from 'react';
import { formatDateBR } from '../../utils/date';

interface VisitLocationDemandsProps {
  visitLocationId: number;
  projectId: number;
}

export default function VisitLocationDemands({
  visitLocationId,
  projectId,
}: VisitLocationDemandsProps) {
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState<LocationDemand | null>(
    null
  );
  const queryClient = useQueryClient();

  // Fetch demands for this visit location
  const {
    data: demands = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['visit-location-demands', visitLocationId],
    queryFn: () =>
      locationDemandService.getDemandsByVisitLocation(visitLocationId),
    retry: 1, // Only retry once to avoid infinite loading
    staleTime: 30000, // Cache for 30 seconds
  });

  const handleDemandSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ['visit-location-demands', visitLocationId],
    });
    setIsDemandModalOpen(false);
    setSelectedDemand(null);
  };

  const getStatusChip = (status: string) => {
    return (
      <Chip
        label={statusLabels[status as keyof typeof statusLabels] || status}
        size="small"
        sx={{
          bgcolor: statusColors[status as keyof typeof statusColors] || '#ccc',
          color: '#fff',
          fontWeight: 500,
        }}
      />
    );
  };

  const getPriorityChip = (priority: string) => {
    return (
      <Chip
        label={
          priorityLabels[priority as keyof typeof priorityLabels] || priority
        }
        size="small"
        variant="outlined"
        sx={{
          borderColor:
            priorityColors[priority as keyof typeof priorityColors] || '#ccc',
          color:
            priorityColors[priority as keyof typeof priorityColors] || '#ccc',
          fontWeight: 500,
        }}
      />
    );
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6">Tarefas/Demandas</Typography>
          <Chip label={demands.length} size="small" color="primary" />
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsDemandModalOpen(true)}
        >
          Nova Tarefa
        </Button>
      </Box>

      {isError ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'error.dark' }}>
          <Typography variant="h6" color="error.light" gutterBottom>
            Erro ao carregar tarefas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {error instanceof Error ? error.message : 'Erro desconhecido'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Verifique se a migração SQL foi executada corretamente no Supabase.
          </Typography>
        </Paper>
      ) : isLoading ? (
        <Typography>Carregando...</Typography>
      ) : demands.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
          <AssignmentIcon sx={{ fontSize: 60, color: 'grey.300', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhuma tarefa cadastrada
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Adicione tarefas para organizar o trabalho nesta locação
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsDemandModalOpen(true)}
          >
            Adicionar Primeira Tarefa
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {demands.map(demand => (
            <Paper
              key={demand.id}
              sx={{
                p: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
                borderLeft: `4px solid ${priorityColors[demand.priority]}`,
              }}
              onClick={() => {
                setSelectedDemand(demand);
                setIsDemandModalOpen(true);
              }}
            >
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
              >
                <Typography variant="subtitle1" fontWeight={600}>
                  {demand.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {getStatusChip(demand.status)}
                  {getPriorityChip(demand.priority)}
                </Box>
              </Box>

              {demand.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {demand.description}
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                {demand.assigned_user_name && (
                  <Chip
                    label={`Responsável: ${demand.assigned_user_name}`}
                    size="small"
                    variant="outlined"
                  />
                )}
                {demand.due_date && (
                  <Chip
                    label={`Vencimento: ${formatDateBR(demand.due_date)}`}
                    size="small"
                    variant="outlined"
                    color={demand.is_overdue ? 'error' : 'default'}
                  />
                )}
                {demand.category && (
                  <Chip
                    label={demand.category}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Paper>
          ))}
        </Stack>
      )}

      <DemandFormModal
        open={isDemandModalOpen}
        onClose={() => {
          setIsDemandModalOpen(false);
          setSelectedDemand(null);
        }}
        onSuccess={handleDemandSuccess}
        projectId={projectId}
        visitLocationId={visitLocationId}
        projectLocations={[]} // Not needed for visit locations
        demand={selectedDemand}
      />
    </Box>
  );
}

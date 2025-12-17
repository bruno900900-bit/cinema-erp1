import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, CircularProgress } from '@mui/material';
import { ProjectLocation, StageStatus } from '../../types/user';
import { projectLocationStageService } from '../../services/projectLocationStageService';
import InteractiveStageTimeline from './InteractiveStageTimeline';
import { toast } from 'react-toastify';

interface LocationStagesLoaderProps {
  projectId: number | string;
  location: ProjectLocation;
  isExpanded: boolean;
  onStageStatusUpdate: (stageId: number, newStatus: StageStatus) => void;
}

/**
 * Componente separado para carregar stages de uma locação
 * Necessário para usar hooks corretamente (não pode ser dentro de map)
 */
export default function LocationStagesLoader({
  projectId,
  location,
  isExpanded,
  onStageStatusUpdate,
}: LocationStagesLoaderProps) {
  const queryClient = useQueryClient();
  const [isCreatingStages, setIsCreatingStages] = useState(false);

  // Query para buscar stages
  const {
    data: stages = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['project-location-stages', location.id],
    queryFn: async () => {
      try {
        return await projectLocationStageService.getStagesByProjectLocation(
          Number(location.id)
        );
      } catch (error) {
        console.warn('Erro ao carregar stages:', error);
        return [];
      }
    },
    enabled: isExpanded,
  });

  // Mutation para atualizar status de stage
  const statusUpdateMutation = useMutation({
    mutationFn: async ({
      stageId,
      status,
    }: {
      stageId: number;
      status: StageStatus;
    }) => {
      console.log('🔄 Updating stage status:', stageId, status);
      return await projectLocationStageService.updateStageStatus(
        stageId,
        status
      );
    },
    onSuccess: async (data, variables) => {
      console.log('✅ Stage status updated successfully');
      toast.success(
        `Status atualizado para: ${getStatusLabel(variables.status)}`
      );

      // Invalidar e refetch
      await queryClient.invalidateQueries({
        queryKey: ['project-location-stages', location.id],
        refetchType: 'active',
      });
      await queryClient.refetchQueries({
        queryKey: ['project-location-stages', location.id],
      });

      // Chamar callback se fornecido
      onStageStatusUpdate(variables.stageId, variables.status);
    },
    onError: error => {
      console.error('❌ Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status da etapa');
    },
  });

  // Auto-criar stages padrão quando não existe nenhuma
  useEffect(() => {
    const createDefaultStages = async () => {
      if (
        isExpanded &&
        !isLoading &&
        stages.length === 0 &&
        !isCreatingStages
      ) {
        setIsCreatingStages(true);
        console.log('📝 Creating default stages for location:', location.id);

        try {
          await projectLocationStageService.createDefaultStages(
            Number(location.id)
          );
          console.log('✅ Default stages created successfully');

          // Refetch para mostrar as etapas criadas
          await refetch();
        } catch (error) {
          console.error('❌ Error creating default stages:', error);
        } finally {
          setIsCreatingStages(false);
        }
      }
    };

    createDefaultStages();
  }, [
    isExpanded,
    isLoading,
    stages.length,
    location.id,
    isCreatingStages,
    refetch,
  ]);

  // Handler para mudança de status
  const handleStatusChange = async (
    stageId: number,
    newStatus: StageStatus
  ) => {
    await statusUpdateMutation.mutateAsync({ stageId, status: newStatus });
  };

  if (isLoading || isCreatingStages) {
    return (
      <Box
        sx={{
          py: 2,
          textAlign: 'center',
          display: 'flex',
          gap: 2,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress size={20} />
        <span style={{ opacity: 0.6 }}>
          {isCreatingStages
            ? 'Criando etapas padrão...'
            : 'Carregando etapas...'}
        </span>
      </Box>
    );
  }

  if (stages.length === 0) {
    return (
      <Box sx={{ py: 2, textAlign: 'center', opacity: 0.6 }}>
        Aguardando criação de etapas...
      </Box>
    );
  }

  return (
    <InteractiveStageTimeline
      stages={stages}
      onStatusChange={handleStatusChange}
    />
  );
}

// Helper para labels
function getStatusLabel(status: StageStatus): string {
  const labels: Record<StageStatus, string> = {
    pending: 'Pendente',
    in_progress: 'Em Progresso',
    completed: 'Concluída',
    cancelled: 'Cancelada',
    on_hold: 'Em Espera',
  };
  return labels[status] || status;
}

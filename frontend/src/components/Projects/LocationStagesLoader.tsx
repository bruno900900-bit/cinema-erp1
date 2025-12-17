import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box } from '@mui/material';
import { ProjectLocation, StageStatus } from '../../types/user';
import { projectLocationStageService } from '../../services/projectLocationStageService';
import LocationStageTimeline from './LocationStageTimeline';

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
  // ✅ Agora podemos usar useQuery corretamente
  const { data: stages = [], isLoading } = useQuery({
    queryKey: ['project-location-stages', location.id], // Usar o ID da project_location
    queryFn: async () => {
      try {
        // Buscar stages pelo ID da project_location
        return await projectLocationStageService.getStagesByProjectLocation(
          Number(location.id)
        );
      } catch (error) {
        console.warn('Erro ao carregar stages:', error);
        return [];
      }
    },
    enabled: isExpanded, // Só carrega quando expandido
  });

  if (isLoading) {
    return (
      <Box sx={{ py: 2, textAlign: 'center', opacity: 0.6 }}>
        Carregando etapas...
      </Box>
    );
  }

  if (stages.length === 0) {
    return (
      <Box sx={{ py: 2, textAlign: 'center', opacity: 0.6 }}>
        Nenhuma etapa criada para esta locação
      </Box>
    );
  }

  return (
    <LocationStageTimeline
      stages={stages}
      compact={!isExpanded}
      onStageClick={stage => console.log('Stage clicked:', stage)}
      onStageStatusUpdate={onStageStatusUpdate}
    />
  );
}

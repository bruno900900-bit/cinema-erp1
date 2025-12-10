import React from 'react';
import { Box, Chip, Typography, Button, Stack } from '@mui/material';
import { Clear } from '@mui/icons-material';
import {
  AdvancedSearchParams,
  LocationStatus,
  SectorType,
} from '../../types/user';

interface LocationFiltersProps {
  activeFilters: Partial<AdvancedSearchParams>;
  onRemoveFilter: (key: keyof AdvancedSearchParams) => void;
  onClearAll: () => void;
}

export default function LocationFilters({
  activeFilters,
  onRemoveFilter,
  onClearAll,
}: LocationFiltersProps) {
  const getStatusLabel = (status: LocationStatus) => {
    const labels: Record<LocationStatus, string> = {
      [LocationStatus.DRAFT]: 'Rascunho',
      [LocationStatus.PROSPECTING]: 'Prospecção',
      [LocationStatus.PENDING_APPROVAL]: 'Aguardando Aprovação',
      [LocationStatus.APPROVED]: 'Aprovado',
      [LocationStatus.SCHEDULED]: 'Agendado',
      [LocationStatus.COMPLETED]: 'Concluído',
      [LocationStatus.ARCHIVED]: 'Arquivado',
    };
    return labels[status];
  };

  const getSectorLabel = (sector: SectorType) => {
    return sector === SectorType.CINEMA ? 'Cinema' : 'Publicidade';
  };

  const getFilterLabel = (key: keyof AdvancedSearchParams, value: any) => {
    switch (key) {
      case 'status':
        return `Status: ${getStatusLabel(value as LocationStatus)}`;
      case 'sector_type':
        return `Setor: ${getSectorLabel(value as SectorType)}`;
      case 'city':
        return `Cidade: ${value}`;
      case 'title':
        return `Título: ${value}`;
      case 'supplier_id':
        return `Fornecedor: ${value}`;
      case 'min_price':
        return `Preço: R$ ${value}+`;
      case 'max_price':
        return `Preço: até R$ ${value}`;
      case 'min_capacity':
        return `Capacidade: ${value}+ pessoas`;
      case 'max_capacity':
        return `Capacidade: até ${value} pessoas`;
      case 'has_parking':
        return value ? 'Com estacionamento' : 'Sem estacionamento';
      case 'has_electricity':
        return value ? 'Com eletricidade' : 'Sem eletricidade';
      case 'has_water':
        return value ? 'Com água' : 'Sem água';
      case 'has_bathroom':
        return value ? 'Com banheiro' : 'Sem banheiro';
      case 'has_kitchen':
        return value ? 'Com cozinha' : 'Sem cozinha';
      case 'has_air_conditioning':
        return value ? 'Com ar condicionado' : 'Sem ar condicionado';
      default:
        return `${key}: ${value}`;
    }
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mr: 2 }}>
          Filtros Ativos:
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Clear />}
          onClick={onClearAll}
        >
          Limpar Todos
        </Button>
      </Box>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {Object.entries(activeFilters).map(([key, value]) => {
          if (value === undefined || value === null || value === '')
            return null;

          return (
            <Chip
              key={key}
              label={getFilterLabel(key as keyof AdvancedSearchParams, value)}
              onDelete={() => onRemoveFilter(key as keyof AdvancedSearchParams)}
              color="primary"
              variant="outlined"
              size="small"
            />
          );
        })}
      </Stack>
    </Box>
  );
}

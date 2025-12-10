import React, { useState } from 'react'
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Checkbox,
  Button,
  Typography,
  Divider,
  Chip,
  Autocomplete,
} from '@mui/material'
import { FilterList, Clear } from '@mui/icons-material'
import { AdvancedSearchParams, LocationStatus, SectorType, SpaceType } from '../../types/user'

interface AdvancedSearchFormProps {
  filters: Partial<AdvancedSearchParams>
  onFiltersChange: (filters: Partial<AdvancedSearchParams>) => void
  onClearFilters: () => void
  tags: Array<{ id: string; name: string }>
}

export default function AdvancedSearchForm({
  filters,
  onFiltersChange,
  onClearFilters,
  tags,
}: AdvancedSearchFormProps) {
  const [localFilters, setLocalFilters] = useState<Partial<AdvancedSearchParams>>(filters)

  const handleFilterChange = (key: keyof AdvancedSearchParams, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
  }

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
  }

  const handleClearLocal = () => {
    setLocalFilters({})
    onClearFilters()
  }

  const getStatusLabel = (status: LocationStatus) => {
    const labels: Record<LocationStatus, string> = {
      [LocationStatus.DRAFT]: 'Rascunho',
      [LocationStatus.PROSPECTING]: 'Prospecção',
      [LocationStatus.PENDING_APPROVAL]: 'Aguardando Aprovação',
      [LocationStatus.APPROVED]: 'Aprovado',
      [LocationStatus.SCHEDULED]: 'Agendado',
      [LocationStatus.COMPLETED]: 'Concluído',
      [LocationStatus.ARCHIVED]: 'Arquivado',
    }
    return labels[status]
  }

  const getSectorLabel = (sector: SectorType) => {
    return sector === SectorType.CINEMA ? 'Cinema' : 'Publicidade'
  }

  const getSpaceTypeLabel = (type: SpaceType) => {
    const labels: Record<SpaceType, string> = {
      [SpaceType.INDOOR]: 'Interno',
      [SpaceType.OUTDOOR]: 'Externo',
      [SpaceType.STUDIO]: 'Estúdio',
      [SpaceType.LOCATION]: 'Locação',
      [SpaceType.ROOM]: 'Sala',
      [SpaceType.AREA]: 'Área',
    }
    return labels[type]
  }

  return (
    <Box sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <FilterList sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Filtros Avançados
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Clear />}
          onClick={handleClearLocal}
        >
          Limpar
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Filtros de Texto */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Título da Locação"
            value={localFilters.title || ''}
            onChange={(e) => handleFilterChange('title', e.target.value)}
            placeholder="Buscar por título..."
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Cidade"
            value={localFilters.city || ''}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            placeholder="Filtrar por cidade..."
          />
        </Grid>

        {/* Filtros de Status e Tipo */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={localFilters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              label="Status"
            >
              <MenuItem value="">Todos os Status</MenuItem>
              {Object.values(LocationStatus).map((status) => (
                <MenuItem key={status} value={status}>
                  {getStatusLabel(status)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Tipo de Setor</InputLabel>
            <Select
              value={localFilters.sector_type || ''}
              onChange={(e) => handleFilterChange('sector_type', e.target.value)}
              label="Tipo de Setor"
            >
              <MenuItem value="">Todos os Setores</MenuItem>
              {Object.values(SectorType).map((sector) => (
                <MenuItem key={sector} value={sector}>
                  {getSectorLabel(sector)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Filtros de Preço */}
        <Grid item xs={12} md={6}>
          <Typography gutterBottom>Preço por Dia (R$)</Typography>
          <Box sx={{ px: 2 }}>
            <Slider
              value={[localFilters.min_price || 0, localFilters.max_price || 10000]}
              onChange={(_, newValue) => {
                handleFilterChange('min_price', newValue[0])
                handleFilterChange('max_price', newValue[1])
              }}
              valueLabelDisplay="auto"
              min={0}
              max={10000}
              step={100}
              marks={[
                { value: 0, label: 'R$ 0' },
                { value: 5000, label: 'R$ 5.000' },
                { value: 10000, label: 'R$ 10.000' },
              ]}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <TextField
              size="small"
              label="Mín"
              type="number"
              value={localFilters.min_price || ''}
              onChange={(e) => handleFilterChange('min_price', Number(e.target.value))}
              sx={{ width: '50%' }}
            />
            <TextField
              size="small"
              label="Máx"
              type="number"
              value={localFilters.max_price || ''}
              onChange={(e) => handleFilterChange('max_price', Number(e.target.value))}
              sx={{ width: '50%' }}
            />
          </Box>
        </Grid>

        {/* Filtros de Capacidade */}
        <Grid item xs={12} md={6}>
          <Typography gutterBottom>Capacidade (pessoas)</Typography>
          <Box sx={{ px: 2 }}>
            <Slider
              value={[localFilters.min_capacity || 0, localFilters.max_capacity || 500]}
              onChange={(_, newValue) => {
                handleFilterChange('min_capacity', newValue[0])
                handleFilterChange('max_capacity', newValue[1])
              }}
              valueLabelDisplay="auto"
              min={0}
              max={500}
              step={10}
              marks={[
                { value: 0, label: '0' },
                { value: 100, label: '100' },
                { value: 250, label: '250' },
                { value: 500, label: '500' },
              ]}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <TextField
              size="small"
              label="Mín"
              type="number"
              value={localFilters.min_capacity || ''}
              onChange={(e) => handleFilterChange('min_capacity', Number(e.target.value))}
              sx={{ width: '50%' }}
            />
            <TextField
              size="small"
              label="Máx"
              type="number"
              value={localFilters.max_capacity || ''}
              onChange={(e) => handleFilterChange('max_capacity', Number(e.target.value))}
              sx={{ width: '50%' }}
            />
          </Box>
        </Grid>

        {/* Filtros de Tipo de Espaço */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Tipo de Espaço</InputLabel>
            <Select
              value={localFilters.space_type || ''}
              onChange={(e) => handleFilterChange('space_type', e.target.value)}
              label="Tipo de Espaço"
            >
              <MenuItem value="">Todos os Tipos</MenuItem>
              {Object.values(SpaceType).map((type) => (
                <MenuItem key={type} value={type}>
                  {getSpaceTypeLabel(type)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Filtros de Tags */}
        <Grid item xs={12} md={6}>
          <Autocomplete
            multiple
            options={tags}
            getOptionLabel={(option) => option.name}
            value={localFilters.tags || []}
            onChange={(_, newValue) => handleFilterChange('tags', newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                placeholder="Selecionar tags..."
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.name}
                  {...getTagProps({ index })}
                  size="small"
                  variant="outlined"
                />
              ))
            }
          />
        </Grid>

        {/* Filtros de Data */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Disponível a partir de"
            type="date"
            value={localFilters.available_from || ''}
            onChange={(e) => handleFilterChange('available_from', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Disponível até"
            type="date"
            value={localFilters.available_to || ''}
            onChange={(e) => handleFilterChange('available_to', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Filtros de Características */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Características Especiais
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={localFilters.has_parking || false}
                  onChange={(e) => handleFilterChange('has_parking', e.target.checked)}
                />
              }
              label="Estacionamento"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={localFilters.has_electricity || false}
                  onChange={(e) => handleFilterChange('has_electricity', e.target.checked)}
                />
              }
              label="Eletricidade"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={localFilters.has_water || false}
                  onChange={(e) => handleFilterChange('has_water', e.target.checked)}
                />
              }
              label="Água"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={localFilters.has_bathroom || false}
                  onChange={(e) => handleFilterChange('has_bathroom', e.target.checked)}
                />
              }
              label="Banheiro"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={localFilters.has_kitchen || false}
                  onChange={(e) => handleFilterChange('has_kitchen', e.target.checked)}
                />
              }
              label="Cozinha"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={localFilters.has_air_conditioning || false}
                  onChange={(e) => handleFilterChange('has_air_conditioning', e.target.checked)}
                />
              }
              label="Ar Condicionado"
            />
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Botões de Ação */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={handleClearLocal}
        >
          Limpar Filtros
        </Button>
        <Button
          variant="contained"
          onClick={handleApplyFilters}
        >
          Aplicar Filtros
        </Button>
      </Box>
    </Box>
  )
}

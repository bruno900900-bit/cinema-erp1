import React from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  Stack,
  InputAdornment,
  IconButton,
  Collapse,
  Paper,
  Checkbox,
  ListItemText,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search,
  Clear,
  FilterList,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import {
  DemandPriority,
  DemandStatus,
} from '../../services/locationDemandService';
import { ProjectLocation } from '../../types/user';

export interface DemandFilters {
  search: string;
  locations: number[]; // Empty = all
  priorities: DemandPriority[]; // Empty = all
  statuses: DemandStatus[]; // Default: exclude completed
  assignees: number[]; // Empty = all, -1 = unassigned
  sortBy:
    | 'priority'
    | 'created_asc'
    | 'created_desc'
    | 'due_asc'
    | 'due_desc'
    | 'alpha';
  overdueOnly: boolean;
  myTasksOnly: boolean;
}

export const defaultFilters: DemandFilters = {
  search: '',
  locations: [],
  priorities: [],
  statuses: ['pending', 'in_progress', 'on_hold'], // Exclude completed by default
  assignees: [],
  sortBy: 'priority',
  overdueOnly: false,
  myTasksOnly: false,
};

interface DemandFiltersProps {
  filters: DemandFilters;
  onFiltersChange: (filters: DemandFilters) => void;
  projectLocations: ProjectLocation[];
  availableAssignees: { id: number; name: string }[];
  currentUserId?: number;
}

const priorityOptions: {
  value: DemandPriority;
  label: string;
  color: string;
}[] = [
  { value: 'urgent', label: 'Urgente', color: '#d32f2f' },
  { value: 'high', label: 'Alta', color: '#f57c00' },
  { value: 'medium', label: 'Média', color: '#fbc02d' },
  { value: 'low', label: 'Baixa', color: '#689f38' },
];

const statusOptions: { value: DemandStatus; label: string }[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'on_hold', label: 'Pausado' },
  { value: 'completed', label: 'Concluído' },
  { value: 'cancelled', label: 'Cancelado' },
];

const sortOptions = [
  { value: 'priority', label: 'Prioridade' },
  { value: 'created_desc', label: 'Mais Recentes' },
  { value: 'created_asc', label: 'Mais Antigas' },
  { value: 'due_asc', label: 'Vencimento (Próximo)' },
  { value: 'due_desc', label: 'Vencimento (Distante)' },
  { value: 'alpha', label: 'Alfabética (A-Z)' },
];

export default function DemandFiltersComponent({
  filters,
  onFiltersChange,
  projectLocations,
  availableAssignees,
  currentUserId,
}: DemandFiltersProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const updateFilter = (key: keyof DemandFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters =
    filters.search ||
    filters.locations.length > 0 ||
    filters.priorities.length > 0 ||
    filters.statuses.length !== 3 || // Default is 3 statuses
    filters.assignees.length > 0 ||
    filters.overdueOnly ||
    filters.myTasksOnly ||
    filters.sortBy !== 'priority';

  const handleLocationChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value;
    updateFilter(
      'locations',
      typeof value === 'string' ? value.split(',').map(Number) : value
    );
  };

  const handlePriorityChange = (event: SelectChangeEvent<DemandPriority[]>) => {
    const value = event.target.value;
    updateFilter(
      'priorities',
      typeof value === 'string' ? value.split(',') : value
    );
  };

  const handleStatusChange = (event: SelectChangeEvent<DemandStatus[]>) => {
    const value = event.target.value;
    updateFilter(
      'statuses',
      typeof value === 'string' ? value.split(',') : value
    );
  };

  const handleAssigneeChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value;
    updateFilter(
      'assignees',
      typeof value === 'string' ? value.split(',').map(Number) : value
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{ p: 2, mb: 2, bgcolor: 'background.paper', borderRadius: 2 }}
    >
      <Stack spacing={2}>
        {/* Search and Quick Actions */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <TextField
            placeholder="Buscar demandas..."
            value={filters.search}
            onChange={e => updateFilter('search', e.target.value)}
            size="small"
            sx={{ flexGrow: 1, minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: filters.search && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => updateFilter('search', '')}
                  >
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterList />}
            endIcon={showAdvanced ? <ExpandLess /> : <ExpandMore />}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            Filtros {showAdvanced ? '▲' : '▼'}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<Clear />}
              onClick={clearAllFilters}
            >
              Limpar
            </Button>
          )}
        </Box>

        {/* Quick Filters */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {currentUserId && (
            <Chip
              label="Minhas Tarefas"
              clickable
              color={filters.myTasksOnly ? 'primary' : 'default'}
              onClick={() => updateFilter('myTasksOnly', !filters.myTasksOnly)}
              variant={filters.myTasksOnly ? 'filled' : 'outlined'}
            />
          )}
          <Chip
            label="Atrasadas"
            clickable
            color={filters.overdueOnly ? 'error' : 'default'}
            onClick={() => updateFilter('overdueOnly', !filters.overdueOnly)}
            variant={filters.overdueOnly ? 'filled' : 'outlined'}
          />
          {priorityOptions.slice(0, 2).map(priority => (
            <Chip
              key={priority.value}
              label={priority.label}
              clickable
              onClick={() => {
                const newPriorities = filters.priorities.includes(
                  priority.value
                )
                  ? filters.priorities.filter(p => p !== priority.value)
                  : [...filters.priorities, priority.value];
                updateFilter('priorities', newPriorities);
              }}
              variant={
                filters.priorities.includes(priority.value)
                  ? 'filled'
                  : 'outlined'
              }
              sx={{
                borderColor: priority.color,
                color: filters.priorities.includes(priority.value)
                  ? '#fff'
                  : priority.color,
                bgcolor: filters.priorities.includes(priority.value)
                  ? priority.color
                  : 'transparent',
              }}
            />
          ))}
        </Box>

        {/* Advanced Filters */}
        <Collapse in={showAdvanced}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {/* Location Filter */}
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Locações</InputLabel>
                <Select
                  multiple
                  value={filters.locations}
                  onChange={handleLocationChange}
                  input={<OutlinedInput label="Locações" />}
                  renderValue={selected =>
                    selected.length === 0
                      ? 'Todas'
                      : `${selected.length} selecionada${selected.length > 1 ? 's' : ''}`
                  }
                >
                  {projectLocations.map(loc => (
                    <MenuItem key={loc.id} value={parseInt(loc.id)}>
                      <Checkbox
                        checked={filters.locations.includes(parseInt(loc.id))}
                      />
                      <ListItemText
                        primary={loc.location?.title || `Locação ${loc.id}`}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Status Filter */}
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  multiple
                  value={filters.statuses}
                  onChange={handleStatusChange}
                  input={<OutlinedInput label="Status" />}
                  renderValue={selected =>
                    selected.length === 0
                      ? 'Nenhum'
                      : `${selected.length} status`
                  }
                >
                  {statusOptions.map(status => (
                    <MenuItem key={status.value} value={status.value}>
                      <Checkbox
                        checked={filters.statuses.includes(status.value)}
                      />
                      <ListItemText primary={status.label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Assignee Filter */}
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Responsável</InputLabel>
                <Select
                  multiple
                  value={filters.assignees}
                  onChange={handleAssigneeChange}
                  input={<OutlinedInput label="Responsável" />}
                  renderValue={selected =>
                    selected.length === 0
                      ? 'Todos'
                      : `${selected.length} selecionado${selected.length > 1 ? 's' : ''}`
                  }
                >
                  <MenuItem value={-1}>
                    <Checkbox checked={filters.assignees.includes(-1)} />
                    <ListItemText primary="Sem responsável" />
                  </MenuItem>
                  {availableAssignees.map(user => (
                    <MenuItem key={user.id} value={user.id}>
                      <Checkbox checked={filters.assignees.includes(user.id)} />
                      <ListItemText primary={user.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Sort By */}
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Ordenar por</InputLabel>
                <Select
                  value={filters.sortBy}
                  onChange={e => updateFilter('sortBy', e.target.value)}
                  label="Ordenar por"
                >
                  {sortOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Grid,
  Alert,
  CircularProgress,
  Autocomplete,
  Chip,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  locationDemandService,
  LocationDemand,
  LocationDemandCreate,
  LocationDemandUpdate,
  DemandPriority,
  DemandStatus,
  priorityLabels,
  priorityColors,
  statusLabels,
} from '../../services/locationDemandService';
import { ProjectLocation, User } from '../../types/user';
import { userService } from '../../services/userService';

interface DemandFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: number;
  projectLocationId?: number;
  projectLocations: ProjectLocation[];
  demand?: LocationDemand | null;
}

const CATEGORY_OPTIONS = [
  'Técnico',
  'Elétrica',
  'Cenografia',
  'Jurídico',
  'Produção',
  'Logística',
  'Equipamentos',
  'Segurança',
  'Limpeza',
  'Documentação',
  'Outro',
];

export default function DemandFormModal({
  open,
  onClose,
  onSuccess,
  projectId,
  projectLocationId,
  projectLocations,
  demand,
}: DemandFormModalProps) {
  const isEditing = !!demand;

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as DemandPriority,
    status: 'pending' as DemandStatus,
    category: '',
    project_location_id: projectLocationId || 0,
    assigned_user_id: null as number | null,
    due_date: null as Date | null,
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch users for assignment
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  });
  const users = usersData?.users || [];

  // Reset form when opening
  useEffect(() => {
    if (open) {
      if (demand) {
        setFormData({
          title: demand.title,
          description: demand.description || '',
          priority: demand.priority,
          status: demand.status,
          category: demand.category || '',
          project_location_id: demand.project_location_id,
          assigned_user_id: demand.assigned_user_id || null,
          due_date: demand.due_date ? new Date(demand.due_date) : null,
          notes: demand.notes || '',
        });
      } else {
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          status: 'pending',
          category: '',
          project_location_id:
            projectLocationId ||
            (projectLocations[0] ? parseInt(projectLocations[0].id) : 0),
          assigned_user_id: null,
          due_date: null,
          notes: '',
        });
      }
      setError(null);
    }
  }, [open, demand, projectLocationId, projectLocations]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: LocationDemandCreate) =>
      locationDemandService.createDemand(data),
    onSuccess: () => {
      onSuccess();
    },
    onError: (err: any) => {
      setError(err.message || 'Erro ao criar demanda');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: LocationDemandUpdate }) =>
      locationDemandService.updateDemand(id, data),
    onSuccess: () => {
      onSuccess();
    },
    onError: (err: any) => {
      setError(err.message || 'Erro ao atualizar demanda');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Título é obrigatório');
      return;
    }
    if (!formData.project_location_id) {
      setError('Selecione uma locação');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description || undefined,
      priority: formData.priority,
      status: formData.status,
      category: formData.category || undefined,
      assigned_user_id: formData.assigned_user_id || undefined,
      due_date: formData.due_date?.toISOString() || undefined,
      notes: formData.notes || undefined,
    };

    if (isEditing && demand) {
      updateMutation.mutate({ id: demand.id, data: payload });
    } else {
      createMutation.mutate({
        ...payload,
        project_id: projectId,
        project_location_id: formData.project_location_id,
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditing ? 'Editar Demanda' : 'Nova Demanda'}
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}

            {/* Location selector (only for new demands) */}
            {!isEditing && (
              <FormControl fullWidth required>
                <InputLabel>Locação</InputLabel>
                <Select
                  value={formData.project_location_id}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      project_location_id: Number(e.target.value),
                    }))
                  }
                  label="Locação"
                >
                  {projectLocations.map(loc => (
                    <MenuItem key={loc.id} value={parseInt(loc.id)}>
                      {loc.location?.title || `Locação ${loc.id}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Title */}
            <TextField
              label="Título"
              value={formData.title}
              onChange={e =>
                setFormData(prev => ({ ...prev, title: e.target.value }))
              }
              required
              fullWidth
              placeholder="Ex: Verificar instalação elétrica"
            />

            {/* Description */}
            <TextField
              label="Descrição"
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              multiline
              rows={3}
              fullWidth
              placeholder="Detalhes adicionais sobre a demanda..."
            />

            <Grid container spacing={2}>
              {/* Priority */}
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Prioridade</InputLabel>
                  <Select
                    value={formData.priority}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        priority: e.target.value as DemandPriority,
                      }))
                    }
                    label="Prioridade"
                  >
                    {Object.entries(priorityLabels).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: priorityColors[value as DemandPriority],
                            }}
                          />
                          {label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Status */}
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        status: e.target.value as DemandStatus,
                      }))
                    }
                    label="Status"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Category */}
            <Autocomplete
              freeSolo
              options={CATEGORY_OPTIONS}
              value={formData.category}
              onChange={(_, newValue) =>
                setFormData(prev => ({ ...prev, category: newValue || '' }))
              }
              onInputChange={(_, newInputValue) =>
                setFormData(prev => ({ ...prev, category: newInputValue }))
              }
              renderInput={params => (
                <TextField
                  {...params}
                  label="Categoria"
                  placeholder="Selecione ou digite..."
                />
              )}
            />

            {/* Assigned user */}
            <FormControl fullWidth>
              <InputLabel>Responsável</InputLabel>
              <Select
                value={formData.assigned_user_id || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    assigned_user_id: e.target.value
                      ? Number(e.target.value)
                      : null,
                  }))
                }
                label="Responsável"
              >
                <MenuItem value="">Nenhum</MenuItem>
                {users.map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Due date */}
            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={ptBR}
            >
              <DateTimePicker
                label="Data de vencimento"
                value={formData.due_date}
                onChange={newValue =>
                  setFormData(prev => ({ ...prev, due_date: newValue }))
                }
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </LocalizationProvider>

            {/* Notes */}
            <TextField
              label="Notas adicionais"
              value={formData.notes}
              onChange={e =>
                setFormData(prev => ({ ...prev, notes: e.target.value }))
              }
              multiline
              rows={2}
              fullWidth
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Demanda'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

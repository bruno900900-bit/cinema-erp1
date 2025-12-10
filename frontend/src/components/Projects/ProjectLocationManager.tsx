import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Tooltip,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  LocationOn,
  Schedule,
  AttachMoney,
  ExpandMore,
  CheckCircle,
  Warning,
  Info,
  PhotoCamera,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  projectLocationService,
  ProjectLocation,
  ProjectLocationCreate,
  ProjectLocationUpdate,
} from '../../services/projectLocationService';
import { locationService } from '../../services/locationService';
import { userService } from '../../services/userService';
import { agendaEventService } from '../../services/agendaEventService';
import { projectLocationStageService } from '../../services/projectLocationStageService';
import { CoverPhotoUpload } from '../Common/CoverPhotoUpload';

interface ProjectLocationManagerProps {
  projectId: number;
  projectTitle: string;
}

export default function ProjectLocationManager({
  projectId,
  projectTitle,
}: ProjectLocationManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<ProjectLocation | null>(null);
  const [formData, setFormData] = useState<ProjectLocationCreate>({
    project_id: projectId,
    location_id: 0,
    status: 'pending',
    rental_start_date: '',
    rental_end_date: '',
    rental_start_time: '',
    rental_end_time: '',
    daily_rate: 0,
    hourly_rate: 0,
  });
  const [expandedLocation, setExpandedLocation] = useState<number | null>(null);

  const queryClient = useQueryClient();

  // Buscar locações do projeto
  const { data: projectLocations = [], isLoading: isLoadingLocations } =
    useQuery({
      queryKey: ['project-locations', projectId],
      queryFn: () => projectLocationService.getProjectLocations(projectId),
    });

  // Buscar resumo das locações
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['project-locations-summary', projectId],
    queryFn: () => projectLocationService.getProjectLocationsSummary(projectId),
  });

  // Buscar locações disponíveis
  const { data: locationsResponse } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationService.searchLocations({}),
  });

  // Garantir que availableLocations seja sempre um array
  const safeAvailableLocations = Array.isArray(locationsResponse?.locations)
    ? locationsResponse.locations
    : [];

  // Buscar usuários
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  });

  // Mutations
  const createLocationMutation = useMutation({
    mutationFn: (data: ProjectLocationCreate) =>
      projectLocationService.createProjectLocation(data),
    onSuccess: newLocation => {
      queryClient.invalidateQueries({
        queryKey: ['project-locations', projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ['project-locations-summary', projectId],
      });
      setIsAddDialogOpen(false);
      resetForm();

      // Gerar eventos da agenda automaticamente
      if (newLocation.id) {
        generateAgendaEvents(newLocation.id);
      }

      // Criar etapas padrão automaticamente
      if (newLocation.project_id && newLocation.location_id) {
        createDefaultStages(newLocation.project_id, newLocation.location_id);
      }
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProjectLocationUpdate }) =>
      projectLocationService.updateProjectLocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-locations', projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ['project-locations-summary', projectId],
      });
      setIsEditDialogOpen(false);
      setSelectedLocation(null);
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: (id: number) =>
      projectLocationService.deleteProjectLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-locations', projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ['project-locations-summary', projectId],
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      projectLocationService.updateProjectLocationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['project-locations', projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ['project-locations-summary', projectId],
      });
    },
  });

  const resetForm = () => {
    setFormData({
      project_id: projectId,
      location_id: 0,
      status: 'pending',
      rental_start_date: '',
      rental_end_date: '',
      rental_start_time: '',
      rental_end_time: '',
      daily_rate: 0,
      hourly_rate: 0,
    });
  };

  const handleAddLocation = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleEditLocation = (location: ProjectLocation) => {
    setSelectedLocation(location);
    setFormData({
      project_id: projectId,
      location_id: location.location_id,
      status: location.status,
      rental_start_date: location.rental_start_date || '',
      rental_end_date: location.rental_end_date || '',
      rental_start_time: location.rental_start_time || '',
      rental_end_time: location.rental_end_time || '',
      daily_rate: location.daily_rate || 0,
      hourly_rate: location.hourly_rate || 0,
      responsible_user_id: location.responsible_user_id,
      coordinator_user_id: location.coordinator_user_id,
      notes: location.notes,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveLocation = () => {
    if (isEditDialogOpen && selectedLocation) {
      updateLocationMutation.mutate({
        id: selectedLocation.id,
        data: formData,
      });
    } else {
      createLocationMutation.mutate(formData);
    }
  };

  // Função para gerar eventos da agenda automaticamente
  const generateAgendaEvents = async (projectLocationId: number) => {
    try {
      await agendaEventService.generateEventsFromProjectLocation(
        projectLocationId
      );
      console.log('Eventos da agenda gerados automaticamente');
    } catch (error) {
      console.error('Erro ao gerar eventos da agenda:', error);
    }
  };

  // Função para criar etapas padrão automaticamente
  const createDefaultStages = async (projectId: number, locationId: number) => {
    try {
      await projectLocationStageService.createDefaultStagesForLocation(
        projectId,
        locationId
      );
      console.log('Etapas padrão criadas automaticamente');
    } catch (error) {
      console.error('Erro ao criar etapas padrão:', error);
    }
  };

  const handleDeleteLocation = (id: number) => {
    if (
      window.confirm('Tem certeza que deseja excluir esta locação do projeto?')
    ) {
      deleteLocationMutation.mutate(id);
    }
  };

  const handleStatusChange = (id: number, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const calculateTotalCost = () => {
    if (formData.rental_start_date && formData.rental_end_date) {
      return projectLocationService.calculateTotalCost(
        formData.rental_start_date,
        formData.rental_end_date,
        formData.daily_rate,
        formData.hourly_rate,
        formData.rental_start_time,
        formData.rental_end_time
      );
    }
    return 0;
  };

  const getLocationById = (locationId: number) => {
    return safeAvailableLocations.find(loc => loc.id === locationId);
  };

  if (isLoadingLocations || isLoadingSummary) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Resumo das Locações */}
      {summary && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Resumo das Locações
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {summary.total_locations}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de Locações
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {summary.confirmed_locations}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Confirmadas
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {summary.pending_locations}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pendentes
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {projectLocationService.formatCurrency(summary.total_cost)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Custo Total
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Lista de Locações */}
      <Card>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">Locações do Projeto</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddLocation}
            >
              Adicionar Locação
            </Button>
          </Box>

          {projectLocations.length === 0 ? (
            <Alert severity="info">
              Nenhuma locação adicionada ao projeto ainda.
            </Alert>
          ) : (
            <Box>
              {projectLocations.map(location => {
                const locationData = getLocationById(location.location_id);
                return (
                  <Accordion
                    key={location.id}
                    expanded={expandedLocation === location.id}
                    onChange={() =>
                      setExpandedLocation(
                        expandedLocation === location.id ? null : location.id
                      )
                    }
                    sx={{ mb: 1 }}
                  >
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                        }}
                      >
                        <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                          {locationData?.title || 'Locação não encontrada'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                          <Chip
                            label={projectLocationService.getStatusLabel(
                              location.status
                            )}
                            size="small"
                            color={projectLocationService.getStatusColor(
                              location.status
                            )}
                          />
                          {location.total_cost && (
                            <Chip
                              label={projectLocationService.formatCurrency(
                                location.total_cost
                              )}
                              size="small"
                              variant="outlined"
                              icon={<AttachMoney />}
                            />
                          )}
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            Informações da Locação
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                              }}
                            >
                              <Typography variant="body2">Cidade:</Typography>
                              <Typography variant="body2">
                                {locationData?.city}, {locationData?.state}
                              </Typography>
                            </Box>
                            {location.rental_start_date && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <Typography variant="body2">
                                  Data de Início:
                                </Typography>
                                <Typography variant="body2">
                                  {projectLocationService.formatDate(
                                    location.rental_start_date
                                  )}
                                </Typography>
                              </Box>
                            )}
                            {location.rental_end_date && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <Typography variant="body2">
                                  Data de Fim:
                                </Typography>
                                <Typography variant="body2">
                                  {projectLocationService.formatDate(
                                    location.rental_end_date
                                  )}
                                </Typography>
                              </Box>
                            )}
                            {location.total_days && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <Typography variant="body2">
                                  Total de Dias:
                                </Typography>
                                <Typography variant="body2">
                                  {location.total_days}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            Custos
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1,
                            }}
                          >
                            {location.daily_rate && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <Typography variant="body2">
                                  Taxa Diária:
                                </Typography>
                                <Typography variant="body2">
                                  {projectLocationService.formatCurrency(
                                    location.daily_rate
                                  )}
                                </Typography>
                              </Box>
                            )}
                            {location.hourly_rate && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <Typography variant="body2">
                                  Taxa Horária:
                                </Typography>
                                <Typography variant="body2">
                                  {projectLocationService.formatCurrency(
                                    location.hourly_rate
                                  )}
                                </Typography>
                              </Box>
                            )}
                            {location.total_cost && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <Typography variant="body2" fontWeight="bold">
                                  Custo Total:
                                </Typography>
                                <Typography
                                  variant="body2"
                                  fontWeight="bold"
                                  color="primary"
                                >
                                  {projectLocationService.formatCurrency(
                                    location.total_cost
                                  )}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Grid>
                        {location.notes && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                              Observações
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {location.notes}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Edit />}
                          onClick={() => handleEditLocation(location)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<Delete />}
                          onClick={() => handleDeleteLocation(location.id)}
                        >
                          Excluir
                        </Button>
                        {location.status === 'pending' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() =>
                              handleStatusChange(location.id, 'confirmed')
                            }
                          >
                            Confirmar
                          </Button>
                        )}
                        {location.status === 'confirmed' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() =>
                              handleStatusChange(location.id, 'in_use')
                            }
                          >
                            Marcar em Uso
                          </Button>
                        )}
                        {location.status === 'in_use' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() =>
                              handleStatusChange(location.id, 'completed')
                            }
                          >
                            Concluir
                          </Button>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Adicionar/Editar Locação */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          setSelectedLocation(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEditDialogOpen ? 'Editar Locação' : 'Adicionar Locação ao Projeto'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={safeAvailableLocations}
                getOptionLabel={option =>
                  `${option.title} - ${option.city}, ${option.state}`
                }
                value={
                  safeAvailableLocations.find(
                    loc => loc.id === formData.location_id
                  ) || null
                }
                onChange={(event, newValue) => {
                  setFormData(prev => ({
                    ...prev,
                    location_id: newValue?.id || 0,
                    daily_rate: newValue?.price_day_cinema || 0,
                    hourly_rate: newValue?.price_hour_cinema || 0,
                  }));
                }}
                renderInput={params => (
                  <TextField {...params} label="Selecionar Locação" required />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Data de Início"
                type="date"
                value={formData.rental_start_date}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    rental_start_date: e.target.value,
                  }))
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Data de Fim"
                type="date"
                value={formData.rental_end_date}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    rental_end_date: e.target.value,
                  }))
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Hora de Início"
                type="time"
                value={formData.rental_start_time}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    rental_start_time: e.target.value,
                  }))
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Hora de Fim"
                type="time"
                value={formData.rental_end_time}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    rental_end_time: e.target.value,
                  }))
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Taxa Diária"
                type="number"
                value={formData.daily_rate}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    daily_rate: parseFloat(e.target.value) || 0,
                  }))
                }
                fullWidth
                InputProps={{
                  startAdornment: <AttachMoney />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Taxa Horária"
                type="number"
                value={formData.hourly_rate}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    hourly_rate: parseFloat(e.target.value) || 0,
                  }))
                }
                fullWidth
                InputProps={{
                  startAdornment: <AttachMoney />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Responsável</InputLabel>
                <Select
                  value={formData.responsible_user_id || ''}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      responsible_user_id: e.target.value as number,
                    }))
                  }
                  label="Responsável"
                >
                  {users.map(user => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Coordenador</InputLabel>
                <Select
                  value={formData.coordinator_user_id || ''}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      coordinator_user_id: e.target.value as number,
                    }))
                  }
                  label="Coordenador"
                >
                  {users.map(user => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Observações"
                multiline
                rows={3}
                value={formData.notes || ''}
                onChange={e =>
                  setFormData(prev => ({ ...prev, notes: e.target.value }))
                }
                fullWidth
              />
            </Grid>
            {formData.rental_start_date && formData.rental_end_date && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Custo Total Calculado:</strong>{' '}
                    {projectLocationService.formatCurrency(
                      calculateTotalCost()
                    )}
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
              setSelectedLocation(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveLocation}
            variant="contained"
            disabled={
              createLocationMutation.isPending ||
              updateLocationMutation.isPending
            }
          >
            {isEditDialogOpen ? 'Atualizar' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

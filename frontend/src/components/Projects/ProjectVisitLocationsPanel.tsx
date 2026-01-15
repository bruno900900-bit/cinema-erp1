/**
 * Painel de Locações Visitadas em um Projeto
 * Lista todas as locações em visitação/prospecção
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Grid,
  Chip,
  IconButton,
  LinearProgress,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Rating,
  Divider,
  alpha,
  useTheme,
  Avatar,
  AvatarGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Place as PlaceIcon,
  PhotoCamera as PhotoIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  HourglassEmpty as PendingIcon,
  Visibility as VisitingIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import projectVisitLocationService, {
  VisitLocationBrief,
  VisitLocationCreate,
  VisitLocation,
} from '../../services/projectVisitLocationService';
import { userService } from '../../services/userService';
import VisitLocationDetail from './VisitLocationDetail';

interface ProjectVisitLocationsPanelProps {
  projectId: number;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  visiting: { label: 'Em Visitação', color: '#2196f3', icon: <VisitingIcon /> },
  pending: {
    label: 'Aguardando Decisão',
    color: '#ff9800',
    icon: <PendingIcon />,
  },
  approved: { label: 'Aprovada', color: '#4caf50', icon: <ApprovedIcon /> },
  rejected: { label: 'Rejeitada', color: '#f44336', icon: <RejectedIcon /> },
  on_hold: { label: 'Em Espera', color: '#9e9e9e', icon: <PendingIcon /> },
};

const ProjectVisitLocationsPanel: React.FC<ProjectVisitLocationsPanelProps> = ({
  projectId,
}) => {
  const theme = useTheme();
  const queryClient = useQueryClient();

  // States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<VisitLocationBrief | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Form state
  const [formData, setFormData] = useState<VisitLocationCreate>({
    project_id: projectId,
    name: '',
    address: '',
    city: '',
    state: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    notes: '',
    status: 'visiting',
  });

  // Queries
  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['visitLocations', projectId],
    queryFn: () => projectVisitLocationService.getByProject(projectId),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await userService.getUsers();
      return response.users || [];
    },
  });

  // Default workflow stages for new locations - 7 fixed stages
  const defaultStages = [
    { title: 'Prospecção', description: 'Identificação e pesquisa do local' },
    { title: 'Visita Inicial', description: 'Primeira visita ao local' },
    { title: 'Avaliação Técnica', description: 'Análise de infraestrutura' },
    { title: 'Negociação', description: 'Negociação de valores' },
    { title: 'Aprovação', description: 'Aprovação final' },
    { title: 'Contrato', description: 'Assinatura do contrato' },
    { title: 'Liberação', description: 'Liberação para filmagem' },
  ];

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: VisitLocationCreate) => {
      // Create location first
      const location = await projectVisitLocationService.create(data);

      // Add default stages
      for (let i = 0; i < defaultStages.length; i++) {
        await projectVisitLocationService.addStage(
          location.id,
          defaultStages[i].title,
          defaultStages[i].description
        );
      }

      return location;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['visitLocations', projectId],
      });
      toast.success('Locação adicionada com etapas padrão!');
      setAddModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Erro ao adicionar locação');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<VisitLocationCreate>;
    }) => projectVisitLocationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['visitLocations', projectId],
      });
      toast.success('Locação atualizada com sucesso!');
      setEditModalOpen(false);
    },
    onError: () => {
      toast.error('Erro ao atualizar locação');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: projectVisitLocationService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['visitLocations', projectId],
      });
      toast.success('Locação removida com sucesso!');
      setDeleteConfirmOpen(false);
      setSelectedLocation(null);
    },
    onError: () => {
      toast.error('Erro ao remover locação');
    },
  });

  // Handlers
  const resetForm = () => {
    setFormData({
      project_id: projectId,
      name: '',
      address: '',
      city: '',
      state: '',
      contact_name: '',
      contact_phone: '',
      contact_email: '',
      notes: '',
      status: 'visiting',
    });
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    location: VisitLocationBrief
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedLocation(location);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    if (selectedLocation) {
      setFormData({
        project_id: projectId,
        name: selectedLocation.name,
        city: selectedLocation.city || '',
        state: selectedLocation.state || '',
        status: selectedLocation.status as any,
      });
      setEditModalOpen(true);
    }
  };

  const handleDelete = () => {
    handleMenuClose();
    setDeleteConfirmOpen(true);
  };

  const handleViewDetails = (location: VisitLocationBrief) => {
    setSelectedLocation(location);
    setDetailModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedLocation) return;
    updateMutation.mutate({ id: selectedLocation.id, data: formData });
  };

  const handleConfirmDelete = () => {
    if (!selectedLocation) return;
    deleteMutation.mutate(selectedLocation.id);
  };

  // Render
  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Locações Visitadas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie locações em prospecção para este projeto
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddModalOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
            },
          }}
        >
          Nova Locação
        </Button>
      </Box>

      {/* Loading */}
      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Empty State */}
      {!isLoading && locations.length === 0 && (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <PlaceIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhuma locação visitada
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
            Adicione locações que estão sendo visitadas para este projeto
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setAddModalOpen(true)}
          >
            Adicionar Locação
          </Button>
        </Card>
      )}

      {/* Location Cards Grid */}
      <Grid container spacing={2}>
        {locations.map(location => (
          <Grid item xs={12} sm={6} md={4} key={location.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8],
                },
              }}
              onClick={() => handleViewDetails(location)}
            >
              {/* Cover Image */}
              <CardMedia
                component="div"
                sx={{
                  height: 140,
                  background: location.cover_photo_url
                    ? `url(${location.cover_photo_url}) center/cover`
                    : `linear-gradient(135deg, ${alpha(
                        statusConfig[location.status]?.color || '#666',
                        0.3
                      )} 0%, ${alpha(
                        statusConfig[location.status]?.color || '#666',
                        0.1
                      )} 100%)`,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  p: 1,
                }}
              >
                <Chip
                  size="small"
                  label={
                    statusConfig[location.status]?.label || location.status
                  }
                  sx={{
                    bgcolor: alpha('#fff', 0.9),
                    color: statusConfig[location.status]?.color,
                    fontWeight: 600,
                  }}
                  icon={statusConfig[location.status]?.icon as any}
                />
                {location.photos_count > 0 && (
                  <Chip
                    size="small"
                    icon={<PhotoIcon sx={{ fontSize: 16 }} />}
                    label={location.photos_count}
                    sx={{ bgcolor: alpha('#fff', 0.9) }}
                  />
                )}
              </CardMedia>

              <CardContent sx={{ flexGrow: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  {location.name}
                </Typography>

                {(location.city || location.state) && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    <PlaceIcon sx={{ fontSize: 16 }} />
                    {[location.city, location.state].filter(Boolean).join(', ')}
                  </Typography>
                )}

                {/* Rating */}
                {location.rating && (
                  <Box sx={{ mt: 1 }}>
                    <Rating value={location.rating} size="small" readOnly />
                  </Box>
                )}

                {/* Compact Workflow Stages - MAX 7 */}
                {(location.total_stages_count || 0) > 0 && (
                  <Box sx={{ mt: 1.5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Etapas:{' '}
                        {Math.min(location.completed_stages_count || 0, 7)}/
                        {Math.min(location.total_stages_count || 0, 7)}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {/* Stage dots - EXACTLY 7 max */}
                        {Array.from({
                          length: Math.min(location.total_stages_count || 0, 7),
                        }).map((_, i) => (
                          <Box
                            key={i}
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor:
                                i < (location.completed_stages_count || 0)
                                  ? '#10b981'
                                  : i ===
                                      (location.completed_stages_count || 0) &&
                                    location.workflow_progress > 0
                                  ? '#f59e0b'
                                  : '#d1d5db',
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={location.workflow_progress || 0}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          background:
                            'linear-gradient(90deg, #667eea 0%, #10b981 100%)',
                        },
                      }}
                    />
                  </Box>
                )}
              </CardContent>

              <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                <IconButton
                  size="small"
                  onClick={e => {
                    e.stopPropagation();
                    handleMenuOpen(e, location);
                  }}
                >
                  <MoreIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} /> Editar
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} /> Excluir
        </MenuItem>
      </Menu>

      {/* Add Modal */}
      <Dialog
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nova Locação Visitada</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label="Nome da Locação"
                fullWidth
                required
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Endereço"
                fullWidth
                value={formData.address}
                onChange={e =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Cidade"
                fullWidth
                value={formData.city}
                onChange={e =>
                  setFormData({ ...formData, city: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Estado"
                fullWidth
                value={formData.state}
                onChange={e =>
                  setFormData({ ...formData, state: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>Contato</Divider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Nome do Contato"
                fullWidth
                value={formData.contact_name}
                onChange={e =>
                  setFormData({ ...formData, contact_name: e.target.value })
                }
                InputProps={{
                  startAdornment: (
                    <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Telefone"
                fullWidth
                value={formData.contact_phone}
                onChange={e =>
                  setFormData({ ...formData, contact_phone: e.target.value })
                }
                InputProps={{
                  startAdornment: (
                    <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Email"
                fullWidth
                value={formData.contact_email}
                onChange={e =>
                  setFormData({ ...formData, contact_email: e.target.value })
                }
                InputProps={{
                  startAdornment: (
                    <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Observações"
                fullWidth
                multiline
                rows={3}
                value={formData.notes}
                onChange={e =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddModalOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Salvando...' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Locação</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label="Nome da Locação"
                fullWidth
                required
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Cidade"
                fullWidth
                value={formData.city}
                onChange={e =>
                  setFormData({ ...formData, city: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Estado"
                fullWidth
                value={formData.state}
                onChange={e =>
                  setFormData({ ...formData, state: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={e =>
                    setFormData({ ...formData, status: e.target.value as any })
                  }
                >
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Box sx={{ color: config.color }}>{config.icon}</Box>
                        {config.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleUpdate}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir a locação "{selectedLocation?.name}"?
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Location Detail Modal */}
      <Dialog
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedLocation(null);
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '85vh' },
        }}
      >
        {selectedLocation && (
          <VisitLocationDetail
            locationId={selectedLocation.id}
            onClose={() => {
              setDetailModalOpen(false);
              setSelectedLocation(null);
            }}
          />
        )}
      </Dialog>
    </Box>
  );
};

export default ProjectVisitLocationsPanel;

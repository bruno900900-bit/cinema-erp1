import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardMedia,
  IconButton,
  LinearProgress,
  Stack,
} from '@mui/material';
import {
  Save,
  Cancel,
  PhotoCamera,
  Delete,
  Add,
  CloudUpload,
} from '@mui/icons-material';
import {
  Location,
  LocationStatus,
  SectorType,
  SpaceType,
  LocationTag,
  LocationPhoto,
} from '../../types/user';
import SupplierSelector from '../Suppliers/SupplierSelector';
import { Supplier } from '../../services/supplierService';
import { locationService } from '../../services/locationService';
import LocationPhotoUpload from './LocationPhotoUpload';

interface LocationEditModalProps {
  open: boolean;
  location: Location | null;
  onClose: () => void;
  onSave: (location: Partial<Location>) => Promise<void>;
  tags: LocationTag[];
}

export default function LocationEditModal({
  open,
  location,
  onClose,
  onSave,
  tags,
}: LocationEditModalProps) {
  const [formData, setFormData] = useState<Partial<Location>>({});
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para gerenciar fotos
  const [locationPhotos, setLocationPhotos] = useState<LocationPhoto[]>([]);
  const [primaryPhotoId, setPrimaryPhotoId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingCaptions, setPendingCaptions] = useState<string[]>([]);
  const [pendingPrimaryIndex, setPendingPrimaryIndex] = useState<
    number | undefined
  >(undefined);

  useEffect(() => {
    if (location) {
      const supplierFromLocation = location.supplier
        ? ({
            ...location.supplier,
            tax_id: (location.supplier as any).tax_id,
            website: (location.supplier as any).website,
            notes: (location.supplier as any).notes,
            address_json: (location.supplier as any).address_json,
            created_at: (location.supplier as any).created_at || '',
            updated_at: (location.supplier as any).updated_at || '',
            locations_count: (location.supplier as any).locations_count,
            is_active:
              typeof (location.supplier as any).is_active === 'boolean'
                ? (location.supplier as any).is_active
                : true,
          } as Supplier)
        : null;

      setFormData({
        ...location,
        supplier_id:
          location.supplier_id ?? supplierFromLocation?.id ?? undefined,
        available_from: location.available_from || '',
        available_to: location.available_to || '',
      });
      setSelectedSupplier(supplierFromLocation);

      // Carregar fotos da locação
      loadLocationPhotos();
    } else {
      // Inicializar dados para nova localização
      setFormData({
        title: '',
        slug: '',
        summary: '',
        description: '',
        status: LocationStatus.DRAFT,
        sector_type: SectorType.CINEMA,
        space_type: SpaceType.INDOOR,
        currency: 'BRL',
        country: 'Brasil',
        available_from: '',
        available_to: '',
        has_parking: false,
        has_electricity: false,
        has_water: false,
        has_bathroom: false,
        has_kitchen: false,
        has_air_conditioning: false,
        tags: [],
        supplier_id: null,
      });
      setSelectedSupplier(null);
      setLocationPhotos([]);
      setPrimaryPhotoId(null);
    }
  }, [location]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      supplier_id: selectedSupplier?.id ?? null,
    }));
  }, [selectedSupplier]);

  const loadLocationPhotos = async () => {
    if (!location?.id) return;

    try {
      const photos = await locationService.getLocationPhotos(location.id);
      setLocationPhotos(photos);

      // Definir foto principal
      const primaryPhoto = photos.find(photo => photo.is_primary);
      if (primaryPhoto && primaryPhoto.id) {
        setPrimaryPhotoId(String(primaryPhoto.id));
      }
    } catch (error) {
      console.error('Erro ao carregar fotos da locação:', error);
    }
  };

  const handleInputChange = (field: keyof Location, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Funções para gerenciar fotos
  const handlePhotosChange = (photos: LocationPhoto[]) => {
    setLocationPhotos(photos);
  };

  const handlePrimaryPhotoChange = (photoId: string) => {
    setPrimaryPhotoId(photoId);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validar campos obrigatórios
      if (!formData.title || formData.title.trim() === '') {
        throw new Error('O campo Título é obrigatório');
      }

      const dataToSave = {
        ...formData,
        supplier_id: selectedSupplier?.id ?? null,
      };

      if (!location && pendingFiles.length > 0) {
        // Criar com fotos em uma única chamada
        try {
          const created = await locationService.createLocationWithPhotos(
            dataToSave,
            pendingFiles,
            pendingCaptions,
            pendingPrimaryIndex
          );
          console.log('✅ Localização criada com fotos:', created);
          // Notificar o componente pai para atualizar a lista
          await onSave(created);
        } catch (e: any) {
          throw e;
        }
      } else {
        // Fluxo existente (sem fotos na criação)
        await onSave(dataToSave);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar locação');
    } finally {
      setLoading(false);
    }
  };

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

  const getSpaceTypeLabel = (type: SpaceType) => {
    const labels: Record<SpaceType, string> = {
      [SpaceType.INDOOR]: 'Interno',
      [SpaceType.OUTDOOR]: 'Externo',
      [SpaceType.STUDIO]: 'Estúdio',
      [SpaceType.LOCATION]: 'Locação',
      [SpaceType.ROOM]: 'Sala',
      [SpaceType.AREA]: 'Área',
    };
    return labels[type];
  };

  const isCreating = !location;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle>
        {isCreating ? 'Nova Locação' : `Editar Locação: ${location.title}`}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Informações Básicas */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Informações Básicas
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Título"
              value={formData.title || ''}
              onChange={e => handleInputChange('title', e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Slug"
              value={formData.slug || ''}
              onChange={e => handleInputChange('slug', e.target.value)}
              helperText="URL amigável para a locação"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status || LocationStatus.DRAFT}
                onChange={e => handleInputChange('status', e.target.value)}
                label="Status"
              >
                {Object.values(LocationStatus).map(status => (
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
                value={formData.sector_type || SectorType.CINEMA}
                onChange={e => handleInputChange('sector_type', e.target.value)}
                label="Tipo de Setor"
              >
                {Object.values(SectorType).map(sector => (
                  <MenuItem key={sector} value={sector}>
                    {getSectorLabel(sector)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Espaço</InputLabel>
              <Select
                value={formData.space_type || SpaceType.INDOOR}
                onChange={e => handleInputChange('space_type', e.target.value)}
                label="Tipo de Espaço"
              >
                {Object.values(SpaceType).map(type => (
                  <MenuItem key={type} value={type}>
                    {getSpaceTypeLabel(type)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <SupplierSelector
              value={selectedSupplier}
              onChange={setSelectedSupplier}
              label="Fornecedor"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Moeda"
              value={formData.currency || 'BRL'}
              onChange={e => handleInputChange('currency', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Resumo"
              value={formData.summary || ''}
              onChange={e => handleInputChange('summary', e.target.value)}
              multiline
              rows={2}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descrição"
              value={formData.description || ''}
              onChange={e => handleInputChange('description', e.target.value)}
              multiline
              rows={4}
            />
          </Grid>

          <Divider sx={{ my: 2, width: '100%' }} />

          {/* Preços */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Preços
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Preço por Dia - Cinema"
              type="number"
              value={formData.price_day_cinema || ''}
              onChange={e =>
                handleInputChange('price_day_cinema', Number(e.target.value))
              }
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Preço por Hora - Cinema"
              type="number"
              value={formData.price_hour_cinema || ''}
              onChange={e =>
                handleInputChange('price_hour_cinema', Number(e.target.value))
              }
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Preço por Dia - Publicidade"
              type="number"
              value={formData.price_day_publicidade || ''}
              onChange={e =>
                handleInputChange(
                  'price_day_publicidade',
                  Number(e.target.value)
                )
              }
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Preço por Hora - Publicidade"
              type="number"
              value={formData.price_hour_publicidade || ''}
              onChange={e =>
                handleInputChange(
                  'price_hour_publicidade',
                  Number(e.target.value)
                )
              }
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>,
              }}
            />
          </Grid>

          <Divider sx={{ my: 2, width: '100%' }} />

          {/* Localização */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Localização
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Cidade"
              value={formData.city || ''}
              onChange={e => handleInputChange('city', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Estado"
              value={formData.state || ''}
              onChange={e => handleInputChange('state', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="País"
              value={formData.country || 'Brasil'}
              onChange={e => handleInputChange('country', e.target.value)}
            />
          </Grid>

          <Divider sx={{ my: 2, width: '100%' }} />

          {/* Características */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Características
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Capacidade (pessoas)"
              type="number"
              value={formData.capacity || ''}
              onChange={e =>
                handleInputChange('capacity', Number(e.target.value))
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Área (m²)"
              type="number"
              value={formData.area_size || ''}
              onChange={e =>
                handleInputChange('area_size', Number(e.target.value))
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Disponível a partir de"
              type="date"
              value={formData.available_from || ''}
              onChange={e =>
                handleInputChange('available_from', e.target.value)
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Disponível até"
              type="date"
              value={formData.available_to || ''}
              onChange={e => handleInputChange('available_to', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Infraestrutura Disponível
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.has_parking || false}
                      onChange={e =>
                        handleInputChange('has_parking', e.target.checked)
                      }
                    />
                  }
                  label="Estacionamento"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.has_electricity || false}
                      onChange={e =>
                        handleInputChange('has_electricity', e.target.checked)
                      }
                    />
                  }
                  label="Eletricidade"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.has_water || false}
                      onChange={e =>
                        handleInputChange('has_water', e.target.checked)
                      }
                    />
                  }
                  label="Água"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.has_bathroom || false}
                      onChange={e =>
                        handleInputChange('has_bathroom', e.target.checked)
                      }
                    />
                  }
                  label="Banheiro"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.has_kitchen || false}
                      onChange={e =>
                        handleInputChange('has_kitchen', e.target.checked)
                      }
                    />
                  }
                  label="Cozinha"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.has_air_conditioning || false}
                      onChange={e =>
                        handleInputChange(
                          'has_air_conditioning',
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Ar Condicionado"
                />
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2, width: '100%' }} />

          {/* Fotos */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Fotos da Locação
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {location?.id
                ? 'Gerencie as fotos da locação com upload para Firebase Storage'
                : 'Salve a locação primeiro para poder fazer upload das fotos'}
            </Typography>

            {location?.id && (
              <LocationPhotoUpload
                locationId={location.id}
                photos={locationPhotos}
                onPhotosChange={handlePhotosChange}
                onPrimaryPhotoChange={handlePrimaryPhotoChange}
                disabled={loading}
              />
            )}

            {!location?.id && (
              <Box
                sx={{
                  border: '2px dashed #ccc',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  backgroundColor: 'grey.50',
                }}
              >
                <input
                  id="new-location-photos"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={e => {
                    const files = Array.from(e.target.files || []);
                    setPendingFiles(files);
                    setPendingCaptions(files.map(() => ''));
                    setPendingPrimaryIndex(0);
                  }}
                  style={{ display: 'none' }}
                  disabled={loading}
                />
                <label htmlFor="new-location-photos">
                  <Button
                    variant="outlined"
                    startIcon={<PhotoCamera />}
                    component="span"
                    disabled={loading}
                  >
                    Selecionar Fotos (opcional)
                  </Button>
                </label>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Você pode incluir fotos já na criação. Máx. 20 fotos.
                </Typography>
                {pendingFiles.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {pendingFiles.length} foto(s) selecionada(s)
                  </Typography>
                )}
              </Box>
            )}
          </Grid>

          <Divider sx={{ my: 2, width: '100%' }} />

          {/* Tags */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Tags
            </Typography>
            <Autocomplete
              multiple
              options={tags}
              getOptionLabel={option => option.name}
              value={formData.tags || []}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, newValue) => handleInputChange('tags', newValue)}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Selecionar tags"
                  placeholder="Adicionar tags..."
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...chipProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={key}
                      label={option.name}
                      {...chipProps}
                      size="small"
                      variant="outlined"
                    />
                  );
                })
              }
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          disabled={loading}
        >
          {loading
            ? 'Salvando...'
            : isCreating
            ? 'Criar Locação'
            : 'Salvar Alterações'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

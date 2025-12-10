import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Checkbox,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  Tooltip,
  InputAdornment,
  Skeleton,
} from '@mui/material';
import {
  Download,
  Close,
  Image as ImageIcon,
  Settings,
  CheckCircle,
  Search,
  DragIndicator,
  ArrowUpward,
  ArrowDownward,
  SelectAll,
  Deselect,
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Location } from '../../types/user';
import {
  exportService,
  LocationPhotoSelection,
  PresentationExportData,
} from '../../services/exportService';
import { locationService } from '../../services/locationService';

interface PresentationExportModalProps {
  open: boolean;
  onClose: () => void;
}

interface ExportOptions {
  format: 'pptx';
  includePhotos: boolean;
  includeDetails: boolean;
  includePricing: boolean;
  includeContact: boolean;
  pageSize: 'a4' | 'letter' | 'a3';
  orientation: 'portrait' | 'landscape';
  title: string;
  subtitle: string;
}

interface PhotoSelection {
  locationId: number;
  photoIds: number[];
}

export default function PresentationExportModal({
  open,
  onClose,
}: PresentationExportModalProps) {
  const theme = useTheme();

  // Fetch all locations with photos
  const { data: allLocationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ['all-locations-with-photos'],
    queryFn: async () => {
      const result = await locationService.getLocations({
        page: 1,
        page_size: 500,
        include: ['photos'],
      });
      return result.locations || [];
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const allLocations = allLocationsData || [];

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pptx',
    includePhotos: true,
    includeDetails: true,
    includePricing: true,
    includeContact: true,
    pageSize: 'a4',
    orientation: 'landscape',
    title: 'Apresentação de Locações',
    subtitle: 'Cinema ERP - Sistema de Gestão de Locações',
  });

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);
  const [photoSelections, setPhotoSelections] = useState<
    Record<number, number[]>
  >({});
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedLocationIds([]);
      setPhotoSelections({});
      setSearchTerm('');
      setFeedback(null);
    }
  }, [open]);

  // Filter locations by search term
  const filteredLocations = useMemo(() => {
    if (!searchTerm.trim()) return allLocations;
    const term = searchTerm.toLowerCase();
    return allLocations.filter(
      (loc: Location) =>
        loc.title?.toLowerCase().includes(term) ||
        loc.city?.toLowerCase().includes(term) ||
        loc.state?.toLowerCase().includes(term)
    );
  }, [allLocations, searchTerm]);

  // Get selected locations in order
  const selectedLocations = useMemo(() => {
    return selectedLocationIds
      .map(id => allLocations.find((loc: Location) => loc.id === id))
      .filter(Boolean) as Location[];
  }, [selectedLocationIds, allLocations]);

  const handleOptionChange = (field: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationToggle = (location: Location) => {
    const isSelected = selectedLocationIds.includes(location.id);
    if (isSelected) {
      setSelectedLocationIds(prev => prev.filter(id => id !== location.id));
      setPhotoSelections(prev => {
        const updated = { ...prev };
        delete updated[location.id];
        return updated;
      });
    } else {
      setSelectedLocationIds(prev => [...prev, location.id]);
      // Auto-select all photos
      if (location.photos?.length) {
        setPhotoSelections(prev => ({
          ...prev,
          [location.id]: location.photos!.map(p => p.id),
        }));
      }
    }
  };

  const handleSelectAll = () => {
    const ids = filteredLocations.map((l: Location) => l.id);
    setSelectedLocationIds(ids);
    const selections: Record<number, number[]> = {};
    filteredLocations.forEach((loc: Location) => {
      if (loc.photos?.length) {
        selections[loc.id] = loc.photos.map(p => p.id);
      }
    });
    setPhotoSelections(selections);
  };

  const handleSelectNone = () => {
    setSelectedLocationIds([]);
    setPhotoSelections({});
  };

  const handlePhotoToggle = (locationId: number, photoId: number) => {
    setPhotoSelections(prev => {
      const current = prev[locationId] || [];
      const exists = current.includes(photoId);
      return {
        ...prev,
        [locationId]: exists
          ? current.filter(id => id !== photoId)
          : [...current, photoId],
      };
    });
  };

  const handleSelectAllPhotos = (location: Location) => {
    if (!location.photos?.length) return;
    setPhotoSelections(prev => ({
      ...prev,
      [location.id]: location.photos!.map(p => p.id),
    }));
  };

  const handleClearPhotos = (location: Location) => {
    setPhotoSelections(prev => ({
      ...prev,
      [location.id]: [],
    }));
  };

  const moveLocation = (locationId: number, direction: 'up' | 'down') => {
    const index = selectedLocationIds.indexOf(locationId);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedLocationIds.length) return;
    const newOrder = [...selectedLocationIds];
    [newOrder[index], newOrder[newIndex]] = [
      newOrder[newIndex],
      newOrder[index],
    ];
    setSelectedLocationIds(newOrder);
  };

  const handleExport = async () => {
    if (!selectedLocationIds.length) {
      setFeedback({
        type: 'error',
        message: 'Selecione ao menos uma locação para exportar.',
      });
      return;
    }

    setFeedback(null);
    setLoading(true);

    try {
      const payload: PresentationExportData = {
        location_ids: selectedLocationIds,
        order: selectedLocationIds.map((_, i) => i),
        include_photos: exportOptions.includePhotos,
        include_summary: exportOptions.includeDetails,
        template_name: 'default',
        title: exportOptions.title?.trim() || undefined,
        subtitle: exportOptions.subtitle?.trim() || undefined,
      };

      if (exportOptions.includePhotos) {
        const selections: LocationPhotoSelection[] = selectedLocationIds.map(
          locationId => ({
            location_id: locationId,
            photo_ids: photoSelections[locationId] || [],
          })
        );
        payload.selected_photos = selections;
      }

      const blob = await exportService.exportPresentation(payload);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const sanitized = (exportOptions.title?.trim() || 'apresentacao_locacoes')
        .replace(/[^a-z0-9\-]+/gi, '_')
        .toLowerCase();
      link.download = `${sanitized}.pptx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setFeedback({
        type: 'success',
        message: 'Apresentação gerada com sucesso!',
      });
    } catch (error) {
      console.error('Erro na exportação:', error);
      setFeedback({
        type: 'error',
        message: 'Erro ao gerar apresentação. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPhotosSelected = Object.values(photoSelections).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ImageIcon />
            <Typography variant="h5" component="h2">
              Exportar Apresentação
            </Typography>
          </Box>
          <Chip
            label={`${selectedLocationIds.length} locações | ${totalPhotosSelected} fotos`}
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {feedback && (
          <Alert
            severity={feedback.type}
            sx={{ m: 2 }}
            onClose={() => setFeedback(null)}
          >
            {feedback.message}
          </Alert>
        )}

        <Grid container sx={{ height: '70vh' }}>
          {/* Left Panel - Location Selection */}
          <Grid
            item
            xs={12}
            md={5}
            sx={{
              borderRight: 1,
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Search and Actions */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar locações..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<SelectAll />}
                  onClick={handleSelectAll}
                >
                  Selecionar Todas
                </Button>
                <Button
                  size="small"
                  startIcon={<Deselect />}
                  onClick={handleSelectNone}
                >
                  Limpar
                </Button>
              </Box>
            </Box>

            {/* Location List */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              {locationsLoading ? (
                [...Array(5)].map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="rectangular"
                    height={80}
                    sx={{ mb: 1, borderRadius: 1 }}
                  />
                ))
              ) : filteredLocations.length === 0 ? (
                <Typography
                  color="text.secondary"
                  sx={{ p: 2, textAlign: 'center' }}
                >
                  Nenhuma locação encontrada
                </Typography>
              ) : (
                filteredLocations.map((location: Location) => {
                  const isSelected = selectedLocationIds.includes(location.id);
                  const photoCount = location.photos?.length || 0;
                  const selectedPhotoCount =
                    photoSelections[location.id]?.length || 0;

                  return (
                    <Paper
                      key={location.id}
                      sx={{
                        p: 1.5,
                        mb: 1,
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: isSelected
                          ? 'primary.main'
                          : 'transparent',
                        bgcolor: isSelected
                          ? alpha(theme.palette.primary.main, 0.08)
                          : 'background.paper',
                        '&:hover': { borderColor: 'primary.light' },
                      }}
                      onClick={() => handleLocationToggle(location)}
                    >
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {isSelected && (
                          <CheckCircle color="primary" fontSize="small" />
                        )}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" noWrap>
                            {location.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {location.city}, {location.state}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={
                            isSelected
                              ? `${selectedPhotoCount}/${photoCount} fotos`
                              : `${photoCount} fotos`
                          }
                          color={
                            isSelected && selectedPhotoCount > 0
                              ? 'primary'
                              : 'default'
                          }
                          variant={isSelected ? 'filled' : 'outlined'}
                        />
                      </Box>
                    </Paper>
                  );
                })
              )}
            </Box>
          </Grid>

          {/* Right Panel - Selected Locations with Photos */}
          <Grid
            item
            xs={12}
            md={7}
            sx={{ display: 'flex', flexDirection: 'column' }}
          >
            {/* Config Options */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Título"
                    value={exportOptions.title}
                    onChange={e => handleOptionChange('title', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Subtítulo"
                    value={exportOptions.subtitle}
                    onChange={e =>
                      handleOptionChange('subtitle', e.target.value)
                    }
                  />
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exportOptions.includePhotos}
                      onChange={e =>
                        handleOptionChange('includePhotos', e.target.checked)
                      }
                      size="small"
                    />
                  }
                  label="Incluir fotos"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exportOptions.includeDetails}
                      onChange={e =>
                        handleOptionChange('includeDetails', e.target.checked)
                      }
                      size="small"
                    />
                  }
                  label="Incluir detalhes"
                />
              </Box>
            </Box>

            {/* Selected Locations with Photos */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {selectedLocations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <ImageIcon
                    sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
                  />
                  <Typography color="text.secondary">
                    Selecione locações à esquerda para adicionar à apresentação
                  </Typography>
                </Box>
              ) : (
                selectedLocations.map((location, index) => {
                  const photos = location.photos || [];
                  const selectedPhotoIds = photoSelections[location.id] || [];

                  return (
                    <Paper
                      key={location.id}
                      sx={{
                        p: 2,
                        mb: 2,
                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                      }}
                    >
                      {/* Location Header */}
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                      >
                        <DragIndicator sx={{ mr: 1, color: 'text.disabled' }} />
                        <Typography
                          variant="subtitle1"
                          fontWeight="bold"
                          sx={{ flex: 1 }}
                        >
                          {index + 1}. {location.title}
                        </Typography>
                        <Tooltip title="Mover para cima">
                          <IconButton
                            size="small"
                            onClick={() => moveLocation(location.id, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUpward fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Mover para baixo">
                          <IconButton
                            size="small"
                            onClick={() => moveLocation(location.id, 'down')}
                            disabled={index === selectedLocations.length - 1}
                          >
                            <ArrowDownward fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      {/* Photos */}
                      {exportOptions.includePhotos && photos.length > 0 && (
                        <>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mb: 1,
                            }}
                          >
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ flex: 1 }}
                            >
                              {selectedPhotoIds.length}/{photos.length} fotos
                              selecionadas
                            </Typography>
                            <Button
                              size="small"
                              onClick={() => handleSelectAllPhotos(location)}
                            >
                              Todas
                            </Button>
                            <Button
                              size="small"
                              onClick={() => handleClearPhotos(location)}
                            >
                              Nenhuma
                            </Button>
                          </Box>
                          <Grid container spacing={1}>
                            {photos.map(photo => {
                              const isPhotoSelected = selectedPhotoIds.includes(
                                photo.id
                              );
                              return (
                                <Grid item xs={4} sm={3} md={2} key={photo.id}>
                                  <Box
                                    onClick={e => {
                                      e.stopPropagation();
                                      handlePhotoToggle(location.id, photo.id);
                                    }}
                                    sx={{
                                      position: 'relative',
                                      borderRadius: 1,
                                      overflow: 'hidden',
                                      border: '3px solid',
                                      borderColor: isPhotoSelected
                                        ? 'primary.main'
                                        : 'transparent',
                                      cursor: 'pointer',
                                      opacity: isPhotoSelected ? 1 : 0.5,
                                      '&:hover': { opacity: 1 },
                                    }}
                                  >
                                    <Box
                                      component="img"
                                      src={photo.thumbnail_url || photo.url}
                                      alt=""
                                      sx={{
                                        width: '100%',
                                        height: 80,
                                        objectFit: 'cover',
                                        display: 'block',
                                      }}
                                    />
                                    {isPhotoSelected && (
                                      <CheckCircle
                                        sx={{
                                          position: 'absolute',
                                          top: 4,
                                          right: 4,
                                          color: 'primary.main',
                                          bgcolor: 'white',
                                          borderRadius: '50%',
                                        }}
                                        fontSize="small"
                                      />
                                    )}
                                  </Box>
                                </Grid>
                              );
                            })}
                          </Grid>
                        </>
                      )}

                      {photos.length === 0 && (
                        <Typography variant="body2" color="text.disabled">
                          Esta locação não possui fotos
                        </Typography>
                      )}
                    </Paper>
                  );
                })
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          startIcon={<Close />}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          disabled={loading || selectedLocationIds.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <Download />}
        >
          {loading
            ? 'Gerando...'
            : `Exportar ${selectedLocationIds.length} Locações`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

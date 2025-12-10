import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  Avatar,
  Rating,
  Divider,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from '@mui/material';
import {
  LocationOn,
  AttachMoney,
  People,
  Star,
  Edit,
  Delete,
  Close,
} from '@mui/icons-material';
import {
  Location,
  LocationStatus,
  SectorType,
  SpaceType,
} from '../../types/user';
import PhotoGallery from '../Photos/PhotoGallery';
import PhotoLightbox from '../Photos/PhotoLightbox';
import { PhotoAsset } from '../Photos/types';

interface LocationDetailModalProps {
  open: boolean;
  location: Location | null;
  onClose: () => void;
  onEdit?: (location: Location) => void;
  onDelete?: (location: Location) => void;
}

export default function LocationDetailModal({
  open,
  location,
  onClose,
  onEdit,
  onDelete,
}: LocationDetailModalProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  if (!location) return null;

  const toAbsoluteImageUrl = (u?: string): string => {
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    const envBase = (import.meta as any).env?.VITE_API_BASE_URL as
      | string
      | undefined;
    const origin = envBase
      ? envBase.replace(/\/?api\/?v1\/?$/i, '')
      : 'https://cinema-backend-140199679738.us-central1.run.app';
    return `${origin}${u.startsWith('/') ? u : `/${u}`}`;
  };

  const getStatusColor = (status: LocationStatus) => {
    const statusColors: Record<
      LocationStatus,
      | 'default'
      | 'primary'
      | 'secondary'
      | 'error'
      | 'info'
      | 'success'
      | 'warning'
    > = {
      [LocationStatus.DRAFT]: 'default',
      [LocationStatus.PROSPECTING]: 'info',
      [LocationStatus.PENDING_APPROVAL]: 'warning',
      [LocationStatus.APPROVED]: 'success',
      [LocationStatus.SCHEDULED]: 'primary',
      [LocationStatus.COMPLETED]: 'success',
      [LocationStatus.ARCHIVED]: 'default',
    };
    return statusColors[status];
  };

  const getStatusLabel = (status: LocationStatus) => {
    const statusLabels: Record<LocationStatus, string> = {
      [LocationStatus.DRAFT]: 'Rascunho',
      [LocationStatus.PROSPECTING]: 'Prospecção',
      [LocationStatus.PENDING_APPROVAL]: 'Aguardando Aprovação',
      [LocationStatus.APPROVED]: 'Aprovado',
      [LocationStatus.SCHEDULED]: 'Agendado',
      [LocationStatus.COMPLETED]: 'Concluído',
      [LocationStatus.ARCHIVED]: 'Arquivado',
    };
    return statusLabels[status];
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

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
  };

  const priceBySector =
    location.sector_type === SectorType.CINEMA
      ? location.price_day_cinema
      : location.price_day_publicidade;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h5" component="h2">
              {location.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {onEdit && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => onEdit(location)}
                >
                  Editar
                </Button>
              )}
              {onDelete && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => onDelete(location)}
                >
                  Excluir
                </Button>
              )}
              <Button
                size="small"
                variant="outlined"
                onClick={onClose}
                startIcon={<Close />}
              >
                Fechar
              </Button>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={3}>
            {/* Imagens com Lightbox */}
            {location.photos && location.photos.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Galeria de Fotos ({location.photos.length})
                </Typography>
                <PhotoGallery
                  photos={location.photos.map((photo, idx) => ({
                    id: photo.id || idx,
                    url: toAbsoluteImageUrl(photo.url || photo.thumbnail_url),
                    thumbUrl: toAbsoluteImageUrl(
                      photo.thumbnail_url || photo.url
                    ),
                    caption:
                      photo.caption ||
                      (photo.is_primary ? 'Foto Principal' : `Foto ${idx + 1}`),
                    isPrimary: photo.is_primary,
                  }))}
                  onOpen={index => {
                    setLightboxIndex(index);
                    setLightboxOpen(true);
                  }}
                  cols={3}
                  gap={8}
                />
              </Grid>
            )}

            {/* Informações Principais */}
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Informações Gerais
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={getStatusLabel(location.status)}
                    color={getStatusColor(location.status)}
                    sx={{ mt: 0.5 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tipo de Setor
                  </Typography>
                  <Chip
                    label={getSectorLabel(location.sector_type)}
                    color="primary"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tipo de Espaço
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {getSpaceTypeLabel(location.space_type)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Capacidade
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <People
                      sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }}
                    />
                    <Typography variant="body2">
                      {location.capacity
                        ? `Até ${location.capacity} pessoas`
                        : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Área
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {location.area_size ? `${location.area_size}m²` : 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Preço por Dia
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <AttachMoney
                      sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }}
                    />
                    <Typography variant="body2">
                      {formatCurrency(priceBySector)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Descrição */}
              {location.description && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Descrição
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {location.description}
                  </Typography>
                </Box>
              )}

              {/* Características Especiais */}
              {(location.has_parking ||
                location.has_electricity ||
                location.has_water ||
                location.has_bathroom ||
                location.has_kitchen ||
                location.has_air_conditioning) && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Características Especiais
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {location.has_parking && (
                      <Chip
                        label="Estacionamento"
                        color="success"
                        variant="outlined"
                      />
                    )}
                    {location.has_electricity && (
                      <Chip
                        label="Eletricidade"
                        color="success"
                        variant="outlined"
                      />
                    )}
                    {location.has_water && (
                      <Chip label="Água" color="success" variant="outlined" />
                    )}
                    {location.has_bathroom && (
                      <Chip
                        label="Banheiro"
                        color="success"
                        variant="outlined"
                      />
                    )}
                    {location.has_kitchen && (
                      <Chip
                        label="Cozinha"
                        color="success"
                        variant="outlined"
                      />
                    )}
                    {location.has_air_conditioning && (
                      <Chip
                        label="Ar Condicionado"
                        color="success"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              )}
            </Grid>

            {/* Sidebar com Informações Adicionais */}
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Localização
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOn
                  sx={{ fontSize: 20, color: 'primary.main', mr: 1 }}
                />
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {location.city}, {location.state}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {location.country}
                  </Typography>
                </Box>
              </Box>

              {/* Disponibilidade */}
              {(location.available_from || location.available_to) && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Disponibilidade
                  </Typography>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Disponível a partir de:
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(location.available_from)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Disponível até:
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(location.available_to)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Fornecedor */}
              {location.supplier && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Fornecedor
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                      {location.supplier.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {location.supplier.name}
                      </Typography>
                      {location.supplier.rating && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Rating
                            value={location.supplier.rating}
                            readOnly
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {location.supplier.rating}/5
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                  {location.supplier.email && (
                    <Typography variant="caption" color="text.secondary">
                      {location.supplier.email}
                    </Typography>
                  )}
                  {location.supplier.phone && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block' }}
                    >
                      {location.supplier.phone}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Tags */}
              {location.tags && location.tags.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {location.tags.map(tag => (
                      <Chip
                        key={tag.id}
                        label={tag.name}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} variant="contained">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lightbox para visualização de fotos */}
      {location.photos && location.photos.length > 0 && (
        <PhotoLightbox
          photos={location.photos.map((photo, idx) => ({
            id: photo.id || idx,
            url: toAbsoluteImageUrl(photo.url || photo.thumbnail_url),
            thumbUrl: toAbsoluteImageUrl(photo.thumbnail_url || photo.url),
            caption:
              photo.caption ||
              (photo.is_primary ? 'Foto Principal' : `Foto ${idx + 1}`),
            isPrimary: photo.is_primary,
          }))}
          index={lightboxIndex}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}

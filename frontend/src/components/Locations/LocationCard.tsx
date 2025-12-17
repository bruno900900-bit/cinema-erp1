import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  LocationOn,
  AttachMoney,
  People,
  Edit,
  Delete,
  Visibility,
  Star,
} from '@mui/icons-material';
import { Location, LocationStatus, SectorType } from '../../types/user';

interface LocationCardProps {
  location: Location;
  onEdit?: (location: Location) => void;
  onDelete?: (location: Location) => void;
  onView?: (location: Location) => void;
}

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

const formatCurrency = (value?: number) => {
  if (!value) return 'N/A';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function LocationCard({
  location,
  onEdit,
  onDelete,
  onView,
}: LocationCardProps) {
  const handleEdit = () => onEdit?.(location);
  const handleDelete = () => onDelete?.(location);
  const handleView = () => onView?.(location);

  // Get image URL: prefer cover_photo_url, then first photo, then placeholder
  const primaryPhoto =
    location.photos?.find(photo => photo.is_primary) || location.photos?.[0];
  const imageUrl = location.cover_photo_url || primaryPhoto?.url || '';
  const priceBySector =
    location.sector_type === SectorType.CINEMA
      ? location.price_day_cinema
      : location.price_day_publicidade;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        },
      }}
    >
      {/* Imagem */}
      {imageUrl ? (
        <CardMedia
          component="img"
          height="200"
          image={imageUrl}
          alt={location.title}
          sx={{ objectFit: 'cover' }}
        />
      ) : (
        <Box
          sx={{
            height: 200,
            bgcolor: 'grey.200',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography color="text.secondary">Sem imagem</Typography>
        </Box>
      )}

      {/* Conteúdo */}
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        {/* Status e tipo de setor */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Chip
            label={getStatusLabel(location.status)}
            color={getStatusColor(location.status)}
            size="small"
            variant="outlined"
          />
          <Chip
            label={getSectorLabel(location.sector_type)}
            color="primary"
            size="small"
            variant="outlined"
          />
        </Box>

        {/* Título */}
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontWeight: 'bold',
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.2,
          }}
        >
          {location.title}
        </Typography>

        {/* Localização */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
          <Typography variant="body2" color="text.secondary">
            {location.city}, {location.state}
          </Typography>
        </Box>

        {/* Preço */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AttachMoney
            sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }}
          />
          <Typography variant="body2" color="text.secondary">
            {formatCurrency(priceBySector)} / dia
          </Typography>
        </Box>

        {/* Capacidade */}
        {location.capacity && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <People sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              Até {location.capacity} pessoas
            </Typography>
          </Box>
        )}

        {/* Fornecedor */}
        {location.supplier && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ width: 20, height: 20, mr: 1, fontSize: 12 }}>
              {location.supplier.name.charAt(0)}
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              {location.supplier.name}
              {location.supplier.rating && (
                <Box
                  component="span"
                  sx={{ ml: 1, display: 'inline-flex', alignItems: 'center' }}
                >
                  <Star sx={{ fontSize: 14, color: 'warning.main' }} />
                  {location.supplier.rating}
                </Box>
              )}
            </Typography>
          </Box>
        )}

        {/* Tags */}
        {location.tags && location.tags.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {location.tags.slice(0, 3).map(tag => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
              {location.tags.length > 3 && (
                <Chip
                  label={`+${location.tags.length - 3}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Características Especiais */}
        {(location.has_parking ||
          location.has_electricity ||
          location.has_water ||
          location.has_bathroom ||
          location.has_kitchen ||
          location.has_air_conditioning) && (
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 1 }}
            >
              Características:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {location.has_parking && (
                <Chip
                  label="P"
                  size="small"
                  variant="outlined"
                  title="Estacionamento"
                />
              )}
              {location.has_electricity && (
                <Chip
                  label="E"
                  size="small"
                  variant="outlined"
                  title="Eletricidade"
                />
              )}
              {location.has_water && (
                <Chip label="A" size="small" variant="outlined" title="Água" />
              )}
              {location.has_bathroom && (
                <Chip
                  label="B"
                  size="small"
                  variant="outlined"
                  title="Banheiro"
                />
              )}
              {location.has_kitchen && (
                <Chip
                  label="C"
                  size="small"
                  variant="outlined"
                  title="Cozinha"
                />
              )}
              {location.has_air_conditioning && (
                <Chip
                  label="AC"
                  size="small"
                  variant="outlined"
                  title="Ar Condicionado"
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>

      {/* Ações */}
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Visibility />}
            onClick={handleView}
            sx={{ flex: 1 }}
          >
            Ver
          </Button>

          <Tooltip title="Editar">
            <IconButton size="small" onClick={handleEdit} color="primary">
              <Edit />
            </IconButton>
          </Tooltip>

          <Tooltip title="Excluir">
            <IconButton size="small" onClick={handleDelete} color="error">
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
}

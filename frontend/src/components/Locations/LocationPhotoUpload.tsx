import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  CircularProgress,
  IconButton,
  useTheme,
  alpha,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  PhotoCamera,
  CloudUpload,
  Delete,
  Star,
  StarBorder,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { useLocationPhotos } from '../../hooks/useLocationPhotos';
import { toast } from 'react-toastify';
import { locationService } from '../../services/locationService';

interface LocationPhotoUploadProps {
  locationId: number;
  onPhotosChange?: (photos: any[]) => void;
  onPrimaryPhotoChange?: (photoId: string) => void;
  photos?: any[];
  disabled?: boolean;
}

export default function LocationPhotoUpload({
  locationId,
  onPhotosChange,
  onPrimaryPhotoChange,
}: LocationPhotoUploadProps) {
  const theme = useTheme();
  const { photosResponse, upload, isUploading, remove, isRemoving, refetch } =
    useLocationPhotos(locationId.toString());
  const [isDragging, setIsDragging] = useState(false);
  const [settingCover, setSettingCover] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  // Extract photos array from response
  const photos = photosResponse?.photos || [];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      await handleUpload(files);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      await handleUpload(files);
    }
  };

  const handleUpload = async (files: File[]) => {
    try {
      await upload(files);
      toast.success(`${files.length} foto(s) enviada(s) com sucesso!`);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar fotos. Tente novamente.');
    }
  };

  const handleDelete = async (photoId: string | number) => {
    if (window.confirm('Tem certeza que deseja excluir esta foto?')) {
      try {
        await remove(photoId);
        toast.success('Foto removida com sucesso');
      } catch (error) {
        console.error(error);
        toast.error('Erro ao remover foto');
      }
    }
  };

  const handleSetCover = async (photoId: number) => {
    try {
      setSettingCover(String(photoId));
      await locationService.setCoverPhoto(locationId, photoId);
      toast.success('Foto de capa definida com sucesso!');
      if (onPrimaryPhotoChange) {
        onPrimaryPhotoChange(String(photoId));
      }
      refetch();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao definir foto de capa');
    } finally {
      setSettingCover(null);
    }
  };

  const handleMovePhoto = async (photoId: number, direction: 'up' | 'down') => {
    const currentIndex = photos.findIndex((p: any) => p.id === photoId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= photos.length) return;

    setReordering(true);
    try {
      // Create new order
      const newPhotos = [...photos];
      const [removed] = newPhotos.splice(currentIndex, 1);
      newPhotos.splice(newIndex, 0, removed);

      // Build order array
      const photoOrders = newPhotos.map((p: any, idx: number) => ({
        id: p.id,
        displayOrder: idx + 1,
      }));

      await locationService.reorderPhotos(locationId, photoOrders);
      toast.success('Ordem das fotos atualizada!');
      refetch();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao reordenar fotos');
    } finally {
      setReordering(false);
    }
  };

  const dropZoneSx = {
    border: '2px dashed',
    borderColor: isDragging
      ? theme.palette.primary.main
      : theme.palette.grey[400],
    borderRadius: 4,
    backgroundColor: isDragging
      ? alpha(theme.palette.primary.main, 0.05)
      : 'background.paper',
    transition: 'all 0.3s ease',
    p: 4,
    textAlign: 'center',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    '&:hover': {
      borderColor: theme.palette.primary.main,
      backgroundColor: alpha(theme.palette.primary.main, 0.02),
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4],
    },
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={dropZoneSx}
        component="label"
      >
        <input
          type="file"
          hidden
          multiple
          accept="image/*"
          onChange={handleFileInput}
          disabled={isUploading}
        />

        {isUploading ? (
          <CircularProgress size={48} thickness={4} />
        ) : (
          <CloudUpload
            sx={{
              fontSize: 64,
              color: theme.palette.primary.main,
              mb: 2,
              opacity: 0.8,
            }}
          />
        )}

        <Typography
          variant="h6"
          gutterBottom
          color="text.primary"
          fontWeight={600}
        >
          {isUploading
            ? 'Enviando fotos...'
            : 'Arraste fotos ou clique para adicionar mais'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Suporta JPG, PNG, WEBP - Sem limite de fotos
        </Typography>
      </Box>

      {/* Photo Counter */}
      {photos.length > 0 && (
        <Box
          sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Chip
            label={`${photos.length} foto(s)`}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Typography variant="body2" color="text.secondary">
            Use as setas para reordenar
          </Typography>
        </Box>
      )}

      {/* Gallery Grid */}
      {photos.length > 0 && (
        <Box
          sx={{
            mt: 2,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 2,
          }}
        >
          {photos.map((photo: any, index: number) => (
            <Card
              key={photo.id}
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                position: 'relative',
                boxShadow: theme.shadows[2],
                transition: 'transform 0.2s',
                border: photo.is_primary
                  ? `2px solid ${theme.palette.primary.main}`
                  : 'none',
                opacity: reordering ? 0.7 : 1,
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: theme.shadows[8],
                },
              }}
            >
              {/* Order Number Badge */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 'bold',
                  zIndex: 2,
                }}
              >
                {index + 1}
              </Box>

              <Box
                component="img"
                src={photo.thumbnail_url || photo.url}
                alt={photo.filename}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  const target = e.currentTarget;
                  // Try fallback to main URL if thumbnail fails
                  if (target.src !== photo.url && photo.url) {
                    target.src = photo.url;
                  } else {
                    // Final fallback to placeholder
                    target.src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="14"%3EImagem não disponível%3C/text%3E%3C/svg%3E';
                  }
                }}
                sx={{
                  width: '100%',
                  height: 200,
                  objectFit: 'cover',
                  display: 'block',
                }}
              />

              {/* Cover Badge */}
              {photo.is_primary && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    borderRadius: '50%',
                    p: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                  }}
                >
                  <Star fontSize="small" />
                </Box>
              )}

              {/* Action Buttons - Always Visible Row */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  alignItems: 'center',
                  p: 1,
                  bgcolor: 'grey.100',
                }}
              >
                {/* Move Up */}
                <Tooltip title="Mover para cima">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => handleMovePhoto(photo.id, 'up')}
                      disabled={index === 0 || reordering}
                    >
                      <ArrowUpward fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>

                {/* Move Down */}
                <Tooltip title="Mover para baixo">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => handleMovePhoto(photo.id, 'down')}
                      disabled={index === photos.length - 1 || reordering}
                    >
                      <ArrowDownward fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>

                {/* Set as Cover */}
                <Tooltip
                  title={
                    photo.is_primary ? 'Foto de Capa' : 'Definir como Capa'
                  }
                >
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => handleSetCover(photo.id)}
                      disabled={
                        settingCover === String(photo.id) || photo.is_primary
                      }
                      color={photo.is_primary ? 'primary' : 'default'}
                    >
                      {settingCover === String(photo.id) ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : photo.is_primary ? (
                        <Star fontSize="small" />
                      ) : (
                        <StarBorder fontSize="small" />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>

                {/* View Original */}
                <Tooltip title="Ver original">
                  <IconButton
                    size="small"
                    onClick={() => window.open(photo.url, '_blank')}
                  >
                    <PhotoCamera fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* Delete */}
                <Tooltip title="Excluir">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(photo.id)}
                      disabled={isRemoving}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>

              {/* Filename/Caption */}
              <Box
                sx={{
                  p: 1,
                  bgcolor: 'grey.50',
                  borderTop: '1px solid',
                  borderColor: 'grey.200',
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={photo.original_filename || photo.filename}
                >
                  {photo.caption || photo.original_filename || photo.filename}
                </Typography>
              </Box>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}

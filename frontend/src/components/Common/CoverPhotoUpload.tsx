import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PhotoCamera,
  Delete,
  Edit,
  Close,
  CloudUpload,
  Image as ImageIcon,
} from '@mui/icons-material';

interface Photo {
  id: string;
  url: string;
  name: string;
  isCover?: boolean;
}

interface CoverPhotoUploadProps {
  currentCoverUrl?: string;
  photos?: Photo[];
  onCoverChange: (photoUrl: string) => void;
  onPhotoUpload?: (file: File) => Promise<string>;
  onPhotoDelete?: (photoId: string) => Promise<void>;
  title?: string;
  description?: string;
  maxPhotos?: number;
  acceptedFormats?: string[];
  maxFileSize?: number; // em MB
}

export const CoverPhotoUpload: React.FC<CoverPhotoUploadProps> = ({
  currentCoverUrl,
  photos = [],
  onCoverChange,
  onPhotoUpload,
  onPhotoDelete,
  title = 'Foto de Capa',
  description = 'Selecione uma foto de capa para melhor visualização',
  maxPhotos = 10,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize = 5,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedPhoto(null);
    setError(null);
  };

  const handlePhotoSelect = (photoUrl: string) => {
    setSelectedPhoto(photoUrl);
  };

  const handleSetCover = () => {
    if (selectedPhoto) {
      onCoverChange(selectedPhoto);
      handleCloseDialog();
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validações
    if (!acceptedFormats.includes(file.type)) {
      setError(`Formato não suportado. Use: ${acceptedFormats.join(', ')}`);
      return;
    }

    if (file.size > maxFileSize * 1024 * 1024) {
      setError(`Arquivo muito grande. Máximo: ${maxFileSize}MB`);
      return;
    }

    if (photos.length >= maxPhotos) {
      setError(`Máximo de ${maxPhotos} fotos permitidas`);
      return;
    }

    if (!onPhotoUpload) {
      setError('Upload de fotos não configurado');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const photoUrl = await onPhotoUpload(file);
      // A foto será adicionada à lista automaticamente pelo componente pai
    } catch (error) {
      setError('Erro ao fazer upload da foto');
      console.error('Erro no upload:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!onPhotoDelete) return;

    try {
      await onPhotoDelete(photoId);
    } catch (error) {
      setError('Erro ao deletar foto');
      console.error('Erro ao deletar:', error);
    }
  };

  const handleRemoveCover = () => {
    onCoverChange('');
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        {description}
      </Typography>

      {/* Foto de capa atual */}
      <Box sx={{ mb: 2 }}>
        {currentCoverUrl ? (
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <Card sx={{ maxWidth: 200 }}>
              <CardMedia
                component="img"
                height="120"
                image={currentCoverUrl}
                alt="Foto de capa"
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ p: 1 }}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                  <IconButton
                    size="small"
                    onClick={handleOpenDialog}
                    color="primary"
                    title="Alterar foto de capa"
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={handleRemoveCover}
                    color="error"
                    title="Remover foto de capa"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
            <Chip
              label="Capa"
              size="small"
              color="primary"
              sx={{ position: 'absolute', top: 8, right: 8 }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              border: '2px dashed #ccc',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              maxWidth: 200,
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'action.hover',
              },
            }}
            onClick={handleOpenDialog}
          >
            <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Adicionar foto de capa
            </Typography>
          </Box>
        )}
      </Box>

      {/* Botão para gerenciar fotos */}
      <Button
        variant="outlined"
        startIcon={<PhotoCamera />}
        onClick={handleOpenDialog}
        sx={{ mb: 2 }}
      >
        Gerenciar Fotos ({photos.length})
      </Button>

      {/* Dialog para seleção de fotos */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6">Selecionar Foto de Capa</Typography>
            <IconButton onClick={handleCloseDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Upload de nova foto */}
          {onPhotoUpload && (
            <Box sx={{ mb: 3 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFormats.join(',')}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <Button
                variant="contained"
                startIcon={
                  isUploading ? <CircularProgress size={20} /> : <CloudUpload />
                }
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || photos.length >= maxPhotos}
                sx={{ mb: 2 }}
              >
                {isUploading ? 'Enviando...' : 'Adicionar Nova Foto'}
              </Button>
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
              >
                Formatos aceitos: {acceptedFormats.join(', ')} | Máximo:{' '}
                {maxFileSize}MB
              </Typography>
            </Box>
          )}

          {/* Grid de fotos */}
          <Grid container spacing={2}>
            {photos.map(photo => (
              <Grid item xs={6} sm={4} md={3} key={photo.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedPhoto === photo.url ? 2 : 1,
                    borderColor:
                      selectedPhoto === photo.url ? 'primary.main' : 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                  }}
                  onClick={() => handlePhotoSelect(photo.url)}
                >
                  <CardMedia
                    component="img"
                    height="120"
                    image={photo.url}
                    alt={photo.name}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ p: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="caption" noWrap sx={{ flex: 1 }}>
                        {photo.name}
                      </Typography>
                      {onPhotoDelete && (
                        <IconButton
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            handleDeletePhoto(photo.id);
                          }}
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    {photo.isCover && (
                      <Chip
                        label="Capa"
                        size="small"
                        color="primary"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {photos.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ImageIcon
                sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary">
                Nenhuma foto disponível
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Adicione fotos para poder selecionar uma como capa
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSetCover}
            disabled={!selectedPhoto}
          >
            Definir como Capa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

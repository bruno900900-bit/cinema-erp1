import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { imageUploadService } from '../../services/imageUploadService';

interface ImageUploadProps {
  value?: string | null;
  onChange: (imageUrl: string | null) => void;
  label?: string;
  accept?: string;
  maxSize?: number; // em MB
  disabled?: boolean;
  showPreview?: boolean;
  aspectRatio?: number;
  bucketName?: string;
}

export default function ImageUpload({
  value,
  onChange,
  label = 'Upload de Imagem',
  accept = 'image/*',
  maxSize = 5, // 5MB por padrão
  disabled = false,
  showPreview = true,
  aspectRatio = 16 / 9,
  bucketName,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      // Usar o serviço de upload
      const result = await imageUploadService.uploadImage(file, {
        maxSize,
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        bucketName,
      });

      if (result.success && result.imageUrl) {
        onChange(result.imageUrl);
      } else {
        setError(result.error || 'Erro ao fazer upload da imagem.');
      }
    } catch (err) {
      setError('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (value) {
      // Usar o serviço para remover a imagem
      await imageUploadService.deleteImage(value);
    }
    onChange(null);
    setError(null);
  };

  const handleEditImage = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Simular seleção de arquivo
      const mockEvent = {
        target: { files: [file] },
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(mockEvent);
    }
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {!value ? (
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: 'primary.main',
            backgroundColor: 'primary.50',
            cursor: disabled ? 'default' : 'pointer',
            '&:hover': disabled
              ? {}
              : {
                  backgroundColor: 'primary.100',
                },
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {label}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Clique para selecionar ou arraste uma imagem aqui
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Formatos aceitos: JPG, PNG, GIF • Máximo: {maxSize}MB
          </Typography>
        </Paper>
      ) : (
        <Card sx={{ maxWidth: 400 }}>
          <CardMedia
            component="img"
            height={200}
            image={value}
            alt="Preview"
            sx={{
              objectFit: 'cover',
              aspectRatio: aspectRatio,
            }}
          />
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Imagem Selecionada
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Clique nos botões abaixo para gerenciar a imagem
            </Typography>
          </CardContent>
          <CardActions>
            <Button
              size="small"
              startIcon={<ViewIcon />}
              onClick={() => setPreviewOpen(true)}
            >
              Visualizar
            </Button>
            <Button
              size="small"
              startIcon={<EditIcon />}
              onClick={handleEditImage}
              disabled={disabled}
            >
              Alterar
            </Button>
            <Button
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleRemoveImage}
              disabled={disabled}
            >
              Remover
            </Button>
          </CardActions>
        </Card>
      )}

      {isUploading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Fazendo upload da imagem...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Modal de Preview */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="h6">Preview da Imagem</Typography>
            <IconButton onClick={() => setPreviewOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {value && (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={value}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import React, { useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  Box,
  IconButton,
  Typography,
  Fade,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import DownloadIcon from '@mui/icons-material/Download';
import { PhotoAsset } from './types';

interface PhotoLightboxProps {
  photos: PhotoAsset[];
  index: number;
  open: boolean;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  onAddToPresentation?: (photo: PhotoAsset) => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photos,
  index,
  open,
  onClose,
  onNavigate,
  onAddToPresentation,
}) => {
  const photo = photos[index];
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const [isZoomed, setIsZoomed] = React.useState(false);

  // Reset zoom on navigation
  React.useEffect(() => {
    setIsZoomed(false);
  }, [index]);

  // Keyboard navigation
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        onNavigate((index + 1) % photos.length);
      } else if (e.key === 'ArrowLeft') {
        onNavigate((index - 1 + photos.length) % photos.length);
      } else if (e.key === 'Home') {
        onNavigate(0);
      } else if (e.key === 'End') {
        onNavigate(photos.length - 1);
      }
    },
    [open, index, photos.length, onClose, onNavigate]
  );

  useEffect(() => {
    if (open) {
      lastFocused.current = document.activeElement as HTMLElement;
      window.addEventListener('keydown', handleKey);
      setTimeout(() => dialogRef.current?.focus(), 0);
    }
    return () => {
      window.removeEventListener('keydown', handleKey);
      if (!open && lastFocused.current) {
        lastFocused.current.focus();
      }
    };
  }, [open, handleKey]);

  if (!photo) return null;

  const download = () => {
    fetch(photo.url)
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (photo.caption || 'foto') + '.jpg';
        a.click();
        URL.revokeObjectURL(a.href);
      });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      aria-label="Visualização de foto"
      PaperProps={{
        sx: {
          bgcolor: 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        },
      }}
    >
      <Box
        ref={dialogRef}
        tabIndex={-1}
        sx={{
          outline: 'none',
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        {/* Controles superiores */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}
        >
          <IconButton
            aria-label="Fechar"
            onClick={onClose}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>

        {/* Navegação lateral */}
        {photos.length > 1 && (
          <>
            <IconButton
              aria-label="Anterior"
              onClick={() =>
                onNavigate((index - 1 + photos.length) % photos.length)
              }
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
              }}
            >
              <ArrowBackIosNewIcon />
            </IconButton>
            <IconButton
              aria-label="Próxima"
              onClick={() => onNavigate((index + 1) % photos.length)}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'white',
              }}
            >
              <ArrowForwardIosIcon />
            </IconButton>
          </>
        )}

        {/* Foto */}
        <Fade in={open} key={photo.id} timeout={300}>
          <Box
            sx={{
              maxWidth: '90%',
              maxHeight: '80%',
              mx: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              cursor: isZoomed ? 'zoom-out' : 'zoom-in',
            }}
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <img
              src={photo.url}
              alt={photo.caption || 'Foto'}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: 4,
                transition: 'transform 0.3s ease',
                transform: isZoomed ? 'scale(2)' : 'scale(1)',
              }}
            />
          </Box>
        </Fade>

        {/* Barra inferior */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            px: 3,
            py: 2,
            bgcolor: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'white',
          }}
        >
          <Typography variant="body2" sx={{ maxWidth: '60%' }}>
            {photo.caption || 'Sem legenda'}
          </Typography>
          <Stack direction="row" spacing={1}>
            {onAddToPresentation && (
              <IconButton
                aria-label="Adicionar à apresentação"
                onClick={() => onAddToPresentation(photo)}
                sx={{ color: 'white' }}
              >
                <PlaylistAddIcon />
              </IconButton>
            )}
            <IconButton
              aria-label="Baixar"
              onClick={download}
              sx={{ color: 'white' }}
            >
              <DownloadIcon />
            </IconButton>
          </Stack>
        </Box>
      </Box>
    </Dialog>
  );
};

export default PhotoLightbox;

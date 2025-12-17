import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  Box,
  IconButton,
  Typography,
  useTheme,
  alpha,
  Fade,
  Zoom as ZoomAnimation,
} from '@mui/material';
import {
  Close,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  Delete,
  Star,
  StarBorder,
} from '@mui/icons-material';

interface Photo {
  id: number;
  url: string;
  thumbnail_url?: string;
  caption?: string;
  is_primary?: boolean;
  original_filename?: string;
}

interface PhotoGalleryLightboxProps {
  photos: Photo[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
  onDelete?: (photoId: number) => void;
  onSetPrimary?: (photoId: number) => void;
  canEdit?: boolean;
}

export default function PhotoGalleryLightbox({
  photos,
  initialIndex = 0,
  open,
  onClose,
  onDelete,
  onSetPrimary,
  canEdit = false,
}: PhotoGalleryLightboxProps) {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const currentPhoto = photos[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [initialIndex, open]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [currentIndex, photos.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [currentIndex]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 1));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentPhoto.url;
    link.download =
      currentPhoto.original_filename || `photo-${currentPhoto.id}.jpg`;
    link.click();
  };

  const handleDelete = () => {
    if (
      onDelete &&
      window.confirm('Tem certeza que deseja excluir esta foto?')
    ) {
      onDelete(currentPhoto.id);
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (photos.length > 1) {
        setCurrentIndex(0);
      } else {
        onClose();
      }
    }
  };

  const handleSetPrimary = () => {
    if (onSetPrimary) {
      onSetPrimary(currentPhoto.id);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [open, handleNext, handlePrevious, onClose]);

  if (!currentPhoto) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: 'rgba(0, 0, 0, 0.95)',
          backgroundImage: 'none',
        },
      }}
      TransitionComponent={Fade}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Header Bar */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" color="white" sx={{ fontWeight: 600 }}>
              {currentIndex + 1} / {photos.length}
            </Typography>
            {currentPhoto.caption && (
              <Typography variant="body2" color="rgba(255,255,255,0.8)">
                {currentPhoto.caption}
              </Typography>
            )}
            {currentPhoto.is_primary && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  bgcolor: theme.palette.primary.main,
                }}
              >
                <Star sx={{ fontSize: 16, color: 'white' }} />
                <Typography variant="caption" color="white" fontWeight="bold">
                  Foto Principal
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              sx={{ color: 'white' }}
            >
              <ZoomOut />
            </IconButton>
            <Typography variant="body2" color="white" sx={{ px: 2, py: 1 }}>
              {Math.round(zoom * 100)}%
            </Typography>
            <IconButton
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              sx={{ color: 'white' }}
            >
              <ZoomIn />
            </IconButton>

            <IconButton onClick={handleDownload} sx={{ color: 'white' }}>
              <Download />
            </IconButton>

            {canEdit && onSetPrimary && (
              <IconButton
                onClick={handleSetPrimary}
                disabled={currentPhoto.is_primary}
                sx={{
                  color: currentPhoto.is_primary
                    ? theme.palette.primary.main
                    : 'white',
                }}
              >
                {currentPhoto.is_primary ? <Star /> : <StarBorder />}
              </IconButton>
            )}

            {canEdit && onDelete && (
              <IconButton onClick={handleDelete} sx={{ color: 'white' }}>
                <Delete />
              </IconButton>
            )}

            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </Box>

        {/* Main Image */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <ZoomAnimation in={open} timeout={300}>
            <Box
              component="img"
              src={currentPhoto.url}
              alt={currentPhoto.caption || 'Foto'}
              sx={{
                maxWidth: zoom > 1 ? 'none' : '90%',
                maxHeight: zoom > 1 ? 'none' : '90%',
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${
                  position.y / zoom
                }px)`,
                transition: isDragging ? 'none' : 'transform 0.3s ease',
                userSelect: 'none',
                pointerEvents: zoom > 1 ? 'none' : 'auto',
              }}
              draggable={false}
            />
          </ZoomAnimation>
        </Box>

        {/* Navigation Buttons */}
        {currentIndex > 0 && (
          <IconButton
            onClick={handlePrevious}
            sx={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: alpha(theme.palette.common.black, 0.6),
              color: 'white',
              '&:hover': {
                bgcolor: alpha(theme.palette.common.black, 0.8),
              },
              width: 56,
              height: 56,
            }}
          >
            <ChevronLeft sx={{ fontSize: 32 }} />
          </IconButton>
        )}

        {currentIndex < photos.length - 1 && (
          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: alpha(theme.palette.common.black, 0.6),
              color: 'white',
              '&:hover': {
                bgcolor: alpha(theme.palette.common.black, 0.8),
              },
              width: 56,
              height: 56,
            }}
          >
            <ChevronRight sx={{ fontSize: 32 }} />
          </IconButton>
        )}

        {/* Thumbnail Strip */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            p: 2,
            background:
              'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
            display: 'flex',
            gap: 1,
            justifyContent: 'center',
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              height: 6,
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'rgba(255,255,255,0.3)',
              borderRadius: 3,
            },
          }}
        >
          {photos.map((photo, index) => (
            <Box
              key={photo.id}
              component="img"
              src={photo.thumbnail_url || photo.url}
              alt={`Thumbnail ${index + 1}`}
              onClick={() => {
                setCurrentIndex(index);
                setZoom(1);
                setPosition({ x: 0, y: 0 });
              }}
              sx={{
                width: 80,
                height: 60,
                objectFit: 'cover',
                borderRadius: 1,
                cursor: 'pointer',
                opacity: index === currentIndex ? 1 : 0.5,
                border:
                  index === currentIndex
                    ? `3px solid ${theme.palette.primary.main}`
                    : '3px solid transparent',
                transition: 'all 0.2s',
                '&:hover': {
                  opacity: 1,
                  transform: 'scale(1.1)',
                },
              }}
            />
          ))}
        </Box>
      </Box>
    </Dialog>
  );
}

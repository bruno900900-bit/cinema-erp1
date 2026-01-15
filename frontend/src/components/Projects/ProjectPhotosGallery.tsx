/**
 * ProjectPhotosGallery - Galeria de fotos agrupadas por locação
 * Mostra fotos das locações do projeto (ProjectLocation + Location inherited photos)
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  Collapse,
  useTheme,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Place,
  PhotoCamera,
  Close,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { projectLocationService } from '../../services/projectLocationService';

interface ProjectPhotosGalleryProps {
  projectId: number;
}

interface PhotoItem {
  id: string;
  url: string;
  caption?: string;
  locationName: string;
  source: 'location' | 'project_location';
}

const ProjectPhotosGallery: React.FC<ProjectPhotosGalleryProps> = ({
  projectId,
}) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [allPhotos, setAllPhotos] = useState<PhotoItem[]>([]);

  // Fetch project locations with their photos
  const { data: projectLocations = [], isLoading } = useQuery({
    queryKey: ['projectLocations', projectId],
    queryFn: () => projectLocationService.getProjectLocations(projectId),
  });

  // Group photos by location
  const locationPhotos = React.useMemo(() => {
    const groups: Array<{
      locationId: number;
      locationName: string;
      photos: PhotoItem[];
    }> = [];

    const allPhotosList: PhotoItem[] = [];

    projectLocations.forEach(pl => {
      const locationName = pl.location?.title || `Locação ${pl.id}`;
      const photos: PhotoItem[] = [];

      // Add photos from Location (inherited)
      if (pl.location?.photos) {
        pl.location.photos.forEach(photo => {
          const photoItem: PhotoItem = {
            id: `loc-${photo.id}`,
            url: photo.url || photo.file_path || '',
            caption: photo.caption,
            locationName,
            source: 'location',
          };
          photos.push(photoItem);
          allPhotosList.push(photoItem);
        });
      }

      // Add photos from ProjectLocation (project-specific)
      if (pl.project_photos) {
        pl.project_photos.forEach(photo => {
          const photoItem: PhotoItem = {
            id: `pl-${photo.id}`,
            url: photo.url || photo.file_path || '',
            caption: photo.caption,
            locationName,
            source: 'project_location',
          };
          photos.push(photoItem);
          allPhotosList.push(photoItem);
        });
      }

      if (photos.length > 0) {
        groups.push({
          locationId: pl.location_id,
          locationName,
          photos,
        });
      }
    });

    setAllPhotos(allPhotosList);
    return groups;
  }, [projectLocations]);

  const totalPhotos = locationPhotos.reduce(
    (acc, g) => acc + g.photos.length,
    0
  );

  const handlePhotoClick = (globalIndex: number) => {
    setCurrentPhotoIndex(globalIndex);
    setLightboxOpen(true);
  };

  const handlePrev = () => {
    setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : allPhotos.length - 1));
  };

  const handleNext = () => {
    setCurrentPhotoIndex(prev => (prev < allPhotos.length - 1 ? prev + 1 : 0));
  };

  if (isLoading) {
    return (
      <Paper sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (totalPhotos === 0) {
    return null; // Don't show if no photos
  }

  let globalPhotoIndex = 0;

  return (
    <Paper
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.info.main,
            0.1
          )} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PhotoCamera color="info" />
          <Typography variant="h6" fontWeight={600}>
            Fotos do Projeto
          </Typography>
          <Chip
            size="small"
            label={`${totalPhotos} fotos`}
            color="info"
            variant="outlined"
          />
        </Box>
        <IconButton>{isExpanded ? <ExpandLess /> : <ExpandMore />}</IconButton>
      </Box>

      <Collapse in={isExpanded}>
        <Box sx={{ p: 2 }}>
          {locationPhotos.map(group => (
            <Box key={group.locationId} sx={{ mb: 3 }}>
              {/* Location Header */}
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}
              >
                <Place sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  {group.locationName}
                </Typography>
                <Chip
                  size="small"
                  label={`${group.photos.length} fotos`}
                  variant="outlined"
                  sx={{ height: 20 }}
                />
              </Box>

              {/* Photo Grid */}
              <Grid container spacing={1}>
                {group.photos.map((photo, idx) => {
                  const photoGlobalIndex = globalPhotoIndex++;
                  return (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={photo.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'scale(1.02)',
                            boxShadow: theme.shadows[4],
                          },
                        }}
                        onClick={() => handlePhotoClick(photoGlobalIndex)}
                      >
                        <CardMedia
                          component="img"
                          height={100}
                          image={photo.url || '/placeholder.jpg'}
                          alt={photo.caption || 'Foto'}
                          sx={{ objectFit: 'cover' }}
                        />
                        {photo.source === 'project_location' && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                            }}
                          >
                            <Chip
                              size="small"
                              label="Projeto"
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                bgcolor: alpha(theme.palette.success.main, 0.9),
                                color: 'white',
                              }}
                            />
                          </Box>
                        )}
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          ))}
        </Box>
      </Collapse>

      {/* Lightbox */}
      <Dialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { bgcolor: 'black', position: 'relative' } }}
      >
        <IconButton
          onClick={() => setLightboxOpen(false)}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'white',
            zIndex: 1,
          }}
        >
          <Close />
        </IconButton>
        <DialogContent
          sx={{
            p: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
          }}
        >
          {allPhotos.length > 0 && (
            <>
              <IconButton
                onClick={handlePrev}
                sx={{ position: 'absolute', left: 8, color: 'white' }}
              >
                <ChevronLeft sx={{ fontSize: 40 }} />
              </IconButton>
              <Box sx={{ textAlign: 'center' }}>
                <img
                  src={allPhotos[currentPhotoIndex]?.url || ''}
                  alt={allPhotos[currentPhotoIndex]?.caption || 'Foto'}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                  }}
                />
                <Box sx={{ mt: 2, color: 'white' }}>
                  <Typography variant="body2">
                    {allPhotos[currentPhotoIndex]?.locationName}
                  </Typography>
                  {allPhotos[currentPhotoIndex]?.caption && (
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {allPhotos[currentPhotoIndex].caption}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    sx={{ display: 'block', mt: 1, opacity: 0.6 }}
                  >
                    {currentPhotoIndex + 1} / {allPhotos.length}
                  </Typography>
                </Box>
              </Box>
              <IconButton
                onClick={handleNext}
                sx={{ position: 'absolute', right: 8, color: 'white' }}
              >
                <ChevronRight sx={{ fontSize: 40 }} />
              </IconButton>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default ProjectPhotosGallery;

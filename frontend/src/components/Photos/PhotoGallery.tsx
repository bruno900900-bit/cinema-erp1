import React from 'react';
import {
  Box,
  ImageList,
  ImageListItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import { useContext } from 'react';
import { PresentationContext } from './builder/PresentationContext';

import { PhotoAsset } from './types';

interface PhotoGalleryProps {
  photos: PhotoAsset[];
  onOpen: (index: number) => void;
  cols?: number;
  gap?: number;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onOpen,
  cols = 4,
  gap = 8,
}) => {
  const context = useContext(PresentationContext);
  const isSelected = (id: string | number) =>
    context?.photos.some(p => p.id === id) ?? false;

  if (!photos || photos.length === 0) {
    return (
      <Box sx={{ p: 2, color: 'text.secondary' }}>Nenhuma foto disponível</Box>
    );
  }
  return (
    <ImageList cols={cols} gap={gap} sx={{ m: 0 }}>
      {photos.map((p, idx) => (
        <ImageListItem
          key={p.id}
          sx={{
            cursor: 'pointer',
            position: 'relative',
            '&:hover .add-btn': { opacity: 1 },
          }}
        >
          <img
            src={p.thumbUrl || p.url}
            alt={p.caption || `Foto ${idx + 1}`}
            loading="lazy"
            onClick={() => onOpen(idx)}
            onError={e => {
              console.error('❌ Erro ao carregar foto:', p.url);
              console.log('📸 URL da foto que falhou:', p);
              // Tentar URL alternativa ou mostrar placeholder
              const target = e.target as HTMLImageElement;
              if (!target.src.includes('placeholder')) {
                target.src = '/placeholder-location.jpg';
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 4,
            }}
          />
          {context && (
            <Tooltip
              title={
                isSelected(p.id) ? 'Já adicionada' : 'Adicionar à apresentação'
              }
            >
              <span>
                <IconButton
                  size="small"
                  className="add-btn"
                  aria-label="Adicionar à apresentação"
                  onClick={e => {
                    e.stopPropagation();
                    if (!isSelected(p.id) && context.addPhoto) {
                      context.addPhoto(p);
                    }
                  }}
                  disabled={isSelected(p.id)}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    bgcolor: 'rgba(0,0,0,0.55)',
                    color: 'white',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                  }}
                >
                  <PlaylistAddIcon fontSize="inherit" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </ImageListItem>
      ))}
    </ImageList>
  );
};

export default PhotoGallery;

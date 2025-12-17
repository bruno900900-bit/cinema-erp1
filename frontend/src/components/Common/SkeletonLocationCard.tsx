import React from 'react';
import { Card, CardContent, Skeleton, Box } from '@mui/material';

/**
 * Skeleton loader para LocationCard
 * Melhora a percepção de performance durante carregamento
 */
export default function SkeletonLocationCard() {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Image skeleton */}
      <Skeleton
        variant="rectangular"
        height={200}
        animation="wave"
        sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}
      />

      <CardContent sx={{ flexGrow: 1 }}>
        {/* Title skeleton */}
        <Skeleton
          variant="text"
          width="80%"
          height={32}
          animation="wave"
          sx={{ mb: 1, bgcolor: 'rgba(255, 255, 255, 0.05)' }}
        />

        {/* Subtitle skeleton */}
        <Skeleton
          variant="text"
          width="60%"
          height={24}
          animation="wave"
          sx={{ mb: 2, bgcolor: 'rgba(255, 255, 255, 0.05)' }}
        />

        {/* Description skeletons */}
        <Box sx={{ mb: 2 }}>
          <Skeleton
            variant="text"
            width="100%"
            animation="wave"
            sx={{ mb: 0.5, bgcolor: 'rgba(255, 255, 255, 0.05)' }}
          />
          <Skeleton
            variant="text"
            width="90%"
            animation="wave"
            sx={{ mb: 0.5, bgcolor: 'rgba(255, 255, 255, 0.05)' }}
          />
          <Skeleton
            variant="text"
            width="70%"
            animation="wave"
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}
          />
        </Box>

        {/* Tags skeleton */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Skeleton
            variant="rounded"
            width={60}
            height={24}
            animation="wave"
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}
          />
          <Skeleton
            variant="rounded"
            width={80}
            height={24}
            animation="wave"
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}
          />
          <Skeleton
            variant="rounded"
            width={70}
            height={24}
            animation="wave"
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}
          />
        </Box>

        {/* Actions skeleton */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Skeleton
            variant="circular"
            width={40}
            height={40}
            animation="wave"
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}
          />
          <Skeleton
            variant="circular"
            width={40}
            height={40}
            animation="wave"
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}
          />
          <Skeleton
            variant="circular"
            width={40}
            height={40}
            animation="wave"
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

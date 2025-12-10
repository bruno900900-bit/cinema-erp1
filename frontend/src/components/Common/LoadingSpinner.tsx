import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
}

export default function LoadingSpinner({
  message = 'Carregando...',
  size = 40,
}: LoadingSpinnerProps) {
  console.log('⏳ LoadingSpinner rendering with message:', message);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
        backgroundColor: '#f5f5f5',
      }}
    >
      <CircularProgress size={size} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

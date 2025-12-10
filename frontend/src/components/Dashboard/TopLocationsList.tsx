import React from 'react'
import { Box, Typography } from '@mui/material'

export default function TopLocationsList() {
  console.log('🏆 TopLocationsList rendering...')

  return (
    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        Lista de top locações em desenvolvimento...
      </Typography>
    </Box>
  )
}

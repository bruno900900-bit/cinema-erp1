import React from 'react'
import { Box, Typography } from '@mui/material'

export default function RecentVisitsList() {
  console.log('📋 RecentVisitsList rendering...')

  return (
    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        Lista de visitas recentes em desenvolvimento...
      </Typography>
    </Box>
  )
}

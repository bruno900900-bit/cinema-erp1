import React from 'react'
import { Box, Typography } from '@mui/material'

export default function RevenueChart() {
  console.log('📈 RevenueChart rendering...')

  return (
    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        Gráfico de receita em desenvolvimento...
      </Typography>
    </Box>
  )
}

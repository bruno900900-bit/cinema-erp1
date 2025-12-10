import React from 'react'
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Chip,
} from '@mui/material'
import { TrendingUp, TrendingDown } from '@mui/icons-material'

interface MetricCardProps {
  title: string
  value: string
  icon: React.ReactNode
  color: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error'
  trend?: string
  trendDirection?: 'up' | 'down'
}

export default function MetricCard({
  title,
  value,
  icon,
  color,
  trend,
  trendDirection,
}: MetricCardProps) {
  console.log('📊 MetricCard rendering:', { title, value, color })

  const getColorValue = (colorName: string) => {
    const colorMap: Record<string, string> = {
      primary: '#1976d2',
      secondary: '#dc004e',
      info: '#0288d1',
      success: '#2e7d32',
      warning: '#ed6c02',
      error: '#d32f2f',
    }
    return colorMap[colorName] || colorMap.primary
  }

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: `${getColorValue(color)}20`,
              color: getColorValue(color),
              width: 48,
              height: 48,
            }}
          >
            {icon}
          </Avatar>

          {trend && (
            <Chip
              icon={trendDirection === 'up' ? <TrendingUp /> : <TrendingDown />}
              label={trend}
              size="small"
              color={trendDirection === 'up' ? 'success' : 'error'}
              variant="outlined"
            />
          )}
        </Box>

        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
          {value}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  )
}

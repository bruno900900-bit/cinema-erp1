import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  LinearProgress,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Download,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  LocationOn,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { projectLocationService } from '@/services/projectLocationService';
import * as XLSX from 'xlsx';
import { formatDateBR } from '@/utils/date';

interface ProjectBudgetDashboardProps {
  projectId: number;
  budget: number;
  budgetSpent?: number;
  projectName: string;
}

export default function ProjectBudgetDashboard({
  projectId,
  budget,
  budgetSpent = 0,
  projectName,
}: ProjectBudgetDashboardProps) {
  const theme = useTheme();

  // Fetch project locations for this project
  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['project-locations', projectId],
    queryFn: () =>
      projectLocationService.getProjectLocationsByProject(projectId),
    enabled: !!projectId,
  });

  // Calculate totals from locations
  const totalFromLocations = locations.reduce(
    (sum, loc) => sum + (loc.total_cost || loc.daily_rate || 0),
    0
  );
  const calculatedSpent = budgetSpent || totalFromLocations;
  const budgetRemaining = budget - calculatedSpent;
  const budgetPercentage = budget > 0 ? (calculatedSpent / budget) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleExportExcel = () => {
    // Prepare data for Excel
    const exportData = locations.map((loc, index) => ({
      '#': index + 1,
      'Nome da Locação': loc.location?.title || `Locação ${loc.location_id}`,
      'Valor (R$)': loc.total_cost || loc.daily_rate || 0,
      'Data Início': loc.rental_start ? formatDateBR(loc.rental_start) : '-',
      'Data Fim': loc.rental_end ? formatDateBR(loc.rental_end) : '-',
      Status: loc.status || '-',
    }));

    // Add summary row
    exportData.push({
      '#': '',
      'Nome da Locação': 'TOTAL',
      'Valor (R$)': totalFromLocations,
      'Data Início': '',
      'Data Fim': '',
      Status: '',
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    ws['!cols'] = [
      { wch: 5 }, // #
      { wch: 35 }, // Nome
      { wch: 15 }, // Valor
      { wch: 12 }, // Data Início
      { wch: 12 }, // Data Fim
      { wch: 15 }, // Status
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orçamento');

    // Generate filename
    const filename = `orcamento_${projectName.replace(/\s+/g, '_')}_${
      new Date().toISOString().split('T')[0]
    }.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
  };

  const getProgressColor = () => {
    if (budgetPercentage >= 100) return 'error';
    if (budgetPercentage >= 80) return 'warning';
    return 'success';
  };

  return (
    <Box>
      {/* Budget Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Budget */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AccountBalance />
                <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                  Verba Total
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(budget)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Spent */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
              color: 'white',
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingDown />
                <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                  Valor Utilizado
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(calculatedSpent)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Remaining */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              color: 'white',
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUp />
                <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                  Saldo Restante
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(budgetRemaining)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Bar */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">Utilização do Orçamento</Typography>
          <Chip
            label={`${budgetPercentage.toFixed(1)}%`}
            color={getProgressColor()}
            size="small"
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(budgetPercentage, 100)}
          color={getProgressColor()}
          sx={{ height: 12, borderRadius: 6 }}
        />
        {budgetPercentage > 100 && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            ⚠️ Orçamento excedido em {formatCurrency(Math.abs(budgetRemaining))}
          </Typography>
        )}
      </Paper>

      {/* Locations Table */}
      <Paper sx={{ p: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <LocationOn color="primary" />
            <Typography variant="h6">Locações do Projeto</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExportExcel}
            disabled={locations.length === 0}
          >
            Exportar Excel
          </Button>
        </Box>

        {isLoading ? (
          <LinearProgress />
        ) : locations.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            Nenhuma locação associada a este projeto.
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}
                >
                  <TableCell>#</TableCell>
                  <TableCell>Nome da Locação</TableCell>
                  <TableCell align="right">Valor</TableCell>
                  <TableCell>Data Início</TableCell>
                  <TableCell>Data Fim</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {locations.map((loc, index) => (
                  <TableRow key={loc.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Typography fontWeight={500}>
                        {loc.location?.title || `Locação ${loc.location_id}`}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color="primary">
                        {formatCurrency(loc.total_cost || loc.daily_rate || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {loc.rental_start ? formatDateBR(loc.rental_start) : '-'}
                    </TableCell>
                    <TableCell>
                      {loc.rental_end ? formatDateBR(loc.rental_end) : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={loc.status || 'N/A'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {/* Total Row */}
                <TableRow
                  sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                >
                  <TableCell colSpan={2}>
                    <Typography fontWeight="bold">TOTAL</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold" color="primary" fontSize={18}>
                      {formatCurrency(totalFromLocations)}
                    </Typography>
                  </TableCell>
                  <TableCell colSpan={3} />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}

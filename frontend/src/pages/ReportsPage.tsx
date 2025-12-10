import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  LocationOn,
  AttachMoney,
  People,
  CalendarToday,
  Download,
} from '@mui/icons-material';
import { locationService } from '../services/locationService';
// import { projectService } from '../services/projectService';

interface LocationStats {
  total_locations: number;
  by_status: { [key: string]: number };
  by_space_type: { [key: string]: number };
  by_city: { [key: string]: number };
  price_ranges: { [key: string]: number };
}

interface ProjectStats {
  total_projects: number;
  by_status: { [key: string]: number };
  by_type: { [key: string]: number };
  by_month: { [key: string]: number };
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
];

export default function ReportsPage() {
  const [locationStats, setLocationStats] = useState<LocationStats | null>(
    null
  );
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('locations');

  useEffect(() => {
    loadStats();
  }, [selectedPeriod]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar estatísticas de locações
      const locationData = await locationService.getLocationStats();
      setLocationStats(locationData);

      // Carregar estatísticas de projetos (mock por enquanto)
      const projectData = await getProjectStats();
      setProjectStats(projectData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const getProjectStats = async (): Promise<ProjectStats> => {
    // Mock data - substituir por API real quando disponível
    return {
      total_projects: 45,
      by_status: {
        'Em Produção': 12,
        'Pré-Produção': 8,
        'Pós-Produção': 15,
        Concluído: 10,
      },
      by_type: {
        Filme: 20,
        Série: 15,
        Documentário: 7,
        Comercial: 3,
      },
      by_month: {
        Jan: 5,
        Fev: 8,
        Mar: 12,
        Abr: 7,
        Mai: 9,
        Jun: 11,
      },
    };
  };

  const formatDataForChart = (data: { [key: string]: number }) => {
    return Object.entries(data).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const exportToPDF = () => {
    // TODO: Implementar exportação para PDF
    console.log('Exportando para PDF...');
  };

  const exportToExcel = () => {
    // TODO: Implementar exportação para Excel
    console.log('Exportando para Excel...');
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Carregando relatórios...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadStats}>
          Tentar Novamente
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          📊 Relatórios e Estatísticas
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Análise completa do seu portfólio de locações e projetos
        </Typography>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Período</InputLabel>
              <Select
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value)}
                label="Período"
              >
                <MenuItem value="all">Todos os Períodos</MenuItem>
                <MenuItem value="30">Últimos 30 dias</MenuItem>
                <MenuItem value="90">Últimos 90 dias</MenuItem>
                <MenuItem value="year">Este Ano</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Métrica</InputLabel>
              <Select
                value={selectedMetric}
                onChange={e => setSelectedMetric(e.target.value)}
                label="Métrica"
              >
                <MenuItem value="locations">Locações</MenuItem>
                <MenuItem value="projects">Projetos</MenuItem>
                <MenuItem value="revenue">Receita</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={exportToPDF}
              >
                PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={exportToExcel}
              >
                Excel
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Cards de Resumo */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOn color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {locationStats?.total_locations || 0}
                  </Typography>
                  <Typography color="text.secondary">
                    Total de Locações
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <People color="secondary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {projectStats?.total_projects || 0}
                  </Typography>
                  <Typography color="text.secondary">
                    Projetos Ativos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoney color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">R$ 2.4M</Typography>
                  <Typography color="text.secondary">Receita Total</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp color="warning" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">+12%</Typography>
                  <Typography color="text.secondary">Crescimento</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3}>
        {/* Gráfico de Status das Locações */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Status das Locações
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formatDataForChart(locationStats?.by_status || {})}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {formatDataForChart(locationStats?.by_status || {}).map(
                    (_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    )
                  )}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gráfico de Tipos de Espaço */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Tipos de Espaço
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={formatDataForChart(locationStats?.by_space_type || {})}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gráfico de Cidades */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Locações por Cidade
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formatDataForChart(locationStats?.by_city || {})}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gráfico de Faixas de Preço */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Faixas de Preço
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formatDataForChart(locationStats?.price_ranges || {})}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {formatDataForChart(locationStats?.price_ranges || {}).map(
                    (_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    )
                  )}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gráfico de Projetos por Mês */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Projetos por Mês
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={formatDataForChart(projectStats?.by_month || {})}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Tags de Status */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Resumo por Status
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.entries(locationStats?.by_status || {}).map(
            ([status, count]) => (
              <Chip
                key={status}
                label={`${status}: ${count}`}
                color="primary"
                variant="outlined"
              />
            )
          )}
        </Box>
      </Box>
    </Container>
  );
}

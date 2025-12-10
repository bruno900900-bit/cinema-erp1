import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Skeleton,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  LocationOn,
  Business,
  TrendingUp,
  AttachMoney,
  Assignment,
  Event,
  People,
  CheckCircle,
  Schedule,
  Movie,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  dashboardService,
  DashboardStats,
  ProjectSummary,
  UpcomingEvent,
  RecentLocation,
  FinancialSummary,
} from '../services/dashboardService';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    value
  );

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
};

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

function KPICard({
  title,
  value,
  subtitle,
  icon,
  color,
  loading,
}: KPICardProps) {
  const theme = useTheme();
  return (
    <Paper
      sx={{
        p: 3,
        background: `linear-gradient(135deg, ${alpha(color, 0.15)} 0%, ${alpha(
          theme.palette.background.paper,
          0.9
        )} 100%)`,
        border: `1px solid ${alpha(color, 0.3)}`,
        borderRadius: 3,
        height: '100%',
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          {loading ? (
            <Skeleton width={80} height={40} />
          ) : (
            <Typography variant="h4" fontWeight="bold" sx={{ color }}>
              {value}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Avatar
          sx={{
            bgcolor: alpha(color, 0.2),
            color: color,
            width: 48,
            height: 48,
          }}
        >
          {icon}
        </Avatar>
      </Box>
    </Paper>
  );
}

export default function DashboardPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
  });

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['dashboard-projects'],
    queryFn: () => dashboardService.getActiveProjects(5),
  });

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['dashboard-events'],
    queryFn: () => dashboardService.getUpcomingEvents(5),
  });

  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ['dashboard-locations'],
    queryFn: () => dashboardService.getRecentLocations(4),
  });

  const { data: financialData, isLoading: financialLoading } = useQuery({
    queryKey: ['dashboard-financial'],
    queryFn: () => dashboardService.getFinancialSummary(),
  });

  const projects = projectsData?.projects || [];
  const events = eventsData?.events || [];
  const locations = locationsData?.locations || [];
  const financial = financialData;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Visão geral da produtora de locação
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Projetos Ativos"
            value={stats?.active_projects || 0}
            subtitle={`${stats?.total_projects || 0} total`}
            icon={<Assignment />}
            color={theme.palette.primary.main}
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Locações"
            value={stats?.total_locations || 0}
            subtitle={`${stats?.approved_locations || 0} aprovadas`}
            icon={<LocationOn />}
            color={theme.palette.success.main}
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Próximos Eventos"
            value={stats?.upcoming_events || 0}
            subtitle="nos próximos 7 dias"
            icon={<Event />}
            color={theme.palette.info.main}
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Orçamento Total"
            value={formatCurrency(stats?.total_budget || 0)}
            subtitle={`Restante: ${formatCurrency(
              stats?.budget_remaining || 0
            )}`}
            icon={<AttachMoney />}
            color={theme.palette.warning.main}
            loading={statsLoading}
          />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Projetos em Andamento */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6" fontWeight="bold">
                Projetos em Andamento
              </Typography>
              <Chip
                label={`${projects.length} ativos`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
            {projectsLoading ? (
              <Box>
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} height={80} sx={{ mb: 1 }} />
                ))}
              </Box>
            ) : projects.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>
                Nenhum projeto ativo no momento
              </Typography>
            ) : (
              <List disablePadding>
                {projects.map((project: ProjectSummary, idx: number) => (
                  <ListItem
                    key={project.id}
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderRadius: 2,
                      mb: 1,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                      },
                    }}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        <Movie />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography fontWeight="bold">
                            {project.name}
                          </Typography>
                          <Chip
                            label={`${project.location_count} locações`}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {project.client_name || 'Sem cliente'} •{' '}
                            {project.start_date &&
                              `${formatDate(project.start_date)}`}
                            {project.end_date &&
                              ` - ${formatDate(project.end_date)}`}
                          </Typography>
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            mt={0.5}
                          >
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(project.budget_progress, 100)}
                              sx={{
                                flex: 1,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                              }}
                              color={
                                project.budget_progress > 90
                                  ? 'error'
                                  : 'primary'
                              }
                            />
                            <Typography variant="caption" fontWeight="bold">
                              {project.budget_progress.toFixed(0)}%
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="primary"
                    >
                      {formatCurrency(project.budget_total)}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Próximos Eventos */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6" fontWeight="bold">
                Próximos Eventos
              </Typography>
              <Schedule color="action" />
            </Box>
            {eventsLoading ? (
              <Box>
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} height={60} sx={{ mb: 1 }} />
                ))}
              </Box>
            ) : events.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>
                Nenhum evento agendado
              </Typography>
            ) : (
              <List disablePadding>
                {events.map((event: UpcomingEvent) => (
                  <ListItem
                    key={event.id}
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      mb: 1,
                      borderLeft: `4px solid ${
                        event.color || theme.palette.info.main
                      }`,
                      bgcolor: alpha(theme.palette.background.default, 0.5),
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight="medium" noWrap>
                          {event.title}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(event.event_date)}
                          {event.start_time &&
                            ` às ${event.start_time.slice(0, 5)}`}
                        </Typography>
                      }
                    />
                    <Chip
                      label={event.event_type?.replace('_', ' ') || 'evento'}
                      size="small"
                      sx={{ fontSize: '0.65rem', height: 20 }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Locações Recentes */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Locações Recentes
            </Typography>
            {locationsLoading ? (
              <Grid container spacing={2}>
                {[1, 2, 3, 4].map(i => (
                  <Grid item xs={12} sm={6} md={3} key={i}>
                    <Skeleton height={180} sx={{ borderRadius: 2 }} />
                  </Grid>
                ))}
              </Grid>
            ) : locations.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>
                Nenhuma locação cadastrada
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {locations.map((loc: RecentLocation) => (
                  <Grid item xs={12} sm={6} md={3} key={loc.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-4px)' },
                      }}
                      onClick={() => navigate(`/locations/${loc.id}`)}
                    >
                      <CardMedia
                        component="div"
                        sx={{
                          height: 120,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          backgroundImage: loc.cover_photo_url
                            ? `url(${loc.cover_photo_url})`
                            : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {!loc.cover_photo_url && (
                          <LocationOn sx={{ fontSize: 40, opacity: 0.3 }} />
                        )}
                      </CardMedia>
                      <CardContent sx={{ py: 1.5, px: 2 }}>
                        <Typography variant="body2" fontWeight="bold" noWrap>
                          {loc.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {loc.city}, {loc.state}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Resumo Financeiro */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Resumo Financeiro
            </Typography>
            {financialLoading ? (
              <Box>
                <Skeleton height={30} sx={{ mb: 1 }} />
                <Skeleton height={30} sx={{ mb: 1 }} />
                <Skeleton height={30} />
              </Box>
            ) : (
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Orçamento Total
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(financial?.total_budget || 0)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Utilizado
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color="warning.main"
                  >
                    {formatCurrency(financial?.total_spent || 0)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Disponível
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color="success.main"
                  >
                    {formatCurrency(financial?.remaining || 0)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={financial?.utilization_percent || 0}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    mb: 2,
                  }}
                  color={
                    (financial?.utilization_percent || 0) > 90
                      ? 'error'
                      : (financial?.utilization_percent || 0) > 70
                      ? 'warning'
                      : 'success'
                  }
                />
                <Typography variant="caption" color="text.secondary">
                  {financial?.utilization_percent?.toFixed(1)}% do orçamento
                  utilizado
                </Typography>

                {financial?.projects_over_budget &&
                  financial.projects_over_budget > 0 && (
                    <Box
                      mt={2}
                      p={1.5}
                      bgcolor={alpha(theme.palette.error.main, 0.1)}
                      borderRadius={2}
                    >
                      <Typography
                        variant="caption"
                        color="error"
                        fontWeight="bold"
                      >
                        ⚠️ {financial.projects_over_budget} projeto(s) acima do
                        orçamento
                      </Typography>
                    </Box>
                  )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

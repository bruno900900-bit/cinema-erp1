import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Card,
  CardContent,
  IconButton,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  Download,
  Print,
  Share,
  Assessment,
  Timeline,
  AttachMoney,
  BarChart,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { Project } from '@/types/user';
import { projectService } from '@/services/projectService';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import { formatDateBR } from '@/utils/date';

const ProjectReportsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getProject(projectId!),
    enabled: !!projectId,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculateProgress = () => {
    if (project?.tasks && project.tasks.length > 0) {
      return Math.round(
        (project.tasks.filter(t => t.status === 'completed').length /
          project.tasks.length) *
          100
      );
    }
    return 0;
  };

  if (isLoading) return <LoadingSpinner />;
  if (!project) return <Typography>Projeto não encontrado</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate('/projects')}
        >
          Projetos
        </Link>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate(`/projects/${projectId}`)}
        >
          {project.title}
        </Link>
        <Typography color="text.primary">Relatórios</Typography>
      </Breadcrumbs>

      {/* Cabeçalho */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(`/projects/${projectId}`)}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Relatórios do Projeto
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Download />}>
            Exportar PDF
          </Button>
          <Button variant="outlined" startIcon={<Print />}>
            Imprimir
          </Button>
          <Button variant="outlined" startIcon={<Share />}>
            Compartilhar
          </Button>
        </Box>
      </Box>

      {/* Resumo */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center' }}>
                <Assessment sx={{ fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h4" sx={{ mt: 2 }}>
                  {calculateProgress()}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Progresso Geral
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center' }}>
                <Timeline sx={{ fontSize: 40, color: 'success.main' }} />
                <Typography variant="h4" sx={{ mt: 2 }}>
                  {project.tasks?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de Tarefas
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center' }}>
                <AttachMoney sx={{ fontSize: 40, color: 'warning.main' }} />
                <Typography variant="h4" sx={{ mt: 2 }}>
                  {formatCurrency(project.budget || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Orçamento Total
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center' }}>
                <BarChart sx={{ fontSize: 40, color: 'error.main' }} />
                <Typography variant="h4" sx={{ mt: 2 }}>
                  {project.locations?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de Locações
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detalhes */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Detalhes do Projeto */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Detalhes do Projeto
            </Typography>
            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell>{project.client_name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>
                      <Chip label={project.status} color="primary" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Data de Início</TableCell>
                    <TableCell>{formatDateBR(project.start_date)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Prazo Final</TableCell>
                    <TableCell>{formatDateBR(project.end_date)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Orçamento</TableCell>
                    <TableCell>{formatCurrency(project.budget || 0)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Gasto</TableCell>
                    <TableCell>
                      {formatCurrency(project.budget_spent || 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Status das Tarefas */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Status das Tarefas
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Quantidade</TableCell>
                    <TableCell align="right">Porcentagem</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    'not_started',
                    'in_progress',
                    'completed',
                    'on_hold',
                    'cancelled',
                  ].map(status => {
                    const count =
                      project.tasks?.filter(t => t.status === status).length ||
                      0;
                    const percentage =
                      project.tasks && project.tasks.length > 0
                        ? Math.round((count / project.tasks.length) * 100)
                        : 0;

                    return (
                      <TableRow key={status}>
                        <TableCell>
                          <Chip
                            label={status.replace('_', ' ').toUpperCase()}
                            size="small"
                            color={
                              status === 'completed'
                                ? 'success'
                                : status === 'in_progress'
                                ? 'primary'
                                : status === 'on_hold'
                                ? 'warning'
                                : status === 'cancelled'
                                ? 'error'
                                : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell align="right">{count}</TableCell>
                        <TableCell align="right">{percentage}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Lista de Locações */}
        {project.locations && project.locations.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Locações do Projeto
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell>Endereço</TableCell>
                      <TableCell align="right">Custo</TableCell>
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {project.locations.map(location => (
                      <TableRow key={location.id}>
                        <TableCell>{location.name}</TableCell>
                        <TableCell>{location.address}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(location.total_cost || 0)}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={location.status}
                            size="small"
                            color={
                              location.status === 'confirmed'
                                ? 'success'
                                : location.status === 'pending'
                                ? 'warning'
                                : 'default'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ProjectReportsPage;

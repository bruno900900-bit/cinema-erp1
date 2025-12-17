import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Download,
  Close,
  Assessment,
  LocationOn,
  AttachMoney,
  CalendarMonth,
  CheckCircle,
  HourglassEmpty,
} from '@mui/icons-material';
import { projectService } from '../../services/projectService';
import { supabase } from '../../config/supabaseClient';

interface ProjectReportModalProps {
  open: boolean;
  onClose: () => void;
  projectId: number;
  projectName?: string;
}

interface ReportData {
  projeto: {
    id: number;
    nome: string;
    descricao: string;
    cliente: string;
    cliente_email: string;
    cliente_telefone: string;
    status: string;
    data_inicio: string;
    data_fim: string;
    orcamento_total: number;
    orcamento_gasto: number;
    orcamento_restante: number;
    moeda: string;
    criado_em: string;
  };
  resumo: {
    total_locacoes: number;
    locacoes_ativas: number;
    locacoes_concluidas: number;
    custo_total_locacoes: number;
  };
  locacoes: Array<{
    id: number;
    nome: string;
    cidade: string;
    estado: string;
    endereco: string;
    valor_diaria: number;
    valor_hora?: number;
    valor_total: number;
    moeda: string;
    periodo_locacao: string;
    data_inicio: string;
    data_fim: string;
    duracao_dias: number;
    data_visita: string;
    data_visita_tecnica: string;
    periodo_filmagem: string;
    data_entrega: string;
    status: string;
    progresso: number;
    observacoes: string;
    requisitos_especiais: string;
    equipamentos: string;
  }>;
  gerado_em: string;
}

export default function ProjectReportModal({
  open,
  onClose,
  projectId,
  projectName,
}: ProjectReportModalProps) {
  const theme = useTheme();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (open && projectId) {
      fetchReport();
    }
  }, [open, projectId]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      // Note: Report generation traditionally required backend processing.
      // This implementation fetches data directly from Supabase and constructs the report.
      const project = await projectService.getProject(String(projectId));

      // Fetch project locations with location details
      const { data: projectLocations } = await supabase
        .from('project_locations')
        .select(
          `
          *,
          location:locations (*)
        `
        )
        .eq('project_id', projectId);

      // Build report data structure
      const reportData: ReportData = {
        projeto: {
          id: project.id,
          nome: project.name || project.title || '',
          descricao: project.description || '',
          cliente: project.client_name || '',
          cliente_email: project.client_email || '',
          cliente_telefone: project.client_phone || '',
          status: project.status || '',
          data_inicio: project.start_date || '',
          data_fim: project.end_date || '',
          orcamento_total: project.budget || 0,
          orcamento_gasto: project.budget_spent || 0,
          orcamento_restante:
            (project.budget || 0) - (project.budget_spent || 0),
          moeda: 'BRL',
          criado_em: project.created_at || '',
        },
        resumo: {
          total_locacoes: projectLocations?.length || 0,
          locacoes_ativas:
            projectLocations?.filter(
              l => l.status === 'confirmed' || l.status === 'in_use'
            ).length || 0,
          locacoes_concluidas:
            projectLocations?.filter(l => l.status === 'completed').length || 0,
          custo_total_locacoes:
            projectLocations?.reduce(
              (sum, l) => sum + (l.total_cost || 0),
              0
            ) || 0,
        },
        locacoes: (projectLocations || []).map((pl: any) => ({
          id: pl.id,
          nome: pl.location?.title || 'Sem nome',
          cidade: pl.location?.city || '',
          estado: pl.location?.state || '',
          endereco: pl.location?.address || '',
          valor_diaria: pl.daily_rate || 0,
          valor_hora: pl.hourly_rate,
          valor_total: pl.total_cost || 0,
          moeda: 'BRL',
          periodo_locacao: `${pl.rental_start || ''} - ${pl.rental_end || ''}`,
          data_inicio: pl.rental_start || '',
          data_fim: pl.rental_end || '',
          duracao_dias:
            pl.rental_start && pl.rental_end
              ? Math.ceil(
                  (new Date(pl.rental_end).getTime() -
                    new Date(pl.rental_start).getTime()) /
                    (1000 * 60 * 60 * 24)
                ) + 1
              : 0,
          data_visita: '',
          data_visita_tecnica: '',
          periodo_filmagem: '',
          data_entrega: '',
          status: pl.status || 'pending',
          progresso:
            pl.status === 'completed' ? 100 : pl.status === 'in_use' ? 50 : 0,
          observacoes: pl.notes || '',
          requisitos_especiais: '',
          equipamentos: '',
        })),
        gerado_em: new Date().toLocaleString('pt-BR'),
      };

      setReport(reportData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    setDownloading(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
        }/projects/${projectId}/report/excel`,
        {
          method: 'GET',
          headers: {
            Accept:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao baixar Excel');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_${
        report?.projeto?.nome?.replace(/\s+/g, '_') || 'projeto'
      }.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Erro ao baixar Excel');
    } finally {
      setDownloading(false);
    }
  };

  const formatCurrency = (value: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<
      string,
      'success' | 'warning' | 'error' | 'info' | 'default'
    > = {
      Ativo: 'success',
      Confirmada: 'success',
      'Em Uso': 'info',
      Devolvida: 'default',
      Reservada: 'warning',
      Atrasada: 'error',
      Cancelada: 'error',
      Cancelado: 'error',
      Concluído: 'success',
      'Em Espera': 'warning',
      Arquivado: 'default',
    };
    return colors[status] || 'default';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '80vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment />
          <Typography variant="h6">
            Relatório do Projeto:{' '}
            {report?.projeto?.nome || projectName || 'Carregando...'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} />
          </Box>
        )}

        {error && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="error">{error}</Typography>
            <Button onClick={fetchReport} sx={{ mt: 2 }}>
              Tentar novamente
            </Button>
          </Box>
        )}

        {!loading && !error && report && (
          <>
            {/* Cards de Resumo */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={3}>
                <Card
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.primary.main,
                      0.1
                    )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                    border: `1px solid ${alpha(
                      theme.palette.primary.main,
                      0.2
                    )}`,
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <LocationOn color="primary" />
                      <Typography variant="body2" color="text.secondary">
                        Total de Locações
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      {report.resumo.total_locacoes}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip
                        size="small"
                        label={`${report.resumo.locacoes_ativas} ativas`}
                        color="success"
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        label={`${report.resumo.locacoes_concluidas} concluídas`}
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.success.main,
                      0.1
                    )} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                    border: `1px solid ${alpha(
                      theme.palette.success.main,
                      0.2
                    )}`,
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <AttachMoney color="success" />
                      <Typography variant="body2" color="text.secondary">
                        Custo Total Locações
                      </Typography>
                    </Box>
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      color="success.main"
                    >
                      {formatCurrency(report.resumo.custo_total_locacoes)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.info.main,
                      0.1
                    )} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <CalendarMonth color="info" />
                      <Typography variant="body2" color="text.secondary">
                        Período do Projeto
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="bold">
                      {report.projeto.data_inicio}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      até {report.projeto.data_fim}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.warning.main,
                      0.1
                    )} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
                    border: `1px solid ${alpha(
                      theme.palette.warning.main,
                      0.2
                    )}`,
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <AttachMoney color="warning" />
                      <Typography variant="body2" color="text.secondary">
                        Orçamento
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="bold">
                      Total: {formatCurrency(report.projeto.orcamento_total)}
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      Restante:{' '}
                      {formatCurrency(report.projeto.orcamento_restante)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Informações do Projeto */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Assessment fontSize="small" />
                Informações do Projeto
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">
                    Cliente
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {report.projeto.cliente}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={report.projeto.status}
                    color={getStatusColor(report.projeto.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">
                    Criado em
                  </Typography>
                  <Typography variant="body1">
                    {report.projeto.criado_em}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Tabela de Locações */}
            <Paper sx={{ overflow: 'hidden' }}>
              <Box sx={{ p: 2, bgcolor: theme.palette.grey[100] }}>
                <Typography
                  variant="h6"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <LocationOn fontSize="small" />
                  Detalhamento das Locações ({report.locacoes.length})
                </Typography>
              </Box>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: theme.palette.grey[200],
                        }}
                      >
                        Locação
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: theme.palette.grey[200],
                        }}
                      >
                        Cidade
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: theme.palette.grey[200],
                        }}
                        align="right"
                      >
                        Diária
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: theme.palette.grey[200],
                        }}
                        align="right"
                      >
                        Total
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: theme.palette.grey[200],
                        }}
                      >
                        Período
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: theme.palette.grey[200],
                        }}
                      >
                        Visita
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: theme.palette.grey[200],
                        }}
                      >
                        Filmagem
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: theme.palette.grey[200],
                        }}
                      >
                        Entrega
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: theme.palette.grey[200],
                        }}
                      >
                        Status
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: theme.palette.grey[200],
                        }}
                        align="center"
                      >
                        Progresso
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.locacoes.map(loc => (
                      <TableRow key={loc.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {loc.nome}
                          </Typography>
                        </TableCell>
                        <TableCell>{loc.cidade}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(loc.valor_diaria, loc.moeda)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="medium">
                            {formatCurrency(loc.valor_total, loc.moeda)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {loc.periodo_locacao}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({loc.duracao_dias} dias)
                          </Typography>
                        </TableCell>
                        <TableCell>{loc.data_visita}</TableCell>
                        <TableCell>{loc.periodo_filmagem}</TableCell>
                        <TableCell>{loc.data_entrega}</TableCell>
                        <TableCell>
                          <Chip
                            label={loc.status}
                            size="small"
                            color={getStatusColor(loc.status)}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            {loc.progresso === 100 ? (
                              <CheckCircle color="success" fontSize="small" />
                            ) : loc.progresso > 0 ? (
                              <HourglassEmpty
                                color="warning"
                                fontSize="small"
                              />
                            ) : null}
                            <Typography variant="body2">
                              {loc.progresso}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {report.locacoes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            Nenhuma locação associada a este projeto
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Rodapé */}
            <Box sx={{ mt: 2, textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary">
                Relatório gerado em: {report.gerado_em}
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: theme.palette.grey[50] }}>
        <Button onClick={onClose} variant="outlined">
          Fechar
        </Button>
        <Button
          variant="contained"
          startIcon={
            downloading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <Download />
            )
          }
          onClick={handleDownloadExcel}
          disabled={loading || !report || downloading}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
          }}
        >
          {downloading ? 'Baixando...' : 'Exportar Excel'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

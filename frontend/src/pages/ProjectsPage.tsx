import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Box as MuiBox,
  InputAdornment,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  FormControlLabel,
  Checkbox,
  Autocomplete,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  Description,
  ViewModule,
  ViewList,
  Download,
  Upload,
  Edit,
  Visibility,
  Delete,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Project,
  ProjectStatus,
  User,
  Tag,
  ProjectLocation,
  ProjectTask,
} from '@/types/user';
import ProjectCard from '@/components/Projects/ProjectCard';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import LocationSelectionModal from '@/components/Projects/LocationSelectionModal';
import ProjectWorkflowModal from '@/components/Projects/ProjectWorkflowModal';
import ImageUpload from '@/components/Common/ImageUpload';
import ContractGenerationModal from '@/components/Contracts/ContractGenerationModal';
import { projectService } from '@/services/projectService';
import { userService } from '@/services/userService';
import { tagService } from '@/services/tagService';
import { locationService } from '@/services/locationService';
import { supplierService } from '@/services/supplierService';
import { formatDateBR, toInputDate } from '../utils/date';
import { toast } from 'react-toastify';

// Utility function to safely create a Date from an input value
const safeCreateDate = (value: string): Date | null => {
  if (!value) return null;
  const newDate = new Date(value);
  return !isNaN(newDate.getTime()) ? newDate : null;
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`projects-tabpanel-${index}`}
      aria-labelledby={`projects-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [isLocationSelectionOpen, setIsLocationSelectionOpen] = useState(false);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  const [formData, setFormData] = useState<Partial<Project>>({
    id: '',
    title: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    notes: '',
    description: '',
    status: ProjectStatus.PLANNING,
    budget: 0,
    budget_spent: 0,
    budget_remaining: 0,
    start_date: new Date(),
    end_date: new Date(),
    responsibleUserId: '',
    tags: [],
    locations: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const queryClient = useQueryClient();

  // Buscar projetos com cache otimizado
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });

  // Buscar usuários (apenas quando necessário)
  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
    enabled: isCreateDialogOpen || isEditDialogOpen,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
  });

  // Buscar fornecedores (apenas quando necessário)
  const { data: suppliersResponse, isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => supplierService.getSuppliers({ is_active: true }),
    enabled: isContractDialogOpen,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
  });

  // Extrair array de usuários da resposta
  const users = usersResponse?.users || [];

  // Extrair array de fornecedores da resposta
  const suppliers = suppliersResponse?.suppliers || [];

  // Buscar tags (apenas quando necessário)
  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: tagService.getTags,
    enabled: isCreateDialogOpen || isEditDialogOpen,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
  });

  // Buscar locações disponíveis (apenas quando necessário)
  const { data: availableLocations = [], isLoading: locationsLoading } =
    useQuery({
      queryKey: ['locations'],
      queryFn: () => locationService.searchLocations({}),
      enabled: isLocationSelectionOpen,
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
    });

  // Mutations
  const createProjectMutation = useMutation({
    mutationFn: projectService.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsCreateDialogOpen(false);
      toast.success('Projeto criado com sucesso!');
      setFormData({
        title: '',
        description: '',
        status: ProjectStatus.PLANNING,
        budget: 0,
        end_date: new Date(),
        responsibleUserId: '',
        tags: [],
      });
    },
    onError: (error: any) => {
      console.error('Erro ao criar projeto:', error);
      toast.error(error.message || 'Erro ao criar projeto. Tente novamente.');
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      projectService.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsEditDialogOpen(false);
      setSelectedProject(null);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: projectService.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsViewDialogOpen(false);
      setSelectedProject(null);
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateProject = () => {
    if (!formData.title || formData.title.trim().length < 3) {
      toast.warning('Por favor, insira um título com pelo menos 3 caracteres.');
      return;
    }
    createProjectMutation.mutate(formData);
  };

  const handleEditProject = () => {
    if (selectedProject && formData.title && formData.responsibleUserId) {
      updateProjectMutation.mutate({ id: selectedProject.id, data: formData });
    }
  };

  const handleDeleteProject = () => {
    if (selectedProject) {
      deleteProjectMutation.mutate(selectedProject.id);
    }
  };

  const handleLocationsSelected = (projectLocations: ProjectLocation[]) => {
    setFormData(prev => ({
      ...prev,
      locations: projectLocations,
      budget: projectLocations.reduce((sum, pl) => sum + pl.total_cost, 0),
    }));
  };

  const handleSaveWorkflow = async (tasks: ProjectTask[]) => {
    try {
      // TODO: Implementar salvamento das tarefas
      console.log('Salvando workflow com tarefas:', tasks);

      // Atualizar projeto com as tarefas
      if (selectedProject) {
        await updateProjectMutation.mutateAsync({
          id: selectedProject.id,
          data: { ...selectedProject, tasks },
        });

        // Atualizar a lista de projetos após salvar
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }
    } catch (error) {
      console.error('Erro ao salvar workflow:', error);
      throw error;
    }
  };

  const handleViewInAgenda = (project: Project) => {
    // Navegar para a agenda com filtro para mostrar apenas eventos deste projeto
    navigate('/agenda', {
      state: {
        filterProject: project.id,
        highlightProject: project.id,
      },
    });
  };

  const handleNavigateToProject = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || project.status === statusFilter;
    const matchesResponsible =
      responsibleFilter === 'all' ||
      project.responsibleUserId === responsibleFilter;
    return matchesSearch && matchesStatus && matchesResponsible;
  });

  const paginatedProjects = filteredProjects.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.PLANNING:
        return 'info';
      case ProjectStatus.IN_PROGRESS:
        return 'warning';
      case ProjectStatus.COMPLETED:
        return 'success';
      case ProjectStatus.ON_HOLD:
        return 'default';
      case ProjectStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.PLANNING:
        return 'Planejamento';
      case ProjectStatus.IN_PROGRESS:
        return 'Em Andamento';
      case ProjectStatus.COMPLETED:
        return 'Concluído';
      case ProjectStatus.ON_HOLD:
        return 'Em Pausa';
      case ProjectStatus.CANCELLED:
        return 'Cancelado';
      default:
        return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Safer formatter for possibly string/null dates
  const formatDate = (date: any) => formatDateBR(date);

  // Export function for locations
  const handleExportLocations = () => {
    // Collect all locations from all projects
    const allLocations: any[] = [];

    projects.forEach(project => {
      if (project.locations && project.locations.length > 0) {
        project.locations.forEach((loc: any) => {
          // Only include confirmed locations
          if (
            loc.status === 'confirmed' ||
            loc.status === 'in_use' ||
            loc.status === 'completed'
          ) {
            const responsibleUser = users.find(
              u => u.id.toString() === loc.responsible_user_id?.toString()
            );
            allLocations.push({
              projeto: project.title,
              locacao: loc.location?.title || loc.title || 'Sem nome',
              valor_diaria: loc.daily_rate || 0,
              valor_total: loc.total_cost || 0,
              responsavel: responsibleUser?.full_name || 'N/A',
              proprietario: loc.location?.owner_name || loc.owner_name || 'N/A',
              nota: loc.notes || '',
            });
          }
        });
      }
    });

    if (allLocations.length === 0) {
      toast.warning('Nenhuma locação confirmada encontrada para exportar.');
      return;
    }

    // Generate CSV
    const headers = [
      'Projeto',
      'Locação',
      'Valor da Diária',
      'Valor Total',
      'Nome do Responsável',
      'Nome do Proprietário',
      'Nota',
    ];
    const csvRows = [
      headers.join(';'),
      ...allLocations.map(loc =>
        [
          `"${loc.projeto}"`,
          `"${loc.locacao}"`,
          loc.valor_diaria.toFixed(2).replace('.', ','),
          loc.valor_total.toFixed(2).replace('.', ','),
          `"${loc.responsavel}"`,
          `"${loc.proprietario}"`,
          `"${loc.nota.replace(/"/g, '""')}"`,
        ].join(';')
      ),
    ];

    const csvContent = '\uFEFF' + csvRows.join('\n'); // BOM for Excel UTF-8
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `locacoes_confirmadas_${
      new Date().toISOString().split('T')[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`${allLocations.length} locações exportadas com sucesso!`);
  };

  if (projectsLoading || usersLoading || tagsLoading || locationsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Gestão de Projetos
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setIsCreateDialogOpen(true)}
        >
          Novo Projeto
        </Button>
        <Button
          variant="outlined"
          startIcon={<Description />}
          onClick={() => setIsContractDialogOpen(true)}
          sx={{ ml: 1 }}
        >
          Gerar Contrato
        </Button>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="projects tabs"
        >
          <Tab label="Projetos" />
          <Tab label="Relatórios" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Buscar projetos..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    {Object.values(ProjectStatus).map(status => (
                      <MenuItem key={status} value={status}>
                        {getStatusLabel(status)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Responsável</InputLabel>
                  <Select
                    value={responsibleFilter}
                    onChange={e => setResponsibleFilter(e.target.value)}
                    label="Responsável"
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    {users.map(user => (
                      <MenuItem key={user.id} value={user.id.toString()}>
                        {user.full_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setResponsibleFilter('all');
                  }}
                >
                  Limpar Filtros
                </Button>
              </Grid>
              <Grid item xs={12} md={2}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('grid')}
                    size="small"
                  >
                    <ViewModule />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('list')}
                    size="small"
                  >
                    <ViewList />
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {viewMode === 'grid' ? (
            <Grid container spacing={3}>
              {paginatedProjects.map(project => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={project.id}>
                  <ProjectCard
                    project={project}
                    users={users}
                    onView={handleNavigateToProject}
                    onEdit={project => {
                      setSelectedProject(project);
                      setFormData(project);
                      setIsEditDialogOpen(true);
                    }}
                    onDelete={project => {
                      setSelectedProject(project);
                      setIsViewDialogOpen(true);
                    }}
                    onWorkflow={project => {
                      setSelectedProject(project);
                      setIsWorkflowOpen(true);
                    }}
                    onViewInAgenda={handleViewInAgenda}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Título</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Responsável</TableCell>
                    <TableCell>Prazo</TableCell>
                    <TableCell>Orçamento</TableCell>
                    <TableCell>Progresso</TableCell>
                    <TableCell>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedProjects.map(project => (
                    <TableRow key={project.id}>
                      <TableCell>{project.title}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(project.status)}
                          color={getStatusColor(project.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {
                          users.find(
                            u => u.id.toString() === project.responsibleUserId
                          )?.full_name
                        }
                      </TableCell>
                      <TableCell>{formatDate(project.end_date)}</TableCell>
                      <TableCell>{formatCurrency(project.budget)}</TableCell>
                      <TableCell>
                        {project.tasks && project.tasks.length > 0
                          ? `${Math.round(
                              (project.tasks.filter(t => t.completed).length /
                                project.tasks.length) *
                                100
                            )}%`
                          : '0%'}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Visualizar">
                          <IconButton
                            onClick={() => navigate(`/projects/${project.id}`)}
                            size="small"
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            onClick={() => {
                              setSelectedProject(project);
                              setFormData(project);
                              setIsEditDialogOpen(true);
                            }}
                            size="small"
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton
                            onClick={() => {
                              setSelectedProject(project);
                              setIsViewDialogOpen(true);
                            }}
                            size="small"
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredProjects.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={event => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Linhas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Relatórios de Projetos
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Estatísticas Gerais
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography>Total de Projetos:</Typography>
                    <Typography variant="h6">{projects.length}</Typography>
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography>Em Andamento:</Typography>
                    <Typography variant="h6" color="warning.main">
                      {
                        projects.filter(
                          p => p.status === ProjectStatus.IN_PROGRESS
                        ).length
                      }
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography>Concluídos:</Typography>
                    <Typography variant="h6" color="success.main">
                      {
                        projects.filter(
                          p => p.status === ProjectStatus.COMPLETED
                        ).length
                      }
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Ações
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    fullWidth
                    onClick={handleExportLocations}
                  >
                    Exportar Locações (CSV)
                  </Button>
                  <Button variant="outlined" startIcon={<Upload />} fullWidth>
                    Importar Dados
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Dialog para criar projeto */}
      <Dialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Novo Projeto</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Título do Projeto"
                value={formData.title}
                onChange={e =>
                  setFormData(prev => ({ ...prev, title: e.target.value }))
                }
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descrição"
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nome do Cliente"
                value={formData.client_name || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    client_name: e.target.value,
                  }))
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Email do Cliente"
                value={formData.client_email || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    client_email: e.target.value,
                  }))
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Telefone do Cliente"
                value={formData.client_phone || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    client_phone: e.target.value,
                  }))
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notas"
                value={formData.notes || ''}
                onChange={e =>
                  setFormData(prev => ({ ...prev, notes: e.target.value }))
                }
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      status: e.target.value as ProjectStatus,
                    }))
                  }
                  label="Status"
                >
                  {Object.values(ProjectStatus).map(status => (
                    <MenuItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Responsável</InputLabel>
                <Select
                  value={formData.responsibleUserId || ''}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      responsibleUserId: e.target.value,
                    }))
                  }
                  label="Responsável"
                >
                  {users.map(user => (
                    <MenuItem key={user.id} value={user.id.toString()}>
                      {user.full_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Orçamento"
                type="number"
                value={formData.budget}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    budget: parseFloat(e.target.value),
                  }))
                }
                fullWidth
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">R$</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Prazo"
                type="date"
                value={toInputDate(formData.end_date)}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    end_date: safeCreateDate(e.target.value),
                  }))
                }
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={tags}
                getOptionLabel={option => option.name}
                value={formData.tags || []}
                onChange={(event, newValue) =>
                  setFormData(prev => ({ ...prev, tags: newValue }))
                }
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Tags"
                    placeholder="Selecionar tags..."
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.name}
                      {...getTagProps({ index })}
                      size="small"
                    />
                  ))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Foto do Projeto
              </Typography>
              <ImageUpload
                value={formData.cover_photo_url}
                onChange={imageUrl =>
                  setFormData(prev => ({ ...prev, cover_photo_url: imageUrl }))
                }
                label="Adicionar foto do projeto"
                maxSize={10}
                aspectRatio={16 / 9}
                bucketName="images"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleCreateProject}
            variant="contained"
            disabled={createProjectMutation.isPending}
          >
            {createProjectMutation.isPending ? 'Criando...' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para visualizar projeto */}
      <Dialog
        open={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            Detalhes do Projeto
            <Box>
              <Tooltip title="Editar">
                <IconButton
                  onClick={() => {
                    setFormData(selectedProject || {});
                    setIsViewDialogOpen(false);
                    setIsEditDialogOpen(true);
                  }}
                  size="small"
                >
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip title="Excluir">
                <IconButton
                  onClick={handleDeleteProject}
                  size="small"
                  color="error"
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedProject && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {selectedProject.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {selectedProject.description}
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedProject.status)}
                    color={getStatusColor(selectedProject.status)}
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Responsável
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {
                      users.find(
                        u =>
                          u.id.toString() === selectedProject.responsibleUserId
                      )?.full_name
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Prazo
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {formatDate(selectedProject.end_date)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Orçamento
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {formatCurrency(selectedProject.budget)}
                  </Typography>
                </Grid>
                {selectedProject.tags && selectedProject.tags.length > 0 && (
                  <Grid item xs={12}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {selectedProject.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag.name}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsViewDialogOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para editar projeto */}
      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Editar Projeto</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Título do Projeto"
                value={formData.title}
                onChange={e =>
                  setFormData(prev => ({ ...prev, title: e.target.value }))
                }
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descrição"
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nome do Cliente"
                value={formData.client_name || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    client_name: e.target.value,
                  }))
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Email do Cliente"
                value={formData.client_email || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    client_email: e.target.value,
                  }))
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Telefone do Cliente"
                value={formData.client_phone || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    client_phone: e.target.value,
                  }))
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notas"
                value={formData.notes || ''}
                onChange={e =>
                  setFormData(prev => ({ ...prev, notes: e.target.value }))
                }
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      status: e.target.value as ProjectStatus,
                    }))
                  }
                  label="Status"
                >
                  {Object.values(ProjectStatus).map(status => (
                    <MenuItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Responsável</InputLabel>
                <Select
                  value={formData.responsibleUserId || ''}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      responsibleUserId: e.target.value,
                    }))
                  }
                  label="Responsável"
                >
                  {users.map(user => (
                    <MenuItem key={user.id} value={user.id.toString()}>
                      {user.full_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Orçamento"
                type="number"
                value={formData.budget}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    budget: parseFloat(e.target.value),
                  }))
                }
                fullWidth
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">R$</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Prazo"
                type="date"
                value={toInputDate(formData.end_date)}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    end_date: safeCreateDate(e.target.value),
                  }))
                }
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={tags}
                getOptionLabel={option => option.name}
                value={formData.tags || []}
                onChange={(event, newValue) =>
                  setFormData(prev => ({ ...prev, tags: newValue }))
                }
                renderInput={params => (
                  <TextField
                    {...params}
                    label="Tags"
                    placeholder="Selecionar tags..."
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.name}
                      {...getTagProps({ index })}
                      size="small"
                    />
                  ))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Foto do Projeto
              </Typography>
              <ImageUpload
                value={formData.cover_photo_url}
                onChange={imageUrl =>
                  setFormData(prev => ({ ...prev, cover_photo_url: imageUrl }))
                }
                label="Atualizar foto do projeto"
                maxSize={10}
                aspectRatio={16 / 9}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleEditProject}
            variant="contained"
            disabled={updateProjectMutation.isPending}
          >
            {updateProjectMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Seleção de Locações */}
      <LocationSelectionModal
        open={isLocationSelectionOpen}
        onClose={() => setIsLocationSelectionOpen(false)}
        onConfirm={handleLocationsSelected}
        availableLocations={
          Array.isArray(availableLocations)
            ? availableLocations
            : availableLocations.locations || []
        }
        projectStartDate={formData.start_date}
        projectEndDate={formData.end_date}
      />

      {/* Modal de Workflow */}
      <ProjectWorkflowModal
        open={isWorkflowOpen}
        onClose={() => setIsWorkflowOpen(false)}
        project={selectedProject}
        onSaveTasks={handleSaveWorkflow}
      />

      {/* Modal de Detalhes do Projeto */}
      {/* Modal de Geração de Contratos */}
      <ContractGenerationModal
        open={isContractDialogOpen}
        onClose={() => setIsContractDialogOpen(false)}
        project={selectedProject}
        suppliers={suppliers}
        users={users}
      />
    </Box>
  );
};

export default ProjectsPage;

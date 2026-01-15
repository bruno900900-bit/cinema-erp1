import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Description as ContractIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  contractService,
  GeneratedContract,
} from '../services/contractService';
import { supplierService } from '../services/supplierService';
import { userService } from '../services/userService';
import { projectService } from '../services/projectService';
import ContractGenerationModal from '../components/Contracts/ContractGenerationModal';

const ContractsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isProjectSelectOpen, setIsProjectSelectOpen] = useState(false);
  const [selectedContract, setSelectedContract] =
    useState<GeneratedContract | null>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  // Simular dados de contratos (em um sistema real, isso viria do backend)
  const mockContracts: GeneratedContract[] = [
    {
      id: 'CONTRACT_001',
      title: 'Contrato de Locação de Imóvel - Projeto Filme A',
      content: 'CONTRATO DE LOCAÇÃO...',
      generated_at: '2024-01-15',
      project_id: 1,
      supplier_id: 1,
      status: 'approved',
      pdf_url: 'contract_001.pdf',
    },
    {
      id: 'CONTRACT_002',
      title: 'Contrato de Locação de Equipamentos - Projeto Comercial B',
      content: 'CONTRATO DE LOCAÇÃO DE EQUIPAMENTOS...',
      generated_at: '2024-01-20',
      project_id: 2,
      supplier_id: 2,
      status: 'draft',
    },
    {
      id: 'CONTRACT_003',
      title: 'Contrato de Prestação de Serviços - Projeto Documentário C',
      content: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS...',
      generated_at: '2024-02-01',
      project_id: 3,
      supplier_id: 3,
      status: 'signed',
      pdf_url: 'contract_003.pdf',
    },
  ];

  // Buscar fornecedores
  const { data: suppliersResponse } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => supplierService.getSuppliers({ is_active: true }),
  });

  // Buscar usuários
  const { data: usersResponse } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  });

  // Buscar projetos com locações
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  });

  const suppliers = suppliersResponse?.suppliers || [];
  const users = usersResponse?.users || [];

  // Filtrar contratos
  const filteredContracts = mockContracts.filter(contract => {
    const matchesSearch = contract.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Paginação
  const paginatedContracts = filteredContracts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'review':
        return 'warning';
      case 'approved':
        return 'info';
      case 'signed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Rascunho';
      case 'review':
        return 'Em Revisão';
      case 'approved':
        return 'Aprovado';
      case 'signed':
        return 'Assinado';
      default:
        return status;
    }
  };

  const handlePreviewContract = (contract: GeneratedContract) => {
    setSelectedContract(contract);
    setIsPreviewDialogOpen(true);
  };

  const handleDownloadContract = (contract: GeneratedContract) => {
    if (contract.pdf_url) {
      // Simular download
      console.log('Downloading contract:', contract.pdf_url);
    } else {
      // Gerar PDF
      contractService.exportToPDF(contract);
    }
  };

  const handleDeleteContract = (contractId: string) => {
    // Simular exclusão
    console.log('Deleting contract:', contractId);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Gestão de Contratos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsProjectSelectOpen(true)}
        >
          Novo Contrato
        </Button>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar contratos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="draft">Rascunho</MenuItem>
                <MenuItem value="review">Em Revisão</MenuItem>
                <MenuItem value="approved">Aprovado</MenuItem>
                <MenuItem value="signed">Assinado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button variant="outlined" startIcon={<FilterIcon />} fullWidth>
              Mais Filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ContractIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{mockContracts.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de Contratos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <BusinessIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {mockContracts.filter(c => c.status === 'signed').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Contratos Assinados
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CalendarIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {mockContracts.filter(c => c.status === 'review').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Em Revisão
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MoneyIcon color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{suppliers.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fornecedores Ativos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lista de Contratos */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Título</TableCell>
                <TableCell>Projeto</TableCell>
                <TableCell>Fornecedor</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Data de Geração</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedContracts.map(contract => (
                <TableRow key={contract.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {contract.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      Projeto #{contract.project_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {suppliers.find(s => s.id === contract.supplier_id)
                        ?.name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(contract.status)}
                      color={getStatusColor(contract.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {(() => {
                        const date = new Date(contract.generated_at);
                        return isNaN(date.getTime())
                          ? 'Data inválida'
                          : date.toLocaleDateString('pt-BR');
                      })()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Visualizar">
                      <IconButton
                        size="small"
                        onClick={() => handlePreviewContract(contract)}
                      >
                        <PreviewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download PDF">
                      <IconButton
                        size="small"
                        onClick={() => handleDownloadContract(contract)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteContract(contract.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredContracts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={e => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Dialog de Seleção de Projeto */}
      <Dialog
        open={isProjectSelectOpen}
        onClose={() => setIsProjectSelectOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Selecione um Projeto</Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Selecione um projeto para gerar o contrato baseado nas locações e
            fornecedores cadastrados.
          </Alert>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Projeto</InputLabel>
            <Select
              value={selectedProject?.id || ''}
              onChange={e => {
                const proj = projects.find((p: any) => p.id === e.target.value);
                setSelectedProject(proj);
              }}
              label="Projeto"
            >
              <MenuItem value="">
                <em>Nenhum (Contrato Manual)</em>
              </MenuItem>
              {projects.map((project: any) => (
                <MenuItem key={project.id} value={project.id}>
                  📁 {project.title || project.name}
                  {(project.locations?.length ||
                    project.project_locations?.length) > 0 &&
                    ` (${
                      project.locations?.length ||
                      project.project_locations?.length
                    } locações)`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsProjectSelectOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setIsProjectSelectOpen(false);
              setIsCreateDialogOpen(true);
            }}
          >
            Continuar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Geração de Contratos */}
      <ContractGenerationModal
        open={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        suppliers={suppliers}
        users={users}
      />

      {/* Modal de Preview */}
      <Dialog
        open={isPreviewDialogOpen}
        onClose={() => setIsPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Preview do Contrato</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedContract && (
            <Box
              sx={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                backgroundColor: 'grey.50',
                maxHeight: '60vh',
                overflow: 'auto',
              }}
            >
              {selectedContract.content}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPreviewDialogOpen(false)}>Fechar</Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() =>
              selectedContract && handleDownloadContract(selectedContract)
            }
          >
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContractsPage;

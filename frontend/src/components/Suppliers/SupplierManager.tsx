import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Rating,
  Switch,
  FormControlLabel,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  supplierService,
  Supplier,
  SupplierCreate,
  SupplierUpdate,
  SupplierFilter,
} from '../../services/supplierService';

interface SupplierManagerProps {
  onSupplierSelect?: (supplier: Supplier) => void;
  onSupplierCreated?: (supplier: Supplier) => void;
  showSelectButton?: boolean;
}

const SupplierManager: React.FC<SupplierManagerProps> = ({
  onSupplierSelect,
  onSupplierCreated,
  showSelectButton = false,
}) => {
  const [open, setOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [filters, setFilters] = useState<SupplierFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SupplierCreate>({
    name: '',
    tax_id: '',
    email: '',
    phone: '',
    website: '',
    notes: '',
    rating: undefined,
    is_active: true,
  });

  const queryClient = useQueryClient();

  // Buscar fornecedores
  const {
    data: suppliersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['suppliers', filters],
    queryFn: () =>
      supplierService.getSuppliers({
        skip: 0,
        limit: 100,
        ...filters,
      }),
  });

  // Buscar fornecedores ativos para dropdown
  const { data: activeSuppliers } = useQuery({
    queryKey: ['activeSuppliers'],
    queryFn: () => supplierService.getActiveSuppliers(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: supplierService.createSupplier,
    onSuccess: supplier => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers', 'locations-tab'] });
  queryClient.invalidateQueries({ queryKey: ['activeSuppliers'] });
      onSupplierCreated?.(supplier);
      handleClose();
    },
    onError: (error: any) => {
      console.error('Erro ao criar fornecedor:', error);
      const detail =
        error?.response?.data?.detail ||
        error?.message ||
        'Não foi possível criar o fornecedor';
      setMutationError(String(detail));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SupplierUpdate }) =>
      supplierService.updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers', 'locations-tab'] });
      queryClient.invalidateQueries({ queryKey: ['activeSuppliers'] });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar fornecedor:', error);
      const detail =
        error?.response?.data?.detail ||
        error?.message ||
        'Não foi possível atualizar o fornecedor';
      setMutationError(String(detail));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: supplierService.deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['activeSuppliers'] });
    },
  });

  const handleOpen = (supplier?: Supplier) => {
    setMutationError(null);
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        tax_id: supplier.tax_id || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        website: supplier.website || '',
        notes: supplier.notes || '',
        rating: supplier.rating,
        is_active: supplier.is_active,
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        tax_id: '',
        email: '',
        phone: '',
        website: '',
        notes: '',
        rating: undefined,
        is_active: true,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingSupplier(null);
    setMutationError(null);
    setFormData({
      name: '',
      tax_id: '',
      email: '',
      phone: '',
      website: '',
      notes: '',
      rating: undefined,
      is_active: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMutationError(null);

    if (editingSupplier) {
      updateMutation.mutate({
        id: editingSupplier.id,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (supplier: Supplier) => {
    if (
      window.confirm(
        `Tem certeza que deseja deletar o fornecedor "${supplier.name}"?`
      )
    ) {
      deleteMutation.mutate(supplier.id);
    }
  };

  const handleFilterChange = (field: keyof SupplierFilter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const filteredSuppliers =
    suppliersData?.suppliers.filter(
      supplier =>
        searchTerm === '' ||
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.tax_id?.includes(searchTerm)
    ) || [];

  if (error) {
    return (
      <Alert severity="error">
        Erro ao carregar fornecedores: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Gerenciar Fornecedores
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Novo Fornecedor
        </Button>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Buscar"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.is_active ?? ''}
                onChange={e =>
                  handleFilterChange(
                    'is_active',
                    e.target.value === '' ? undefined : e.target.value
                  )
                }
                label="Status"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="true">Ativo</MenuItem>
                <MenuItem value="false">Inativo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Com Locações</InputLabel>
              <Select
                value={filters.has_locations ?? ''}
                onChange={e =>
                  handleFilterChange(
                    'has_locations',
                    e.target.value === '' ? undefined : e.target.value
                  )
                }
                label="Com Locações"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="true">Sim</MenuItem>
                <MenuItem value="false">Não</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button variant="outlined" onClick={clearFilters} fullWidth>
              Limpar Filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabela de Fornecedores */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>CNPJ/CPF</TableCell>
              <TableCell>Contato</TableCell>
              <TableCell>Avaliação</TableCell>
              <TableCell>Locações</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nenhum fornecedor encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map(supplier => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">
                        {supplier.name}
                      </Typography>
                      {supplier.website && (
                        <Box display="flex" alignItems="center" mt={0.5}>
                          <LanguageIcon sx={{ fontSize: 14, mr: 0.5 }} />
                          <Typography variant="caption" color="text.secondary">
                            {supplier.website}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{supplier.tax_id || '-'}</TableCell>
                  <TableCell>
                    <Box>
                      {supplier.email && (
                        <Box display="flex" alignItems="center" mb={0.5}>
                          <EmailIcon sx={{ fontSize: 14, mr: 0.5 }} />
                          <Typography variant="caption">
                            {supplier.email}
                          </Typography>
                        </Box>
                      )}
                      {supplier.phone && (
                        <Box display="flex" alignItems="center">
                          <PhoneIcon sx={{ fontSize: 14, mr: 0.5 }} />
                          <Typography variant="caption">
                            {supplier.phone}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {supplier.rating ? (
                      <Rating value={supplier.rating} size="small" readOnly />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={supplier.locations_count || 0}
                      size="small"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={supplier.is_active ? 'Ativo' : 'Inativo'}
                      color={supplier.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleOpen(supplier)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      {showSelectButton && (
                        <Tooltip title="Selecionar">
                          <IconButton
                            size="small"
                            onClick={() => onSupplierSelect?.(supplier)}
                          >
                            <LocationIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Deletar">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(supplier)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de Criação/Edição */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {mutationError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {mutationError}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome *"
                  value={formData.name}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="CNPJ/CPF"
                  value={formData.tax_id}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, tax_id: e.target.value }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, email: e.target.value }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Telefone"
                  value={formData.phone}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, phone: e.target.value }))
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Website"
                  value={formData.website}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, website: e.target.value }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Avaliação
                  </Typography>
                  <Rating
                    value={formData.rating || 0}
                    onChange={(_, value) =>
                      setFormData(prev => ({
                        ...prev,
                        rating: value || undefined,
                      }))
                    }
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          is_active: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Ativo"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notas"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, notes: e.target.value }))
                  }
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingSupplier ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default SupplierManager;

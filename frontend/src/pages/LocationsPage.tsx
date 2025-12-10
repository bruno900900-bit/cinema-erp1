import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Pagination,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import {
  Search,
  FilterList,
  Add,
  Download,
  Edit,
  Delete,
  Business,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  locationService,
  AdvancedSearchParams,
  SearchResponse,
} from '../services/locationService';
import { tagService } from '../services/tagService';
import {
  supplierService,
  Supplier as SupplierApi,
} from '../services/supplierService';
import { Location, Tag, TagKind } from '../types/user';
import LocationCard from '../components/Locations/LocationCard';
import AdvancedSearchForm from '../components/Locations/AdvancedSearchForm';
import LocationFilters from '../components/Locations/LocationFilters';
import LocationDetailModal from '../components/Locations/LocationDetailModal';
import LocationEditModal from '../components/Locations/LocationEditModal';
import LocationDeleteModal from '../components/Locations/LocationDeleteModal';
import PresentationExportModal from '../components/Export/PresentationExportModal';
import { PresentationProvider } from '../components/Photos/builder/PresentationContext';
import PhotoPresentationBuilder from '../components/Photos/builder/PhotoPresentationBuilder';
import SupplierManager from '../components/Suppliers/SupplierManager';
import SupplierLocationLinkDialog from '../components/Suppliers/SupplierLocationLinkDialog';
import { Dialog as MuiDialog } from '@mui/material';
import { useFixAriaHidden } from '../hooks/useFixAriaHidden';

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
      id={`locations-tabpanel-${index}`}
      aria-labelledby={`locations-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function LocationsPage() {
  console.log('📍 LocationsPage rendering...');
  useFixAriaHidden();

  const [tabValue, setTabValue] = useState(0);
  const [searchParams, setSearchParams] = useState<AdvancedSearchParams>({
    page: 1,
    page_size: 12,
    include: ['supplier', 'project', 'photos', 'tags'],
  });

  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<
    Partial<AdvancedSearchParams>
  >({});
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isSupplierManagerOpen, setIsSupplierManagerOpen] = useState(false);
  const [isLinkSupplierOpen, setIsLinkSupplierOpen] = useState(false);

  // Estados para gerenciamento de tags
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isEditTagModalOpen, setIsEditTagModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [tagFormData, setTagFormData] = useState<Partial<Tag>>({
    name: '',
    kind: TagKind.FEATURE,
    color: '#1976d2',
  });

  const [tagPage, setTagPage] = useState(0);
  const [tagRowsPerPage, setTagRowsPerPage] = useState(10);
  const [tagSearchTerm, setTagSearchTerm] = useState('');

  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(
    null
  );

  const {
    data: searchResults,
    isLoading,
    error,
  } = useQuery<SearchResponse>({
    queryKey: ['locations', searchParams],
    queryFn: async () => {
      try {
        console.log('🔍 Searching locations with params:', searchParams);
        const result = await locationService.getLocations(searchParams);
        console.log('✅ Search results:', result);
        return result;
      } catch (err) {
        console.error('❌ Error in location search:', err);
        throw err;
      }
    },
    placeholderData: previousData => previousData,
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });

  // Suppliers list for Suppliers tab
  const { data: suppliersResp, isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers', 'locations-tab'],
    queryFn: () => supplierService.getSuppliers({ skip: 0, limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const suppliers: SupplierApi[] = suppliersResp?.suppliers || [];

  const handleSupplierCreated = (supplier: SupplierApi) => {
    if (!supplier) return;

    setSelectedSupplierId(supplier.id);

    queryClient.setQueryData(['suppliers', 'locations-tab'], (prev: any) => {
      if (!prev) return prev;
      const prevSuppliers: SupplierApi[] = prev.suppliers || [];
      const exists = prevSuppliers.some(item => item.id === supplier.id);
      const filtered = prevSuppliers.filter(item => item.id !== supplier.id);
      const updatedSuppliers = [supplier, ...filtered];
      const newTotal =
        typeof prev.total === 'number'
          ? exists
            ? prev.total
            : prev.total + 1
          : updatedSuppliers.length;
      return {
        ...prev,
        suppliers: updatedSuppliers,
        total: newTotal,
      };
    });

    queryClient.invalidateQueries({ queryKey: ['suppliers', 'locations-tab'] });
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
  };

  useEffect(() => {
    if (!suppliers.length) {
      if (selectedSupplierId !== null) {
        setSelectedSupplierId(null);
      }
      return;
    }

    if (
      selectedSupplierId !== null &&
      !suppliers.some(supplier => supplier.id === selectedSupplierId)
    ) {
      setSelectedSupplierId(suppliers[0].id);
    }
  }, [suppliers, selectedSupplierId]);

  // Locations linked to selected supplier
  const { data: supplierLocationsResp, isLoading: supplierLocationsLoading } =
    useQuery({
      queryKey: ['supplier-locations', selectedSupplierId],
      enabled: !!selectedSupplierId,
      queryFn: () =>
        locationService.getLocations({
          supplier_ids: selectedSupplierId ? [selectedSupplierId] : [],
          page: 1,
          page_size: 12,
          include: ['supplier', 'photos', 'tags'],
        }),
      staleTime: 2 * 60 * 1000,
    });

  // Query para buscar tags com cache otimizado
  const {
    data: tags = [],
    isLoading: tagsLoading,
    refetch: refetchTags,
  } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagService.getTags(),
    staleTime: 2 * 60 * 1000, // 2 minutos (reduzido para atualizar mais rápido)
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });

  // Verificar se o nome da tag é duplicado
  const isTagNameDuplicate =
    !!tagFormData.name &&
    tags.some(
      tag => tag.name.toLowerCase() === tagFormData.name!.toLowerCase()
    );

  // Mutations para tags
  const createTagMutation = useMutation({
    mutationFn: tagService.createTag,
    onSuccess: async createdTag => {
      const newTag = createdTag ?? null;

      if (newTag) {
        const referenceId = String(newTag.id ?? '');
        const referenceName = (newTag.name ?? '').trim().toLowerCase();
        queryClient.setQueryData<Tag[] | undefined>(['tags'], prev => {
          const previous = Array.isArray(prev) ? prev : [];
          const withoutDuplicate = previous.filter(tag => {
            const normalizedName = (tag.name ?? '').trim().toLowerCase();
            const sameId = tag.id === referenceId;
            const sameName =
              referenceName !== '' && normalizedName === referenceName;
            return !sameId && !sameName;
          });
          return [
            {
              ...newTag,
              id: referenceId,
              name: newTag.name ?? '',
            },
            ...withoutDuplicate,
          ];
        });
      } else {
        console.warn(
          'createTagMutation.onSuccess: resposta vazia recebida, será feito refetch completo'
        );
      }

      await refetchTags();

      setTagPage(0);
      setIsTagModalOpen(false);
      setTagFormData({
        name: '',
        kind: TagKind.FEATURE,
        color: '#1976d2',
      });

      setTimeout(() => {
        const mainContent = document.querySelector('main');
        if (mainContent instanceof HTMLElement) {
          mainContent.focus();
        }
      }, 100);

      console.log('✅ Tag criada com sucesso:', newTag);
    },
    onError: error => {
      console.error('❌ Erro ao criar tag:', error);
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tag> }) =>
      tagService.updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setIsEditTagModalOpen(false);
      setSelectedTag(null);
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: tagService.deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const handleSearch = (newParams: Partial<AdvancedSearchParams>) => {
    setSearchParams(prev => ({
      ...prev,
      ...newParams,
      page: 1, // Reset para primeira página
    }));
  };

  // Funções para manipulação de tags
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateTag = () => {
    if (tagFormData.name) {
      // Verificar se já existe uma tag com esse nome
      const existingTag = (tags as any[]).find(
        (tag: any) => tag.name.toLowerCase() === tagFormData.name!.toLowerCase()
      );

      if (existingTag) {
        alert(
          `Já existe uma tag com o nome "${tagFormData.name}". Por favor, escolha um nome diferente.`
        );
        return;
      }

      createTagMutation.mutate(tagFormData);
    }
  };

  const handleEditTag = () => {
    if (selectedTag && tagFormData.name) {
      updateTagMutation.mutate({ id: selectedTag.id, data: tagFormData });
    }
  };

  const handleDeleteTag = (tagId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tag?')) {
      deleteTagMutation.mutate(tagId);
    }
  };

  const handleEditTagClick = (tag: Tag) => {
    setSelectedTag(tag);
    setTagFormData(tag);
    setIsEditTagModalOpen(true);
  };

  const filteredTags = (tags as any[]).filter((tag: any) =>
    tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
  );

  const paginatedTags = filteredTags.slice(
    tagPage * tagRowsPerPage,
    tagPage * tagRowsPerPage + tagRowsPerPage
  );

  // Efeito para ajustar paginação quando necessário
  React.useEffect(() => {
    const maxPage = Math.ceil(filteredTags.length / tagRowsPerPage) - 1;
    if (tagPage > maxPage && maxPage >= 0) {
      setTagPage(maxPage);
    }
  }, [filteredTags.length, tagPage, tagRowsPerPage]);

  // Efeito para garantir que novas tags apareçam na primeira página
  React.useEffect(() => {
    if (filteredTags.length > 0 && tagPage === 0) {
      // Força re-renderização da lista quando tags são adicionadas
      const currentLength = filteredTags.length;
      if (currentLength <= tagRowsPerPage) {
        // Se ainda cabe na primeira página, mantém na primeira página
        setTagPage(0);
      }
    }
  }, [filteredTags.length, tagPage, tagRowsPerPage]);

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const handleFilterChange = (filters: Partial<AdvancedSearchParams>) => {
    setSelectedFilters(filters);
    handleSearch(filters);
  };

  const handleClearFilters = () => {
    setSelectedFilters({});
    setSearchParams({
      page: 1,
      page_size: 12,
      include: ['supplier', 'project', 'photos', 'tags'],
    });
  };

  const handleExportPresentation = () => {
    // Usar todas as locações dos resultados da busca
    if ((searchResults as any)?.locations) {
      setSelectedLocations((searchResults as any)?.locations || []);
      setIsExportModalOpen(true);
    }
  };

  const handleEditLocation = async (locationData: Partial<Location>) => {
    try {
      if (selectedLocation?.id) {
        await locationService.updateLocation(selectedLocation.id, locationData);
        queryClient.invalidateQueries({ queryKey: ['locations'] });
        setIsEditModalOpen(false);
        setSelectedLocation(null);
      }
    } catch (error) {
      console.error('Erro ao editar locação:', error);
      throw error;
    }
  };

  const handleDeleteLocation = async (location: Location) => {
    try {
      if (location.id) {
        await locationService.deleteLocation(location.id);
        queryClient.invalidateQueries({ queryKey: ['locations'] });
        setIsDeleteModalOpen(false);
        setSelectedLocation(null);
      }
    } catch (error) {
      console.error('Erro ao excluir locação:', error);
      throw error;
    }
  };

  const handleCreateLocation = async (locationData: Partial<Location>) => {
    try {
      // Se já vier com ID, foi criado via createLocationWithPhotos dentro do modal
      if (!locationData.id) {
        await locationService.createLocation(locationData);
      }
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar locação:', error);
      throw error;
    }
  };

  // const formatCurrency = (value?: number) => {
  //   if (!value) return 'N/A';
  //   return new Intl.NumberFormat('pt-BR', {
  //     style: 'currency',
  //     currency: 'BRL',
  //   }).format(value);
  // };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Erro ao carregar locações: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <PresentationProvider>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            mb: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 'bold', mb: 1 }}
            >
              Locações
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Busque e gerencie locações para cinema e publicidade
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {tabValue === 0 && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleExportPresentation}
                  disabled={
                    !(searchResults as any)?.locations ||
                    (searchResults as any).locations.length === 0
                  }
                >
                  Exportar Apresentação
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setIsBuilderOpen(true)}
                >
                  Montar Apresentação (Fotos)
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  size="large"
                  sx={{ borderRadius: 2 }}
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Nova Locação
                </Button>
              </>
            )}
            {tabValue === 1 && (
              <Button
                variant="contained"
                startIcon={<Add />}
                size="large"
                sx={{ borderRadius: 2 }}
                onClick={() => setIsTagModalOpen(true)}
              >
                Nova Tag
              </Button>
            )}
          </Box>
        </Box>

        {/* Tabs */}
        <Paper sx={{ width: '100%', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="locations tabs"
          >
            <Tab label="Locações" />
            <Tab label="Tags" />
            <Tab label="Fornecedores" />
          </Tabs>

          <Dialog
            open={isSupplierManagerOpen}
            onClose={() => setIsSupplierManagerOpen(false)}
            maxWidth="lg"
            fullWidth
            keepMounted
          >
            <DialogTitle>Gerenciar Fornecedores</DialogTitle>
            <DialogContent dividers>
              <SupplierManager
                onSupplierSelect={supplier => {
                  setSelectedSupplierId(supplier.id);
                  setIsSupplierManagerOpen(false);
                  queryClient.invalidateQueries({
                    queryKey: ['suppliers'],
                  });
                }}
                onSupplierCreated={handleSupplierCreated}
                showSelectButton
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsSupplierManagerOpen(false)}>
                Fechar
              </Button>
            </DialogActions>
          </Dialog>

          <SupplierLocationLinkDialog
            open={isLinkSupplierOpen && !!selectedSupplierId}
            supplier={
              selectedSupplierId
                ? suppliers.find(s => s.id === selectedSupplierId) || null
                : null
            }
            onClose={() => setIsLinkSupplierOpen(false)}
            onLinked={() => {
              if (selectedSupplierId) {
                queryClient.invalidateQueries({
                  queryKey: ['supplier-locations', selectedSupplierId],
                });
              }
              queryClient.invalidateQueries({ queryKey: ['locations'] });
            }}
          />

          {/* Tab Panel - Locações */}
          <TabPanel value={tabValue} index={0}>
            {/* Busca e Filtros */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box
                sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}
              >
                <TextField
                  placeholder="Buscar locações..."
                  value={searchParams.q || ''}
                  onChange={e => handleSearch({ q: e.target.value })}
                  sx={{ flexGrow: 1 }}
                  InputProps={{
                    startAdornment: (
                      <Search sx={{ mr: 1, color: 'text.secondary' }} />
                    ),
                  }}
                />

                <Button
                  variant={showAdvancedSearch ? 'contained' : 'outlined'}
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  startIcon={<FilterList />}
                >
                  Filtros Avançados
                </Button>
              </Box>

              {showAdvancedSearch && (
                <AdvancedSearchForm
                  filters={selectedFilters}
                  onFiltersChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                  tags={tags.map(tag => ({
                    id: tag.id,
                    name: tag.name,
                  }))}
                />
              )}
            </Paper>

            {/* Filtros Ativos */}
            <LocationFilters
              activeFilters={selectedFilters}
              onRemoveFilter={(key: string | number | symbol) => {
                const newFilters = { ...selectedFilters };
                delete newFilters[key as keyof AdvancedSearchParams];
                handleFilterChange(newFilters);
              }}
              onClearAll={handleClearFilters}
            />

            {/* Resultados */}
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {/* Estatísticas */}
                {searchResults && (
                  <Box sx={{ mb: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {(searchResults as any)?.total || 0} locações
                        encontradas
                      </Typography>
                      {(searchResults as any)?.facets && (
                        <>
                          <Typography variant="body2" color="text.secondary">
                            •
                          </Typography>
                          {Object.entries(
                            (searchResults as any).facets.status || {}
                          )
                            .map(([status, count]) => (
                              <Chip
                                key={status}
                                label={`${status}: ${count}`}
                                size="small"
                                variant="outlined"
                              />
                            ))
                            .slice(0, 3)}
                        </>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Grid de Locações */}
                <Grid container spacing={3}>
                  {(searchResults as any)?.locations?.map(
                    (location: Location) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={location.id}>
                        <LocationCard
                          location={location}
                          onEdit={() => {
                            setSelectedLocation(location);
                            setIsEditModalOpen(true);
                          }}
                          onDelete={() => {
                            setSelectedLocation(location);
                            setIsDeleteModalOpen(true);
                          }}
                          onView={() => {
                            setSelectedLocation(location);
                            setIsDetailModalOpen(true);
                          }}
                        />
                      </Grid>
                    )
                  )}
                </Grid>

                {/* Paginação */}
                {searchResults &&
                  (searchResults.total || 0) >
                    (searchParams.page_size || 12) && (
                    <Box
                      sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}
                    >
                      <Pagination
                        count={Math.ceil(
                          (searchResults.total || 0) /
                            (searchParams.page_size || 12)
                        )}
                        page={searchParams.page}
                        onChange={handlePageChange}
                        color="primary"
                        showFirstButton
                        showLastButton
                      />
                    </Box>
                  )}
              </>
            )}
          </TabPanel>

          {/* Tab Panel - Tags */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Buscar tags..."
                    value={tagSearchTerm}
                    onChange={e => setTagSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <Search />,
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            {tagsLoading || createTagMutation.isPending ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
                {createTagMutation.isPending && (
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    Criando tag...
                  </Typography>
                )}
                {tagsLoading && !createTagMutation.isPending && (
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    Atualizando lista...
                  </Typography>
                )}
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table key={`tags-table-${filteredTags.length}`}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Cor</TableCell>
                      <TableCell>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedTags.map(tag => (
                      <TableRow key={tag.id}>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Chip
                              label={tag.name}
                              size="small"
                              sx={{
                                backgroundColor: tag.color,
                                color: 'white',
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tag.kind}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              backgroundColor: tag.color,
                              borderRadius: '50%',
                              border: '1px solid #ccc',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Editar">
                            <IconButton
                              onClick={() => handleEditTagClick(tag)}
                              size="small"
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir">
                            <IconButton
                              onClick={() => handleDeleteTag(tag.id)}
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
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredTags.length}
                  rowsPerPage={tagRowsPerPage}
                  page={tagPage}
                  onPageChange={(_event, newPage) => setTagPage(newPage)}
                  onRowsPerPageChange={event => {
                    setTagRowsPerPage(parseInt(event.target.value, 10));
                    setTagPage(0);
                  }}
                  labelRowsPerPage="Linhas por página:"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
                  }
                  key={`pagination-${filteredTags.length}-${tagPage}`} // Força re-render quando dados mudam
                  // Desabilita o foco automático quando modal estiver aberta para evitar conflito de acessibilidade
                  disabled={isTagModalOpen}
                />
              </TableContainer>
            )}
          </TabPanel>

          {/* Tab Panel - Fornecedores */}
          <TabPanel value={tabValue} index={2}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6">Fornecedores cadastrados</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setIsSupplierManagerOpen(true)}
                >
                  Novo Fornecedor
                </Button>
                <Button
                  variant="contained"
                  startIcon={<LinkIcon />}
                  onClick={() => setIsLinkSupplierOpen(true)}
                  disabled={!selectedSupplierId}
                >
                  Vincular a Locações
                </Button>
              </Box>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Business sx={{ mr: 1 }} />
                    <Typography variant="h6">Fornecedores</Typography>
                  </Box>
                  {suppliersLoading ? (
                    <Box
                      sx={{ display: 'flex', justifyContent: 'center', p: 2 }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                    >
                      {suppliers.map(s => (
                        <Button
                          key={s.id}
                          variant={
                            selectedSupplierId === s.id
                              ? 'contained'
                              : 'outlined'
                          }
                          onClick={() => setSelectedSupplierId(s.id)}
                          sx={{ justifyContent: 'space-between' }}
                        >
                          <Box sx={{ textAlign: 'left' }}>
                            <Typography variant="body1">{s.name}</Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {s.email || s.phone || 'Fornecedor'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {typeof s.rating === 'number' && (
                              <Chip label={s.rating.toFixed(1)} size="small" />
                            )}
                            {typeof s.locations_count === 'number' && (
                              <Chip
                                label={`${s.locations_count}`}
                                size="small"
                                color="primary"
                              />
                            )}
                          </Box>
                        </Button>
                      ))}
                    </Box>
                  )}
                </Paper>
              </Grid>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Locações vinculadas
                  </Typography>
                  {!selectedSupplierId ? (
                    <Alert severity="info">
                      Selecione um fornecedor para ver as locações vinculadas.
                    </Alert>
                  ) : supplierLocationsLoading ? (
                    <Box
                      sx={{ display: 'flex', justifyContent: 'center', p: 4 }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {(supplierLocationsResp as any)?.locations?.map(
                        (location: Location) => (
                          <Grid item xs={12} sm={6} key={location.id}>
                            <LocationCard
                              location={location}
                              onEdit={() => {
                                setSelectedLocation(location);
                                setIsEditModalOpen(true);
                              }}
                              onDelete={() => {
                                setSelectedLocation(location);
                                setIsDeleteModalOpen(true);
                              }}
                              onView={() => {
                                setSelectedLocation(location);
                                setIsDetailModalOpen(true);
                              }}
                            />
                          </Grid>
                        )
                      )}
                    </Grid>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>

        {/* Modal de Detalhes da Locação */}
        <LocationDetailModal
          open={isDetailModalOpen}
          location={selectedLocation}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedLocation(null);
          }}
          onEdit={() => {
            setIsDetailModalOpen(false);
            setIsEditModalOpen(true);
          }}
          onDelete={() => {
            setIsDetailModalOpen(false);
            setIsDeleteModalOpen(true);
          }}
        />

        {/* Modal de Edição da Locação */}
        <LocationEditModal
          open={isEditModalOpen}
          location={selectedLocation}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedLocation(null);
          }}
          onSave={handleEditLocation}
          tags={tags.map(tag => ({
            ...tag,
            id: String((tag as any).id ?? ''),
          }))}
        />

        {/* Modal de Confirmação de Exclusão */}
        <LocationDeleteModal
          open={isDeleteModalOpen}
          location={selectedLocation}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedLocation(null);
          }}
          onConfirm={handleDeleteLocation}
        />

        {/* Modal de Criação de Nova Locação */}
        <LocationEditModal
          open={isCreateModalOpen}
          location={null}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateLocation}
          tags={tags.map(tag => ({
            ...tag,
            id: String((tag as any).id ?? ''),
          }))}
        />

        {/* Modal de Exportação */}
        <PresentationExportModal
          open={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
        />

        {/* Modal de Criação de Tag */}
        <Dialog
          open={isTagModalOpen}
          onClose={() => setIsTagModalOpen(false)}
          maxWidth="sm"
          fullWidth
          // Melhora a gestão de foco para acessibilidade
          disableEnforceFocus={false}
          disableAutoFocus={false}
          disableRestoreFocus={false}
        >
          <DialogTitle>Nova Tag</DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
            >
              <TextField
                label="Nome da Tag"
                value={tagFormData.name}
                onChange={e =>
                  setTagFormData(prev => ({ ...prev, name: e.target.value }))
                }
                fullWidth
                required
                error={isTagNameDuplicate}
                helperText={
                  isTagNameDuplicate ? 'Já existe uma tag com este nome' : ''
                }
              />
              <FormControl fullWidth required>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={tagFormData.kind}
                  onChange={e =>
                    setTagFormData(prev => ({
                      ...prev,
                      kind: e.target.value as TagKind,
                    }))
                  }
                  label="Tipo"
                >
                  <MenuItem value={TagKind.FEATURE}>Característica</MenuItem>
                  <MenuItem value={TagKind.AMENITY}>Comodidade</MenuItem>
                  <MenuItem value={TagKind.RESTRICTION}>Restrição</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Cor"
                type="color"
                value={tagFormData.color}
                onChange={e =>
                  setTagFormData(prev => ({ ...prev, color: e.target.value }))
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsTagModalOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCreateTag}
              variant="contained"
              disabled={
                createTagMutation.isPending ||
                isTagNameDuplicate ||
                !tagFormData.name?.trim()
              }
            >
              {createTagMutation.isPending ? 'Criando...' : 'Criar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Edição de Tag */}
        <Dialog
          open={isEditTagModalOpen}
          onClose={() => setIsEditTagModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Editar Tag</DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
            >
              <TextField
                label="Nome da Tag"
                value={tagFormData.name}
                onChange={e =>
                  setTagFormData(prev => ({ ...prev, name: e.target.value }))
                }
                fullWidth
                required
              />
              <FormControl fullWidth required>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={tagFormData.kind}
                  onChange={e =>
                    setTagFormData(prev => ({
                      ...prev,
                      kind: e.target.value as TagKind,
                    }))
                  }
                  label="Tipo"
                >
                  <MenuItem value={TagKind.FEATURE}>Característica</MenuItem>
                  <MenuItem value={TagKind.AMENITY}>Comodidade</MenuItem>
                  <MenuItem value={TagKind.RESTRICTION}>Restrição</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Cor"
                type="color"
                value={tagFormData.color}
                onChange={e =>
                  setTagFormData(prev => ({ ...prev, color: e.target.value }))
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsEditTagModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleEditTag}
              variant="contained"
              disabled={updateTagMutation.isPending}
            >
              {updateTagMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PresentationProvider>
  );
}

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Description as FileIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  CreateNewFolder as CreateFolderIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Home as HomeIcon,
  Assignment as ProjectIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '../services/projectService';
import {
  contractService,
  GeneratedContract,
} from '../services/contractService';
import { supplierService } from '../services/supplierService';
import { userService } from '../services/userService';
import {
  fileService,
  ProjectFile,
  ProjectFolder,
} from '../services/fileService';

const FilesPage: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectFolder | null>(
    null
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // Buscar projetos
  const { data: projectsResponse, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  });

  // Buscar usuários
  const { data: usersResponse } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  });

  // Buscar pastas de projetos
  const { data: projectFolders, isLoading: foldersLoading } = useQuery({
    queryKey: ['project-folders'],
    queryFn: fileService.getProjectFolders,
    enabled: !!projectsResponse && !!usersResponse,
  });

  const projects = projectsResponse?.projects || [];
  const users = usersResponse?.users || [];

  // Inicializar dados de exemplo quando os dados estiverem disponíveis
  React.useEffect(() => {
    if (projects.length > 0 && users.length > 0) {
      fileService.initializeSampleData(projects, users);
    }
  }, [projects, users]);

  const getFileIcon = (file: ProjectFile) => {
    if (file.type === 'folder') {
      return <FolderIcon />;
    }

    switch (file.file_type) {
      case 'contract':
        return <Description />;
      case 'location':
        return <LocationIcon />;
      case 'document':
        return <FileIcon />;
      case 'image':
        return <FileIcon />;
      default:
        return <FileIcon />;
    }
  };

  const getFileTypeColor = (fileType?: string) => {
    switch (fileType) {
      case 'contract':
        return 'success';
      case 'location':
        return 'info';
      case 'document':
        return 'primary';
      case 'image':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFolderClick = (folder: ProjectFolder) => {
    setSelectedProject(folder);
    setCurrentPath([folder.name]);
  };

  const handleFileClick = (file: ProjectFile) => {
    if (file.type === 'folder') {
      setCurrentPath(prev => [...prev, file.name]);
    } else {
      // Simular download ou visualização
      console.log('Opening file:', file.name);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === 0) {
      setSelectedProject(null);
      setCurrentPath([]);
    } else {
      setCurrentPath(prev => prev.slice(0, index + 1));
    }
  };

  const handleUploadFile = () => {
    setIsUploadDialogOpen(true);
  };

  const getCurrentFiles = (): ProjectFile[] => {
    if (!selectedProject) return [];

    if (currentPath.length === 1) {
      return selectedProject.files;
    }

    // Navegar para subpastas
    let currentFiles = selectedProject.files;
    for (let i = 1; i < currentPath.length; i++) {
      const folderName = currentPath[i];
      const folder = currentFiles.find(
        f => f.name === folderName && f.type === 'folder'
      );
      if (folder && folder.children) {
        currentFiles = folder.children;
      } else {
        return [];
      }
    }

    return currentFiles;
  };

  const filteredFiles = getCurrentFiles().filter(file => {
    const matchesSearch = file.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || file.file_type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (projectsLoading || foldersLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

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
          Arquivos do Projeto
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={handleUploadFile}
          >
            Upload
          </Button>
          <Button variant="contained" startIcon={<CreateFolderIcon />}>
            Nova Pasta
          </Button>
        </Box>
      </Box>

      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => handleBreadcrumbClick(0)}
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <HomeIcon />
          Projetos
        </Link>
        {currentPath.map((path, index) => (
          <Link
            key={index}
            component="button"
            variant="body1"
            onClick={() => handleBreadcrumbClick(index)}
          >
            {path}
          </Link>
        ))}
      </Breadcrumbs>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar arquivos..."
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
              <InputLabel>Tipo de Arquivo</InputLabel>
              <Select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                label="Tipo de Arquivo"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="contract">Contratos</MenuItem>
                <MenuItem value="location">Locações</MenuItem>
                <MenuItem value="document">Documentos</MenuItem>
                <MenuItem value="image">Imagens</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Conteúdo Principal */}
      {!selectedProject ? (
        // Lista de Projetos
        <Grid container spacing={3}>
          {(projectFolders || []).map(project => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleFolderClick(project)}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <FolderIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{ fontWeight: 'bold' }}
                      >
                        {project.project_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {project.project_responsible}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={project.project_status}
                      color="primary"
                      size="small"
                    />
                    <Chip
                      label={`R$ ${project.project_budget.toLocaleString(
                        'pt-BR'
                      )}`}
                      color="success"
                      size="small"
                    />
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {project.files.length} pastas
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {project.contracts.length} contratos
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        // Lista de Arquivos do Projeto
        <Paper>
          <List>
            {filteredFiles.map(file => (
              <ListItem
                key={file.id}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
                onClick={() => handleFileClick(file)}
              >
                <ListItemIcon>{getFileIcon(file)}</ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center',
                        mt: 1,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {file.type === 'file'
                          ? formatFileSize(file.size)
                          : `${file.children?.length || 0} itens`}
                      </Typography>
                      {file.file_type && (
                        <Chip
                          label={file.file_type}
                          color={getFileTypeColor(file.file_type) as any}
                          size="small"
                        />
                      )}
                      {file.status && (
                        <Chip
                          label={file.status}
                          color={getStatusColor(file.status) as any}
                          size="small"
                        />
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Visualizar">
                      <IconButton size="small">
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download">
                      <IconButton size="small">
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Compartilhar">
                      <IconButton size="small">
                        <ShareIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Modal de Upload */}
      <Dialog
        open={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload de Arquivo</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CloudUploadIcon
              sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>
              Arraste e solte arquivos aqui
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              ou clique para selecionar arquivos
            </Typography>
            <Button variant="contained" component="label">
              Selecionar Arquivos
              <input type="file" hidden multiple />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsUploadDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained">Upload</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FilesPage;

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Search as SearchIcon,
  FolderOpen as ProjectIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../../services/projectService';
import {
  userProjectService,
  UserProject,
  BulkProjectAssignment,
} from '../../services/userProjectService';

interface UserProjectAccessModalProps {
  open: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
}

type AccessLevel = 'viewer' | 'editor' | 'admin';

const accessLevelLabels: Record<AccessLevel, string> = {
  viewer: 'Visualizador',
  editor: 'Editor',
  admin: 'Administrador',
};

const accessLevelColors: Record<AccessLevel, 'default' | 'primary' | 'error'> =
  {
    viewer: 'default',
    editor: 'primary',
    admin: 'error',
  };

export default function UserProjectAccessModal({
  open,
  onClose,
  userId,
  userName,
}: UserProjectAccessModalProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('viewer');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch all projects
  const { data: allProjects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
    enabled: open,
  });

  // Fetch user's current projects
  const {
    data: userProjectsData,
    isLoading: userProjectsLoading,
    refetch: refetchUserProjects,
  } = useQuery({
    queryKey: ['user-projects', userId],
    queryFn: () => userProjectService.getUserProjects(userId),
    enabled: open && userId > 0,
  });

  const userProjects = userProjectsData?.projects || [];

  // Reset state on open
  useEffect(() => {
    if (open) {
      setSelectedProjects([]);
      setAccessLevel('viewer');
      setError(null);
      setSuccessMessage(null);
      setSearchTerm('');
    }
  }, [open]);

  // Bulk assign mutation
  const bulkAssignMutation = useMutation({
    mutationFn: (data: BulkProjectAssignment) =>
      userProjectService.bulkAssignProjects(userId, data),
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: ['user-projects', userId] });
      setSuccessMessage(result.message);
      setSelectedProjects([]);
      refetchUserProjects();
    },
    onError: (err: any) => {
      setError(err?.message || 'Erro ao atribuir projetos');
    },
  });

  // Remove access mutation
  const removeAccessMutation = useMutation({
    mutationFn: (projectId: number) =>
      userProjectService.removeProjectAccess(userId, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-projects', userId] });
      setSuccessMessage('Acesso removido com sucesso');
      refetchUserProjects();
    },
    onError: (err: any) => {
      setError(err?.message || 'Erro ao remover acesso');
    },
  });

  // Filter projects not yet assigned
  const assignedProjectIds = userProjects.map(
    (up: UserProject) => up.project_id
  );
  const availableProjects = (allProjects as any[]).filter(
    p => !assignedProjectIds.includes(p.id)
  );

  // Filter by search
  const filteredProjects = availableProjects.filter(p =>
    (p.name || p.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleProject = (projectId: number) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleAssign = () => {
    if (selectedProjects.length === 0) {
      setError('Selecione pelo menos um projeto');
      return;
    }
    bulkAssignMutation.mutate({
      project_ids: selectedProjects,
      access_level: accessLevel,
    });
  };

  const handleRemove = (projectId: number) => {
    removeAccessMutation.mutate(projectId);
  };

  const isLoading = projectsLoading || userProjectsLoading;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: theme.palette.background.paper }}>
        <Box display="flex" alignItems="center" gap={1}>
          <ProjectIcon color="primary" />
          <Typography variant="h6">Gerenciar Acesso a Projetos</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Usuário: <strong>{userName}</strong>
        </Typography>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ bgcolor: alpha(theme.palette.background.default, 0.5) }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccessMessage(null)}
          >
            {successMessage}
          </Alert>
        )}

        {isLoading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            display="flex"
            gap={2}
            flexDirection={{ xs: 'column', md: 'row' }}
          >
            {/* Left: Current Access */}
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Projetos com Acesso ({userProjects.length})
              </Typography>
              <List
                dense
                sx={{
                  bgcolor: theme.palette.background.paper,
                  borderRadius: 1,
                  maxHeight: 300,
                  overflow: 'auto',
                }}
              >
                {userProjects.length === 0 ? (
                  <ListItem>
                    <ListItemText secondary="Nenhum projeto atribuído" />
                  </ListItem>
                ) : (
                  userProjects.map((up: UserProject) => (
                    <ListItem key={up.id}>
                      <ListItemText
                        primary={up.project_name || `Projeto #${up.project_id}`}
                        secondary={
                          <Chip
                            size="small"
                            label={accessLevelLabels[up.access_level]}
                            color={accessLevelColors[up.access_level]}
                          />
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => handleRemove(up.project_id)}
                          disabled={removeAccessMutation.isPending}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))
                )}
              </List>
            </Box>

            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: 'none', md: 'block' } }}
            />

            {/* Right: Add New Access */}
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Atribuir Novos Projetos
              </Typography>

              <TextField
                fullWidth
                size="small"
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Nível de Acesso</InputLabel>
                <Select
                  value={accessLevel}
                  label="Nível de Acesso"
                  onChange={e => setAccessLevel(e.target.value as AccessLevel)}
                >
                  <MenuItem value="viewer">Visualizador</MenuItem>
                  <MenuItem value="editor">Editor</MenuItem>
                  <MenuItem value="admin">Administrador</MenuItem>
                </Select>
              </FormControl>

              <List
                dense
                sx={{
                  bgcolor: theme.palette.background.paper,
                  borderRadius: 1,
                  maxHeight: 200,
                  overflow: 'auto',
                }}
              >
                {filteredProjects.length === 0 ? (
                  <ListItem>
                    <ListItemText secondary="Nenhum projeto disponível" />
                  </ListItem>
                ) : (
                  filteredProjects.map((project: any) => (
                    <ListItem
                      key={project.id}
                      button
                      onClick={() => handleToggleProject(project.id)}
                    >
                      <Checkbox
                        edge="start"
                        checked={selectedProjects.includes(project.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                      <ListItemText primary={project.name || project.title} />
                    </ListItem>
                  ))
                )}
              </List>

              {selectedProjects.length > 0 && (
                <Box mt={2}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleAssign}
                    disabled={bulkAssignMutation.isPending}
                  >
                    {bulkAssignMutation.isPending
                      ? 'Atribuindo...'
                      : `Atribuir ${selectedProjects.length} projeto(s)`}
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}

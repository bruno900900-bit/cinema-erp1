import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
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
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Label as LabelIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagService } from '../../services/tagService';
import { Tag, TagKind } from '@/types/user';
import { toast } from 'react-toastify';

const TagManager: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState<Partial<Tag>>({
    name: '',
    kind: TagKind.FEATURE,
    color: '#4169E1',
  });

  const queryClient = useQueryClient();

  // Buscar tags
  const {
    data: tags = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tags'],
    queryFn: tagService.getTags,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: tagService.createTag,
    onSuccess: async () => {
      console.log('✅ Tag created successfully, invalidating queries...');
      await queryClient.invalidateQueries({
        queryKey: ['tags'],
        refetchType: 'active',
      });
      console.log('✅ Queries invalidated, refetching...');
      await queryClient.refetchQueries({ queryKey: ['tags'] });
      console.log('✅ Refetch complete');
      handleClose();
      toast.success('Tag criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('❌ Erro ao criar tag:', error);
      toast.error(error.message || 'Erro ao criar tag');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tag> }) =>
      tagService.updateTag(id, data),
    onSuccess: async () => {
      console.log('✅ Tag updated successfully, invalidating queries...');
      await queryClient.invalidateQueries({
        queryKey: ['tags'],
        refetchType: 'active',
      });
      console.log('✅ Queries invalidated, refetching...');
      await queryClient.refetchQueries({ queryKey: ['tags'] });
      console.log('✅ Refetch complete');
      handleClose();
      toast.success('Tag atualizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('❌ Erro ao atualizar tag:', error);
      toast.error(error.message || 'Erro ao atualizar tag');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: tagService.deleteTag,
    onSuccess: async () => {
      console.log('✅ Tag deleted successfully, invalidating queries...');
      await queryClient.invalidateQueries({
        queryKey: ['tags'],
        refetchType: 'active',
      });
      console.log('✅ Queries invalidated, refetching...');
      await queryClient.refetchQueries({ queryKey: ['tags'] });
      console.log('✅ Refetch complete');
      toast.success('Tag excluída com sucesso!');
    },
    onError: (error: any) => {
      console.error('❌ Erro ao excluir tag:', error);
      toast.error(error.message || 'Erro ao excluir tag');
    },
  });

  const handleOpen = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({
        name: tag.name,
        kind: tag.kind,
        color: tag.color,
      });
    } else {
      setEditingTag(null);
      setFormData({
        name: '',
        kind: TagKind.FEATURE,
        color: '#4169E1',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTag(null);
    setFormData({
      name: '',
      kind: TagKind.FEATURE,
      color: '#4169E1',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Nome da tag é obrigatório');
      return;
    }

    if (editingTag) {
      updateMutation.mutate({
        id: editingTag.id,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (tag: Tag) => {
    if (window.confirm(`Tem certeza que deseja deletar a tag "${tag.name}"?`)) {
      deleteMutation.mutate(tag.id);
    }
  };

  const getTagKindLabel = (kind: TagKind) => {
    const labels: Record<TagKind, string> = {
      [TagKind.FEATURE]: 'Característica',
      [TagKind.CATEGORY]: 'Categoria',
      [TagKind.AMENITY]: 'Comodidade',
      [TagKind.RESTRICTION]: 'Restrição',
    };
    return labels[kind] || kind;
  };

  if (error) {
    return (
      <Alert severity="error">
        Erro ao carregar tags: {(error as Error).message}
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
          <LabelIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Gerenciar Tags
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Nova Tag
        </Button>
      </Box>

      {/* Tabela de Tags */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Cor</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Nenhuma tag encontrada
                </TableCell>
              </TableRow>
            ) : (
              tags.map(tag => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <Chip
                      icon={
                        <CircleIcon sx={{ color: `${tag.color} !important` }} />
                      }
                      label={tag.name}
                      variant="outlined"
                      sx={{ borderColor: tag.color }}
                    />
                  </TableCell>
                  <TableCell>{getTagKindLabel(tag.kind)}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: tag.color,
                          border: '1px solid rgba(0,0,0,0.1)',
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {tag.color}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleOpen(tag)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Deletar">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(tag)}
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
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTag ? 'Editar Tag' : 'Nova Tag'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
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
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={formData.kind}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        kind: e.target.value as TagKind,
                      }))
                    }
                    label="Tipo"
                  >
                    <MenuItem value={TagKind.FEATURE}>Característica</MenuItem>
                    <MenuItem value={TagKind.CATEGORY}>Categoria</MenuItem>
                    <MenuItem value={TagKind.AMENITY}>Comodidade</MenuItem>
                    <MenuItem value={TagKind.RESTRICTION}>Restrição</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Cor
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          color: e.target.value,
                        }))
                      }
                      style={{
                        width: 60,
                        height: 40,
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    />
                    <TextField
                      value={formData.color}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          color: e.target.value,
                        }))
                      }
                      size="small"
                      placeholder="#4169E1"
                    />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ width: '100%' }}
                  >
                    Cores sugeridas:
                  </Typography>
                  {[
                    '#4169E1',
                    '#E91E63',
                    '#9C27B0',
                    '#FF9800',
                    '#4CAF50',
                    '#F44336',
                    '#00BCD4',
                    '#8BC34A',
                  ].map(color => (
                    <Box
                      key={color}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: color,
                        border:
                          formData.color === color
                            ? '3px solid white'
                            : '1px solid rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        boxShadow:
                          formData.color === color
                            ? '0 0 0 2px ' + color
                            : 'none',
                        '&:hover': {
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s',
                      }}
                    />
                  ))}
                </Box>
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
              {editingTag ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default TagManager;

/**
 * Componente de Detalhes de uma Locação Visitada
 * Com galeria de fotos, comentários/notas e workflow com usuários
 * Design com cores vibrantes e moderno
 */
import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Grid,
  TextField,
  Divider,
  Card,
  CardMedia,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Chip,
  Paper,
  alpha,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  PhotoCamera as PhotoIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Comment as CommentIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as PendingIcon,
  PlayCircle as InProgressIcon,
  Person as PersonIcon,
  Assignment as WorkflowIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import projectVisitLocationService, {
  VisitPhoto,
  PhotoComment,
  WorkflowStage,
} from '../../services/projectVisitLocationService';
import { userService } from '../../services/userService';

interface VisitLocationDetailProps {
  locationId: number;
  onClose: () => void;
}

const VisitLocationDetail: React.FC<VisitLocationDetailProps> = ({
  locationId,
  onClose,
}) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [selectedPhoto, setSelectedPhoto] = useState<VisitPhoto | null>(null);
  const [newComment, setNewComment] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [addStageOpen, setAddStageOpen] = useState(false);
  const [newStageTitle, setNewStageTitle] = useState('');
  const [newStageDescription, setNewStageDescription] = useState('');
  const [newStageResponsible, setNewStageResponsible] = useState<number | ''>(
    ''
  );
  const [newTaskPriority, setNewTaskPriority] = useState<string>('BAIXA');
  // Stage Detail Modal States
  const [selectedStage, setSelectedStage] = useState<WorkflowStage | null>(
    null
  );
  const [stageDetailOpen, setStageDetailOpen] = useState(false);
  const [stageNote, setStageNote] = useState('');

  // Queries
  const { data: location, isLoading } = useQuery({
    queryKey: ['visitLocation', locationId],
    queryFn: () => projectVisitLocationService.getById(locationId),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  });

  // Extract users array safely
  const users = Array.isArray(usersData) ? usersData : usersData?.users || [];

  // Get current user ID from first user in list or use null
  const currentUserId = users.length > 0 ? users[0].id : null;

  // Mutations
  const addCommentMutation = useMutation({
    mutationFn: ({ photoId, comment }: { photoId: number; comment: string }) =>
      projectVisitLocationService.addComment(
        photoId,
        comment,
        currentUserId || 1
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['visitLocation', locationId],
      });
      setNewComment('');
      toast.success('Nota adicionada!');
    },
    onError: () => {
      toast.error('Erro ao adicionar nota');
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: projectVisitLocationService.deletePhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['visitLocation', locationId],
      });
      setSelectedPhoto(null);
      toast.success('Foto removida!');
    },
    onError: () => {
      toast.error('Erro ao remover foto');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: projectVisitLocationService.deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['visitLocation', locationId],
      });
      toast.success('Nota removida!');
    },
    onError: () => {
      toast.error('Erro ao remover nota');
    },
  });

  const addStageMutation = useMutation({
    mutationFn: () =>
      projectVisitLocationService.addStage(
        locationId,
        `[${newTaskPriority}] ${newStageTitle}`,
        newStageDescription,
        newStageResponsible || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['visitLocation', locationId],
      });
      setAddStageOpen(false);
      setNewStageTitle('');
      setNewStageDescription('');
      setNewStageResponsible('');
      setNewTaskPriority('BAIXA');
      toast.success('Tarefa adicionada!');
    },
    onError: () => {
      toast.error('Erro ao adicionar tarefa');
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: ({
      stageId,
      status,
      notes,
    }: {
      stageId: number;
      status?: string;
      notes?: string;
    }) =>
      projectVisitLocationService.updateStage(
        stageId,
        { status, notes },
        currentUserId || 1
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['visitLocation', locationId],
      });
      toast.success('Atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar');
    },
  });

  const deleteStageMutation = useMutation({
    mutationFn: projectVisitLocationService.deleteStage,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['visitLocation', locationId],
      });
      toast.success('Etapa removida!');
    },
    onError: () => {
      toast.error('Erro ao remover etapa');
    },
  });

  // Handlers
  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhoto(true);
    try {
      for (const file of Array.from(files)) {
        await projectVisitLocationService.uploadPhoto(
          locationId,
          file,
          undefined,
          currentUserId || undefined
        );
      }
      queryClient.invalidateQueries({
        queryKey: ['visitLocation', locationId],
      });
      toast.success(`${files.length} foto(s) enviada(s) com sucesso!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar foto');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddComment = () => {
    if (!selectedPhoto || !newComment.trim()) return;
    addCommentMutation.mutate({
      photoId: selectedPhoto.id,
      comment: newComment,
    });
  };

  if (isLoading || !location) {
    return (
      <Box
        sx={{
          p: 4,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          minHeight: 300,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress sx={{ color: '#fff' }} />
        <Typography sx={{ mt: 2, color: '#fff' }}>Carregando...</Typography>
      </Box>
    );
  }

  // Safe data extraction
  const safeName =
    typeof location.name === 'string' ? location.name : 'Sem nome';
  const safeCity = typeof location.city === 'string' ? location.city : '';
  const safeState = typeof location.state === 'string' ? location.state : '';
  const safeAddress =
    typeof location.address === 'string' ? location.address : '';
  const safePhotos = Array.isArray(location.photos) ? location.photos : [];
  const safeStages = Array.isArray(location.workflow_stages)
    ? location.workflow_stages
    : [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CompletedIcon sx={{ color: '#10b981' }} />;
      case 'in_progress':
        return <InProgressIcon sx={{ color: '#f59e0b' }} />;
      default:
        return <PendingIcon sx={{ color: '#9ca3af' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#064e3b', border: '#10b981', text: '#6ee7b7' };
      case 'in_progress':
        return { bg: '#78350f', border: '#f59e0b', text: '#fcd34d' };
      default:
        return { bg: '#374151', border: '#6b7280', text: '#9ca3af' };
    }
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#0f172a',
      }}
    >
      {/* Header with Gradient */}
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LocationIcon />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {safeName}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {[safeAddress, safeCity, safeState].filter(Boolean).join(', ') ||
              'Endereço não informado'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Chip
              icon={<PhotoIcon sx={{ color: '#fff !important' }} />}
              label={`${safePhotos.length} fotos`}
              size="small"
              sx={{
                bgcolor: alpha('#fff', 0.2),
                color: '#fff',
                '& .MuiChip-icon': { color: '#fff' },
              }}
            />
            <Chip
              icon={<WorkflowIcon sx={{ color: '#fff !important' }} />}
              label={`${safeStages.length} etapas`}
              size="small"
              sx={{
                bgcolor: alpha('#fff', 0.2),
                color: '#fff',
                '& .MuiChip-icon': { color: '#fff' },
              }}
            />
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#fff' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
        <Grid container spacing={3}>
          {/* Left Column - Photos */}
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid #334155',
                background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      background:
                        'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    }}
                  >
                    <PhotoIcon sx={{ color: '#fff' }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Fotos ({safePhotos.length})
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  size="small"
                  sx={{
                    background:
                      'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    '&:hover': {
                      background:
                        'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    },
                  }}
                >
                  {uploadingPhoto ? 'Enviando...' : 'Adicionar'}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                />
              </Box>

              {uploadingPhoto && (
                <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />
              )}

              {safePhotos.length > 0 ? (
                <Grid container spacing={1.5}>
                  {safePhotos.map((photo: VisitPhoto) => (
                    <Grid item xs={4} sm={3} key={photo.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          position: 'relative',
                          borderRadius: 2,
                          overflow: 'hidden',
                          '&:hover': {
                            transform: 'scale(1.03)',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                        onClick={() => setSelectedPhoto(photo)}
                      >
                        <CardMedia
                          component="img"
                          height="100"
                          image={photo.url || '/placeholder.jpg'}
                          alt="Foto"
                          sx={{ objectFit: 'cover' }}
                        />
                        {(photo.comments_count || 0) > 0 && (
                          <Chip
                            size="small"
                            icon={
                              <CommentIcon
                                sx={{ fontSize: 10, color: '#fff !important' }}
                              />
                            }
                            label={photo.comments_count}
                            sx={{
                              position: 'absolute',
                              bottom: 6,
                              right: 6,
                              bgcolor: 'rgba(102, 126, 234, 0.9)',
                              color: '#fff',
                              fontSize: 10,
                              height: 22,
                              '& .MuiChip-icon': { color: '#fff' },
                            }}
                          />
                        )}
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 6,
                    background:
                      'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    borderRadius: 2,
                  }}
                >
                  <PhotoIcon sx={{ fontSize: 56, color: '#94a3b8' }} />
                  <Typography
                    color="text.secondary"
                    sx={{ mt: 1, fontWeight: 500 }}
                  >
                    Nenhuma foto adicionada
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Clique em "Adicionar" para enviar fotos
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Right Column - Tarefas */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                border: '1px solid #334155',
                background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WorkflowIcon sx={{ color: '#8b5cf6', fontSize: 20 }} />
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, color: '#e2e8f0' }}
                  >
                    Tarefas
                  </Typography>
                </Box>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setAddStageOpen(true)}
                  sx={{
                    color: '#8b5cf6',
                    borderColor: '#8b5cf6',
                    '&:hover': { bgcolor: 'rgba(139,92,246,0.1)' },
                  }}
                  variant="outlined"
                >
                  Nova
                </Button>
              </Box>

              {/* Task List - uses safeStages as tasks */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  maxHeight: 300,
                  overflow: 'auto',
                }}
              >
                {safeStages.length > 0 ? (
                  [...safeStages]
                    .sort(
                      (a: any, b: any) =>
                        (a.order_index || 0) - (b.order_index || 0)
                    )
                    .map((stage: WorkflowStage, index: number) => {
                      // Priority based on status or notes keywords
                      const getPriority = () => {
                        const notes = (stage.notes || '').toLowerCase();
                        if (
                          notes.includes('urgente') ||
                          notes.includes('urgent')
                        )
                          return 'URGENTE';
                        if (notes.includes('alta') || notes.includes('high'))
                          return 'ALTA';
                        if (notes.includes('média') || notes.includes('medium'))
                          return 'MÉDIA';
                        if (stage.status === 'in_progress') return 'ALTA';
                        return 'BAIXA';
                      };

                      const priority = getPriority();
                      const priorityColors: {
                        [key: string]: {
                          bg: string;
                          border: string;
                          text: string;
                        };
                      } = {
                        URGENTE: {
                          bg: '#fef2f2',
                          border: '#ef4444',
                          text: '#dc2626',
                        },
                        ALTA: {
                          bg: '#fff7ed',
                          border: '#f97316',
                          text: '#ea580c',
                        },
                        MÉDIA: {
                          bg: '#fefce8',
                          border: '#eab308',
                          text: '#ca8a04',
                        },
                        BAIXA: {
                          bg: '#f0fdf4',
                          border: '#22c55e',
                          text: '#16a34a',
                        },
                      };
                      const colors = priorityColors[priority];

                      return (
                        <Box
                          key={stage.id || index}
                          onClick={() => {
                            setSelectedStage(stage);
                            setStageNote(stage.notes || '');
                            setStageDetailOpen(true);
                          }}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: '#0f172a',
                            borderLeft: `4px solid ${colors.border}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: '#1e293b',
                              transform: 'translateX(4px)',
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                            }}
                          >
                            <Box sx={{ flex: 1 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  mb: 0.5,
                                }}
                              >
                                <Chip
                                  label={priority}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: 9,
                                    fontWeight: 700,
                                    bgcolor: colors.bg,
                                    color: colors.text,
                                    border: `1px solid ${colors.border}`,
                                  }}
                                />
                                <Chip
                                  label={
                                    stage.status === 'completed'
                                      ? '✅'
                                      : stage.status === 'in_progress'
                                      ? '🔄'
                                      : '⏳'
                                  }
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: 10,
                                    bgcolor: 'transparent',
                                  }}
                                />
                              </Box>
                              <Typography
                                variant="body2"
                                sx={{ color: '#e2e8f0', fontWeight: 500 }}
                              >
                                {stage.title}
                              </Typography>
                              {stage.notes && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: '#94a3b8',
                                    display: 'block',
                                    mt: 0.5,
                                  }}
                                >
                                  {stage.notes.substring(0, 60)}
                                  {stage.notes.length > 60 ? '...' : ''}
                                </Typography>
                              )}
                              {stage.responsible_user && (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    mt: 0.5,
                                  }}
                                >
                                  <Avatar
                                    sx={{ width: 16, height: 16, fontSize: 8 }}
                                  >
                                    {(
                                      stage.responsible_user as any
                                    )?.full_name?.charAt(0) || '?'}
                                  </Avatar>
                                  <Typography
                                    variant="caption"
                                    sx={{ color: '#64748b', fontSize: 10 }}
                                  >
                                    {(stage.responsible_user as any)
                                      ?.full_name || 'Usuário'}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                            {/* Delete Button */}
                            <IconButton
                              size="small"
                              onClick={e => {
                                e.stopPropagation();
                                if (window.confirm('Excluir esta tarefa?')) {
                                  deleteStageMutation.mutate(stage.id);
                                }
                              }}
                              sx={{
                                color: '#ef4444',
                                p: 0.5,
                                opacity: 0.6,
                                '&:hover': {
                                  opacity: 1,
                                  bgcolor: 'rgba(239,68,68,0.1)',
                                },
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        </Box>
                      );
                    })
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Nenhuma tarefa adicionada
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#475569' }}>
                      Clique em "Nova" para adicionar
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Photo Lightbox Dialog */}
      <Dialog
        open={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'hidden' },
        }}
      >
        {selectedPhoto && (
          <>
            <DialogTitle
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhotoIcon />
                <Typography variant="h6">Foto e Notas</Typography>
              </Box>
              <Box>
                <IconButton
                  onClick={() => deletePhotoMutation.mutate(selectedPhoto.id)}
                  sx={{ color: '#fca5a5' }}
                >
                  <DeleteIcon />
                </IconButton>
                <IconButton
                  onClick={() => setSelectedPhoto(null)}
                  sx={{ color: '#fff' }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              <Grid container>
                {/* Photo */}
                <Grid item xs={12} md={7}>
                  <Box
                    component="img"
                    src={selectedPhoto.url || '/placeholder.jpg'}
                    alt="Foto"
                    sx={{
                      width: '100%',
                      height: 500,
                      objectFit: 'contain',
                      bgcolor: '#1e1e1e',
                    }}
                  />
                </Grid>

                {/* Comments/Notes Panel */}
                <Grid item xs={12} md={5}>
                  <Box
                    sx={{
                      p: 3,
                      height: '100%',
                      bgcolor: '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          background:
                            'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        }}
                      >
                        <CommentIcon sx={{ color: '#fff', fontSize: 20 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Notas ({(selectedPhoto.comments || []).length})
                      </Typography>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Comments List */}
                    <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
                      {Array.isArray(selectedPhoto.comments) &&
                      selectedPhoto.comments.length > 0 ? (
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5,
                          }}
                        >
                          {selectedPhoto.comments.map(
                            (comment: PhotoComment) => (
                              <Box
                                key={comment.id}
                                sx={{
                                  p: 2,
                                  bgcolor: '#fff',
                                  borderRadius: 2,
                                  border: '1px solid #e2e8f0',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    mb: 1,
                                  }}
                                >
                                  <Avatar
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      fontSize: 12,
                                      background:
                                        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    }}
                                  >
                                    {comment.user?.full_name
                                      ?.charAt(0)
                                      ?.toUpperCase() || 'U'}
                                  </Avatar>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ fontWeight: 600, flexGrow: 1 }}
                                  >
                                    {comment.user?.full_name || 'Usuário'}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {comment.created_at
                                      ? new Date(
                                          comment.created_at
                                        ).toLocaleDateString('pt-BR')
                                      : ''}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      deleteCommentMutation.mutate(comment.id)
                                    }
                                    sx={{
                                      ml: 0.5,
                                      color: '#ef4444',
                                      opacity: 0.5,
                                      '&:hover': { opacity: 1 },
                                    }}
                                  >
                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Box>
                                <Typography
                                  variant="body2"
                                  sx={{ color: '#475569' }}
                                >
                                  {comment.comment}
                                </Typography>
                              </Box>
                            )
                          )}
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            textAlign: 'center',
                            py: 4,
                            bgcolor: '#fff',
                            borderRadius: 2,
                            border: '1px dashed #cbd5e1',
                          }}
                        >
                          <CommentIcon
                            sx={{ fontSize: 40, color: '#cbd5e1' }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                          >
                            Nenhuma nota adicionada
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Add Comment */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Escreva uma nota..."
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        onKeyPress={e =>
                          e.key === 'Enter' && !e.shiftKey && handleAddComment()
                        }
                        multiline
                        maxRows={3}
                        sx={{
                          bgcolor: '#fff',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                      <IconButton
                        onClick={handleAddComment}
                        disabled={
                          !newComment.trim() || addCommentMutation.isPending
                        }
                        sx={{
                          background:
                            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: '#fff',
                          '&:hover': {
                            background:
                              'linear-gradient(135deg, #5a67d8 0%, #6b21a8 100%)',
                          },
                          '&:disabled': {
                            bgcolor: '#e2e8f0',
                            color: '#94a3b8',
                          },
                        }}
                      >
                        <SendIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Add Stage Dialog */}
      <Dialog
        open={addStageOpen}
        onClose={() => setAddStageOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: '#fff',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WorkflowIcon />
            Adicionar Nova Tarefa
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Título da Tarefa"
            value={newStageTitle}
            onChange={e => setNewStageTitle(e.target.value)}
            margin="normal"
            required
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          {/* Priority Selector */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Prioridade</InputLabel>
            <Select
              value={newTaskPriority}
              onChange={e => setNewTaskPriority(e.target.value)}
              label="Prioridade"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="URGENTE">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: '#ef4444',
                    }}
                  />
                  🔴 URGENTE
                </Box>
              </MenuItem>
              <MenuItem value="ALTA">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: '#f97316',
                    }}
                  />
                  🟠 ALTA
                </Box>
              </MenuItem>
              <MenuItem value="MÉDIA">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: '#eab308',
                    }}
                  />
                  🟡 MÉDIA
                </Box>
              </MenuItem>
              <MenuItem value="BAIXA">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: '#22c55e',
                    }}
                  />
                  🟢 BAIXA
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Descrição (opcional)"
            value={newStageDescription}
            onChange={e => setNewStageDescription(e.target.value)}
            margin="normal"
            multiline
            rows={2}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Responsável</InputLabel>
            <Select
              value={newStageResponsible}
              onChange={e => setNewStageResponsible(e.target.value as number)}
              label="Responsável"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">
                <em>Selecione um responsável</em>
              </MenuItem>
              {Array.isArray(users) &&
                users.map((user: any) => (
                  <MenuItem key={user.id} value={user.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                        {user.full_name?.charAt(0) || 'U'}
                      </Avatar>
                      {user.full_name || user.email}
                    </Box>
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setAddStageOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => addStageMutation.mutate()}
            disabled={!newStageTitle.trim() || addStageMutation.isPending}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              },
            }}
          >
            {addStageMutation.isPending ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stage Detail Dialog */}
      <Dialog
        open={stageDetailOpen}
        onClose={() => setStageDetailOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, bgcolor: '#1e293b' },
        }}
      >
        {selectedStage && (
          <>
            <DialogTitle sx={{ bgcolor: '#0f172a', color: '#e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  label={
                    safeStages.findIndex(
                      (s: WorkflowStage) => s.id === selectedStage.id
                    ) + 1
                  }
                  sx={{
                    bgcolor:
                      selectedStage.status === 'completed'
                        ? '#10b981'
                        : selectedStage.status === 'in_progress'
                        ? '#f59e0b'
                        : '#64748b',
                    color: '#fff',
                    fontWeight: 'bold',
                  }}
                />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedStage.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    {selectedStage.status === 'completed'
                      ? '✅ Concluída'
                      : selectedStage.status === 'in_progress'
                      ? '🔄 Em Andamento'
                      : '⏳ Pendente'}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              {/* Status Change Buttons */}
              <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 1 }}>
                Alterar Status:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Button
                  variant={
                    selectedStage.status === 'pending'
                      ? 'contained'
                      : 'outlined'
                  }
                  size="small"
                  onClick={() => {
                    updateStageMutation.mutate({
                      stageId: selectedStage.id,
                      status: 'pending',
                    });
                    setSelectedStage({ ...selectedStage, status: 'pending' });
                  }}
                  sx={{
                    borderRadius: 2,
                    bgcolor:
                      selectedStage.status === 'pending'
                        ? '#64748b'
                        : 'transparent',
                    borderColor: '#64748b',
                    color: '#fff',
                  }}
                >
                  ⏳ Pendente
                </Button>
                <Button
                  variant={
                    selectedStage.status === 'in_progress'
                      ? 'contained'
                      : 'outlined'
                  }
                  size="small"
                  onClick={() => {
                    updateStageMutation.mutate({
                      stageId: selectedStage.id,
                      status: 'in_progress',
                    });
                    setSelectedStage({
                      ...selectedStage,
                      status: 'in_progress',
                    });
                  }}
                  sx={{
                    borderRadius: 2,
                    bgcolor:
                      selectedStage.status === 'in_progress'
                        ? '#f59e0b'
                        : 'transparent',
                    borderColor: '#f59e0b',
                    color: '#fff',
                  }}
                >
                  🔄 Em Andamento
                </Button>
                <Button
                  variant={
                    selectedStage.status === 'completed'
                      ? 'contained'
                      : 'outlined'
                  }
                  size="small"
                  onClick={() => {
                    updateStageMutation.mutate({
                      stageId: selectedStage.id,
                      status: 'completed',
                    });
                    setSelectedStage({ ...selectedStage, status: 'completed' });
                  }}
                  sx={{
                    borderRadius: 2,
                    bgcolor:
                      selectedStage.status === 'completed'
                        ? '#10b981'
                        : 'transparent',
                    borderColor: '#10b981',
                    color: '#fff',
                  }}
                >
                  ✅ Concluída
                </Button>
              </Box>

              {/* Change History */}
              <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 1 }}>
                Última Alteração:
              </Typography>
              <Paper sx={{ p: 2, mb: 3, bgcolor: '#0f172a', borderRadius: 2 }}>
                {(selectedStage as any).status_changed_by_user ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#667eea' }}>
                      {(
                        selectedStage as any
                      ).status_changed_by_user?.full_name?.charAt(0) || '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                        {(selectedStage as any).status_changed_by_user
                          ?.full_name || 'Usuário'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {(selectedStage as any).status_changed_at
                          ? new Date(
                              (selectedStage as any).status_changed_at
                            ).toLocaleString('pt-BR')
                          : 'Data não disponível'}
                      </Typography>
                    </Box>
                  </Box>
                ) : selectedStage.completed_by_user ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#10b981' }}>
                      {(
                        selectedStage.completed_by_user as any
                      )?.full_name?.charAt(0) || '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                        {(selectedStage.completed_by_user as any)?.full_name ||
                          'Usuário'}{' '}
                        (concluiu)
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {selectedStage.completed_at
                          ? new Date(selectedStage.completed_at).toLocaleString(
                              'pt-BR'
                            )
                          : 'Data não disponível'}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Nenhuma alteração registrada
                  </Typography>
                )}
              </Paper>

              {/* Notes */}
              <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 1 }}>
                📝 Notas:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={stageNote}
                onChange={e => setStageNote(e.target.value)}
                placeholder="Adicione uma nota sobre esta etapa..."
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#0f172a',
                    color: '#e2e8f0',
                    '& fieldset': { borderColor: '#334155' },
                    '&:hover fieldset': { borderColor: '#667eea' },
                    '&.Mui-focused fieldset': { borderColor: '#667eea' },
                  },
                }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    updateStageMutation.mutate({
                      stageId: selectedStage.id,
                      notes: stageNote,
                    });
                    setSelectedStage({ ...selectedStage, notes: stageNote });
                  }}
                  disabled={updateStageMutation.isPending}
                  sx={{
                    borderRadius: 2,
                    bgcolor: '#667eea',
                    '&:hover': { bgcolor: '#5a67d8' },
                  }}
                >
                  💾 Salvar Nota
                </Button>
                {stageNote && (
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => {
                      setStageNote('');
                      updateStageMutation.mutate({
                        stageId: selectedStage.id,
                        notes: '',
                      });
                      setSelectedStage({ ...selectedStage, notes: '' });
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    🗑️ Limpar Nota
                  </Button>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: '#0f172a' }}>
              <Button
                onClick={() => setStageDetailOpen(false)}
                sx={{ color: '#94a3b8' }}
              >
                Fechar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default VisitLocationDetail;

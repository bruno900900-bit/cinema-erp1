import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  IconButton,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Close,
  Edit,
  Delete,
  Assignment,
  LocationOn,
  Event,
  Schedule,
  CalendarToday,
  AccessTime,
  Person,
  Tag,
  PriorityHigh,
  Description,
} from '@mui/icons-material';
import { AgendaEvent } from '../../services/agendaService';

interface EventDetailModalProps {
  open: boolean;
  onClose: () => void;
  event: AgendaEvent | null;
  onEdit?: (event: AgendaEvent) => void;
  onDelete?: (event: AgendaEvent) => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({
  open,
  onClose,
  event,
  onEdit,
  onDelete,
}) => {
  if (!event) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <Assignment />;
      case 'location':
        return <LocationOn />;
      case 'task':
        return <Event />;
      case 'visit':
        return <Schedule />;
      default:
        return <CalendarToday />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'project':
        return 'Projeto';
      case 'location':
        return 'Locação';
      case 'task':
        return 'Tarefa';
      case 'visit':
        return 'Visita';
      default:
        return type;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'milestone':
        return 'Marco';
      case 'deadline':
        return 'Prazo';
      case 'rental':
        return 'Aluguel';
      case 'task':
        return 'Tarefa';
      case 'visit':
        return 'Visita';
      default:
        return category;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'Crítica';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      case 'low':
        return 'Baixa';
      default:
        return priority;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {getEventIcon(event.type)}
            <Typography variant="h6">{event.title}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onEdit && (
              <IconButton
                onClick={() => onEdit(event)}
                size="small"
                color="primary"
              >
                <Edit />
              </IconButton>
            )}
            {onDelete && (
              <IconButton
                onClick={() => onDelete(event)}
                size="small"
                color="error"
              >
                <Delete />
              </IconButton>
            )}
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Informações Principais */}
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 2,
                background:
                  'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%)',
                borderLeft: '4px solid #2196F3',
              }}
            >
              <Typography variant="h6" gutterBottom>
                📋 Informações do Evento
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Tag color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      Tipo: <strong>{getTypeLabel(event.type)}</strong>
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <PriorityHigh color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      Prioridade:{' '}
                      <strong>{getPriorityLabel(event.priority)}</strong>
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Description color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      Categoria:{' '}
                      <strong>{getCategoryLabel(event.category)}</strong>
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <CalendarToday color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      Dia Inteiro:{' '}
                      <strong>{event.isAllDay ? 'Sim' : 'Não'}</strong>
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Descrição */}
          {event.description && (
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 2,
                  background:
                    'linear-gradient(135deg, rgba(103, 58, 183, 0.1) 0%, rgba(103, 58, 183, 0.05) 100%)',
                  borderLeft: '4px solid #673AB7',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  📝 Descrição
                </Typography>
                <Typography variant="body2">{event.description}</Typography>
              </Paper>
            </Grid>
          )}

          {/* Datas e Horários */}
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 2,
                background:
                  'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%)',
                borderLeft: '4px solid #FF9800',
              }}
            >
              <Typography variant="h6" gutterBottom>
                🕒 Datas e Horários
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <CalendarToday color="primary" />
                    <Typography variant="body2">
                      <strong>Início:</strong>{' '}
                      {event.isAllDay
                        ? formatDate(event.start)
                        : formatDateTime(event.start)}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <AccessTime color="primary" />
                    <Typography variant="body2">
                      <strong>Fim:</strong>{' '}
                      {event.isAllDay
                        ? formatDate(event.end)
                        : formatDateTime(event.end)}
                    </Typography>
                  </Box>
                </Grid>

                {!event.isAllDay && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime color="primary" />
                      <Typography variant="body2">
                        <strong>Duração:</strong>{' '}
                        {Math.round(
                          (event.end.getTime() - event.start.getTime()) /
                            (1000 * 60 * 60)
                        )}{' '}
                        horas
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>

          {/* Metadados Específicos */}
          {event.metadata && (
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 2,
                  background:
                    'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
                  borderLeft: '4px solid #4CAF50',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  🔗 Detalhes Relacionados
                </Typography>

                {event.metadata.project && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle2"
                      color="primary"
                      gutterBottom
                    >
                      📁 Projeto
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography variant="body2">
                        <strong>Nome:</strong> {event.metadata.project.title}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Cliente:</strong>{' '}
                        {event.metadata.project.client_name}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Status:</strong> {event.metadata.project.status}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Orçamento:</strong> R${' '}
                        {event.metadata.project.budget.toLocaleString('pt-BR')}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {event.metadata.location && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle2"
                      color="primary"
                      gutterBottom
                    >
                      🏢 Locação
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography variant="body2">
                        <strong>Nome:</strong>{' '}
                        {event.metadata.location.location.title}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Taxa Diária:</strong> R${' '}
                        {event.metadata.location.daily_rate.toLocaleString(
                          'pt-BR'
                        )}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Custo Total:</strong> R${' '}
                        {event.metadata.location.total_cost.toLocaleString(
                          'pt-BR'
                        )}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Status:</strong>{' '}
                        {event.metadata.location.status}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {event.metadata.task && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle2"
                      color="primary"
                      gutterBottom
                    >
                      ✅ Tarefa
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography variant="body2">
                        <strong>Nome:</strong> {event.metadata.task.title}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Tipo:</strong> {event.metadata.task.type}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Status:</strong> {event.metadata.task.status}
                      </Typography>
                      {event.metadata.task.notes && (
                        <Typography variant="body2">
                          <strong>Notas:</strong> {event.metadata.task.notes}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}

                {event.metadata.visit && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle2"
                      color="primary"
                      gutterBottom
                    >
                      👥 Visita
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography variant="body2">
                        <strong>Nome:</strong> {event.metadata.visit.title}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Duração:</strong>{' '}
                        {event.metadata.visit.duration} horas
                      </Typography>
                      <Typography variant="body2">
                        <strong>Status:</strong> {event.metadata.visit.status}
                      </Typography>
                      {event.metadata.visit.notes && (
                        <Typography variant="body2">
                          <strong>Notas:</strong> {event.metadata.visit.notes}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>
          )}

          {/* IDs de Referência */}
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 2,
                background:
                  'linear-gradient(135deg, rgba(156, 39, 176, 0.1) 0%, rgba(156, 39, 176, 0.05) 100%)',
                borderLeft: '4px solid #9C27B0',
              }}
            >
              <Typography variant="h6" gutterBottom>
                🔗 Referências
              </Typography>

              <Grid container spacing={2}>
                {event.projectId && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>ID do Projeto:</strong> {event.projectId}
                    </Typography>
                  </Grid>
                )}

                {event.locationId && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>ID da Locação:</strong> {event.locationId}
                    </Typography>
                  </Grid>
                )}

                {event.taskId && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>ID da Tarefa:</strong> {event.taskId}
                    </Typography>
                  </Grid>
                )}

                {event.visitId && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>ID da Visita:</strong> {event.visitId}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Fechar
        </Button>
        {onEdit && (
          <Button
            onClick={() => onEdit(event)}
            variant="contained"
            startIcon={<Edit />}
          >
            Editar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EventDetailModal;

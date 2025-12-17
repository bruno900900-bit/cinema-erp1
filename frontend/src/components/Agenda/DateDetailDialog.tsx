import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
  alpha,
} from '@mui/material';
import {
  Close,
  Add,
  AccessTime,
  Event as EventIcon,
} from '@mui/icons-material';
import { AgendaEvent } from '../../services/agendaEventService';

interface DateDetailDialogProps {
  open: boolean;
  onClose: () => void;
  date: Date | null;
  events: AgendaEvent[];
  onEventClick: (event: AgendaEvent) => void;
  onAddTask: (date: Date) => void;
}

export default function DateDetailDialog({
  open,
  onClose,
  date,
  events,
  onEventClick,
  onAddTask,
}: DateDetailDialogProps) {
  if (!date) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const formatTime = (dateStr: string | Date) => {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
          color: 'white',
          py: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ textTransform: 'capitalize' }}
          >
            {formatDate(date)}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            {events.length} evento{events.length !== 1 ? 's' : ''} agendado
            {events.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'white',
            '&:hover': {
              bgcolor: alpha('#fff', 0.1),
            },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {events.length === 0 ? (
          <Box
            sx={{
              py: 6,
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <EventIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Nenhum evento agendado
            </Typography>
            <Typography variant="body2">
              Clique no botão abaixo para adicionar uma nova tarefa
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {events.map((event, index) => (
              <Card
                key={event.id || index}
                onClick={() => {
                  onEventClick(event);
                  onClose();
                }}
                sx={{
                  cursor: 'pointer',
                  borderLeft: `4px solid ${event.color || '#6366F1'}`,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateX(8px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={600}>
                      {event.title}
                    </Typography>
                    {!event.all_day && event.start_date && (
                      <Chip
                        icon={<AccessTime sx={{ fontSize: 14 }} />}
                        label={formatTime(event.start_date)}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: '0.75rem',
                          bgcolor: alpha(event.color || '#6366F1', 0.1),
                          color: event.color || '#6366F1',
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>

                  {event.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {event.description}
                    </Typography>
                  )}

                  {event.project_id && (
                    <Chip
                      label={`Projeto #${event.project_id}`}
                      size="small"
                      variant="outlined"
                      sx={{ mt: 1, height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<Add />}
          onClick={() => {
            onAddTask(date);
            onClose();
          }}
          sx={{
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            px: 4,
            py: 1.5,
            fontWeight: 700,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1rem',
            '&:hover': {
              background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
            },
          }}
        >
          Nova Tarefa
        </Button>
      </DialogActions>
    </Dialog>
  );
}

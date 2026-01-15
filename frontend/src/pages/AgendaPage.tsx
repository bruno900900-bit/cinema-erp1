import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  useTheme,
  alpha,
  Fade,
  Grow,
  Divider,
  Avatar,
  Badge,
  Stack,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Today,
  ViewWeek,
  ViewModule,
  List,
  FilterList,
  Search,
  Add,
  CalendarToday,
  Assignment,
  LocationOn,
  Event,
  NavigateBefore,
  NavigateNext,
  Schedule,
  AccessTime,
  Videocam,
  Build,
  LocalShipping,
  Visibility,
  Close,
} from '@mui/icons-material';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  agendaService,
  AgendaEvent,
  AgendaFilters,
} from '../services/agendaService';
import {
  agendaEventService,
  AgendaEventCreate,
  AgendaEventUpdate,
  EventType,
  EventStatus,
} from '../services/agendaEventService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import EventCreationModal from '../components/Agenda/EventCreationModal';
import EventDetailModal from '../components/Agenda/EventDetailModal';
import DateDetailDialog from '../components/Agenda/DateDetailDialog';
import { projectService } from '../services/projectService';
import { userService } from '../services/userService';
import { tagService } from '../services/tagService';

// ==================== PALETA DE CORES PREMIUM ====================

// Cores principais com alto contraste
const colors = {
  primary: '#6366F1', // Indigo vibrante
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  secondary: '#EC4899', // Rosa vibrante
  success: '#10B981', // Verde esmeralda
  warning: '#F59E0B', // Laranja âmbar
  error: '#EF4444', // Vermelho
  info: '#3B82F6', // Azul
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
};

// Estilo glassmorphism melhorado
const glassStyle = {
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  border: `1px solid ${colors.neutral[200]}`,
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
};

// Gradientes refinados
const gradientPrimary = `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`;
const gradientSuccess = `linear-gradient(135deg, ${colors.success} 0%, #059669 100%)`;
const gradientWarning = `linear-gradient(135deg, ${colors.warning} 0%, #D97706 100%)`;
const gradientInfo = `linear-gradient(135deg, ${colors.info} 0%, #2563EB 100%)`;

// Cores para tipos de eventos de produção (mais vibrantes e distintas)
const productionColors: Record<string, string> = {
  visit_date: '#8B5CF6', // Violeta - Visitação
  technical_visit_date: '#3B82F6', // Azul - Visita Técnica
  filming_start_date: '#10B981', // Verde - Início Gravação
  filming_end_date: '#22C55E', // Verde claro - Fim Gravação
  delivery_date: '#F59E0B', // Âmbar - Entrega
};

const productionLabels: Record<string, string> = {
  visit_date: 'Visitação',
  technical_visit_date: 'Visita Técnica',
  filming_start_date: 'Início Gravação',
  filming_end_date: 'Fim Gravação',
  delivery_date: 'Entrega',
};

const productionIcons: Record<string, React.ReactNode> = {
  visit_date: <Visibility sx={{ fontSize: 16 }} />,
  technical_visit_date: <Build sx={{ fontSize: 16 }} />,
  filming_start_date: <Videocam sx={{ fontSize: 16 }} />,
  filming_end_date: <Videocam sx={{ fontSize: 16 }} />,
  delivery_date: <LocalShipping sx={{ fontSize: 16 }} />,
};

// ==================== COMPONENTE PRINCIPAL ====================
const AgendaPage: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week' | 'day' | 'list'>(
    'month'
  );
  const [filters, setFilters] = useState<AgendaFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);

  // Estados para feedback do usuário
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<AgendaEvent | null>(null);

  // Estados para expansão de data
  const [expandedDate, setExpandedDate] = useState<Date | null>(null);
  const [isDateDetailOpen, setIsDateDetailOpen] = useState(false);

  // ==================== QUERIES ====================
  const { data: agendaEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['agenda', currentDate, viewType, filters],
    queryFn: () => {
      switch (viewType) {
        case 'month':
          return agendaService.getMonthEvents(currentDate);
        case 'week':
          return agendaService.getWeekEvents(currentDate);
        case 'day':
          return agendaService.getTodayEvents();
        case 'list':
          return agendaService.getUpcomingEvents();
        default:
          return agendaService.getMonthEvents(currentDate);
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: productionEvents = [] } = useQuery({
    queryKey: ['production-events', currentDate, viewType],
    queryFn: () => agendaService.getProductionDateEvents(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const events = useMemo(
    () => [...agendaEvents, ...productionEvents],
    [agendaEvents, productionEvents]
  );

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
    enabled: isEventModalOpen,
    staleTime: 5 * 60 * 1000,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
    enabled: isEventModalOpen,
    staleTime: 5 * 60 * 1000,
  });

  const users = (usersData as any)?.users || [];

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagService.getTags(),
    enabled: isEventModalOpen,
    staleTime: 10 * 60 * 1000,
  });

  // ==================== MUTATIONS PARA CRUD ====================
  const createEventMutation = useMutation({
    mutationFn: (eventData: AgendaEventCreate) =>
      agendaEventService.createEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda'] });
      setSnackbar({
        open: true,
        message: 'Evento criado com sucesso!',
        severity: 'success',
      });
      setIsEventModalOpen(false);
    },
    onError: (error: any) => {
      console.error('Erro ao criar evento:', error);
      setSnackbar({
        open: true,
        message: error?.message || 'Erro ao criar evento. Tente novamente.',
        severity: 'error',
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AgendaEventUpdate }) =>
      agendaEventService.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda'] });
      setSnackbar({
        open: true,
        message: 'Evento atualizado com sucesso!',
        severity: 'success',
      });
      setIsDetailModalOpen(false);
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar evento:', error);
      setSnackbar({
        open: true,
        message: error?.message || 'Erro ao atualizar evento. Tente novamente.',
        severity: 'error',
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (eventId: number) => agendaEventService.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda'] });
      setSnackbar({
        open: true,
        message: 'Evento excluído com sucesso!',
        severity: 'success',
      });
      setIsDetailModalOpen(false);
      setDeleteConfirmOpen(false);
      setEventToDelete(null);
    },
    onError: (error: any) => {
      console.error('Erro ao excluir evento:', error);
      setSnackbar({
        open: true,
        message: error?.message || 'Erro ao excluir evento. Tente novamente.',
        severity: 'error',
      });
    },
  });

  // ==================== HANDLERS ====================
  const handleViewTypeChange = (
    newViewType: 'month' | 'week' | 'day' | 'list'
  ) => {
    setViewType(newViewType);
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    switch (viewType) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'prev' ? -1 : 1));
        break;
    }
    if (newDate.getFullYear() <= 2035 && newDate.getFullYear() >= 2020) {
      setCurrentDate(newDate);
    }
  };

  const handleCreateEvent = (date?: Date) => {
    setSelectedDate(date || new Date());
    setIsEventModalOpen(true);
  };

  const handleDateClick = (date: Date) => {
    setExpandedDate(date);
    setIsDateDetailOpen(true);
  };

  const handleEventClick = (event: AgendaEvent) => {
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  };

  // Handler para salvar evento - CONECTADO AO SUPABASE
  const handleSaveEvent = async (eventData: Partial<AgendaEvent>) => {
    try {
      // Mapear tipo do modal para enum válido do PostgreSQL
      const typeMapping: Record<string, EventType> = {
        project: EventType.PROJECT_CREATED,
        location: EventType.LOCATION_RENTAL_START,
        task: EventType.CUSTOM,
        visit: EventType.VISIT_SCHEDULED,
      };

      const mappedEventType =
        typeMapping[eventData.type as string] || EventType.CUSTOM;

      // Mapear dados do formulário para o formato da API
      const apiEventData: AgendaEventCreate = {
        title: eventData.title || 'Novo Evento',
        description: eventData.description,
        event_type: mappedEventType,
        status: EventStatus.SCHEDULED,
        // ✅ CORRIGIDO: usar start_date ao invés de event_date
        start_date: eventData.start
          ? new Date(eventData.start).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        // ✅ CORRIGIDO: usar end_date ao invés de start_time/end_time
        end_date: eventData.end
          ? new Date(eventData.end).toISOString().split('T')[0]
          : undefined,
        // ✅ CORRIGIDO: usar all_day ao invés de is_all_day
        all_day: eventData.isAllDay ?? true,
        project_id: eventData.projectId
          ? parseInt(eventData.projectId)
          : undefined,
        color: eventData.color,
        priority:
          eventData.priority === 'critical'
            ? 4
            : eventData.priority === 'high'
            ? 3
            : eventData.priority === 'medium'
            ? 2
            : 1,
      };

      await createEventMutation.mutateAsync(apiEventData);
    } catch (error) {
      // Erro já tratado no onError da mutation
    }
  };

  // Handler para editar evento - CONECTADO AO SUPABASE
  const handleEditEvent = async (event: AgendaEvent) => {
    if (!event.id) return;

    try {
      const apiEventData: AgendaEventUpdate = {
        title: event.title,
        description: event.description,
        // ✅ CORRIGIDO: usar start_date ao invés de event_date
        start_date: new Date(event.start).toISOString().split('T')[0],
        end_date: event.end
          ? new Date(event.end).toISOString().split('T')[0]
          : undefined,
        all_day: event.isAllDay,
        color: event.color,
      };

      await updateEventMutation.mutateAsync({
        id: parseInt(event.id),
        data: apiEventData,
      });
    } catch (error) {
      // Erro já tratado no onError da mutation
    }
  };

  // Handler para excluir evento - CONECTADO AO SUPABASE
  const handleDeleteEvent = (event: AgendaEvent) => {
    setEventToDelete(event);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete?.id) return;

    try {
      await deleteEventMutation.mutateAsync(parseInt(eventToDelete.id));
    } catch (error) {
      // Erro já tratado no onError da mutation
    }
  };

  // ==================== UTILIDADES ====================
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

  const getViewTitle = () => {
    switch (viewType) {
      case 'month':
        return new Intl.DateTimeFormat('pt-BR', {
          month: 'long',
          year: 'numeric',
        }).format(currentDate);
      case 'week':
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
      case 'day':
        return new Intl.DateTimeFormat('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
        }).format(currentDate);
      default:
        return 'Próximos Eventos';
    }
  };

  // Gerar dias do calendário
  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();

    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      days.push({
        date: currentDate,
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === today.toDateString(),
        isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
      });
    }
    return days;
  };

  // Gerar dias da semana
  const generateWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());

    const days = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      days.push({
        date: currentDate,
        isToday: currentDate.toDateString() === today.toDateString(),
        isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
      });
    }
    return days;
  };

  // Gerar horários do dia
  const generateDayHours = () => {
    const hours = [];
    for (let i = 6; i < 22; i++) {
      hours.push(i);
    }
    return hours;
  };

  // Obter eventos para um dia específico
  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Filtrar eventos
  const filteredEvents = events.filter((event: any) => {
    const title = (event?.title ?? '').toString().toLowerCase();
    const description = (event?.description ?? '').toString().toLowerCase();
    const term = (searchTerm ?? '').toString().toLowerCase();
    return title.includes(term) || description.includes(term);
  });

  // ==================== COMPONENTES DE RENDERIZAÇÃO ====================

  // Renderiza um evento individual
  const renderEventChip = (event: AgendaEvent, compact = false) => {
    const isProduction = (event.type as string) === 'production';
    const bgColor =
      event.color ||
      (isProduction ? productionColors[event.category] : colors.primary);

    return (
      <Tooltip
        key={event.id}
        title={
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {event.title}
            </Typography>
            {event.description && (
              <Typography variant="caption">{event.description}</Typography>
            )}
            <Typography variant="caption" display="block">
              {formatTime(new Date(event.start))}
            </Typography>
          </Box>
        }
        arrow
        placement="top"
      >
        <Box
          onClick={e => {
            e.stopPropagation();
            handleEventClick(event);
          }}
          sx={{
            bgcolor: bgColor,
            color: 'white',
            px: compact ? 0.75 : 1.5,
            py: compact ? 0.5 : 0.75,
            borderRadius: 1.5,
            fontSize: compact ? '0.75rem' : '0.85rem',
            fontWeight: 600,
            letterSpacing: '0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: `0 2px 8px ${alpha(bgColor, 0.35)}`,
            '&:hover': {
              transform: 'translateY(-2px) scale(1.03)',
              boxShadow: `0 6px 16px ${alpha(bgColor, 0.5)}`,
            },
          }}
        >
          {isProduction && productionIcons[event.category]}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {compact ? event.title.substring(0, 15) : event.title}
            {compact && event.title.length > 15 && '...'}
          </span>
        </Box>
      </Tooltip>
    );
  };

  // ==================== VISUALIZAÇÃO MENSAL ====================
  const renderMonthView = () => (
    <Box>
      {/* Cabeçalho dos dias da semana */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 1,
          mb: 2,
        }}
      >
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
          <Box
            key={day}
            sx={{
              p: 1.5,
              textAlign: 'center',
              borderRadius: 2,
              background:
                index === 0 || index === 6
                  ? colors.secondary // Rosa para fim de semana
                  : colors.primary, // Indigo para dias úteis
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: 'white',
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
            >
              {day}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Grade do calendário */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 1,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {generateCalendarDays(currentDate).map((day, i) => {
          const dayEvents = getEventsForDay(day.date);

          return (
            <Grow in={true} key={i} timeout={300 + i * 10}>
              <Box
                onClick={() => handleDateClick(day.date)}
                sx={{
                  minHeight: 130,
                  p: 1.5,
                  borderRadius: 2,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.25s ease',
                  // Fundo com tema escuro
                  background: day.isToday
                    ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                    : day.isCurrentMonth
                    ? day.isWeekend
                      ? alpha(colors.neutral[800], 0.8) // Escuro para fim de semana
                      : colors.neutral[800] // Background escuro para dias úteis
                    : colors.neutral[900], // Mais escuro para fora do mês
                  border: day.isToday
                    ? 'none'
                    : `1px solid ${
                        day.isCurrentMonth
                          ? colors.neutral[700]
                          : colors.neutral[800]
                      }`,
                  boxShadow: day.isToday
                    ? `0 4px 20px ${alpha(colors.primary, 0.4)}`
                    : 'none',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: `0 8px 25px rgba(0, 0, 0, 0.12)`,
                    borderColor: colors.primary,
                    zIndex: 1,
                  },
                }}
              >
                {/* Número do dia */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1.5,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      color: day.isToday
                        ? 'white'
                        : day.isCurrentMonth
                        ? 'white' // Texto branco no tema escuro
                        : colors.neutral[500],
                    }}
                  >
                    {day.date.getDate()}
                  </Typography>
                  {dayEvents.length > 0 && (
                    <Chip
                      label={dayEvents.length}
                      size="small"
                      sx={{
                        height: 24,
                        minWidth: 24,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        // Chip com alto contraste
                        bgcolor: day.isToday ? 'white' : colors.primary,
                        color: day.isToday ? colors.primary : 'white',
                      }}
                    />
                  )}
                </Box>

                {/* Eventos do dia */}
                <Stack spacing={1} sx={{ overflow: 'hidden' }}>
                  {dayEvents
                    .slice(0, 3)
                    .map(event => renderEventChip(event, true))}
                  {dayEvents.length > 3 && (
                    <Box
                      sx={{
                        py: 0.5,
                        px: 1,
                        bgcolor: day.isToday
                          ? 'rgba(255,255,255,0.2)'
                          : alpha(colors.primary, 0.3),
                        borderRadius: 1,
                        textAlign: 'center',
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'white',
                          fontWeight: 700,
                        }}
                      >
                        +{dayEvents.length - 3} mais
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Grow>
          );
        })}
      </Box>
    </Box>
  );

  // ==================== VISUALIZAÇÃO SEMANAL ====================
  const renderWeekView = () => {
    const weekDays = generateWeekDays(currentDate);
    const hours = generateDayHours();

    return (
      <Box sx={{ overflowX: 'auto' }}>
        {/* Cabeçalho com dias */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '80px repeat(7, 1fr)',
            gap: 0.5,
            mb: 1,
            position: 'sticky',
            top: 0,
            zIndex: 10,
            bgcolor: 'background.paper',
            pb: 1,
          }}
        >
          <Box sx={{ p: 1 }} /> {/* Espaço para coluna de horas */}
          {weekDays.map((day, index) => (
            <Box
              key={index}
              sx={{
                p: 2,
                textAlign: 'center',
                borderRadius: 2,
                background: day.isToday
                  ? gradientPrimary
                  : alpha(theme.palette.grey[100], 0.5),
                color: day.isToday ? 'white' : theme.palette.text.primary,
              }}
            >
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(
                  day.date
                )}
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {day.date.getDate()}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Grade horária */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '80px repeat(7, 1fr)',
            gap: 0.5,
          }}
        >
          {hours.map(hour => (
            <React.Fragment key={hour}>
              {/* Coluna de hora */}
              <Box
                sx={{
                  p: 1,
                  textAlign: 'right',
                  color: theme.palette.text.secondary,
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                }}
              >
                <Typography variant="caption" fontWeight={500}>
                  {hour.toString().padStart(2, '0')}:00
                </Typography>
              </Box>

              {/* Células para cada dia */}
              {weekDays.map((day, dayIndex) => {
                const cellEventos = getEventsForDay(day.date).filter(event => {
                  const eventHour = new Date(event.start).getHours();
                  return eventHour === hour;
                });

                return (
                  <Box
                    key={dayIndex}
                    onClick={() => {
                      const eventDate = new Date(day.date);
                      eventDate.setHours(hour, 0, 0, 0);
                      handleCreateEvent(eventDate);
                    }}
                    sx={{
                      minHeight: 60,
                      p: 0.5,
                      borderTop: `1px solid ${alpha(
                        theme.palette.divider,
                        0.3
                      )}`,
                      bgcolor: day.isToday
                        ? alpha(theme.palette.primary.main, 0.03)
                        : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                      },
                    }}
                  >
                    <Stack spacing={0.5}>
                      {cellEventos.map(event => renderEventChip(event, true))}
                    </Stack>
                  </Box>
                );
              })}
            </React.Fragment>
          ))}
        </Box>
      </Box>
    );
  };

  // ==================== VISUALIZAÇÃO DIÁRIA ====================
  const renderDayView = () => {
    const hours = generateDayHours();
    const dayEvents = getEventsForDay(currentDate);

    return (
      <Box>
        {/* Resumo do dia */}
        <Paper
          sx={{
            p: 3,
            mb: 3,
            background: gradientPrimary,
            color: 'white',
            borderRadius: 3,
          }}
        >
          <Typography variant="h4" fontWeight={700}>
            {new Intl.DateTimeFormat('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            }).format(currentDate)}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mt: 1 }}>
            {dayEvents.length} evento{dayEvents.length !== 1 ? 's' : ''}{' '}
            agendado{dayEvents.length !== 1 ? 's' : ''}
          </Typography>
        </Paper>

        {/* Timeline de horários */}
        <Box sx={{ position: 'relative' }}>
          {hours.map(hour => {
            const hourEvents = dayEvents.filter(event => {
              const eventHour = new Date(event.start).getHours();
              return eventHour === hour;
            });

            return (
              <Box
                key={hour}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr',
                  minHeight: 80,
                  borderBottom: `1px solid ${alpha(
                    theme.palette.divider,
                    0.3
                  )}`,
                }}
              >
                {/* Hora */}
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'flex-start',
                    borderRight: `2px solid ${alpha(
                      theme.palette.primary.main,
                      0.3
                    )}`,
                  }}
                >
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    color="text.secondary"
                  >
                    {hour.toString().padStart(2, '0')}:00
                  </Typography>
                </Box>

                {/* Eventos */}
                <Box
                  onClick={() => {
                    const eventDate = new Date(currentDate);
                    eventDate.setHours(hour, 0, 0, 0);
                    handleCreateEvent(eventDate);
                  }}
                  sx={{
                    p: 1,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                >
                  <Stack spacing={1}>
                    {hourEvents.map(event => (
                      <Card
                        key={event.id}
                        onClick={e => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        sx={{
                          borderLeft: `4px solid ${
                            event.color || theme.palette.primary.main
                          }`,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'translateX(8px)',
                            boxShadow: 3,
                          },
                        }}
                      >
                        <CardContent
                          sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}
                        >
                          <Typography variant="subtitle1" fontWeight={600}>
                            {event.title}
                          </Typography>
                          {event.description && (
                            <Typography variant="body2" color="text.secondary">
                              {event.description}
                            </Typography>
                          )}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mt: 1,
                            }}
                          >
                            <AccessTime
                              sx={{ fontSize: 14, color: 'text.secondary' }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatTime(new Date(event.start))}
                              {event.end &&
                                ` - ${formatTime(new Date(event.end))}`}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  // ==================== VISUALIZAÇÃO EM LISTA ====================
  const renderListView = () => {
    // Agrupar eventos por data
    const eventsGroupedByDate = filteredEvents.reduce(
      (acc: Record<string, AgendaEvent[]>, event) => {
        const dateKey = formatDate(new Date(event.start));
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(event);
        return acc;
      },
      {}
    );

    const sortedDates = Object.keys(eventsGroupedByDate).sort((a, b) => {
      const dateA = new Date(a.split('/').reverse().join('-'));
      const dateB = new Date(b.split('/').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    });

    return (
      <Box>
        {sortedDates.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <CalendarToday
              sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary">
              Nenhum evento encontrado
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
              Tente ajustar os filtros ou criar um novo evento
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleCreateEvent()}
              sx={{
                background: gradientPrimary,
                '&:hover': { background: gradientPrimary, opacity: 0.9 },
              }}
            >
              Criar Evento
            </Button>
          </Paper>
        ) : (
          <Stack spacing={3}>
            {sortedDates.map(dateKey => (
              <Box key={dateKey}>
                {/* Data como header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: 2,
                    position: 'sticky',
                    top: 0,
                    bgcolor: 'background.default',
                    py: 1,
                    zIndex: 5,
                  }}
                >
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: 2,
                      background: gradientPrimary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '1.2rem',
                    }}
                  >
                    {dateKey.split('/')[0]}
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {new Intl.DateTimeFormat('pt-BR', {
                        weekday: 'long',
                      }).format(
                        new Date(dateKey.split('/').reverse().join('-'))
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dateKey}
                    </Typography>
                  </Box>
                </Box>

                {/* Eventos do dia */}
                <Grid container spacing={2}>
                  {eventsGroupedByDate[dateKey].map(event => (
                    <Grid item xs={12} md={6} lg={4} key={event.id}>
                      <Card
                        onClick={() => handleEventClick(event)}
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 3,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          borderLeft: `4px solid ${
                            event.color || theme.palette.primary.main
                          }`,
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 12px 24px ${alpha(
                              event.color || theme.palette.primary.main,
                              0.2
                            )}`,
                          },
                        }}
                      >
                        <CardContent>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              mb: 1,
                            }}
                          >
                            <Typography variant="subtitle1" fontWeight={600}>
                              {event.title}
                            </Typography>
                            <Chip
                              label={event.priority}
                              size="small"
                              color={
                                event.priority === 'critical'
                                  ? 'error'
                                  : event.priority === 'high'
                                  ? 'warning'
                                  : event.priority === 'medium'
                                  ? 'info'
                                  : 'success'
                              }
                            />
                          </Box>
                          {event.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mb: 2,
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
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <AccessTime
                              sx={{ fontSize: 16, color: 'text.secondary' }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {formatTime(new Date(event.start))}
                            </Typography>
                            <Chip
                              label={event.type}
                              size="small"
                              variant="outlined"
                              sx={{ ml: 'auto' }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    );
  };

  // ==================== LOADING STATE ====================
  if (eventsLoading) {
    return <LoadingSpinner />;
  }

  // ==================== RENDER PRINCIPAL ====================
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header Premium */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 4,
          background: gradientPrimary,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight={700}>
                📅 Agenda
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Gerencie seus eventos e compromissos
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleCreateEvent()}
              sx={{
                bgcolor: 'white',
                color: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: alpha('#ffffff', 0.9),
                },
              }}
            >
              Novo Evento
            </Button>
          </Box>
        </Box>

        {/* Decoração de fundo */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -30,
            right: 100,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }}
        />
      </Paper>

      {/* Controles de Navegação */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: `1px solid ${alpha(colors.primary, 0.2)}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Navegação de Data */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => handleDateChange('prev')}
              sx={{
                bgcolor: colors.primary,
                color: 'white',
                width: 44,
                height: 44,
                '&:hover': {
                  bgcolor: colors.primaryDark,
                },
              }}
            >
              <NavigateBefore />
            </IconButton>

            {/* Seletor de Mês */}
            <FormControl
              size="medium"
              sx={{
                minWidth: 160,
                '& .MuiOutlinedInput-root': {
                  bgcolor: colors.neutral[100],
                  fontWeight: 600,
                  fontSize: '1rem',
                  '&:hover': {
                    bgcolor: colors.neutral[200],
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.neutral[300],
                  },
                },
              }}
            >
              <Select
                value={currentDate.getMonth()}
                onChange={e => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(Number(e.target.value));
                  setCurrentDate(newDate);
                }}
                sx={{ color: colors.neutral[900] }}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <MenuItem key={i} value={i} sx={{ fontWeight: 500 }}>
                    {new Date(0, i).toLocaleString('pt-BR', {
                      month: 'long',
                    })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Seletor de Ano */}
            <FormControl
              size="medium"
              sx={{
                minWidth: 110,
                '& .MuiOutlinedInput-root': {
                  bgcolor: colors.neutral[100],
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  '&:hover': {
                    bgcolor: colors.neutral[200],
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.neutral[300],
                  },
                },
              }}
            >
              <Select
                value={currentDate.getFullYear()}
                onChange={e => {
                  const newDate = new Date(currentDate);
                  newDate.setFullYear(Number(e.target.value));
                  setCurrentDate(newDate);
                }}
                sx={{ color: colors.neutral[900] }}
              >
                {Array.from({ length: 16 }, (_, i) => {
                  const year = 2020 + i;
                  return (
                    <MenuItem key={year} value={year} sx={{ fontWeight: 600 }}>
                      {year}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <IconButton
              onClick={() => handleDateChange('next')}
              sx={{
                bgcolor: colors.primary,
                color: 'white',
                width: 44,
                height: 44,
                '&:hover': {
                  bgcolor: colors.primaryDark,
                },
              }}
            >
              <NavigateNext />
            </IconButton>

            <Button
              variant="contained"
              onClick={() => setCurrentDate(new Date())}
              sx={{
                ml: 1,
                borderRadius: 2,
                bgcolor: colors.success,
                fontWeight: 600,
                px: 3,
                '&:hover': {
                  bgcolor: '#059669',
                },
              }}
            >
              Hoje
            </Button>
          </Box>

          {/* Tipo de Visualização */}
          <Box
            sx={{
              display: 'flex',
              gap: 0.75,
              bgcolor: colors.neutral[100],
              borderRadius: 2,
              p: 0.75,
            }}
          >
            {[
              { type: 'month', icon: <ViewModule />, label: 'Mês' },
              { type: 'week', icon: <ViewWeek />, label: 'Semana' },
              { type: 'day', icon: <Today />, label: 'Dia' },
              { type: 'list', icon: <List />, label: 'Lista' },
            ].map(view => (
              <Tooltip key={view.type} title={view.label}>
                <IconButton
                  onClick={() => handleViewTypeChange(view.type as any)}
                  sx={{
                    borderRadius: 2,
                    width: 44,
                    height: 44,
                    bgcolor:
                      viewType === view.type ? colors.primary : 'transparent',
                    color:
                      viewType === view.type ? 'white' : colors.neutral[600],
                    '&:hover': {
                      bgcolor:
                        viewType === view.type
                          ? colors.primaryDark
                          : colors.neutral[200],
                    },
                  }}
                >
                  {view.icon}
                </IconButton>
              </Tooltip>
            ))}
          </Box>

          {/* Busca */}
          <TextField
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: colors.neutral[500] }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <Close sx={{ fontSize: 18 }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            size="medium"
            sx={{
              minWidth: 280,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: colors.neutral[100],
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.neutral[300],
                },
              },
            }}
          />
        </Box>
      </Paper>

      {/* Título da Visualização */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography
          variant="h5"
          fontWeight={600}
          sx={{ textTransform: 'capitalize' }}
        >
          {getViewTitle()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Conteúdo Principal */}
      <Paper sx={{ p: 3, borderRadius: 3, minHeight: 600, ...glassStyle }}>
        {viewType === 'month' && renderMonthView()}
        {viewType === 'week' && renderWeekView()}
        {viewType === 'day' && renderDayView()}
        {viewType === 'list' && renderListView()}
      </Paper>

      {/* Modais */}
      <EventCreationModal
        open={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        selectedDate={selectedDate || new Date()}
        projects={projects as any}
        users={users}
        tags={tags as any}
      />

      <EventDetailModal
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        event={selectedEvent}
        onEdit={event => handleEditEvent(event)}
        onDelete={event => handleDeleteEvent(event)}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o evento "{eventToDelete?.title}"?
            Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
          <Button
            onClick={confirmDeleteEvent}
            color="error"
            variant="contained"
            disabled={deleteEventMutation.isPending}
          >
            {deleteEventMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
      <DateDetailDialog
        open={isDateDetailOpen}
        onClose={() => setIsDateDetailOpen(false)}
        date={expandedDate}
        events={expandedDate ? getEventsForDay(expandedDate) : []}
        onEventClick={handleEventClick}
        onAddTask={handleCreateEvent}
      />

      {/* Snackbar de Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AgendaPage;

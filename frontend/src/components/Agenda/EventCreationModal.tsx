import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Grid,
  Chip,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Close,
  Assignment,
  LocationOn,
  Event,
  Schedule,
  CalendarToday,
  AccessTime,
} from '@mui/icons-material';
import { AgendaEvent } from '../../services/agendaService';
import { Project, ProjectStatus, User, Tag } from '../../types/user';
import { UserList } from '../../services/userService';

interface EventCreationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (event: Partial<AgendaEvent>) => void;
  selectedDate?: Date;
  projects?: Project[];
  users?: UserList[];
  tags?: Tag[];
}

const EventCreationModal: React.FC<EventCreationModalProps> = ({
  open,
  onClose,
  onSave,
  selectedDate = new Date(),
  projects = [],
  users = [],
  tags = [],
}) => {
  const [eventType, setEventType] = useState<
    'project' | 'location' | 'task' | 'visit'
  >('project');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(selectedDate);
  const [endDate, setEndDate] = useState(selectedDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [priority, setPriority] = useState<
    'low' | 'medium' | 'high' | 'critical'
  >('medium');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setStartDate(selectedDate);
      setEndDate(selectedDate);
    }
  }, [open, selectedDate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }

    if (startDate > endDate) {
      newErrors.endDate = 'Data de fim deve ser posterior à data de início';
    }

    if (!isAllDay && startTime >= endTime) {
      newErrors.endTime = 'Hora de fim deve ser posterior à hora de início';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    if (!isAllDay) {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      startDateTime.setHours(startHour, startMinute, 0, 0);
      endDateTime.setHours(endHour, endMinute, 0, 0);
    }

    const newEvent: Partial<AgendaEvent> = {
      title: title.trim(),
      description: description.trim() || undefined,
      start: startDateTime,
      end: endDateTime,
      type: eventType,
      category: getCategoryForType(eventType),
      priority,
      isAllDay,
      projectId: selectedProject || undefined,
      locationId: selectedLocation ? parseInt(selectedLocation) : undefined,
      userId: selectedUser || undefined,
    };

    onSave(newEvent);
    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setStartDate(selectedDate);
    setEndDate(selectedDate);
    setStartTime('09:00');
    setEndTime('10:00');
    setIsAllDay(false);
    setPriority('medium');
    setSelectedProject('');
    setSelectedLocation('');
    setSelectedUser('');
    setSelectedTags([]);
    setErrors({});
    onClose();
  };

  const getCategoryForType = (type: string) => {
    switch (type) {
      case 'project':
        return 'milestone';
      case 'location':
        return 'rental';
      case 'task':
        return 'task';
      case 'visit':
        return 'visit';
      default:
        return 'task';
    }
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6">📅 Criar Novo Evento</Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Tipo de Evento */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Evento</InputLabel>
              <Select
                value={eventType}
                onChange={e => setEventType(e.target.value as any)}
                label="Tipo de Evento"
              >
                <MenuItem value="project">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assignment />
                    Projeto
                  </Box>
                </MenuItem>
                <MenuItem value="location">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn />
                    Locação
                  </Box>
                </MenuItem>
                <MenuItem value="task">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Event />
                    Tarefa
                  </Box>
                </MenuItem>
                <MenuItem value="visit">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule />
                    Visita
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Prioridade */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Prioridade</InputLabel>
              <Select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                label="Prioridade"
              >
                <MenuItem value="low">
                  <Chip label="Baixa" color="success" size="small" />
                </MenuItem>
                <MenuItem value="medium">
                  <Chip label="Média" color="info" size="small" />
                </MenuItem>
                <MenuItem value="high">
                  <Chip label="Alta" color="warning" size="small" />
                </MenuItem>
                <MenuItem value="critical">
                  <Chip label="Crítica" color="error" size="small" />
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Título */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Título do Evento"
              value={title}
              onChange={e => setTitle(e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              placeholder={`Ex: ${
                eventType === 'project'
                  ? 'Novo Projeto de Filmagem'
                  : eventType === 'location'
                  ? 'Aluguel de Estúdio'
                  : eventType === 'task'
                  ? 'Preparar Equipamentos'
                  : 'Visita Técnica'
              }`}
            />
          </Grid>

          {/* Descrição */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descrição"
              value={description}
              onChange={e => setDescription(e.target.value)}
              multiline
              rows={3}
              placeholder="Descreva os detalhes do evento..."
            />
          </Grid>

          {/* Datas */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Data de Início"
              type="date"
              value={startDate.toISOString().split('T')[0]}
              onChange={e => setStartDate(new Date(e.target.value))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Data de Fim"
              type="date"
              value={endDate.toISOString().split('T')[0]}
              onChange={e => setEndDate(new Date(e.target.value))}
              error={!!errors.endDate}
              helperText={errors.endDate}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Horários (se não for dia inteiro) */}
          {!isAllDay && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Hora de Início"
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Hora de Fim"
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  error={!!errors.endTime}
                  helperText={errors.endTime}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}

          {/* Dia Inteiro */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type="checkbox"
                id="allDay"
                checked={isAllDay}
                onChange={e => setIsAllDay(e.target.checked)}
              />
              <label htmlFor="allDay">
                <Typography variant="body2">Evento de dia inteiro</Typography>
              </label>
            </Box>
          </Grid>

          {/* Campos específicos por tipo */}
          {eventType === 'project' && (
            <>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Projeto Relacionado</InputLabel>
                  <Select
                    value={selectedProject}
                    onChange={e => setSelectedProject(e.target.value)}
                    label="Projeto Relacionado"
                  >
                    <MenuItem value="">Nenhum</MenuItem>
                    {projects.map(project => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Responsável</InputLabel>
                  <Select
                    value={selectedUser}
                    onChange={e => setSelectedUser(e.target.value)}
                    label="Responsável"
                  >
                    <MenuItem value="">Nenhum</MenuItem>
                    {users.map(user => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          {eventType === 'location' && (
            <>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Localização</InputLabel>
                  <Select
                    value={selectedLocation}
                    onChange={e => setSelectedLocation(e.target.value)}
                    label="Localização"
                  >
                    <MenuItem value="">Selecionar localização</MenuItem>
                    {/* Aqui você pode adicionar as localizações disponíveis */}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Responsável</InputLabel>
                  <Select
                    value={selectedUser}
                    onChange={e => setSelectedUser(e.target.value)}
                    label="Responsável"
                  >
                    <MenuItem value="">Nenhum</MenuItem>
                    {users.map(user => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          {eventType === 'task' && (
            <>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Projeto</InputLabel>
                  <Select
                    value={selectedProject}
                    onChange={e => setSelectedProject(e.target.value)}
                    label="Projeto"
                  >
                    <MenuItem value="">Nenhum</MenuItem>
                    {projects.map(project => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Responsável</InputLabel>
                  <Select
                    value={selectedUser}
                    onChange={e => setSelectedUser(e.target.value)}
                    label="Responsável"
                  >
                    <MenuItem value="">Nenhum</MenuItem>
                    {users.map(user => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          {eventType === 'visit' && (
            <>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Localização</InputLabel>
                  <Select
                    value={selectedLocation}
                    onChange={e => setSelectedLocation(e.target.value)}
                    label="Localização"
                  >
                    <MenuItem value="">Selecionar localização</MenuItem>
                    {/* Aqui você pode adicionar as localizações disponíveis */}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Visitante</InputLabel>
                  <Select
                    value={selectedUser}
                    onChange={e => setSelectedUser(e.target.value)}
                    label="Visitante"
                  >
                    <MenuItem value="">Nenhum</MenuItem>
                    {users.map(user => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          {/* Tags */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Tags</InputLabel>
              <Select
                multiple
                value={selectedTags}
                onChange={e => setSelectedTags(e.target.value as string[])}
                label="Tags"
                renderValue={selected => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map(value => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {tags.map(tag => (
                  <MenuItem key={tag.id} value={tag.name}>
                    {tag.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<CalendarToday />}
        >
          Criar Evento
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventCreationModal;

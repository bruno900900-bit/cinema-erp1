import React, { useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
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
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, Visibility } from '@mui/icons-material';
import { Visit, VisitStatus, Location, User } from '@/types/user';

interface VisitCalendarProps {
  visits: Visit[];
  locations: Location[];
  users: User[];
  onVisitCreate: (visit: Partial<Visit>) => void;
  onVisitUpdate: (id: string, visit: Partial<Visit>) => void;
  onVisitDelete: (id: string) => void;
}

const VisitCalendar: React.FC<VisitCalendarProps> = ({
  visits,
  locations,
  users,
  onVisitCreate,
  onVisitUpdate,
  onVisitDelete,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Visit>>({
    title: '',
    description: '',
    locationId: '',
    userId: '',
    scheduledDate: new Date(),
    duration: 60,
    status: VisitStatus.SCHEDULED,
  });

  const handleDateClick = useCallback((arg: any) => {
    setSelectedDate(arg.date);
    setFormData(prev => ({ ...prev, scheduledDate: arg.date }));
    setIsCreateDialogOpen(true);
  }, []);

  const handleEventClick = useCallback((arg: any) => {
    const visit = visits.find(v => v.id === arg.event.id);
    if (visit) {
      setSelectedVisit(visit);
      setIsViewDialogOpen(true);
    }
  }, [visits]);

  const handleEventDrop = useCallback((arg: any) => {
    const visit = visits.find(v => v.id === arg.event.id);
    if (visit) {
      onVisitUpdate(visit.id, {
        scheduledDate: arg.event.start,
        endDate: arg.event.end,
      });
    }
  }, [visits, onVisitUpdate]);

  const handleCreateVisit = () => {
    if (formData.title && formData.locationId && formData.userId) {
      onVisitCreate(formData);
      setIsCreateDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        locationId: '',
        userId: '',
        scheduledDate: new Date(),
        duration: 60,
        status: VisitStatus.SCHEDULED,
      });
    }
  };

  const handleEditVisit = () => {
    if (selectedVisit && formData.title && formData.locationId && formData.userId) {
      onVisitUpdate(selectedVisit.id, formData);
      setIsEditDialogOpen(false);
      setSelectedVisit(null);
    }
  };

  const handleDeleteVisit = () => {
    if (selectedVisit) {
      onVisitDelete(selectedVisit.id);
      setIsViewDialogOpen(false);
      setSelectedVisit(null);
    }
  };

  const getStatusColor = (status: VisitStatus) => {
    switch (status) {
      case VisitStatus.SCHEDULED:
        return '#1976d2';
      case VisitStatus.IN_PROGRESS:
        return '#ed6c02';
      case VisitStatus.COMPLETED:
        return '#2e7d32';
      case VisitStatus.CANCELLED:
        return '#d32f2f';
      default:
        return '#757575';
    }
  };

  const events = visits.map(visit => ({
    id: visit.id,
    title: visit.title,
    start: visit.scheduledDate,
    end: visit.endDate || new Date(visit.scheduledDate.getTime() + visit.duration * 60000),
    backgroundColor: getStatusColor(visit.status),
    borderColor: getStatusColor(visit.status),
    extendedProps: {
      status: visit.status,
      location: locations.find(l => l.id === visit.locationId)?.title,
      user: users.find(u => u.id === visit.userId)?.name,
    },
  }));

  return (
    <Box sx={{ height: '600px' }}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        initialView="dayGridMonth"
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        locale={ptBrLocale}
        height="100%"
        eventContent={(arg) => (
          <Box sx={{ p: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'white' }}>
              {arg.event.title}
            </Typography>
            <Typography variant="caption" sx={{ color: 'white', display: 'block' }}>
              {arg.event.extendedProps.location}
            </Typography>
          </Box>
        )}
      />

      {/* Dialog para criar visita */}
      <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agendar Nova Visita</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Título da Visita"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Descrição"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={3}
            />
            <FormControl fullWidth required>
              <InputLabel>Local</InputLabel>
              <Select
                value={formData.locationId}
                onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                label="Local"
              >
                {locations.map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Responsável</InputLabel>
              <Select
                value={formData.userId}
                onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                label="Responsável"
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Duração (minutos)"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleCreateVisit} variant="contained">
            Agendar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para visualizar visita */}
      <Dialog open={isViewDialogOpen} onClose={() => setIsViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Detalhes da Visita
            <Box>
              <Tooltip title="Editar">
                <IconButton
                  onClick={() => {
                    setFormData(selectedVisit || {});
                    setIsViewDialogOpen(false);
                    setIsEditDialogOpen(true);
                  }}
                  size="small"
                >
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip title="Excluir">
                <IconButton onClick={handleDeleteVisit} size="small" color="error">
                  <Delete />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedVisit && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Typography variant="h6">{selectedVisit.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedVisit.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={selectedVisit.status}
                  color={selectedVisit.status === VisitStatus.COMPLETED ? 'success' : 'primary'}
                  size="small"
                />
                <Chip
                  label={`${selectedVisit.duration} min`}
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Typography variant="body2">
                <strong>Local:</strong> {locations.find(l => l.id === selectedVisit.locationId)?.title}
              </Typography>
              <Typography variant="body2">
                <strong>Responsável:</strong> {users.find(u => u.id === selectedVisit.userId)?.name}
              </Typography>
              <Typography variant="body2">
                <strong>Data:</strong> {selectedVisit.scheduledDate.toLocaleDateString('pt-BR')}
              </Typography>
              <Typography variant="body2">
                <strong>Hora:</strong> {selectedVisit.scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsViewDialogOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para editar visita */}
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Visita</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Título da Visita"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Descrição"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={3}
            />
            <FormControl fullWidth required>
              <InputLabel>Local</InputLabel>
              <Select
                value={formData.locationId}
                onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                label="Local"
              >
                {locations.map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Responsável</InputLabel>
              <Select
                value={formData.userId}
                onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                label="Responsável"
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Duração (minutos)"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as VisitStatus }))}
                label="Status"
              >
                {Object.values(VisitStatus).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleEditVisit} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VisitCalendar;

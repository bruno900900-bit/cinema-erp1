import { apiService } from './api';

export interface AgendaEvent {
  id: number;
  title: string;
  description?: string;
  event_type: EventType;
  status: EventStatus;
  event_date: string;
  start_time?: string;
  end_time?: string;
  is_all_day: boolean;
  project_id?: number;
  location_id?: number;
  project_location_id?: number;
  visit_id?: number;
  contract_id?: number;
  metadata_json?: Record<string, any>;
  color?: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface AgendaEventCreate {
  title: string;
  description?: string;
  event_type: EventType;
  status?: EventStatus;
  event_date: string;
  start_time?: string;
  end_time?: string;
  is_all_day?: boolean;
  project_id?: number;
  location_id?: number;
  project_location_id?: number;
  visit_id?: number;
  contract_id?: number;
  metadata_json?: Record<string, any>;
  color?: string;
  priority?: number;
}

export interface AgendaEventUpdate {
  title?: string;
  description?: string;
  event_type?: EventType;
  status?: EventStatus;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  is_all_day?: boolean;
  project_id?: number;
  location_id?: number;
  project_location_id?: number;
  visit_id?: number;
  contract_id?: number;
  metadata_json?: Record<string, any>;
  color?: string;
  priority?: number;
}

export interface AgendaEventFilter {
  start_date?: string;
  end_date?: string;
  event_type?: EventType;
  status?: EventStatus;
  project_id?: number;
  location_id?: number;
  priority?: number;
}

export interface AgendaEventListResponse {
  events: AgendaEvent[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export enum EventType {
  PROJECT_CREATED = 'project_created',
  PROJECT_START = 'project_start',
  PROJECT_END = 'project_end',
  LOCATION_RENTAL_START = 'location_rental_start',
  LOCATION_RENTAL_END = 'location_rental_end',
  LOCATION_RENTAL_FULL = 'location_rental_full',
  VISIT_SCHEDULED = 'visit_scheduled',
  CONTRACT_SIGNED = 'contract_signed',
  PAYMENT_DUE = 'payment_due',
  CUSTOM = 'custom',
}

export enum EventStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
}

class AgendaEventService {
  async getEvents(
    filters?: AgendaEventFilter
  ): Promise<AgendaEventListResponse> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiService.get<AgendaEventListResponse>(
        `/agenda-events?${params.toString()}`
      );
      return response;
    } catch (error) {
      console.error('Erro ao buscar eventos da agenda:', error);
      throw error;
    }
  }

  async getEventsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<AgendaEvent[]> {
    try {
      const response = await apiService.get<AgendaEvent[]>(
        `/agenda-events/date-range?start_date=${startDate}&end_date=${endDate}`
      );
      return response;
    } catch (error) {
      console.error('Erro ao buscar eventos por período:', error);
      throw error;
    }
  }

  async getUpcomingEvents(days: number = 7): Promise<AgendaEvent[]> {
    try {
      const response = await apiService.get<AgendaEvent[]>(
        `/agenda-events/upcoming?days=${days}`
      );
      return response;
    } catch (error) {
      console.error('Erro ao buscar eventos próximos:', error);
      throw error;
    }
  }

  async getEventsByType(eventType: EventType): Promise<AgendaEvent[]> {
    try {
      const response = await apiService.get<AgendaEvent[]>(
        `/agenda-events/by-type/${eventType}`
      );
      return response;
    } catch (error) {
      console.error('Erro ao buscar eventos por tipo:', error);
      throw error;
    }
  }

  async getEvent(eventId: number): Promise<AgendaEvent> {
    try {
      const response = await apiService.get<AgendaEvent>(
        `/agenda-events/${eventId}`
      );
      return response;
    } catch (error) {
      console.error('Erro ao buscar evento:', error);
      throw error;
    }
  }

  async createEvent(eventData: AgendaEventCreate): Promise<AgendaEvent> {
    try {
      const response = await apiService.post<AgendaEvent>(
        '/agenda-events',
        eventData
      );
      return response;
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    }
  }

  async updateEvent(
    eventId: number,
    eventData: AgendaEventUpdate
  ): Promise<AgendaEvent> {
    try {
      const response = await apiService.put<AgendaEvent>(
        `/agenda-events/${eventId}`,
        eventData
      );
      return response;
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: number): Promise<void> {
    try {
      await apiService.delete(`/agenda-events/${eventId}`);
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      throw error;
    }
  }

  async generateEventsFromProjectLocation(
    projectLocationId: number
  ): Promise<{ message: string; events: AgendaEvent[] }> {
    try {
      const response = await apiService.post<{
        message: string;
        events: AgendaEvent[];
      }>(`/agenda-events/generate-from-project-location/${projectLocationId}`);
      return response;
    } catch (error) {
      console.error('Erro ao gerar eventos da locação:', error);
      throw error;
    }
  }

  async generateEventsFromProject(
    projectId: number
  ): Promise<{ message: string; events: AgendaEvent[] }> {
    try {
      const response = await apiService.post<{
        message: string;
        events: AgendaEvent[];
      }>(`/agenda-events/generate-from-project/${projectId}`);
      return response;
    } catch (error) {
      console.error('Erro ao gerar eventos do projeto:', error);
      throw error;
    }
  }

  // Métodos auxiliares para formatação
  getEventTypeLabel(eventType: EventType): string {
    const labels: Record<EventType, string> = {
      [EventType.PROJECT_CREATED]: 'Projeto Criado',
      [EventType.PROJECT_START]: 'Início do Projeto',
      [EventType.PROJECT_END]: 'Fim do Projeto',
      [EventType.LOCATION_RENTAL_START]: 'Início da Locação',
      [EventType.LOCATION_RENTAL_END]: 'Fim da Locação',
      [EventType.LOCATION_RENTAL_FULL]: 'Período da Locação',
      [EventType.VISIT_SCHEDULED]: 'Visita Agendada',
      [EventType.CONTRACT_SIGNED]: 'Contrato Assinado',
      [EventType.PAYMENT_DUE]: 'Pagamento Vencido',
      [EventType.CUSTOM]: 'Evento Personalizado',
    };
    return labels[eventType] || eventType;
  }

  getEventStatusLabel(status: EventStatus): string {
    const labels: Record<EventStatus, string> = {
      [EventStatus.SCHEDULED]: 'Agendado',
      [EventStatus.IN_PROGRESS]: 'Em Andamento',
      [EventStatus.COMPLETED]: 'Concluído',
      [EventStatus.CANCELLED]: 'Cancelado',
      [EventStatus.POSTPONED]: 'Adiado',
    };
    return labels[status] || status;
  }

  getEventTypeColor(eventType: EventType): string {
    const colors: Record<EventType, string> = {
      [EventType.PROJECT_CREATED]: '#9C27B0',
      [EventType.PROJECT_START]: '#4CAF50',
      [EventType.PROJECT_END]: '#F44336',
      [EventType.LOCATION_RENTAL_START]: '#4CAF50',
      [EventType.LOCATION_RENTAL_END]: '#FF9800',
      [EventType.LOCATION_RENTAL_FULL]: '#2196F3',
      [EventType.VISIT_SCHEDULED]: '#FF5722',
      [EventType.CONTRACT_SIGNED]: '#795548',
      [EventType.PAYMENT_DUE]: '#E91E63',
      [EventType.CUSTOM]: '#607D8B',
    };
    return colors[eventType] || '#607D8B';
  }
}

export const agendaEventService = new AgendaEventService();

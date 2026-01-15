import {
  agendaEventService,
  AgendaEvent as ApiAgendaEvent,
  AgendaEventFilter,
} from './agendaEventService';
import { projectLocationService } from './projectLocationService';

// Cores para eventos de produção
export const PRODUCTION_EVENT_COLORS = {
  visit: '#9C27B0', // Roxo - Visitação
  technical_visit: '#2196F3', // Azul - Visita Técnica
  filming: '#4CAF50', // Verde - Gravação
  delivery: '#FF9800', // Laranja - Entrega
} as const;

export type ProductionEventType =
  | 'visit'
  | 'technical_visit'
  | 'filming'
  | 'delivery';

export interface AgendaEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  type: 'project' | 'task' | 'location';
  category: 'deadline' | 'milestone' | 'rental' | 'task';
  color: string;
  projectId?: string;
  locationId?: number;
  taskId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  isAllDay: boolean;
  metadata?: Record<string, unknown>;
}

export interface AgendaFilters {
  startDate?: Date | string | number | null;
  endDate?: Date | string | number | null;
  types?: string[];
  categories?: string[];
  projects?: string[];
  locations?: number[];
  priority?: string[];
}

export interface AgendaView {
  type: 'month' | 'week' | 'day' | 'list';
  startDate: Date;
  endDate: Date;
}

class AgendaService {
  private eventsCache = new Map<string, AgendaEvent[]>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 60 * 1000; // 1 minuto

  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private normalizeDateInput(
    input: AgendaFilters['startDate']
  ): Date | undefined {
    if (input === undefined || input === null) return undefined;

    if (input instanceof Date) {
      return isNaN(input.getTime()) ? undefined : input;
    }

    if (typeof input === 'number') {
      const parsedNumber = new Date(input);
      return isNaN(parsedNumber.getTime()) ? undefined : parsedNumber;
    }

    if (typeof input === 'string') {
      const trimmed = input.trim();
      if (!trimmed) return undefined;
      const parsedString = new Date(trimmed);
      return isNaN(parsedString.getTime()) ? undefined : parsedString;
    }

    if (typeof input === 'object') {
      const candidate = input as any;

      if (typeof candidate.toDate === 'function') {
        const fromToDate = candidate.toDate();
        if (fromToDate instanceof Date && !isNaN(fromToDate.getTime())) {
          return fromToDate;
        }
      }

      if (typeof candidate.toISOString === 'function') {
        try {
          const iso = candidate.toISOString();
          if (typeof iso === 'string') {
            const parsedIso = new Date(iso);
            if (!isNaN(parsedIso.getTime())) return parsedIso;
          }
        } catch (error) {
          console.warn(
            'AgendaService.normalizeDateInput: falha ao interpretar toISOString()',
            candidate,
            error
          );
        }
      }

      if (typeof candidate.valueOf === 'function') {
        const value = candidate.valueOf();
        if (typeof value === 'number') {
          const fromNumber = new Date(value);
          if (!isNaN(fromNumber.getTime())) return fromNumber;
        }
        if (typeof value === 'string') {
          const fromString = new Date(value);
          if (!isNaN(fromString.getTime())) return fromString;
        }
      }
    }

    console.warn(
      'AgendaService.normalizeDateInput: valor de data nao reconhecido, sera ignorado',
      input
    );
    return undefined;
  }

  private toIsoString(input: AgendaFilters['startDate']): string | undefined {
    const date = this.normalizeDateInput(input);
    if (!date) return undefined;

    if (typeof date.toISOString !== 'function') {
      console.warn(
        'AgendaService.toIsoString: objeto sem toISOString()',
        input
      );
      return undefined;
    }

    try {
      // Backend expects date-only format (YYYY-MM-DD), not full ISO datetime
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn(
        'AgendaService.toIsoString: falha ao converter data para ISO',
        input,
        error
      );
      return undefined;
    }
  }

  private mapApiEvent(event: ApiAgendaEvent): AgendaEvent {
    const rawEvent = event as any;
    const startDate = rawEvent.start_date || rawEvent.event_date;
    const endDate = rawEvent.end_date || rawEvent.event_date;

    const rawEventType = rawEvent.event_type;
    const eventType: AgendaEvent['type'] =
      typeof rawEventType === 'string' &&
      ['project', 'task', 'location'].includes(rawEventType)
        ? (rawEventType as AgendaEvent['type'])
        : 'project';

    const rawCategory = rawEvent.category;
    const category: AgendaEvent['category'] =
      typeof rawCategory === 'string' &&
      ['deadline', 'milestone', 'rental', 'task'].includes(rawCategory)
        ? (rawCategory as AgendaEvent['category'])
        : 'milestone';

    const rawPriority = rawEvent.priority;
    let priority: AgendaEvent['priority'] = 'medium';
    if (
      typeof rawPriority === 'string' &&
      ['low', 'medium', 'high', 'critical'].includes(rawPriority)
    ) {
      priority = rawPriority as AgendaEvent['priority'];
    } else if (typeof rawPriority === 'number') {
      const priorityMap: Record<number, AgendaEvent['priority']> = {
        0: 'low',
        1: 'medium',
        2: 'high',
        3: 'critical',
      };
      priority = priorityMap[rawPriority] ?? priority;
    }

    return {
      id: event.id.toString(),
      title: event.title,
      description: event.description || undefined,
      start: startDate ? new Date(startDate) : new Date(),
      end: endDate ? new Date(endDate) : new Date(),
      type: eventType,
      category,
      color: event.color || '#1976d2',
      projectId: event.project_id?.toString(),
      locationId: event.location_id,
      taskId: rawEvent.task_id?.toString(),
      priority,
      isAllDay: event.all_day ?? true,
      metadata: event.metadata_json || rawEvent.metadata,
    };
  }

  // Filtrar eventos por critérios
  private filterEvents(
    events: AgendaEvent[],
    filters: AgendaFilters
  ): AgendaEvent[] {
    const normalizedStart = this.normalizeDateInput(filters.startDate);
    const normalizedEnd = this.normalizeDateInput(filters.endDate);
    return events.filter(event => {
      // Filtro por data
      if (normalizedStart && event.start < normalizedStart) return false;
      if (normalizedEnd && event.end > normalizedEnd) return false;

      // Filtro por tipo
      if (
        filters.types &&
        filters.types.length > 0 &&
        !filters.types.includes(event.type)
      ) {
        return false;
      }

      // Filtro por categoria
      if (
        filters.categories &&
        filters.categories.length > 0 &&
        !filters.categories.includes(event.category)
      ) {
        return false;
      }

      // Filtro por projeto
      if (
        filters.projects &&
        filters.projects.length > 0 &&
        event.projectId &&
        !filters.projects.includes(event.projectId)
      ) {
        return false;
      }

      // Filtro por localização
      if (
        filters.locations &&
        filters.locations.length > 0 &&
        event.locationId &&
        !filters.locations.includes(event.locationId)
      ) {
        return false;
      }

      // Filtro por prioridade
      if (
        filters.priority &&
        filters.priority.length > 0 &&
        !filters.priority.includes(event.priority)
      ) {
        return false;
      }

      return true;
    });
  }

  // Ordenar eventos por data e prioridade
  private sortEvents(events: AgendaEvent[]): AgendaEvent[] {
    return events.sort((a, b) => {
      // Primeiro por data
      const dateComparison = a.start.getTime() - b.start.getTime();
      if (dateComparison !== 0) return dateComparison;

      // Depois por prioridade
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // Obter todos os eventos da agenda
  async getAgendaEvents(filters: AgendaFilters = {}): Promise<AgendaEvent[]> {
    const cacheKey = `agenda_events_${JSON.stringify(filters)}`;

    if (this.isCacheValid(cacheKey)) {
      return this.eventsCache.get(cacheKey) || [];
    }

    try {
      const startIso = this.toIsoString(filters.startDate);
      const endIso = this.toIsoString(filters.endDate);

      let apiEvents: ApiAgendaEvent[] = [];

      if (startIso && endIso) {
        apiEvents = await agendaEventService.getEventsByDateRange(
          startIso,
          endIso
        );
      } else {
        const apiFilters: AgendaEventFilter = {};
        if (startIso) apiFilters.startDate = startIso;
        if (endIso) apiFilters.endDate = endIso;
        if (filters.types && filters.types.length > 0)
          apiFilters.event_type = filters.types[0] as any;
        if (filters.projects && filters.projects.length > 0)
          apiFilters.project_id = Number(filters.projects[0]);
        if (filters.locations && filters.locations.length > 0)
          apiFilters.location_id = filters.locations[0];

        // Use getFilteredEvents when we have filters, otherwise getEvents
        if (Object.keys(apiFilters).length > 0) {
          apiEvents = await agendaEventService.getFilteredEvents(apiFilters);
        } else {
          apiEvents = await agendaEventService.getEvents();
        }
      }

      const mappedEvents = apiEvents.map(event => this.mapApiEvent(event));
      const filteredEvents = this.filterEvents(mappedEvents, filters);
      const sortedEvents = this.sortEvents(filteredEvents);

      this.eventsCache.set(cacheKey, sortedEvents);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);

      return sortedEvents;
    } catch (error) {
      console.error('Erro ao buscar eventos da agenda:', error);
      return [];
    }
  }

  // Obter eventos por período
  async getEventsByPeriod(
    startDate: Date,
    endDate: Date,
    filters: AgendaFilters = {}
  ): Promise<AgendaEvent[]> {
    const periodFilters = {
      ...filters,
      startDate,
      endDate,
    };
    return this.getAgendaEvents(periodFilters);
  }

  // Obter eventos de hoje
  async getTodayEvents(): Promise<AgendaEvent[]> {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59
    );

    return this.getEventsByPeriod(startOfDay, endOfDay);
  }

  // Obter eventos da semana
  async getWeekEvents(date: Date = new Date()): Promise<AgendaEvent[]> {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return this.getEventsByPeriod(startOfWeek, endOfWeek);
  }

  // Obter eventos do mês
  async getMonthEvents(date: Date = new Date()): Promise<AgendaEvent[]> {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    return this.getEventsByPeriod(startOfMonth, endOfMonth);
  }

  // Obter próximos eventos (próximos 7 dias)
  async getUpcomingEvents(): Promise<AgendaEvent[]> {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.getEventsByPeriod(today, nextWeek);
  }

  // Obter eventos por projeto
  async getEventsByProject(projectId: string): Promise<AgendaEvent[]> {
    return this.getAgendaEvents({ projects: [projectId] });
  }

  // Obter eventos por localização
  async getEventsByLocation(locationId: number): Promise<AgendaEvent[]> {
    return this.getAgendaEvents({ locations: [locationId] });
  }

  // Obter estatísticas da agenda
  async getAgendaStats(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByCategory: Record<string, number>;
    eventsByPriority: Record<string, number>;
    upcomingDeadlines: number;
    overdueTasks: number;
  }> {
    const events = await this.getEventsByPeriod(startDate, endDate);

    const stats = {
      totalEvents: events.length,
      eventsByType: {} as Record<string, number>,
      eventsByCategory: {} as Record<string, number>,
      eventsByPriority: {} as Record<string, number>,
      upcomingDeadlines: 0,
      overdueTasks: 0,
    };

    events.forEach(event => {
      // Contar por tipo
      stats.eventsByType[event.type] =
        (stats.eventsByType[event.type] || 0) + 1;

      // Contar por categoria
      stats.eventsByCategory[event.category] =
        (stats.eventsByCategory[event.category] || 0) + 1;

      // Contar por prioridade
      stats.eventsByPriority[event.priority] =
        (stats.eventsByPriority[event.priority] || 0) + 1;

      // Contar deadlines próximos (próximos 3 dias)
      if (event.category === 'deadline') {
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        if (event.start <= threeDaysFromNow && event.start >= new Date()) {
          stats.upcomingDeadlines++;
        }
      }

      // Contar tarefas atrasadas
      if (event.type === 'task' && event.start < new Date()) {
        stats.overdueTasks++;
      }
    });

    return stats;
  }

  // Obter eventos de datas de produção das locações
  async getProductionDateEvents(projectId?: number): Promise<AgendaEvent[]> {
    try {
      // ✅ CORRIGIDO: passar projectId diretamente ao invés de objeto params
      const projectLocations = projectId
        ? await projectLocationService.getProjectLocations(projectId)
        : await projectLocationService.getProjectLocations(0); // Get all if no projectId
      const productionEvents: AgendaEvent[] = [];

      for (const pl of projectLocations) {
        const locationTitle =
          (pl as any).location?.title || `Locação ${pl.location_id}`;
        const projectTitle = (pl as any).project?.title || '';

        // 🟣 Evento de Visitação
        if ((pl as any).visit_date) {
          const visitDate = new Date((pl as any).visit_date);
          productionEvents.push({
            id: `visit_${pl.id}`,
            title: `🟣 Visitação: ${locationTitle}`,
            description: `Primeira visita ao local - ${projectTitle}`,
            start: visitDate,
            end: visitDate,
            type: 'location',
            category: 'milestone',
            color: PRODUCTION_EVENT_COLORS.visit,
            projectId: String((pl as any).project_id),
            locationId: pl.location_id,
            priority: 'medium',
            isAllDay: true,
            metadata: { eventType: 'visit', projectLocationId: pl.id },
          });
        }

        // 🔵 Evento de Visita Técnica
        if ((pl as any).technical_visit_date) {
          const techDate = new Date((pl as any).technical_visit_date);
          productionEvents.push({
            id: `technical_${pl.id}`,
            title: `🔵 Visita Técnica: ${locationTitle}`,
            description: `Avaliação técnica do espaço - ${projectTitle}`,
            start: techDate,
            end: techDate,
            type: 'location',
            category: 'milestone',
            color: PRODUCTION_EVENT_COLORS.technical_visit,
            projectId: String((pl as any).project_id),
            locationId: pl.location_id,
            priority: 'high',
            isAllDay: true,
            metadata: {
              eventType: 'technical_visit',
              projectLocationId: pl.id,
            },
          });
        }

        // 🟢 Evento de Gravação
        if ((pl as any).filming_start_date) {
          const filmingStart = new Date((pl as any).filming_start_date);
          const filmingEnd = (pl as any).filming_end_date
            ? new Date((pl as any).filming_end_date)
            : filmingStart;
          productionEvents.push({
            id: `filming_${pl.id}`,
            title: `🟢 Gravação: ${locationTitle}`,
            description: `Período de filmagem - ${projectTitle}`,
            start: filmingStart,
            end: filmingEnd,
            type: 'location',
            category: 'rental',
            color: PRODUCTION_EVENT_COLORS.filming,
            projectId: String((pl as any).project_id),
            locationId: pl.location_id,
            priority: 'critical',
            isAllDay: true,
            metadata: { eventType: 'filming', projectLocationId: pl.id },
          });
        }

        // 🟠 Evento de Entrega
        if ((pl as any).delivery_date) {
          const deliveryDate = new Date((pl as any).delivery_date);
          productionEvents.push({
            id: `delivery_${pl.id}`,
            title: `🟠 Entrega: ${locationTitle}`,
            description: `Devolução do local - ${projectTitle}`,
            start: deliveryDate,
            end: deliveryDate,
            type: 'location',
            category: 'deadline',
            color: PRODUCTION_EVENT_COLORS.delivery,
            projectId: String((pl as any).project_id),
            locationId: pl.location_id,
            priority: 'high',
            isAllDay: true,
            metadata: { eventType: 'delivery', projectLocationId: pl.id },
          });
        }
      }

      return this.sortEvents(productionEvents);
    } catch (error) {
      console.error('Erro ao buscar eventos de produção:', error);
      return [];
    }
  }
}

export const agendaService = new AgendaService();

import { supabase } from '../config/supabaseClient';

// Enums for event types - MUST MATCH PostgreSQL event_type enum
export enum EventType {
  PROJECT_CREATED = 'project_created',
  PROJECT_START = 'project_start',
  PROJECT_END = 'project_end',
  LOCATION_RENTAL_START = 'location_rental_start',
  LOCATION_RENTAL_END = 'location_rental_end',
  LOCATION_RENTAL_FULL = 'location_rental_full',
  VISIT_SCHEDULED = 'visit_scheduled',
  TECHNICAL_VISIT = 'technical_visit',
  FILMING_START = 'filming_start',
  FILMING_END = 'filming_end',
  FILMING_PERIOD = 'filming_period',
  DELIVERY = 'delivery',
  CONTRACT_SIGNED = 'contract_signed',
  PAYMENT_DUE = 'payment_due',
  CUSTOM = 'custom',
}

// Event Status - MUST MATCH PostgreSQL event_status enum
export enum EventStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
}

export interface AgendaEvent {
  id: number;
  title: string;
  description?: string;
  start_date: string; // ✅ Campo REAL do Supabase
  end_date?: string; // ✅ Campo REAL do Supabase
  all_day?: boolean; // ✅ Campo REAL (não is_all_day)
  location_id?: number;
  project_id?: number;
  user_id?: number;
  event_type?: EventType | string;
  status?: EventStatus | string;
  priority?: number;
  color?: string;
  metadata_json?: Record<string, unknown>; // ✅ Adicionado para mapApiEvent
  created_at?: string;
  updated_at?: string;
}

export interface AgendaEventCreate {
  title: string;
  description?: string;
  start_date: string; // ✅ Campo REAL
  end_date?: string; // ✅ Campo REAL
  all_day?: boolean; // ✅ Campo REAL
  event_type: EventType | string; // ✅ Obrigatório
  status?: EventStatus | string;
  priority?: number;
  color?: string;
  location_id?: number;
  project_id?: number;
  user_id?: number;
}

export interface AgendaEventUpdate extends Partial<AgendaEventCreate> {
  status?: EventStatus | string;
}

// Filter interface for querying events
export interface AgendaEventFilter {
  startDate?: string | Date;
  endDate?: string | Date;
  project_id?: number;
  location_id?: number;
  user_id?: number;
  event_type?: EventType | string;
  status?: EventStatus | string;
}

// Agenda events table may not exist yet
const MOCK_EVENTS: AgendaEvent[] = [];

export const agendaEventService = {
  // Method to get filtered events - required by agendaService
  async getFilteredEvents(
    filters: AgendaEventFilter = {}
  ): Promise<AgendaEvent[]> {
    try {
      let query = supabase.from('agenda_events').select('*');

      if (filters.startDate) {
        const start =
          typeof filters.startDate === 'string'
            ? filters.startDate
            : filters.startDate.toISOString().split('T')[0];
        query = query.gte('start_date', start); // ✅ start_date (REAL)
      }

      if (filters.endDate) {
        const end =
          typeof filters.endDate === 'string'
            ? filters.endDate
            : filters.endDate.toISOString().split('T')[0];
        query = query.lte('start_date', end); // ✅ start_date (REAL)
      }

      if (filters.project_id) {
        query = query.eq('project_id', filters.project_id);
      }

      if (filters.location_id) {
        query = query.eq('location_id', filters.location_id);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.event_type) {
        query = query.eq('event_type', filters.event_type);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      query = query.order('start_date', { ascending: true }); // ✅ start_date (REAL)

      const { data, error } = await query;

      if (error) {
        console.error('❌ [AGENDA] Erro ao buscar eventos filtrados:', error);
        return [];
      }

      console.log(
        `✅ [AGENDA] ${data?.length || 0} eventos filtrados carregados`
      );
      return data || [];
    } catch (error) {
      console.error('❌ [AGENDA] Exception em getFilteredEvents:', error);
      return [];
    }
  },

  async getEvents(): Promise<AgendaEvent[]> {
    try {
      console.log('📅 [AGENDA] Buscando todos os eventos...');

      const { data, error } = await supabase
        .from('agenda_events')
        .select('*')
        .order('start_date', { ascending: true }); // ✅ start_date (REAL)

      if (error) {
        console.error('❌ [AGENDA] Erro ao buscar eventos:', error);
        return [];
      }

      console.log(
        `✅ [AGENDA] ${data?.length || 0} eventos carregados do Supabase`
      );
      return data || [];
    } catch (error) {
      console.error('❌ [AGENDA] Exception:', error);
      return [];
    }
  },

  async getEvent(id: number): Promise<AgendaEvent | null> {
    try {
      const { data, error } = await supabase
        .from('agenda_events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      return null;
    }
  },

  async createEvent(event: Partial<AgendaEvent>): Promise<AgendaEvent> {
    const { data, error } = await supabase
      .from('agenda_events')
      .insert([event])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateEvent(
    id: number,
    event: Partial<AgendaEvent>
  ): Promise<AgendaEvent> {
    const { data, error } = await supabase
      .from('agenda_events')
      .update(event)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteEvent(id: number): Promise<void> {
    const { error } = await supabase
      .from('agenda_events')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async getEventsByDateRange(
    startDate: string, // ✅ String ISO (YYYY-MM-DD)
    endDate: string
  ): Promise<AgendaEvent[]> {
    try {
      console.log(
        `📅 [AGENDA] Buscando eventos entre ${startDate} e ${endDate}`
      );

      const { data, error } = await supabase
        .from('agenda_events')
        .select('*')
        .gte('start_date', startDate) // ✅ start_date (REAL)
        .lte('start_date', endDate) // ✅ start_date (REAL)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('❌ [AGENDA] Erro ao buscar por range:', error);
        return [];
      }

      console.log(`✅ [AGENDA] ${data?.length || 0} eventos no período`);
      return data || [];
    } catch (error) {
      console.error('❌ [AGENDA] Exception em getEventsByDateRange:', error);
      return [];
    }
  },

  async getEventsByProject(projectId: number): Promise<AgendaEvent[]> {
    try {
      const { data, error } = await supabase
        .from('agenda_events')
        .select('*')
        .eq('project_id', projectId);

      if (error) return [];
      return data || [];
    } catch (error) {
      return [];
    }
  },

  async getEventsByUser(userId: number): Promise<AgendaEvent[]> {
    try {
      const { data, error } = await supabase
        .from('agenda_events')
        .select('*')
        .eq('user_id', userId);

      if (error) return [];
      return data || [];
    } catch (error) {
      return [];
    }
  },
};

export default agendaEventService;

import { supabase } from '../config/supabaseClient';

export interface Visit {
  id: number;
  location_id: number;
  project_id?: number;
  scheduled_date: string;
  scheduled_time?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  assigned_user_id?: number;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

// Note: visits table may not exist in Supabase yet
// Using mock data until table is created

const MOCK_VISITS: Visit[] = [];

export const visitService = {
  async getVisits(): Promise<Visit[]> {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (error) {
        console.warn('visits table may not exist:', error.message);
        return MOCK_VISITS;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching visits:', error);
      return MOCK_VISITS;
    }
  },

  async getVisit(id: number): Promise<Visit | null> {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      return null;
    }
  },

  async getVisitsByUser(userId: number): Promise<Visit[]> {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('assigned_user_id', userId);

      if (error) return [];
      return data || [];
    } catch (error) {
      return [];
    }
  },

  async createVisit(visit: Partial<Visit>): Promise<Visit> {
    const { data, error } = await supabase
      .from('visits')
      .insert([visit])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateVisit(id: number, visit: Partial<Visit>): Promise<Visit> {
    const { data, error } = await supabase
      .from('visits')
      .update(visit)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteVisit(id: number): Promise<void> {
    const { error } = await supabase.from('visits').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async updateVisitStatus(id: number, status: string): Promise<Visit> {
    return this.updateVisit(id, { status: status as any });
  },

  async getVisitStats(): Promise<any> {
    return { total: 0, scheduled: 0, completed: 0, cancelled: 0 };
  },

  async getVisitsByLocation(locationId: number): Promise<Visit[]> {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('location_id', locationId);

      if (error) return [];
      return data || [];
    } catch (error) {
      return [];
    }
  },

  async getVisitsByProject(projectId: number): Promise<Visit[]> {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('project_id', projectId);

      if (error) return [];
      return data || [];
    } catch (error) {
      return [];
    }
  },

  async getVisitsByDateRange(startDate: Date, endDate: Date): Promise<Visit[]> {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .gte('scheduled_date', startDate.toISOString())
        .lte('scheduled_date', endDate.toISOString());

      if (error) return [];
      return data || [];
    } catch (error) {
      return [];
    }
  },

  async exportVisits(): Promise<Blob> {
    throw new Error('Export não disponível');
  },
};

export default visitService;

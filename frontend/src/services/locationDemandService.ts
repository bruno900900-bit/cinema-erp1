/**
 * Location Demand Service - Supabase Integration
 * Migrated from deprecated Cloud Run API to direct Supabase client
 */

import { supabase } from '../config/supabaseClient';

// ===== Types =====

export type DemandPriority = 'low' | 'medium' | 'high' | 'urgent';
export type DemandStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'on_hold';

export interface LocationDemand {
  id: number;
  project_location_id: number | null;
  visit_location_id: number | null;
  project_id: number;
  title: string;
  description?: string;
  priority: DemandPriority;
  status: DemandStatus;
  category?: string;
  assigned_user_id?: number;
  created_by_user_id?: number;
  due_date?: string;
  completed_at?: string;
  agenda_event_id?: number;
  notes?: string;
  attachments_json?: string[];
  created_at: string;
  updated_at: string;
  // Joined fields from view
  is_overdue?: boolean;
  assigned_user_name?: string;
  assigned_user_email?: string;
  created_by_user_name?: string;
  created_by_user_email?: string;
  location_name?: string;
  project_name?: string;
}

export interface LocationDemandCreate {
  project_location_id?: number;
  visit_location_id?: number;
  project_id: number;
  title: string;
  description?: string;
  priority?: DemandPriority;
  status?: DemandStatus;
  category?: string;
  assigned_user_id?: number;
  created_by_user_id?: number;
  due_date?: string;
  notes?: string;
  attachments_json?: string[];
}

export interface LocationDemandUpdate {
  title?: string;
  description?: string;
  priority?: DemandPriority;
  status?: DemandStatus;
  category?: string;
  assigned_user_id?: number;
  due_date?: string;
  notes?: string;
  attachments_json?: string[];
}

export interface LocationDemandFilter {
  project_id?: number;
  project_location_id?: number;
  visit_location_id?: number;
  status?: DemandStatus;
  priority?: DemandPriority;
  assigned_user_id?: number;
  created_by_user_id?: number;
  category?: string;
  overdue_only?: boolean;
  due_date_from?: string;
  due_date_to?: string;
}

export interface LocationDemandSummary {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
  by_priority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
}

export interface LocationDemandListResponse {
  demands: LocationDemand[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

// ===== Priority and Status Labels =====

export const priorityLabels: Record<DemandPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

export const priorityColors: Record<DemandPriority, string> = {
  low: '#4CAF50', // Green
  medium: '#FFC107', // Yellow
  high: '#FF9800', // Orange
  urgent: '#F44336', // Red
};

export const statusLabels: Record<DemandStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  on_hold: 'Em Espera',
};

export const statusColors: Record<DemandStatus, string> = {
  pending: '#9E9E9E', // Grey
  in_progress: '#2196F3', // Blue
  completed: '#4CAF50', // Green
  cancelled: '#F44336', // Red
  on_hold: '#FF9800', // Orange
};

// ===== Service =====

class LocationDemandService {
  private tableName = 'location_demands';
  private viewName = 'location_demands_with_users';

  /**
   * Create a new demand
   */
  async createDemand(data: LocationDemandCreate): Promise<LocationDemand> {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating demand:', error);
      throw new Error(`Erro ao criar demanda: ${error.message}`);
    }

    return result as LocationDemand;
  }

  /**
   * Get a single demand by ID
   */
  async getDemand(demandId: number): Promise<LocationDemand> {
    const { data, error } = await supabase
      .from(this.viewName)
      .select('*')
      .eq('id', demandId)
      .single();

    if (error) {
      console.error('Error fetching demand:', error);
      throw new Error(`Erro ao buscar demanda: ${error.message}`);
    }

    return data as LocationDemand;
  }

  /**
   * Get demands with filters and pagination
   */
  async getDemands(
    filters?: LocationDemandFilter,
    page: number = 1,
    pageSize: number = 50
  ): Promise<LocationDemandListResponse> {
    const offset = (page - 1) * pageSize;

    let query = supabase.from(this.viewName).select('*', { count: 'exact' });

    // Apply filters
    if (filters) {
      if (filters.project_id) {
        query = query.eq('project_id', filters.project_id);
      }
      if (filters.project_location_id) {
        query = query.eq('project_location_id', filters.project_location_id);
      }
      if (filters.visit_location_id) {
        query = query.eq('visit_location_id', filters.visit_location_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.assigned_user_id) {
        query = query.eq('assigned_user_id', filters.assigned_user_id);
      }
      if (filters.created_by_user_id) {
        query = query.eq('created_by_user_id', filters.created_by_user_id);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.overdue_only) {
        query = query.eq('is_overdue', true);
      }
      if (filters.due_date_from) {
        query = query.gte('due_date', filters.due_date_from);
      }
      if (filters.due_date_to) {
        query = query.lte('due_date', filters.due_date_to);
      }
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching demands:', error);
      throw new Error(`Erro ao buscar demandas: ${error.message}`);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      demands: (data || []) as LocationDemand[],
      total,
      page,
      size: pageSize,
      total_pages: totalPages,
    };
  }

  /**
   * Get all demands for a project
   */
  async getDemandsByProject(projectId: number): Promise<LocationDemand[]> {
    const { data, error } = await supabase
      .from(this.viewName)
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching project demands:', error);
      throw new Error(`Erro ao buscar demandas do projeto: ${error.message}`);
    }

    return (data || []) as LocationDemand[];
  }

  /**
   * Get all demands for a specific location
   */
  async getDemandsByLocation(
    projectLocationId: number
  ): Promise<LocationDemand[]> {
    const { data, error } = await supabase
      .from(this.viewName)
      .select('*')
      .eq('project_location_id', projectLocationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching location demands:', error);
      throw new Error(`Erro ao buscar demandas da locação: ${error.message}`);
    }

    return (data || []) as LocationDemand[];
  }

  /**
   * Get all demands for a specific visit location
   */
  async getDemandsByVisitLocation(
    visitLocationId: number
  ): Promise<LocationDemand[]> {
    const { data, error } = await supabase
      .from(this.viewName)
      .select('*')
      .eq('visit_location_id', visitLocationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching visit location demands:', error);
      throw new Error(
        `Erro ao buscar demandas da locação visitada: ${error.message}`
      );
    }

    return (data || []) as LocationDemand[];
  }

  /**
   * Get summary statistics for demands
   */
  async getSummary(
    projectId?: number,
    projectLocationId?: number
  ): Promise<LocationDemandSummary> {
    let query = supabase
      .from(this.viewName)
      .select('status, priority, is_overdue');

    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    if (projectLocationId) {
      query = query.eq('project_location_id', projectLocationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching demand summary:', error);
      throw new Error(`Erro ao buscar resumo de demandas: ${error.message}`);
    }

    const demands = data || [];

    const summary: LocationDemandSummary = {
      total: demands.length,
      pending: demands.filter(d => d.status === 'pending').length,
      in_progress: demands.filter(d => d.status === 'in_progress').length,
      completed: demands.filter(d => d.status === 'completed').length,
      overdue: demands.filter(d => d.is_overdue).length,
      by_priority: {
        low: demands.filter(d => d.priority === 'low').length,
        medium: demands.filter(d => d.priority === 'medium').length,
        high: demands.filter(d => d.priority === 'high').length,
        urgent: demands.filter(d => d.priority === 'urgent').length,
      },
    };

    return summary;
  }

  /**
   * Update a demand
   */
  async updateDemand(
    demandId: number,
    data: LocationDemandUpdate
  ): Promise<LocationDemand> {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .update(data)
      .eq('id', demandId)
      .select()
      .single();

    if (error) {
      console.error('Error updating demand:', error);
      throw new Error(`Erro ao atualizar demanda: ${error.message}`);
    }

    return result as LocationDemand;
  }

  /**
   * Update only the status of a demand
   */
  async updateStatus(
    demandId: number,
    status: DemandStatus
  ): Promise<{ message: string; demand_id: number }> {
    const updateData: LocationDemandUpdate = { status };

    if (status === 'completed') {
      (updateData as any).completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', demandId);

    if (error) {
      console.error('Error updating demand status:', error);
      throw new Error(`Erro ao atualizar status: ${error.message}`);
    }

    return { message: 'Status atualizado com sucesso', demand_id: demandId };
  }

  /**
   * Delete a demand
   */
  async deleteDemand(demandId: number): Promise<{ message: string }> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', demandId);

    if (error) {
      console.error('Error deleting demand:', error);
      throw new Error(`Erro ao deletar demanda: ${error.message}`);
    }

    return { message: 'Demanda deletada com sucesso' };
  }

  /**
   * Mark demand as completed
   */
  async completeDemand(demandId: number): Promise<LocationDemand> {
    return this.updateDemand(demandId, {
      status: 'completed',
    });
  }

  /**
   * Mark demand as in progress
   */
  async startDemand(demandId: number): Promise<LocationDemand> {
    return this.updateDemand(demandId, { status: 'in_progress' });
  }

  /**
   * Get demands assigned to current user (and optionally created by user)
   */
  async getMyDemands(
    userId: number,
    includeCreated: boolean = false
  ): Promise<LocationDemand[]> {
    let query = supabase.from(this.viewName).select('*');

    if (includeCreated) {
      // Get demands assigned to user OR created by user
      query = query.or(
        `assigned_user_id.eq.${userId},created_by_user_id.eq.${userId}`
      );
    } else {
      // Get only demands assigned to user
      query = query.eq('assigned_user_id', userId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching my demands:', error);
      throw new Error(`Erro ao buscar suas demandas: ${error.message}`);
    }

    return (data || []) as LocationDemand[];
  }

  /**
   * Get all demands assigned to a specific user
   */
  async getDemandsByAssignedUser(userId: number): Promise<LocationDemand[]> {
    const { data, error } = await supabase
      .from(this.viewName)
      .select('*')
      .eq('assigned_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assigned demands:', error);
      throw new Error(`Erro ao buscar demandas atribuídas: ${error.message}`);
    }

    return (data || []) as LocationDemand[];
  }

  /**
   * Get all demands created by a specific user
   */
  async getDemandsByCreator(userId: number): Promise<LocationDemand[]> {
    const { data, error } = await supabase
      .from(this.viewName)
      .select('*')
      .eq('created_by_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching created demands:', error);
      throw new Error(`Erro ao buscar demandas criadas: ${error.message}`);
    }

    return (data || []) as LocationDemand[];
  }
}

export const locationDemandService = new LocationDemandService();

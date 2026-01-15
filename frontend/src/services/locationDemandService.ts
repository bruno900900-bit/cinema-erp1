import { apiService } from './api';

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
  project_location_id: number;
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
  is_overdue?: boolean;
  assigned_user_name?: string;
  created_by_user_name?: string;
  location_name?: string;
}

export interface LocationDemandCreate {
  project_location_id: number;
  project_id: number;
  title: string;
  description?: string;
  priority?: DemandPriority;
  status?: DemandStatus;
  category?: string;
  assigned_user_id?: number;
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
  status?: DemandStatus;
  priority?: DemandPriority;
  assigned_user_id?: number;
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
  private baseUrl = '/location-demands';

  /**
   * Create a new demand
   */
  async createDemand(data: LocationDemandCreate): Promise<LocationDemand> {
    return apiService.post<LocationDemand>(this.baseUrl, data);
  }

  /**
   * Get a single demand by ID
   */
  async getDemand(demandId: number): Promise<LocationDemand> {
    return apiService.get<LocationDemand>(`${this.baseUrl}/${demandId}`);
  }

  /**
   * Get demands with filters and pagination
   */
  async getDemands(
    filters?: LocationDemandFilter,
    page: number = 1,
    pageSize: number = 50
  ): Promise<LocationDemandListResponse> {
    const skip = (page - 1) * pageSize;
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', pageSize.toString());

    if (filters) {
      if (filters.project_id)
        params.append('project_id', filters.project_id.toString());
      if (filters.project_location_id)
        params.append(
          'project_location_id',
          filters.project_location_id.toString()
        );
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.assigned_user_id)
        params.append('assigned_user_id', filters.assigned_user_id.toString());
      if (filters.category) params.append('category', filters.category);
      if (filters.overdue_only) params.append('overdue_only', 'true');
      if (filters.due_date_from)
        params.append('due_date_from', filters.due_date_from);
      if (filters.due_date_to)
        params.append('due_date_to', filters.due_date_to);
    }

    return apiService.get<LocationDemandListResponse>(
      `${this.baseUrl}?${params.toString()}`
    );
  }

  /**
   * Get all demands for a project
   */
  async getDemandsByProject(projectId: number): Promise<LocationDemand[]> {
    return apiService.get<LocationDemand[]>(
      `${this.baseUrl}/by-project/${projectId}`
    );
  }

  /**
   * Get all demands for a specific location
   */
  async getDemandsByLocation(
    projectLocationId: number
  ): Promise<LocationDemand[]> {
    return apiService.get<LocationDemand[]>(
      `${this.baseUrl}/by-location/${projectLocationId}`
    );
  }

  /**
   * Get summary statistics for demands
   */
  async getSummary(
    projectId?: number,
    projectLocationId?: number
  ): Promise<LocationDemandSummary> {
    const params = new URLSearchParams();
    if (projectId) params.append('project_id', projectId.toString());
    if (projectLocationId)
      params.append('project_location_id', projectLocationId.toString());
    return apiService.get<LocationDemandSummary>(
      `${this.baseUrl}/summary?${params.toString()}`
    );
  }

  /**
   * Update a demand
   */
  async updateDemand(
    demandId: number,
    data: LocationDemandUpdate
  ): Promise<LocationDemand> {
    return apiService.put<LocationDemand>(`${this.baseUrl}/${demandId}`, data);
  }

  /**
   * Update only the status of a demand
   */
  async updateStatus(
    demandId: number,
    status: DemandStatus
  ): Promise<{ message: string; demand_id: number }> {
    return apiService.patch<{ message: string; demand_id: number }>(
      `${this.baseUrl}/${demandId}/status?status=${status}`,
      {}
    );
  }

  /**
   * Delete a demand
   */
  async deleteDemand(demandId: number): Promise<{ message: string }> {
    return apiService.delete<{ message: string }>(
      `${this.baseUrl}/${demandId}`
    );
  }

  /**
   * Mark demand as completed
   */
  async completeDemand(demandId: number): Promise<LocationDemand> {
    return this.updateDemand(demandId, { status: 'completed' });
  }

  /**
   * Mark demand as in progress
   */
  async startDemand(demandId: number): Promise<LocationDemand> {
    return this.updateDemand(demandId, { status: 'in_progress' });
  }
}

export const locationDemandService = new LocationDemandService();

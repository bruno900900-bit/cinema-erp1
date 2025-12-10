import { apiService } from './api';
import { ProjectLocation, RentalStatus } from '../types/user';

export interface ProjectLocationCreate {
  project_id: number;
  location_id: number;
  rental_start: string; // YYYY-MM-DD
  rental_end: string; // YYYY-MM-DD
  rental_start_time?: string; // ISO string
  rental_end_time?: string; // ISO string
  daily_rate: number;
  hourly_rate?: number;
  total_cost?: number;
  currency?: string;
  status?: RentalStatus;
  responsible_user_id?: number;
  coordinator_user_id?: number;
  notes?: string;
  special_requirements?: string;
  equipment_needed?: string;
  contract_url?: string;
  attachments_json?: Record<string, any>;
  // Datas de produção
  visit_date?: string;
  technical_visit_date?: string;
  filming_start_date?: string;
  filming_end_date?: string;
  delivery_date?: string;
}

export interface ProjectLocationUpdate {
  rental_start?: string;
  rental_end?: string;
  rental_start_time?: string;
  rental_end_time?: string;
  daily_rate?: number;
  hourly_rate?: number;
  total_cost?: number;
  currency?: string;
  status?: RentalStatus;
  responsible_user_id?: number;
  coordinator_user_id?: number;
  notes?: string;
  special_requirements?: string;
  equipment_needed?: string;
  contract_url?: string;
  attachments_json?: Record<string, any>;
  // Datas de produção
  visit_date?: string;
  technical_visit_date?: string;
  filming_start_date?: string;
  filming_end_date?: string;
  delivery_date?: string;
}

export interface ProjectLocationFilter {
  project_ids?: number[];
  location_ids?: number[];
  status?: RentalStatus[];
  responsible_user_ids?: number[];
  is_overdue?: boolean;
  is_active?: boolean;
  date_from?: string;
  date_to?: string;
  min_cost?: number;
  max_cost?: number;
}

export interface ProjectLocationBulkUpdate {
  location_ids: number[];
  status?: RentalStatus;
  responsible_user_id?: number;
  notes?: string;
}

export interface ProjectLocationCostSummary {
  project_id: number;
  total_locations: number;
  total_cost: number;
  average_daily_cost: number;
  cost_by_status: Record<string, number>;
  cost_by_location: Array<{
    location_id: number;
    location_title: string;
    total_cost: number;
    status: string;
    duration_days: number;
  }>;
  currency: string;
}

export interface ProjectLocationTimeline {
  project_id: number;
  locations: Array<{
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    status: string;
    completion_percentage: number;
    is_overdue: boolean;
  }>;
  milestones: Array<{
    id: number;
    title: string;
    date?: string;
    status: string;
    location_title: string;
    is_critical: boolean;
  }>;
  critical_path: any[];
}

class ProjectLocationService {
  private baseUrl = '/project-locations';

  // Criar nova locação de projeto
  async createProjectLocation(
    locationData: ProjectLocationCreate
  ): Promise<ProjectLocation> {
    try {
      const response = await apiService.post(this.baseUrl, locationData);
      return response as ProjectLocation;
    } catch (error) {
      console.error('Erro ao criar locação de projeto:', error);
      throw error;
    }
  }

  // Buscar locações com filtros
  async getProjectLocations(params?: {
    skip?: number;
    limit?: number;
    project_id?: number;
    location_id?: number;
    status?: string;
    responsible_user_ids?: string;
    is_overdue?: boolean;
    is_active?: boolean;
    date_from?: string;
    date_to?: string;
    min_cost?: number;
    max_cost?: number;
  }): Promise<ProjectLocation[]> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.skip !== undefined)
        queryParams.append('skip', params.skip.toString());
      if (params?.limit !== undefined)
        queryParams.append('limit', params.limit.toString());
      if (params?.project_id)
        queryParams.append('project_id', params.project_id.toString());
      if (params?.location_id)
        queryParams.append('location_id', params.location_id.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.responsible_user_ids)
        queryParams.append('responsible_user_ids', params.responsible_user_ids);
      if (params?.is_overdue !== undefined)
        queryParams.append('is_overdue', params.is_overdue.toString());
      if (params?.is_active !== undefined)
        queryParams.append('is_active', params.is_active.toString());
      if (params?.date_from) queryParams.append('date_from', params.date_from);
      if (params?.date_to) queryParams.append('date_to', params.date_to);
      if (params?.min_cost !== undefined)
        queryParams.append('min_cost', params.min_cost.toString());
      if (params?.max_cost !== undefined)
        queryParams.append('max_cost', params.max_cost.toString());

      const url = `${this.baseUrl}?${queryParams.toString()}`;
      const response = await apiService.get(url);
      return response as ProjectLocation[];
    } catch (error) {
      console.error('Erro ao buscar locações de projeto:', error);
      throw error;
    }
  }

  // Buscar locação específica
  async getProjectLocation(locationId: number): Promise<ProjectLocation> {
    try {
      const response = await apiService.get(`${this.baseUrl}/${locationId}`);
      return response as ProjectLocation;
    } catch (error) {
      console.error('Erro ao buscar locação de projeto:', error);
      throw error;
    }
  }

  // Buscar locações por projeto
  async getProjectLocationsByProject(
    projectId: number
  ): Promise<ProjectLocation[]> {
    try {
      const response = await this.getProjectLocations({
        project_id: projectId,
      });
      return response;
    } catch (error) {
      console.error('Erro ao buscar locações do projeto:', error);
      throw error;
    }
  }

  // Atualizar locação
  async updateProjectLocation(
    locationId: number,
    locationData: ProjectLocationUpdate
  ): Promise<ProjectLocation> {
    try {
      const response = await apiService.put(
        `${this.baseUrl}/${locationId}`,
        locationData
      );
      return response as ProjectLocation;
    } catch (error) {
      console.error('Erro ao atualizar locação de projeto:', error);
      throw error;
    }
  }

  // Excluir locação
  async deleteProjectLocation(locationId: number): Promise<void> {
    try {
      await apiService.delete(`${this.baseUrl}/${locationId}`);
    } catch (error) {
      console.error('Erro ao excluir locação de projeto:', error);
      throw error;
    }
  }

  // Atualização em lote
  async bulkUpdateProjectLocations(
    bulkData: ProjectLocationBulkUpdate
  ): Promise<{ message: string }> {
    try {
      const response = await apiService.post(
        `${this.baseUrl}/bulk-update`,
        bulkData
      );
      return response as { message: string };
    } catch (error) {
      console.error('Erro ao atualizar locações em lote:', error);
      throw error;
    }
  }

  // Obter resumo de custos do projeto
  async getProjectCostSummary(
    projectId: number
  ): Promise<ProjectLocationCostSummary> {
    try {
      const response = await apiService.get(
        `${this.baseUrl}/project/${projectId}/cost-summary`
      );
      return response as ProjectLocationCostSummary;
    } catch (error) {
      console.error('Erro ao obter resumo de custos:', error);
      throw error;
    }
  }

  // Obter timeline do projeto
  async getProjectTimeline(
    projectId: number
  ): Promise<ProjectLocationTimeline> {
    try {
      const response = await apiService.get(
        `${this.baseUrl}/project/${projectId}/timeline`
      );
      return response as ProjectLocationTimeline;
    } catch (error) {
      console.error('Erro ao obter timeline do projeto:', error);
      throw error;
    }
  }

  // Atualizar progresso da locação
  async updateLocationProgress(
    locationId: number
  ): Promise<{ message: string }> {
    try {
      const response = await apiService.post(
        `${this.baseUrl}/${locationId}/update-progress`
      );
      return response as { message: string };
    } catch (error) {
      console.error('Erro ao atualizar progresso da locação:', error);
      throw error;
    }
  }

  // Métodos auxiliares
  getStatusLabel(status: RentalStatus): string {
    const labels: Record<RentalStatus, string> = {
      [RentalStatus.RESERVED]: 'Reservada',
      [RentalStatus.CONFIRMED]: 'Confirmada',
      [RentalStatus.IN_USE]: 'Em Uso',
      [RentalStatus.RETURNED]: 'Devolvida',
      [RentalStatus.OVERDUE]: 'Atrasada',
      [RentalStatus.CANCELLED]: 'Cancelada',
    };
    return labels[status] || status;
  }

  getStatusColor(status: RentalStatus): string {
    const colors: Record<RentalStatus, string> = {
      [RentalStatus.RESERVED]: '#9e9e9e',
      [RentalStatus.CONFIRMED]: '#2196f3',
      [RentalStatus.IN_USE]: '#4caf50',
      [RentalStatus.RETURNED]: '#4caf50',
      [RentalStatus.OVERDUE]: '#f44336',
      [RentalStatus.CANCELLED]: '#f44336',
    };
    return colors[status] || '#9e9e9e';
  }

  // Calcular duração em dias
  calculateDurationDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  // Calcular custo total
  calculateTotalCost(
    dailyRate: number,
    startDate: string,
    endDate: string,
    hourlyRate?: number,
    startTime?: string,
    endTime?: string
  ): number {
    if (hourlyRate && startTime && endTime) {
      // Cálculo por hora
      const start = new Date(startTime);
      const end = new Date(endTime);
      const durationHours =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return durationHours * hourlyRate;
    } else {
      // Cálculo por dia
      const durationDays = this.calculateDurationDays(startDate, endDate);
      return durationDays * dailyRate;
    }
  }

  // Verificar se locação está ativa
  isLocationActive(location: ProjectLocation): boolean {
    return [RentalStatus.CONFIRMED, RentalStatus.IN_USE].includes(
      location.status
    );
  }

  // Verificar se locação está atrasada
  isLocationOverdue(location: ProjectLocation): boolean {
    if (!location.rental_end || location.status === RentalStatus.RETURNED) {
      return false;
    }
    return new Date() > new Date(location.rental_end);
  }

  // Obter locações ativas
  getActiveLocations(locations: ProjectLocation[]): ProjectLocation[] {
    return locations.filter(location => this.isLocationActive(location));
  }

  // Obter locações atrasadas
  getOverdueLocations(locations: ProjectLocation[]): ProjectLocation[] {
    return locations.filter(location => this.isLocationOverdue(location));
  }

  // Obter locações por status
  getLocationsByStatus(
    locations: ProjectLocation[],
    status: RentalStatus
  ): ProjectLocation[] {
    return locations.filter(location => location.status === status);
  }

  // Calcular custo total de um conjunto de locações
  calculateLocationsTotalCost(locations: ProjectLocation[]): number {
    return locations.reduce(
      (total, location) => total + location.total_cost,
      0
    );
  }

  // Calcular custo médio diário
  calculateAverageDailyCost(locations: ProjectLocation[]): number {
    if (locations.length === 0) return 0;
    const totalCost = this.calculateLocationsTotalCost(locations);
    const totalDays = locations.reduce(
      (total, location) => total + location.duration_days,
      0
    );
    return totalDays > 0 ? totalCost / totalDays : 0;
  }

  // Obter estatísticas de locações
  getLocationStats(locations: ProjectLocation[]): {
    total: number;
    active: number;
    overdue: number;
    totalCost: number;
    averageCost: number;
    byStatus: Record<RentalStatus, number>;
  } {
    const stats = {
      total: locations.length,
      active: this.getActiveLocations(locations).length,
      overdue: this.getOverdueLocations(locations).length,
      totalCost: this.calculateLocationsTotalCost(locations),
      averageCost: this.calculateAverageDailyCost(locations),
      byStatus: {} as Record<RentalStatus, number>,
    };

    // Contar por status
    Object.values(RentalStatus).forEach(status => {
      stats.byStatus[status] = this.getLocationsByStatus(
        locations,
        status
      ).length;
    });

    return stats;
  }
}

export const projectLocationService = new ProjectLocationService();

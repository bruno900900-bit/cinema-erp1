import { apiService } from './api';

export interface DashboardStats {
  total_projects: number;
  active_projects: number;
  total_locations: number;
  approved_locations: number;
  total_budget: number;
  budget_spent: number;
  budget_remaining: number;
  upcoming_events: number;
  active_users: number;
}

export interface ProjectSummary {
  id: number;
  name: string;
  client_name: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget_total: number;
  budget_spent: number;
  budget_progress: number;
  location_count: number;
}

export interface UpcomingEvent {
  id: number;
  title: string;
  description: string | null;
  event_type: string | null;
  status: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
  color: string | null;
  priority: number;
}

export interface RecentLocation {
  id: number;
  title: string;
  city: string | null;
  state: string | null;
  status: string | null;
  cover_photo_url: string | null;
  space_type: string | null;
  price_day_cinema: number;
}

export interface FinancialSummary {
  total_budget: number;
  total_spent: number;
  remaining: number;
  utilization_percent: number;
  projects_over_budget: number;
  top_projects_by_budget: {
    id: number;
    name: string;
    budget_total: number;
    budget_spent: number;
    remaining: number;
  }[];
}

class DashboardService {
  async getStats(): Promise<DashboardStats> {
    try {
      return await apiService.get<DashboardStats>('/dashboard/stats');
    } catch (error) {
      console.error('Erro ao obter stats do dashboard:', error);
      return {
        total_projects: 0,
        active_projects: 0,
        total_locations: 0,
        approved_locations: 0,
        total_budget: 0,
        budget_spent: 0,
        budget_remaining: 0,
        upcoming_events: 0,
        active_users: 0,
      };
    }
  }

  async getActiveProjects(limit = 5): Promise<{ projects: ProjectSummary[] }> {
    try {
      return await apiService.get<{ projects: ProjectSummary[] }>(
        `/dashboard/projects?limit=${limit}`
      );
    } catch (error) {
      console.error('Erro ao obter projetos ativos:', error);
      return { projects: [] };
    }
  }

  async getUpcomingEvents(limit = 10): Promise<{ events: UpcomingEvent[] }> {
    try {
      return await apiService.get<{ events: UpcomingEvent[] }>(
        `/dashboard/upcoming-events?limit=${limit}`
      );
    } catch (error) {
      console.error('Erro ao obter eventos:', error);
      return { events: [] };
    }
  }

  async getRecentLocations(
    limit = 6
  ): Promise<{ locations: RecentLocation[] }> {
    try {
      return await apiService.get<{ locations: RecentLocation[] }>(
        `/dashboard/recent-locations?limit=${limit}`
      );
    } catch (error) {
      console.error('Erro ao obter locações recentes:', error);
      return { locations: [] };
    }
  }

  async getFinancialSummary(): Promise<FinancialSummary> {
    try {
      return await apiService.get<FinancialSummary>(
        '/dashboard/financial-summary'
      );
    } catch (error) {
      console.error('Erro ao obter resumo financeiro:', error);
      return {
        total_budget: 0,
        total_spent: 0,
        remaining: 0,
        utilization_percent: 0,
        projects_over_budget: 0,
        top_projects_by_budget: [],
      };
    }
  }
}

export const dashboardService = new DashboardService();

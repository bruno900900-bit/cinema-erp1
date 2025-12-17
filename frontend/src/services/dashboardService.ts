import { supabase } from '../config/supabaseClient';

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
      // Executar queries em paralelo para performance
      const [projects, locations, users] = await Promise.all([
        supabase
          .from('projects')
          .select('status, budget, budget_spent', { count: 'exact' }),
        supabase.from('locations').select('status', { count: 'exact' }),
        supabase.from('users').select('id', { count: 'exact' }),
      ]);

      const activeProjects =
        projects.data?.filter(p => p.status === 'active') || [];
      const approvedLocations =
        locations.data?.filter(l => l.status === 'approved') || [];

      const totalBudget =
        projects.data?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;
      const budgetSpent =
        projects.data?.reduce((sum, p) => sum + (p.budget_spent || 0), 0) || 0;

      return {
        total_projects: projects.count || 0,
        active_projects: activeProjects.length,
        total_locations: locations.count || 0,
        approved_locations: approvedLocations.length,
        total_budget: totalBudget,
        budget_spent: budgetSpent,
        budget_remaining: totalBudget - budgetSpent,
        upcoming_events: 0, // Implementar se tabela events existir
        active_users: users.count || 0,
      };
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
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const projects = data.map((p: any) => ({
        id: p.id,
        name: p.name || p.title,
        client_name: p.client_name,
        status: p.status,
        start_date: p.start_date,
        end_date: p.end_date,
        budget_total: p.budget || 0,
        budget_spent: p.budget_spent || 0,
        budget_progress:
          p.budget > 0 ? ((p.budget_spent || 0) / p.budget) * 100 : 0,
        location_count: 0, // Requires extra query
      }));

      return { projects };
    } catch (error) {
      console.error('Erro ao obter projetos ativos:', error);
      return { projects: [] };
    }
  }

  async getUpcomingEvents(limit = 10): Promise<{ events: UpcomingEvent[] }> {
    // Placeholder - se tabela events não existir, retorna array vazio
    return { events: [] };
  }

  async getRecentLocations(
    limit = 6
  ): Promise<{ locations: RecentLocation[] }> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select(
          'id, title, city, state, status, cover_photo_url, space_type, price_day_cinema'
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { locations: (data as any[]) || [] };
    } catch (error) {
      console.error('Erro ao obter locações recentes:', error);
      return { locations: [] };
    }
  }

  async getFinancialSummary(): Promise<FinancialSummary> {
    try {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, title, budget, budget_spent');

      const allProjects = projects || [];
      const totalBudget = allProjects.reduce(
        (sum, p) => sum + (p.budget || 0),
        0
      );
      const totalSpent = allProjects.reduce(
        (sum, p) => sum + (p.budget_spent || 0),
        0
      );

      const projectData = allProjects.map((p: any) => ({
        id: p.id,
        name: p.name || p.title,
        budget_total: p.budget || 0,
        budget_spent: p.budget_spent || 0,
        remaining: (p.budget || 0) - (p.budget_spent || 0),
      }));

      // Sort by remaining budget (just as example) or overbudget
      const topProjects = projectData
        .sort((a, b) => b.budget_total - a.budget_total)
        .slice(0, 5);

      return {
        total_budget: totalBudget,
        total_spent: totalSpent,
        remaining: totalBudget - totalSpent,
        utilization_percent:
          totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
        projects_over_budget: projectData.filter(p => p.remaining < 0).length,
        top_projects_by_budget: topProjects,
      };
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

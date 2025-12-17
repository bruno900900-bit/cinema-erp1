import { supabase } from '../config/supabaseClient';
import { syncProjectLocationToAgenda } from './projectAgendaSyncService';

export interface ProjectLocation {
  id: number;
  project_id: number;
  location_id: number;
  status: 'pending' | 'confirmed' | 'in_use' | 'completed' | 'cancelled';
  rental_start?: string; // Date string YYYY-MM-DD
  rental_end?: string; // Date string YYYY-MM-DD
  rental_start_date?: string; // Alias for compatibility
  rental_end_date?: string; // Alias for compatibility
  rental_start_time?: string;
  rental_end_time?: string;
  daily_rate?: number;
  hourly_rate?: number;
  total_cost?: number;
  notes?: string;
  responsible_user_id?: number;
  coordinator_user_id?: number;
  // UI-only fields (not stored in Supabase)
  visit_date?: string;
  technical_visit_date?: string;
  filming_start_date?: string;
  filming_end_date?: string;
  delivery_date?: string;
  created_at?: string;
  updated_at?: string;
  // Computed/UI fields
  total_days?: number;
  total_hours?: number;
}

export interface ProjectLocationCreate {
  project_id: number;
  location_id: number;
  status?: string;
  rental_start_date?: string; // Mapped to rental_start
  rental_end_date?: string; // Mapped to rental_end
  rental_start_time?: string;
  rental_end_time?: string;
  daily_rate?: number;
  hourly_rate?: number;
  responsible_user_id?: number;
  coordinator_user_id?: number;
  notes?: string;
  // UI-only fields (will be filtered out before sending to Supabase)
  visit_date?: string;
  technical_visit_date?: string;
  filming_start_date?: string;
  filming_end_date?: string;
  delivery_date?: string;
}

export interface ProjectLocationUpdate extends Partial<ProjectLocationCreate> {}

export interface ProjectLocationSummary {
  total_locations: number;
  confirmed_locations: number;
  pending_locations: number;
  total_cost: number;
}

class ProjectLocationService {
  private baseUrl = '/project-locations';

  // Valid columns in project_locations table (Supabase schema)
  private readonly validColumns = [
    'project_id',
    'location_id',
    'status',
    'rental_start',
    'rental_end',
    'rental_start_time',
    'rental_end_time',
    'daily_rate',
    'hourly_rate',
    'total_cost',
    'notes',
    'responsible_user_id',
    'coordinator_user_id',
    'priority', // Legacy?
    // Production dates
    'visit_date',
    'technical_visit_date',
    'filming_start_date',
    'filming_end_date',
    'delivery_date',
  ];

  // Map frontend fields (rental_start_date) to backend fields (rental_start)
  private mapToBackend(
    data: ProjectLocationCreate | ProjectLocationUpdate
  ): any {
    const mapped: any = { ...data };

    if ('rental_start_date' in data) {
      mapped.rental_start = data.rental_start_date;
      delete mapped.rental_start_date;
    }
    if ('rental_end_date' in data) {
      mapped.rental_end = data.rental_end_date;
      delete mapped.rental_end_date;
    }

    // Calculate total cost if rates and dates are present
    // Simple verification - might be better handled by backend, but UI wants to send it often
    // We will let backend trigger handle it or calculate here.
    // Let's calculate purely for the insert payload if possible.

    return mapped;
  }

  // Sanitize data to only include valid columns
  private sanitizeData(data: any): any {
    const sanitized: any = {};
    for (const key of this.validColumns) {
      if (key in data && data[key] !== undefined) {
        sanitized[key] = data[key];
      }
    }
    return sanitized;
  }

  async createProjectLocation(
    data: ProjectLocationCreate
  ): Promise<ProjectLocation> {
    console.log('📍 ProjectLocationService.create - Input:', data);

    const mappedData = this.mapToBackend(data);

    // Calculate total cost
    if (!mappedData.total_cost) {
      mappedData.total_cost = this.calculateTotalCost(
        mappedData.rental_start,
        mappedData.rental_end,
        mappedData.daily_rate || 0,
        mappedData.hourly_rate || 0,
        mappedData.rental_start_time,
        mappedData.rental_end_time
      );
    }

    const sanitizedData = this.sanitizeData(mappedData);
    console.log('📍 ProjectLocationService.create - Inserting:', sanitizedData);

    const { data: result, error } = await supabase
      .from('project_locations')
      .insert([sanitizedData])
      .select()
      .single();

    if (error) {
      console.error('Error creating project location:', error);
      throw new Error(error.message);
    }

    const mappedResult = this.mapFromBackend(result);

    // ✨ Criar etapas padrão automaticamente após criar a locação
    try {
      const { projectLocationStageService } = await import(
        './projectLocationStageService'
      );
      console.log(
        '📝 Auto-creating default stages for project_location:',
        result.id
      );
      await projectLocationStageService.createDefaultStages(result.id);
      console.log('✅ Default stages created successfully');
    } catch (stageError) {
      console.warn('⚠️ Erro ao criar etapas padrão:', stageError);
      // Não lançar erro - a locação foi criada com sucesso
    }

    // ✨ Sincronizar com agenda se houver datas de rental
    if (result.rental_start && result.rental_end) {
      try {
        // Buscar informações do projeto e locação para criar evento descritivo
        const { data: projectData } = await supabase
          .from('projects')
          .select('title')
          .eq('id', result.project_id)
          .single();

        const { data: locationData } = await supabase
          .from('locations')
          .select('title')
          .eq('id', result.location_id)
          .single();

        const projectTitle = projectData?.title || 'Projeto';
        const locationTitle = locationData?.title || 'Locação';

        await syncProjectLocationToAgenda(result, projectTitle, locationTitle);
        console.log('✅ Evento de rental sincronizado com agenda');
      } catch (syncError) {
        console.warn('⚠️ Erro ao sincronizar rental com agenda:', syncError);
        // Não lançar erro - a locação foi criada com sucesso
      }
    }

    return mappedResult;
  }

  async updateProjectLocation(
    id: number,
    data: ProjectLocationUpdate
  ): Promise<ProjectLocation> {
    const mappedData = this.mapToBackend(data);

    // Check if we need to recalculate total_cost
    // Ideally we fetch current state, but for now if dates/rates changed we calc
    if (
      mappedData.rental_start ||
      mappedData.rental_end ||
      mappedData.daily_rate !== undefined
    ) {
      // Logic to recalculate is complex without full object.
      // Assuming UI sends full relevant data or we just update what's passed.
      // Let's calculate if we have enough info, otherwise leave as is.
      if (
        mappedData.rental_start &&
        mappedData.rental_end &&
        mappedData.daily_rate !== undefined
      ) {
        mappedData.total_cost = this.calculateTotalCost(
          mappedData.rental_start,
          mappedData.rental_end,
          mappedData.daily_rate,
          mappedData.hourly_rate || 0,
          mappedData.rental_start_time,
          mappedData.rental_end_time
        );
      }
    }

    const sanitizedData = this.sanitizeData(mappedData);

    const { data: result, error } = await supabase
      .from('project_locations')
      .update(sanitizedData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    const mappedResult = this.mapFromBackend(result);

    // ✨ Sincronizar com agenda se as datas mudaram
    if (result.rental_start && result.rental_end) {
      try {
        const { data: projectData } = await supabase
          .from('projects')
          .select('title')
          .eq('id', result.project_id)
          .single();

        const { data: locationData } = await supabase
          .from('locations')
          .select('title')
          .eq('id', result.location_id)
          .single();

        const projectTitle = projectData?.title || 'Projeto';
        const locationTitle = locationData?.title || 'Locação';

        await syncProjectLocationToAgenda(result, projectTitle, locationTitle);
        console.log('✅ Evento de rental atualizado na agenda');
      } catch (syncError) {
        console.warn('⚠️ Erro ao sincronizar rental atualizado:', syncError);
      }
    }

    return mappedResult;
  }

  async deleteProjectLocation(id: number): Promise<void> {
    const { error } = await supabase
      .from('project_locations')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getProjectLocations(projectId: number): Promise<ProjectLocation[]> {
    try {
      const { data, error } = await supabase
        .from('project_locations')
        .select(
          `
          *,
          location:locations(id, title, city, state),
          stages:project_location_stages(*)
        `
        )
        .eq('project_id', projectId)
        .order('rental_start', { ascending: true });

      if (error) {
        console.warn('Error fetching project locations:', error.message);
        return [];
      }

      console.log(
        `📍 Fetched ${
          data?.length || 0
        } locations with stages for project ${projectId}`
      );

      return (data || []).map(this.mapFromBackend);
    } catch (error) {
      console.error('Error in getProjectLocations:', error);
      return [];
    }
  }

  async getProjectLocationsSummary(
    projectId: number
  ): Promise<ProjectLocationSummary> {
    const locations = await this.getProjectLocations(projectId);

    const summary: ProjectLocationSummary = {
      total_locations: locations.length,
      confirmed_locations: locations.filter(l => l.status === 'confirmed')
        .length,
      pending_locations: locations.filter(l => l.status === 'pending').length,
      total_cost: locations.reduce(
        (sum, loc) => sum + (loc.total_cost || 0),
        0
      ),
    };

    return summary;
  }

  async updateProjectLocationStatus(
    id: number,
    status: string
  ): Promise<ProjectLocation> {
    return this.updateProjectLocation(id, { status } as any);
  }

  // Helpers
  private mapFromBackend(data: any): ProjectLocation {
    // Map backend snake_case to frontend if needed (currently most match)
    // Add computed fields
    if (!data) return data;

    const start = data.rental_start ? new Date(data.rental_start) : null;
    const end = data.rental_end ? new Date(data.rental_end) : null;
    let days = 0;
    if (start && end) {
      const diff = end.getTime() - start.getTime();
      days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1; // Inclusive
    }

    return {
      ...data,
      rental_start_date: data.rental_start, // For convenience
      rental_end_date: data.rental_end,
      total_days: days,
    };
  }

  calculateTotalCost(
    startDate: string,
    endDate: string,
    dailyRate: number,
    hourlyRate: number = 0,
    startTime?: string,
    endTime?: string
  ): number {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if invalid dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    const diffMs = end.getTime() - start.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

    // If we have hours and hourly rate, and it's same day or logic applies?
    // ProjectLocationManager usually treats dailyRate as default.
    // Let's implement simple daily logic for now as per component usage

    return days * dailyRate;
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    // Handle potential format issues
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('pt-BR').format(date);
    } catch {
      return dateStr;
    }
  }

  getStatusLabel(status: string | undefined): string {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      reserved: 'Reservado',
      confirmed: 'Confirmado',
      in_use: 'Em Uso',
      completed: 'Concluído',
      cancelled: 'Cancelado',
      overdue: 'Atrasado',
    };
    return status ? labels[status] || status : 'Desconhecido';
  }

  getStatusColor(
    status: string | undefined
  ):
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning' {
    const colors: Record<
      string,
      | 'default'
      | 'primary'
      | 'secondary'
      | 'error'
      | 'info'
      | 'success'
      | 'warning'
    > = {
      pending: 'warning',
      reserved: 'info',
      confirmed: 'success',
      in_use: 'primary',
      completed: 'default',
      cancelled: 'error',
      overdue: 'error',
    };
    return status ? colors[status] || 'default' : 'default';
  }
}

export const projectLocationService = new ProjectLocationService();
export default projectLocationService;

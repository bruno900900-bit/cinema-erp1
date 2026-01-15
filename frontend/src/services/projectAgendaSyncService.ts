import { supabase } from '../config/supabaseClient';
import { agendaEventService } from './agendaEventService';
import { Project, ProjectLocation } from '../types/user';

/**
 * Serviço de Sincronização Projeto → Agenda
 * Cria eventos de agenda automaticamente quando datas de produção são salvas
 */

/**
 * Sincroniza projeto com agenda criando eventos de início e fim
 */
export async function syncProjectToAgenda(project: Project): Promise<void> {
  try {
    const projectId = Number(project.id);
    if (isNaN(projectId)) {
      console.warn('syncProjectToAgenda: ID inválido', project.id);
      return;
    }

    // Helper to convert Date to YYYY-MM-DD string
    const toDateString = (date: any): string | undefined => {
      if (!date) return undefined;
      const d = new Date(date);
      if (isNaN(d.getTime())) return undefined;
      return d.toISOString().split('T')[0];
    };

    // Criar evento de início do projeto
    if (project.start_date) {
      const startDate = toDateString(project.start_date);
      if (startDate) {
        await agendaEventService.createEvent({
          title: `📅 Início: ${project.title}`,
          description: `Início do projeto para ${project.client_name}`,
          event_type: 'project_start',
          start_date: startDate,
          end_date: startDate,
          all_day: true,
          project_id: projectId,
          color: '#2196F3',
          priority: 2, // high
        });
      }
    }

    // Criar evento de fim do projeto
    if (project.end_date) {
      const endDate = toDateString(project.end_date);
      if (endDate) {
        await agendaEventService.createEvent({
          title: `🏁 Fim: ${project.title}`,
          description: `Entrega final do projeto para ${project.client_name}`,
          event_type: 'project_end',
          start_date: endDate,
          end_date: endDate,
          all_day: true,
          project_id: projectId,
          color: '#FF5722',
          priority: 3, // critical
        });
      }
    }

    console.log(
      '✅ Eventos de projeto sincronizados com agenda:',
      project.title
    );
  } catch (error) {
    console.error('❌ Erro ao sincronizar projeto com agenda:', error);
    // Não lançar erro para não quebrar o salvamento do projeto
  }
}

/**
 * Sincroniza locação de projeto com agenda criando eventos de rental E datas de produção
 */
export async function syncProjectLocationToAgenda(
  projectLocation: ProjectLocation,
  projectTitle: string,
  locationTitle: string
): Promise<void> {
  try {
    const projectId = Number((projectLocation as any).project_id);

    // Helper to convert Date to YYYY-MM-DD string
    const toDateString = (date: any): string | undefined => {
      if (!date) return undefined;
      const d = new Date(date);
      if (isNaN(d.getTime())) return undefined;
      return d.toISOString().split('T')[0];
    };

    // 1. Evento de Período de Locação (rental_start -> rental_end)
    if (projectLocation.rental_start && projectLocation.rental_end) {
      const startDate = toDateString(projectLocation.rental_start);
      const endDate = toDateString(projectLocation.rental_end);

      if (startDate && endDate) {
        await agendaEventService.createEvent({
          title: `📍 ${locationTitle}`,
          description: `Aluguel de locação para ${projectTitle}`,
          event_type: 'location_rental_full',
          start_date: startDate,
          end_date: endDate,
          all_day: true,
          project_id: projectId,
          location_id: projectLocation.location_id,
          color: '#4CAF50',
          priority: 2, // high
        });

        console.log('✅ Evento de rental sincronizado:', locationTitle);
      }
    }

    // 2. Evento de Visitação
    if (projectLocation.visit_date) {
      const visitDate = toDateString(projectLocation.visit_date);
      if (visitDate) {
        await agendaEventService.createEvent({
          title: `🚶 Visitação: ${locationTitle}`,
          description: `Visitação da locação para ${projectTitle}`,
          event_type: 'visit_scheduled',
          start_date: visitDate,
          end_date: visitDate,
          all_day: true,
          project_id: projectId,
          location_id: projectLocation.location_id,
          color: '#9C27B0',
          priority: 2,
        });

        console.log('✅ Evento de visitação sincronizado:', locationTitle);
      }
    }

    // 3. Evento de Visita Técnica
    if (projectLocation.technical_visit_date) {
      const techVisitDate = toDateString(projectLocation.technical_visit_date);
      if (techVisitDate) {
        await agendaEventService.createEvent({
          title: `🔧 Visita Técnica: ${locationTitle}`,
          description: `Visita técnica da locação para ${projectTitle}`,
          event_type: 'technical_visit',
          start_date: techVisitDate,
          end_date: techVisitDate,
          all_day: true,
          project_id: projectId,
          location_id: projectLocation.location_id,
          color: '#FF9800',
          priority: 2,
        });

        console.log('✅ Evento de visita técnica sincronizado:', locationTitle);
      }
    }

    // 4. Evento de Gravação/Filmagem
    if (
      projectLocation.filming_start_date &&
      projectLocation.filming_end_date
    ) {
      const filmingStart = toDateString(projectLocation.filming_start_date);
      const filmingEnd = toDateString(projectLocation.filming_end_date);

      if (filmingStart && filmingEnd) {
        await agendaEventService.createEvent({
          title: `🎬 Gravação: ${locationTitle}`,
          description: `Período de filmagem em ${locationTitle} para ${projectTitle}`,
          event_type: 'filming_period',
          start_date: filmingStart,
          end_date: filmingEnd,
          all_day: true,
          project_id: projectId,
          location_id: projectLocation.location_id,
          color: '#F44336',
          priority: 3, // critical
        });

        console.log('✅ Evento de gravação sincronizado:', locationTitle);
      }
    } else if (projectLocation.filming_start_date) {
      // Apenas data de início da gravação
      const filmingStart = toDateString(projectLocation.filming_start_date);
      if (filmingStart) {
        await agendaEventService.createEvent({
          title: `🎬 Início Gravação: ${locationTitle}`,
          description: `Início da filmagem em ${locationTitle} para ${projectTitle}`,
          event_type: 'filming_start',
          start_date: filmingStart,
          end_date: filmingStart,
          all_day: true,
          project_id: projectId,
          location_id: projectLocation.location_id,
          color: '#F44336',
          priority: 3,
        });
      }
    }

    // 5. Evento de Entrega da Locação
    if (projectLocation.delivery_date) {
      const deliveryDate = toDateString(projectLocation.delivery_date);
      if (deliveryDate) {
        await agendaEventService.createEvent({
          title: `📦 Entrega: ${locationTitle}`,
          description: `Entrega da locação ${locationTitle} para ${projectTitle}`,
          event_type: 'delivery',
          start_date: deliveryDate,
          end_date: deliveryDate,
          all_day: true,
          project_id: projectId,
          location_id: projectLocation.location_id,
          color: '#00BCD4',
          priority: 2,
        });

        console.log('✅ Evento de entrega sincronizado:', locationTitle);
      }
    }

    console.log(
      '✅ Todas as datas de produção sincronizadas para:',
      locationTitle
    );
  } catch (error) {
    console.error(
      '❌ Erro ao sincronizar datas de produção com agenda:',
      error
    );
    // Não lançar erro para não quebrar o salvamento
  }
}

/**
 * Deleta eventos de agenda relacionados a um projeto
 * (Opcional - pode deixar eventos órfãos se preferir)
 */
export async function deleteProjectAgendaEvents(
  projectId: number | string
): Promise<void> {
  try {
    const numericId = Number(projectId);
    if (isNaN(numericId)) {
      console.warn('deleteProjectAgendaEvents: ID inválido', projectId);
      return;
    }

    // Buscar eventos do projeto
    const { data: events, error } = await supabase
      .from('agenda_events')
      .select('id')
      .eq('project_id', numericId);

    if (error) throw error;

    if (events && events.length > 0) {
      // Deletar eventos
      const eventIds = events.map(e => e.id);
      const { error: deleteError } = await supabase
        .from('agenda_events')
        .delete()
        .in('id', eventIds);

      if (deleteError) throw deleteError;

      console.log(
        `✅ ${events.length} eventos de agenda removidos para projeto ${numericId}`
      );
    }
  } catch (error) {
    console.error('❌ Erro ao deletar eventos de agenda:', error);
    // Não lançar erro - remoção de eventos é secundária
  }
}

export const projectAgendaSyncService = {
  syncProjectToAgenda,
  syncProjectLocationToAgenda,
  deleteProjectAgendaEvents,
};

export default projectAgendaSyncService;

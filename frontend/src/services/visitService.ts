import { apiService, normalizeListResponse } from './api';
import { Visit } from '@/types/user';

export const visitService = {
  // Listar todas as visitas
  getVisits: async (): Promise<Visit[]> => {
    try {
      const response = await apiService.get<any>('/visits');
      return normalizeListResponse<Visit>(response, [
        'visits',
        'items',
        'results',
      ]);
    } catch (error) {
      console.error('Erro ao buscar visitas:', error);
      return [];
    }
  },

  // Buscar visita por ID
  getVisit: async (id: number): Promise<Visit> => {
    const response = await apiService.get<Visit>(`/visits/${id}`);
    return response;
  },

  // Listar visitas por usuário
  getUserVisits: async (userId: number): Promise<Visit[]> => {
    try {
      const response = await apiService.get<any>(`/visits/user/${userId}`);
      return normalizeListResponse<Visit>(response, [
        'visits',
        'items',
        'results',
      ]);
    } catch (error) {
      console.error('Erro ao buscar visitas do usuário:', error);
      return [];
    }
  },

  // Criar nova visita
  createVisit: async (visit: Partial<Visit>): Promise<Visit> => {
    try {
      console.log('📅 VisitService.createVisit - Criando visita:', visit);

      const response = await apiService.post<Visit>('/visits', visit);

      if (!response) {
        throw new Error('Resposta vazia do servidor');
      }

      console.log('✅ VisitService.createVisit - Sucesso:', response);
      return response;
    } catch (error) {
      console.error('❌ VisitService.createVisit - Erro:', error);
      throw new Error('Erro ao criar visita');
    }
  },

  // Atualizar visita
  updateVisit: async (id: string, visit: Partial<Visit>): Promise<Visit> => {
    try {
      console.log(
        `📅 VisitService.updateVisit - Atualizando visita ID: ${id}`,
        visit
      );

      const response = await apiService.put<Visit>(`/visits/${id}`, visit);

      if (!response) {
        throw new Error('Resposta vazia do servidor');
      }

      console.log('✅ VisitService.updateVisit - Sucesso:', response);
      return response;
    } catch (error) {
      console.error('❌ VisitService.updateVisit - Erro:', error);
      throw new Error('Erro ao atualizar visita');
    }
  },

  // Excluir visita
  deleteVisit: async (id: string): Promise<void> => {
    await apiService.delete(`/visits/${id}`);
  },

  // Buscar visitas por usuário
  getVisitsByUser: async (userId: string): Promise<Visit[]> => {
    try {
      console.log(
        `📅 VisitService.getVisitsByUser - Buscando visitas do usuário: ${userId}`
      );

      const response = await apiService.get<Visit[]>(`/visits/user/${userId}`);

      // Garantir que sempre retornamos um array válido
      const result = Array.isArray(response) ? response : [];

      console.log(
        '✅ VisitService.getVisitsByUser - Sucesso:',
        result.length,
        'visitas'
      );
      return result;
    } catch (error) {
      console.error('❌ VisitService.getVisitsByUser - Erro:', error);
      return [];
    }
  },

  // Buscar visitas por local
  getVisitsByLocation: async (locationId: string): Promise<Visit[]> => {
    try {
      console.log(
        `📅 VisitService.getVisitsByLocation - Buscando visitas do local: ${locationId}`
      );

      const response = await apiService.get<Visit[]>(
        `/visits/location/${locationId}`
      );

      // Garantir que sempre retornamos um array válido
      const result = Array.isArray(response) ? response : [];

      console.log(
        '✅ VisitService.getVisitsByLocation - Sucesso:',
        result.length,
        'visitas'
      );
      return result;
    } catch (error) {
      console.error('❌ VisitService.getVisitsByLocation - Erro:', error);
      return [];
    }
  },

  // Buscar visitas por período
  getVisitsByDateRange: async (
    startDate: Date,
    endDate: Date
  ): Promise<Visit[]> => {
    try {
      // Validar que são objetos Date válidos antes de usar toISOString
      const start = startDate instanceof Date ? startDate : new Date(startDate);
      const end = endDate instanceof Date ? endDate : new Date(endDate);

      if (isNaN(start.getTime())) {
        console.error(
          'Invalid start date provided to getVisitsByDateRange:',
          startDate
        );
        return [];
      }
      if (isNaN(end.getTime())) {
        console.error(
          'Invalid end date provided to getVisitsByDateRange:',
          endDate
        );
        return [];
      }

      console.log(
        '📅 VisitService.getVisitsByDateRange - Buscando visitas por período:',
        {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        }
      );

      const response = await apiService.get<Visit[]>('/visits/date-range', {
        params: {
          start_date: start.toISOString(),
          end_date: end.toISOString(),
        },
      });

      // Garantir que sempre retornamos um array válido
      const result = Array.isArray(response) ? response : [];

      console.log(
        '✅ VisitService.getVisitsByDateRange - Sucesso:',
        result.length,
        'visitas'
      );
      return result;
    } catch (error) {
      console.error('❌ VisitService.getVisitsByDateRange - Erro:', error);
      return [];
    }
  },

  // Atualizar status da visita
  updateVisitStatus: async (id: string, status: string): Promise<Visit> => {
    const response = await apiService.patch<Visit>(`/visits/${id}/status`, {
      status,
    });
    return response;
  },

  // Buscar estatísticas de visitas
  getVisitStats: async (): Promise<any> => {
    const response = await apiService.get('/visits/stats');
    return response;
  },

  // Exportar visitas
  exportVisits: async (filters?: any): Promise<Blob> => {
    const response = await apiService.get<Blob>('/visits/export', {
      params: filters,
      responseType: 'blob',
    });
    return response;
  },
} as const;

// Função para gerar dados mockados de visitas
function getMockVisits(): any[] {
  return [
    {
      id: '1',
      title: 'Visita Técnica - Estúdio Central',
      description:
        'Visita técnica para avaliar o estúdio para gravação do filme de ação',
      status: 'scheduled' as any,
      scheduled_date: new Date('2024-03-15T10:00:00').toISOString(),
      duration: 2,
      location_id: 1,

      responsible_user_id: '1',
      coordinator_user_id: '2',
      created_by: '1',
      created_at: new Date('2024-03-01').toISOString(),
      updated_at: new Date().toISOString(),
      participants: [
        {
          id: '1',
          user_id: '1',
          visit_id: '1',
          role: 'responsible' as any,
          confirmed: true,
          notes: 'Responsável pela visita técnica',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          user_id: '2',
          visit_id: '1',
          role: 'coordinator' as any,
          confirmed: true,
          notes: 'Coordenador do projeto',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      location: {
        id: 1,
        title: 'Estúdio Central - São Paulo',
        slug: 'estudio-central-sp',
        summary: 'Estúdio moderno no centro de São Paulo',
        description: 'Estúdio de 200m² com equipamentos profissionais',
        status: 'approved' as any,
        sector_type: 'cinema' as any,
        space_type: 'studio' as any,
        price_day_cinema: 2500,
        price_hour_cinema: 350,
        price_day_publicidade: 1800,
        price_hour_publicidade: 250,
        currency: 'BRL',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
        capacity: 50,
        area_size: 200,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        supplier: {
          id: 1,
          name: 'Estúdios SP Ltda',
          email: 'contato@estudiosp.com',
          phone: '(11) 99999-9999',
          rating: 4.8,
          is_active: true,
        },
        photos: [],
        tags: [],
      },
    },
    {
      id: '2',
      title: 'Reunião de Produção - Casa Histórica',
      description: 'Reunião com a equipe de produção na casa histórica',
      status: 'completed' as any,
      scheduled_date: new Date('2024-02-20T14:00:00').toISOString(),
      duration: 1.5,
      location_id: 2,

      responsible_user_id: '2',
      coordinator_user_id: '1',
      created_by: '2',
      created_at: new Date('2024-02-15').toISOString(),
      updated_at: new Date('2024-02-20').toISOString(),
      participants: [
        {
          id: '3',
          user_id: '2',
          visit_id: '2',
          role: 'responsible' as any,
          confirmed: true,
          notes: 'Responsável pela reunião',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      location: {
        id: 2,
        title: 'Casa Histórica - Rio de Janeiro',
        slug: 'casa-historica-rj',
        summary: 'Casa histórica do século XIX no Rio de Janeiro',
        description:
          'Casa colonial preservada, perfeita para produções de época',
        status: 'approved' as any,
        sector_type: 'cinema' as any,
        space_type: 'house' as any,
        price_day_cinema: 3200,
        price_hour_cinema: 450,
        price_day_publicidade: 2400,
        price_hour_publicidade: 320,
        currency: 'BRL',
        city: 'Rio de Janeiro',
        state: 'RJ',
        country: 'Brasil',
        capacity: 30,
        area_size: 150,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        supplier: {
          id: 2,
          name: 'Patrimônio Cultural RJ',
          email: 'locacao@patrimonio-rj.com',
          phone: '(21) 88888-8888',
          rating: 4.9,
          is_active: true,
        },
        photos: [],
        tags: [],
      },
    },
    {
      id: '3',
      title: 'Inspeção de Segurança - Galpão Industrial',
      description:
        'Inspeção de segurança no galpão industrial antes da gravação',
      status: 'pending' as any,
      scheduled_date: new Date('2024-03-25T09:00:00').toISOString(),
      duration: 3,
      location_id: 3,

      responsible_user_id: '3',
      coordinator_user_id: '1',
      created_by: '1',
      created_at: new Date('2024-03-10').toISOString(),
      updated_at: new Date().toISOString(),
      participants: [
        {
          id: '4',
          user_id: '3',
          visit_id: '3',
          role: 'responsible' as any,
          confirmed: false,
          notes: 'Aguardando confirmação',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      location: {
        id: 3,
        title: 'Galpão Industrial - Belo Horizonte',
        slug: 'galpao-industrial-bh',
        summary: 'Galpão industrial adaptado para produções',
        description:
          'Espaço amplo de 500m², ideal para gravações que precisam de muito espaço',
        status: 'approved' as any,
        sector_type: 'publicidade' as any,
        space_type: 'warehouse' as any,
        price_day_cinema: 1800,
        price_hour_cinema: 250,
        price_day_publicidade: 1200,
        price_hour_publicidade: 180,
        currency: 'BRL',
        city: 'Belo Horizonte',
        state: 'MG',
        country: 'Brasil',
        capacity: 100,
        area_size: 500,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        supplier: {
          id: 3,
          name: 'Espaços BH',
          email: 'aluguel@espacosbh.com',
          phone: '(31) 77777-7777',
          rating: 4.5,
          is_active: true,
        },
        photos: [],
        tags: [],
      },
    },
  ];
}

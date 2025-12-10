import { apiService } from './api';
import {
  CustomFilter,
  CustomFilterCreate,
  CustomFilterUpdate,
  CustomFilterList,
  FilterCriteria,
} from '../types/customFilter';

class CustomFilterService {
  private baseUrl = '/custom-filters';

  async getFilters(includePublic: boolean = true): Promise<CustomFilterList[]> {
    return await apiService.get(`${this.baseUrl}/`, {
      params: { include_public: includePublic },
    });
  }

  async getFilterById(id: number): Promise<CustomFilter> {
    return await apiService.get(`${this.baseUrl}/${id}`);
  }

  async createFilter(filterData: CustomFilterCreate): Promise<CustomFilter> {
    return await apiService.post(`${this.baseUrl}/`, filterData);
  }

  async updateFilter(
    id: number,
    filterData: CustomFilterUpdate
  ): Promise<CustomFilter> {
    return await apiService.put(`${this.baseUrl}/${id}`, filterData);
  }

  async deleteFilter(id: number): Promise<void> {
    await apiService.delete(`${this.baseUrl}/${id}`);
  }

  async duplicateFilter(id: number, newName: string): Promise<CustomFilter> {
    return await apiService.post(`${this.baseUrl}/${id}/duplicate`, null, {
      params: { new_name: newName },
    });
  }

  async setDefaultFilter(id: number): Promise<void> {
    await apiService.post(`${this.baseUrl}/${id}/set-default`);
  }

  async getDefaultFilter(): Promise<CustomFilter | null> {
    try {
      return await apiService.get(`${this.baseUrl}/default/current`);
    } catch (error) {
      // Se não encontrar filtro padrão, retorna null
      return null;
    }
  }

  async searchFilters(query: string): Promise<CustomFilterList[]> {
    return await apiService.get(
      `${this.baseUrl}/search/${encodeURIComponent(query)}`
    );
  }

  // Métodos utilitários para trabalhar com critérios
  buildFilterCriteria(filters: any): FilterCriteria {
    const criteria: FilterCriteria = {};

    // Busca textual
    if (filters.search) {
      criteria.q = filters.search;
    }

    // Localização
    if (filters.cities?.length) {
      criteria.city = filters.cities;
    }
    if (filters.states?.length) {
      criteria.state = filters.states;
    }

    // Tipo de espaço
    if (filters.spaceTypes?.length) {
      criteria.space_type = filters.spaceTypes;
    }

    // Status
    if (filters.statuses?.length) {
      criteria.status = filters.statuses;
    }

    // Preços
    if (filters.priceDayMin || filters.priceDayMax) {
      criteria.price_day = {
        min: filters.priceDayMin || 0,
        max: filters.priceDayMax,
      };
    }

    if (filters.priceHourMin || filters.priceHourMax) {
      criteria.price_hour = {
        min: filters.priceHourMin || 0,
        max: filters.priceHourMax,
      };
    }

    // Capacidade
    if (filters.capacityMin || filters.capacityMax) {
      criteria.capacity = {
        min: filters.capacityMin || 0,
        max: filters.capacityMax,
      };
    }

    // Área
    if (filters.areaMin || filters.areaMax) {
      criteria.area_size = {
        min: filters.areaMin || 0,
        max: filters.areaMax,
      };
    }

    // Tags
    if (filters.tags?.length) {
      criteria.tags = filters.tags;
    }

    // Fornecedores
    if (filters.supplierIds?.length) {
      criteria.supplier_ids = filters.supplierIds;
    }

    // Projetos
    if (filters.projectIds?.length) {
      criteria.project_ids = filters.projectIds;
    }

    // Responsáveis
    if (filters.responsibleUserIds?.length) {
      criteria.responsible_user_ids = filters.responsibleUserIds;
    }

    // Datas
    if (filters.createdAfter) {
      criteria.created_after = filters.createdAfter;
    }
    if (filters.createdBefore) {
      criteria.created_before = filters.createdBefore;
    }

    // Busca geográfica
    if (filters.geoLocation && filters.geoRadius) {
      criteria.geo_radius = {
        lat: filters.geoLocation.lat,
        lng: filters.geoLocation.lng,
        radius_km: filters.geoRadius,
      };
    }

    return criteria;
  }

  // Aplicar critérios de um filtro personalizado
  applyFilterCriteria(criteria: FilterCriteria): any {
    const filters: any = {};

    // Busca textual
    if (criteria.q) {
      filters.search = criteria.q;
    }

    // Localização
    if (criteria.city?.length) {
      filters.cities = criteria.city;
    }
    if (criteria.state?.length) {
      filters.states = criteria.state;
    }

    // Tipo de espaço
    if (criteria.space_type?.length) {
      filters.spaceTypes = criteria.space_type;
    }

    // Status
    if (criteria.status?.length) {
      filters.statuses = criteria.status;
    }

    // Preços
    if (criteria.price_day) {
      filters.priceDayMin = criteria.price_day.min;
      filters.priceDayMax = criteria.price_day.max;
    }

    if (criteria.price_hour) {
      filters.priceHourMin = criteria.price_hour.min;
      filters.priceHourMax = criteria.price_hour.max;
    }

    // Capacidade
    if (criteria.capacity) {
      filters.capacityMin = criteria.capacity.min;
      filters.capacityMax = criteria.capacity.max;
    }

    // Área
    if (criteria.area_size) {
      filters.areaMin = criteria.area_size.min;
      filters.areaMax = criteria.area_size.max;
    }

    // Tags
    if (criteria.tags?.length) {
      filters.tags = criteria.tags;
    }

    // Fornecedores
    if (criteria.supplier_ids?.length) {
      filters.supplierIds = criteria.supplier_ids;
    }

    // Projetos
    if (criteria.project_ids?.length) {
      filters.projectIds = criteria.project_ids;
    }

    // Responsáveis
    if (criteria.responsible_user_ids?.length) {
      filters.responsibleUserIds = criteria.responsible_user_ids;
    }

    // Datas
    if (criteria.created_after) {
      filters.createdAfter = criteria.created_after;
    }
    if (criteria.created_before) {
      filters.createdBefore = criteria.created_before;
    }

    // Busca geográfica
    if (criteria.geo_radius) {
      filters.geoLocation = {
        lat: criteria.geo_radius.lat,
        lng: criteria.geo_radius.lng,
      };
      filters.geoRadius = criteria.geo_radius.radius_km;
    }

    return filters;
  }

  // Validar se um filtro tem critérios válidos
  hasValidCriteria(criteria: FilterCriteria): boolean {
    return Object.keys(criteria).length > 0;
  }

  // Obter resumo dos critérios
  getCriteriaSummary(criteria: FilterCriteria): string {
    const parts: string[] = [];

    if (criteria.q) parts.push(`Busca: "${criteria.q}"`);
    if (criteria.city?.length)
      parts.push(`Cidades: ${criteria.city.join(', ')}`);
    if (criteria.space_type?.length)
      parts.push(`Tipos: ${criteria.space_type.join(', ')}`);
    if (criteria.price_day) {
      const { min, max } = criteria.price_day;
      parts.push(`Preço: R$ ${min} - ${max || '∞'}`);
    }
    if (criteria.capacity) {
      const { min, max } = criteria.capacity;
      parts.push(`Capacidade: ${min} - ${max || '∞'} pessoas`);
    }

    return parts.join(' | ') || 'Filtro personalizado';
  }
}

export const customFilterService = new CustomFilterService();

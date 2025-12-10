export interface FilterCriteria {
  q?: string;
  city?: string[];
  state?: string[];
  space_type?: string[];
  status?: string[];
  price_day?: {
    min: number;
    max?: number;
  };
  price_hour?: {
    min: number;
    max?: number;
  };
  capacity?: {
    min: number;
    max?: number;
  };
  area_size?: {
    min: number;
    max?: number;
  };
  tags?: string[];
  supplier_ids?: number[];
  project_ids?: number[];
  responsible_user_ids?: number[];
  created_after?: string;
  created_before?: string;
  geo_radius?: {
    lat: number;
    lng: number;
    radius_km: number;
  };
}

export type FilterScope = 'private' | 'team' | 'public';

export interface CustomFilter {
  id: number;
  name: string;
  description?: string;
  criteria_json: FilterCriteria;
  scope: FilterScope;
  color?: string;
  icon?: string;
  is_default: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  criteria_summary: string;
  owner_user_id: number;
}

export interface CustomFilterCreate {
  name: string;
  description?: string;
  criteria_json: FilterCriteria;
  scope: FilterScope;
  color?: string;
  icon?: string;
  is_default: boolean;
  sort_order: number;
}

export interface CustomFilterUpdate {
  name?: string;
  description?: string;
  criteria_json?: FilterCriteria;
  scope?: FilterScope;
  color?: string;
  icon?: string;
  is_default?: boolean;
  sort_order?: number;
  is_active?: boolean;
}

export interface CustomFilterList {
  id: number;
  name: string;
  description?: string;
  scope: FilterScope;
  color?: string;
  icon?: string;
  is_default: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  criteria_summary: string;
  owner_name: string;
}

// Constantes para opções de filtro
export const FILTER_SCOPE_OPTIONS = [
  { value: 'private', label: 'Privado', description: 'Apenas você pode ver' },
  { value: 'team', label: 'Equipe', description: 'Sua equipe pode ver' },
  { value: 'public', label: 'Público', description: 'Todos podem ver' },
] as const;

export const FILTER_COLOR_OPTIONS = [
  '#1976d2',
  '#dc004e',
  '#2e7d32',
  '#ed6c02',
  '#9c27b0',
  '#d32f2f',
  '#388e3c',
  '#f57c00',
  '#7b1fa2',
  '#5d4037',
  '#455a64',
  '#e91e63',
  '#4caf50',
  '#ff9800',
  '#673ab7',
] as const;

export const FILTER_ICON_OPTIONS = [
  'home',
  'business',
  'location_on',
  'star',
  'favorite',
  'work',
  'school',
  'restaurant',
  'hotel',
  'store',
  'apartment',
  'villa',
  'house',
  'warehouse',
  'factory',
] as const;

// Funções utilitárias
export const getCriteriaSummary = (criteria: FilterCriteria): string => {
  const parts: string[] = [];

  if (criteria.q) parts.push(`Busca: "${criteria.q}"`);
  if (criteria.city?.length) parts.push(`Cidades: ${criteria.city.join(', ')}`);
  if (criteria.state?.length)
    parts.push(`Estados: ${criteria.state.join(', ')}`);
  if (criteria.space_type?.length)
    parts.push(`Tipos: ${criteria.space_type.join(', ')}`);
  if (criteria.status?.length)
    parts.push(`Status: ${criteria.status.join(', ')}`);

  if (criteria.price_day) {
    const { min, max } = criteria.price_day;
    parts.push(`Preço diário: R$ ${min} - ${max || '∞'}`);
  }

  if (criteria.price_hour) {
    const { min, max } = criteria.price_hour;
    parts.push(`Preço por hora: R$ ${min} - ${max || '∞'}`);
  }

  if (criteria.capacity) {
    const { min, max } = criteria.capacity;
    parts.push(`Capacidade: ${min} - ${max || '∞'} pessoas`);
  }

  if (criteria.area_size) {
    const { min, max } = criteria.area_size;
    parts.push(`Área: ${min} - ${max || '∞'} m²`);
  }

  if (criteria.tags?.length) parts.push(`Tags: ${criteria.tags.join(', ')}`);
  if (criteria.supplier_ids?.length)
    parts.push(`${criteria.supplier_ids.length} fornecedor(es)`);
  if (criteria.project_ids?.length)
    parts.push(`${criteria.project_ids.length} projeto(s)`);

  if (criteria.geo_radius) {
    parts.push(`Raio: ${criteria.geo_radius.radius_km}km`);
  }

  return parts.join(' | ') || 'Filtro personalizado';
};

export const validateFilterCriteria = (criteria: FilterCriteria): string[] => {
  const errors: string[] = [];

  // Validar faixas de preço
  if (criteria.price_day) {
    const { min, max } = criteria.price_day;
    if (min < 0) errors.push('Preço mínimo não pode ser negativo');
    if (max && max < min)
      errors.push('Preço máximo não pode ser menor que o mínimo');
  }

  if (criteria.price_hour) {
    const { min, max } = criteria.price_hour;
    if (min < 0) errors.push('Preço por hora mínimo não pode ser negativo');
    if (max && max < min)
      errors.push('Preço por hora máximo não pode ser menor que o mínimo');
  }

  // Validar faixas de capacidade
  if (criteria.capacity) {
    const { min, max } = criteria.capacity;
    if (min < 0) errors.push('Capacidade mínima não pode ser negativa');
    if (max && max < min)
      errors.push('Capacidade máxima não pode ser menor que a mínima');
  }

  // Validar faixas de área
  if (criteria.area_size) {
    const { min, max } = criteria.area_size;
    if (min < 0) errors.push('Área mínima não pode ser negativa');
    if (max && max < min)
      errors.push('Área máxima não pode ser menor que a mínima');
  }

  // Validar busca geográfica
  if (criteria.geo_radius) {
    const { lat, lng, radius_km } = criteria.geo_radius;
    if (lat < -90 || lat > 90)
      errors.push('Latitude deve estar entre -90 e 90');
    if (lng < -180 || lng > 180)
      errors.push('Longitude deve estar entre -180 e 180');
    if (radius_km <= 0) errors.push('Raio deve ser maior que zero');
  }

  return errors;
};


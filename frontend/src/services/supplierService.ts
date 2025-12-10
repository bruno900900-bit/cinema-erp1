import { apiService } from './api';

// Tipos alinhados ao backend (schemas/supplier.py)
export interface Supplier {
  id: number;
  name: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  website?: string;
  address_json?: Record<string, any> | null;
  notes?: string;
  rating?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  locations_count?: number;
}

export interface SupplierCreate {
  name: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  website?: string;
  address_json?: Record<string, any> | null;
  notes?: string;
  rating?: number;
  is_active?: boolean;
}

export interface SupplierUpdate {
  name?: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  website?: string;
  address_json?: Record<string, any> | null;
  notes?: string;
  rating?: number;
  is_active?: boolean;
}

export interface SupplierFilter {
  name?: string;
  tax_id?: string;
  email?: string;
  is_active?: boolean | string; // Select may pass string 'true' | 'false'
  rating_min?: number;
  rating_max?: number;
  has_locations?: boolean | string;
}

export interface SupplierListResponse {
  suppliers: Supplier[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

class SupplierService {
  // Lista fornecedores com filtros (GET /api/v1/suppliers)
  async getSuppliers(
    params: Partial<SupplierFilter> & { skip?: number; limit?: number } = {}
  ): Promise<SupplierListResponse> {
    // Coerção de booleanos quando vierem como string
    const normalizeBool = (v: any) =>
      typeof v === 'string'
        ? v === 'true'
          ? true
          : v === 'false'
          ? false
          : undefined
        : v;

    const query: any = { ...params };
    if (query.is_active !== undefined)
      query.is_active = normalizeBool(query.is_active);
    if (query.has_locations !== undefined)
      query.has_locations = normalizeBool(query.has_locations);

    const data = await apiService.get<SupplierListResponse>('/suppliers', {
      params: query,
    });
    return data;
  }

  // Fornecedores ativos (atalho)
  async getActiveSuppliers(): Promise<Supplier[]> {
    const resp = await this.getSuppliers({ is_active: true, limit: 100 });
    return resp.suppliers || [];
  }

  // Buscar por ID
  async getSupplierById(id: number): Promise<Supplier | null> {
    try {
      const data = await apiService.get<Supplier>(`/suppliers/${id}`);
      return data;
    } catch (e) {
      return null;
    }
  }

  // Criar fornecedor (POST)
  async createSupplier(data: SupplierCreate): Promise<Supplier> {
    const created = await apiService.post<Supplier>('/suppliers', data);
    return created;
  }

  // Atualizar fornecedor (PUT)
  async updateSupplier(id: number, data: SupplierUpdate): Promise<Supplier> {
    const updated = await apiService.put<Supplier>(`/suppliers/${id}`, data);
    return updated;
  }

  // Remover fornecedor (DELETE)
  async deleteSupplier(id: number): Promise<void> {
    await apiService.delete(`/suppliers/${id}`);
  }
}

export const supplierService = new SupplierService();

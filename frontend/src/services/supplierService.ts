import { supabase } from '../config/supabaseClient';

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
}

export interface SupplierFilter {
  name?: string;
  tax_id?: string;
  email?: string;
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
    console.log('📦 SupplierService.getSuppliers (Supabase Safe)', params);

    let query = supabase.from('suppliers').select('*', { count: 'exact' });

    // Filtros
    if (params.name) {
      query = query.ilike('name', `%${params.name}%`);
    }

    if (params.email) {
      query = query.ilike('email', `%${params.email}%`);
    }

    if (params.tax_id) {
      query = query.eq('tax_id', params.tax_id);
    }

    // Paginação
    const limit = params.limit || 10;
    const skip = params.skip || 0;
    const page = Math.floor(skip / limit) + 1;

    query = query.range(skip, skip + limit - 1);
    query = query.order('name', { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar fornecedores:', error);
      return { suppliers: [], total: 0, page: 1, size: limit, total_pages: 0 };
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      suppliers: (data as Supplier[]) || [],
      total,
      page,
      size: limit,
      total_pages: totalPages || 1,
    };
  }

  // Fornecedores ativos (atalho)
  async getActiveSuppliers(): Promise<Supplier[]> {
    // Just get all suppliers for now since filter is broken
    const { suppliers } = await this.getSuppliers({ limit: 100 });
    return suppliers;
  }

  // Buscar por ID
  async getSupplierById(id: number): Promise<Supplier | null> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as Supplier;
  }

  // Criar fornecedor (POST)
  async createSupplier(data: SupplierCreate): Promise<Supplier> {
    const { data: created, error } = await supabase
      .from('suppliers')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return created as Supplier;
  }

  // Atualizar fornecedor (PUT)
  async updateSupplier(id: number, data: SupplierUpdate): Promise<Supplier> {
    const { data: updated, error } = await supabase
      .from('suppliers')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated as Supplier;
  }

  // Remover fornecedor (DELETE)
  async deleteSupplier(id: number): Promise<void> {
    try {
      // 1. Check for dependent locations
      const { count, error: countError } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', id);

      if (!countError && count && count > 0) {
        throw new Error(
          `Este fornecedor possui ${count} locações vinculadas. Remova ou reatribua as locações antes de excluir.`
        );
      }

      // 2. Delete
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao excluir fornecedor:', error);
      throw error; // Re-throw to show message to user
    }
  }
}

export const supplierService = new SupplierService();

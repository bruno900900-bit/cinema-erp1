/**
 * Serviço de banco de dados usando Supabase PostgreSQL
 * Substitui o Firestore com operações equivalentes no PostgreSQL
 */

import { supabase } from '../config/supabaseClient';
import type {
  PostgrestError,
  PostgrestSingleResponse,
  PostgrestResponse,
} from '@supabase/supabase-js';

export interface QueryOptions {
  filters?: Array<{ field: string; operator: string; value: any }>;
  orderBy?: { field: string; direction?: 'asc' | 'desc' };
  limit?: number;
  offset?: number;
}

export interface PaginationResult<T> {
  data: T[];
  count: number | null;
  error: PostgrestError | null;
}

class SupabaseDatabaseService {
  /**
   * Criar documento/registro
   */
  async createDocument<T = any>(
    tableName: string,
    data: Partial<T>
  ): Promise<T> {
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result as T;
    } catch (error: any) {
      console.error(`Erro ao criar documento em ${tableName}:`, error);
      throw new Error(`Erro ao criar registro: ${error.message}`);
    }
  }

  /**
   * Obter documento por ID
   */
  async getDocument<T = any>(
    tableName: string,
    id: string | number,
    idField: string = 'id'
  ): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(idField, id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data as T;
    } catch (error: any) {
      console.error(`Erro ao obter documento de ${tableName}:`, error);
      throw new Error(`Erro ao buscar registro: ${error.message}`);
    }
  }

  /**
   * Atualizar documento
   */
  async updateDocument<T = any>(
    tableName: string,
    id: string | number,
    data: Partial<T>,
    idField: string = 'id'
  ): Promise<T> {
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data)
        .eq(idField, id)
        .select()
        .single();

      if (error) throw error;
      return result as T;
    } catch (error: any) {
      console.error(`Erro ao atualizar documento em ${tableName}:`, error);
      throw new Error(`Erro ao atualizar registro: ${error.message}`);
    }
  }

  /**
   * Deletar documento
   */
  async deleteDocument(
    tableName: string,
    id: string | number,
    idField: string = 'id'
  ): Promise<void> {
    try {
      const { error } = await supabase.from(tableName).delete().eq(idField, id);

      if (error) throw error;
    } catch (error: any) {
      console.error(`Erro ao deletar documento de ${tableName}:`, error);
      throw new Error(`Erro ao deletar registro: ${error.message}`);
    }
  }

  /**
   * Listar documentos com filtros
   */
  async listDocuments<T = any>(
    tableName: string,
    options: QueryOptions = {}
  ): Promise<T[]> {
    try {
      let query = supabase.from(tableName).select('*');

      // Aplicar filtros
      if (options.filters) {
        for (const filter of options.filters) {
          switch (filter.operator) {
            case '==':
            case 'eq':
              query = query.eq(filter.field, filter.value);
              break;
            case '!=':
            case 'neq':
              query = query.neq(filter.field, filter.value);
              break;
            case '>':
            case 'gt':
              query = query.gt(filter.field, filter.value);
              break;
            case '>=':
            case 'gte':
              query = query.gte(filter.field, filter.value);
              break;
            case '<':
            case 'lt':
              query = query.lt(filter.field, filter.value);
              break;
            case '<=':
            case 'lte':
              query = query.lte(filter.field, filter.value);
              break;
            case 'like':
            case 'ilike':
              query = query.ilike(filter.field, `%${filter.value}%`);
              break;
            case 'in':
              query = query.in(filter.field, filter.value);
              break;
            default:
              query = query.eq(filter.field, filter.value);
          }
        }
      }

      // Aplicar ordenação
      if (options.orderBy) {
        query = query.order(options.orderBy.field, {
          ascending: options.orderBy.direction !== 'desc',
        });
      }

      // Aplicar limite
      if (options.limit) {
        query = query.limit(options.limit);
      }

      // Aplicar offset
      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as T[];
    } catch (error: any) {
      console.error(`Erro ao listar documentos de ${tableName}:`, error);
      throw new Error(`Erro ao buscar registros: ${error.message}`);
    }
  }

  /**
   * Listar com paginação e contagem total
   */
  async listWithPagination<T = any>(
    tableName: string,
    options: QueryOptions = {}
  ): Promise<PaginationResult<T>> {
    try {
      let query = supabase.from(tableName).select('*', { count: 'exact' });

      // Aplicar filtros (mesmo código de listDocuments)
      if (options.filters) {
        for (const filter of options.filters) {
          switch (filter.operator) {
            case '==':
            case 'eq':
              query = query.eq(filter.field, filter.value);
              break;
            case '!=':
            case 'neq':
              query = query.neq(filter.field, filter.value);
              break;
            case '>':
            case 'gt':
              query = query.gt(filter.field, filter.value);
              break;
            case '>=':
            case 'gte':
              query = query.gte(filter.field, filter.value);
              break;
            case '<':
            case 'lt':
              query = query.lt(filter.field, filter.value);
              break;
            case '<=':
            case 'lte':
              query = query.lte(filter.field, filter.value);
              break;
            case 'like':
            case 'ilike':
              query = query.ilike(filter.field, `%${filter.value}%`);
              break;
            case 'in':
              query = query.in(filter.field, filter.value);
              break;
            default:
              query = query.eq(filter.field, filter.value);
          }
        }
      }

      // Aplicar ordenação
      if (options.orderBy) {
        query = query.order(options.orderBy.field, {
          ascending: options.orderBy.direction !== 'desc',
        });
      }

      // Aplicar paginação
      if (options.offset !== undefined && options.limit) {
        query = query.range(options.offset, options.offset + options.limit - 1);
      } else if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error, count } = await query;

      return {
        data: (data || []) as T[],
        count,
        error,
      };
    } catch (error: any) {
      console.error(`Erro ao listar com paginação de ${tableName}:`, error);
      return {
        data: [],
        count: null,
        error,
      };
    }
  }

  /**
   * Contar documentos
   */
  async countDocuments(
    tableName: string,
    filters?: Array<{ field: string; operator: string; value: any }>
  ): Promise<number> {
    try {
      let query = supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      // Aplicar filtros
      if (filters) {
        for (const filter of filters) {
          query = query.eq(filter.field, filter.value);
        }
      }

      const { count, error } = await query;

      if (error) throw error;
      return count || 0;
    } catch (error: any) {
      console.error(`Erro ao contar documentos de ${tableName}:`, error);
      return 0;
    }
  }

  /**
   * Buscar documentos por texto (usando ILIKE)
   */
  async searchDocuments<T = any>(
    tableName: string,
    searchText: string,
    searchFields: string[]
  ): Promise<T[]> {
    try {
      // Supabase não suporta OR nativo facilmente, então fazemos múltiplas queries
      // Ou usamos a função de busca full-text se disponível
      let query = supabase.from(tableName).select('*');

      // Busca simples: concatena os campos e busca com ILIKE
      // Para busca mais avançada, considere usar full-text search do PostgreSQL
      if (searchFields.length > 0) {
        const orConditions = searchFields
          .map(field => `${field}.ilike.%${searchText}%`)
          .join(',');
        query = query.or(orConditions);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as T[];
    } catch (error: any) {
      console.error(`Erro ao buscar documentos em ${tableName}:`, error);
      return [];
    }
  }

  /**
   * Subscribe para mudanças em tempo real
   */
  subscribeToChanges<T = any>(
    tableName: string,
    callback: (payload: any) => void,
    filter?: { field: string; value: any }
  ) {
    let channel = supabase
      .channel(`${tableName}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: filter ? `${filter.field}=eq.${filter.value}` : undefined,
        },
        callback
      )
      .subscribe();

    // Retornar função para cancelar subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Executar operações em lote (batch)
   */
  async batchCreate<T = any>(
    tableName: string,
    records: Partial<T>[]
  ): Promise<T[]> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .insert(records)
        .select();

      if (error) throw error;
      return (data || []) as T[];
    } catch (error: any) {
      console.error(`Erro ao criar em lote em ${tableName}:`, error);
      throw new Error(`Erro ao criar registros em lote: ${error.message}`);
    }
  }

  /**
   * Executar query SQL customizada (usar com cuidado)
   */
  async executeRpc<T = any>(
    functionName: string,
    params?: Record<string, any>
  ): Promise<T> {
    try {
      const { data, error } = await supabase.rpc(functionName, params);

      if (error) throw error;
      return data as T;
    } catch (error: any) {
      console.error(`Erro ao executar RPC ${functionName}:`, error);
      throw new Error(`Erro ao executar função: ${error.message}`);
    }
  }
}

// Exportar instância única
export const supabaseDatabaseService = new SupabaseDatabaseService();
export default supabaseDatabaseService;

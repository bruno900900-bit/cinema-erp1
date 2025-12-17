import { supabase } from '../config/supabaseClient';

export interface CustomFilter {
  id: number;
  name: string;
  description?: string;
  filter_type: string;
  filter_data: Record<string, any>;
  is_default?: boolean;
  is_public?: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

// Custom filters may be stored locally or in Supabase
// Using localStorage as fallback

const STORAGE_KEY = 'cinema_erp_custom_filters';

function getStoredFilters(): CustomFilter[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setStoredFilters(filters: CustomFilter[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
}

export const customFilterService = {
  async getFilters(filterType?: string): Promise<CustomFilter[]> {
    try {
      let query = supabase.from('custom_filters').select('*');

      if (filterType) {
        query = query.eq('filter_type', filterType);
      }

      const { data, error } = await query;

      if (error) {
        console.warn(
          'custom_filters table may not exist, using localStorage:',
          error.message
        );
        const local = getStoredFilters();
        return filterType
          ? local.filter(f => f.filter_type === filterType)
          : local;
      }
      return data || [];
    } catch (error) {
      return getStoredFilters();
    }
  },

  async getFilter(id: number): Promise<CustomFilter | null> {
    try {
      const { data, error } = await supabase
        .from('custom_filters')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        const local = getStoredFilters();
        return local.find(f => f.id === id) || null;
      }
      return data;
    } catch (error) {
      return null;
    }
  },

  async createFilter(filter: Partial<CustomFilter>): Promise<CustomFilter> {
    try {
      const { data, error } = await supabase
        .from('custom_filters')
        .insert([filter])
        .select()
        .single();

      if (error) {
        // Fallback to localStorage
        const local = getStoredFilters();
        const newFilter: CustomFilter = {
          ...filter,
          id: Date.now(),
          created_at: new Date().toISOString(),
        } as CustomFilter;
        local.push(newFilter);
        setStoredFilters(local);
        return newFilter;
      }
      return data;
    } catch (error) {
      throw new Error('Failed to create filter');
    }
  },

  async updateFilter(
    id: number,
    filter: Partial<CustomFilter>
  ): Promise<CustomFilter> {
    try {
      const { data, error } = await supabase
        .from('custom_filters')
        .update(filter)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Fallback to localStorage
        const local = getStoredFilters();
        const index = local.findIndex(f => f.id === id);
        if (index >= 0) {
          local[index] = { ...local[index], ...filter };
          setStoredFilters(local);
          return local[index];
        }
        throw new Error('Filter not found');
      }
      return data;
    } catch (error) {
      throw new Error('Failed to update filter');
    }
  },

  async deleteFilter(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('custom_filters')
        .delete()
        .eq('id', id);

      if (error) {
        // Fallback to localStorage
        const local = getStoredFilters();
        const filtered = local.filter(f => f.id !== id);
        setStoredFilters(filtered);
        return;
      }
    } catch (error) {
      throw new Error('Failed to delete filter');
    }
  },

  async setDefaultFilter(id: number, filterType: string): Promise<void> {
    // Mark all other filters of this type as non-default
    const filters = await this.getFilters(filterType);
    for (const f of filters) {
      if (f.id !== id && f.is_default) {
        await this.updateFilter(f.id, { is_default: false });
      }
    }
    await this.updateFilter(id, { is_default: true });
  },
};

export default customFilterService;

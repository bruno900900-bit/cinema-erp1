import { supabase } from '../config/supabaseClient';

export interface Contract {
  id: number;
  title: string;
  description?: string;
  project_id?: number;
  location_id?: number;
  supplier_id?: number;
  status: 'draft' | 'pending' | 'active' | 'completed' | 'cancelled';
  value?: number;
  start_date?: string;
  end_date?: string;
  terms?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

// Contracts table may not exist yet in Supabase
const MOCK_CONTRACTS: Contract[] = [];

export const contractService = {
  async getContracts(): Promise<Contract[]> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('contracts table may not exist:', error.message);
        return MOCK_CONTRACTS;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching contracts:', error);
      return MOCK_CONTRACTS;
    }
  },

  async getContract(id: number): Promise<Contract | null> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      return null;
    }
  },

  async createContract(contract: Partial<Contract>): Promise<Contract> {
    const { data, error } = await supabase
      .from('contracts')
      .insert([contract])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateContract(
    id: number,
    contract: Partial<Contract>
  ): Promise<Contract> {
    const { data, error } = await supabase
      .from('contracts')
      .update(contract)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteContract(id: number): Promise<void> {
    const { error } = await supabase.from('contracts').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async getContractsByProject(projectId: number): Promise<Contract[]> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('project_id', projectId);

      if (error) return [];
      return data || [];
    } catch (error) {
      return [];
    }
  },

  async getContractsByLocation(locationId: number): Promise<Contract[]> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('location_id', locationId);

      if (error) return [];
      return data || [];
    } catch (error) {
      return [];
    }
  },

  async getContractsBySupplier(supplierId: number): Promise<Contract[]> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('supplier_id', supplierId);

      if (error) return [];
      return data || [];
    } catch (error) {
      return [];
    }
  },

  async generateContractPdf(contractId: number): Promise<Blob> {
    throw new Error('PDF generation not available during migration');
  },

  // Returns list of available contract templates
  getAvailableTemplates(): { id: string; name: string; description: string }[] {
    return [
      {
        id: 'location-rental',
        name: 'Contrato de Locação',
        description: 'Modelo padrão para aluguel de locação',
      },
      {
        id: 'service-provider',
        name: 'Contrato de Prestação de Serviços',
        description: 'Modelo para fornecedores de serviços',
      },
      {
        id: 'production-agreement',
        name: 'Acordo de Produção',
        description: 'Modelo para acordos de produção cinematográfica',
      },
    ];
  },
};

export default contractService;

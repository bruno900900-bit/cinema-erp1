import { supabase } from '../config/supabaseClient';
import type { User } from '../types/user';

// ===== Tipos para geração de contratos a partir de templates =====
export interface ContractParty {
  name: string;
  email: string;
  phone: string;
  address: string;
  cnpj: string;
}

export interface ContractProjectData {
  id: string | number;
  title: string;
  description: string;
  start_date: Date | string;
  end_date: Date | string;
  budget: number;
  responsible_user?: User;
}

export interface ContractRentalData {
  property_address: string;
  property_description: string;
  rental_period_start: Date | string;
  rental_period_end: Date | string;
  monthly_rent: number;
  deposit: number;
  utilities_included: boolean;
  additional_services: string[];
  additional_costs: number;
}

export interface ContractTermsData {
  payment_terms: string;
  late_payment_penalty: number;
  early_termination_penalty: number;
  maintenance_responsibility: string;
  insurance_required: boolean;
  access_restrictions: string[];
  special_conditions: string[];
}

export interface ContractData {
  project?: ContractProjectData;
  supplier?: Partial<ContractParty> & { id?: string | number };
  contractor: ContractParty;
  rental: ContractRentalData;
  terms: ContractTermsData;
}

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
}

export interface GeneratedContract {
  id?: string | number;
  title: string;
  content: string;
  generated_at: string;
  status: 'draft' | 'generated' | 'review' | 'approved' | 'signed';
  template_id?: string;
  project_id?: number;
  supplier_id?: number;
  pdf_url?: string;
}

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

  // Gera o conteúdo de um contrato a partir dos dados e de um template
  async generateContractFromTemplate(
    data: ContractData,
    templateId: string
  ): Promise<GeneratedContract> {
    const fmtDate = (d: Date | string | undefined): string => {
      if (!d) return '____/____/____';
      const date = d instanceof Date ? d : new Date(d);
      return isNaN(date.getTime())
        ? String(d)
        : date.toLocaleDateString('pt-BR');
    };
    const fmtMoney = (v?: number): string =>
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(v || 0);

    const template = this.getAvailableTemplates().find(t => t.id === templateId);
    const title = `${template?.name || 'Contrato'} - ${
      data.project?.title || 'Projeto'
    }`;

    const content = [
      `${(template?.name || 'CONTRATO').toUpperCase()}`,
      '',
      `Projeto: ${data.project?.title || '-'}`,
      data.project?.description ? `Descrição: ${data.project.description}` : '',
      `Período do projeto: ${fmtDate(data.project?.start_date)} a ${fmtDate(
        data.project?.end_date
      )}`,
      `Orçamento: ${fmtMoney(data.project?.budget)}`,
      '',
      'CONTRATANTE',
      `Nome: ${data.contractor?.name || '-'}`,
      `CNPJ: ${data.contractor?.cnpj || '-'}`,
      `E-mail: ${data.contractor?.email || '-'} | Telefone: ${
        data.contractor?.phone || '-'
      }`,
      `Endereço: ${data.contractor?.address || '-'}`,
      '',
      'FORNECEDOR / LOCADOR',
      `Nome: ${data.supplier?.name || '-'}`,
      `CNPJ: ${data.supplier?.cnpj || '-'}`,
      `E-mail: ${data.supplier?.email || '-'} | Telefone: ${
        data.supplier?.phone || '-'
      }`,
      `Endereço: ${data.supplier?.address || '-'}`,
      '',
      'OBJETO DA LOCAÇÃO',
      `Endereço do imóvel: ${data.rental?.property_address || '-'}`,
      `Descrição: ${data.rental?.property_description || '-'}`,
      `Período: ${fmtDate(data.rental?.rental_period_start)} a ${fmtDate(
        data.rental?.rental_period_end
      )}`,
      `Valor mensal: ${fmtMoney(data.rental?.monthly_rent)} | Caução: ${fmtMoney(
        data.rental?.deposit
      )}`,
      `Serviços incluídos: ${
        data.rental?.utilities_included ? 'Sim' : 'Não'
      }`,
      data.rental?.additional_services?.length
        ? `Serviços adicionais: ${data.rental.additional_services.join(', ')}`
        : '',
      '',
      'TERMOS E CONDIÇÕES',
      `Forma de pagamento: ${data.terms?.payment_terms || '-'}`,
      `Multa por atraso: ${fmtMoney(data.terms?.late_payment_penalty)}`,
      `Multa por rescisão: ${fmtMoney(data.terms?.early_termination_penalty)}`,
      `Responsável por manutenção: ${
        data.terms?.maintenance_responsibility || '-'
      }`,
      `Seguro obrigatório: ${data.terms?.insurance_required ? 'Sim' : 'Não'}`,
      data.terms?.access_restrictions?.length
        ? `Restrições de acesso: ${data.terms.access_restrictions.join('; ')}`
        : '',
      data.terms?.special_conditions?.length
        ? `Condições especiais: ${data.terms.special_conditions.join('; ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      title,
      content,
      generated_at: new Date().toISOString(),
      status: 'generated',
      template_id: templateId,
    };
  },

  // Exporta um contrato gerado para um arquivo (retorna uma URL de download)
  async exportToPDF(contract: GeneratedContract): Promise<string> {
    // Geração de PDF real depende de backend; por ora gera um arquivo de texto
    // baixável no cliente a partir do conteúdo do contrato.
    const blob = new Blob([contract.content], {
      type: 'text/plain;charset=utf-8',
    });
    return URL.createObjectURL(blob);
  },

  // Persiste um contrato gerado na tabela de contratos (best-effort)
  async saveContract(contract: GeneratedContract): Promise<Contract | null> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .insert([
          {
            title: contract.title,
            terms: contract.content,
            status: 'draft',
          },
        ])
        .select()
        .single();
      if (error) {
        console.warn('Não foi possível salvar o contrato:', error.message);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
      return null;
    }
  },

  // Returns list of available contract templates
  getAvailableTemplates(): ContractTemplate[] {
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

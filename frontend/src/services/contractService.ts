import { apiService, normalizeListResponse } from './api';

export interface Contract {
  id: string;
  title: string;
  project_id: string;
  location_id: string;
  status: 'draft' | 'pending' | 'approved' | 'signed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ContractCreate {
  title: string;
  project_id: string;
  location_id: string;
  content?: string;
}

export interface ContractUpdate {
  title?: string;
  content?: string;
  status?: 'draft' | 'pending' | 'approved' | 'signed' | 'cancelled';
}

export interface ContractData {
  project?: {
    id: string;
    title: string;
    description: string;
    start_date: Date;
    end_date: Date;
    budget: number;
    responsible_user: any;
  };
  supplier?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    cnpj: string;
  };
  contractor?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    cnpj: string;
  };
  rental?: {
    property_address: string;
    property_description: string;
    rental_period_start: Date;
    rental_period_end: Date;
    monthly_rent: number;
    deposit: number;
    utilities_included: boolean;
    additional_services: string[];
    additional_costs: number;
  };
  terms?: {
    payment_terms: string;
    late_payment_penalty: number;
    early_termination_penalty: number;
    maintenance_responsibility: string;
    insurance_required: boolean;
    access_restrictions: string[];
    special_conditions: string[];
  };
}

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface GeneratedContract {
  id: string;
  title: string;
  content: string;
  template_used: string;
  generated_at: string;
  status: string;
}

class ContractService {
  async getContracts(): Promise<Contract[]> {
    try {
      const response = await apiService.get<any>('/contracts');
      return normalizeListResponse<Contract>(response, [
        'contracts',
        'items',
        'results',
      ]);
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
      return [];
    }
  }

  async getContract(id: string): Promise<Contract> {
    try {
      const response = await apiService.get(`/contracts/${id}`);
      return response as Contract;
    } catch (error) {
      console.error('Erro ao buscar contrato:', error);
      throw new Error('Erro ao buscar contrato');
    }
  }

  async createContract(contract: ContractCreate): Promise<Contract> {
    try {
      const response = await apiService.post('/contracts', contract);
      return response as Contract;
    } catch (error) {
      console.error('Erro ao criar contrato:', error);
      throw new Error('Erro ao criar contrato');
    }
  }

  async updateContract(
    id: string,
    contract: ContractUpdate
  ): Promise<Contract> {
    try {
      const response = await apiService.put(`/contracts/${id}`, contract);
      return response as Contract;
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error);
      throw new Error('Erro ao atualizar contrato');
    }
  }

  async deleteContract(id: string): Promise<void> {
    try {
      await apiService.delete(`/contracts/${id}`);
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
      throw new Error('Erro ao excluir contrato');
    }
  }

  async generateContract(
    projectId: string,
    locationId: string
  ): Promise<Contract> {
    try {
      const response = await apiService.post('/contracts/generate', {
        project_id: projectId,
        location_id: locationId,
      });
      return response as Contract;
    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
      throw new Error('Erro ao gerar contrato');
    }
  }

  // Métodos para o ContractGenerationModal
  getAvailableTemplates(): ContractTemplate[] {
    return [
      {
        id: 'rental_property',
        name: 'Contrato de Locação de Imóvel',
        description: 'Template padrão para locação de propriedades',
        category: 'Locação',
      },
      {
        id: 'equipment_rental',
        name: 'Contrato de Locação de Equipamentos',
        description: 'Template para locação de equipamentos de produção',
        category: 'Equipamentos',
      },
      {
        id: 'service_provider',
        name: 'Contrato de Prestação de Serviços',
        description: 'Template para contratos de serviços',
        category: 'Serviços',
      },
    ];
  }

  async generateContractFromTemplate(
    data: ContractData,
    templateId: string
  ): Promise<GeneratedContract> {
    try {
      // Simular geração de contrato
      const contract: GeneratedContract = {
        id: `contract_${Date.now()}`,
        title: `Contrato - ${data.project?.title || 'Projeto'}`,
        content: this.generateContractContent(data, templateId),
        template_used: templateId,
        generated_at: new Date().toISOString(),
        status: 'draft',
      };
      return contract;
    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
      throw new Error('Erro ao gerar contrato');
    }
  }

  private generateContractContent(
    data: ContractData,
    templateId: string
  ): string {
    // Gerar conteúdo do contrato baseado no template
    return `
CONTRATO DE LOCAÇÃO

Projeto: ${data.project?.title || ''}
Fornecedor: ${data.supplier?.name || ''}
Período: ${data.rental?.rental_period_start?.toLocaleDateString() || ''} a ${
      data.rental?.rental_period_end?.toLocaleDateString() || ''
    }
Valor: R$ ${data.rental?.monthly_rent || 0}

Termos e condições conforme acordado.
    `.trim();
  }

  async exportToPDF(contract: GeneratedContract): Promise<string> {
    try {
      // Simular exportação para PDF
      const blob = new Blob([contract.content], { type: 'text/plain' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      throw new Error('Erro ao exportar PDF');
    }
  }

  async saveContract(contract: GeneratedContract): Promise<Contract> {
    try {
      const contractData: ContractCreate = {
        title: contract.title,
        project_id: '1', // ID do projeto
        location_id: '1', // ID da locação
        content: contract.content,
      };
      return await this.createContract(contractData);
    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
      throw new Error('Erro ao salvar contrato');
    }
  }
}

export const contractService = new ContractService();

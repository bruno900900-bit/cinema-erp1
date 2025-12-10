import * as XLSX from 'xlsx';
import { Project, ProjectLocation, RentalStatus } from '@/types/user';
import { formatDateBR } from '@/utils/date';

class ProjectReportService {
  /**
   * Exporta um relatório completo do projeto para Excel
   */
  exportProjectReport(project: Project, locations: ProjectLocation[]) {
    const wb = XLSX.utils.book_new();

    // 1. Aba de Resumo do Projeto
    this.createSummarySheet(wb, project, locations);

    // 2. Aba de Locações
    this.createLocationsSheet(wb, locations);

    // Salvar arquivo
    const fileName = `Relatorio_Projeto_${project.title.replace(/\s+/g, '_')}_${
      new Date().toISOString().split('T')[0]
    }.xlsx`;

    XLSX.writeFile(wb, fileName);
  }

  private createSummarySheet(
    wb: XLSX.WorkBook,
    project: Project,
    locations: ProjectLocation[]
  ) {
    // Calcular totais
    const totalLocations = locations.length;
    const totalCost = locations.reduce(
      (sum, loc) => sum + (loc.total_cost || 0),
      0
    );
    const completedLocations = locations.filter(
      l => l.status === RentalStatus.RETURNED
    ).length;

    const summaryData = [
      ['RESUMO DO PROJETO', ''],
      ['', ''],
      ['Título', project.title],
      ['Cliente', project.client_name || 'N/A'],
      ['Status', project.status],
      ['Responsável', project.responsibleUserId || 'N/A'], // Idealmente buscar nome do user
      ['Data Início', formatDateBR(project.start_date) || 'N/A'],
      ['Data Fim', formatDateBR(project.end_date) || 'N/A'],
      ['', ''],
      ['ESTATÍSTICAS', ''],
      ['Total de Locações', totalLocations],
      ['Locações Concluídas', completedLocations],
      ['Custo Total Locações', this.formatCurrency(totalCost)],
      ['Orçamento Projeto', this.formatCurrency(project.budget || 0)],
      [
        'Saldo Restante (Estimado)',
        this.formatCurrency((project.budget || 0) - totalCost),
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(summaryData);

    // Estilização básica (largura das colunas)
    ws['!cols'] = [{ wch: 25 }, { wch: 40 }];

    XLSX.utils.book_append_sheet(wb, ws, 'Resumo');
  }

  private createLocationsSheet(
    wb: XLSX.WorkBook,
    locations: ProjectLocation[]
  ) {
    // Cabeçalhos
    const headers = [
      'ID',
      'Nome da Locação',
      'Status',
      'Custo Total',
      'Início Aluguel',
      'Fim Aluguel',
      'Visitação',
      'Visita Técnica',
      'Gravação Início',
      'Gravação Fim',
      'Entrega',
      'Observações',
    ];

    const data = locations.map(loc => [
      loc.location_id,
      loc.location?.title || `Locação #${loc.location_id}`,
      this.translateStatus(loc.status),
      this.formatCurrency(loc.total_cost || 0),
      formatDateBR(loc.rental_start),
      formatDateBR(loc.rental_end),
      formatDateBR(loc.visit_date),
      formatDateBR(loc.technical_visit_date),
      formatDateBR(loc.filming_start_date),
      formatDateBR(loc.filming_end_date),
      formatDateBR(loc.delivery_date),
      loc.notes || '',
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // Ajustar largura das colunas
    ws['!cols'] = [
      { wch: 5 }, // ID
      { wch: 30 }, // Nome
      { wch: 15 }, // Status
      { wch: 15 }, // Custo
      { wch: 12 }, // Inicio
      { wch: 12 }, // Fim
      { wch: 12 }, // Visita
      { wch: 12 }, // Tecnica
      { wch: 12 }, // Grav Ini
      { wch: 12 }, // Grav Fim
      { wch: 12 }, // Entrega
      { wch: 50 }, // Obs
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Locações Detalhadas');
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  private translateStatus(status: RentalStatus): string {
    const statusMap: Record<string, string> = {
      [RentalStatus.RESERVED]: 'Reservado',
      [RentalStatus.CONFIRMED]: 'Confirmado',
      [RentalStatus.IN_USE]: 'Em Uso',
      [RentalStatus.RETURNED]: 'Devolvido',
      [RentalStatus.OVERDUE]: 'Atrasado',
      [RentalStatus.CANCELLED]: 'Cancelado',
    };
    return statusMap[status] || status;
  }
}

export const projectReportService = new ProjectReportService();

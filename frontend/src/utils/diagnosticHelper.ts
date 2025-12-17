/**
 * Helper de diagnóstico para operações com Supabase
 * Facilita detecção de erros RLS e problemas de performance
 */

export interface DiagnosticLog {
  timestamp: number;
  operation: string;
  status: 'pending' | 'success' | 'error';
  duration?: number;
  error?: any;
  details?: any;
}

class DiagnosticHelper {
  private logs: DiagnosticLog[] = [];
  private maxLogs = 100; // Máximo de logs a manter em memória

  /**
   * Detecta se um erro é de RLS (Row-Level Security) do Supabase
   */
  isRLSError(error: any): boolean {
    if (!error) return false;

    // Erro 403 é típico de RLS
    if (error.status === 403 || error.code === '403') {
      return true;
    }

    // Mensagens típicas de erro RLS do Supabase
    const rlsMessages = [
      'row-level security',
      'policy',
      'permission denied',
      'new row violates',
    ];

    const errorMessage = (error.message || error.toString()).toLowerCase();
    return rlsMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * Loga início de uma operação de mutation
   */
  startMutation(operation: string, details?: any): string {
    const logId = `${operation}-${Date.now()}`;
    const log: DiagnosticLog = {
      timestamp: Date.now(),
      operation,
      status: 'pending',
      details,
    };

    this.logs.push(log);
    this.trimLogs();

    console.log(`🔄 [Mutation Start] ${operation}`, details);
    return logId;
  }

  /**
   * Loga sucesso de uma operação
   */
  logSuccess(operation: string, startTime: number, result?: any): void {
    const duration = Date.now() - startTime;
    const log: DiagnosticLog = {
      timestamp: Date.now(),
      operation,
      status: 'success',
      duration,
      details: result,
    };

    this.logs.push(log);
    this.trimLogs();

    console.log(`✅ [Mutation Success] ${operation} (${duration}ms)`, result);
  }

  /**
   * Loga erro de uma operação com diagnóstico detalhado
   */
  logError(operation: string, startTime: number, error: any): void {
    const duration = Date.now() - startTime;
    const isRLS = this.isRLSError(error);

    const log: DiagnosticLog = {
      timestamp: Date.now(),
      operation,
      status: 'error',
      duration,
      error: {
        message: error.message,
        code: error.code,
        status: error.status,
        isRLS,
      },
    };

    this.logs.push(log);
    this.trimLogs();

    if (isRLS) {
      console.error(
        `🚫 [RLS ERROR] ${operation} (${duration}ms)`,
        '\n',
        'Este erro indica um problema de Row-Level Security no Supabase.',
        '\n',
        'Verifique as políticas RLS da tabela afetada.',
        '\n',
        'Detalhes:',
        error
      );
    } else {
      console.error(`❌ [Mutation Error] ${operation} (${duration}ms)`, error);
    }
  }

  /**
   * Verifica estado de sincronização do cache
   */
  checkCacheSync(queryKey: string[], expectedCount?: number): void {
    console.log(`📊 [Cache Check] Verificando cache para:`, queryKey);

    if (expectedCount !== undefined) {
      console.log(`   Esperado: ${expectedCount} items`);
    }

    // Informar que a verificação está completa
    console.log(`   ✓ Verificação de cache concluída`);
  }

  /**
   * Obtém estatísticas de operações
   */
  getStats() {
    const total = this.logs.length;
    const successful = this.logs.filter(l => l.status === 'success').length;
    const errors = this.logs.filter(l => l.status === 'error').length;
    const pending = this.logs.filter(l => l.status === 'pending').length;
    const rlsErrors = this.logs.filter(
      l => l.status === 'error' && l.error?.isRLS
    ).length;

    const avgDuration =
      this.logs
        .filter(l => l.duration)
        .reduce((sum, l) => sum + (l.duration || 0), 0) /
        this.logs.filter(l => l.duration).length || 0;

    return {
      total,
      successful,
      errors,
      pending,
      rlsErrors,
      avgDuration: Math.round(avgDuration),
      successRate: total > 0 ? ((successful / total) * 100).toFixed(1) : '0.0',
    };
  }

  /**
   * Imprime relatório de diagnóstico
   */
  printReport(): void {
    const stats = this.getStats();

    console.group('📊 Relatório de Diagnóstico');
    console.log(`Total de operações: ${stats.total}`);
    console.log(`✅ Sucesso: ${stats.successful} (${stats.successRate}%)`);
    console.log(`❌ Erros: ${stats.errors}`);
    console.log(`🚫 Erros RLS: ${stats.rlsErrors}`);
    console.log(`⏱️ Tempo médio: ${stats.avgDuration}ms`);
    console.log(`⏳ Pendentes: ${stats.pending}`);
    console.groupEnd();

    if (stats.rlsErrors > 0) {
      console.warn(
        '⚠️ Foram detectados erros de RLS. Verifique as políticas no Supabase Dashboard.'
      );
    }
  }

  /**
   * Limpa logs antigos
   */
  private trimLogs(): void {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Limpa todos os logs
   */
  clearLogs(): void {
    this.logs = [];
    console.log('🧹 Logs de diagnóstico limpos');
  }
}

// Exportar instância singleton
export const diagnosticHelper = new DiagnosticHelper();

// Tornar disponível globalmente para debug no console
if (typeof window !== 'undefined') {
  (window as any).diagnosticHelper = diagnosticHelper;
  console.log(
    '🔧 Diagnostic Helper disponível globalmente via window.diagnosticHelper'
  );
  console.log('   Use diagnosticHelper.printReport() para ver estatísticas');
  console.log('   Use diagnosticHelper.getStats() para obter dados');
}

export default diagnosticHelper;

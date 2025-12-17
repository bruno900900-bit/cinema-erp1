import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { useRef, useCallback } from 'react';

/**
 * Hook otimizado para queries com configurações inteligentes de cache e retry
 * Implementa request deduplication automática
 */

interface OptimizedQueryOptions<TData, TError = Error>
  extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  queryKey: QueryKey;
  queryFn: () => Promise<TData>;
  /**
   * Categoria de dados para configuração automática de cache
   * - static: dados que raramente mudam (configs, enums) - staleTime: 30min
   * - reference: dados de referência (tags, suppliers) - staleTime: 10min
   * - dynamic: dados que mudam com frequência (locations, projects) - staleTime: 2min
   * - realtime: dados em tempo real (notifications) - staleTime: 30s
   */
  dataCategory?: 'static' | 'reference' | 'dynamic' | 'realtime';
}

/**
 * Configurações de cache por categoria
 */
const CACHE_CONFIG = {
  static: {
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  reference: {
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  dynamic: {
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  },
  realtime: {
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 60 * 1000, // Refetch a cada 1 minuto
  },
};

/**
 * Retry logic inteligente baseado no tipo de erro
 */
const intelligentRetry = (failureCount: number, error: any) => {
  // Erros que não devem ser retentados
  const nonRetriableErrors = [
    'ValidationError',
    'ForbiddenError',
    'UnauthorizedError',
    'NotFoundError',
  ];

  if (
    error?.name &&
    nonRetriableErrors.some(name => error.name.includes(name))
  ) {
    return false;
  }

  // RLS errors não devem ser retentados
  if (error?.code === '42501' || error?.message?.includes('policy')) {
    console.error('🚫 RLS Error detected - não retentando:', error);
    return false;
  }

  // Network errors - retry até 3 vezes
  if (error?.name === 'NetworkError' || error?.code === 'ERR_NETWORK') {
    return failureCount < 3;
  }

  // Timeout errors - retry até 2 vezes
  if (error?.code === 'ETIMEDOUT' || error?.message?.includes('timeout')) {
    return failureCount < 2;
  }

  // Outros erros - retry 1 vez
  return failureCount < 1;
};

/**
 * Delay com backoff exponencial
 */
const exponentialBackoff = (attemptIndex: number) => {
  return Math.min(1000 * 2 ** attemptIndex, 30000);
};

/**
 * Hook otimizado para queries
 */
export function useOptimizedQuery<TData = unknown, TError = Error>(
  options: OptimizedQueryOptions<TData, TError>
) {
  const {
    queryKey,
    queryFn,
    dataCategory = 'dynamic',
    ...restOptions
  } = options;

  // Request deduplication - armazena promise da última request
  const pendingRequestRef = useRef<Promise<TData> | null>(null);

  // QueryFn com deduplication
  const optimizedQueryFn = useCallback(async () => {
    // Se já existe uma request em andamento, reutiliza
    if (pendingRequestRef.current) {
      console.log('🔄 Reusing pending request for:', queryKey);
      return pendingRequestRef.current;
    }

    // Cria nova request
    const requestPromise = queryFn();
    pendingRequestRef.current = requestPromise;

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Limpa referência após completar
      pendingRequestRef.current = null;
    }
  }, [queryFn, queryKey]);

  // Configuração baseada na categoria
  const categoryConfig = CACHE_CONFIG[dataCategory];

  // Merge das configurações
  const finalOptions = {
    queryKey,
    queryFn: optimizedQueryFn,
    ...categoryConfig,
    ...restOptions,
    retry: restOptions.retry ?? intelligentRetry,
    retryDelay: restOptions.retryDelay ?? exponentialBackoff,
  };

  return useQuery<TData, TError>(finalOptions);
}

/**
 * Hook para queries que devem ser executadas apenas quando habilitadas
 * Útil para tabs, modals, etc
 */
export function useConditionalQuery<TData = unknown, TError = Error>(
  options: OptimizedQueryOptions<TData, TError> & { enabled: boolean }
) {
  return useOptimizedQuery({
    ...options,
    // Garante que não executa quando disabled
    enabled: options.enabled,
    // Quando disabled, mantém dados em cache por mais tempo
    gcTime: options.enabled ? options.gcTime : 30 * 60 * 1000,
  });
}

/**
 * Hook para queries de dados de referência (tags, suppliers, etc)
 */
export function useReferenceQuery<TData = unknown, TError = Error>(
  options: Omit<OptimizedQueryOptions<TData, TError>, 'dataCategory'>
) {
  return useOptimizedQuery({
    ...options,
    dataCategory: 'reference',
  });
}

/**
 * Hook para queries de dados estáticos (configs, enums, etc)
 */
export function useStaticQuery<TData = unknown, TError = Error>(
  options: Omit<OptimizedQueryOptions<TData, TError>, 'dataCategory'>
) {
  return useOptimizedQuery({
    ...options,
    dataCategory: 'static',
  });
}

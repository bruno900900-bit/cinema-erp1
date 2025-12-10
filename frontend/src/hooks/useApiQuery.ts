import {
  UseQueryOptions,
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

export interface ApiQueryOptions<TData = unknown, TError = Error>
  extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  showErrorToast?: boolean;
  errorMessage?: string;
  queryKey: readonly unknown[];
  queryFn: () => Promise<TData>;
}

export function useApiQuery<TData = unknown, TError = Error>(
  options: ApiQueryOptions<TData, TError>
): UseQueryResult<TData, TError> {
  const { showErrorToast = true, errorMessage, ...queryOptions } = options;

  const query = useQuery({
    ...queryOptions,
    queryKey: options.queryKey,
    queryFn: options.queryFn,
  });

  // Handle error with useEffect
  useEffect(() => {
    if (query.error && showErrorToast) {
      console.error(
        `❌ Query Error [${queryOptions.queryKey?.join('/')}]:`,
        query.error
      );

      let message = errorMessage || 'Erro ao carregar dados';

      // Type assertion for error to access properties
      const error = query.error as any;

      if (error?.name === 'ValidationError') {
        message = 'Dados inválidos fornecidos';
      } else if (error?.name === 'NetworkError') {
        message = 'Erro de conexão. Verifique sua internet.';
      } else if (error?.name === 'ForbiddenError') {
        message = 'Acesso negado';
      } else if (error?.name === 'NotFoundError') {
        message = 'Recurso não encontrado';
      } else if (error?.name === 'ServerError') {
        message = 'Erro interno do servidor';
      } else if (error?.message) {
        message = error.message;
      }

      toast.error(message, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  }, [query.error, showErrorToast, errorMessage, queryOptions.queryKey]);

  // Handle success with useEffect
  useEffect(() => {
    if (query.data && query.isSuccess) {
      console.log(
        `✅ Query Success [${queryOptions.queryKey?.join('/')}]:`,
        query.data
      );
    }
  }, [query.data, query.isSuccess, queryOptions.queryKey]);

  return query;
}

// Simplified version for basic queries
export function useApiQuerySimple<TData = unknown>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  options?: {
    showErrorToast?: boolean;
    errorMessage?: string;
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
  }
): UseQueryResult<TData, Error> {
  const {
    showErrorToast = true,
    errorMessage,
    ...queryOptions
  } = options || {};

  const query = useQuery({
    queryKey,
    queryFn,
    ...queryOptions,
  });

  useEffect(() => {
    if (query.error && showErrorToast) {
      console.error(`❌ Query Error [${queryKey?.join('/')}]:`, query.error);

      const message = errorMessage || 'Erro ao carregar dados';
      toast.error(message, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  }, [query.error, showErrorToast, errorMessage, queryKey]);

  return query;
}

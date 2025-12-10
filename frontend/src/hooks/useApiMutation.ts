import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';

// Hook personalizado para mutations da API com tratamento de erro melhorado
export function useApiMutation<
  TData = unknown,
  TVariables = unknown,
  TError = Error
>(
  options: UseMutationOptions<TData, TError, TVariables> & {
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    successMessage?: string;
    errorMessage?: string;
    invalidateQueries?: string[];
  }
): UseMutationResult<TData, TError, TVariables> {
  const {
    showSuccessToast = true,
    showErrorToast = true,
    successMessage,
    errorMessage,
    invalidateQueries = [],
    ...mutationOptions
  } = options;

  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...mutationOptions,
    onSuccess: (data, variables, context) => {
      // Log de sucesso
      console.log('✅ Mutation Success:', { data, variables });

      // Mostrar toast de sucesso se habilitado
      if (showSuccessToast) {
        const message = successMessage || 'Operação realizada com sucesso!';
        toast.success(message, {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }

      // Invalidar queries relacionadas
      if (invalidateQueries.length > 0) {
        invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }

      // Chamar callback de sucesso original se existir
      if (mutationOptions.onSuccess) {
        mutationOptions.onSuccess(data, variables, context);
      }
    },
    onError: (error: any, variables, context) => {
      // Log do erro
      console.error('❌ Mutation Error:', { error, variables });

      // Mostrar toast de erro se habilitado
      if (showErrorToast) {
        let message = errorMessage || 'Erro ao realizar operação';

        // Personalizar mensagem baseada no tipo de erro
        if (error?.name === 'ValidationError') {
          message = 'Dados inválidos fornecidos';
        } else if (error?.name === 'NetworkError') {
          message = 'Erro de conexão. Tente novamente.';
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

      // Chamar callback de erro original se existir
      if (mutationOptions.onError) {
        mutationOptions.onError(error, variables, context);
      }
    },
  });

  return mutation;
}

// Hook para mutations de criação
export function useCreateMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    successMessage?: string;
    errorMessage?: string;
    invalidateQueries?: string[];
  } = {}
): UseMutationResult<TData, Error, TVariables> {
  return useApiMutation({
    mutationFn,
    successMessage: options.successMessage || 'Item criado com sucesso!',
    errorMessage: options.errorMessage || 'Erro ao criar item',
    invalidateQueries: options.invalidateQueries || [],
  });
}

// Hook para mutations de atualização
export function useUpdateMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    successMessage?: string;
    errorMessage?: string;
    invalidateQueries?: string[];
  } = {}
): UseMutationResult<TData, Error, TVariables> {
  return useApiMutation({
    mutationFn,
    successMessage: options.successMessage || 'Item atualizado com sucesso!',
    errorMessage: options.errorMessage || 'Erro ao atualizar item',
    invalidateQueries: options.invalidateQueries || [],
  });
}

// Hook para mutations de exclusão
export function useDeleteMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    successMessage?: string;
    errorMessage?: string;
    invalidateQueries?: string[];
  } = {}
): UseMutationResult<TData, Error, TVariables> {
  return useApiMutation({
    mutationFn,
    successMessage: options.successMessage || 'Item excluído com sucesso!',
    errorMessage: options.errorMessage || 'Erro ao excluir item',
    invalidateQueries: options.invalidateQueries || [],
  });
}

// Hook para mutations de upload
export function useUploadMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    successMessage?: string;
    errorMessage?: string;
    invalidateQueries?: string[];
  } = {}
): UseMutationResult<TData, Error, TVariables> {
  return useApiMutation({
    mutationFn,
    successMessage: options.successMessage || 'Upload realizado com sucesso!',
    errorMessage: options.errorMessage || 'Erro ao fazer upload',
    invalidateQueries: options.invalidateQueries || [],
  });
}

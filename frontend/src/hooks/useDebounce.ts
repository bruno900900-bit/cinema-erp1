import { useEffect, useState, useRef } from 'react';

/**
 * Hook de debounce para otimizar inputs de busca
 * Evita múltiplas chamadas à API durante digitação
 *
 * @param value - Valor a ser debounced
 * @param delay - Delay em ms (padrão: 500ms)
 * @returns Valor debounced
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   // Esta função só executa 500ms após parar de digitar
 *   if (debouncedSearchTerm) {
 *     performSearch(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Configura o timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpa o timeout se value mudar antes do delay
    // Ou se o componente desmontar
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook de debounce com callback
 * Útil quando você quer executar uma função após debounce
 *
 * @param callback - Função a ser executada
 * @param delay - Delay em ms (padrão: 500ms)
 * @returns Função debounced
 *
 * @example
 * const debouncedSearch = useDebouncedCallback((term: string) => {
 *   performSearch(term);
 * }, 500);
 *
 * // No input handler
 * onChange={(e) => debouncedSearch(e.target.value)}
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Cleanup ao desmontar
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

/**
 * Hook para detectar mudanças com debounce e tracking
 * Útil para mostrar indicador de "salvando..." ou "pesquisando..."
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 500
): [T, (value: T) => void, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    // Se o valor mudou, marca como pending
    if (value !== debouncedValue) {
      setIsPending(true);
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
      setIsPending(false);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [debouncedValue, setValue, isPending];
}

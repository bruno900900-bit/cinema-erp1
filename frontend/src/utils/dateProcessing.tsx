import { useMemo, ComponentType } from 'react';

// Supabase usa timestamps PostgreSQL padrão (strings ISO)
const isValidDate = (value: unknown): boolean => {
  if (!value) return false;

  if (value instanceof Date && !Number.isNaN(value.getTime())) return true;

  if (typeof value === 'number' && !Number.isNaN(value)) {
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  }

  // Compatibilidade com objetos que têm toDate (legado Firebase)
  if (value && typeof (value as any).toDate === 'function') {
    return true;
  }

  return false;
};

const convertToDate = (value: unknown): Date | null => {
  if (!value) return null;

  try {
    // Compatibilidade com objetos Firebase Timestamp legados
    if (value && typeof (value as any).toDate === 'function') {
      return (value as any).toDate();
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'number' || typeof value === 'string') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    return null;
  } catch (error) {
    console.warn('Error converting date:', error);
    return null;
  }
};

const shouldProcessKey = (key: string): boolean =>
  key.includes('date') ||
  key.includes('Date') ||
  key.includes('_at') ||
  key.includes('_At');

const processDateFields = <T,>(obj: T): T => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => processDateFields(item)) as unknown as T;
  }

  if (obj instanceof Date) {
    return convertToDate(obj) as unknown as T;
  }

  // Compatibilidade com objetos Firebase Timestamp legados
  if (obj && typeof (obj as any).toDate === 'function') {
    return convertToDate(obj) as unknown as T;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  const result: Record<string, unknown> = {};

  Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      result[key] = value;
      return;
    }

    if (shouldProcessKey(key) && isValidDate(value)) {
      result[key] = convertToDate(value);
      return;
    }

    if (typeof value === 'object') {
      result[key] = processDateFields(value);
      return;
    }

    result[key] = value;
  });

  return result as T;
};

export const withDateProcessing = <P extends object>(
  WrappedComponent: ComponentType<P>
) => {
  function WithDateProcessing(props: P) {
    const processedProps = useMemo(() => processDateFields(props), [props]);
    return <WrappedComponent {...(processedProps as P)} />;
  }

  WithDateProcessing.displayName = `WithDateProcessing(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithDateProcessing;
};

export const useDateProcessing = <T,>(data: T): T => {
  return useMemo(() => processDateFields(data), [data]);
};

export const processDates = <T,>(data: T): T => processDateFields(data);

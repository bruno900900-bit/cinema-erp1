// Supabase usa timestamps PostgreSQL padrão, não precisa de imports especiais

export const ensureValidDate = value => {
  if (!value) return null;

  try {
    // Se for uma string ISO (formato padrão do PostgreSQL/Supabase)
    if (typeof value === 'string') {
      return new Date(value);
    }

    // Se for um número (timestamp)
    if (typeof value === 'number') {
      return new Date(value);
    }

    // Se for um objeto Date
    if (value instanceof Date) {
      return value;
    }

    // Se for um objeto com propriedade toDate (compatibilidade legada)
    if (value && typeof value.toDate === 'function') {
      return value.toDate();
    }

    // Se não for possível converter, retorna null
    return null;
  } catch (error) {
    console.warn('Error converting date:', error);
    return null;
  }
};

export const processDocDates = doc => {
  if (!doc) return doc;

  const dateFields = [
    'created_at',
    'updated_at',
    'date',
    'start_date',
    'end_date',
  ];
  const data = { ...doc };

  dateFields.forEach(field => {
    if (field in data) {
      data[field] = ensureValidDate(data[field]);
    }
  });

  return data;
};

// Uso com hooks do React
export const useProcessedDoc = doc => {
  return React.useMemo(() => processDocDates(doc), [doc]);
};

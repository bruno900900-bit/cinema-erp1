// Safe date parsing/formatting helpers to avoid "Invalid time value" errors

// Try to parse various inputs into a valid Date, otherwise return null
export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string') {
    // Accept YYYY-MM-DD or ISO strings
    const s = value.trim();
    if (!s) return null;
    // Normalize date-only to ISO by appending T00:00:00Z (avoid timezone shift on display-only)
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(s);
    const candidate = isDateOnly ? `${s}T00:00:00` : s;
    const d = new Date(candidate);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

// Format value as pt-BR date, falling back to "-" if invalid
export function formatDateBR(value: unknown): string {
  const d = toDate(value);
  if (!d) return '-';
  try {
    return new Intl.DateTimeFormat('pt-BR').format(d);
  } catch {
    return '-';
  }
}

// Format value for input[type=date] (YYYY-MM-DD) or return empty string
export function toInputDate(value: unknown): string {
  const d = toDate(value);
  if (!d) return '';
  try {
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

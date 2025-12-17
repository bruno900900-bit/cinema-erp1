// src/utils/withDiagnostic.ts
import { diagnosticHelper } from './diagnosticHelper';

/**
 * Wrap an async operation with diagnostic logging.
 * Logs success with duration and result, or error with RLS detection.
 */
export async function withDiagnostic<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    diagnosticHelper.logSuccess(operation, start, result);
    return result;
  } catch (e) {
    diagnosticHelper.logError(operation, start, e as any);
    throw e;
  }
}

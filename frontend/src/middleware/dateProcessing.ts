import { processDates } from '../utils/dateProcessing';

type AnyAction = {
  type: string;
  payload?: unknown;
  [key: string]: unknown;
};

type Next = (action: AnyAction) => unknown;

export const dateProcessingMiddleware =
  (_state?: unknown) => (next: Next) => (action: AnyAction) => {
    if (
      typeof action?.type === 'string' &&
      (action.type.includes('SET_') || action.type.includes('FETCH_SUCCESS')) &&
      Object.prototype.hasOwnProperty.call(action, 'payload') &&
      action.payload !== undefined
    ) {
      const processedPayload = processDates(action.payload);

      if (processedPayload !== action.payload) {
        action = { ...action, payload: processedPayload };
      }
    }

    return next(action);
  };









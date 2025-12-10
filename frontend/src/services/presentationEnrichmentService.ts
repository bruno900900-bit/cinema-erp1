import { apiService } from './api';

export interface EnrichmentOptions {
  improveTitles?: boolean;
  generateNotes?: boolean;
  fillMissingCaptions?: boolean;
  executiveSummary?: boolean;
}

export async function enrichPresentation(
  payload: any,
  options: EnrichmentOptions = {}
) {
  const body = {
    presentation: payload,
    options: {
      improveTitles: options.improveTitles !== false,
      generateNotes: options.generateNotes !== false,
      fillMissingCaptions: options.fillMissingCaptions !== false,
      executiveSummary: !!options.executiveSummary,
    },
  };
  return apiService.post('/presentations/enrich', body);
}

export async function exportServerPresentation(payload: any, useAI = false) {
  const body = { presentation: payload, exportOptions: { useAI } };
  return apiService.post('/presentations/export', body);
}

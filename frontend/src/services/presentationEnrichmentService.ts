// Presentation Enrichment Service - Migrated to mock
// AI enrichment requires backend processing

export const enrichPresentation = async (data: any): Promise<any> => {
  console.warn('AI enrichment not available during migration');
  return data; // Return unchanged data
};

export const exportEnrichedPresentation = async (data: any): Promise<Blob> => {
  console.warn('Export enrichment not available during migration');
  throw new Error('Exportação de apresentação temporariamente indisponível');
};

export default { enrichPresentation, exportEnrichedPresentation };

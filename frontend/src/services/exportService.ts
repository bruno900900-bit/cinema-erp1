// Export Service - Migrated to client-side mock
// Export functionality would require server-side processing or client-side implementation

export interface LocationPhotoSelection {
  location_id: number;
  photo_ids: number[];
}

export interface PresentationExportData {
  location_ids: number[];
  order?: number[];
  include_photos?: boolean;
  include_summary?: boolean;
  template_name?: string;
  title?: string;
  subtitle?: string;
  selected_photos?: LocationPhotoSelection[];
}

export const exportService = {
  async exportLocations(params: any): Promise<Blob> {
    console.warn(
      'Export functionality not available during Supabase migration'
    );
    throw new Error(
      'Funcionalidade de exportação temporariamente indisponível'
    );
  },

  async generatePresentation(data: any): Promise<{ file_id: string }> {
    console.warn('Presentation generation not available during migration');
    throw new Error('Geração de apresentação temporariamente indisponível');
  },

  async exportPresentation(data: PresentationExportData): Promise<Blob> {
    console.warn('Presentation export not available during migration');
    console.log('Export data:', data);
    throw new Error(
      'Exportação de apresentação temporariamente indisponível. Esta funcionalidade requer processamento no servidor.'
    );
  },

  async downloadFile(fileId: string): Promise<Blob> {
    console.warn('File download not available during migration');
    throw new Error('Download de arquivo temporariamente indisponível');
  },
};

export default exportService;

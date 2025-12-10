import { apiService } from './api';

export interface LocationPhotoSelection {
  location_id: number;
  photo_ids: number[];
}

export interface PresentationExportData {
  location_ids: number[];
  order: number[];
  include_photos: boolean;
  include_summary: boolean;
  template_name: string;
  title?: string;
  subtitle?: string;
  selected_photos?: LocationPhotoSelection[];
}

export const exportService = {
  /**
   * Exporta locações para apresentação PowerPoint
   */
  exportPresentation: async (data: PresentationExportData): Promise<Blob> => {
    const response = await apiService.post<Blob>(
      '/export/presentation/download',
      data,
      {
        responseType: 'blob',
      }
    );
    return response;
  },

  /**
   * Gera apresentação e retorna informações do arquivo
   */
  generatePresentation: async (data: PresentationExportData) => {
    const response = await apiService.post('/export/presentation', data);
    return response;
  },

  /**
   * Faz download de uma apresentação gerada anteriormente
   */
  downloadPresentation: async (
    fileId: string,
    data: PresentationExportData
  ): Promise<Blob> => {
    const response = await apiService.get<Blob>(`/export/download/${fileId}`, {
      data,
      responseType: 'blob',
    });
    return response;
  },
};

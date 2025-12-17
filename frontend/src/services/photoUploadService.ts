import { supabase } from '../config/supabaseClient';

export interface PhotoUploadResponse {
  message: string;
  location_id: string;
  uploaded_photos: {
    id: number;
    filename: string;
    url: string;
    size?: number;
    uploaded_at: string;
  }[];
  total_photos: number;
}

export interface PhotoListResponse {
  location_id: string;
  photos: {
    id: number;
    url: string;
    filename?: string;
    exists: boolean;
    thumbnail_url?: string;
    is_primary?: boolean;
    caption?: string;
  }[];
  total: number;
}

/**
 * Serviço unificado para upload de fotos - Migrado para Supabase
 */
export const photoUploadService = {
  /**
   * Faz upload de fotos para uma locação via Supabase Storage
   */
  async uploadPhotos(
    locationId: string | number,
    files: File[]
  ): Promise<PhotoUploadResponse> {
    try {
      const uploadedPhotos: any[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${locationId}/${Date.now()}_${i}.${fileExt}`;

        // 1. Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('location-photos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Erro no upload storage:', uploadError);
          continue;
        }

        // 2. Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('location-photos').getPublicUrl(fileName);

        // 3. Save to location_photos table
        const { data: photoRecord, error: dbError } = await supabase
          .from('location_photos')
          .insert([
            {
              location_id: Number(locationId),
              url: publicUrl,
              caption: '',
              is_primary: i === 0,
              display_order: i,
              // Note: filename, original_filename, file_path don't exist in table schema
            },
          ])
          .select()
          .single();

        if (dbError) {
          console.error('Erro ao salvar registro de foto:', dbError);
        } else {
          uploadedPhotos.push({
            id: photoRecord.id,
            filename: fileName,
            url: publicUrl,
            uploaded_at: new Date().toISOString(),
          });
        }
      }

      return {
        message: 'Upload concluído',
        location_id: locationId.toString(),
        uploaded_photos: uploadedPhotos,
        total_photos: uploadedPhotos.length,
      };
    } catch (error: any) {
      console.error('Erro no upload de fotos:', error);
      throw new Error(error.message || 'Erro desconhecido no upload de fotos');
    }
  },

  /**
   * Lista fotos de uma locação via Supabase
   */
  async listPhotos(locationId: string | number): Promise<PhotoListResponse> {
    try {
      const { data, error } = await supabase
        .from('location_photos')
        .select('*')
        .eq('location_id', Number(locationId))
        .order('display_order', { ascending: true });

      if (error) throw error;

      return {
        location_id: locationId.toString(),
        photos: (data || []).map((p: any) => ({
          id: p.id,
          url: p.url,
          filename: p.url?.split('/').pop() || '',
          exists: true,
          thumbnail_url: p.thumbnail_url,
          is_primary: p.is_primary || false,
          caption: p.caption || '',
        })),
        total: data?.length || 0,
      };
    } catch (error: any) {
      console.error('Erro ao listar fotos:', error);
      throw new Error(error.message || 'Erro ao listar fotos');
    }
  },

  /**
   * Remove uma foto específica
   */
  async deletePhoto(
    locationId: string | number,
    photoId: string | number
  ): Promise<any> {
    try {
      // Get photo URL first to delete from storage too
      const { data: photo } = await supabase
        .from('location_photos')
        .select('url')
        .eq('id', Number(photoId))
        .single();

      // Delete from database
      const { error } = await supabase
        .from('location_photos')
        .delete()
        .eq('id', Number(photoId));

      if (error) throw error;

      // Optionally delete from storage (extract path from URL)
      // This is complex because we need to extract the path from the public URL
      // Skipping for now - storage cleanup can be done separately

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao deletar foto:', error);
      throw new Error(error.message || 'Erro ao deletar foto');
    }
  },

  /**
   * Gera URL para visualizar uma foto
   */
  getPhotoUrl(locationId: string | number, filename: string): string {
    if (filename.startsWith('http')) return filename;

    // Build Supabase Storage URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from('location-photos')
      .getPublicUrl(`${locationId}/${filename}`);

    return publicUrl;
  },

  /**
   * Valida arquivos antes do upload
   */
  validateFiles(
    files: File[],
    maxFiles: number = 10,
    maxSizePerFile: number = 10 * 1024 * 1024
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    if (files.length > maxFiles) {
      errors.push(`Máximo de ${maxFiles} arquivos permitidos`);
    }

    files.forEach((file, index) => {
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        errors.push(
          `Arquivo ${index + 1}: Tipo não permitido. Use JPG, PNG, WebP ou GIF`
        );
      }
      if (file.size > maxSizePerFile) {
        const maxSizeMB = Math.round(maxSizePerFile / (1024 * 1024));
        errors.push(
          `Arquivo ${index + 1}: Muito grande. Máximo ${maxSizeMB}MB`
        );
      }
    });

    return { valid: errors.length === 0, errors };
  },

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
};

export default photoUploadService;

/**
 * Serviço de storage usando Supabase Storage
 * Substitui o Firebase Storage com funcionalidades equivalentes
 */

import { supabase } from '../config/supabaseClient';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class SupabaseStorageService {
  /**
   * Upload de arquivo
   */
  async uploadFile(
    bucketName: string,
    path: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      // Supabase não suporta progress tracking nativamente no cliente
      // Para isso, seria necessário implementar um upload chunked customizado
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Retornar URL pública
      return this.getPublicUrl(bucketName, data.path);
    } catch (error: any) {
      console.error('Erro no upload:', error);
      throw new Error(`Erro no upload: ${error.message}`);
    }
  }

  /**
   * Upload com substituição (upsert)
   */
  async uploadFileUpsert(
    bucketName: string,
    path: string,
    file: File
  ): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      return this.getPublicUrl(bucketName, data.path);
    } catch (error: any) {
      console.error('Erro no upload (upsert):', error);
      throw new Error(`Erro no upload: ${error.message}`);
    }
  }

  /**
   * Deletar arquivo
   */
  async deleteFile(bucketName: string, path: string): Promise<void> {
    try {
      const { error } = await supabase.storage.from(bucketName).remove([path]);

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao deletar arquivo:', error);
      throw new Error(`Erro ao deletar arquivo: ${error.message}`);
    }
  }

  /**
   * Deletar múltiplos arquivos
   */
  async deleteFiles(bucketName: string, paths: string[]): Promise<void> {
    try {
      const { error } = await supabase.storage.from(bucketName).remove(paths);

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao deletar arquivos:', error);
      throw new Error(`Erro ao deletar arquivos: ${error.message}`);
    }
  }

  /**
   * Obter URL pública do arquivo
   */
  getPublicUrl(bucketName: string, path: string): string {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Obter URL assinada (temporária) do arquivo
   */
  async getSignedUrl(
    bucketName: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(path, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } catch (error: any) {
      console.error('Erro ao criar URL assinada:', error);
      throw new Error(`Erro ao criar URL assinada: ${error.message}`);
    }
  }

  /**
   * Listar arquivos em um diretório
   */
  async listFiles(
    bucketName: string,
    path: string = '',
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: { column: string; order: 'asc' | 'desc' };
    }
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(path, options);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Erro ao listar arquivos:', error);
      throw new Error(`Erro ao listar arquivos: ${error.message}`);
    }
  }

  /**
   * Download de arquivo como Blob
   */
  async downloadFile(bucketName: string, path: string): Promise<Blob> {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(path);

      if (error) throw error;
      if (!data) throw new Error('Arquivo não encontrado');

      return data;
    } catch (error: any) {
      console.error('Erro ao fazer download:', error);
      throw new Error(`Erro ao fazer download: ${error.message}`);
    }
  }

  /**
   * Mover arquivo
   */
  async moveFile(
    bucketName: string,
    fromPath: string,
    toPath: string
  ): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .move(fromPath, toPath);

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao mover arquivo:', error);
      throw new Error(`Erro ao mover arquivo: ${error.message}`);
    }
  }

  /**
   * Copiar arquivo
   */
  async copyFile(
    bucketName: string,
    fromPath: string,
    toPath: string
  ): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .copy(fromPath, toPath);

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao copiar arquivo:', error);
      throw new Error(`Erro ao copiar arquivo: ${error.message}`);
    }
  }

  /**
   * Criar bucket (requer permissões de admin)
   */
  async createBucket(
    bucketName: string,
    options?: {
      public?: boolean;
      fileSizeLimit?: number;
      allowedMimeTypes?: string[];
    }
  ): Promise<void> {
    try {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: options?.public || false,
        fileSizeLimit: options?.fileSizeLimit,
        allowedMimeTypes: options?.allowedMimeTypes,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao criar bucket:', error);
      throw new Error(`Erro ao criar bucket: ${error.message}`);
    }
  }

  /**
   * Listar buckets
   */
  async listBuckets(): Promise<any[]> {
    try {
      const { data, error } = await supabase.storage.listBuckets();

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Erro ao listar buckets:', error);
      throw new Error(`Erro ao listar buckets: ${error.message}`);
    }
  }

  /**
   * Obter informações do bucket
   */
  async getBucket(bucketName: string): Promise<any> {
    try {
      const { data, error } = await supabase.storage.getBucket(bucketName);

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Erro ao obter bucket:', error);
      throw new Error(`Erro ao obter bucket: ${error.message}`);
    }
  }

  /**
   * Upload com metadata customizada
   */
  async uploadWithMetadata(
    bucketName: string,
    path: string,
    file: File,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
          metadata,
        });

      if (error) throw error;

      return this.getPublicUrl(bucketName, data.path);
    } catch (error: any) {
      console.error('Erro no upload com metadata:', error);
      throw new Error(`Erro no upload: ${error.message}`);
    }
  }

  /**
   * Helper: Upload de foto de locação
   */
  async uploadLocationPhoto(locationId: string, file: File): Promise<string> {
    const fileName = `${Date.now()}_${file.name}`;
    const path = `locations/${locationId}/photos/${fileName}`;
    return this.uploadFile('locations', path, file);
  }

  /**
   * Helper: Upload de avatar de usuário
   */
  async uploadUserAvatar(userId: string, file: File): Promise<string> {
    const fileName = `avatar_${Date.now()}.${file.name.split('.').pop()}`;
    const path = `avatars/${userId}/${fileName}`;
    return this.uploadFileUpsert('avatars', path, file);
  }
}

// Exportar instância única
export const supabaseStorageService = new SupabaseStorageService();
export default supabaseStorageService;

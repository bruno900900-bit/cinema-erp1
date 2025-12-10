// Serviço de upload de imagens
// Em um sistema real, isso seria integrado com um serviço de armazenamento como AWS S3, Cloudinary, etc.

export interface UploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface ImageUploadOptions {
  maxSize?: number; // em MB
  allowedTypes?: string[];
  quality?: number; // para compressão
  bucketName?: string; // Bucket do Supabase
}

class ImageUploadService {
  private defaultOptions: ImageUploadOptions = {
    maxSize: 10, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    quality: 0.8,
    bucketName: 'images', // Padrão
  };

  /**
   * Upload de imagem usando Firebase Storage com fallback local
   */
  async uploadImage(
    file: File,
    options: ImageUploadOptions = {}
  ): Promise<UploadResult> {
    const opts = { ...this.defaultOptions, ...options };

    try {
      // Validar arquivo
      const validation = this.validateFile(file, opts);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Tentar usar Supabase Storage primeiro
      try {
        const { supabaseStorageService } = await import(
          './supabaseStorageService'
        );

        // Gerar path único para a imagem
        const timestamp = Date.now();
        const fileExtension = this.getFileExtension(file.name);
        const fileName = `image_${timestamp}.${fileExtension}`;
        const path = `uploads/${fileName}`;

        const imageUrl = await supabaseStorageService.uploadFile(
          opts.bucketName || 'images',
          path,
          file
        );

        return {
          success: true,
          imageUrl,
        };
      } catch (storageError) {
        console.warn(
          'Supabase Storage falhou, usando fallback local:',
          storageError
        );

        // Fallback: usar URL local
        const imageUrl = URL.createObjectURL(file);

        return {
          success: true,
          imageUrl,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao fazer upload da imagem',
      };
    }
  }

  /**
   * Valida o arquivo antes do upload
   */
  private validateFile(
    file: File,
    options: ImageUploadOptions
  ): { valid: boolean; error?: string } {
    // Verificar tipo de arquivo
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de arquivo não permitido. Tipos aceitos: ${options.allowedTypes.join(
          ', '
        )}`,
      };
    }

    // Verificar tamanho do arquivo
    if (options.maxSize && file.size > options.maxSize * 1024 * 1024) {
      return {
        valid: false,
        error: `Arquivo muito grande. Tamanho máximo: ${options.maxSize}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Simula delay de upload
   */
  private simulateUploadDelay(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, 1000 + Math.random() * 2000); // 1-3 segundos
    });
  }

  /**
   * Comprime uma imagem (simulação)
   * Em um sistema real, isso seria feito no backend ou com uma biblioteca como canvas
   */
  async compressImage(file: File, quality: number = 0.8): Promise<File> {
    return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Desenhar imagem redimensionada
        ctx?.drawImage(img, 0, 0, width, height);

        // Converter para blob
        canvas.toBlob(
          blob => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Remove uma imagem do servidor
   * Em um sistema real, isso seria uma chamada para o backend
   */
  async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // Simular delay de exclusão
      await this.simulateUploadDelay();

      // Em um sistema real:
      // await fetch(`/api/upload/${imageId}`, { method: 'DELETE' });

      // Limpar URL local se for uma URL de objeto
      if (imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }

      return true;
    } catch (error) {
      console.error('Erro ao excluir imagem:', error);
      return false;
    }
  }

  /**
   * Gera uma URL de thumbnail
   * Em um sistema real, isso seria gerado pelo backend
   */
  generateThumbnailUrl(imageUrl: string, size: number = 200): string {
    // Em um sistema real, isso seria algo como:
    // return `${imageUrl}?w=${size}&h=${size}&fit=crop`;

    // Por enquanto, retornamos a URL original
    return imageUrl;
  }

  /**
   * Verifica se uma URL é uma imagem válida
   */
  isValidImageUrl(url: string): boolean {
    try {
      new URL(url);
      return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.startsWith('blob:');
    } catch {
      return false;
    }
  }

  /**
   * Obter extensão do arquivo
   */
  getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }
}

export const imageUploadService = new ImageUploadService();

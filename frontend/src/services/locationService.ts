import { supabase } from '../config/supabaseClient';
import { Location, LocationStatus, SectorType, SpaceType } from '../types/user';
import { PayloadValidator, validatePayload } from '../utils/validation';

export interface AdvancedSearchParams {
  q?: string;
  project_ids?: number[];
  supplier_ids?: number[];
  responsible_user_ids?: number[];
  status?: string[];
  space_type?: string[];
  sector_type?: string[];
  tags?: Record<string, string[]>;
  city?: string[];
  state?: string[];
  country?: string[];
  precos?: Record<string, any>;
  capacity?: { min?: number; max?: number };
  date_range?: { from_date?: string; to_date?: string };
  geo?: { lat: number; lng: number; radius_km: number };
  budget_remaining?: { min?: number; max?: number };
  archived?: boolean;
  page?: number;
  page_size?: number;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  include?: string[];
  facets?: boolean;
}

export interface SearchResponse {
  locations: Location[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  facets?: any;
}

class LocationService {
  // Cache de requests em andamento para evitar duplicatas
  private pendingRequests: Map<string, Promise<any>> = new Map();

  /**
   * Wrapper para requests com deduplication
   * Evita múltiplas chamadas simultâneas para o mesmo recurso
   */
  private async withDeduplication<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Se já existe uma request em andamento, retorna ela
    if (this.pendingRequests.has(key)) {
      console.log(`🔄 Reusing pending request for: ${key}`);
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Cria nova request
    const request = requestFn().finally(() => {
      // Remove do cache quando completar
      this.pendingRequests.delete(key);
    });

    // Armazena no cache
    this.pendingRequests.set(key, request);

    return request;
  }

  // Normalize client-side enums/values to backend equivalents
  private normalizeForBackend(payload: Partial<Location>): any {
    const clone: any = { ...(payload as any) };

    // 0. Ensure slug is unique by appending timestamp
    if (clone.slug) {
      // Append timestamp to make unique
      clone.slug = `${clone.slug}-${Date.now()}`;
    } else if (clone.title) {
      // Generate slug from title if not provided
      clone.slug = `${clone.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}-${Date.now()}`;
    }

    // 1. Map space_type values/enums
    const mapSpace: Record<string, string> = {
      indoor: 'studio',
      outdoor: 'outdoor',
      studio: 'studio',
      location: 'house',
      room: 'custom',
      area: 'custom',
    };

    const st = (clone.space_type || (clone as any).spaceType) as
      | string
      | undefined;
    if (st) {
      const key = String(st).toLowerCase();
      clone.space_type = mapSpace[key] || key;
      delete (clone as any).spaceType;
    }

    // 2. Handle sector_type (DB uses singular column, not array)
    // Frontend might send 'sector_types' array or 'sector_type' string
    if (
      clone.sector_types &&
      Array.isArray(clone.sector_types) &&
      clone.sector_types.length > 0
    ) {
      clone.sector_type = clone.sector_types[0]; // Take first value
    }
    // Delete the array version - DB uses singular column
    delete clone.sector_types;

    if (clone.status) clone.status = String(clone.status).toLowerCase();

    // 3. Map 'has_*' fields to accessibility_features JSONB
    const accessibilityFeatures: Record<string, boolean> =
      clone.accessibility_features || {};
    const featureKeys = [
      'has_parking',
      'has_electricity',
      'has_water',
      'has_bathroom',
      'has_kitchen',
      'has_air_conditioning',
    ];

    featureKeys.forEach(key => {
      if (key in clone) {
        if (clone[key] !== undefined) {
          accessibilityFeatures[key] = clone[key];
        }
        delete clone[key]; // Remove from top level
      }
    });
    clone.accessibility_features = accessibilityFeatures;

    // 4. Map available_from/to to availability_json keys
    const availabilityJson: Record<string, any> = clone.availability_json || {};

    // Always move values if present, then always delete keys
    if (clone.available_from !== undefined) {
      availabilityJson.available_from = clone.available_from;
    }
    if (clone.available_to !== undefined) {
      availabilityJson.available_to = clone.available_to;
    }

    delete clone.available_from;
    delete clone.available_to;

    clone.availability_json = availabilityJson;

    // 5. Remove relations and non-existent columns
    delete clone.tags;
    delete clone.photos;
    delete clone.supplier;
    delete clone.project;
    delete clone.distance; // If exists from search
    delete clone.relevance; // If exists from search

    return clone;
  }
  async getLocations(
    params: AdvancedSearchParams = {}
  ): Promise<SearchResponse> {
    // Criar chave única para esta busca
    const cacheKey = `locations-${JSON.stringify(params)}`;

    return this.withDeduplication(cacheKey, async () => {
      try {
        console.log(
          '📍 LocationService.getLocations - Iniciando busca (Supabase):',
          params
        );

        let query = supabase
          .from('locations')
          .select('*, photos:location_photos(*)', { count: 'exact' });

        // --- Filtros Básicos ---
        if (params.supplier_ids && params.supplier_ids.length > 0) {
          query = query.in('supplier_id', params.supplier_ids);
        }

        if (params.status && params.status.length > 0) {
          query = query.in('status', params.status);
        }

        if (params.city && params.city.length > 0) {
          query = query.in('city', params.city);
        }

        if (params.state && params.state.length > 0) {
          query = query.in('state', params.state);
        }

        if (params.country && params.country.length > 0) {
          query = query.in('country', params.country);
        }

        if (params.space_type && params.space_type.length > 0) {
          // Mapear se necessário, ou assumir que o frontend já envia valores corretos
          query = query.in('space_type', params.space_type);
        }

        // --- Filtros Numéricos ---
        if (params.capacity) {
          if (params.capacity.min !== undefined)
            query = query.gte('capacity', params.capacity.min);
          if (params.capacity.max !== undefined)
            query = query.lte('capacity', params.capacity.max);
        }

        // --- Busca Textual (q) ---
        if (params.q) {
          // Busca textual
          const term = params.q;
          const filterString =
            'title.ilike.%' +
            term +
            '%,description.ilike.%' +
            term +
            '%,city.ilike.%' +
            term +
            '%';
          query = query.or(filterString);
        }

        // --- Filtros Especiais (Tags, Sector) ---
        if (params.sector_type && params.sector_type.length > 0) {
          // DB uses singular 'sector_type' (Enum)
          // .in() works for checking if the column value is present in the list of filter values
          query = query.in('sector_type', params.sector_type);
        }

        // --- Paginação ---
        const page = params.page || 1;
        const pageSize = params.page_size || 12;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        query = query.range(from, to);

        // --- Ordenação ---
        if (params.sort && params.sort.length > 0) {
          params.sort.forEach(s => {
            query = query.order(s.field, { ascending: s.direction === 'asc' });
          });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        const { data, error, count } = await query;

        if (error) throw error;

        const total = count || 0;
        const totalPages = Math.ceil(total / pageSize);

        const result: SearchResponse = {
          locations: (data as Location[]) || [],
          total: total,
          page: page,
          page_size: pageSize,
          total_pages: totalPages > 0 ? totalPages : 1,
          facets: {}, // Facetas exigem queries de agregação separadas
        };

        console.log(
          '✅ LocationService.getLocations - Sucesso:',
          result.locations.length,
          'itens'
        );
        return result;
      } catch (error: any) {
        console.error(
          '❌ LocationService.getLocations - Erro (Supabase):',
          error
        );
        throw error;
      }
    });
  }

  async searchLocations(params: AdvancedSearchParams): Promise<SearchResponse> {
    // Alias para getLocations, já que agora tratamos tudo num lugar só
    return this.getLocations(params);
  }

  // Mock locations removidos para produção

  async getLocation(id: number): Promise<Location> {
    try {
      console.log(
        '📍 LocationService.getLocation - Buscando locação ID: ' +
          id +
          ' (Supabase)'
      );

      const { data, error } = await supabase
        .from('locations')
        .select(
          '*, supplier:suppliers (*), photos:location_photos (*), tags:location_tags (*)'
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Locação não encontrada');

      console.log('✅ LocationService.getLocation - Sucesso:', data);
      return data as Location;
    } catch (error: any) {
      console.error('❌ LocationService.getLocation - Erro (Supabase):', error);
      throw new Error('Locação com ID ' + id + ' não encontrada');
    }
  }

  async createLocation(locationData: Partial<Location>): Promise<Location> {
    const startTime = Date.now();

    try {
      console.log(
        '📍 LocationService.createLocation - Validando dados (Supabase)'
      );

      const normalized = this.normalizeForBackend(locationData);

      const validatedData = validatePayload(
        normalized,
        PayloadValidator.validateLocationCreate,
        'criação de locação'
      );

      // Ensure sector_types is array [REMOVED - DB uses SINGULAR sector_type]
      // if (validatedData.sector_type && !validatedData.sector_types) {
      //   validatedData.sector_types = [validatedData.sector_type];
      //   delete validatedData.sector_type;
      // }

      console.log('✅ LocationService.createLocation - Enviando para Supabase');

      const { data, error } = await supabase
        .from('locations')
        .insert([validatedData])
        .select()
        .single();

      if (error) {
        // Detectar e reportar erro RLS específico
        if (error.code === '42501' || error.message?.includes('policy')) {
          console.error(
            '🚫 ERRO RLS detectado ao criar locação:',
            '\n',
            'Tabela: locations',
            '\n',
            'Operação: INSERT',
            '\n',
            'Verifique as políticas RLS no Supabase Dashboard.',
            '\n',
            'Erro detalhado:',
            error
          );
        }
        throw error;
      }

      console.log('✅ LocationService.createLocation - Sucesso:', data);
      console.log(`⏱️ Tempo de operação: ${Date.now() - startTime}ms`);
      return data as Location;
    } catch (error: any) {
      console.error(
        '❌ LocationService.createLocation - Erro (Supabase):',
        error
      );
      console.error(`⏱️ Falhou após: ${Date.now() - startTime}ms`);

      if (error.message?.includes('Dados inválidos')) throw error;
      throw new Error('Não foi possível criar a locação: ' + error.message);
    }
  }

  async createLocationWithPhotos(
    locationData: Partial<Location>,
    files: File[],
    captions: string[] = [],
    primaryIndex?: number
  ): Promise<Location> {
    try {
      console.log(
        '📍 LocationService.createLocationWithPhotos - Iniciando (Supabase)'
      );

      // 1. Create Location
      const createdLocation = await this.createLocation(locationData);
      const locationId = createdLocation.id;

      // 2. Upload Photos if any
      if (files && files.length > 0) {
        console.log('📸 Uploading ' + files.length + ' photos...');

        // Upload sequentially or parallel - sequentially might be safer for order
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const caption = captions[i] || '';
          const isPrimary =
            typeof primaryIndex === 'number' && i === primaryIndex;

          await this.uploadLocationPhoto(
            locationId,
            file,
            caption,
            isPrimary,
            progress =>
              console.log('Photo ' + (i + 1) + ' progress: ' + progress + '%')
          );
        }
      }

      // 3. Return complete location
      return await this.getLocation(locationId);
    } catch (error: any) {
      console.error(
        '❌ LocationService.createLocationWithPhotos - Erro:',
        error
      );
      throw new Error(
        'Não foi possível criar a locação com fotos: ' + error.message
      );
    }
  }

  async updateLocation(
    id: number,
    locationData: Partial<Location>
  ): Promise<Location> {
    try {
      const normalized = this.normalizeForBackend(locationData);

      const { data, error } = await supabase
        .from('locations')
        .update(normalized)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Location;
    } catch (error: any) {
      console.error('Erro ao atualizar locação (Supabase):', error);
      throw new Error('Não foi possível atualizar a locação');
    }
  }

  async deleteLocation(id: number): Promise<void> {
    try {
      console.log(
        `🗑️ LocationService.deleteLocation - Excluindo dependências da locação ${id}`
      );

      // 1. Excluir Project Locations (associações)
      const { error: plError } = await supabase
        .from('project_locations')
        .delete()
        .eq('location_id', id);
      if (plError)
        console.warn('Erro ao excluir associações de projeto:', plError);

      // 2. Excluir Location Photos (DB records only - storage cleanup requires backend or trigger)
      const { error: photoError } = await supabase
        .from('location_photos')
        .delete()
        .eq('location_id', id);
      if (photoError)
        console.warn('Erro ao excluir registros de fotos:', photoError);

      // 3. Excluir Location Tags
      const { error: tagsError } = await supabase
        .from('location_tags')
        .delete()
        .eq('location_id', id);
      if (tagsError)
        console.warn('Erro ao excluir tags da locação:', tagsError);

      // 4. Excluir Locação
      console.log('🗑️ LocationService.deleteLocation - Excluindo locação');
      const { error } = await supabase.from('locations').delete().eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao excluir locação (Supabase):', error);
      throw new Error(
        'Não foi possível excluir a locação. Verifique se existem projetos vinculados ativos.'
      );
    }
  }

  async uploadLocationPhoto(
    locationId: number,
    file: File,
    caption?: string,
    isPrimary?: boolean,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = locationId + '/' + Date.now() + '.' + fileExt;
      const filePath = fileName;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('location-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('location-photos').getPublicUrl(filePath);

      // 3. Insert into location_photos table
      const { data: photoData, error: dbError } = await supabase
        .from('location_photos')
        .insert([
          {
            location_id: locationId,
            url: publicUrl,
            caption: caption || '',
            is_primary: isPrimary || false,
            display_order: 0, // Default
            // filename, original_filename, file_path columns don't exist in schema
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      if (onProgress) onProgress(100); // Mock progress completion

      return photoData;
    } catch (error: any) {
      console.error('Erro ao fazer upload da foto (Supabase):', error);
      throw new Error('Não foi possível fazer upload da foto');
    }
  }

  async getLocationPhotos(locationId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('location_photos')
        .select('*')
        .eq('location_id', locationId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Erro ao obter fotos da locação (Supabase):', error);
      throw new Error('Erro ao obter fotos da locação');
    }
  }

  async deleteLocationPhoto(
    locationId: number,
    photoId: number
  ): Promise<void> {
    try {
      // First get the photo url to extract storage path (simulated or simplified)
      // For now just delete record from DB, trigger or manual cleanup usually needed for Storage
      const { error } = await supabase
        .from('location_photos')
        .delete()
        .eq('id', photoId);
      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao deletar foto (Supabase):', error);
      throw new Error('Erro ao deletar foto');
    }
  }

  async setCoverPhoto(locationId: number, photoId: number): Promise<void> {
    try {
      // Set all photos for this location to not primary
      const { error: updateError } = await supabase
        .from('location_photos')
        .update({ is_primary: false })
        .eq('location_id', locationId);

      if (updateError) throw updateError;

      // Set the specified photo as primary
      const { error: primaryError } = await supabase
        .from('location_photos')
        .update({ is_primary: true })
        .eq('id', photoId);

      if (primaryError) throw primaryError;
    } catch (error: any) {
      console.error('Erro ao definir foto de capa (Supabase):', error);
      throw new Error('Não foi possível definir a foto de capa');
    }
  }

  async reorderPhotos(
    locationId: number,
    photoOrders: { id: number; displayOrder: number }[]
  ): Promise<void> {
    try {
      // Use a transaction or batch update for reordering
      const updates = photoOrders.map(photo => ({
        id: photo.id,
        display_order: photo.displayOrder,
      }));

      const { error } = await supabase
        .from('location_photos')
        .upsert(updates, { onConflict: 'id' }); // upsert can update existing rows

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao reordenar fotos (Supabase):', error);
      throw new Error('Não foi possível reordenar as fotos');
    }
  }

  async getLocationStats(): Promise<any> {
    try {
      const { count, error } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return { total: count || 0 };
    } catch (error: any) {
      console.error('Erro ao obter estatísticas (Supabase):', error);
      return { total: 0 };
    }
  }

  async getSupplierLocations(supplierId: number): Promise<Location[]> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('supplier_id', supplierId);
      if (error) throw error;
      return (data as Location[]) || [];
    } catch (error: any) {
      console.error('Erro ao buscar locações do fornecedor (Supabase):', error);
      return [];
    }
  }

  async updateLocationStatus(id: number, status: string): Promise<Location> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Location;
    } catch (error: any) {
      console.error('Erro ao atualizar status (Supabase):', error);
      throw new Error('Não foi possível atualizar o status');
    }
  }

  async exportLocations(
    params: AdvancedSearchParams,
    format: 'csv' | 'excel' = 'csv'
  ): Promise<Blob> {
    // Export requires server-side processing or fetching all data and converting on client
    // For now, we'll throw not implemented or simple mock
    console.warn(
      'Export functionality requires backend implementation or full client-side fetch'
    );
    throw new Error(
      'Exportação temporariamente indisponível na migração Supabase'
    );
  }

  // Alias for getLocation - used by LocationDetailPage
  async getLocationById(id: number): Promise<Location> {
    return this.getLocation(id);
  }
}

export const locationService = new LocationService();

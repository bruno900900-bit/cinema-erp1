import { apiService } from './api';
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
  // Normalize client-side enums/values to backend equivalents
  private normalizeForBackend(payload: Partial<Location>): any {
    const clone: any = { ...(payload as any) };

    // Map space_type values to backend enum: studio|house|warehouse|office|outdoor|custom
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
      delete (clone as any).spaceType; // ensure single key
    }

    // Normalize sector_type/status to lowercase strings if present
    if (clone.sector_type)
      clone.sector_type = String(clone.sector_type).toLowerCase();
    if (clone.status) clone.status = String(clone.status).toLowerCase();

    return clone;
  }
  async getLocations(
    params: AdvancedSearchParams = {}
  ): Promise<SearchResponse> {
    try {
      console.log('📍 LocationService.getLocations - Iniciando busca:', params);

      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page.toString());
      if (params.page_size)
        queryParams.append('page_size', params.page_size.toString());
      if (params.supplier_ids && params.supplier_ids.length)
        queryParams.append('supplier_ids', params.supplier_ids.join(','));
      if (params.status) queryParams.append('status', params.status.join(','));
      if (params.city) queryParams.append('city', params.city.join(','));
      if (params.include)
        queryParams.append('include', params.include.join(','));

      const qs = queryParams.toString();
      const response = await apiService.get<any>(
        qs ? `/locations?${qs}` : '/locations'
      );

      // Accept both array and object responses
      const result: SearchResponse = Array.isArray(response)
        ? {
            locations: response,
            total: response.length,
            page: params.page || 1,
            page_size: params.page_size || 12,
            total_pages: 1,
            facets: {},
          }
        : {
            locations: response?.locations || [],
            total: response?.total || (response?.locations?.length ?? 0),
            page: response?.page || 1,
            page_size: response?.page_size || params.page_size || 12,
            total_pages:
              response?.total_pages ||
              Math.max(
                1,
                Math.ceil(
                  ((response?.total as number) || 0) / (params.page_size || 12)
                )
              ),
            facets: response?.facets || {},
          };

      console.log('✅ LocationService.getLocations - Sucesso:', result);
      return result;
    } catch (error) {
      console.error(
        '❌ LocationService.getLocations - Erro (sem fallback mock):',
        error
      );
      throw error;
    }
  }

  async searchLocations(params: AdvancedSearchParams): Promise<SearchResponse> {
    try {
      console.log(
        '🔍 LocationService.searchLocations - Iniciando busca:',
        params
      );

      const response = await apiService.post<SearchResponse>(
        '/locations/search',
        params
      );

      // Garantir que sempre retornamos um objeto válido
      const result: SearchResponse = {
        locations: response?.locations || [],
        total: response?.total || 0,
        page: response?.page || 1,
        page_size: response?.page_size || 10,
        total_pages: response?.total_pages || 0,
        facets: response?.facets || {},
      };

      console.log('✅ LocationService.searchLocations - Sucesso:', result);
      return result;
    } catch (error) {
      console.error(
        '❌ LocationService.searchLocations - Erro (sem fallback mock):',
        error
      );
      throw error;
    }
  }

  // Mock locations removidos para produção

  async getLocation(id: number): Promise<Location> {
    try {
      console.log(
        `📍 LocationService.getLocation - Buscando locação ID: ${id}`
      );

      const response = await apiService.get<Location>(`/locations/${id}`);

      if (!response) {
        throw new Error('Resposta vazia do servidor');
      }

      console.log('✅ LocationService.getLocation - Sucesso:', response);
      return response;
    } catch (error) {
      console.error('❌ LocationService.getLocation - Erro:', error);

      throw new Error(`Locação com ID ${id} não encontrada ou erro na API`);
    }
  }

  async createLocation(locationData: Partial<Location>): Promise<Location> {
    try {
      console.log(
        '📍 LocationService.createLocation - Validando dados da locação'
      );

      // Validar payload antes de enviar
      const normalized = this.normalizeForBackend(locationData);
      const validatedData = validatePayload(
        normalized,
        PayloadValidator.validateLocationCreate,
        'criação de locação'
      );

      console.log(
        '✅ LocationService.createLocation - Dados validados, enviando para API'
      );
      const response = await apiService.post<Location>(
        '/locations',
        validatedData
      );

      console.log(
        '✅ LocationService.createLocation - Locação criada com sucesso:',
        response
      );
      return response;
    } catch (error: any) {
      console.error('❌ LocationService.createLocation - Erro:', error);

      // Se for erro de validação, relançar com mensagem clara
      if (error.message.includes('Dados inválidos')) {
        throw error;
      }

      // Detectar se é erro de conexão
      const isConnectionError =
        error?.code === 'ECONNREFUSED' ||
        error?.code === 'ERR_NETWORK' ||
        error?.message?.includes('ERR_CONNECTION_REFUSED') ||
        error?.message?.includes('Network Error') ||
        !apiService.isApiOnline();

      if (isConnectionError) {
        console.log('🔧 Usando dados mock para criar locação');
        const mockLocation: Location = {
          id: Date.now(),
          title: locationData.title || 'Nova Locação',
          slug: locationData.slug || 'nova-locacao',
          summary: locationData.summary || '',
          description: locationData.description || '',
          status: locationData.status || LocationStatus.DRAFT,
          sector_type: locationData.sector_type || SectorType.CINEMA,
          space_type: locationData.space_type || SpaceType.INDOOR,
          currency: locationData.currency || 'BRL',
          country: locationData.country || 'Brasil',
          city: locationData.city || '',
          state: locationData.state || '',
          capacity: locationData.capacity || 0,
          area_size: locationData.area_size || 0,
          available_from: locationData.available_from || '',
          available_to: locationData.available_to || '',
          has_parking: locationData.has_parking || false,
          has_electricity: locationData.has_electricity || false,
          has_water: locationData.has_water || false,
          has_bathroom: locationData.has_bathroom || false,
          has_kitchen: locationData.has_kitchen || false,
          has_air_conditioning: locationData.has_air_conditioning || false,
          price_day_cinema: locationData.price_day_cinema || 0,
          price_hour_cinema: locationData.price_hour_cinema || 0,
          price_day_publicidade: locationData.price_day_publicidade || 0,
          price_hour_publicidade: locationData.price_hour_publicidade || 0,
          // supplier reference not used in mock
          tags: locationData.tags || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return mockLocation;
      }

      throw new Error('Não foi possível criar a locação');
    }
  }

  async createLocationWithPhotos(
    locationData: Partial<Location>,
    files: File[],
    captions: string[] = [],
    primaryIndex?: number
  ): Promise<Location> {
    try {
      // Validar campo obrigatório
      if (!locationData.title || locationData.title.trim() === '') {
        throw new Error('O campo Título é obrigatório');
      }

      const data = locationData as any;
      const form = new FormData();

      // Explicitly map fields to avoid issues with generic iteration
      form.append('title', data.title);
      if (data.summary) form.append('summary', data.summary);
      if (data.description) form.append('description', data.description);
      if (data.status) form.append('status', String(data.status).toLowerCase());

      // Handle sector_type
      if (data.sector_type) {
        form.append('sector_type', String(data.sector_type).toLowerCase());
      }

      // Handle space_type mapping
      if (data.space_type) {
        const mapSpace: Record<string, string> = {
          indoor: 'studio',
          outdoor: 'outdoor',
          studio: 'studio',
          location: 'house',
          room: 'custom',
          area: 'custom',
        };
        const st = String(data.space_type).toLowerCase();
        form.append('space_type', mapSpace[st] || st);
      }

      if (data.currency) form.append('currency', data.currency);
      if (data.country) form.append('country', data.country);

      // Numeric fields - allow 0, skip undefined/null
      const appendIfDefined = (key: string, val: any) => {
        if (val !== undefined && val !== null && val !== '') {
          form.append(key, String(val));
        }
      };

      appendIfDefined('supplier_id', data.supplier_id);
      appendIfDefined('price_day_cinema', data.price_day_cinema);
      appendIfDefined('price_hour_cinema', data.price_hour_cinema);
      appendIfDefined('price_day_publicidade', data.price_day_publicidade);
      appendIfDefined('price_hour_publicidade', data.price_hour_publicidade);
      appendIfDefined('capacity', data.capacity);
      appendIfDefined('area_size', data.area_size);
      appendIfDefined('parking_spots', data.parking_spots);
      appendIfDefined('project_id', data.project_id);
      appendIfDefined('responsible_user_id', data.responsible_user_id);

      // Address & Contact
      if (data.street) form.append('street', data.street);
      if (data.number) form.append('number', data.number);
      if (data.complement) form.append('complement', data.complement);
      if (data.neighborhood) form.append('neighborhood', data.neighborhood);
      if (data.city) form.append('city', data.city);
      if (data.state) form.append('state', data.state);
      if (data.postal_code) form.append('postal_code', data.postal_code);

      if (data.supplier_name) form.append('supplier_name', data.supplier_name);
      if (data.supplier_phone)
        form.append('supplier_phone', data.supplier_phone);
      if (data.supplier_email)
        form.append('supplier_email', data.supplier_email);
      if (data.contact_person)
        form.append('contact_person', data.contact_person);
      if (data.contact_phone) form.append('contact_phone', data.contact_phone);
      if (data.contact_email) form.append('contact_email', data.contact_email);

      // Specs
      if (data.power_specs) form.append('power_specs', data.power_specs);
      if (data.noise_level) form.append('noise_level', data.noise_level);
      if (data.acoustic_treatment)
        form.append('acoustic_treatment', data.acoustic_treatment);

      // Photos
      files.forEach((file, idx) => {
        form.append('photos', file, file.name);
        const caption = captions[idx] ?? '';
        form.append('photo_captions', caption);
      });

      if (typeof primaryIndex === 'number') {
        form.append('primary_photo_index', String(primaryIndex));
      }

      console.log('📤 Sending FormData for Create:', Array.from(form.keys()));

      const createdLocation = await apiService.post<Location>(
        '/locations/with-photos',
        form
      );

      // If tags are present, update the location with tags (creation endpoint doesn't support tags)
      if (data.tags && data.tags.length > 0) {
        try {
          console.log('Adding tags to new location:', data.tags);
          await this.updateLocation(createdLocation.id, { tags: data.tags });
          // Re-fetch to get complete object with tags
          return await this.getLocation(createdLocation.id);
        } catch (tagError) {
          console.error(
            'Warning: Location created but failed to add tags',
            tagError
          );
          // Return created location anyway, don't block
          return createdLocation;
        }
      }

      return createdLocation;
    } catch (error: any) {
      console.error(
        '❌ LocationService.createLocationWithPhotos - Erro:',
        error.response?.data || error
      );
      throw new Error(
        error.response?.data?.detail ||
          'Não foi possível criar a locação com fotos'
      );
    }
  }

  async updateLocation(
    id: number,
    locationData: Partial<Location>
  ): Promise<Location> {
    try {
      const normalized = this.normalizeForBackend(locationData);

      const allowedKeys = new Set([
        'title',
        'slug',
        'summary',
        'description',
        'status',
        'sector_type',
        'supplier_id',
        'price_day_cinema',
        'price_hour_cinema',
        'price_day_publicidade',
        'price_hour_publicidade',
        'currency',
        'street',
        'number',
        'complement',
        'neighborhood',
        'city',
        'state',
        'country',
        'postal_code',
        'supplier_name',
        'supplier_phone',
        'supplier_email',
        'contact_person',
        'contact_phone',
        'contact_email',
        'space_type',
        'capacity',
        'area_size',
        'power_specs',
        'noise_level',
        'acoustic_treatment',
        'parking_spots',
        'project_id',
        'responsible_user_id',
        'cover_photo_url',
        'accessibility_features',
        'tag_ids',
      ]);

      const payload: Record<string, any> = {};
      Object.entries(normalized).forEach(([key, value]) => {
        if (!allowedKeys.has(key)) return;
        if (value === undefined) return;
        payload[key] = value;
      });

      if ('tags' in locationData) {
        const tagsRaw = (locationData as any).tags;
        if (Array.isArray(tagsRaw)) {
          const tagIds = tagsRaw
            .map(tag => {
              if (typeof tag === 'object' && tag !== null) {
                return tag.id ?? tag.tag_id ?? tag.tagId;
              }
              return tag;
            })
            .map(tagId => {
              const num = Number(tagId);
              return Number.isNaN(num) ? undefined : num;
            })
            .filter((id): id is number => typeof id === 'number');

          payload.tag_ids = tagIds;
        }
      }

      const response = await apiService.put<Location>(
        `/locations/${id}`,
        payload
      );
      return response;
    } catch (error: any) {
      console.error('Erro ao atualizar locação:', error);

      // Detectar se é erro de conexão
      const isConnectionError =
        error?.code === 'ECONNREFUSED' ||
        error?.code === 'ERR_NETWORK' ||
        error?.message?.includes('ERR_CONNECTION_REFUSED') ||
        error?.message?.includes('Network Error') ||
        !apiService.isApiOnline();

      if (isConnectionError) {
        console.log('🔧 Usando dados mock para atualizar locação');
        const mockLocation: Location = {
          id: id,
          title: locationData.title || 'Locação Atualizada',
          slug: locationData.slug || 'locacao-atualizada',
          summary: locationData.summary || '',
          description: locationData.description || '',
          status: locationData.status || LocationStatus.DRAFT,
          sector_type: locationData.sector_type || SectorType.CINEMA,
          space_type: locationData.space_type || SpaceType.INDOOR,
          currency: locationData.currency || 'BRL',
          country: locationData.country || 'Brasil',
          city: locationData.city || '',
          state: locationData.state || '',
          capacity: locationData.capacity || 0,
          area_size: locationData.area_size || 0,
          available_from: locationData.available_from || '',
          available_to: locationData.available_to || '',
          has_parking: locationData.has_parking || false,
          has_electricity: locationData.has_electricity || false,
          has_water: locationData.has_water || false,
          has_bathroom: locationData.has_bathroom || false,
          has_kitchen: locationData.has_kitchen || false,
          has_air_conditioning: locationData.has_air_conditioning || false,
          price_day_cinema: locationData.price_day_cinema || 0,
          price_hour_cinema: locationData.price_hour_cinema || 0,
          price_day_publicidade: locationData.price_day_publicidade || 0,
          price_hour_publicidade: locationData.price_hour_publicidade || 0,
          // supplier reference not used in mock
          tags: locationData.tags || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return mockLocation;
      }

      throw new Error('Não foi possível atualizar a locação');
    }
  }

  async deleteLocation(id: number): Promise<void> {
    try {
      await apiService.delete(`/locations/${id}`);
    } catch (error) {
      console.error('Erro ao excluir locação:', error);
      throw new Error('Não foi possível excluir a locação');
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
      const formData = new FormData();
      formData.append('photo', file, file.name);
      if (caption) formData.append('caption', caption);
      if (typeof isPrimary === 'boolean') {
        formData.append('is_primary', String(isPrimary));
      }

      const response = await apiService.post(
        `/locations/${locationId}/photos`,
        formData,
        {
          onUploadProgress: progressEvent => {
            if (!onProgress || !progressEvent.total) return;
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percent);
          },
        }
      );

      return response;
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      throw new Error('Não foi possível fazer upload da foto');
    }
  }

  async getLocationPhotos(locationId: number): Promise<any[]> {
    try {
      const response = await apiService.get<any[]>(
        `/locations/${locationId}/photos`
      );
      return response as any[];
    } catch (error) {
      console.error('Erro ao obter fotos da locação:', error);
      throw new Error('Erro ao obter fotos da locação');
    }
  }

  async deleteLocationPhoto(
    locationId: number,
    photoId: number
  ): Promise<void> {
    try {
      await apiService.delete(`/locations/${locationId}/photos/${photoId}`);
    } catch (error) {
      console.error('Erro ao deletar foto:', error);
      throw new Error('Não foi possível deletar a foto');
    }
  }

  async setCoverPhoto(locationId: number, photoId: number): Promise<void> {
    try {
      await apiService.put(
        `/locations/${locationId}/photos/${photoId}/cover`,
        {}
      );
    } catch (error) {
      console.error('Erro ao definir foto de capa:', error);
      throw new Error('Não foi possível definir a foto de capa');
    }
  }

  async reorderPhotos(
    locationId: number,
    photoOrders: { id: number; displayOrder: number }[]
  ): Promise<void> {
    try {
      await apiService.post(
        `/locations/${locationId}/photos/reorder`,
        photoOrders
      );
    } catch (error) {
      console.error('Erro ao reordenar fotos:', error);
      throw new Error('Não foi possível reordenar as fotos');
    }
  }

  async getLocationStats(): Promise<any> {
    try {
      const response = await apiService.get('/locations/stats/overview');
      return response;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw new Error('Erro ao obter estatísticas');
    }
  }

  async updateLocationStatus(id: number, status: string): Promise<Location> {
    try {
      const response = await apiService.patch<Location>(
        `/locations/${id}/status`,
        { status }
      );
      return response;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw new Error('Não foi possível atualizar o status');
    }
  }

  async exportLocations(
    params: AdvancedSearchParams,
    format: 'csv' | 'excel' = 'csv'
  ): Promise<Blob> {
    try {
      const response = await apiService.post<Blob>(
        `/locations/export?format=${format}`,
        params,
        {
          responseType: 'blob',
        }
      );
      return response as Blob;
    } catch (error) {
      console.error('Erro ao exportar locações:', error);
      throw new Error('Não foi possível exportar as locações');
    }
  }
}

export const locationService = new LocationService();

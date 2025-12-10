import { apiService, normalizeListResponse } from './api';
import { Tag } from '@/types/user';

// Normaliza o formato retornado pela API para garantir IDs em string e preservar campos básicos
const normalizeTag = (raw: any): Tag => {
  if (!raw) {
    return {
      id: '',
      name: '',
      kind: 'feature' as Tag['kind'],
      color: '#1976d2',
    };
  }

  const source = raw?.tag ?? raw?.data ?? raw;

  const normalized: Tag = {
    ...source,
    id: String(
      source.id ??
        source.tag_id ??
        source.tagId ??
        source.uuid ??
        source.key ??
        ''
    ),
    name: source.name ?? '',
    kind: (source.kind ?? 'feature') as Tag['kind'],
    color: source.color ?? '#1976d2',
  };

  return normalized;
};

const normalizeTagList = (payload: any): Tag[] => {
  if (!payload) return [];

  if (payload?.tag) {
    return [normalizeTag(payload.tag)];
  }

  if (Array.isArray(payload?.data)) {
    return payload.data.map(normalizeTag);
  }

  if (Array.isArray(payload)) return payload.map(normalizeTag);

  if (typeof payload === 'object') {
    const possibleArrays = normalizeListResponse<any>(payload, [
      'tags',
      'items',
      'results',
      'data',
      'list',
    ]);

    if (possibleArrays.length) {
      return possibleArrays.map(normalizeTag);
    }
  }

  return [];
};

export const tagService = {
  // Buscar todas as tags
  getTags: async (): Promise<Tag[]> => {
    try {
      const data = await apiService.get<any>('/tags');
      return normalizeTagList(data);
    } catch (error) {
      console.error('Erro ao buscar tags:', error);

      // Se a API não estiver disponível, usar dados mock
      if (!apiService.isApiOnline()) {
        console.log('🔧 Usando dados mock para tags');
        return [
          {
            id: '1',
            name: 'Luxo',
            kind: 'feature' as Tag['kind'],
            color: '#FFD700',
          },
          {
            id: '2',
            name: 'Rural',
            kind: 'feature' as Tag['kind'],
            color: '#228B22',
          },
          {
            id: '3',
            name: 'Urbano',
            kind: 'feature' as Tag['kind'],
            color: '#4169E1',
          },
          {
            id: '4',
            name: 'Histórico',
            kind: 'feature' as Tag['kind'],
            color: '#8B4513',
          },
          {
            id: '5',
            name: 'Moderno',
            kind: 'feature' as Tag['kind'],
            color: '#FF6347',
          },
        ];
      }

      return [];
    }
  },

  // Buscar tag por ID
  getTag: async (id: string): Promise<Tag> => {
    const data = await apiService.get<any>(`/tags/${id}`);
    return normalizeTag(data);
  },

  // Criar nova tag
  createTag: async (tag: Partial<Tag>): Promise<Tag> => {
    const data = await apiService.post<any>('/tags', tag);
    return normalizeTag(data);
  },

  // Atualizar tag
  updateTag: async (id: string, tag: Partial<Tag>): Promise<Tag> => {
    const data = await apiService.put<any>(`/tags/${id}`, tag);
    return normalizeTag(data);
  },

  // Excluir tag
  deleteTag: async (id: string): Promise<void> => {
    await apiService.delete(`/tags/${id}`);
  },

  // Buscar tags por tipo
  getTagsByKind: async (kind: string): Promise<Tag[]> => {
    const data = await apiService.get<any>(
      `/tags/kind/${encodeURIComponent(kind)}`
    );
    return normalizeTagList(data);
  },

  // Buscar tags por nome (busca parcial)
  searchTagsByName: async (name: string): Promise<Tag[]> => {
    const data = await apiService.get<any>('/tags/search/name', {
      params: { name },
    });
    return normalizeTagList(data);
  },

  // Buscar tags mais utilizadas
  getPopularTags: async (limit: number = 10): Promise<Tag[]> => {
    const data = await apiService.get<any>('/tags/popular', {
      params: { limit },
    });
    return normalizeTagList(data);
  },

  // Adicionar tag a um recurso
  addTagToResource: async (
    resourceType: string,
    resourceId: string,
    tagId: string
  ): Promise<void> => {
    await apiService.post(`/tags/${resourceType}/${resourceId}`, {
      tag_id: tagId,
    });
  },

  // Remover tag de um recurso
  removeTagFromResource: async (
    resourceType: string,
    resourceId: string,
    tagId: string
  ): Promise<void> => {
    await apiService.delete(`/tags/${resourceType}/${resourceId}/${tagId}`);
  },

  // Buscar recursos por tag
  getResourcesByTag: async (
    tagId: string,
    resourceType?: string
  ): Promise<any[]> => {
    const params: any = { tag_id: tagId };
    if (resourceType) {
      params.resource_type = resourceType;
    }

    const data = await apiService.get('/tags/resources', { params });
    if (Array.isArray(data)) return data;
    if (data && Array.isArray((data as any).data)) return (data as any).data;
    return normalizeListResponse<any>(data, [
      'resources',
      'items',
      'results',
      'data',
    ]);
  },

  // Buscar estatísticas de tags
  getTagStats: async (): Promise<any> => {
    return apiService.get('/tags/stats');
  },

  // Exportar tags
  exportTags: async (filters?: any): Promise<Blob> => {
    return apiService.get('/tags/export', {
      params: filters,
      responseType: 'blob',
    });
  },
};

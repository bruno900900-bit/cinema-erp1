import { supabase } from '../config/supabaseClient';
import { Tag, TagKind } from '@/types/user';

export const tagService = {
  // Buscar todas as tags
  getTags: async (): Promise<Tag[]> => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      return (data || []).map((t: any) => ({
        id: String(t.id),
        name: t.name,
        kind: (t.kind as TagKind) || TagKind.FEATURE,
        color: t.color || '#4169E1',
      }));
    } catch (error) {
      console.error('Erro ao buscar tags:', error);
      return [];
    }
  },

  // Buscar tag por ID
  getTag: async (id: string): Promise<Tag | null> => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return {
        id: String(data.id),
        name: data.name,
        kind: (data.kind as TagKind) || TagKind.FEATURE,
        color: data.color || '#4169E1',
      };
    } catch {
      return null;
    }
  },

  // Criar nova tag
  createTag: async (tag: Partial<Tag>): Promise<Tag> => {
    console.log('🏷️ Creating tag:', tag);

    // Ensure name is present
    if (!tag.name) throw new Error('Nome da tag é obrigatório');

    const { data, error } = await supabase
      .from('tags')
      .insert([
        {
          name: tag.name,
          kind: tag.kind || TagKind.FEATURE,
          color: tag.color || '#4169E1',
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: String(data.id),
      name: data.name,
      kind: (data.kind as TagKind) || TagKind.FEATURE,
      color: data.color || '#4169E1',
    };
  },

  // Helper: Find or Create Tag by Name
  ensureTag: async (name: string, kind: string = 'feature'): Promise<Tag> => {
    // 1. Try to find
    const { data: existing } = await supabase
      .from('tags')
      .select('*')
      .ilike('name', name)
      .single();

    if (existing) {
      return {
        id: String(existing.id),
        name: existing.name,
        kind: (existing.kind as TagKind) || TagKind.FEATURE,
        color: existing.color,
      };
    }

    // 2. Create if not exists
    return await tagService.createTag({ name, kind: kind as TagKind });
  },

  // Atualizar tag
  updateTag: async (id: string, tag: Partial<Tag>): Promise<Tag> => {
    console.log('🏷️ Updating tag:', id, tag);

    const { data, error } = await supabase
      .from('tags')
      .update({
        name: tag.name,
        kind: tag.kind,
        color: tag.color,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: String(data.id),
      name: data.name,
      kind: (data.kind as TagKind) || TagKind.FEATURE,
      color: data.color || '#4169E1',
    };
  },

  // Excluir tag
  deleteTag: async (id: string): Promise<void> => {
    console.log('🏷️ Deleting tag:', id);
    // Dependencies (junction tables) should cascade via DB constraints usually
    // But we can be safe
    const { error } = await supabase.from('tags').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Associar tag a recurso
  addTagToResource: async (
    resourceType: 'project' | 'location',
    resourceId: string | number,
    tagId: string | number
  ): Promise<void> => {
    const table = resourceType === 'project' ? 'project_tags' : 'location_tags';
    const resourceCol =
      resourceType === 'project' ? 'project_id' : 'location_id';

    // Check if link exists to avoid error
    const { data: exists } = await supabase
      .from(table)
      .select('*')
      .eq(resourceCol, resourceId)
      .eq('tag_id', tagId)
      .single();

    if (exists) return;

    const { error } = await supabase
      .from(table)
      .insert([{ [resourceCol]: resourceId, tag_id: tagId }]);

    if (error) throw new Error(error.message);
  },

  // Remover tag de recurso
  removeTagFromResource: async (
    resourceType: 'project' | 'location',
    resourceId: string | number,
    tagId: string | number
  ): Promise<void> => {
    const table = resourceType === 'project' ? 'project_tags' : 'location_tags';
    const resourceCol =
      resourceType === 'project' ? 'project_id' : 'location_id';

    const { error } = await supabase
      .from(table)
      .delete()
      .eq(resourceCol, resourceId)
      .eq('tag_id', tagId);

    if (error) throw new Error(error.message);
  },

  // Buscar tags por recurso
  getTagsByResource: async (
    resourceType: 'project' | 'location',
    resourceId: string | number
  ): Promise<Tag[]> => {
    const table = resourceType === 'project' ? 'project_tags' : 'location_tags';
    const resourceCol =
      resourceType === 'project' ? 'project_id' : 'location_id';

    // Join with tags table
    const { data, error } = await supabase
      .from(table)
      .select('tag_id, tags(*)')
      .eq(resourceCol, resourceId);

    if (error) {
      console.error(`Error fetching tags for ${resourceType}:`, error);
      return [];
    }

    return (data || [])
      .map((item: any) => ({
        id: String(item.tags?.id),
        name: item.tags?.name,
        kind: item.tags?.kind,
        color: item.tags?.color,
      }))
      .filter((t: any) => t.id && t.name);
  },

  // Buscar tags por nome (busca parcial)
  searchTagsByName: async (name: string): Promise<Tag[]> => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .ilike('name', `%${name}%`)
        .limit(10);

      if (error) throw error;

      return (data || []).map((t: any) => ({
        id: String(t.id),
        name: t.name,
        kind: t.kind || 'feature',
        color: t.color || '#4169E1',
      }));
    } catch {
      return [];
    }
  },

  // Buscar tags mais utilizadas (mock stats for now)
  getPopularTags: async (limit: number = 10): Promise<Tag[]> => {
    return tagService.getTags();
  },
};

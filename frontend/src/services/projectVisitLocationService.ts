/**
 * Service para gerenciar locações visitadas em projetos
 * Usa Supabase diretamente (sem backend)
 */
import supabase from '../config/supabaseClient';
import { supabaseStorageService } from './supabaseStorageService';

// Types
export interface VisitLocation {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  geo_coordinates?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  status: 'visiting' | 'pending' | 'approved' | 'rejected' | 'on_hold';
  visit_date?: string;
  next_visit_date?: string;
  responsible_user_id?: number;
  rating?: number;
  notes?: string;
  pros?: string;
  cons?: string;
  estimated_daily_rate?: number;
  estimated_total_cost?: number;
  currency: string;
  cover_photo_url?: string;
  created_at: string;
  updated_at: string;
  // Computed (calculated in frontend)
  photos_count?: number;
  completed_stages_count?: number;
  total_stages_count?: number;
  workflow_progress?: number;
  // Relationships
  responsible_user?: UserBrief;
  photos?: VisitPhoto[];
  workflow_stages?: WorkflowStage[];
}

export interface VisitLocationBrief {
  id: number;
  project_id: number;
  name: string;
  city?: string;
  state?: string;
  status: string;
  visit_date?: string;
  rating?: number;
  photos_count: number;
  workflow_progress: number;
  total_stages_count?: number;
  completed_stages_count?: number;
  cover_photo_url?: string;
  created_at: string;
}

export interface VisitLocationCreate {
  project_id: number;
  name: string;
  description?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  geo_coordinates?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  status?: string;
  visit_date?: string;
  next_visit_date?: string;
  responsible_user_id?: number;
  rating?: number;
  notes?: string;
  pros?: string;
  cons?: string;
  estimated_daily_rate?: number;
  estimated_total_cost?: number;
  currency?: string;
}

export interface VisitLocationUpdate extends Partial<VisitLocationCreate> {}

export interface VisitPhoto {
  id: number;
  visit_location_id: number;
  filename?: string;
  original_filename?: string;
  file_path?: string;
  url?: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  file_size?: number;
  mime_type?: string;
  caption?: string;
  sort_order: number;
  uploaded_by_user_id?: number;
  created_at: string;
  updated_at: string;
  uploaded_by_user?: UserBrief;
  comments: PhotoComment[];
  comments_count: number;
}

export interface PhotoComment {
  id: number;
  photo_id: number;
  user_id: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user?: UserBrief;
}

export interface WorkflowStage {
  id: number;
  visit_location_id: number;
  title: string;
  description?: string;
  order_index: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'blocked';
  responsible_user_id?: number;
  due_date?: string;
  started_at?: string;
  completed_at?: string;
  completed_by_user_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  responsible_user?: UserBrief;
  completed_by_user?: UserBrief;
  is_overdue: boolean;
}

export interface WorkflowStageUpdate {
  title?: string;
  description?: string;
  order_index?: number;
  status?: string;
  responsible_user_id?: number;
  due_date?: string;
  notes?: string;
}

interface UserBrief {
  id: number;
  name: string;
  email?: string;
}

// Helper function to calculate workflow progress
const calculateWorkflowProgress = (stages: WorkflowStage[]): number => {
  if (!stages || stages.length === 0) return 0;
  const completed = stages.filter(s => s.status === 'completed').length;
  return Math.round((completed / stages.length) * 100);
};

// Helper to enrich location with computed fields
const enrichLocation = async (location: any): Promise<VisitLocation> => {
  // Get photos count
  const { count: photosCount } = await supabase
    .from('project_visit_photos')
    .select('*', { count: 'exact', head: true })
    .eq('visit_location_id', location.id);

  // Get workflow stages
  const { data: stages } = await supabase
    .from('project_visit_workflow_stages')
    .select('*')
    .eq('visit_location_id', location.id)
    .order('order_index', { ascending: true });

  const workflowStages = stages || [];
  const completedStages = workflowStages.filter(
    (s: any) => s.status === 'completed'
  ).length;

  return {
    ...location,
    photos_count: photosCount || 0,
    total_stages_count: workflowStages.length,
    completed_stages_count: completedStages,
    workflow_progress: calculateWorkflowProgress(
      workflowStages as WorkflowStage[]
    ),
    workflow_stages: workflowStages,
  };
};

// Service
export const projectVisitLocationService = {
  // ========== Visit Locations ==========

  async getByProject(projectId: number): Promise<VisitLocationBrief[]> {
    const { data, error } = await supabase
      .from('project_visit_locations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enrich with counts
    const enrichedLocations = await Promise.all(
      (data || []).map(async (loc: any) => {
        const { count: photosCount } = await supabase
          .from('project_visit_photos')
          .select('*', { count: 'exact', head: true })
          .eq('visit_location_id', loc.id);

        const { data: stages } = await supabase
          .from('project_visit_workflow_stages')
          .select('status')
          .eq('visit_location_id', loc.id);

        const workflowProgress = calculateWorkflowProgress(
          (stages as WorkflowStage[]) || []
        );

        // Get responsible user if exists
        let responsible_user = null;
        if (loc.responsible_user_id) {
          const { data: user } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', loc.responsible_user_id)
            .single();
          responsible_user = user;
        }

        const stagesArray = stages || [];
        const completedCount = stagesArray.filter(
          (s: any) => s.status === 'completed'
        ).length;

        return {
          ...loc,
          photos_count: photosCount || 0,
          total_stages_count: stagesArray.length,
          completed_stages_count: completedCount,
          workflow_progress: workflowProgress,
          responsible_user,
        };
      })
    );

    return enrichedLocations;
  },

  async getById(locationId: number): Promise<VisitLocation> {
    console.log('📍 getById called for location:', locationId);

    const { data, error } = await supabase
      .from('project_visit_locations')
      .select('*')
      .eq('id', locationId)
      .single();

    console.log('📍 getById result:', { data, error });

    if (error) throw error;

    // Get responsible user if exists
    let responsible_user = null;
    if (data.responsible_user_id) {
      const { data: user } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', data.responsible_user_id)
        .single();
      responsible_user = user;
    }

    // Get photos
    const { data: photos } = await supabase
      .from('project_visit_photos')
      .select('*')
      .eq('visit_location_id', locationId)
      .order('sort_order', { ascending: true });

    // Get comments for each photo and user info
    const photosWithComments = await Promise.all(
      (photos || []).map(async (photo: any) => {
        // Get uploader user
        let uploaded_by_user = null;
        if (photo.uploaded_by_user_id) {
          const { data: user } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', photo.uploaded_by_user_id)
            .single();
          uploaded_by_user = user;
        }

        // Get comments
        const { data: comments } = await supabase
          .from('photo_comments')
          .select('*')
          .eq('photo_id', photo.id)
          .order('created_at', { ascending: true });

        // Get user for each comment
        const commentsWithUser = await Promise.all(
          (comments || []).map(async (comment: any) => {
            const { data: user } = await supabase
              .from('users')
              .select('id, full_name, email')
              .eq('id', comment.user_id)
              .single();
            return { ...comment, user };
          })
        );

        return {
          ...photo,
          uploaded_by_user,
          comments: commentsWithUser,
          comments_count: commentsWithUser.length,
        };
      })
    );

    // Get workflow stages
    const { data: stages } = await supabase
      .from('project_visit_workflow_stages')
      .select('*')
      .eq('visit_location_id', locationId)
      .order('order_index', { ascending: true });

    // Get users for each stage
    const stagesWithUsers = await Promise.all(
      (stages || []).map(async (stage: any) => {
        let responsible_user = null;
        let completed_by_user = null;

        if (stage.responsible_user_id) {
          const { data: user } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', stage.responsible_user_id)
            .single();
          responsible_user = user;
        }

        if (stage.completed_by_user_id) {
          const { data: user } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', stage.completed_by_user_id)
            .single();
          completed_by_user = user;
        }

        return {
          ...stage,
          responsible_user,
          completed_by_user,
          is_overdue:
            stage.due_date &&
            new Date(stage.due_date) < new Date() &&
            stage.status !== 'completed',
        };
      })
    );

    const result = {
      ...data,
      responsible_user,
      photos: photosWithComments || [],
      workflow_stages: stagesWithUsers || [],
      photos_count: (photosWithComments || []).length,
      total_stages_count: (stagesWithUsers || []).length,
      completed_stages_count: (stagesWithUsers || []).filter(
        (s: any) => s.status === 'completed'
      ).length,
      workflow_progress: calculateWorkflowProgress(
        (stagesWithUsers || []) as WorkflowStage[]
      ),
    };

    console.log('📍 getById returning:', {
      id: result.id,
      name: result.name,
      photos_type: typeof result.photos,
      photos_isArray: Array.isArray(result.photos),
      photos_length: result.photos?.length,
      stages_type: typeof result.workflow_stages,
      stages_isArray: Array.isArray(result.workflow_stages),
      stages_length: result.workflow_stages?.length,
    });

    return result;
  },

  async create(data: VisitLocationCreate): Promise<VisitLocation> {
    const { data: created, error } = await supabase
      .from('project_visit_locations')
      .insert({
        ...data,
        status: data.status || 'visiting',
        currency: data.currency || 'BRL',
      })
      .select()
      .single();

    if (error) throw error;
    return enrichLocation(created);
  },

  async update(
    locationId: number,
    data: VisitLocationUpdate
  ): Promise<VisitLocation> {
    const { data: updated, error } = await supabase
      .from('project_visit_locations')
      .update(data)
      .eq('id', locationId)
      .select()
      .single();

    if (error) throw error;
    return enrichLocation(updated);
  },

  async delete(locationId: number): Promise<void> {
    const { error } = await supabase
      .from('project_visit_locations')
      .delete()
      .eq('id', locationId);

    if (error) throw error;
  },

  // ========== Photos ==========

  async uploadPhoto(
    locationId: number,
    file: File,
    caption?: string,
    userId: number = 1
  ): Promise<VisitPhoto> {
    // Upload to Supabase Storage
    const fileName = `visit_photos/${locationId}/${Date.now()}_${file.name}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('location-photos')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('location-photos')
      .getPublicUrl(fileName);

    // Get max sort_order
    const { data: maxSort } = await supabase
      .from('project_visit_photos')
      .select('sort_order')
      .eq('visit_location_id', locationId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = (maxSort?.[0]?.sort_order || 0) + 1;

    // Create photo record - uploaded_by_user_id is optional
    const insertData: any = {
      visit_location_id: locationId,
      filename: fileName,
      original_filename: file.name,
      file_path: uploadData.path,
      url: urlData.publicUrl,
      file_size: file.size,
      mime_type: file.type,
      caption: caption,
      sort_order: nextSortOrder,
    };

    // Only add user_id if provided and valid (not default)
    if (userId && userId > 0) {
      // Check if user exists before adding
      const { data: userExists } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (userExists) {
        insertData.uploaded_by_user_id = userId;
      }
    }

    const { data: photo, error } = await supabase
      .from('project_visit_photos')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    // If this is the first photo, set it as cover_photo_url
    if (nextSortOrder === 1) {
      await supabase
        .from('project_visit_locations')
        .update({ cover_photo_url: urlData.publicUrl })
        .eq('id', locationId);
    }

    return {
      ...photo,
      comments: [],
      comments_count: 0,
    };
  },

  async getPhotos(locationId: number): Promise<VisitPhoto[]> {
    const { data, error } = await supabase
      .from('project_visit_photos')
      .select('*')
      .eq('visit_location_id', locationId)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    // Get comments for each photo with user info
    const photosWithComments = await Promise.all(
      (data || []).map(async (photo: any) => {
        // Get uploader user
        let uploaded_by_user = null;
        if (photo.uploaded_by_user_id) {
          const { data: user } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', photo.uploaded_by_user_id)
            .single();
          uploaded_by_user = user;
        }

        // Get comments
        const { data: comments } = await supabase
          .from('photo_comments')
          .select('*')
          .eq('photo_id', photo.id)
          .order('created_at', { ascending: true });

        // Get user info for each comment
        const commentsWithUsers = await Promise.all(
          (comments || []).map(async (comment: any) => {
            let user = null;
            if (comment.user_id) {
              const { data: userData } = await supabase
                .from('users')
                .select('id, full_name, email')
                .eq('id', comment.user_id)
                .single();
              user = userData;
            }
            return { ...comment, user };
          })
        );

        return {
          ...photo,
          uploaded_by_user,
          comments: commentsWithUsers,
          comments_count: commentsWithUsers.length,
        };
      })
    );

    return photosWithComments;
  },

  async deletePhoto(photoId: number): Promise<void> {
    // Get photo to delete from storage
    const { data: photo } = await supabase
      .from('project_visit_photos')
      .select('file_path')
      .eq('id', photoId)
      .single();

    if (photo?.file_path) {
      await supabase.storage.from('location-photos').remove([photo.file_path]);
    }

    const { error } = await supabase
      .from('project_visit_photos')
      .delete()
      .eq('id', photoId);

    if (error) throw error;
  },

  async updatePhotoCaption(photoId: number, caption: string): Promise<void> {
    const { error } = await supabase
      .from('project_visit_photos')
      .update({ caption })
      .eq('id', photoId);

    if (error) throw error;
  },

  // ========== Comments ==========

  async addComment(
    photoId: number,
    comment: string,
    userId: number | null
  ): Promise<PhotoComment> {
    const insertData: any = {
      photo_id: photoId,
      comment: comment,
    };

    // Only add user_id if provided
    if (userId) {
      insertData.user_id = userId;
    }

    const { data, error } = await supabase
      .from('photo_comments')
      .insert(insertData)
      .select('*')
      .single();

    if (error) throw error;

    // Fetch user info
    let user = null;
    if (data.user_id) {
      const { data: userData } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', data.user_id)
        .single();
      user = userData;
    }

    return { ...data, user };
  },

  async getComments(photoId: number): Promise<PhotoComment[]> {
    const { data, error } = await supabase
      .from('photo_comments')
      .select('*')
      .eq('photo_id', photoId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Fetch user info for each comment
    const commentsWithUsers = await Promise.all(
      (data || []).map(async (comment: any) => {
        let user = null;
        if (comment.user_id) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', comment.user_id)
            .single();
          user = userData;
        }
        return { ...comment, user };
      })
    );

    return commentsWithUsers;
  },

  async deleteComment(commentId: number): Promise<void> {
    const { error } = await supabase
      .from('photo_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
  },

  // ========== Workflow Stages ==========

  async addStage(
    locationId: number,
    title: string,
    description?: string,
    responsibleUserId?: number,
    dueDate?: string
  ): Promise<WorkflowStage> {
    // Get max order_index
    const { data: maxOrder } = await supabase
      .from('project_visit_workflow_stages')
      .select('order_index')
      .eq('visit_location_id', locationId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrderIndex = (maxOrder?.[0]?.order_index || 0) + 1;

    const { data, error } = await supabase
      .from('project_visit_workflow_stages')
      .insert({
        visit_location_id: locationId,
        title,
        description,
        order_index: nextOrderIndex,
        status: 'pending',
        responsible_user_id: responsibleUserId,
        due_date: dueDate,
      })
      .select('*')
      .single();

    if (error) throw error;

    // Get responsible user if exists
    let responsible_user = null;
    if (data.responsible_user_id) {
      const { data: user } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', data.responsible_user_id)
        .single();
      responsible_user = user;
    }

    return {
      ...data,
      responsible_user,
      is_overdue: false,
    };
  },

  async getStages(locationId: number): Promise<WorkflowStage[]> {
    const { data, error } = await supabase
      .from('project_visit_workflow_stages')
      .select('*')
      .eq('visit_location_id', locationId)
      .order('order_index', { ascending: true });

    if (error) throw error;

    // Fetch users for each stage
    const stagesWithUsers = await Promise.all(
      (data || []).map(async (stage: any) => {
        let responsible_user = null;
        let completed_by_user = null;

        if (stage.responsible_user_id) {
          const { data: user } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', stage.responsible_user_id)
            .single();
          responsible_user = user;
        }

        if (stage.completed_by_user_id) {
          const { data: user } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', stage.completed_by_user_id)
            .single();
          completed_by_user = user;
        }

        return {
          ...stage,
          responsible_user,
          completed_by_user,
          is_overdue:
            stage.due_date &&
            new Date(stage.due_date) < new Date() &&
            stage.status !== 'completed',
        };
      })
    );

    return stagesWithUsers;
  },

  async updateStage(
    stageId: number,
    data: WorkflowStageUpdate,
    userId: number = 1
  ): Promise<WorkflowStage> {
    const updateData: any = { ...data };

    // If status is changing to in_progress, set started_at
    if (data.status === 'in_progress') {
      updateData.started_at = new Date().toISOString();
    }

    // If status is changing to completed, set completed_at and completed_by
    if (data.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by_user_id = userId;
    }

    // If notes provided, update notes
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    const { data: updated, error } = await supabase
      .from('project_visit_workflow_stages')
      .update(updateData)
      .eq('id', stageId)
      .select('*')
      .single();

    if (error) throw error;

    // Fetch users
    let responsible_user = null;
    let completed_by_user = null;

    if (updated.responsible_user_id) {
      const { data: user } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', updated.responsible_user_id)
        .single();
      responsible_user = user;
    }

    if (updated.completed_by_user_id) {
      const { data: user } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', updated.completed_by_user_id)
        .single();
      completed_by_user = user;
    }

    return {
      ...updated,
      responsible_user,
      completed_by_user,
      is_overdue:
        updated.due_date &&
        new Date(updated.due_date) < new Date() &&
        updated.status !== 'completed',
    };
  },

  async completeStage(stageId: number, userId: number): Promise<void> {
    const { error } = await supabase
      .from('project_visit_workflow_stages')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by_user_id: userId,
      })
      .eq('id', stageId);

    if (error) throw error;
  },

  async deleteStage(stageId: number): Promise<void> {
    const { error } = await supabase
      .from('project_visit_workflow_stages')
      .delete()
      .eq('id', stageId);

    if (error) throw error;
  },

  async reorderStages(locationId: number, stageIds: number[]): Promise<void> {
    // Update order_index for each stage
    const updates = stageIds.map((id, index) =>
      supabase
        .from('project_visit_workflow_stages')
        .update({ order_index: index })
        .eq('id', id)
    );

    await Promise.all(updates);
  },
};

export default projectVisitLocationService;

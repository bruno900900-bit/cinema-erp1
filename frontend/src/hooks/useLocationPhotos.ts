import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import photoUploadService from '../services/photoUploadService';

export function useLocationPhotos(locationId: string | null) {
  const queryClient = useQueryClient();

  const listKey = ['location-photos', locationId];

  const listQuery = useQuery({
    queryKey: listKey,
    queryFn: async () => {
      if (!locationId) return { location_id: '', photos: [], total: 0 } as any;
      const res = await photoUploadService.listPhotos(locationId);
      return res;
    },
    enabled: !!locationId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (!locationId) throw new Error('locationId é obrigatório');
      const res = await photoUploadService.uploadPhotos(locationId, files);
      return res.uploaded_photos;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKey });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (photoId: string | number) => {
      if (!locationId) throw new Error('locationId é obrigatório');
      return await photoUploadService.deletePhoto(locationId, photoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listKey });
    },
  });

  return {
    photosResponse: listQuery.data,
    isLoading: listQuery.isLoading,
    error: listQuery.error as Error | null,
    refetch: listQuery.refetch,

    upload: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,

    remove: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
  };
}

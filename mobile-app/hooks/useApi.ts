import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../services/api";
import { useAuthStore } from "./useAuthStore";

// Custom hook for API operations
export const useApi = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Video Upload Mutation
  const useUploadVideo = () => {
    return useMutation({
      mutationFn: async (uploadData: {
        fileName: string;
        fileType: string;
      }) => {
        if (!user) {
          throw new Error("User not authenticated");
        }

        return apiService.uploadVideo({
          ...uploadData,
          orgId: user.orgId,
          userId: user.userId,
        });
      },
      onSuccess: () => {
        // Invalidate and refetch videos list
        queryClient.invalidateQueries({ queryKey: ["videos"] });
        queryClient.invalidateQueries({ queryKey: ["detections"] });
      },
    });
  };

  // Search Detections Query
  const useSearchDetections = (filters?: any, limit?: number) => {
    return useQuery({
      queryKey: ["detections", filters, limit],
      queryFn: async () => {
        if (!user) {
          throw new Error("User not authenticated");
        }

        return apiService.searchDetections({
          orgId: user.orgId,
          filters,
          limit,
        });
      },
      enabled: !!user,
    });
  };

  // Get Video Details Query
  const useVideoDetails = (videoId: string) => {
    return useQuery({
      queryKey: ["video", videoId],
      queryFn: async () => {
        if (!user) {
          throw new Error("User not authenticated");
        }

        return apiService.getVideo(videoId, user.orgId);
      },
      enabled: !!user && !!videoId,
    });
  };

  // Get Video Playback URL Query
  const useVideoPlayback = (videoId: string) => {
    return useQuery({
      queryKey: ["video-playback", videoId],
      queryFn: async () => {
        if (!user) {
          throw new Error("User not authenticated");
        }

        return apiService.getVideoPlaybackUrl(videoId, user.orgId);
      },
      enabled: !!user && !!videoId,
    });
  };

  return {
    useUploadVideo,
    useSearchDetections,
    useVideoDetails,
    useVideoPlayback,
  };
};

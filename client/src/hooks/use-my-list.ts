import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useMyList(movieId?: string) {
  const { toast } = useToast();

  // Check if movie is in My List
  const { data: inListData } = useQuery({
    queryKey: ["/api/my-list/check", movieId],
    queryFn: async () => {
      if (!movieId) return { inList: false };
      const response = await fetch(`/api/my-list/check/${movieId}`);
      if (!response.ok) return { inList: false };
      return response.json();
    },
    enabled: !!movieId,
    staleTime: 1 * 60 * 1000,
  });

  // Add to My List
  const addMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await apiRequest("POST", `/api/my-list/${id}`, {});
      return await result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-list"] });
      if (movieId) {
        queryClient.invalidateQueries({ queryKey: ["/api/my-list/check", movieId] });
      }
      toast({
        title: "Added to My List",
        description: "Movie added to your list successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add",
        description: error.message || "Failed to add movie to your list",
        variant: "destructive",
      });
    },
  });

  // Remove from My List
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await apiRequest("DELETE", `/api/my-list/${id}`, {});
      return await result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-list"] });
      if (movieId) {
        queryClient.invalidateQueries({ queryKey: ["/api/my-list/check", movieId] });
      }
      toast({
        title: "Removed from My List",
        description: "Movie removed from your list",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove",
        description: error.message || "Failed to remove movie from your list",
        variant: "destructive",
      });
    },
  });

  const toggleMyList = async (id: string) => {
    // Fetch fresh state to determine action
    try {
      const response = await fetch(`/api/my-list/check/${id}`);
      const data = await response.json();
      
      if (data.inList) {
        removeMutation.mutate(id);
      } else {
        addMutation.mutate(id);
      }
    } catch (error) {
      // If check fails, default to add
      addMutation.mutate(id);
    }
  };

  return {
    inList: inListData?.inList || false,
    addToList: addMutation.mutate,
    removeFromList: removeMutation.mutate,
    toggleMyList,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

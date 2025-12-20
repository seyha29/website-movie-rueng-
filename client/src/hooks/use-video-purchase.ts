import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface VideoPurchaseStatus {
  isPurchased: boolean;
}

export function useVideoPurchase(movieId: string | null) {
  const { data, isLoading } = useQuery<VideoPurchaseStatus>({
    queryKey: ['/api/videos', movieId, 'purchased'],
    enabled: !!movieId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  return {
    isPurchased: data?.isPurchased ?? false,
    isLoading,
  };
}

export function useVideoPurchaseGate() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [currentMovieId, setCurrentMovieId] = useState<string | null>(null);
  const [currentMovieTitle, setCurrentMovieTitle] = useState<string>("");
  const [currentMoviePrice, setCurrentMoviePrice] = useState<string>("1.00");

  const initiatePaymentMutation = useMutation({
    mutationFn: async (movieId: string) => {
      return await apiRequest('POST', `/api/videos/${movieId}/purchase`);
    },
  });

  const checkAndExecute = async (movieId: string, movieTitle: string, action: () => void, moviePrice?: string) => {
    try {
      // Check if video is already purchased
      const response = await fetch(`/api/videos/${movieId}/purchased`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to check purchase status');
      }

      const { isPurchased } = await response.json();

      if (isPurchased) {
        // Video is purchased, execute action immediately
        action();
      } else {
        // Video not purchased, show payment modal
        setCurrentMovieId(movieId);
        setCurrentMovieTitle(movieTitle);
        setCurrentMoviePrice(moviePrice || "1.00");
        setPendingAction(() => action);
        setShowPaymentModal(true);
      }
    } catch (error) {
      console.error('Failed to check video purchase status:', error);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setCurrentMovieId(null);
    setCurrentMovieTitle("");
    setCurrentMoviePrice("1.00");
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setPendingAction(null);
    setCurrentMovieId(null);
    setCurrentMovieTitle("");
    setCurrentMoviePrice("1.00");
  };

  return {
    checkAndExecute,
    showPaymentModal,
    handlePaymentSuccess,
    handlePaymentCancel,
    currentMovieId,
    currentMovieTitle,
    currentMoviePrice,
    initiatePayment: initiatePaymentMutation.mutate,
    isInitiatingPayment: initiatePaymentMutation.isPending,
  };
}

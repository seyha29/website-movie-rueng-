import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: string;
  startDate: number;
  endDate: number | null;
  autoRenew: number;
}

interface SubscriptionStatus {
  isSubscribed: boolean;
  subscription: Subscription | null;
}

export function useSubscription() {
  const { data, isLoading, refetch } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription/status'],
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  return {
    isSubscribed: data?.isSubscribed ?? false,
    subscription: data?.subscription ?? null,
    isLoading,
    refetch,
  };
}

export function useSubscriptionGate() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const { isSubscribed, isLoading } = useSubscription();

  const checkAndExecute = (action: () => void) => {
    if (isLoading) return;
    
    if (isSubscribed) {
      // User is subscribed, execute action immediately
      action();
    } else {
      // User is not subscribed, show payment modal
      setPendingAction(() => action);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setPendingAction(null);
  };

  return {
    checkAndExecute,
    showPaymentModal,
    handlePaymentSuccess,
    handlePaymentCancel,
    isSubscribed,
    isLoading,
  };
}

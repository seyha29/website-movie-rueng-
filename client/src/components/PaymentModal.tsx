import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, CheckCircle } from "lucide-react";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  mode?: 'subscription' | 'video';
  movieId?: string | null;
  movieTitle?: string;
  moviePrice?: string;
}

export function PaymentModal({ 
  open, 
  onOpenChange, 
  onSuccess,
  mode = 'subscription',
  movieId = null,
  movieTitle = '',
  moviePrice = '1.00',
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isVideoMode = mode === 'video' && movieId;
  const paymentAmount = isVideoMode ? `$${moviePrice}` : '$2';
  const paymentType = isVideoMode ? 'video purchase' : 'monthly subscription';
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const paymentRefRef = useRef<string | null>(null);

  const initiatePaymentMutation = useMutation({
    mutationFn: async () => {
      const endpoint = isVideoMode 
        ? `/api/videos/${movieId}/purchase`
        : '/api/payments/initiate';
      
      const response = await apiRequest('POST', endpoint);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initiate payment');
      }
      return response.json();
    },
    onSuccess: async (data) => {
      // Save paymentRef for polling
      if (data.paymentRef) {
        paymentRefRef.current = data.paymentRef;
      }
      
      // Check if we have a checkout URL (real payment provider)
      if (data.checkoutUrl) {
        console.log('[Payment] Opening RaksemeyPay QR code:', data.checkoutUrl);
        // Show the checkout URL in the modal (QR code will be displayed in iframe)
        setCheckoutUrl(data.checkoutUrl);
        return;
      }
      
      // For mock payments, auto-complete the payment
      try {
        setIsProcessing(true);
        
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Complete the mock payment (DEV ONLY - requires secret header)
        const completeResponse = await fetch(`/api/payments/mock/complete/${data.paymentRef}`, {
          method: 'POST',
          headers: {
            'X-Dev-Secret': import.meta.env.VITE_MOCK_PAYMENT_SECRET || 'dev-only-secret-12345',
          },
          credentials: 'include',
        });
        
        if (!completeResponse.ok) {
          const error = await completeResponse.json();
          throw new Error(error.error || 'Payment completion failed');
        }
        
        const result = await completeResponse.json();
        
        if (result.status === 'completed') {
          toast({
            title: "Payment Successful!",
            description: isVideoMode 
              ? `You can now watch "${movieTitle}".`
              : "You now have unlimited access to all movies for 1 month.",
          });
          
          // Invalidate cache based on payment mode
          if (isVideoMode) {
            await queryClient.invalidateQueries({ queryKey: ['/api/videos', movieId, 'purchased'] });
            await queryClient.invalidateQueries({ queryKey: ['/api/my-list'] });
          } else {
            await queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
          }
          
          setIsProcessing(false);
          onOpenChange(false);
          
          // Call success callback (to play the video)
          if (onSuccess) {
            onSuccess();
          }
        } else {
          throw new Error('Payment status is not completed');
        }
      } catch (error: any) {
        setIsProcessing(false);
        toast({
          title: "Payment Failed",
          description: error.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePayNow = () => {
    initiatePaymentMutation.mutate();
  };

  const handleClosePayment = () => {
    // Clear polling interval
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setCheckoutUrl(null);
    setPaymentSuccess(false);
    setCountdown(5);
    paymentRefRef.current = null;
    onOpenChange(false);
  };

  // Handle payment success with 5 second countdown
  const handlePaymentCompleted = async () => {
    setPaymentSuccess(true);
    setCountdown(5);
    
    // Clear polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    
    toast({
      title: "Payment Successful!",
      description: isVideoMode 
        ? `You can now watch "${movieTitle}".`
        : "You now have unlimited access to all movies for 1 month.",
    });
    
    // Invalidate cache based on payment mode
    if (isVideoMode) {
      await queryClient.invalidateQueries({ queryKey: ['/api/videos', movieId, 'purchased'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/my-list'] });
    } else {
      await queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
    }
  };

  // Countdown effect for auto-close after payment success
  useEffect(() => {
    if (paymentSuccess && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (paymentSuccess && countdown === 0) {
      // Auto-close after countdown
      handleClosePayment();
      if (onSuccess) {
        onSuccess();
      }
    }
  }, [paymentSuccess, countdown]);

  // Poll for payment status when QR code is showing
  useEffect(() => {
    if (checkoutUrl && !paymentSuccess) {
      // Poll every 3 seconds to verify payment and complete purchase
      pollingRef.current = setInterval(async () => {
        try {
          // For video mode, verify the payment with RaksemeyPay and complete purchase
          if (isVideoMode && movieId && paymentRefRef.current) {
            const response = await fetch(`/api/videos/${movieId}/verify-purchase`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentRef: paymentRefRef.current }),
              credentials: 'include',
            });
            if (response.ok) {
              const data = await response.json();
              if (data.isPurchased || data.status === 'completed') {
                handlePaymentCompleted();
              }
            }
          } else if (!isVideoMode) {
            // For subscription mode, verify with payment ref
            if (paymentRefRef.current) {
              const response = await fetch(`/api/payments/verify/${paymentRefRef.current}`, {
                method: 'POST',
                credentials: 'include',
              });
              if (response.ok) {
                const data = await response.json();
                if (data.status === 'completed') {
                  handlePaymentCompleted();
                }
              }
            }
          }
        } catch (error) {
          console.error('Error polling payment status:', error);
        }
      }, 3000);
      
      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    }
  }, [checkoutUrl, paymentSuccess, isVideoMode, movieId]);

  // Listen for payment callback (when user returns from RaksemeyPay)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Listen for payment completion message
      if (event.data?.type === 'payment_completed') {
        handlePaymentCompleted();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess, queryClient, toast]);

  return (
    <Dialog open={open} onOpenChange={handleClosePayment}>
      <DialogContent 
        className="sm:max-w-[500px]" 
        data-testid="dialog-payment"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-moul">
            {checkoutUrl ? "Scan QR Code to Pay" : (isVideoMode ? `Purchase "${movieTitle}"` : "Subscribe to Watch")}
          </DialogTitle>
          <DialogDescription className="text-base">
            {checkoutUrl 
              ? "Scan the QR code below with your mobile banking app to complete payment."
              : (isVideoMode 
                  ? `Pay $1 to watch this movie. It will be automatically added to your list.`
                  : "Get unlimited access to all movies with our monthly subscription."
                )
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Payment Success Screen */}
          {paymentSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-green-500 mb-2">Payment Successful!</h3>
              <p className="text-muted-foreground mb-4">
                {isVideoMode 
                  ? `You can now watch "${movieTitle}".`
                  : "You now have unlimited access to all movies for 1 month."}
              </p>
              <p className="text-sm text-muted-foreground">
                Closing in <span className="font-bold text-primary">{countdown}</span> seconds...
              </p>
              <Button
                className="mt-6"
                onClick={() => {
                  handleClosePayment();
                  if (onSuccess) onSuccess();
                }}
                data-testid="button-play-now"
              >
                {isVideoMode ? "Play Now" : "Start Watching"}
              </Button>
            </div>
          ) : checkoutUrl ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8">
              {/* QR Code Display */}
              <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(checkoutUrl)}`}
                  alt="Payment QR Code"
                  className="w-[280px] h-[280px]"
                  data-testid="img-qr-code"
                />
              </div>
              
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold">Scan QR Code with Banking App</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Open your mobile banking app (ABA, ACLEDA, Wing, etc.) and scan this QR code to complete payment.
                  </p>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Waiting for payment confirmation...</span>
                </div>
                
                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(checkoutUrl, '_blank')}
                    data-testid="button-open-payment"
                  >
                    Open Payment Page
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClosePayment}
                    data-testid="button-close-payment"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Payment Details */}
              <div className="rounded-md border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">
                  {isVideoMode ? movieTitle : "Monthly Subscription"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isVideoMode ? "Pay per view" : "Unlimited access for 30 days"}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{paymentAmount}</div>
                <div className="text-sm text-muted-foreground">
                  {isVideoMode ? "/video" : "/month"}
                </div>
              </div>
            </div>
            
            <div className="space-y-2 border-t border-border pt-4">
              {isVideoMode ? (
                <>
                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Instant access to this movie</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Auto-added to My List</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Watch unlimited times</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Unlimited access to all movies</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>HD quality streaming</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Watch on any device</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Cancel anytime</span>
                  </div>
                </>
              )}
            </div>
          </div>

              {/* Payment Processing Status */}
              {isProcessing && (
            <div className="rounded-md border border-border bg-muted/50 p-4">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processing your payment...</span>
              </div>
            </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={initiatePaymentMutation.isPending || isProcessing}
              data-testid="button-cancel-payment"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handlePayNow}
              disabled={initiatePaymentMutation.isPending || isProcessing}
              data-testid="button-pay-now"
            >
              {initiatePaymentMutation.isPending || isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isProcessing ? 'Processing...' : 'Starting...'}
                </>
              ) : (
                `Pay ${paymentAmount} Now`
              )}
            </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

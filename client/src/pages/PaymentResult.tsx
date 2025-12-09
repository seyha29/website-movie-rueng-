import { useEffect, useState } from "react";
import { useLocation as useWouterLocation, useRoute } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PaymentResult() {
  const [, params] = useRoute("/payments/result");
  const [,setLocation] = useWouterLocation();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(true);

  // Parse query parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const status = urlParams.get('status');
  const ref = urlParams.get('ref');
  const message = urlParams.get('message');

  useEffect(() => {
    if (status === 'success') {
      // Refetch subscription status after successful payment
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Stop processing after 1 second to show success message
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    } else {
      // For errors, show immediately
      setIsProcessing(false);
    }
  }, [status, queryClient]);

  const handleContinue = () => {
    setLocation('/');
  };

  const handleTryAgain = () => {
    setLocation('/');
  };

  if (isProcessing && status === 'success') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                Processing Payment
              </CardTitle>
              <CardDescription>
                Please wait while we confirm your payment...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        {status === 'success' ? (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-6 w-6" />
                Payment Successful!
              </CardTitle>
              <CardDescription>
                Your subscription has been activated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Thank you for subscribing! You now have unlimited access to all movies for 30 days.
              </p>
              {ref && (
                <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md font-mono">
                  Payment Reference: {ref}
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleContinue}
                data-testid="button-continue"
              >
                Start Watching
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="h-6 w-6" />
                Payment Failed
              </CardTitle>
              <CardDescription>
                There was an issue processing your payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {message ? decodeURIComponent(message) : 'An unexpected error occurred. Please try again.'}
              </p>
              <p className="text-xs text-muted-foreground">
                If you continue to experience issues, please contact support.
              </p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleTryAgain}
                data-testid="button-try-again"
              >
                Try Again
              </Button>
              <Button 
                className="flex-1"
                onClick={() => setLocation('/')}
                data-testid="button-home"
              >
                Go Home
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}

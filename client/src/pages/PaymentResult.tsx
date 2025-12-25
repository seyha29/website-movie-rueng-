import { useEffect, useState } from "react";
import { useLocation as useWouterLocation, useRoute } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { paymentResultLabels } from "@/lib/translations";

export default function PaymentResult() {
  const [, params] = useRoute("/payments/result");
  const [,setLocation] = useWouterLocation();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(true);
  const { language } = useLanguage();
  const t = paymentResultLabels;

  const urlParams = new URLSearchParams(window.location.search);
  const status = urlParams.get('status');
  const ref = urlParams.get('ref');
  const message = urlParams.get('message');

  useEffect(() => {
    if (status === 'success') {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    } else {
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
                {t.processingPayment[language]}
              </CardTitle>
              <CardDescription>
                {t.pleaseWait[language]}
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
                {t.paymentSuccessful[language]}
              </CardTitle>
              <CardDescription>
                {t.subscriptionActivated[language]}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t.thankYou[language]}
              </p>
              {ref && (
                <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md font-mono">
                  {t.paymentReference[language]} {ref}
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleContinue}
                data-testid="button-continue"
              >
                {t.startWatching[language]}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="h-6 w-6" />
                {t.paymentFailed[language]}
              </CardTitle>
              <CardDescription>
                {t.issueProcessing[language]}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {message ? decodeURIComponent(message) : t.unexpectedError[language]}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.contactSupport[language]}
              </p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleTryAgain}
                data-testid="button-try-again"
              >
                {t.tryAgain[language]}
              </Button>
              <Button 
                className="flex-1"
                onClick={() => setLocation('/')}
                data-testid="button-home"
              >
                {t.goHome[language]}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}

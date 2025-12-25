import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { notFoundLabels } from "@/lib/translations";

export default function NotFound() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const t = notFoundLabels;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-foreground">{t.pageNotFound[language]}</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {t.pageNotExist[language]}
          </p>
          
          <Button 
            className="mt-6 w-full"
            onClick={() => setLocation('/')}
          >
            {t.goBackHome[language]}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

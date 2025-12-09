import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { registerPageLabels } from "@/lib/translations";

export default function Register() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const registerMutation = useMutation({
    mutationFn: async (data: { fullName: string; phoneNumber: string; password: string }) => {
      const result = await apiRequest("POST", "/api/auth/register", data);
      return await result.json();
    },
    onSuccess: (user) => {
      // Invalidate queries before redirect
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      // Determine redirect path (new users always go to homepage)
      const redirectPath = user.isAdmin === 1 ? "/admin" : "/";
      
      // Use hard redirect for reliability
      window.location.href = redirectPath;
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please check your information and try again",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast({
        title: "Full name required",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: "Password required",
        description: "Please enter a password",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    // Convert phone number: 012345678 → +85512345678
    const formattedPhone = phoneNumber.trim().startsWith("+855") 
      ? phoneNumber.trim() 
      : `+855${phoneNumber.trim().replace(/^0/, "")}`;

    registerMutation.mutate({ fullName, phoneNumber: formattedPhone, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-3 sm:px-4">
      <Card className="w-full max-w-md relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2"
          onClick={() => setLocation("/")}
          data-testid="button-close"
        >
          <X className="h-4 w-4" />
        </Button>
        <CardHeader className="space-y-1 px-4 sm:px-6 pt-5 sm:pt-6">
          <CardTitle className="text-xl sm:text-2xl font-bold text-center">{registerPageLabels.createAccount[language]}</CardTitle>
          <CardDescription className="text-center text-sm">
            {registerPageLabels.registerToReoung[language]}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-5 sm:pb-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="fullName" className="text-xs sm:text-sm font-medium">
                {registerPageLabels.fullName[language]}
              </label>
              <Input
                id="fullName"
                type="text"
                placeholder={registerPageLabels.fullNamePlaceholder[language]}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                data-testid="input-fullname"
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="phone" className="text-xs sm:text-sm font-medium">
                {registerPageLabels.phoneNumber[language]}
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder={registerPageLabels.phoneNumberPlaceholder[language]}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                data-testid="input-phone-register"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {registerPageLabels.phoneNumberHelper[language]}
              </p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="password" className="text-xs sm:text-sm font-medium">
                {registerPageLabels.password[language]}
              </label>
              <Input
                id="password"
                type="password"
                placeholder={registerPageLabels.passwordPlaceholder[language]}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-password-register"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {registerPageLabels.passwordHelper[language]}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full text-sm"
              disabled={registerMutation.isPending}
              data-testid="button-register-submit"
            >
              {registerMutation.isPending ? (language === "km" ? "កំពុងបង្កើតគណនី..." : "Creating account...") : registerPageLabels.registerButton[language]}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">{registerPageLabels.haveAccount[language]} </span>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setLocation("/login")}
                data-testid="link-login"
              >
                {registerPageLabels.loginLink[language]}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

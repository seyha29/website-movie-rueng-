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
import { loginPageLabels } from "@/lib/translations";

export default function Login() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; password: string }) => {
      const result = await apiRequest("POST", "/api/auth/login", data);
      return await result.json();
    },
    onSuccess: (user) => {
      // Determine redirect path based on user role
      const redirectPath = user.isAdmin === 1 ? "/admin" : "/";
      
      // Invalidate queries before redirect
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      // Use hard redirect for reliability
      window.location.href = redirectPath;
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid phone number or password",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    // Convert phone number: 012345678 → +85512345678
    const formattedPhone = phoneNumber.trim().startsWith("+855") 
      ? phoneNumber.trim() 
      : `+855${phoneNumber.trim().replace(/^0/, "")}`;

    loginMutation.mutate({ phoneNumber: formattedPhone, password });
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
          <CardTitle className="text-xl sm:text-2xl font-bold text-center">{loginPageLabels.welcomeBack[language]}</CardTitle>
          <CardDescription className="text-center text-sm">
            {loginPageLabels.loginToReoung[language]}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-5 sm:pb-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="phone" className="text-xs sm:text-sm font-medium">
                {loginPageLabels.phoneNumber[language]}
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder={loginPageLabels.phoneNumberPlaceholder[language]}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                data-testid="input-phone-login"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {loginPageLabels.phoneNumberHelper[language]}
              </p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="password" className="text-xs sm:text-sm font-medium">
                {loginPageLabels.password[language]}
              </label>
              <Input
                id="password"
                type="password"
                placeholder={loginPageLabels.passwordPlaceholder[language]}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-password-login"
                className="text-sm"
              />
            </div>

            <Button
              type="submit"
              className="w-full text-sm"
              disabled={loginMutation.isPending}
              data-testid="button-login-submit"
            >
              {loginMutation.isPending ? (language === "km" ? "កំពុងចូល..." : "Logging in...") : loginPageLabels.loginButton[language]}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">{loginPageLabels.noAccount[language]} </span>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setLocation("/register")}
                data-testid="link-register"
              >
                {loginPageLabels.registerLink[language]}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

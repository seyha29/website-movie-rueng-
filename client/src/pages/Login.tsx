import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { X, Eye, EyeOff, Phone, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { loginPageLabels } from "@/lib/translations";

export default function Login() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const [loginMethod, setLoginMethod] = useState<"phone" | "email">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (data: { phoneNumber?: string; email?: string; password: string }) => {
      const result = await apiRequest("POST", "/api/auth/login", data);
      return await result.json();
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      // Check for pending movie actions from before login
      const pendingMovieId = sessionStorage.getItem('pendingMovieId');
      const pendingMovieAction = sessionStorage.getItem('pendingMovieAction');
      const pendingAddMovieId = sessionStorage.getItem('pendingAddMovieId');
      
      if (pendingMovieId) {
        sessionStorage.removeItem('pendingMovieId');
        sessionStorage.removeItem('pendingMovieAction');
        // Redirect back to movie detail - the action will be handled there
        window.location.href = `/movie/${pendingMovieId}`;
        return;
      }
      
      if (pendingAddMovieId) {
        sessionStorage.removeItem('pendingAddMovieId');
        window.location.href = '/';
        return;
      }
      
      const redirectPath = user.isAdmin === 1 ? "/admin" : "/";
      window.location.href = redirectPath;
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginMethod === "phone") {
      if (!phoneNumber.trim()) {
        toast({
          title: "Phone number required",
          description: "Please enter your phone number",
          variant: "destructive",
        });
        return;
      }
      loginMutation.mutate({ phoneNumber: phoneNumber.trim(), password });
    } else {
      if (!email.trim()) {
        toast({
          title: "Email required",
          description: "Please enter your email",
          variant: "destructive",
        });
        return;
      }
      loginMutation.mutate({ email: email.trim().toLowerCase(), password });
    }
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
            <Tabs value={loginMethod} onValueChange={(v) => setLoginMethod(v as "phone" | "email")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {loginPageLabels.phoneTab[language]}
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {loginPageLabels.emailTab[language]}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="phone" className="space-y-1.5 sm:space-y-2 mt-4">
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
              </TabsContent>
              
              <TabsContent value="email" className="space-y-1.5 sm:space-y-2 mt-4">
                <label htmlFor="email" className="text-xs sm:text-sm font-medium">
                  {loginPageLabels.email[language]}
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder={loginPageLabels.emailPlaceholder[language]}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email-login"
                  className="text-sm"
                />
              </TabsContent>
            </Tabs>

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="password" className="text-xs sm:text-sm font-medium">
                {loginPageLabels.password[language]}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={loginPageLabels.passwordPlaceholder[language]}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-password-login"
                  className="text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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

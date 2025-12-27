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
import { registerPageLabels } from "@/lib/translations";

export default function Register() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const [registerMethod, setRegisterMethod] = useState<"phone" | "email">("phone");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const registerMutation = useMutation({
    mutationFn: async (data: { fullName: string; phoneNumber?: string; email?: string; password: string }) => {
      const result = await apiRequest("POST", "/api/auth/register", data);
      return await result.json();
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      const redirectPath = user.isAdmin === 1 ? "/admin" : "/";
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

    if (registerMethod === "phone") {
      if (!phoneNumber.trim()) {
        toast({
          title: "Phone number required",
          description: "Please enter your phone number",
          variant: "destructive",
        });
        return;
      }
      registerMutation.mutate({ fullName, phoneNumber: phoneNumber.trim(), password });
    } else {
      if (!email.trim()) {
        toast({
          title: "Email required",
          description: "Please enter your email",
          variant: "destructive",
        });
        return;
      }
      registerMutation.mutate({ fullName, email: email.trim().toLowerCase(), password });
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

            <Tabs value={registerMethod} onValueChange={(v) => setRegisterMethod(v as "phone" | "email")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {registerPageLabels.phoneTab[language]}
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {registerPageLabels.emailTab[language]}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="phone" className="space-y-1.5 sm:space-y-2 mt-4">
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
              </TabsContent>
              
              <TabsContent value="email" className="space-y-1.5 sm:space-y-2 mt-4">
                <label htmlFor="email" className="text-xs sm:text-sm font-medium">
                  {registerPageLabels.email[language]}
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder={registerPageLabels.emailPlaceholder[language]}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email-register"
                  className="text-sm"
                />
              </TabsContent>
            </Tabs>

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="password" className="text-xs sm:text-sm font-medium">
                {registerPageLabels.password[language]}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={registerPageLabels.passwordPlaceholder[language]}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-password-register"
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

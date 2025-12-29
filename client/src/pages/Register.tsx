import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { X, Eye, EyeOff, Phone, Mail, ArrowLeft } from "lucide-react";
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
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const { toast } = useToast();

  const registerMutation = useMutation({
    mutationFn: async (data: { fullName: string; phoneNumber?: string; email?: string; password: string; language?: string }) => {
      const result = await apiRequest("POST", "/api/auth/register", data);
      return await result.json();
    },
    onSuccess: (response) => {
      if (response.requiresOTP) {
        setPendingEmail(response.email);
        setOtpStep(true);
        toast({
          title: language === "km" ? "លេខកូដបានផ្ញើ" : "Code Sent",
          description: language === "km" 
            ? "សូមពិនិត្យអ៊ីមែលរបស់អ្នកសម្រាប់លេខកូដផ្ទៀងផ្ទាត់" 
            : "Please check your email for the verification code",
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        
        // Check for pending movie actions from before registration
        const pendingMovieId = sessionStorage.getItem('pendingMovieId');
        const pendingAddMovieId = sessionStorage.getItem('pendingAddMovieId');
        
        if (pendingMovieId) {
          sessionStorage.removeItem('pendingMovieId');
          sessionStorage.removeItem('pendingMovieAction');
          window.location.href = `/movie/${pendingMovieId}`;
          return;
        }
        
        if (pendingAddMovieId) {
          sessionStorage.removeItem('pendingAddMovieId');
          window.location.href = '/';
          return;
        }
        
        const redirectPath = response.isAdmin === 1 ? "/admin" : "/";
        window.location.href = redirectPath;
      }
    },
    onError: (error: Error) => {
      toast({
        title: language === "km" ? "ការចុះឈ្មោះបរាជ័យ" : "Registration failed",
        description: error.message || (language === "km" ? "សូមពិនិត្យព័ត៌មានរបស់អ្នកហើយព្យាយាមម្តងទៀត" : "Please check your information and try again"),
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: { email: string; otp: string }) => {
      const result = await apiRequest("POST", "/api/auth/verify-email-otp", data);
      return await result.json();
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: language === "km" ? "គណនីបានបង្កើត!" : "Account Created!",
        description: language === "km" ? "សូមស្វាគមន៍មកកាន់ Reoung Movies Flix" : "Welcome to Reoung Movies Flix",
      });
      
      // Check for pending movie actions from before registration
      const pendingMovieId = sessionStorage.getItem('pendingMovieId');
      const pendingAddMovieId = sessionStorage.getItem('pendingAddMovieId');
      
      if (pendingMovieId) {
        sessionStorage.removeItem('pendingMovieId');
        sessionStorage.removeItem('pendingMovieAction');
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
        title: language === "km" ? "ការផ្ទៀងផ្ទាត់បរាជ័យ" : "Verification failed",
        description: error.message || (language === "km" ? "លេខកូដមិនត្រឹមត្រូវ" : "Invalid verification code"),
        variant: "destructive",
      });
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: async (data: { email: string; language: string }) => {
      const result = await apiRequest("POST", "/api/auth/resend-email-otp", data);
      return await result.json();
    },
    onSuccess: () => {
      toast({
        title: language === "km" ? "លេខកូដបានផ្ញើម្តងទៀត" : "Code Resent",
        description: language === "km" 
          ? "សូមពិនិត្យអ៊ីមែលរបស់អ្នកសម្រាប់លេខកូដថ្មី" 
          : "Please check your email for the new code",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "km" ? "ការផ្ញើបរាជ័យ" : "Failed to resend",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast({
        title: language === "km" ? "ត្រូវការឈ្មោះពេញ" : "Full name required",
        description: language === "km" ? "សូមបញ្ចូលឈ្មោះពេញរបស់អ្នក" : "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: language === "km" ? "ត្រូវការលេខសំងាត់" : "Password required",
        description: language === "km" ? "សូមបញ្ចូលលេខសំងាត់" : "Please enter a password",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: language === "km" ? "លេខសំងាត់ខ្លីពេក" : "Password too short",
        description: language === "km" ? "លេខសំងាត់ត្រូវមានយ៉ាងហោចណាស់ 8 ខ្ទង់" : "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    if (registerMethod === "phone") {
      if (!phoneNumber.trim()) {
        toast({
          title: language === "km" ? "ត្រូវការលេខទូរស័ព្ទ" : "Phone number required",
          description: language === "km" ? "សូមបញ្ចូលលេខទូរស័ព្ទរបស់អ្នក" : "Please enter your phone number",
          variant: "destructive",
        });
        return;
      }
      registerMutation.mutate({ fullName, phoneNumber: phoneNumber.trim(), password });
    } else {
      if (!email.trim()) {
        toast({
          title: language === "km" ? "ត្រូវការអ៊ីមែល" : "Email required",
          description: language === "km" ? "សូមបញ្ចូលអ៊ីមែលរបស់អ្នក" : "Please enter your email",
          variant: "destructive",
        });
        return;
      }
      registerMutation.mutate({ fullName, email: email.trim().toLowerCase(), password, language });
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length !== 6) {
      toast({
        title: language === "km" ? "លេខកូដមិនត្រឹមត្រូវ" : "Invalid code",
        description: language === "km" ? "សូមបញ្ចូលលេខកូដ 6 ខ្ទង់" : "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }
    verifyOtpMutation.mutate({ email: pendingEmail, otp: otpCode });
  };

  const handleResendOtp = () => {
    resendOtpMutation.mutate({ email: pendingEmail, language });
  };

  const handleBackToRegister = () => {
    setOtpStep(false);
    setOtpCode("");
    setPendingEmail("");
  };

  if (otpStep) {
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
            <CardTitle className="text-xl sm:text-2xl font-bold text-center">
              {registerPageLabels.verifyEmailTitle[language]}
            </CardTitle>
            <CardDescription className="text-center text-sm">
              {registerPageLabels.verifyEmailDescription[language]}
              <br />
              <span className="font-medium text-primary">{pendingEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-5 sm:pb-6">
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="otpCode" className="text-xs sm:text-sm font-medium">
                  {registerPageLabels.enterVerificationCode[language]}
                </label>
                <Input
                  id="otpCode"
                  type="text"
                  placeholder={registerPageLabels.verificationCodePlaceholder[language]}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground text-center">
                  {registerPageLabels.codeExpires[language]}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={verifyOtpMutation.isPending || otpCode.length !== 6}
              >
                {verifyOtpMutation.isPending 
                  ? registerPageLabels.verifying[language]
                  : registerPageLabels.verifyButton[language]}
              </Button>

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleResendOtp}
                  disabled={resendOtpMutation.isPending}
                >
                  {resendOtpMutation.isPending 
                    ? registerPageLabels.resending[language]
                    : registerPageLabels.resendCode[language]}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full flex items-center gap-2"
                  onClick={handleBackToRegister}
                >
                  <ArrowLeft className="h-4 w-4" />
                  {registerPageLabels.backToRegister[language]}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              {registerMutation.isPending 
                ? (registerMethod === "email" 
                    ? registerPageLabels.sendingCode[language] 
                    : (language === "km" ? "កំពុងបង្កើតគណនី..." : "Creating account..."))
                : registerPageLabels.registerButton[language]}
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

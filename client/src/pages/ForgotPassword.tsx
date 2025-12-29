import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { X, Eye, EyeOff, Phone, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { forgotPasswordLabels } from "@/lib/translations";

type Step = "request" | "verify" | "reset" | "success";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const [step, setStep] = useState<Step>("request");
  const [resetMethod, setResetMethod] = useState<"phone" | "email">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userId, setUserId] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const { toast } = useToast();

  const labels = forgotPasswordLabels;

  const requestOtpMutation = useMutation({
    mutationFn: async (data: { phoneNumber?: string; email?: string; language: string }) => {
      const result = await apiRequest("POST", "/api/auth/forgot-password", data);
      return await result.json();
    },
    onSuccess: (response) => {
      setUserId(response.userId);
      setContactInfo(response.phoneNumber || response.email);
      setStep("verify");
      toast({
        title: language === "km" ? "លេខកូដបានផ្ញើ" : "Code Sent",
        description: response.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "km" ? "បរាជ័យ" : "Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { userId: string; otp: string; newPassword: string }) => {
      const result = await apiRequest("POST", "/api/auth/reset-password", data);
      return await result.json();
    },
    onSuccess: () => {
      setStep("success");
      toast({
        title: labels.success[language],
        description: labels.successDescription[language],
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "km" ? "បរាជ័យ" : "Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: async (data: { userId: string; language: string }) => {
      const result = await apiRequest("POST", "/api/auth/resend-reset-otp", data);
      return await result.json();
    },
    onSuccess: () => {
      toast({
        title: language === "km" ? "លេខកូដបានផ្ញើម្តងទៀត" : "Code Resent",
        description: language === "km" ? "លេខកូដថ្មីត្រូវបានផ្ញើ" : "A new code has been sent",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "km" ? "បរាជ័យ" : "Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (resetMethod === "phone") {
      if (!phoneNumber.trim()) {
        toast({
          title: language === "km" ? "ត្រូវការលេខទូរស័ព្ទ" : "Phone number required",
          description: language === "km" ? "សូមបញ្ចូលលេខទូរស័ព្ទរបស់អ្នក" : "Please enter your phone number",
          variant: "destructive",
        });
        return;
      }
      requestOtpMutation.mutate({ phoneNumber: phoneNumber.trim(), language });
    } else {
      if (!email.trim()) {
        toast({
          title: language === "km" ? "ត្រូវការអ៊ីមែល" : "Email required",
          description: language === "km" ? "សូមបញ្ចូលអ៊ីមែលរបស់អ្នក" : "Please enter your email",
          variant: "destructive",
        });
        return;
      }
      requestOtpMutation.mutate({ email: email.trim().toLowerCase(), language });
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpCode.trim()) {
      toast({
        title: language === "km" ? "ត្រូវការលេខកូដ" : "Code required",
        description: language === "km" ? "សូមបញ្ចូលលេខកូដផ្ទៀងផ្ទាត់" : "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: language === "km" ? "លេខសំងាត់ខ្លីពេក" : "Password too short",
        description: language === "km" ? "លេខសំងាត់ត្រូវតែមានយ៉ាងហោចណាស់ 6 ខ្ទង់" : "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: language === "km" ? "លេខសំងាត់មិនត្រូវគ្នា" : "Passwords don't match",
        description: language === "km" ? "សូមបញ្ជាក់លេខសំងាត់ឱ្យដូចគ្នា" : "Please make sure passwords match",
        variant: "destructive",
      });
      return;
    }
    
    resetPasswordMutation.mutate({ userId, otp: otpCode.trim(), newPassword });
  };

  const handleResendOtp = () => {
    resendOtpMutation.mutate({ userId, language });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-3 sm:px-4">
      <Card className="w-full max-w-md relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2"
          onClick={() => setLocation("/")}
        >
          <X className="h-4 w-4" />
        </Button>
        
        {step === "request" && (
          <>
            <CardHeader className="space-y-1 px-4 sm:px-6 pt-5 sm:pt-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-center">{labels.title[language]}</CardTitle>
              <CardDescription className="text-center text-sm">
                {labels.description[language]}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-5 sm:pb-6">
              <form onSubmit={handleRequestOtp} className="space-y-3 sm:space-y-4">
                <Tabs value={resetMethod} onValueChange={(v) => setResetMethod(v as "phone" | "email")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {labels.phoneTab[language]}
                    </TabsTrigger>
                    <TabsTrigger value="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {labels.emailTab[language]}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="phone" className="space-y-1.5 sm:space-y-2 mt-4">
                    <label htmlFor="phone" className="text-xs sm:text-sm font-medium">
                      {labels.phoneNumber[language]}
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={labels.phoneNumberPlaceholder[language]}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {labels.phoneNumberHelper[language]}
                    </p>
                  </TabsContent>
                  
                  <TabsContent value="email" className="space-y-1.5 sm:space-y-2 mt-4">
                    <label htmlFor="email" className="text-xs sm:text-sm font-medium">
                      {labels.email[language]}
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={labels.emailPlaceholder[language]}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="text-sm"
                    />
                  </TabsContent>
                </Tabs>

                <Button
                  type="submit"
                  className="w-full text-sm"
                  disabled={requestOtpMutation.isPending}
                >
                  {requestOtpMutation.isPending ? labels.sending[language] : labels.sendCode[language]}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">{labels.rememberPassword[language]} </span>
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setLocation("/login")}
                  >
                    {labels.backToLogin[language]}
                  </button>
                </div>
              </form>
            </CardContent>
          </>
        )}

        {step === "verify" && (
          <>
            <CardHeader className="space-y-1 px-4 sm:px-6 pt-5 sm:pt-6">
              <button
                type="button"
                onClick={() => setStep("request")}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {labels.backToLogin[language]}
              </button>
              <CardTitle className="text-xl sm:text-2xl font-bold text-center">{labels.newPasswordTitle[language]}</CardTitle>
              <CardDescription className="text-center text-sm">
                {labels.verifyDescription[language]} <strong>{contactInfo}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-5 sm:pb-6">
              <form onSubmit={handleResetPassword} className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="otp" className="text-xs sm:text-sm font-medium">
                    {labels.enterCode[language]}
                  </label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder={labels.codePlaceholder[language]}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="text-sm text-center tracking-widest"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    {labels.codeExpires[language]}
                  </p>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="newPassword" className="text-xs sm:text-sm font-medium">
                    {labels.newPassword[language]}
                  </label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder={labels.newPasswordPlaceholder[language]}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {labels.passwordHelper[language]}
                  </p>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="confirmPassword" className="text-xs sm:text-sm font-medium">
                    {labels.confirmPassword[language]}
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={labels.confirmPasswordPlaceholder[language]}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full text-sm"
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? labels.resetting[language] : labels.resetButton[language]}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={handleResendOtp}
                    disabled={resendOtpMutation.isPending}
                  >
                    {resendOtpMutation.isPending ? labels.resending[language] : labels.resendCode[language]}
                  </button>
                </div>
              </form>
            </CardContent>
          </>
        )}

        {step === "success" && (
          <>
            <CardHeader className="space-y-1 px-4 sm:px-6 pt-5 sm:pt-6">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-center">{labels.success[language]}</CardTitle>
              <CardDescription className="text-center text-sm">
                {labels.successDescription[language]}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-5 sm:pb-6">
              <Button
                className="w-full"
                onClick={() => setLocation("/login")}
              >
                {labels.backToLogin[language]}
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

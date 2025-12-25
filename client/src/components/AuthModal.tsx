import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type AuthStep = "credentials" | "otp";

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [authStep, setAuthStep] = useState<AuthStep>("credentials");

  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginOtp, setLoginOtp] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerOtp, setRegisterOtp] = useState("");

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [pendingPhoneNumber, setPendingPhoneNumber] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setAuthStep("credentials");
      setLoginOtp("");
      setRegisterOtp("");
      setPendingPhoneNumber("");
    }
  }, [isOpen]);

  const requestLoginOtpMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; password: string }) => {
      const result = await apiRequest("POST", "/api/auth/login/request-otp", data);
      return await result.json();
    },
    onSuccess: (data) => {
      setPendingPhoneNumber(data.phoneNumber);
      setAuthStep("otp");
      toast({
        title: "OTP Sent",
        description: "A verification code has been sent to your phone",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid phone number or password",
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; password: string; otpCode: string }) => {
      const result = await apiRequest("POST", "/api/auth/login", data);
      return await result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      resetForms();
      onClose();
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid OTP code",
        variant: "destructive",
      });
    },
  });

  const requestRegisterOtpMutation = useMutation({
    mutationFn: async (data: { fullName: string; phoneNumber: string; password: string }) => {
      const result = await apiRequest("POST", "/api/auth/register/request-otp", data);
      return await result.json();
    },
    onSuccess: (data) => {
      setPendingPhoneNumber(data.phoneNumber);
      setAuthStep("otp");
      toast({
        title: "OTP Sent",
        description: "A verification code has been sent to your phone",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please check your information and try again",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { fullName: string; phoneNumber: string; password: string; otpCode: string }) => {
      const result = await apiRequest("POST", "/api/auth/register", data);
      return await result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Registration successful",
        description: "Welcome to Reoung Movies Flix!",
      });
      resetForms();
      onClose();
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid OTP code",
        variant: "destructive",
      });
    },
  });

  const resetForms = () => {
    setLoginPhone("");
    setLoginPassword("");
    setLoginOtp("");
    setRegisterName("");
    setRegisterPhone("");
    setRegisterPassword("");
    setRegisterOtp("");
    setAuthStep("credentials");
    setPendingPhoneNumber("");
  };

  const handleRequestLoginOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone.trim() || !loginPassword.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both phone number and password",
        variant: "destructive",
      });
      return;
    }

    const formattedPhone = loginPhone.trim().startsWith("+855")
      ? loginPhone.trim()
      : `+855${loginPhone.trim().replace(/^0/, "")}`;

    requestLoginOtpMutation.mutate({ phoneNumber: formattedPhone, password: loginPassword });
  };

  const handleVerifyLoginOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginOtp.trim()) {
      toast({
        title: "Missing OTP",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    const formattedPhone = loginPhone.trim().startsWith("+855")
      ? loginPhone.trim()
      : `+855${loginPhone.trim().replace(/^0/, "")}`;

    loginMutation.mutate({ 
      phoneNumber: formattedPhone, 
      password: loginPassword, 
      otpCode: loginOtp.trim() 
    });
  };

  const handleRequestRegisterOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName.trim() || !registerPhone.trim() || !registerPassword.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (registerPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    const formattedPhone = registerPhone.trim().startsWith("+855")
      ? registerPhone.trim()
      : `+855${registerPhone.trim().replace(/^0/, "")}`;

    requestRegisterOtpMutation.mutate({
      fullName: registerName,
      phoneNumber: formattedPhone,
      password: registerPassword
    });
  };

  const handleVerifyRegisterOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerOtp.trim()) {
      toast({
        title: "Missing OTP",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    const formattedPhone = registerPhone.trim().startsWith("+855")
      ? registerPhone.trim()
      : `+855${registerPhone.trim().replace(/^0/, "")}`;

    registerMutation.mutate({
      fullName: registerName,
      phoneNumber: formattedPhone,
      password: registerPassword,
      otpCode: registerOtp.trim()
    });
  };

  const handleBackToCredentials = () => {
    setAuthStep("credentials");
    setLoginOtp("");
    setRegisterOtp("");
  };

  const isLoginPending = requestLoginOtpMutation.isPending || loginMutation.isPending;
  const isRegisterPending = requestRegisterOtpMutation.isPending || registerMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]" data-testid="dialog-auth">
        <DialogHeader>
          <DialogTitle>Sign in to watch</DialogTitle>
          <DialogDescription>
            {authStep === "otp" 
              ? `Enter the verification code sent to ${pendingPhoneNumber}`
              : "Login or register to start watching movies"
            }
          </DialogDescription>
        </DialogHeader>

        {authStep === "otp" ? (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToCredentials}
              className="flex items-center gap-2 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {activeTab === "login" ? (
              <form onSubmit={handleVerifyLoginOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-otp">Verification Code</Label>
                  <Input
                    id="login-otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={loginOtp}
                    onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    data-testid="input-login-otp"
                    disabled={loginMutation.isPending}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit code sent to your phone
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending || loginOtp.length !== 6}
                  data-testid="button-verify-login"
                >
                  {loginMutation.isPending ? "Verifying..." : "Verify & Login"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  disabled={requestLoginOtpMutation.isPending}
                  onClick={handleRequestLoginOtp}
                >
                  {requestLoginOtpMutation.isPending ? "Sending..." : "Resend Code"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyRegisterOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-otp">Verification Code</Label>
                  <Input
                    id="register-otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={registerOtp}
                    onChange={(e) => setRegisterOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    data-testid="input-register-otp"
                    disabled={registerMutation.isPending}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit code sent to your phone
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={registerMutation.isPending || registerOtp.length !== 6}
                  data-testid="button-verify-register"
                >
                  {registerMutation.isPending ? "Verifying..." : "Verify & Create Account"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  disabled={requestRegisterOtpMutation.isPending}
                  onClick={handleRequestRegisterOtp}
                >
                  {requestRegisterOtpMutation.isPending ? "Sending..." : "Resend Code"}
                </Button>
              </form>
            )}
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleRequestLoginOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-phone">Phone Number</Label>
                  <Input
                    id="login-phone"
                    type="text"
                    placeholder="012345678"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    data-testid="input-login-phone"
                    disabled={isLoginPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter without +855 prefix (e.g., 012345678)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      data-testid="input-login-password"
                      disabled={isLoginPending}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoginPending}
                  data-testid="button-login-submit"
                >
                  {requestLoginOtpMutation.isPending ? "Sending OTP..." : "Continue"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRequestRegisterOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full Name</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Your full name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    data-testid="input-register-name"
                    disabled={isRegisterPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-phone">Phone Number</Label>
                  <Input
                    id="register-phone"
                    type="text"
                    placeholder="012345678"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    data-testid="input-register-phone"
                    disabled={isRegisterPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter without +855 prefix (e.g., 012345678)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showRegisterPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      data-testid="input-register-password"
                      disabled={isRegisterPending}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isRegisterPending}
                  data-testid="button-register-submit"
                >
                  {requestRegisterOtpMutation.isPending ? "Sending OTP..." : "Continue"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

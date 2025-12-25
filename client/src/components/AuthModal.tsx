import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft, Send } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type AuthStep = 'phone' | 'otp' | 'password';

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [step, setStep] = useState<AuthStep>('phone');

  // Common state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [testOtpCode, setTestOtpCode] = useState<string | null>(null);
  const [otpExpiry, setOtpExpiry] = useState<number>(0);
  const [countdown, setCountdown] = useState(0);

  // Login state
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register state
  const [registerName, setRegisterName] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('phone');
      setPhoneNumber("");
      setOtpCode("");
      setTestOtpCode(null);
      setLoginPassword("");
      setRegisterName("");
      setRegisterPassword("");
      setCountdown(0);
    }
  }, [isOpen]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Request OTP mutation
  const requestOtpMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; purpose: string }) => {
      const result = await apiRequest("POST", "/api/auth/request-otp", data);
      return await result.json();
    },
    onSuccess: (data) => {
      setTestOtpCode(data.testCode);
      setOtpExpiry(data.expiresIn);
      setCountdown(60);
      setStep('otp');
      toast({
        title: "OTP Sent",
        description: "Please enter the verification code",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send OTP",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verify OTP mutation
  const verifyOtpMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; code: string; purpose: string }) => {
      const result = await apiRequest("POST", "/api/auth/verify-otp", data);
      return await result.json();
    },
    onSuccess: () => {
      setStep('password');
      toast({
        title: "OTP Verified",
        description: activeTab === 'login' ? "Enter your password" : "Set your password",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Invalid OTP",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; password: string }) => {
      const result = await apiRequest("POST", "/api/auth/login", data);
      return await result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      onClose();
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid password",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: { fullName: string; phoneNumber: string; password: string }) => {
      const result = await apiRequest("POST", "/api/auth/register", data);
      return await result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Registration successful",
        description: "Welcome to Reoung Movies Flix!",
      });
      onClose();
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatPhoneNumber = (phone: string): string => {
    return phone.trim().startsWith("+855")
      ? phone.trim()
      : `+855${phone.trim().replace(/^0/, "")}`;
  };

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    if (activeTab === 'register' && !registerName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    requestOtpMutation.mutate({ phoneNumber: formattedPhone, purpose: activeTab });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    verifyOtpMutation.mutate({ phoneNumber: formattedPhone, code: otpCode, purpose: activeTab });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPassword.trim()) {
      toast({
        title: "Password required",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    loginMutation.mutate({ phoneNumber: formattedPhone, password: loginPassword });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerPassword.trim()) {
      toast({
        title: "Password required",
        description: "Please set a password",
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

    const formattedPhone = formatPhoneNumber(phoneNumber);
    registerMutation.mutate({
      fullName: registerName,
      phoneNumber: formattedPhone,
      password: registerPassword
    });
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('phone');
      setOtpCode("");
      setTestOtpCode(null);
    } else if (step === 'password') {
      setStep('otp');
    }
  };

  const handleResendOtp = () => {
    if (countdown > 0) return;
    const formattedPhone = formatPhoneNumber(phoneNumber);
    requestOtpMutation.mutate({ phoneNumber: formattedPhone, purpose: activeTab });
  };

  const isPending = requestOtpMutation.isPending || verifyOtpMutation.isPending || 
                    loginMutation.isPending || registerMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]" data-testid="dialog-auth">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step !== 'phone' && (
              <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <DialogTitle>
                {step === 'phone' && "Sign in to watch"}
                {step === 'otp' && "Verify your phone"}
                {step === 'password' && (activeTab === 'login' ? "Enter password" : "Set password")}
              </DialogTitle>
              <DialogDescription>
                {step === 'phone' && "Login or register with your phone number"}
                {step === 'otp' && `Enter the 6-digit code sent to ${formatPhoneNumber(phoneNumber)}`}
                {step === 'password' && (activeTab === 'login' ? "Enter your password to login" : "Create a password for your account")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === 'phone' && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-phone">Phone Number</Label>
                  <Input
                    id="login-phone"
                    type="text"
                    placeholder="012345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    data-testid="input-login-phone"
                    disabled={isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter without +855 prefix (e.g., 012345678)
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isPending}
                  data-testid="button-send-otp"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {requestOtpMutation.isPending ? "Sending..." : "Send OTP Code"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full Name</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Your full name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    data-testid="input-register-name"
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-phone">Phone Number</Label>
                  <Input
                    id="register-phone"
                    type="text"
                    placeholder="012345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    data-testid="input-register-phone"
                    disabled={isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter without +855 prefix (e.g., 012345678)
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isPending}
                  data-testid="button-send-otp-register"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {requestOtpMutation.isPending ? "Sending..." : "Send OTP Code"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {testOtpCode && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-center">
                <p className="text-xs text-orange-400 mb-1">Test Mode - Your OTP Code:</p>
                <p className="text-2xl font-bold text-orange-500 tracking-widest">{testOtpCode}</p>
                <p className="text-xs text-muted-foreground mt-1">This will be sent via SMS in production</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="otp-code">Enter 6-digit code</Label>
              <Input
                id="otp-code"
                type="text"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-2xl tracking-[0.5em] font-mono"
                maxLength={6}
                disabled={isPending}
                data-testid="input-otp-code"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isPending || otpCode.length !== 6}
              data-testid="button-verify-otp"
            >
              {verifyOtpMutation.isPending ? "Verifying..." : "Verify Code"}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={handleResendOtp}
                disabled={countdown > 0 || isPending}
                className="text-sm text-orange-500 hover:text-orange-400"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
              </Button>
            </div>
          </form>
        )}

        {step === 'password' && activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
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
                  disabled={isPending}
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
              disabled={isPending}
              data-testid="button-login-submit"
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
        )}

        {step === 'password' && activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="register-password">Create Password</Label>
              <div className="relative">
                <Input
                  id="register-password"
                  type={showRegisterPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  data-testid="input-register-password"
                  disabled={isPending}
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
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
              data-testid="button-register-submit"
            >
              {registerMutation.isPending ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

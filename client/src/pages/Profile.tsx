import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Wallet, Gift, ShoppingCart, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";

interface CreditTransaction {
  id: string;
  type: string;
  amount: string;
  balanceAfter: string;
  description: string | null;
  createdAt: number;
}

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();

  // Fetch current user
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Not authenticated");
      return await res.json();
    },
  });

  // Fetch credit transaction history
  const { data: creditHistory } = useQuery<CreditTransaction[]>({
    queryKey: ["/api/credits/history"],
    queryFn: async () => {
      const res = await fetch("/api/credits/history?limit=10", {
        credentials: "include"
      });
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!user,
  });

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Initialize form when user data loads
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      // Remove +855 prefix for display
      const displayPhone = user.phoneNumber?.replace(/^\+855/, "0") || "";
      setPhoneNumber(displayPhone);
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { fullName?: string; phoneNumber?: string; currentPassword?: string; newPassword?: string }) => {
      await apiRequest("PUT", "/api/auth/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
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

    // Convert phone number: 012345678 → +85512345678
    const formattedPhone = phoneNumber.trim().startsWith("+855") 
      ? phoneNumber.trim() 
      : `+855${phoneNumber.trim().replace(/^0/, "")}`;

    const updateData: any = {
      fullName: fullName.trim(),
      phoneNumber: formattedPhone,
    };

    updateProfileMutation.mutate(updateData);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword.trim()) {
      toast({
        title: "Current password required",
        description: "Please enter your current password",
        variant: "destructive",
      });
      return;
    }

    if (!newPassword.trim()) {
      toast({
        title: "New password required",
        description: "Please enter a new password",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation don't match",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate({
      currentPassword: currentPassword.trim(),
      newPassword: newPassword.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background pt-20 px-3 sm:px-4 pb-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <h1 className="text-3xl font-bold mb-6">{language === 'km' ? 'ការកំណត់ប្រវត្តិរូប' : 'Profile Settings'}</h1>

        {/* Credit Balance Card */}
        <Card className="mb-6 border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-transparent">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-orange-500" />
                <CardTitle>{language === 'km' ? 'សមតុល្យឥណទាន' : 'Credit Balance'}</CardTitle>
              </div>
              <div className="text-3xl font-bold text-orange-500">
                ${parseFloat(user?.balance || "0").toFixed(2)}
              </div>
            </div>
            <CardDescription>
              {language === 'km' 
                ? 'ប្រើឥណទានរបស់អ្នកដើម្បីទិញភាពយន្ត ($1 ក្នុងមួយភាពយន្ត)'
                : 'Use your credits to buy movies ($1 per movie)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {creditHistory && creditHistory.length > 0 && (
              <>
                <Separator className="mb-4" />
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {language === 'km' ? 'ប្រវត្តិប្រតិបត្តិការថ្មីៗ' : 'Recent Transactions'}
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {creditHistory.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                      <div className="flex items-center gap-2">
                        {tx.type === 'welcome_bonus' && <Gift className="h-4 w-4 text-green-500" />}
                        {tx.type === 'admin_gift' && <Gift className="h-4 w-4 text-blue-500" />}
                        {tx.type === 'purchase' && <ShoppingCart className="h-4 w-4 text-red-500" />}
                        <span className="text-muted-foreground truncate max-w-[180px]">
                          {tx.description || tx.type}
                        </span>
                      </div>
                      <span className={parseFloat(tx.amount) >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {parseFloat(tx.amount) >= 0 ? '+' : ''}${tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {(!creditHistory || creditHistory.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {language === 'km' 
                  ? 'អ្នកទទួលបាន $5 ជាប្រាក់រង្វាន់ស្វាគមន៍នៅពេលចុះឈ្មោះ!'
                  : 'You received $5 as a welcome bonus when you registered!'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  data-testid="input-fullname"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="text-sm font-medium">
                  Phone Number (Cambodia Only)
                </label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="012345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  data-testid="input-phone"
                />
                <p className="text-xs text-muted-foreground">
                  Enter without +855 prefix (e.g., 012345678)
                </p>
              </div>

              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                data-testid="button-update-profile"
              >
                {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="currentPassword" className="text-sm font-medium">
                  Current Password
                </label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  data-testid="input-current-password"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">
                  New Password
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  data-testid="input-new-password"
                />
                <p className="text-xs text-muted-foreground">
                  At least 6 characters
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm New Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  data-testid="input-confirm-password"
                />
              </div>

              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                data-testid="button-change-password"
              >
                {updateProfileMutation.isPending ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

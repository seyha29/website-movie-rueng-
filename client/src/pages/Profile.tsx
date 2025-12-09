import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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

        <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>

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

import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Wallet, Gift, ShoppingCart, Clock, User, Settings, CreditCard, Camera, Mail, Phone, List, LayoutDashboard, LogOut, ChevronRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const res = await fetch("/api/credits/history?limit=20", {
        credentials: "include"
      });
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!user,
  });

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Initialize form when user data loads
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      const displayPhone = user.phoneNumber?.replace(/^\+855/, "0") || "";
      setPhoneNumber(displayPhone);
      setEmail(user.email || "");
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { fullName?: string; phoneNumber?: string; currentPassword?: string; newPassword?: string }) => {
      await apiRequest("PUT", "/api/auth/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: language === 'km' ? "ប្រវត្តិរូបបានធ្វើបច្ចុប្បន្នភាព" : "Profile updated",
        description: language === 'km' ? "ប្រវត្តិរូបរបស់អ្នកត្រូវបានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ" : "Your profile has been updated successfully",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: language === 'km' ? "ការធ្វើបច្ចុប្បន្នភាពបរាជ័យ" : "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch('/api/auth/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to upload avatar');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: language === 'km' ? "រូបភាពបានផ្ទុកឡើង" : "Photo uploaded",
        description: language === 'km' ? "រូបភាពប្រវត្តិរូបរបស់អ្នកត្រូវបានធ្វើបច្ចុប្បន្នភាព" : "Your profile photo has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === 'km' ? "ការផ្ទុកឡើងបរាជ័យ" : "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const result = await apiRequest("POST", "/api/auth/logout", {});
      return await result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: language === 'km' ? "បានចេញពីប្រព័ន្ធ" : "Logged out",
        description: language === 'km' ? "អ្នកបានចេញពីប្រព័ន្ធដោយជោគជ័យ" : "You have been logged out successfully",
      });
      setLocation("/");
    },
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: language === 'km' ? "ឯកសារធំពេក" : "File too large",
          description: language === 'km' ? "រូបភាពត្រូវតែតូចជាង 5MB" : "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      uploadAvatarMutation.mutate(file);
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast({
        title: language === 'km' ? "ត្រូវការឈ្មោះពេញ" : "Full name required",
        description: language === 'km' ? "សូមបញ្ចូលឈ្មោះពេញរបស់អ្នក" : "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    const formattedPhone = phoneNumber.trim() 
      ? (phoneNumber.trim().startsWith("+855") 
          ? phoneNumber.trim() 
          : `+855${phoneNumber.trim().replace(/^0/, "")}`)
      : undefined;

    const updateData: any = {
      fullName: fullName.trim(),
    };
    
    if (formattedPhone) {
      updateData.phoneNumber = formattedPhone;
    }

    updateProfileMutation.mutate(updateData);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword.trim()) {
      toast({
        title: language === 'km' ? "ត្រូវការពាក្យសម្ងាត់បច្ចុប្បន្ន" : "Current password required",
        description: language === 'km' ? "សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្នរបស់អ្នក" : "Please enter your current password",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: language === 'km' ? "ពាក្យសម្ងាត់ខ្លីពេក" : "Password too short",
        description: language === 'km' ? "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ" : "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: language === 'km' ? "ពាក្យសម្ងាត់មិនត្រូវគ្នា" : "Passwords don't match",
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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center pt-32">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString(language === 'km' ? 'km-KH' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-20 pb-16 px-4 max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === 'km' ? 'ត្រឡប់ទៅទំព័រដើម' : 'Back to Home'}
        </Button>

        {/* Profile Header */}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-4 border-orange-500/30">
              <AvatarImage src={user.avatarUrl} alt={user.fullName} />
              <AvatarFallback className="bg-orange-500/20 text-orange-500 text-2xl">
                {getInitials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <button 
              onClick={handleAvatarClick}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="h-6 w-6 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{user.fullName}</h1>
            <div className="flex items-center gap-4 text-muted-foreground text-sm mt-1">
              {user.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </span>
              )}
              {user.phoneNumber && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {user.phoneNumber}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Wallet className="h-4 w-4 text-orange-500" />
              <span className="text-orange-500 font-bold text-lg">
                ${parseFloat(user.balance || "0").toFixed(2)}
              </span>
              <span className="text-muted-foreground text-sm">
                {language === 'km' ? 'សមតុល្យឥណទាន' : 'Credit Balance'}
              </span>
            </div>
          </div>
        </div>

        {/* All Menu Items in One Card */}
        <Card className="mb-8">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {/* My List */}
              <Link href="/my-list">
                <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-500/10">
                      <List className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">{language === 'km' ? 'បញ្ជីរបស់ខ្ញុំ' : 'My List'}</p>
                      <p className="text-sm text-muted-foreground">{language === 'km' ? 'ភាពយន្តដែលអ្នកបានរក្សាទុក' : 'Movies you have saved'}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>

              {/* Purchased Movies - Hidden on desktop, visible on mobile */}
              <Link href="/purchased" className="lg:hidden">
                <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-500/10">
                      <ShoppingCart className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">{language === 'km' ? 'ភាពយន្តបានទិញ' : 'Purchased Movies'}</p>
                      <p className="text-sm text-muted-foreground">{language === 'km' ? 'ភាពយន្តដែលអ្នកបានទិញ' : 'Movies you have purchased'}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>

              {/* Admin Panel - Only for admins */}
              {!!user.isAdmin && (
                <Link href="/admin">
                  <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-purple-500/10">
                        <LayoutDashboard className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="font-medium">{language === 'km' ? 'ផ្ទាំងគ្រប់គ្រង' : 'Admin Panel'}</p>
                        <p className="text-sm text-muted-foreground">{language === 'km' ? 'គ្រប់គ្រងគេហទំព័រ' : 'Manage the website'}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
              )}

              {/* Logout */}
              <div 
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => logoutMutation.mutate()}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-red-500/10">
                    <LogOut className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium text-red-500">{language === 'km' ? 'ចាកចេញ' : 'Logout'}</p>
                    <p className="text-sm text-muted-foreground">{language === 'km' ? 'ចេញពីគណនីរបស់អ្នក' : 'Sign out of your account'}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'km' ? 'ប្រវត្តិរូប' : 'Profile'}</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'km' ? 'ការកំណត់' : 'Settings'}</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'km' ? 'ប្រវត្តិបង់ប្រាក់' : 'Payments'}</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'km' ? 'ព័ត៌មានប្រវត្តិរូប' : 'Profile Information'}</CardTitle>
                <CardDescription>
                  {language === 'km' ? 'មើល និងកែប្រែព័ត៌មានគណនីរបស់អ្នក' : 'View and edit your account details'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-sm font-medium">
                      {language === 'km' ? 'ឈ្មោះពេញ' : 'Full Name'}
                    </label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder={language === 'km' ? 'បញ្ចូលឈ្មោះពេញ' : 'Enter your full name'}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  {user.phoneNumber && (
                    <div className="space-y-2">
                      <label htmlFor="phoneNumber" className="text-sm font-medium">
                        {language === 'km' ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
                      </label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="012345678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        {language === 'km' ? 'បញ្ចូលដោយគ្មាន +855' : 'Enter without +855 prefix'}
                      </p>
                    </div>
                  )}

                  {user.email && (
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        {language === 'km' ? 'អ៊ីមែល' : 'Email'}
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        {language === 'km' ? 'អ៊ីមែលមិនអាចផ្លាស់ប្តូរបានទេ' : 'Email cannot be changed'}
                      </p>
                    </div>
                  )}

                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending 
                      ? (language === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...') 
                      : (language === 'km' ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'Save Changes')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'km' ? 'ផ្លាស់ប្តូរពាក្យសម្ងាត់' : 'Change Password'}</CardTitle>
                <CardDescription>
                  {language === 'km' ? 'ធ្វើបច្ចុប្បន្នភាពពាក្យសម្ងាត់គណនីរបស់អ្នក' : 'Update your account password'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="currentPassword" className="text-sm font-medium">
                      {language === 'km' ? 'ពាក្យសម្ងាត់បច្ចុប្បន្ន' : 'Current Password'}
                    </label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder={language === 'km' ? 'បញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន' : 'Enter current password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="text-sm font-medium">
                      {language === 'km' ? 'ពាក្យសម្ងាត់ថ្មី' : 'New Password'}
                    </label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder={language === 'km' ? 'បញ្ចូលពាក្យសម្ងាត់ថ្មី' : 'Enter new password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {language === 'km' ? 'យ៉ាងហោចណាស់ ៦ តួអក្សរ' : 'At least 6 characters'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium">
                      {language === 'km' ? 'បញ្ជាក់ពាក្យសម្ងាត់ថ្មី' : 'Confirm New Password'}
                    </label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder={language === 'km' ? 'បញ្ជាក់ពាក្យសម្ងាត់ថ្មី' : 'Confirm new password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending 
                      ? (language === 'km' ? 'កំពុងផ្លាស់ប្តូរ...' : 'Changing...') 
                      : (language === 'km' ? 'ផ្លាស់ប្តូរពាក្យសម្ងាត់' : 'Change Password')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{language === 'km' ? 'ប្រវត្តិប្រតិបត្តិការ' : 'Transaction History'}</CardTitle>
                    <CardDescription>
                      {language === 'km' ? 'មើលប្រវត្តិឥណទាន និងការទិញរបស់អ្នក' : 'View your credit and purchase history'}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-500">
                      ${parseFloat(user.balance || "0").toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {language === 'km' ? 'សមតុល្យបច្ចុប្បន្ន' : 'Current Balance'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {creditHistory && creditHistory.length > 0 ? (
                  <div className="space-y-3">
                    {creditHistory.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            tx.type === 'welcome_bonus' ? 'bg-green-500/20' :
                            tx.type === 'admin_gift' ? 'bg-blue-500/20' :
                            'bg-red-500/20'
                          }`}>
                            {tx.type === 'welcome_bonus' && <Gift className="h-4 w-4 text-green-500" />}
                            {tx.type === 'admin_gift' && <Gift className="h-4 w-4 text-blue-500" />}
                            {tx.type === 'purchase' && <ShoppingCart className="h-4 w-4 text-red-500" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {tx.description || (
                                tx.type === 'welcome_bonus' ? (language === 'km' ? 'ប្រាក់រង្វាន់ស្វាគមន៍' : 'Welcome Bonus') :
                                tx.type === 'admin_gift' ? (language === 'km' ? 'អំណោយពីអ្នកគ្រប់គ្រង' : 'Admin Gift') :
                                (language === 'km' ? 'ការទិញភាពយន្ត' : 'Movie Purchase')
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(tx.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold ${parseFloat(tx.amount) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {parseFloat(tx.amount) >= 0 ? '+' : ''}${tx.amount}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {language === 'km' ? 'សមតុល្យ' : 'Balance'}: ${tx.balanceAfter}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{language === 'km' ? 'មិនមានប្រតិបត្តិការនៅឡើយ' : 'No transactions yet'}</p>
                    <p className="text-sm mt-1">
                      {language === 'km' 
                        ? 'អ្នកទទួលបាន $5 ជាប្រាក់រង្វាន់ស្វាគមន៍!'
                        : 'You received $5 as a welcome bonus!'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { X, Wallet, Gift, ShoppingCart, Clock, User, Settings, CreditCard, Camera, Mail, Phone, LogOut, ChevronRight } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState<'main' | 'edit' | 'password' | 'history'>('main');

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
      setActiveSection('main');
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

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const result = await apiRequest("POST", "/api/auth/logout", {});
      return await result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: language === 'km' ? "បានចេញ" : "Logged out",
        description: language === 'km' ? "អ្នកបានចេញដោយជោគជ័យ" : "You have been logged out successfully",
      });
      setLocation("/");
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
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
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
    <div className="fixed inset-0 bg-gradient-to-b from-zinc-900 via-black to-black z-50 overflow-y-auto">
      <div className="min-h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h1 className="text-lg font-semibold text-white">
            {activeSection === 'main' && (language === 'km' ? 'ប្រវត្តិរូប' : 'Profile')}
            {activeSection === 'edit' && (language === 'km' ? 'កែសម្រួលប្រវត្តិរូប' : 'Edit Profile')}
            {activeSection === 'password' && (language === 'km' ? 'ផ្លាស់ប្តូរពាក្យសម្ងាត់' : 'Change Password')}
            {activeSection === 'history' && (language === 'km' ? 'ប្រវត្តិប្រតិបត្តិការ' : 'Transaction History')}
          </h1>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => activeSection === 'main' ? setLocation('/') : setActiveSection('main')}
            className="text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {activeSection === 'main' && (
          <div className="flex-1 p-4">
            <div className="flex flex-col items-center pt-8 pb-6">
              <div className="relative group mb-4">
                <Avatar className="h-28 w-28 border-4 border-orange-500">
                  <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                  <AvatarFallback className="bg-orange-500 text-white text-3xl font-bold">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <button 
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 p-2 bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transition-colors"
                >
                  <Camera className="h-4 w-4 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-1">{user.fullName}</h2>
              <div className="flex items-center gap-3 text-gray-400 text-sm">
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
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-5 mb-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm mb-1">
                    {language === 'km' ? 'សមតុល្យឥណទាន' : 'Credit Balance'}
                  </p>
                  <p className="text-white text-4xl font-bold">
                    ${parseFloat(user.balance || "0").toFixed(2)}
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <Wallet className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setActiveSection('edit')}
                className="w-full flex items-center justify-between p-4 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <User className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="text-white font-medium">
                    {language === 'km' ? 'កែសម្រួលប្រវត្តិរូប' : 'Edit Profile'}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-500" />
              </button>

              <button
                onClick={() => setActiveSection('password')}
                className="w-full flex items-center justify-between p-4 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Settings className="h-5 w-5 text-purple-500" />
                  </div>
                  <span className="text-white font-medium">
                    {language === 'km' ? 'ផ្លាស់ប្តូរពាក្យសម្ងាត់' : 'Change Password'}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-500" />
              </button>

              <button
                onClick={() => setActiveSection('history')}
                className="w-full flex items-center justify-between p-4 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CreditCard className="h-5 w-5 text-green-500" />
                  </div>
                  <span className="text-white font-medium">
                    {language === 'km' ? 'ប្រវត្តិប្រតិបត្តិការ' : 'Transaction History'}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-500" />
              </button>

              <button
                onClick={() => logoutMutation.mutate()}
                className="w-full flex items-center justify-between p-4 bg-zinc-900 hover:bg-red-900/30 rounded-xl transition-colors mt-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <LogOut className="h-5 w-5 text-red-500" />
                  </div>
                  <span className="text-red-500 font-medium">
                    {language === 'km' ? 'ចេញ' : 'Log Out'}
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

        {activeSection === 'edit' && (
          <div className="flex-1 p-4">
            <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  {language === 'km' ? 'ឈ្មោះពេញ' : 'Full Name'}
                </label>
                <Input
                  type="text"
                  placeholder={language === 'km' ? 'បញ្ចូលឈ្មោះពេញ' : 'Enter your full name'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white h-12"
                />
              </div>

              {user.phoneNumber && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    {language === 'km' ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
                  </label>
                  <Input
                    type="tel"
                    placeholder="012345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white h-12"
                  />
                  <p className="text-xs text-gray-500">
                    {language === 'km' ? 'បញ្ចូលដោយគ្មាន +855' : 'Enter without +855 prefix'}
                  </p>
                </div>
              )}

              {user.email && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    {language === 'km' ? 'អ៊ីមែល' : 'Email'}
                  </label>
                  <Input
                    type="email"
                    value={email}
                    disabled
                    className="bg-zinc-800 border-zinc-700 text-gray-500 h-12"
                  />
                  <p className="text-xs text-gray-500">
                    {language === 'km' ? 'អ៊ីមែលមិនអាចផ្លាស់ប្តូរបានទេ' : 'Email cannot be changed'}
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={updateProfileMutation.isPending}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold mt-6"
              >
                {updateProfileMutation.isPending 
                  ? (language === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...') 
                  : (language === 'km' ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'Save Changes')}
              </Button>
            </form>
          </div>
        )}

        {activeSection === 'password' && (
          <div className="flex-1 p-4">
            <form onSubmit={handleChangePassword} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  {language === 'km' ? 'ពាក្យសម្ងាត់បច្ចុប្បន្ន' : 'Current Password'}
                </label>
                <Input
                  type="password"
                  placeholder={language === 'km' ? 'បញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន' : 'Enter current password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white h-12"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  {language === 'km' ? 'ពាក្យសម្ងាត់ថ្មី' : 'New Password'}
                </label>
                <Input
                  type="password"
                  placeholder={language === 'km' ? 'បញ្ចូលពាក្យសម្ងាត់ថ្មី' : 'Enter new password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white h-12"
                />
                <p className="text-xs text-gray-500">
                  {language === 'km' ? 'យ៉ាងហោចណាស់ ៦ តួអក្សរ' : 'At least 6 characters'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  {language === 'km' ? 'បញ្ជាក់ពាក្យសម្ងាត់ថ្មី' : 'Confirm New Password'}
                </label>
                <Input
                  type="password"
                  placeholder={language === 'km' ? 'បញ្ជាក់ពាក្យសម្ងាត់ថ្មី' : 'Confirm new password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white h-12"
                />
              </div>

              <Button 
                type="submit" 
                disabled={updateProfileMutation.isPending}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold mt-6"
              >
                {updateProfileMutation.isPending 
                  ? (language === 'km' ? 'កំពុងផ្លាស់ប្តូរ...' : 'Changing...') 
                  : (language === 'km' ? 'ផ្លាស់ប្តូរពាក្យសម្ងាត់' : 'Change Password')}
              </Button>
            </form>
          </div>
        )}

        {activeSection === 'history' && (
          <div className="flex-1 p-4">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 mb-4">
              <p className="text-orange-100 text-sm">
                {language === 'km' ? 'សមតុល្យបច្ចុប្បន្ន' : 'Current Balance'}
              </p>
              <p className="text-white text-3xl font-bold">
                ${parseFloat(user.balance || "0").toFixed(2)}
              </p>
            </div>

            {creditHistory && creditHistory.length > 0 ? (
              <div className="space-y-2">
                {creditHistory.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        tx.type === 'welcome_bonus' ? 'bg-green-500/20' :
                        tx.type === 'admin_gift' ? 'bg-blue-500/20' :
                        'bg-red-500/20'
                      }`}>
                        {tx.type === 'welcome_bonus' && <Gift className="h-5 w-5 text-green-500" />}
                        {tx.type === 'admin_gift' && <Gift className="h-5 w-5 text-blue-500" />}
                        {tx.type === 'purchase' && <ShoppingCart className="h-5 w-5 text-red-500" />}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">
                          {tx.description || (
                            tx.type === 'welcome_bonus' ? (language === 'km' ? 'ប្រាក់រង្វាន់ស្វាគមន៍' : 'Welcome Bonus') :
                            tx.type === 'admin_gift' ? (language === 'km' ? 'អំណោយពីអ្នកគ្រប់គ្រង' : 'Admin Gift') :
                            (language === 'km' ? 'ការទិញភាពយន្ត' : 'Movie Purchase')
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(tx.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${parseFloat(tx.amount) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {parseFloat(tx.amount) >= 0 ? '+' : ''}${tx.amount}
                      </span>
                      <p className="text-xs text-gray-500">
                        ${tx.balanceAfter}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <Clock className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="font-medium">{language === 'km' ? 'មិនមានប្រតិបត្តិការនៅឡើយ' : 'No transactions yet'}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

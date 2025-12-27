import { useQuery } from "@tanstack/react-query";
import { useLocation, Route, Switch } from "wouter";
import { Admin } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Film, Users as UsersIcon, LogOut, BarChart3, Image, Key, Shield } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import VideoManagement from "@/pages/VideoManagement";
import UserManagement from "@/pages/UserManagement";
import Analytics from "@/pages/Analytics";
import AdBannerManagement from "@/pages/AdBannerManagement";
import AdminManagement from "@/components/AdminManagement";
import logoImage from "@assets/logo Reung_1764364561043.png";

export default function AdminPanel() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: admin, isLoading, error } = useQuery<Admin | null>({
    queryKey: ["/api/admin/auth/me"],
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  if (error) {
    console.error("Admin auth check error:", error);
  }

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/auth/me"] });
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      setLocation("/admin/login");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!admin) {
    setLocation("/admin/login");
    return null;
  }

  const isFullAdmin = admin.role === "full";
  const currentPath = location.split("/")[2] || "videos";

  // Redirect video-only admins to videos page if they try to access restricted sections
  if (!isFullAdmin && (currentPath === "analytics" || currentPath === "users" || currentPath === "banners" || currentPath === "admins")) {
    setLocation("/admin/videos");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-8 w-full sm:w-auto">
              <img 
                src={logoImage} 
                alt="Rueng Movies Admin" 
                className="h-20 sm:h-24 lg:h-28 w-auto" 
                data-testid="img-admin-logo"
              />
              <nav className="flex gap-2 sm:gap-4 flex-wrap">
                {/* Videos FIRST - all admins can access */}
                <Button
                  variant={currentPath === "videos" ? "default" : "ghost"}
                  onClick={() => setLocation("/admin/videos")}
                  data-testid="button-nav-videos"
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  <Film className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Videos
                </Button>
                {isFullAdmin && (
                  <Button
                    variant={currentPath === "analytics" ? "default" : "ghost"}
                    onClick={() => setLocation("/admin/analytics")}
                    data-testid="button-nav-analytics"
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Analytics
                  </Button>
                )}
                {isFullAdmin && (
                  <Button
                    variant={currentPath === "users" ? "default" : "ghost"}
                    onClick={() => setLocation("/admin/users")}
                    data-testid="button-nav-users"
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    <UsersIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Users
                  </Button>
                )}
                {isFullAdmin && (
                  <Button
                    variant={currentPath === "banners" ? "default" : "ghost"}
                    onClick={() => setLocation("/admin/banners")}
                    data-testid="button-nav-banners"
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    <Image className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Banners
                  </Button>
                )}
                {isFullAdmin && (
                  <Button
                    variant={currentPath === "admins" ? "default" : "ghost"}
                    onClick={() => setLocation("/admin/admins")}
                    data-testid="button-nav-admins"
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Admins
                  </Button>
                )}
              </nav>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[120px] sm:max-w-none">{admin.fullName}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
                className="text-xs sm:text-sm"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Switch>
          {isFullAdmin && <Route path="/admin/analytics" component={Analytics} />}
          <Route path="/admin/videos" component={VideoManagement} />
          {isFullAdmin && <Route path="/admin/users" component={UserManagement} />}
          {isFullAdmin && <Route path="/admin/banners" component={AdBannerManagement} />}
          {isFullAdmin && <Route path="/admin/admins" component={AdminManagement} />}
          <Route path="/admin" component={isFullAdmin ? Analytics : VideoManagement} />
        </Switch>
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useLocation, Route, Switch } from "wouter";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Film, Users as UsersIcon, LogOut, BarChart3, Image, Key } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import VideoManagement from "@/pages/VideoManagement";
import UserManagement from "@/pages/UserManagement";
import Analytics from "@/pages/Analytics";
import AdBannerManagement from "@/pages/AdBannerManagement";
import ChangePasswordDialog from "@/components/ChangePasswordDialog";
import logoImage from "@assets/logo Reung_1764364561043.png";

export default function AdminPanel() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Log for debugging
  if (error) {
    console.error("Auth check error:", error);
  }

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      setLocation("/login");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const isAdmin = user.isAdmin === 1;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You do not have admin privileges</p>
          <Button onClick={() => logoutMutation.mutate()} data-testid="button-logout">
            Logout
          </Button>
        </div>
      </div>
    );
  }

  // Treat null/undefined adminRole as "full" for backward compatibility
  const isFullAdmin = !user.adminRole || user.adminRole === "full";
  const currentPath = location.split("/")[2] || "videos";

  // Redirect video-only admins to videos page if they try to access restricted sections
  if (!isFullAdmin && (currentPath === "analytics" || currentPath === "users" || currentPath === "banners")) {
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
              </nav>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[120px] sm:max-w-none">{user.fullName}</span>
              <ChangePasswordDialog 
                trigger={
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm" data-testid="button-change-password">
                    <Key className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Password</span>
                  </Button>
                }
              />
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
          <Route path="/admin" component={isFullAdmin ? Analytics : VideoManagement} />
        </Switch>
      </div>
    </div>
  );
}

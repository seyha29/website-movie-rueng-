import { Search, User, Menu, X, LogOut, List, LayoutDashboard, CreditCard, CheckCircle2 } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/use-subscription";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { authLabels, searchLabels } from "@/lib/translations";
import logoImage from "@assets/logo Reung_1764364561043.png";
import cambodiaFlag from "@assets/Flag_of_Cambodia.svg_1764367832078.png";
import ukFlag from "@assets/Flag_of_the_United_Kingdom_(3-5).svg_1764367864097.png";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useLocation();
  const [, params] = useRoute("/search/:query");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const { isSubscribed, subscription, isLoading: isSubLoading } = useSubscription();
  const { language, setLanguage } = useLanguage();

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include"
        });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const result = await apiRequest("POST", "/api/auth/logout", {});
      return await result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      setLocation("/");
    },
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search/${encodeURIComponent(searchQuery)}`);
    }
  };

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Movies", path: "/movies" },
    { label: "TV Shows", path: "/tv-shows" },
    { label: "New & Popular", path: "/new" },
    { label: "My List", path: "/my-list" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        isScrolled ? "bg-background/95 backdrop-blur-md border-border" : "bg-background/80 backdrop-blur-sm border-border/50"
      }`}
    >
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-12">
        <div className="flex items-center justify-between h-14 lg:h-16 gap-2 lg:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0" data-testid="link-home">
            <img 
              src={logoImage} 
              alt="Rueng" 
              className="h-20 lg:h-24 w-auto object-contain"
              data-testid="img-main-logo"
            />
          </Link>
          
          {/* Search - Visible on all screens */}
          <form onSubmit={handleSearch} className="flex flex-1 max-w-md mx-2 md:mx-8">
            <div className="relative w-full">
              <Search className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={searchLabels.placeholder[language]}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 md:pl-10 bg-secondary border-secondary focus:bg-accent focus:border-border text-xs md:text-sm h-8 md:h-10"
                data-testid="input-search"
              />
            </div>
          </form>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Language Switcher with Flags */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === "km" ? "en" : "km")}
              className="gap-1.5 hover-elevate"
              data-testid="button-language-switcher"
            >
              {language === "km" ? (
                <img 
                  src={cambodiaFlag} 
                  alt="Cambodia" 
                  className="w-5 h-4 object-cover rounded-sm"
                />
              ) : (
                <img 
                  src={ukFlag} 
                  alt="United Kingdom" 
                  className="w-5 h-4 object-cover rounded-sm"
                />
              )}
              <span className="text-xs font-medium hidden sm:inline">{language === "km" ? "KM" : "EN"}</span>
            </Button>

            {user ? (
              <>
                {/* Mobile Menu for Authenticated Users */}
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild className="lg:hidden">
                    <Button variant="ghost" size="icon" className="hover-elevate" data-testid="button-mobile-menu">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px]">
                    <SheetHeader>
                      <SheetTitle className="flex items-center justify-start">
                        <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                          <img 
                            src={logoImage} 
                            alt="Reoung Flix" 
                            className="h-16 w-auto object-contain"
                            data-testid="img-sidebar-logo"
                          />
                        </Link>
                      </SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 mt-6">
                      {/* Navigation */}
                      <nav className="flex flex-col gap-2">
                        {navItems.map((item) => (
                          <Link key={item.path} href={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                            <Button
                              variant={location === item.path ? "secondary" : "ghost"}
                              className="w-full justify-start hover-elevate"
                            >
                              {item.label}
                            </Button>
                          </Link>
                        ))}
                      </nav>

                      {/* Subscription Status */}
                      {!isSubLoading && (
                        <div className="mt-4 p-3 rounded-lg bg-card border border-border">
                          <div className="flex items-center gap-2 mb-2">
                            {isSubscribed ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Subscribed</span>
                              </>
                            ) : (
                              <>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Free Plan</span>
                              </>
                            )}
                          </div>
                          {isSubscribed && subscription?.endDate && (
                            <p className="text-xs text-muted-foreground">
                              Expires: {new Date(subscription.endDate * 1000).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive hover:text-destructive hover-elevate mt-2"
                        onClick={() => {
                          logoutMutation.mutate();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {authLabels.logout[language]}
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Desktop User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hidden lg:flex hover-elevate rounded-full"
                      data-testid="button-user-menu"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{user.fullName}</span>
                        <span className="text-xs text-muted-foreground">{user.phoneNumber}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {!isSubLoading && (
                      <>
                        <DropdownMenuItem disabled className="flex items-center gap-2">
                          {isSubscribed ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">Subscribed</span>
                                {subscription?.endDate && (
                                  <span className="text-xs text-muted-foreground">
                                    Expires: {new Date(subscription.endDate * 1000).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span>Free Plan</span>
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    <DropdownMenuItem asChild>
                      <Link href="/my-list">
                        <List className="h-4 w-4 mr-2" />
                        My List
                      </Link>
                    </DropdownMenuItem>
                    
                    {user.isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive cursor-pointer"
                      onClick={() => logoutMutation.mutate()}
                      data-testid="button-logout"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {authLabels.logout[language]}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Mobile menu for non-authenticated users */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden hover-elevate"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  data-testid="button-mobile-menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>

                {/* Login/Register buttons */}
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="hover-elevate" data-testid="button-login">
                    {authLabels.login[language]}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="hover-elevate" data-testid="button-register">
                    {authLabels.register[language]}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu for non-authenticated users */}
      {!user && isMobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <div className="px-4 py-3 space-y-2">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={searchLabels.placeholder[language]}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}

import { Search, User, Menu, LogOut, List, LayoutDashboard, Wallet, CreditCard } from "lucide-react";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { authLabels, searchLabels, navLabels, subscriptionLabels } from "@/lib/translations";
import logoImage from "@assets/logo Reung_1764364561043.png";
import cambodiaFlag from "@assets/Flag_of_Cambodia.svg_1764367832078.png";
import ukFlag from "@assets/Flag_of_the_United_Kingdom_(3-5).svg_1764367864097.png";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useLocation();
  const [, params] = useRoute("/search/:query");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const { toast } = useToast();
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
      // Auto-hide mobile search bar when scrolling
      if (isMobileSearchOpen) {
        setIsMobileSearchOpen(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobileSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search/${encodeURIComponent(searchQuery)}`);
    }
  };

  const navItems = [
    { label: navLabels.home[language], path: "/" },
    { label: navLabels.movies[language], path: "/movies" },
    { label: navLabels.newAndPopular[language], path: "/new" },
    { label: navLabels.myList[language], path: "/my-list" },
    { label: language === 'km' ? 'ភាពយន្តសម្រាប់ក្រេឌីត' : 'Movies for Credit', path: "/credit-movies" },
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
          <Link 
            href="/" 
            className="flex items-center gap-2 flex-shrink-0" 
            data-testid="link-home"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img 
              src={logoImage} 
              alt="Rueng" 
              className="h-20 lg:h-24 w-auto object-contain"
              data-testid="img-main-logo"
            />
          </Link>
          
          {/* Search Bar - Always visible on desktop, visible on mobile only when logged in */}
          <form onSubmit={handleSearch} className={`${user ? 'flex' : 'hidden md:flex'} flex-1 max-w-md mx-2 md:mx-8`}>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={searchLabels.placeholder[language]}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-secondary focus:bg-accent focus:border-border text-sm h-9 md:h-10"
                data-testid="input-search"
              />
            </div>
          </form>

          {/* Mobile Search Icon - Visible only on mobile when NOT logged in */}
          {!user && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover-elevate"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              data-testid="button-mobile-search"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

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
                      {/* User Profile Header Section */}
                      <div className="p-4 rounded-lg bg-card border border-border">
                        <div className="flex items-start gap-3">
                          {user.avatarUrl ? (
                            <img 
                              src={user.avatarUrl} 
                              alt={user.fullName} 
                              className="h-12 w-12 rounded-full object-cover border-2 border-orange-500/50"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center border-2 border-orange-500/50">
                              <span className="text-orange-500 font-bold text-lg">
                                {user.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-semibold text-base">{user.fullName}</span>
                            <span className="text-sm text-muted-foreground">{user.phoneNumber || user.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="flex flex-col gap-1">
                        {/* Profile */}
                        <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start gap-3 hover-elevate">
                            <User className="h-4 w-4" />
                            <span>{language === 'km' ? 'គណនី' : 'Profile'}</span>
                          </Button>
                        </Link>

                        {/* Credit Balance */}
                        <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start gap-3 hover-elevate">
                            <Wallet className="h-4 w-4 text-orange-500" />
                            <span>{language === 'km' ? 'សមតុល្យ' : 'Balance'}</span>
                            <span className="text-orange-500 font-bold ml-auto">
                              ${parseFloat(user.balance || "0").toFixed(2)}
                            </span>
                          </Button>
                        </Link>

                        {/* My List */}
                        <Link href="/my-list" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button
                            variant={location === '/my-list' ? "secondary" : "ghost"}
                            className="w-full justify-start gap-3 hover-elevate"
                          >
                            <List className="h-4 w-4" />
                            <span>{navLabels.myList[language]}</span>
                          </Button>
                        </Link>

                        {/* Purchased Movies */}
                        <Link href="/purchased" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button
                            variant={location === '/purchased' ? "secondary" : "ghost"}
                            className="w-full justify-start gap-3 hover-elevate"
                          >
                            <CreditCard className="h-4 w-4" />
                            <span>{language === 'km' ? 'ភាពយន្តបានទិញ' : 'Purchased Movies'}</span>
                          </Button>
                        </Link>
                      </div>

                      {/* Navigation */}
                      <div className="border-t border-border pt-4">
                        <nav className="flex flex-col gap-1">
                          {navItems.filter(item => item.path !== '/my-list').map((item) => (
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
                      </div>

                      {/* Logout */}
                      <div className="border-t border-border pt-4">
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover-elevate"
                          onClick={() => {
                            logoutMutation.mutate();
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <LogOut className="h-4 w-4" />
                          <span>{authLabels.logout[language]}</span>
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Desktop User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hidden lg:flex hover-elevate rounded-full overflow-hidden"
                      data-testid="button-user-menu"
                    >
                      {user.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          alt={user.fullName} 
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 p-0">
                    {/* Profile Header Section */}
                    <div className="p-4 border-b border-border">
                      <div className="flex items-start gap-3">
                        {user.avatarUrl ? (
                          <img 
                            src={user.avatarUrl} 
                            alt={user.fullName} 
                            className="h-12 w-12 rounded-full object-cover border-2 border-orange-500/50"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center border-2 border-orange-500/50">
                            <span className="text-orange-500 font-bold text-lg">
                              {user.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-semibold text-base">{user.fullName}</span>
                          <span className="text-sm text-muted-foreground">{user.phoneNumber || user.email}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="py-2">
                      {/* Profile Link */}
                      <DropdownMenuItem asChild className="cursor-pointer px-4 py-2.5">
                        <Link href="/profile" className="flex items-center gap-3 w-full">
                          <User className="h-4 w-4" />
                          <span>{language === 'km' ? 'គណនី' : 'Profile'}</span>
                        </Link>
                      </DropdownMenuItem>
                      
                      {/* Credit Balance */}
                      <DropdownMenuItem asChild className="cursor-pointer px-4 py-2.5">
                        <Link href="/profile" className="flex items-center gap-3 w-full">
                          <Wallet className="h-4 w-4 text-orange-500" />
                          <span>{language === 'km' ? 'សមតុល្យ' : 'Balance'}</span>
                          <span className="text-orange-500 font-bold ml-auto">
                            ${parseFloat(user.balance || "0").toFixed(2)}
                          </span>
                        </Link>
                      </DropdownMenuItem>

                      {/* My List */}
                      <DropdownMenuItem asChild className="cursor-pointer px-4 py-2.5">
                        <Link href="/my-list" className="flex items-center gap-3 w-full">
                          <List className="h-4 w-4" />
                          <span>{navLabels.myList[language]}</span>
                        </Link>
                      </DropdownMenuItem>
                      
                      {/* Purchased Movies */}
                      <DropdownMenuItem asChild className="cursor-pointer px-4 py-2.5">
                        <Link href="/purchased" className="flex items-center gap-3 w-full">
                          <CreditCard className="h-4 w-4" />
                          <span>{language === 'km' ? 'ភាពយន្តបានទិញ' : 'Purchased Movies'}</span>
                        </Link>
                      </DropdownMenuItem>
                      
                      {user.isAdmin && (
                        <DropdownMenuItem asChild className="cursor-pointer px-4 py-2.5">
                          <Link href="/admin" className="flex items-center gap-3 w-full">
                            <LayoutDashboard className="h-4 w-4" />
                            <span>{subscriptionLabels.adminPanel[language]}</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </div>
                    
                    {/* Logout Section */}
                    <div className="border-t border-border py-2">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive cursor-pointer px-4 py-2.5 flex items-center gap-3"
                        onClick={() => logoutMutation.mutate()}
                        data-testid="button-logout"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{authLabels.logout[language]}</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Login/Register buttons - no mobile menu for non-authenticated users */}
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

        {/* Mobile Search Dropdown */}
        {isMobileSearchOpen && (
          <div className="md:hidden px-4 pb-3 pt-1 border-t border-border/50">
            <form onSubmit={(e) => { handleSearch(e); setIsMobileSearchOpen(false); }} className="w-full">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={searchLabels.placeholder[language]}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary border-secondary focus:bg-accent focus:border-border text-sm h-10 w-full"
                  data-testid="input-mobile-search"
                  autoFocus
                />
              </div>
            </form>
          </div>
        )}
      </div>

    </header>
  );
}

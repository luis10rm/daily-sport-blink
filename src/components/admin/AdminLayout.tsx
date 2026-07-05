import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePendingSuggestionsCount } from "@/hooks/useNewsDiscovery";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Newspaper,
  ChevronLeft,
  Megaphone,
  FolderKanban,
  Wallpaper,
  UserPen,
  Menu,
  MessageSquare,
  Sparkles,
  Globe,
  Star,
  Sun,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/suggestions", label: "Propozycje newsów", icon: Sparkles, badge: "pendingSuggestions" as const },
  { href: "/admin/sources", label: "Źródła", icon: Globe },
  { href: "/admin/posts", label: "Posty", icon: FileText },
  { href: "/admin/recki", label: "Tech", icon: Star },
  { href: "/admin/banners", label: "Banery", icon: Megaphone },
  { href: "/admin/authors", label: "Autorzy", icon: UserPen },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/admin/wallpapers", label: "Wallpapery", icon: Wallpaper, adminOnly: true },
  { href: "/admin/categories", label: "Kategorie", icon: FolderKanban, adminOnly: true },
  { href: "/admin/users", label: "Użytkownicy", icon: Users, adminOnly: true },
  { href: "/admin/settings", label: "Ustawienia", icon: Settings },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const handleNavClick = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const { data: pendingSuggestions } = usePendingSuggestionsCount();

  const SidebarContent = () => (
    <>
      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          const showBadge = item.badge === "pendingSuggestions" && (pendingSuggestions ?? 0) > 0;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <Badge variant={isActive ? "secondary" : "default"} className="h-5 px-1.5 text-xs">
                  {pendingSuggestions}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-4">
        <div className="mb-3 text-sm">
          <p className="font-medium text-foreground truncate">
            {user?.email}
          </p>
          <p className="text-xs text-muted-foreground">
            {isAdmin ? "Administrator" : "Redaktor"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="default"
            className="flex-1"
            onClick={() => {
              navigate("/");
              handleNavClick();
            }}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Strona
          </Button>
          <Button
            variant="outline"
            size="default"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-card px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Newspaper className="h-4 w-4" />
            </div>
            <span className="font-heading text-lg font-bold">Szortsy</span>
          </div>
        </header>

        {/* Mobile drawer */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b border-border px-6 py-4">
              <SheetTitle className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Newspaper className="h-5 w-5" />
                </div>
                <span className="font-heading text-lg font-bold">Szortsy</span>
              </SheetTitle>
            </SheetHeader>
            <div className="flex h-[calc(100vh-73px)] flex-col">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main className="min-h-[calc(100vh-56px)]">
          <div className="p-4">{children}</div>
        </main>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-border px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Newspaper className="h-5 w-5" />
            </div>
            <span className="font-heading text-lg font-bold">Szortsy</span>
          </div>

          <SidebarContent />
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};

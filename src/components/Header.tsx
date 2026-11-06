import { Archive, ChevronDown, Menu, Users, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSportCategories } from "@/hooks/useSportCategories";
import { useTournamentMode } from "@/hooks/useTournamentMode";
import { DynamicSportIcon } from "./DynamicSportIcon";
import { ThemeToggle } from "./ThemeToggle";
import { ChannelSwitcher } from "./ChannelSwitcher";
import { MatchTicker } from "./MatchTicker";
import { Button } from "@/components/ui/button";
import logoIcon from "@/assets/logo-icon.png";
import { isTapGesture } from "@/lib/tapGuard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Uses <a> + onClick/onTouchEnd + navigate() pattern instead of <Link> to avoid
 * iOS Safari double-tap requirement (first tap = focus, second = click).
 */
const useNavLink = () => {
  const navigate = useNavigate();
  return (to: string) => ({
    href: to,
    onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      navigate(to);
    },
    onTouchEnd: (e: React.TouchEvent<HTMLAnchorElement>) => {
      if (!isTapGesture()) return;
      e.preventDefault();
      navigate(to);
    },
  });
};

export const Header = () => {
  const { data: categories = [] } = useSportCategories();
  const { isWorldCup } = useTournamentMode();
  const navLink = useNavLink();

  return (
    <>
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground"
      >
        Przejdź do treści
      </a>
      <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="container flex min-h-20 flex-wrap items-center gap-x-6 gap-y-0 py-3">
        <a {...navLink("/")} className="flex shrink-0 items-center gap-3 hover:opacity-80 transition-opacity touch-manipulation">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <img src={logoIcon} alt="Szortsy logo" className="h-7 w-7" />
            {isWorldCup && (
              <span
                aria-hidden
                className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-news-of-day ring-2 ring-card"
              >
                <Trophy className="h-2.5 w-2.5 text-news-of-day-foreground" />
              </span>
            )}
          </div>
          <span className="text-2xl font-bold text-foreground">Szortsy</span>
        </a>
        <ChannelSwitcher className="order-last mt-3 w-full lg:order-none lg:mt-0 lg:w-auto" />

        <nav aria-label="Nawigacja główna" className="ml-auto hidden items-center gap-3 lg:flex">
          {/* Categories Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-1 px-2 text-muted-foreground touch-manipulation">
              <span>Kategorie</span>
              <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {categories.map((category) => (
                <DropdownMenuItem key={category.id} asChild>
                  <a
                    {...navLink(`/kategoria/${category.slug}`)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <DynamicSportIcon
                      sportCategory={category}
                      fallbackSlug={category.slug}
                      className="h-5 w-5"
                    />
                    <span>{category.name}</span>
                  </a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <a
            {...navLink("/archiwum")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Archive className="h-4 w-4" />
            <span>Archiwum</span>
          </a>
          <a
            {...navLink("/autorzy")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Users className="h-4 w-4" />
            <span>Autorzy</span>
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Otwórz menu" title="Otwórz menu" className="h-11 w-11 rounded-control border-border bg-card text-muted-foreground touch-manipulation lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[65vh] w-64 overflow-y-auto">
              <div className="px-2 py-2 text-xs font-semibold text-muted-foreground">Kategorie</div>
              {categories.map((category) => (
                <DropdownMenuItem key={category.id} asChild>
                  <a {...navLink(`/kategoria/${category.slug}`)} className="min-h-11 cursor-pointer touch-manipulation">
                    {category.name}
                  </a>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem asChild>
                <a {...navLink("/archiwum")} className="min-h-11 cursor-pointer border-t border-border touch-manipulation"><Archive />Archiwum</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a {...navLink("/autorzy")} className="min-h-11 cursor-pointer touch-manipulation"><Users />Autorzy</a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <MatchTicker />
    </header>
    </>
  );
};

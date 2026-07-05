import { Archive, ChevronDown, Users, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSportCategories } from "@/hooks/useSportCategories";
import { useTournamentMode } from "@/hooks/useTournamentMode";
import { DynamicSportIcon } from "./DynamicSportIcon";
import { ThemeToggle } from "./ThemeToggle";
import { ChannelSwitcher } from "./ChannelSwitcher";
import { MatchTicker } from "./MatchTicker";
import logoIcon from "@/assets/logo-icon.png";
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
      {/* Header: solid bg on mobile for better INP, blur on desktop only */}
      <header className="border-b border-border bg-card/95 md:bg-card/50 md:backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <a {...navLink("/")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <img src={logoIcon} alt="Szortsy logo" className="h-7 w-7" />
            {isWorldCup && (
              <span
                aria-hidden
                className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 ring-2 ring-card shadow-sm"
              >
                <Trophy className="h-2.5 w-2.5 text-amber-950" />
              </span>
            )}
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">Szortsy</span>
          <span className="text-sm text-muted-foreground hidden sm:block">
            {isWorldCup ? "Strefa Mundialu 2026" : "O sporcie: krótko, codziennie"}
          </span>
        </a>
        
        <nav className="flex items-center gap-4">
          {/* Categories Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <span className="hidden sm:inline">Kategorie</span>
              <ChevronDown className="h-4 w-4" />
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
            <span className="hidden sm:inline">Archiwum</span>
          </a>
          <a
            {...navLink("/autorzy")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Autorzy</span>
          </a>
          <ChannelSwitcher />
          <ThemeToggle />
        </nav>
      </div>
      <MatchTicker />
    </header>
    </>
  );
};

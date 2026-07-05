import { useNavigate } from "react-router-dom";
import { Cpu, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChannelSwitcher } from "@/components/ChannelSwitcher";
import { useReviewCategories } from "@/hooks/useReviews";
import { PatronBar } from "@/components/PatronBar";

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

export const ReckiHeader = () => {
  const { data: categories = [] } = useReviewCategories();
  const navLink = useNavLink();

  return (
    <>
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <a {...navLink("/tech")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-600 to-pink-600 text-white shadow-md">
              <Cpu className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-bold tracking-tight text-foreground">Tech</span>
              <span className="text-[11px] text-muted-foreground hidden sm:block">
                by Szortsy · technologie, recenzje, newsy
              </span>
            </div>
          </a>

          <nav className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <span className="hidden sm:inline">Kategorie</span>
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {categories.map((c) => (
                  <DropdownMenuItem key={c.id} asChild>
                    <a {...navLink(`/tech/kategoria/${c.slug}`)} className="cursor-pointer">
                      {c.name}
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <ModeSwitcher />
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <PatronBar />
    </>
  );
};

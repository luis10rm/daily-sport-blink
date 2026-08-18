import { Link } from "@/lib/router-compat";
import { Sun, ChevronDown, Archive } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChannelSwitcher } from "@/components/ChannelSwitcher";
import { usePositiveCategories } from "@/hooks/usePositiveCategories";

export const PozytywneHeader = () => {
  const { data: categories = [] } = usePositiveCategories();

  return (
    <header className="border-b border-border bg-background/85 backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <Link
          to="/pozytywne"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-lime-500 to-lime-600 text-white shadow-md">
            <Sun className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-bold tracking-tight text-foreground">Pozytywne</span>
            <span className="text-[11px] text-muted-foreground hidden sm:block">
              by Szortsy · dobre wiadomości z kraju i ze świata
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <span className="hidden sm:inline">Kategorie</span>
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {categories.length === 0 && (
                <DropdownMenuItem disabled>Brak kategorii</DropdownMenuItem>
              )}
              {categories.map((c) => (
                <DropdownMenuItem key={c.id} asChild>
                  <Link
                    to={`/pozytywne/kategoria/${c.slug}`}
                    className="cursor-pointer"
                  >
                    {c.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            to="/pozytywne/archiwum"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Archive className="h-4 w-4" />
            <span>Archiwum</span>
          </Link>

          <ChannelSwitcher />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
};

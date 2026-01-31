import { Archive, ChevronDown, Newspaper, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useSportCategories } from "@/hooks/useSportCategories";
import { DynamicSportIcon } from "./DynamicSportIcon";
import { ThemeToggle } from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const { data: categories = [] } = useSportCategories();

  return (
    <>
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground"
      >
        Przejdź do treści
      </a>
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Newspaper className="h-5 w-5" />
          </div>
          <span className="font-heading text-xl font-bold tracking-tight text-foreground">
            Szortsy
          </span>
          <span className="text-sm text-muted-foreground hidden sm:block">
            O sporcie: krótko, codziennie
          </span>
        </Link>
        
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
                  <Link
                    to={`/kategoria/${category.slug}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <DynamicSportIcon
                      sportCategory={category}
                      fallbackSlug={category.slug}
                      className="h-5 w-5"
                    />
                    <span>{category.name}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link 
            to="/archiwum" 
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Archive className="h-4 w-4" />
            <span className="hidden sm:inline">Archiwum</span>
          </Link>
          <Link 
            to="/autorzy" 
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Autorzy</span>
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
    </>
  );
};

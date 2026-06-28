import { Link } from "react-router-dom";
import { Cpu, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ModeSwitcher } from "./ModeSwitcher";
import { useReviewCategories } from "@/hooks/useReviews";

export const ReckiHeader = () => {
  const { data: categories = [] } = useReviewCategories();

  return (
    <header className="border-b border-border bg-card/95 md:bg-card/60 md:backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/recki" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-md">
            <Cpu className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-bold tracking-tight text-foreground">Recki</span>
            <span className="text-[11px] text-muted-foreground hidden sm:block">
              by Szortsy · tech recenzje
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
              {categories.map((c) => (
                <DropdownMenuItem key={c.id} asChild>
                  <Link to={`/recki/kategoria/${c.slug}`} className="cursor-pointer">
                    {c.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <ModeSwitcher />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
};

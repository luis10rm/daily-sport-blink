import { Newspaper, Users } from "lucide-react";
import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Newspaper className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-xl font-bold tracking-tight text-foreground leading-none">
              Szortsy
            </span>
            <span className="text-[10px] text-muted-foreground tracking-wide hidden sm:block">
              O sporcie: krótko, codziennie
            </span>
          </div>
        </Link>
        
        <nav className="flex items-center gap-4">
          <Link 
            to="/autorzy" 
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Autorzy</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};

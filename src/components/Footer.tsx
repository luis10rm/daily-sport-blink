import { Facebook } from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border py-8">
      <div className="container text-center text-sm text-muted-foreground space-y-4">
        <p>Serwis agreguje nagłówki i odsyła do źródeł. Prawa do treści należą do wydawców.</p>
        
        <a
          href="https://www.facebook.com/Szortsy"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Facebook className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium">Obserwuj nas na Facebooku</span>
        </a>
        
        <p>© {currentYear} Szortsy. Wszystkie prawa zastrzeżone.</p>
      </div>
    </footer>
  );
};

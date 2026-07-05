import { Sun } from "lucide-react";

export const PozytywneFooter = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-border py-8 mt-8">
      <div className="container text-center text-sm text-muted-foreground space-y-4">
        <div className="inline-flex items-center gap-2 text-lime-700 dark:text-lime-300 font-semibold">
          <Sun className="h-4 w-4" />
          Szortsy Pozytywne · 60 sekund. Lepszy dzień.
        </div>
        <p>Publikujemy wyłącznie wiadomości o pozytywnym wydźwięku. Odsyłamy do źródeł — prawa do treści należą do wydawców.</p>
        <p>© {currentYear} Szortsy. Wszystkie prawa zastrzeżone.</p>
      </div>
    </footer>
  );
};

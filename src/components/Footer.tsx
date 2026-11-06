import { Facebook } from "lucide-react";
import { FeedbackBox } from "@/components/FeedbackBox";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border py-8">
      <div className="container text-center text-sm text-muted-foreground space-y-5">
        <FeedbackBox className="mx-auto max-w-md text-left" />

        <p>Serwis agreguje nagłówki i odsyła do źródeł. Prawa do treści należą do wydawców.</p>

        <a
          href="https://www.facebook.com/Szortsy"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-chip bg-primary/10">
            <Facebook className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium">Obserwuj nas na Facebooku</span>
        </a>

        <p className="text-xs">
          To miejsce może zająć Twój partner.{" "}
          <a
            href="mailto:reklama@szortsy.pl"
            rel="sponsored"
            className="font-semibold text-primary hover:underline underline-offset-2"
          >
            Zostań partnerem
          </a>
        </p>

        <p>© {currentYear} Szortsy. Wszystkie prawa zastrzeżone.</p>
      </div>
    </footer>
  );
};

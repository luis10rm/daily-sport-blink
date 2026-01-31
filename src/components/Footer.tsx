export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border py-8">
      <div className="container text-center text-sm text-muted-foreground space-y-2">
        <p>Serwis agreguje nagłówki i odsyła do źródeł. Prawa do treści należą do wydawców.</p>
        <p>© {currentYear} Szortsy. Wszystkie prawa zastrzeżone.</p>
      </div>
    </footer>
  );
};

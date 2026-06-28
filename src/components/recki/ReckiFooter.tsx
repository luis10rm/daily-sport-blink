import { Link } from "react-router-dom";

export const ReckiFooter = () => {
  return (
    <footer className="mt-12 border-t border-border bg-card/60 py-8">
      <div className="container flex flex-col items-center gap-3 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
        <p>© {new Date().getFullYear()} Recki by Szortsy · Recenzje technologii</p>
        <div className="flex items-center gap-4">
          <Link to="/recki" className="hover:text-foreground">Wszystkie recenzje</Link>
          <Link to="/" className="hover:text-foreground">Sport</Link>
        </div>
      </div>
    </footer>
  );
};

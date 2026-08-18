import { Link } from "@/lib/router-compat";
import { useEffect } from "react";
import { useLocation } from "@/lib/router-compat";
import { Search, Home, Archive, Tag } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main id="main-content" className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          
          <h1 className="font-heading text-4xl font-bold text-foreground mb-3">
            Ups! Strona nie istnieje
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Nie znaleźliśmy strony, której szukasz. Może przeniesiono ją lub usunięto.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild>
              <Link to="/" className="gap-2">
                <Home className="h-4 w-4" />
                Strona główna
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/archiwum" className="gap-2">
                <Archive className="h-4 w-4" />
                Archiwum
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/tagi" className="gap-2">
                <Tag className="h-4 w-4" />
                Tagi
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;

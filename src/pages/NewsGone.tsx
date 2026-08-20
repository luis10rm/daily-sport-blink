import { Link } from "react-router-dom";
import { MoveRight, Archive, Home } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useSEOMeta } from "@/hooks/useSEOMeta";

const NewsGone = () => {
  useSEOMeta({
    title: "Artykuł przeniesiony",
    robots: "noindex, follow",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main id="main-content" className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <MoveRight className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>

          <h1 className="font-heading text-4xl font-bold text-foreground mb-3">
            Artykuł został przeniesiony
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Nasze artykuły mają teraz nowe adresy. Znajdziesz je w archiwum lub na stronie głównej.
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NewsGone;

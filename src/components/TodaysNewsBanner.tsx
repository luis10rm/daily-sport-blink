import { useEffect, useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Newspaper, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWallpaperContext } from "@/contexts/WallpaperContext";

interface TodaysNewsBannerProps {
  count: number;
  isLoading?: boolean;
  className?: string;
}

const variants = [
  { before: "Dzisiaj mamy dla Ciebie", after: "starannie wybranych newsów sportowych" },
  { before: "Przygotowaliśmy", after: "gorących informacji ze świata sportu" },
  { before: "Twoja codzienna dawka sportu:", after: "newsów z ostatnich 24h" },
  { before: "Specjalnie dla Ciebie:", after: "najciekawszych wydarzeń sportowych" },
];

const mobileVariants = [
  { prefix: "Wyselekcjonowane dla Ciebie", suffix: "newsów" },
  { prefix: "Tylko najważniejsze", suffix: "sportowych hitów" },
  { prefix: "Twój briefing", suffix: "kluczowych newsów" },
  { prefix: "Starannie wybrane", suffix: "informacji dnia" },
  { prefix: "Esencja sportu", suffix: "must-read" },
];

// Polish plural forms
const getNewsLabel = (count: number) => {
  if (count === 1) return "news";
  if (count >= 2 && count <= 4) return "newsy";
  return "newsów";
};

export const TodaysNewsBanner = ({ count, isLoading, className }: TodaysNewsBannerProps) => {
  const isMobile = useIsMobile();
  const { isTakeoverActive } = useWallpaperContext();
  const [displayCount, setDisplayCount] = useState(0);
  const [variant] = useState(() => variants[Math.floor(Math.random() * variants.length)]);
  const [mobileVariant] = useState(() => mobileVariants[Math.floor(Math.random() * mobileVariants.length)]);

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const formattedDate = format(today, "EEEE, d MMMM", { locale: pl });
  // Capitalize first letter
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  // Count-up animation
  useEffect(() => {
    if (count === 0 || isLoading) {
      setDisplayCount(0);
      return;
    }

    const duration = 1000;
    const steps = 20;
    const increment = count / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= count) {
        setDisplayCount(count);
        clearInterval(timer);
      } else {
        setDisplayCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [count, isLoading]);

  if (isLoading) {
    return (
      <div className={cn("mb-10", className)}>
        <Skeleton className="h-[180px] md:h-[220px] w-full rounded-2xl" />
      </div>
    );
  }

  // Zero news case
  if (count === 0) {
    return (
      <section
        className={cn(
          "mb-10 rounded-2xl border border-border bg-muted/50 p-6 md:p-8 text-center animate-fade-in",
          className
        )}
      >
        <Newspaper className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">
          Dzisiaj jeszcze nie dodaliśmy newsów - wróć później!
        </p>
        <p className="text-sm text-muted-foreground/70 mt-2">{capitalizedDate}</p>
      </section>
    );
  }

  // Mobile compact version - min-height prevents CLS
  if (isMobile) {
    return (
      <section
        className={cn(
          "mb-8 rounded-xl p-4 animate-fade-in min-h-[60px]",
          isTakeoverActive
            ? "bg-card border border-border shadow-lg"
            : "border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <Newspaper className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-foreground">
              <span className="font-semibold">{mobileVariant.prefix}</span>
              <span className="mx-1.5 text-muted-foreground">·</span>
              <span className="text-primary font-bold text-lg">{displayCount}</span>
              <span className="text-muted-foreground ml-1">{mobileVariant.suffix}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{capitalizedDate}</p>
          </div>
          <Link
            to={`/dzien/${todayStr}`}
            className="flex-shrink-0 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            Briefing
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </section>
    );
  }

  // Desktop compact version - min-height prevents CLS
  return (
    <section
      className={cn(
        "mb-6 rounded-xl py-4 px-6 animate-fade-in min-h-[80px]",
        isTakeoverActive
          ? "bg-card border border-border shadow-lg"
          : "border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10",
        className
      )}
    >
      <div className="flex items-center justify-center gap-4 flex-wrap">
        {/* Icon + intro text */}
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-primary" />
          <span className="text-base text-muted-foreground">{variant.before}</span>
        </div>

        {/* Animated number */}
        <span className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          {displayCount}
        </span>

        {/* After text */}
        <span className="text-base text-foreground font-medium">
          {variant.after}
        </span>

        {/* Briefing button */}
        <Link
          to={`/dzien/${todayStr}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          Zobacz briefing
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Date below */}
      <p className="text-center text-xs text-muted-foreground mt-2">
        {capitalizedDate}
      </p>
    </section>
  );
};

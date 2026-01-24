import { useEffect, useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Newspaper } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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

// Polish plural forms
const getNewsLabel = (count: number) => {
  if (count === 1) return "news";
  if (count >= 2 && count <= 4) return "newsy";
  return "newsów";
};

export const TodaysNewsBanner = ({ count, isLoading, className }: TodaysNewsBannerProps) => {
  const isMobile = useIsMobile();
  const [displayCount, setDisplayCount] = useState(0);
  const [variant] = useState(() => variants[Math.floor(Math.random() * variants.length)]);

  const formattedDate = format(new Date(), "EEEE, d MMMM", { locale: pl });
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

  // Mobile compact version
  if (isMobile) {
    return (
      <section
        className={cn(
          "mb-8 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4 animate-fade-in",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Newspaper className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Dzisiaj: <span className="text-primary font-bold">{displayCount}</span> {getNewsLabel(displayCount)}
              </p>
              <p className="text-xs text-muted-foreground">{capitalizedDate}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Desktop full version
  return (
    <section
      className={cn(
        "mb-10 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/8 to-primary/10 p-8 text-center animate-fade-in",
        className
      )}
    >
      {/* Icon and intro text */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Newspaper className="h-6 w-6 text-primary" />
        <span className="text-lg text-muted-foreground">{variant.before}</span>
      </div>

      {/* Big animated number */}
      <div className="mb-4">
        <span className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          {displayCount}
        </span>
      </div>

      {/* After text */}
      <p className="text-xl text-foreground font-medium mb-6">
        {variant.after}
      </p>

      {/* Divider */}
      <div className="w-48 h-px bg-border mx-auto mb-4" />

      {/* Footer with date */}
      <p className="text-sm text-muted-foreground">
        Przygotowaliśmy je z myślą o Tobie • {capitalizedDate}
      </p>
    </section>
  );
};

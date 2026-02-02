import { useEffect, useState, RefObject } from "react";
import { ChevronDown, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollProgressProps {
  todaysCount: number;
  lastTodayRef: RefObject<HTMLElement>;
  className?: string;
}

export const ScrollProgress = ({ todaysCount, lastTodayRef, className }: ScrollProgressProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!lastTodayRef.current) {
      setIsVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show indicator when last today's element is still visible or above viewport
        // Hide when it has scrolled past (below viewport top)
        setIsVisible(entry.isIntersecting || entry.boundingClientRect.top > 0);
      },
      { threshold: 0 }
    );

    observer.observe(lastTodayRef.current);
    return () => observer.disconnect();
  }, [lastTodayRef]);

  if (!isVisible || todaysCount <= 0) return null;

  // Polish plural forms
  const getNewsLabel = (count: number) => {
    if (count === 1) return "news";
    if (count >= 2 && count <= 4) return "newsy";
    return "newsów";
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "bg-card/95 backdrop-blur-md border border-border rounded-full",
        "px-5 py-3 shadow-lg",
        "animate-fade-in",
        "flex items-center gap-4",
        className
      )}
    >
      {/* Static count indicator */}
      <div className="flex items-center gap-2">
        <Newspaper className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          {todaysCount} {getNewsLabel(todaysCount)} z dzisiaj
        </span>
      </div>

      {/* Scroll hint with optimized animation */}
      <div className="flex items-center gap-1 text-muted-foreground">
        <span className="text-xs">Scrolluj</span>
        <ChevronDown className="h-4 w-4 animate-bounce will-change-transform" />
      </div>
    </div>
  );
};

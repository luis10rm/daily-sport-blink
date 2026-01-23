import { useEffect, useState } from "react";
import { ChevronDown, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ScrollProgressProps {
  todaysCount: number;
  className?: string;
}

export const ScrollProgress = ({ todaysCount, className }: ScrollProgressProps) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [readCount, setReadCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      
      setScrollProgress(Math.min(progress, 100));
      
      // Estimate read items based on scroll position
      const estimatedRead = Math.floor((progress / 100) * todaysCount);
      setReadCount(Math.min(estimatedRead, todaysCount));
      
      // Hide when near bottom (95%+)
      setIsVisible(progress < 95);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [todaysCount]);

  const remainingCount = todaysCount - readCount;

  if (!isVisible || remainingCount <= 0) return null;

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
      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <Newspaper className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          {remainingCount} {remainingCount === 1 ? "news" : "newsów"} więcej z dzisiaj
        </span>
      </div>

      {/* Mini progress bar */}
      <div className="w-20">
        <Progress value={scrollProgress} className="h-1.5" />
      </div>

      {/* Scroll hint with animation */}
      <div className="flex items-center gap-1 text-muted-foreground">
        <span className="text-xs">Scrolluj</span>
        <ChevronDown className="h-4 w-4 animate-bounce" />
      </div>
    </div>
  );
};

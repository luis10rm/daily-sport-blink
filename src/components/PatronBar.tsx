import { useState, useEffect, useMemo } from "react";
import { usePatronSettings } from "@/hooks/usePatronSettings";
import { X, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const SESSION_STORAGE_KEY = "patron_bar_dismissed";

export const PatronBar = () => {
  const { data: patron, isLoading } = usePatronSettings();
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // A/B variant: pick once per mount so it doesn't flicker between re-renders
  const variant = useMemo<"A" | "B">(() => (Math.random() < 0.5 ? "A" : "B"), []);

  useEffect(() => {
    // Check sessionStorage for dismissed state
    const wasDismissed = sessionStorage.getItem(SESSION_STORAGE_KEY) === "true";
    setDismissed(wasDismissed);
    
    // Trigger fade-in animation after mount
    if (!wasDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      setDismissed(true);
      sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
    }, 300);
  };

  // Don't render if loading, disabled, dismissed, or no patron name
  if (isLoading || !patron?.enabled || dismissed || !patron?.patron_name) {
    return null;
  }

  const getStyleClasses = () => {
    switch (patron.style) {
      case "gradient":
        return "bg-gradient-to-r from-transparent via-current to-transparent";
      case "glass":
        return "backdrop-blur-md bg-opacity-80";
      default:
        return "";
    }
  };

  const backgroundStyle = patron.style === "gradient"
    ? {
        background: `linear-gradient(90deg, ${patron.background_color}00 0%, ${patron.background_color} 20%, ${patron.background_color} 80%, ${patron.background_color}00 100%)`,
        color: patron.text_color,
      }
    : patron.style === "glass"
    ? {
        backgroundColor: `${patron.background_color}CC`,
        color: patron.text_color,
      }
    : {
        backgroundColor: patron.background_color,
        color: patron.text_color,
      };

  const hasB = !!(patron.cta_text_b && patron.cta_url_b);
  const useB = hasB && variant === "B";
  const ctaText = useB ? patron.cta_text_b : patron.cta_text;
  const ctaUrl = useB ? patron.cta_url_b : patron.cta_url;
  const activeVariant = useB ? "B" : "A";

  const handleBarClick = () => {
    if (ctaUrl) window.open(ctaUrl, "_blank", "noopener,noreferrer");
  };

  const handleBarTouchEnd = (e: React.TouchEvent) => {
    if (!ctaUrl) return;
    e.preventDefault();
    handleBarClick();
  };

  return (
    <div
      role={ctaUrl ? "link" : undefined}
      tabIndex={ctaUrl ? 0 : undefined}
      onClick={ctaUrl ? handleBarClick : undefined}
      onTouchEnd={ctaUrl ? handleBarTouchEnd : undefined}
      onKeyDown={(e) => {
        if (ctaUrl && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleBarClick();
        }
      }}
      data-patron-variant={activeVariant}
      aria-label={ctaUrl ? `${patron.patron_name} — ${ctaText ?? "Sprawdź"}` : undefined}
      className={cn(
        "sticky top-16 z-40 w-full h-10 flex items-center justify-center transition-all duration-300 touch-manipulation",
        ctaUrl && "cursor-pointer",
        getStyleClasses(),
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      )}
      style={backgroundStyle}
    >
      <div className="container flex items-center justify-center gap-2 sm:gap-3 px-4 text-sm sm:text-base">
        <Star className="h-4 w-4 flex-shrink-0 fill-current" />

        <span className="font-medium truncate">{patron.prefix_text}</span>

        {patron.patron_logo_url && (
          <img
            src={patron.patron_logo_url}
            alt={patron.patron_name}
            className="h-5 sm:h-6 w-auto object-contain"
          />
        )}

        <span className="font-bold truncate">{patron.patron_name}</span>

        {ctaText && ctaUrl && (
          <span
            className="inline-flex ml-2 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold patron-cta-hover pointer-events-none"
            style={{
              backgroundColor: patron.text_color,
              color: patron.background_color,
            }}
          >
            {ctaText}
          </span>
        )}
      </div>

      {patron.dismissible && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleDismiss();
          }}
          className="absolute right-2 sm:right-4 p-1 rounded-full transition-opacity hover:opacity-70"
          aria-label="Zamknij pasek patrona"
          style={{ color: patron.text_color }}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

import { useState, useEffect, useMemo } from "react";
import { usePatronSettings } from "@/hooks/usePatronSettings";
import { X, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { isTapGesture, wasScrollGesture } from "@/lib/tapGuard";
import { logAdClick } from "@/lib/adClicks";
import { isAdTrackerUrl } from "@/lib/adUrl";

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

  const commonClassName = cn(
    "sticky top-16 z-40 w-full h-10 flex items-center justify-center transition-all duration-300 no-underline",
    ctaUrl && "cursor-pointer",
    getStyleClasses(),
    isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
  );

  const innerContent = (
    <div className="relative w-full flex items-center justify-center gap-2 px-3 sm:px-4">
      <div className="flex items-center gap-2 overflow-hidden min-w-0">
        <Star className="h-3.5 w-3.5 shrink-0 fill-current" />

        <div className="flex items-baseline gap-1.5 overflow-hidden whitespace-nowrap min-w-0">
          <span className="hidden xs:inline text-[10px] font-medium uppercase tracking-tight opacity-70 shrink-0">
            {patron.prefix_text}
          </span>

          {patron.patron_logo_url && (
            <img
              src={patron.patron_logo_url}
              alt={patron.patron_name}
              className="h-4 sm:h-5 w-auto object-contain shrink-0"
            />
          )}

          <span className="text-[12px] sm:text-sm font-bold truncate">
            {patron.patron_name}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {ctaText && ctaUrl && (
          <span
            className="inline-flex px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap pointer-events-none active:scale-95 transition-transform"
            style={{
              backgroundColor: patron.text_color,
              color: patron.background_color,
            }}
          >
            {ctaText}
          </span>
        )}

        {patron.dismissible && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDismiss();
            }}
            onTouchEnd={(e) => {
              if (!isTapGesture()) return;
              e.preventDefault();
              e.stopPropagation();
              handleDismiss();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full opacity-40 hover:opacity-100 transition-opacity"
            aria-label="Zamknij pasek patrona"
            style={{ color: patron.text_color }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  if (ctaUrl) {
    // Always a real <a href>: the partner must be able to see the destination
    // URL in page source (inspect element), and native navigation is the most
    // reliable behaviour on mobile.
    return (
      <a
        href={ctaUrl}
        target="_blank"
        rel="sponsored noopener"
        aria-label={`${patron.patron_name} — ${ctaText ?? "Sprawdź"}`}
        data-patron-variant={activeVariant}
        onClick={(e) => {
          // Only cancel when the interaction was clearly the tail of a scroll.
          if (wasScrollGesture()) {
            e.preventDefault();
            return;
          }
          logAdClick({
            adType: "patron",
            adId: patron.patron_name,
            variant: activeVariant,
            targetUrl: ctaUrl,
          });
        }}
        className={cn(commonClassName, "touch-manipulation")}
        style={backgroundStyle}
      >
        {innerContent}
      </a>
    );
  }



  return (
    <div
      data-patron-variant={activeVariant}
      className={commonClassName}
      style={backgroundStyle}
    >
      {innerContent}
    </div>
  );
};

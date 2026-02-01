import { useState, useEffect } from "react";
import { usePatronSettings } from "@/hooks/usePatronSettings";
import { X, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const SESSION_STORAGE_KEY = "patron_bar_dismissed";

export const PatronBar = () => {
  const { data: patron, isLoading } = usePatronSettings();
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

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

  const handleClick = () => {
    if (patron.cta_url) {
      window.open(patron.cta_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      className={cn(
        "sticky top-16 z-40 w-full h-10 flex items-center justify-center transition-all duration-300",
        getStyleClasses(),
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      )}
      style={backgroundStyle}
    >
      {/* Mobile: entire bar is clickable */}
      <div
        role={patron.cta_url ? "link" : undefined}
        tabIndex={patron.cta_url ? 0 : undefined}
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        className={cn(
          "container flex items-center justify-center gap-2 sm:gap-3 px-4 text-sm sm:text-base",
          patron.cta_url && "cursor-pointer sm:cursor-default"
        )}
      >
        <Star className="h-4 w-4 flex-shrink-0 fill-current" />
        
        <span className="font-medium truncate">
          {patron.prefix_text}
        </span>
        
        {patron.patron_logo_url && (
          <img
            src={patron.patron_logo_url}
            alt={patron.patron_name}
            className="h-5 sm:h-6 w-auto object-contain"
          />
        )}
        
        <span className="font-bold truncate">
          {patron.patron_name}
        </span>
        
        {patron.cta_text && patron.cta_url && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(patron.cta_url, "_blank", "noopener,noreferrer");
            }}
            className="hidden sm:inline-flex ml-2 px-3 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105"
            style={{
              backgroundColor: patron.text_color,
              color: patron.background_color,
            }}
          >
            {patron.cta_text}
          </button>
        )}
      </div>

      {patron.dismissible && (
        <button
          onClick={(e) => {
            e.stopPropagation();
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

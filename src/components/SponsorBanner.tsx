import { useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface SponsorBannerProps {
  title?: string;
  description?: string;
  ctaText: string;
  ctaUrl: string;
  imageDesktopUrl?: string;
  imageMobileUrl?: string;
  impressionTag?: string;
  className?: string;
  // For preview in admin panel
  previewMode?: "desktop" | "mobile";
}

export const SponsorBanner = ({
  title,
  description,
  ctaText,
  ctaUrl,
  imageDesktopUrl,
  imageMobileUrl,
  impressionTag,
  className,
  previewMode,
}: SponsorBannerProps) => {
  const impressionFiredRef = useRef(false);

  // Fire impression tag pixel on first render
  useEffect(() => {
    if (impressionTag && !impressionFiredRef.current && !previewMode) {
      impressionFiredRef.current = true;
      const img = new Image(1, 1);
      img.src = impressionTag;
    }
  }, [impressionTag, previewMode]);

  const hasImages = imageDesktopUrl || imageMobileUrl;

  // Image-based banner with fixed IAB dimensions
  if (hasImages) {
    return (
      <div className={cn("flex justify-center", className)}>
        {/* Impression pixel */}
        {impressionTag && !previewMode && (
          <img
            src={impressionTag}
            alt=""
            width={1}
            height={1}
            className="absolute opacity-0 pointer-events-none"
            aria-hidden="true"
          />
        )}

        {/* Framed banner container */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* Header - Partner label */}
          <div className="bg-muted/50 px-4 py-2 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground">
              Partner Szortsy
            </span>
          </div>

          {/* Banner image slot - fixed dimensions */}
          <a
            href={ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            {/* Desktop slot: 970x250 */}
            <div
              className={cn(
                "relative overflow-hidden bg-muted/30",
                previewMode === "mobile" ? "hidden" : "hidden md:block",
                previewMode === "desktop" && "!block"
              )}
              style={{ width: "970px", height: "250px" }}
            >
              {imageDesktopUrl && (
                <img
                  src={imageDesktopUrl}
                  alt={title || "Reklama"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              )}
              {!imageDesktopUrl && imageMobileUrl && (
                <img
                  src={imageMobileUrl}
                  alt={title || "Reklama"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              )}
            </div>

            {/* Mobile slot: 300x250 */}
            <div
              className={cn(
                "relative overflow-hidden bg-muted/30 mx-auto",
                previewMode === "desktop" ? "hidden" : "block md:hidden",
                previewMode === "mobile" && "!block"
              )}
              style={{ width: "300px", height: "250px" }}
            >
              {imageMobileUrl && (
                <img
                  src={imageMobileUrl}
                  alt={title || "Reklama"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              )}
              {!imageMobileUrl && imageDesktopUrl && (
                <img
                  src={imageDesktopUrl}
                  alt={title || "Reklama"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              )}
            </div>
          </a>

          {/* CTA section - below the banner */}
          {ctaText && (
            <div className="bg-muted/50 px-4 py-3 border-t border-border">
              <a
                href={ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5"
              >
                {ctaText}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Legacy text-based banner (fallback for old usage)
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/10",
        className
      )}
    >
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative flex flex-col items-center gap-6 p-8 text-center md:flex-row md:text-left">
        <div className="flex-1">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">
            Partner Szortsy
          </p>
          {title && (
            <h3 className="font-heading text-xl font-bold text-foreground md:text-2xl">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              {description}
            </p>
          )}
        </div>

        <a
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5"
        >
          {ctaText}
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
};

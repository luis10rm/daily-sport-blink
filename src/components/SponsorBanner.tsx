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
              {imageDesktopUrl ? (
                <img
                  src={imageDesktopUrl}
                  alt={title || "Reklama"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : imageMobileUrl ? (
                <img
                  src={imageMobileUrl}
                  alt={title || "Reklama"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              {/* Fallback when image fails to load */}
              <div className="hidden absolute inset-0 flex items-center justify-center bg-muted/50 text-muted-foreground text-sm">
                Nie udało się wczytać grafiki
              </div>
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
              {imageMobileUrl ? (
                <img
                  src={imageMobileUrl}
                  alt={title || "Reklama"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : imageDesktopUrl ? (
                <img
                  src={imageDesktopUrl}
                  alt={title || "Reklama"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              {/* Fallback when image fails to load */}
              <div className="hidden absolute inset-0 flex items-center justify-center bg-muted/50 text-muted-foreground text-sm">
                Nie udało się wczytać grafiki
              </div>
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

  // Fallback text-based banner - również ze stałymi wymiarami IAB
  return (
    <div className={cn("flex justify-center", className)}>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Header - Partner label */}
        <div className="bg-muted/50 px-4 py-2 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground">
            Partner Szortsy
          </span>
        </div>

        {/* Desktop slot: 970x250 */}
        <a
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "relative overflow-hidden bg-gradient-to-br from-primary/5 via-card to-primary/10 items-center justify-center group",
            previewMode === "mobile" ? "hidden" : "hidden md:flex",
            previewMode === "desktop" && "!flex"
          )}
          style={{ width: "970px", height: "250px" }}
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative text-center p-8">
            {title && (
              <h3 className="font-heading text-2xl font-bold text-foreground mb-2">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-muted-foreground text-base">
                {description}
              </p>
            )}
          </div>
        </a>

        {/* Mobile slot: 300x250 */}
        <a
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "relative overflow-hidden bg-gradient-to-br from-primary/5 via-card to-primary/10 items-center justify-center mx-auto group",
            previewMode === "desktop" ? "hidden" : "flex md:hidden",
            previewMode === "mobile" && "!flex"
          )}
          style={{ width: "300px", height: "250px" }}
        >
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
          <div className="relative text-center p-6">
            {title && (
              <h3 className="font-heading text-lg font-bold text-foreground mb-2">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-muted-foreground text-sm">
                {description}
              </p>
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
};

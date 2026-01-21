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

  // Image-based banner (new style with separate desktop/mobile images)
  if (hasImages) {
    return (
      <div className={cn("relative overflow-hidden rounded-2xl", className)}>
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

        <a
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          {/* Desktop image */}
          {imageDesktopUrl && (
            <img
              src={imageDesktopUrl}
              alt={title || "Reklama"}
              className={cn(
                "w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.02]",
                previewMode === "mobile" ? "hidden" : "hidden md:block",
                previewMode === "desktop" && "!block"
              )}
            />
          )}

          {/* Mobile image */}
          {imageMobileUrl && (
            <img
              src={imageMobileUrl}
              alt={title || "Reklama"}
              className={cn(
                "w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.02]",
                previewMode === "desktop" ? "hidden" : "block md:hidden",
                previewMode === "mobile" && "!block"
              )}
            />
          )}

          {/* Fallback if only one image provided */}
          {imageDesktopUrl && !imageMobileUrl && (
            <img
              src={imageDesktopUrl}
              alt={title || "Reklama"}
              className={cn(
                "w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.02] md:hidden",
                previewMode && "hidden"
              )}
            />
          )}
          {imageMobileUrl && !imageDesktopUrl && (
            <img
              src={imageMobileUrl}
              alt={title || "Reklama"}
              className={cn(
                "w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.02] hidden md:block",
                previewMode && "hidden"
              )}
            />
          )}

          {/* Optional overlay with CTA for image banners */}
          {ctaText && (
            <div className="absolute inset-0 flex items-end justify-end p-4 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg">
                {ctaText}
                <ExternalLink className="h-4 w-4" />
              </span>
            </div>
          )}
        </a>

        {/* Partner label */}
        <div className="absolute top-3 left-3">
          <span className="rounded-md bg-background/80 backdrop-blur-sm px-2 py-1 text-xs font-medium text-muted-foreground">
            Partner Szortsy
          </span>
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

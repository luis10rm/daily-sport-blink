import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWallpaperContext } from "@/contexts/WallpaperContext";
import { wasScrollGesture } from "@/lib/tapGuard";
import { logAdClick } from "@/lib/adClicks";

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
  // Render compact version for inactive slots (placeholder)
  isPlaceholder?: boolean;
  // Banner ID to check against wallpaper's linked banner
  bannerId?: string;
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
  isPlaceholder,
  bannerId,
}: SponsorBannerProps) => {
  const { isTakeoverActive, linkedBannerId } = useWallpaperContext();
  
  // Check if this banner is linked to the active wallpaper campaign
  const isTakeoverMode = isTakeoverActive && bannerId && linkedBannerId === bannerId;
  const impressionFiredRef = useRef(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const [isHiddenByAdBlock, setIsHiddenByAdBlock] = useState(false);
  
  // Ensure ctaUrl is treated as plain string, not template literal
  // This prevents React from misinterpreting DoubleClick macros like ${GDPR}
  const safeCtaUrl = ctaUrl ? String(ctaUrl) : "#";

  // Real <a href>: the partner checks the destination URL in page source.
  // Referrer is deliberately kept so the partner sees szortsy.pl as source.
  const handleClick = (e: React.MouseEvent) => {
    // Only skip when the interaction was clearly the tail of a scroll.
    if (wasScrollGesture() || previewMode || !safeCtaUrl || safeCtaUrl === "#") {
      e.preventDefault();
      return;
    }
    logAdClick({
      adType: "banner",
      adId: bannerId ?? title ?? null,
      targetUrl: safeCtaUrl,
    });
  };

  const linkProps = {
    href: safeCtaUrl,
    target: "_blank",
    rel: "sponsored noopener",
    onClick: handleClick,
  } as const;



  // Fire impression tag pixel on first render
  useEffect(() => {
    if (impressionTag && !impressionFiredRef.current && !previewMode) {
      impressionFiredRef.current = true;
      const img = new Image(1, 1);
      img.src = impressionTag;
    }
  }, [impressionTag, previewMode]);

  // Detect if banner is hidden by AdBlock
  useEffect(() => {
    if (previewMode) return;
    
    const checkVisibility = () => {
      if (bannerRef.current) {
        const rect = bannerRef.current.getBoundingClientRect();
        // AdBlock often sets display:none or height:0
        if (rect.height === 0 || rect.width === 0) {
          setIsHiddenByAdBlock(true);
        }
      }
    };
    
    // Check after small delay (AdBlock may act asynchronously)
    const timer = setTimeout(checkVisibility, 150);
    return () => clearTimeout(timer);
  }, [previewMode]);

  const hasImages = imageDesktopUrl || imageMobileUrl;

  // Compact version for placeholder (no active banner) or AdBlock fallback
  if (isPlaceholder || isHiddenByAdBlock) {
    return (
      <div className={cn("flex justify-center", className)}>
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-muted/50 border border-border shadow-sm">
          <span className="text-xs font-medium text-muted-foreground">
            Partner Szortsy
          </span>
          <span className="text-xs text-muted-foreground/40">·</span>
          <span className="text-xs text-muted-foreground">
            {description || "To miejsce może być Twoje"}
          </span>
          {ctaText && (
            <>
              <span className="text-xs text-muted-foreground/40">·</span>
              <a
                {...linkProps}
                className="text-xs font-semibold text-primary hover:underline underline-offset-2 transition-colors"
              >
                {ctaText}
              </a>
            </>
          )}
        </div>
      </div>
    );
  }

  // TAKEOVER MODE: Borderless banner for wallpaper campaign
  // Renders clean image without frame, bg, or header for visual consistency
  if (isTakeoverMode && hasImages) {
    return (
      <div className={cn("flex flex-col items-center", className)}>
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

        {/* Borderless banner - no bg, no frame */}
        <a
          ref={bannerRef as unknown as React.RefObject<HTMLAnchorElement>}
          {...linkProps}
          className="cursor-pointer group block"
          aria-label={title || "Reklama partnera"}
        >
          {/* Desktop slot: 970x250 - borderless */}
          <div
            className={cn(
              "relative overflow-hidden",
              previewMode === "mobile" ? "hidden" : "hidden md:block",
              previewMode === "desktop" && "!block"
            )}
            style={{ width: "970px", height: "250px" }}
          >
            {imageDesktopUrl && (
              <img
                src={imageDesktopUrl}
                alt={title || "Reklama"}
           className="w-full h-full object-cover card-img-hover"
              />
            )}
          </div>

          {/* Mobile slot: 300x250 - borderless */}
          <div
            className={cn(
              "relative overflow-hidden mx-auto",
              previewMode === "desktop" ? "hidden" : "block md:hidden",
              previewMode === "mobile" && "!block"
            )}
            style={{ width: "300px", height: "250px" }}
          >
            {(imageMobileUrl || imageDesktopUrl) && (
              <img
                src={imageMobileUrl || imageDesktopUrl}
                alt={title || "Reklama"}
                 className="w-full h-full object-cover card-img-hover"
              />
            )}
          </div>
        </a>

        {/* Subtle label below - adapts to wallpaper */}
        <span className="text-xs text-foreground/60 mt-2">
          Reklama{title ? ` · ${title}` : ""}
        </span>
      </div>
    );
  }

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

        {/* Framed banner container - ref for AdBlock detection */}
        <div ref={bannerRef} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* Header - Partner label */}
          <div className="bg-muted/50 px-4 py-2 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground">
              Partner Szortsy
            </span>
          </div>

          {/* Banner image slot - fixed dimensions, real link for partners */}
          <a
            {...linkProps}
            className="block group cursor-pointer"
            aria-label={title || "Reklama partnera"}
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
                   className="w-full h-full object-cover card-img-hover"
                   onError={(e) => {
                     e.currentTarget.style.display = 'none';
                     e.currentTarget.nextElementSibling?.classList.remove('hidden');
                   }}
                 />
              ) : imageMobileUrl ? (
                <img
                  src={imageMobileUrl}
                  alt={title || "Reklama"}
                  className="w-full h-full object-cover card-img-hover"
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
                   className="w-full h-full object-cover card-img-hover"
                   onError={(e) => {
                     e.currentTarget.style.display = 'none';
                     e.currentTarget.nextElementSibling?.classList.remove('hidden');
                   }}
                 />
              ) : imageDesktopUrl ? (
                <img
                  src={imageDesktopUrl}
                  alt={title || "Reklama"}
                  className="w-full h-full object-cover card-img-hover"
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
                {...linkProps}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-colors cta-sponsored-hover"
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
      {/* ref for AdBlock detection */}
      <div ref={bannerRef} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Header - Partner label */}
        <div className="bg-muted/50 px-4 py-2 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground">
            Partner Szortsy
          </span>
        </div>

        {/* Desktop slot: 970x250 */}
        <a
          {...linkProps}
          className={cn(
            "relative overflow-hidden bg-gradient-to-br from-primary/5 via-card to-primary/10 items-center justify-center group cursor-pointer",
            previewMode === "mobile" ? "hidden" : "hidden md:flex",
            previewMode === "desktop" && "!flex"
          )}
          style={{ width: "970px", height: "250px" }}
          aria-label={title || "Reklama partnera"}
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
          {...linkProps}
          className={cn(
            "relative overflow-hidden bg-gradient-to-br from-primary/5 via-card to-primary/10 items-center justify-center mx-auto group cursor-pointer",
            previewMode === "desktop" ? "hidden" : "flex md:hidden",
            previewMode === "mobile" && "!flex"
          )}
          style={{ width: "300px", height: "250px" }}
          aria-label={title || "Reklama partnera"}
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
        </div>

        {/* CTA section - below the banner */}
        {ctaText && (
          <div className="bg-muted/50 px-4 py-3 border-t border-border">
            <button
              onClick={handleClick}
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-colors cta-sponsored-hover"
            >
              {ctaText}
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

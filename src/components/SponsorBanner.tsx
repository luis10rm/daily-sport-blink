import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface SponsorBannerProps {
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl?: string;
  className?: string;
}

export const SponsorBanner = ({
  title,
  description,
  ctaText,
  ctaUrl,
  imageUrl,
  className,
}: SponsorBannerProps) => {
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
        {imageUrl && (
          <div className="flex-shrink-0">
            <img
              src={imageUrl}
              alt="Sponsor"
              className="h-20 w-20 rounded-xl object-contain md:h-24 md:w-24"
            />
          </div>
        )}
        
        <div className="flex-1">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">
            Partner Szortsy
          </p>
          <h3 className="font-heading text-xl font-bold text-foreground md:text-2xl">
            {title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            {description}
          </p>
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

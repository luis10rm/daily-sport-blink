import { ExternalLink, Sparkles } from "lucide-react";
import { SportIcon, SportCategory, getSportLabel } from "./SportIcon";
import { getCategoryImage } from "@/config/categoryImages";
import { cn } from "@/lib/utils";

interface NewsCardProps {
  title: string;
  excerpt: string;
  category: SportCategory;
  publishedAt: string;
  sourceUrl: string;
  imageUrl?: string;
  isSponsored?: boolean;
  tags?: string[];
  className?: string;
  delay?: number;
}

export const NewsCard = ({
  title,
  excerpt,
  category,
  publishedAt,
  sourceUrl,
  imageUrl,
  isSponsored = false,
  tags,
  className,
  delay = 0,
}: NewsCardProps) => {
  const formattedDate = new Date(publishedAt).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-card card-hover opacity-0 animate-fade-in",
        isSponsored ? "border-primary/30 ring-1 ring-primary/20" : "border-border",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Sponsored badge */}
      {isSponsored && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-xs font-medium text-primary-foreground backdrop-blur-sm">
          <Sparkles className="h-3 w-3" />
          Sponsorowane
        </div>
      )}

      {/* Image area */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        <img
          src={getCategoryImage(category, imageUrl)}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SportIcon category={category} className="h-8 w-8" />
              <span className="text-xs font-medium uppercase tracking-wider text-primary">
                {getSportLabel(category)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">{formattedDate}</span>
          </div>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <h3 className="font-heading text-lg font-semibold leading-tight text-foreground line-clamp-2">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {excerpt}
          </p>
        </div>

        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "mt-auto inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
            isSponsored
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg"
              : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
          )}
        >
          Przeczytaj więcej
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
};

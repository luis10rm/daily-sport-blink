import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Sparkles } from "lucide-react";
import { DynamicSportIcon } from "./DynamicSportIcon";
import { AuthorCard } from "./AuthorCard";
import { getPostImage } from "@/config/categoryImages";
import { cn, getSourceName, generateSlug } from "@/lib/utils";
import { PostCategory } from "@/hooks/usePosts";

interface NewsCardProps {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string | null;
  categorySlug?: string;
  sportCategory?: PostCategory | null;
  publishedAt: string;
  sourceUrl: string;
  imageUrl?: string;
  isSponsored?: boolean;
  tags?: string[];
  author?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    slug: string | null;
    role_title: string | null;
  } | null;
  className?: string;
  delay?: number;
  /** Image loading strategy - "eager" for LCP, "lazy" for below-fold */
  loading?: "lazy" | "eager";
  /** Fetch priority for LCP optimization */
  fetchPriority?: "high" | "auto";
  /** Disable fade-in animation for first visible card */
  disableAnimation?: boolean;
}

export const NewsCard = forwardRef<HTMLElement, NewsCardProps>(
  (
    {
      id,
      slug,
      title,
      excerpt,
      content,
      categorySlug,
      sportCategory,
      publishedAt,
      sourceUrl,
      imageUrl,
      isSponsored = false,
      tags,
      author,
      className,
      delay = 0,
      loading = "lazy",
      fetchPriority = "auto",
      disableAnimation = false,
    },
    ref
  ) => {
    // Determine if this post has AI-generated content (link to /blink/:slug)
    const hasContent = Boolean(content);
    const blinkUrl = `/blink/${slug}`;
    
    const formattedDate = new Date(publishedAt).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return (
      <article
        ref={ref}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-xl border bg-card card-hover",
          !disableAnimation && "opacity-0 animate-fade-in",
          isSponsored ? "border-primary/30 ring-1 ring-primary/20" : "border-border",
          className
        )}
        style={!disableAnimation ? { animationDelay: `${delay}ms` } : undefined}
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
            src={getPostImage({
              image_url: imageUrl,
              source_url: sourceUrl,
              tags,
              sport_category: sportCategory,
            })}
            alt={title}
            loading={loading}
            // @ts-ignore - fetchpriority is valid HTML but not in React types
            fetchpriority={fetchPriority}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <DynamicSportIcon sportCategory={sportCategory} fallbackSlug={categorySlug} className="h-8 w-8" />
                <span className="text-xs font-medium uppercase tracking-wider text-primary">
                  {sportCategory?.name || categorySlug || "Inne"}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{formattedDate}</span>
            </div>
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.slice(0, 3).map((tag) => (
                  <Link
                    key={tag}
                    to={`/tag/${generateSlug(tag)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    {tag}
                  </Link>
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

          {author && <AuthorCard author={author} />}

          {/* Conditional link: internal blink page if content exists, otherwise external source */}
          {hasContent ? (
            <Link
              to={blinkUrl}
              className={cn(
                "mt-auto inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
                isSponsored
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg"
                  : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
              )}
            >
              Przeczytaj więcej
            </Link>
          ) : (
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
          )}
          <span className="text-xs text-muted-foreground text-center">
            Źródło: {getSourceName(sourceUrl)}
          </span>
        </div>
      </article>
    );
  }
);

NewsCard.displayName = "NewsCard";

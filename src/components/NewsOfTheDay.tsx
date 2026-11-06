import { OptimizedImage } from "@/components/OptimizedImage";
import { ArrowUpRight, ExternalLink, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { WorldCupBadge } from "./WorldCupBadge";
import { getPostImage } from "@/config/categoryImages";
import { Post } from "@/hooks/usePosts";
import { cn } from "@/lib/utils";
import { fullNewsDate, relativeNewsTime, sportDotClasses } from "@/lib/homeNewsFeed";
import { isWorldCupCategory } from "@/lib/worldCupTheme";
import { Button } from "@/components/ui/button";
import { homeContentType } from "@/lib/homeDayBlock";

interface NewsOfTheDayProps {
  post: Post;
  className?: string;
}

export const NewsOfTheDay = ({ post, className }: NewsOfTheDayProps) => {
  const blinkUrl = `/blink/${post.slug}`;
  const isWorldCup = isWorldCupCategory(post.sport_category?.slug);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-card border border-border bg-card",
        className
      )}
    >
      {/* News of the day badge */}
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-news-of-day px-3 py-1.5 text-sm font-semibold text-news-of-day-foreground ">
        <Trophy className="h-4 w-4" />
        Wiadomość dnia
      </div>

      {/* World Cup 2026 badge */}
      {isWorldCup && (
        <WorldCupBadge size="md" className="absolute right-4 top-4 z-10" />
      )}

      <div className="flex flex-col md:flex-row">
        {/* Image area - LCP optimized */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted md:aspect-auto md:min-h-[320px] md:w-[48%]">
          <OptimizedImage
            src={getPostImage({
              image_url: post.image_url,
              source_url: post.source_url,
              tags: post.tags,
              sport_category: post.sport_category,
            })}
            alt={post.title}
            priority="high"
            sizes="(min-width: 768px) 50vw, 100vw"
            widths={[400, 640, 800, 1200]}
            fallbackWidth={800}
            className="h-full w-full object-cover transition-transform duration-500 card-img-hover"
          />
        </div>

        {/* Content area */}
        <div className="flex flex-1 flex-col gap-4 p-6 md:p-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0 rounded-full", sportDotClasses[post.sport_category?.slug || ""] || "bg-primary")} />
                <span className="text-xs font-medium text-text-secondary">
                  {homeContentType(post) === "briefing" ? "Briefing dnia" : post.sport_category?.name || "Sport"}
                </span>
              </div>
              <time dateTime={post.published_at} title={fullNewsDate(post.published_at)} className="text-sm text-muted-foreground">
                {relativeNewsTime(post.published_at)}
              </time>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <h2 className="font-heading text-2xl font-bold leading-tight text-foreground md:text-2xl">
              {post.title}
            </h2>
            <p className="text-sm leading-relaxed text-text-secondary">
              {post.excerpt}
            </p>
          </div>

          {post.author?.display_name && <span className="text-sm font-medium text-text-secondary">{post.author.display_name}</span>}

          <Button asChild className="mt-auto w-fit rounded-control touch-manipulation">
            {post.content ? (
              <Link to={blinkUrl}>Czytaj więcej <ArrowUpRight /></Link>
            ) : (
              <a href={post.source_url} target="_blank" rel="noopener noreferrer">
                Czytaj więcej <ExternalLink />
              </a>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
};

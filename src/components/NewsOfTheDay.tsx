import { ExternalLink, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { DynamicSportIcon } from "./DynamicSportIcon";
import { AuthorCard } from "./AuthorCard";
import { getPostImage } from "@/config/categoryImages";
import { Post } from "@/hooks/usePosts";
import { cn, getSourceName, generateSlug } from "@/lib/utils";

interface NewsOfTheDayProps {
  post: Post;
  className?: string;
}

export const NewsOfTheDay = ({ post, className }: NewsOfTheDayProps) => {
  const formattedDate = new Date(post.published_at).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border-2 border-news-of-day bg-card",
        "ring-4 ring-news-of-day/20",
        className
      )}
    >
      {/* News of the day badge */}
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-news-of-day px-3 py-1.5 text-sm font-semibold text-news-of-day-foreground shadow-lg">
        <Trophy className="h-4 w-4" />
        Wiadomość dnia
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Image area - LCP optimized */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted md:aspect-auto md:w-1/2">
          <img
            src={getPostImage({
              image_url: post.image_url,
              source_url: post.source_url,
              tags: post.tags,
              sport_category: post.sport_category,
            })}
            alt={post.title}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 card-img-hover"
          />
        </div>

        {/* Content area */}
        <div className="flex flex-1 flex-col gap-4 p-6 md:p-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <DynamicSportIcon sportCategory={post.sport_category} fallbackSlug={post.sport_category?.slug} className="h-10 w-10" />
                <span className="text-sm font-medium uppercase tracking-wider text-primary">
                  {post.sport_category?.name || "Inne"}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">{formattedDate}</span>
            </div>
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/tag/${generateSlug(tag)}`}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors tag-hover"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <h2 className="font-heading text-2xl font-bold leading-tight text-foreground md:text-3xl">
              {post.title}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              {post.excerpt}
            </p>
          </div>

          {post.author && <AuthorCard author={post.author} />}

          {post.content ? (
            <button
              onClick={() => { window.location.href = `/blink/${post.slug}`; }}
              type="button"
              className="mt-auto inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-news-of-day px-6 py-3 text-base font-semibold text-news-of-day-foreground shadow-md transition-colors cursor-pointer cta-notd-hover"
            >
              Przeczytaj więcej
            </button>
          ) : (
            <button
              onClick={() => { window.open(post.source_url, '_blank', 'noopener,noreferrer'); }}
              type="button"
              className="mt-auto inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-news-of-day px-6 py-3 text-base font-semibold text-news-of-day-foreground shadow-md transition-colors cursor-pointer cta-notd-hover"
            >
              Przeczytaj więcej
              <ExternalLink className="h-5 w-5" />
            </button>
          )}
          <span className="text-sm text-muted-foreground mt-2">
            Źródło: {getSourceName(post.source_url)}
          </span>
        </div>
      </div>
    </article>
  );
};

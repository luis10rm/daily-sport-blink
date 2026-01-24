import { ExternalLink, Trophy } from "lucide-react";
import { DynamicSportIcon } from "./DynamicSportIcon";
import { getCategoryImage } from "@/config/categoryImages";
import { Post } from "@/hooks/usePosts";
import { cn } from "@/lib/utils";

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
        "group relative overflow-hidden rounded-2xl border-2 border-news-of-day bg-card opacity-0 animate-fade-in",
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
        {/* Image area */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted md:aspect-auto md:w-1/2">
          <img
            src={getCategoryImage(post.category, post.image_url || undefined)}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Content area */}
        <div className="flex flex-1 flex-col gap-4 p-6 md:p-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <DynamicSportIcon sportCategory={post.sport_category} fallbackSlug={post.category} className="h-10 w-10" />
                <span className="text-sm font-medium uppercase tracking-wider text-primary">
                  {post.sport_category?.name || post.category}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">{formattedDate}</span>
            </div>
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
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

          <a
            href={post.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-news-of-day px-6 py-3 text-base font-semibold text-news-of-day-foreground shadow-md transition-all hover:shadow-lg hover:brightness-110"
          >
            Przeczytaj więcej
            <ExternalLink className="h-5 w-5" />
          </a>
        </div>
      </div>
    </article>
  );
};

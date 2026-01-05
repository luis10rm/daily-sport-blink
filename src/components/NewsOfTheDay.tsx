import { ExternalLink, Trophy } from "lucide-react";
import { SportIcon, getSportLabel } from "./SportIcon";
import { Post } from "@/data/samplePosts";
import { cn } from "@/lib/utils";

interface NewsOfTheDayProps {
  post: Post;
  className?: string;
}

export const NewsOfTheDay = ({ post, className }: NewsOfTheDayProps) => {
  const formattedDate = new Date(post.publishedAt).toLocaleDateString("pl-PL", {
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
          {post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <SportIcon category={post.category} className="h-24 w-24 opacity-30" />
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="flex flex-1 flex-col gap-4 p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SportIcon category={post.category} className="h-10 w-10" />
              <span className="text-sm font-medium uppercase tracking-wider text-primary">
                {getSportLabel(post.category)}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">{formattedDate}</span>
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
            href={post.sourceUrl}
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

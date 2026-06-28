import { Link } from "react-router-dom";
import type { Review } from "@/hooks/useReviews";
import { ScoreBadge } from "./ScoreBadge";

interface Props {
  review: Review;
  variant?: "default" | "hero" | "compact";
}

export const ReviewCard = ({ review, variant = "default" }: Props) => {
  const to = `/recki/${review.category?.slug ?? "wszystkie"}/${review.slug}`;

  if (variant === "hero") {
    return (
      <Link
        to={to}
        className="group relative block overflow-hidden rounded-2xl border border-border bg-card shadow-md transition-all hover:shadow-xl"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {review.cover_image_url ? (
            <img
              src={review.cover_image_url}
              alt={review.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20" />
          )}
          {review.score !== null && (
            <div className="absolute right-4 top-4">
              <ScoreBadge score={review.score} size="lg" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5">
            {review.category && (
              <span className="inline-block rounded-full bg-purple-500/90 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                {review.category.name}
              </span>
            )}
            <h2 className="mt-2 text-2xl font-bold leading-tight text-white">
              {review.title}
            </h2>
            {review.excerpt && (
              <p className="mt-1 line-clamp-2 text-sm text-white/85">{review.excerpt}</p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link
        to={to}
        className="group flex items-center gap-3 rounded-lg border border-border bg-card p-2 transition-colors hover:bg-muted/50"
      >
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
          {review.cover_image_url && (
            <img src={review.cover_image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
            {review.title}
          </h3>
          {review.category && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{review.category.name}</p>
          )}
        </div>
        <ScoreBadge score={review.score} size="sm" />
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className="group relative block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {review.cover_image_url ? (
          <img
            src={review.cover_image_url}
            alt={review.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20" />
        )}
        {review.score !== null && (
          <div className="absolute right-3 top-3">
            <ScoreBadge score={review.score} size="md" />
          </div>
        )}
      </div>
      <div className="p-4">
        {review.category && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-300">
            {review.category.name}
          </span>
        )}
        <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-snug text-foreground group-hover:text-primary">
          {review.title}
        </h3>
        {review.excerpt && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{review.excerpt}</p>
        )}
      </div>
    </Link>
  );
};

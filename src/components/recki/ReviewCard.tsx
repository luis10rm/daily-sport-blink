import { Link } from "react-router-dom";
import type { Review } from "@/hooks/useReviews";
import { ScoreBadge } from "./ScoreBadge";

interface Props {
  review: Review;
  variant?: "default" | "hero" | "compact";
}

export const ReviewCard = ({ review, variant = "default" }: Props) => {
  const to = `/tech/${review.category?.slug ?? "wszystkie"}/${review.slug}`;

  if (variant === "hero") {
    return (
      <Link
        to={to}
        className="group relative block h-full min-h-[480px] aspect-[16/10] lg:aspect-auto overflow-hidden rounded-2xl border border-border bg-card shadow-md transition-all hover:shadow-xl"
      >
        {review.cover_image_url ? (
          <img
            src={review.cover_image_url}
            alt={review.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/30 to-pink-600/30" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

        {review.score !== null && (
          <div className="absolute right-4 top-4">
            <ScoreBadge score={review.score} size="lg" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
          {review.category && (
            <span className="inline-block w-fit rounded-full bg-fuchsia-600/95 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
              {review.category.name}
            </span>
          )}
          <h2 className="mt-2 text-2xl md:text-3xl font-bold leading-tight text-white drop-shadow-md">
            {review.title}
          </h2>
          {review.excerpt && (
            <p className="mt-2 line-clamp-2 text-sm text-white/85 max-w-2xl">{review.excerpt}</p>
          )}
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
          <div className="h-full w-full bg-gradient-to-br from-fuchsia-600/20 to-pink-600/20" />
        )}
        {review.score !== null && (
          <div className="absolute right-3 top-3">
            <ScoreBadge score={review.score} size="md" />
          </div>
        )}
      </div>
      <div className="p-4">
        {review.category && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-fuchsia-600 dark:text-fuchsia-300">
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

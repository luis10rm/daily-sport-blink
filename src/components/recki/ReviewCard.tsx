import { ArrowRight } from "lucide-react";
import type { Review } from "@/hooks/useReviews";
import { useNavLink } from "@/hooks/useNavLink";
import { ScoreBadge } from "./ScoreBadge";

interface Props {
  review: Review;
  variant?: "default" | "hero" | "compact";
}

export const ReviewCard = ({ review, variant = "default" }: Props) => {
  const navLink = useNavLink();
  const to = `/tech/${review.category?.slug ?? "wszystkie"}/${review.slug}`;

  if (variant === "hero") {
    return (
      <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-md transition-shadow hover:shadow-xl">
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {review.cover_image_url ? (
            <img
              src={review.cover_image_url}
              alt={review.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-fuchsia-600/30 to-pink-600/30" />
          )}
          {review.score !== null && (
            <div className="absolute right-4 top-4">
              <ScoreBadge score={review.score} size="lg" />
            </div>
          )}
        </div>
        <div className="flex flex-col p-5 md:p-6">
          {review.category && (
            <span className="inline-block w-fit rounded-full bg-fuchsia-600/95 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
              {review.category.name}
            </span>
          )}
          <h2 className="mt-2 text-2xl md:text-3xl font-bold leading-tight text-foreground">
            {review.title}
          </h2>
          {review.excerpt && (
            <p className="mt-2 line-clamp-3 text-sm md:text-base text-muted-foreground">{review.excerpt}</p>
          )}
          <div className="mt-4 flex justify-end">
            <a
              {...navLink(to)}
              className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-600 px-5 py-2.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-fuchsia-700"
            >
              Czytaj więcej <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="flex items-center gap-3 rounded-lg border border-border bg-card p-2 transition-colors hover:bg-muted/30">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
          {review.cover_image_url && (
            <img src={review.cover_image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {review.title}
          </h3>
          <a
            {...navLink(to)}
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-fuchsia-600 hover:text-fuchsia-700 dark:text-fuchsia-300"
          >
            Czytaj <ArrowRight className="h-3 w-3" />
          </a>
        </div>
        <ScoreBadge score={review.score} size="sm" />
      </article>
    );
  }

  return (
    <article className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg">
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {review.cover_image_url ? (
          <img
            src={review.cover_image_url}
            alt={review.title}
            className="h-full w-full object-cover"
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
      <div className="flex flex-1 flex-col p-4">
        {review.category && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-fuchsia-600 dark:text-fuchsia-300">
            {review.category.name}
          </span>
        )}
        <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-snug text-foreground">
          {review.title}
        </h3>
        {review.excerpt && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{review.excerpt}</p>
        )}
        <div className="mt-3 pt-1">
          <a
            {...navLink(to)}
            className="inline-flex items-center gap-1.5 rounded-md border border-fuchsia-600/40 px-3 py-1.5 text-xs font-semibold text-fuchsia-600 transition-colors hover:bg-fuchsia-600 hover:text-white dark:text-fuchsia-300 dark:hover:text-white"
          >
            Czytaj więcej <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
};

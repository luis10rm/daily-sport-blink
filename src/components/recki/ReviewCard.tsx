import { ArrowRight, Flame } from "lucide-react";
import { useNavigate } from "@/lib/router-compat";
import type { Review } from "@/hooks/useReviews";
import { ScoreBadge } from "./ScoreBadge";
import { cn } from "@/lib/utils";

interface Props {
  review: Review;
  variant?: "default" | "hero" | "compact" | "mini";
}

/**
 * Tech cards: only the "Czytaj więcej" CTA navigates. We deliberately do NOT use
 * onTouchEnd here — a plain onClick fires only on a real tap (touchstart + touchend
 * on the same element), so scrolling with a finger over the card never navigates.
 */
const useReadMoreLink = () => {
  const navigate = useNavigate();
  return (to: string) => ({
    href: to,
    onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      e.preventDefault();
      navigate(to);
    },
  });
};

const ctaBase =
  "touch-manipulation inline-flex min-h-11 items-center justify-center gap-1.5 text-sm font-semibold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const ctaFilled = "rounded-full bg-fuchsia-600 px-5 text-white shadow-sm hover:bg-fuchsia-700";

const ctaOutline =
  "rounded-lg border border-fuchsia-600/40 px-4 text-fuchsia-600 hover:bg-fuchsia-600 hover:text-white dark:text-fuchsia-300 dark:hover:text-white";

const arrow = "h-4 w-4 transition-transform [@media(hover:hover)]:group-hover/cta:translate-x-0.5";

export const ReviewCard = ({ review, variant = "default" }: Props) => {
  const readMore = useReadMoreLink();
  const to = `/tech/${review.category?.slug ?? "wszystkie"}/${review.slug}`;
  const ctaLabel = `Czytaj więcej: ${review.title}`;

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
          <div className="flex flex-wrap items-center gap-2">
            {review.is_topic_of_day && (
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-600 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                <Flame className="h-3 w-3" /> Temat dnia
              </span>
            )}
            {review.category && (
              <span className="inline-block w-fit rounded-full bg-fuchsia-600/95 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                {review.category.name}
              </span>
            )}
          </div>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold leading-tight text-foreground">
            {review.title}
          </h2>
          {review.excerpt && (
            <p className="mt-2 line-clamp-3 text-sm md:text-base text-muted-foreground">{review.excerpt}</p>
          )}
          <div className="mt-4 flex justify-stretch sm:justify-end">
            <a
              {...readMore(to)}
              aria-label={ctaLabel}
              className={cn("group/cta w-full sm:w-auto", ctaBase, ctaFilled, "text-base")}
            >
              Czytaj więcej <ArrowRight className={arrow} />
            </a>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="flex items-center gap-3 rounded-lg border border-border bg-card p-2">
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
            {...readMore(to)}
            aria-label={ctaLabel}
            className={cn("group/cta mt-1 w-full", ctaBase, ctaOutline)}
          >
            Czytaj więcej <ArrowRight className={arrow} />
          </a>
        </div>
        <ScoreBadge score={review.score} size="sm" />
      </article>
    );
  }

  if (variant === "mini") {
    return (
      <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow [@media(hover:hover)]:hover:shadow-md">
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {review.cover_image_url ? (
            <img
              src={review.cover_image_url}
              alt={review.title}
              className="h-full w-full object-cover transition-transform duration-300 [@media(hover:hover)]:group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-fuchsia-600/20 to-pink-600/20" />
          )}
          {review.score !== null && (
            <div className="absolute right-2 top-2">
              <ScoreBadge score={review.score} size="sm" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-3">
          {review.category && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-fuchsia-600 dark:text-fuchsia-300">
              {review.category.name}
            </span>
          )}
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {review.title}
          </h3>
          <a
            {...readMore(to)}
            aria-label={ctaLabel}
            className={cn("group/cta mt-3 w-full", ctaBase, ctaOutline)}
          >
            Czytaj więcej <ArrowRight className={arrow} />
          </a>
        </div>
      </article>
    );
  }

  return (
    <article className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow [@media(hover:hover)]:hover:shadow-lg">
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
        <a
          {...readMore(to)}
          aria-label={ctaLabel}
          className={cn("group/cta mt-3 w-full sm:w-auto sm:self-start", ctaBase, ctaOutline)}
        >
          Czytaj więcej <ArrowRight className={arrow} />
        </a>
      </div>
    </article>
  );
};

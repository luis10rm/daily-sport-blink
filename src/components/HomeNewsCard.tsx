import { forwardRef } from "react";
import { Link } from "react-router-dom";
import type { Post } from "@/hooks/usePosts";
import { OptimizedImage } from "@/components/OptimizedImage";
import { getPostImage } from "@/config/categoryImages";
import { homeContentType } from "@/lib/homeDayBlock";
import { relativeNewsTime, sportDotClasses } from "@/lib/homeNewsFeed";
import { cn } from "@/lib/utils";

export const HomeNewsCard = forwardRef<HTMLElement, { post: Post }>(({ post }, ref) => {
  const briefing = homeContentType(post) === "briefing";
  const fullDate = new Date(post.published_at).toLocaleString("pl-PL", { dateStyle: "long", timeStyle: "short" });
  const content = <>
    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-control bg-muted sm:h-[170px] sm:w-full sm:rounded-none">
      <OptimizedImage src={getPostImage(post)} alt="" widths={[160, 320, 480, 640]} fallbackWidth={480}
        sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 96px" className="h-full w-full object-cover" />
      {post.is_sponsored && <span className="absolute left-2 top-2 rounded-chip bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">Sponsorowane</span>}
    </div>
    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", briefing ? "bg-primary" : sportDotClasses[post.sport_category?.slug || ""] || "bg-sport-other")} />
          {briefing ? "Podsumowanie dnia" : post.sport_category?.name || "Inne"}
        </span>
        <time dateTime={post.published_at} title={fullDate} className="text-text-muted sm:hidden">{relativeNewsTime(post.published_at)}</time>
      </div>
      <h3 className="line-clamp-3 break-words text-sm font-bold leading-snug text-foreground transition-colors [@media(hover:hover)]:group-hover:text-link sm:text-base">{post.title}</h3>
      <div className="mt-auto hidden flex-wrap items-center justify-between gap-2 pt-2 text-xs text-text-muted sm:flex">
        <span>{post.author?.display_name || "Redakcja"}</span>
        <time dateTime={post.published_at} title={fullDate}>{relativeNewsTime(post.published_at)}</time>
      </div>
    </div>
  </>;
  const className = "group flex h-full min-w-0 items-start gap-3 rounded-card border border-border bg-card p-3 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-col sm:gap-0 sm:overflow-hidden sm:p-0";
  return <article ref={ref} data-home-news-card data-category-id={post.category_id}>
    {post.content ? <Link to={`/blink/${post.slug}`} className={className}>{content}</Link>
      : <a href={post.source_url} target="_blank" rel={post.is_sponsored ? "sponsored noopener" : "noopener noreferrer"} className={className}>{content}</a>}
  </article>;
});
HomeNewsCard.displayName = "HomeNewsCard";
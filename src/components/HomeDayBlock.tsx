import { ArrowRight, Check, Clock3, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NewsOfTheDay } from "@/components/NewsOfTheDay";
import { OptimizedImage } from "@/components/OptimizedImage";
import { getPostImage } from "@/config/categoryImages";
import type { Post } from "@/hooks/usePosts";
import { newsCountLabel, selectHomeDayContent } from "@/lib/homeDayBlock";
import { cn } from "@/lib/utils";
import { fullNewsDate, relativeNewsTime } from "@/lib/homeNewsFeed";

const categoryDots: Record<string, string> = {
  "pilka-nozna": "bg-sport-football", tenis: "bg-sport-tennis", siatkowka: "bg-sport-volleyball",
  koszykowka: "bg-sport-basketball", motorsport: "bg-sport-motorsport", "sporty-zimowe": "bg-sport-winter",
};

function SmallDayNews({ post }: { post: Post }) {
  const time = <time dateTime={post.published_at} title={fullNewsDate(post.published_at)}>{relativeNewsTime(post.published_at)}</time>;
  const content = <>
    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-control bg-muted">
      <OptimizedImage src={getPostImage(post)} alt={post.title} widths={[160, 240, 320]} fallbackWidth={240} sizes="96px" className="h-full w-full object-cover" />
    </div>
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <span className="flex items-center gap-1.5 text-xs text-text-secondary">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", categoryDots[post.sport_category?.slug || ""] || "bg-primary")} />
        {post.sport_category?.name || "Sport"}
      </span>
      <h3 className="break-words text-sm font-semibold leading-snug text-foreground">{post.title}</h3>
      <span className="mt-auto flex items-center gap-1 text-xs text-text-muted"><Clock3 className="h-3 w-3" />{time}</span>
    </div>
  </>;
  const className = "flex h-full items-start gap-3 rounded-card border border-border bg-card p-3 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return <article>{post.content
    ? <Link to={`/blink/${post.slug}`} className={className}>{content}</Link>
    : <a href={post.source_url} target="_blank" rel="noopener noreferrer" className={className}>{content}</a>}
  </article>;
}

interface HomeDayBlockProps {
  posts: Post[];
  todaysPosts: Post[];
  featured?: Post | null;
  isLoading?: boolean;
  className?: string;
}

export function HomeDayBlock({ posts, todaysPosts, featured, isLoading, className }: HomeDayBlockProps) {
  const { briefing, lead, secondary, topics } = selectHomeDayContent(posts, todaysPosts, featured);
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const date = `${day}.${month}`;
  const longDate = today.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" });
  const dayUrl = `/dzien/${today.getFullYear()}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const briefingUrl = dayUrl;
  const title = briefing?.title || "Najważniejsze wydarzenia dnia";
  const count = todaysPosts.length;

  if (isLoading) return <section aria-label="Wydarzenia dnia" className={cn("grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.65fr)]", className)}>
    <Skeleton className="h-28 rounded-block lg:h-[470px]" /><Skeleton className="h-[400px] rounded-card lg:h-[470px]" />
  </section>;

  return <section aria-label="Wydarzenia dnia" className={cn("grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.65fr)]", className)}>
    <article data-content-type="briefing" className="min-w-0 rounded-block border border-briefing-border bg-briefing">
      <Link to={briefingUrl} className="flex items-center gap-4 p-4 touch-manipulation lg:hidden">
        <span className="shrink-0 text-[44px] font-extrabold leading-none text-briefing-date">{date}</span>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-link">Briefing dnia · {count} {newsCountLabel(count)}</span>
          <h2 className="mt-1 break-words text-sm font-bold leading-snug">{title}</h2>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-link" />
      </Link>
      <div className="hidden h-full flex-col justify-center p-6 lg:flex">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-chip border border-briefing-border px-2.5 py-1 text-xs font-semibold text-link">Briefing dnia</span>
          <span className="text-xs capitalize text-text-secondary">{longDate}</span>
        </div>
        <span className={cn("my-3 font-extrabold leading-none text-briefing-date", day >= 10 ? "text-[84px] xl:text-[96px]" : "text-[96px] xl:text-[110px]")}>{date}</span>
        <h2 className="break-words text-xl font-bold leading-tight">{title}</h2>
        {topics.length > 0 ? <ul className="mt-4 space-y-2.5">
          {topics.map(topic => <li key={topic} className="flex items-start gap-2 text-sm leading-snug text-text-secondary">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-link" /><span>{topic}</span>
          </li>)}
        </ul> : <p className="mt-4 text-sm text-text-secondary">Briefing pojawi się na koniec dnia.</p>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-briefing-border pt-4">
          <span className="text-xs text-text-secondary"><strong className="text-base text-foreground">{count}</strong> {newsCountLabel(count)}</span>
          <Button asChild className="h-11 rounded-control touch-manipulation"><Link to={briefingUrl}>Czytaj briefing <ArrowRight /></Link></Button>
        </div>
      </div>
    </article>
    <div className="flex min-w-0 flex-col gap-4">
      {lead ? <NewsOfTheDay post={lead} className="flex-1" /> : <div className="flex min-h-48 items-center justify-center gap-2 text-text-muted"><Newspaper className="h-5 w-5" />Wiadomości pojawią się tutaj wkrótce.</div>}
      {secondary.length > 0 && <div className="grid gap-3 xl:grid-cols-2">
        {secondary.map(post => <SmallDayNews key={post.id} post={post} />)}
      </div>}
    </div>
  </section>;
}
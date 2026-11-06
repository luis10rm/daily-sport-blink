import { ArrowRight, Clock3, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NewsOfTheDay } from "@/components/NewsOfTheDay";
import { OptimizedImage } from "@/components/OptimizedImage";
import { getPostImage } from "@/config/categoryImages";
import type { Post } from "@/hooks/usePosts";
import { briefingTimeline, selectHomeDayContent } from "@/lib/homeDayBlock";

const clock = (iso: string) => new Date(iso).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
const newsWord = (n: number) => n === 1 ? "news"
  : n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14) ? "newsy" : "newsów";
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
  const { lead, secondary } = selectHomeDayContent(posts, todaysPosts, featured);
  const timeline = briefingTimeline(todaysPosts);
  const latest = [...todaysPosts].sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))[0];
  const lastTime = latest ? clock(latest.published_at) : null;
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const date = `${day}.${month}`;
  const longDate = today.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" });
  const dayUrl = `/dzien/${today.getFullYear()}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const briefingUrl = dayUrl;
  const count = todaysPosts.length;

  if (isLoading) return <section aria-label="Wydarzenia dnia" className={cn("grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.65fr)]", className)}>
    <Skeleton className="h-28 rounded-block lg:h-[470px]" /><Skeleton className="h-[400px] rounded-card lg:h-[470px]" />
  </section>;

  return <section aria-label="Wydarzenia dnia" className={cn("grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.65fr)]", className)}>
    <article data-content-type="briefing" className="min-w-0 rounded-block border border-briefing-border bg-briefing">
      <Link to={briefingUrl} className="flex items-center gap-4 p-4 touch-manipulation lg:hidden">
        <span className="shrink-0 text-[44px] font-extrabold leading-none text-briefing-date">{date}</span>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-link">Briefing dnia</span>
          <p className="mt-1 text-sm font-bold leading-snug">{count} {newsWord(count)} dziś{lastTime && <> · ostatni o {lastTime}</>}</p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-link" />
      </Link>
      <div className="hidden h-full flex-col justify-center p-6 lg:flex">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-chip border border-briefing-border px-2.5 py-1 text-xs font-semibold text-link">Briefing dnia</span>
          <span className="text-xs capitalize text-text-secondary">{longDate}</span>
        </div>
        <span className={cn("my-3 font-extrabold leading-none text-briefing-date", day >= 10 ? "text-[84px] xl:text-[96px]" : "text-[96px] xl:text-[110px]")}>{date}</span>
        <h2 className="sr-only">Briefing dnia — oś czasu dzisiejszych newsów</h2>
        {timeline.length > 0 ? <ol className="relative mt-2 space-y-3">
          <span aria-hidden="true" className="absolute bottom-1.5 left-[54px] top-1.5 w-px bg-briefing-border" />
          {timeline.map(post => <li key={post.id}>
            <Link to={`/blink/${post.slug}`} title={post.title} className="flex items-center gap-3 text-sm touch-manipulation [@media(hover:hover)]:hover:text-link">
              <time dateTime={post.published_at} title={fullNewsDate(post.published_at)} className="w-10 shrink-0 text-right font-mono text-xs text-text-secondary">{clock(post.published_at)}</time>
              <span aria-hidden="true" className="relative z-10 h-2.5 w-2.5 shrink-0 rounded-full bg-primary ring-4 ring-briefing" />
              <span className="min-w-0 flex-1 truncate font-medium">{post.title}</span>
            </Link>
          </li>)}
        </ol> : <p className="mt-2 text-sm text-text-secondary">Dzisiaj jeszcze nie dodaliśmy newsów.</p>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-briefing-border pt-4">
          <span className="text-xs text-text-secondary"><strong className="text-base text-foreground">{count}</strong> {newsWord(count)} dziś{lastTime && <> · ostatni o {lastTime}</>}</span>
          <Button asChild className="h-11 rounded-control touch-manipulation"><Link to={briefingUrl}>Otwórz briefing <ArrowRight /></Link></Button>
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
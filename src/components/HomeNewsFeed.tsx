import { useState, type ReactNode } from "react";
import type { Post } from "@/hooks/usePosts";
import { usePostsFeed } from "@/hooks/usePosts";
import { useSportCategories } from "@/hooks/useSportCategories";
import { HomeNewsCard } from "@/components/HomeNewsCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { filterHomeNews, splitHomeNews } from "@/lib/homeNewsFeed";

const primarySports = ["football", "tennis", "siatkowka", "basketball", "motorsport", "sporty-zimowe"];
const gridClass = "grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3";
const continuationGridClass = `${gridClass} mt-3 sm:mt-4`;

const newsWord = (n: number) => {
  const mod10 = n % 10, mod100 = n % 100;
  if (n === 1) return "news";
  return mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "newsy" : "newsów";
};

interface HomeNewsFeedProps {
  todaysPosts: Post[];
  afterSixth: ReactNode;
}

export function HomeNewsFeed({ todaysPosts, afterSixth }: HomeNewsFeedProps) {
  const [categoryId, setCategoryId] = useState("all");
  const { data: categories = [] } = useSportCategories();
  const { data: posts = [], isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = usePostsFeed(categoryId);
  const orderedCategories = [...categories].sort((a, b) => {
    const aIndex = primarySports.indexOf(a.slug);
    const bIndex = primarySports.indexOf(b.slug);
    return (aIndex < 0 ? primarySports.length + a.sort_order : aIndex) - (bIndex < 0 ? primarySports.length + b.sort_order : bIndex);
  });
  const { today, earlier } = splitHomeNews(posts);
  const todayCount = filterHomeNews(todaysPosts, categoryId).filter(post => !post.is_sponsored).length;
  const remainingToday = Math.max(0, todayCount - today.filter(post => !post.is_sponsored).length);
  const hasMoreThanSix = today.length + earlier.length > 6;

  const cards = (items: Post[], continuation = false) => items.length > 0
    ? <div className={continuation ? continuationGridClass : gridClass}>{items.map(post => <HomeNewsCard key={post.id} post={post} />)}</div>
    : null;

  return <section aria-labelledby="home-news-heading">
    <div className="mb-4 flex items-baseline gap-3">
      <h2 id="home-news-heading" className="text-2xl font-bold">Dziś</h2>
      <span aria-live="polite" className="text-sm text-text-muted">{isLoading ? "…" : todayCount} newsów</span>
    </div>
    <div role="group" aria-label="Filtruj newsy według dyscypliny" className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {[{ id: "all", name: "Wszystko" }, ...orderedCategories].map(category =>
        <Button key={category.id} variant={categoryId === category.id ? "default" : "outline"}
          aria-pressed={categoryId === category.id} onClick={() => setCategoryId(category.id)}
          className="h-11 shrink-0 rounded-chip px-4 text-xs touch-manipulation">{category.name}</Button>)}
    </div>
    {isLoading ? <div className={gridClass}>{Array.from({ length: 12 }, (_, index) => <Skeleton key={index} className="h-28 rounded-card sm:h-[300px]" />)}</div>
      : <>
        {todayCount === 0 && <p role="status" className="py-8 text-sm leading-relaxed text-text-secondary">
          {categoryId === "all" ? "Dziś nie mamy jeszcze newsów." : "Dziś nie mamy jeszcze newsów z tej dyscypliny. Wybierz „Wszystko”, żeby zobaczyć pozostałe."}
        </p>}
        {today.length >= 6 ? <>
          {cards(today.slice(0, 6))}
          {hasMoreThanSix && afterSixth}
          {cards(today.slice(6), true)}
          {earlier.length > 0 && <div className="mt-8">
            <h2 className="mb-4 text-xl font-bold">Z ostatnich 7 dni</h2>
            {cards(earlier)}
          </div>}
        </> : <>
          {cards(today)}
          {earlier.length > 0 && <div className="mt-8">
            <h2 className="mb-4 text-xl font-bold">Z ostatnich 7 dni</h2>
            {cards(earlier.slice(0, 6 - today.length))}
            {hasMoreThanSix && afterSixth}
            {cards(earlier.slice(6 - today.length), true)}
          </div>}
        </>}
        {hasNextPage && <div className="mt-10 flex flex-col items-center gap-4 rounded-block border border-briefing-border bg-briefing px-6 py-8 text-center sm:py-10">
          {remainingToday > 0 && <>
            <span className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Pozostałe newsy dzisiaj</span>
            <p className="text-2xl font-extrabold sm:text-3xl">
              Czeka jeszcze <span className="text-5xl text-primary sm:text-6xl">{remainingToday}</span> {newsWord(remainingToday)}
            </p>
          </>}
          <Button size="lg" onClick={() => void fetchNextPage()} disabled={isFetchingNextPage} className="h-14 w-full max-w-sm rounded-control px-8 text-base font-bold touch-manipulation">
            {isFetchingNextPage ? "Ładowanie…" : remainingToday > 0 ? `Pokaż kolejne ${Math.min(remainingToday, 12)}` : "Pokaż starsze newsy"}
          </Button>
        </div>}
      </>}
  </section>;
}

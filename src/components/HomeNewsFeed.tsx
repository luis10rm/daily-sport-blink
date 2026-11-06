import { useState, type RefObject } from "react";
import type { Post } from "@/hooks/usePosts";
import { useSportCategories } from "@/hooks/useSportCategories";
import { HomeNewsCard } from "@/components/HomeNewsCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { filterHomeNews, splitHomeNews } from "@/lib/homeNewsFeed";

const primarySports = ["pilka-nozna", "tenis", "siatkowka", "koszykowka", "motorsport", "sporty-zimowe"];
const gridClass = "grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4";

export function HomeNewsFeed({ posts, isLoading, lastTodayRef }: { posts: Post[]; isLoading: boolean; lastTodayRef: RefObject<HTMLElement> }) {
  const [categoryId, setCategoryId] = useState("all");
  const { data: categories = [] } = useSportCategories();
  const orderedCategories = [...categories].sort((a, b) => {
    const aIndex = primarySports.indexOf(a.slug);
    const bIndex = primarySports.indexOf(b.slug);
    return (aIndex < 0 ? primarySports.length + a.sort_order : aIndex) - (bIndex < 0 ? primarySports.length + b.sort_order : bIndex);
  });
  const { today, earlier } = splitHomeNews(filterHomeNews(posts, categoryId));
  const todayCount = today.filter(post => !post.is_sponsored).length;
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
    {isLoading ? <div className={gridClass}>{Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-28 rounded-card sm:h-[300px]" />)}</div>
      : <>
        {todayCount === 0 && <p role="status" className="py-8 text-sm leading-relaxed text-text-secondary">
          {categoryId === "all" ? "Dziś nie mamy jeszcze newsów." : "Dziś nie mamy jeszcze newsów z tej dyscypliny. Wybierz „Wszystko”, żeby zobaczyć pozostałe."}
        </p>}
        <div className={gridClass}>{today.map((post, index) => <HomeNewsCard key={post.id} post={post} ref={index === today.length - 1 ? lastTodayRef : undefined} />)}</div>
        {earlier.length > 0 && <div className="mt-8">
          <h2 className="mb-4 text-xl font-bold">Z ostatnich 7 dni</h2>
          <div className={gridClass}>{earlier.map(post => <HomeNewsCard key={post.id} post={post} />)}</div>
        </div>}
      </>}
  </section>;
}
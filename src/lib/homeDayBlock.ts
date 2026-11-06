import type { Post } from "@/hooks/usePosts";

export type HomeContentType = "briefing" | "news";

export function homeContentType(post: Pick<Post, "tags" | "source_url">): HomeContentType {
  return post.tags?.some(tag => tag.trim().toLocaleLowerCase("pl-PL") === "podsumowanie dnia") || post.source_url?.includes("/podsumowanie")
    ? "briefing" : "news";
}

export function selectHomeDayContent(posts: Post[], todaysPosts: Post[], featured?: Post | null) {
  const unique = [...new Map([...todaysPosts, ...posts].map(post => [post.id, post])).values()]
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
  const briefing = [featured, ...todaysPosts].find((post): post is Post => Boolean(post && todaysPosts.some(today => today.id === post.id) && homeContentType(post) === "briefing"));
  const news = unique.filter(post => homeContentType(post) === "news");
  const lead = featured && homeContentType(featured) === "news" ? featured : news[0];
  const secondary = news.filter(post => post.id !== lead?.id && !post.is_sponsored).slice(0, 2);
  const topics = [lead, ...news.filter(post => post.id !== lead?.id && !post.is_sponsored)]
    .filter((post): post is Post => Boolean(post && todaysPosts.some(today => today.id === post.id)))
    .slice(0, 3);
  return { briefing, lead, secondary, topics };
}

export function newsCountLabel(count: number) {
  if (count === 1) return "news dziś";
  return count % 10 >= 2 && count % 10 <= 4 && !(count % 100 >= 12 && count % 100 <= 14)
    ? "newsy dziś" : "newsów dziś";
}
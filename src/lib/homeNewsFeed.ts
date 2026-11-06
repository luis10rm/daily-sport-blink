import type { Post } from "@/hooks/usePosts";

export const HOME_FEED_PAGE_SIZE = 12;

export function nextHomeFeedOffset(lastPageLength: number, currentOffset: number) {
  return lastPageLength === HOME_FEED_PAGE_SIZE ? currentOffset + HOME_FEED_PAGE_SIZE : undefined;
}

export function orderHomeFeedPosts(posts: Post[]) {
  const sponsored = posts.find(post => post.is_sponsored);
  const nonSponsored = posts.filter(post => !post.is_sponsored);
  if (!sponsored || nonSponsored.length === 0) return posts;
  const [first, ...rest] = nonSponsored;
  return [first, sponsored, ...rest];
}

export function filterHomeNews(posts: Post[], categoryId: string) {
  return categoryId === "all" ? posts : posts.filter(post => post.category_id === categoryId || post.is_sponsored);
}

export function splitHomeNews(posts: Post[], now = new Date()) {
  const date = now.toDateString();
  return {
    today: posts.filter(post => new Date(post.published_at).toDateString() === date),
    earlier: posts.filter(post => new Date(post.published_at).toDateString() !== date),
  };
}

export function relativeNewsTime(publishedAt: string, now = new Date()) {
  const minutes = Math.max(0, Math.floor((now.getTime() - Date.parse(publishedAt)) / 60000));
  if (minutes < 1) return "przed chwilą";
  if (minutes < 60) return `${minutes} min temu`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} godz. temu`;
  const days = Math.floor(minutes / 1440);
  return `${days} ${days === 1 ? "dzień" : "dni"} temu`;
}

export const sportDotClasses: Record<string, string> = {
  football: "bg-sport-football", tennis: "bg-sport-tennis", basketball: "bg-sport-basketball",
  "pilka-nozna": "bg-sport-football", tenis: "bg-sport-tennis", siatkowka: "bg-sport-volleyball",
  koszykowka: "bg-sport-basketball", motorsport: "bg-sport-motorsport", "formula-1": "bg-sport-f1", f1: "bg-sport-f1",
  "sporty-zimowe": "bg-sport-winter", "pilka-reczna": "bg-sport-handball", kolarstwo: "bg-sport-cycling",
  lekkoatletyka: "bg-sport-athletics", mma: "bg-sport-mma",
};
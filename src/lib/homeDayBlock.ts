import type { Post } from "@/hooks/usePosts";

export type HomeContentType = "briefing" | "news";

export function homeContentType(post: Pick<Post, "tags" | "source_url">): HomeContentType {
  return post.tags?.some(tag => tag.trim().toLocaleLowerCase("pl-PL") === "podsumowanie dnia") || post.source_url?.includes("/podsumowanie")
    ? "briefing" : "news";
}

const stripTags = (html: string) =>
  html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

/** Three key topics from the briefing's own text: section headings first, then first sentences. */
export function briefingTopics(content?: string | null, limit = 3): string[] {
  if (!content) return [];
  const headings = [...content.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi)].map(m => stripTags(m[1])).filter(Boolean);
  if (headings.length >= limit) return headings.slice(0, limit);
  const sentences = [...content.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(m => stripTags(m[1]).match(/^.*?[.!?](?=\s|$)/)?.[0] || stripTags(m[1]))
    .filter(text => text.length > 20 && !/^przeczytaj również/i.test(text));
  return [...headings, ...sentences].slice(0, limit);
}

export function selectHomeDayContent(posts: Post[], todaysPosts: Post[], featured?: Post | null) {
  const unique = [...new Map([...todaysPosts, ...posts].map(post => [post.id, post])).values()]
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
  const briefing = [featured, ...todaysPosts].find((post): post is Post => Boolean(post && todaysPosts.some(today => today.id === post.id) && homeContentType(post) === "briefing"));
  const news = unique.filter(post => homeContentType(post) === "news");
  const lead = featured && homeContentType(featured) === "news" ? featured : news[0];
  const secondary = news.filter(post => post.id !== lead?.id && !post.is_sponsored).slice(0, 2);
  const topics = briefingTopics(briefing?.content);
  return { briefing, lead, secondary, topics };
}

/** Posts already shown in the day block; the "Dziś" list must not repeat them. */
export function homeDayBlockIds(content: ReturnType<typeof selectHomeDayContent>): Set<string> {
  return new Set([content.briefing?.id, content.lead?.id, ...content.secondary.map(post => post.id)].filter((id): id is string => Boolean(id)));
}

export function newsCountLabel(count: number) {
  if (count === 1) return "news dziś";
  return count % 10 >= 2 && count % 10 <= 4 && !(count % 100 >= 12 && count % 100 <= 14)
    ? "newsy dziś" : "newsów dziś";
}

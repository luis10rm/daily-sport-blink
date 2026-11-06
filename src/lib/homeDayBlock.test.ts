/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import type { Post } from "@/hooks/usePosts";
import { homeContentType, newsCountLabel, selectHomeDayContent } from "./homeDayBlock";

const post = (id: string, tags: string[] = []): Post => ({
  id, slug: id, title: id, excerpt: "", content: "Treść", source_url: "https://example.com", tags,
  is_sponsored: false, is_news_of_day: false,
  published_at: "2026-11-06T12:00:00Z", created_at: "2026-11-06T12:00:00Z", updated_at: "2026-11-06T12:00:00Z",
});

describe("homepage day block", () => {
  test("briefing has its own display type instead of a sport category", () => {
    expect(homeContentType(post("brief", ["podsumowanie dnia"]))).toBe("briefing");
    expect(homeContentType(post("news"))).toBe("news");
  });
  test("selects three topics and two distinct secondary news, excluding briefing", () => {
    const today = [post("brief", ["podsumowanie dnia"]), ...["a", "b", "c", "d"].map(id => post(id))];
    const content = selectHomeDayContent(today, today, today[0]);
    expect(content.briefing?.id).toBe("brief");
    expect(content.lead?.id).toBe("a");
    expect(content.secondary.map(item => item.id)).toEqual(["b", "c"]);
    expect(content.topics.map(item => item.id)).toEqual(["a", "b", "c"]);
  });
  test("does not reuse yesterday's briefing as today's briefing", () => {
    expect(selectHomeDayContent([post("old", ["podsumowanie dnia"])], [post("today")]).briefing).toBeUndefined();
  });
  test("counter retains the actual number including 28 news today", () => {
    expect(newsCountLabel(28)).toBe("newsów dziś");
    expect(newsCountLabel(22)).toBe("newsy dziś");
    expect(newsCountLabel(12)).toBe("newsów dziś");
  });
});
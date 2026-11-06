/// <reference types="bun" />
import { expect, test } from "bun:test";
import type { Post } from "@/hooks/usePosts";
import { filterHomeNews, nextHomeFeedOffset, orderHomeFeedPosts, relativeNewsTime, splitHomeNews } from "./homeNewsFeed";
const posts = [
  { id: "football", category_id: "football", published_at: "2026-11-06T12:00:00", is_sponsored: false },
  { id: "tennis", category_id: "tennis", published_at: "2026-11-05T12:00:00", is_sponsored: false },
  { id: "partner", category_id: "other", published_at: "2026-11-06T12:00:00", is_sponsored: true },
] as Post[];
test("feed requests start with 12 posts and advance by exactly 12 until a short final page", () => {
  expect(nextHomeFeedOffset(12, 0)).toBe(12);
  expect(nextHomeFeedOffset(12, 12)).toBe(24);
  expect(nextHomeFeedOffset(7, 12)).toBeUndefined();
});

test("sponsored placement stays second after each loaded page is combined", () => {
  expect(orderHomeFeedPosts(posts).map(post => post.id)).toEqual(["football", "partner", "tennis"]);
});

test("client filtering selects only the requested sport while retaining sponsored placement", () => {
  expect(filterHomeNews(posts, "football").map(post => post.id)).toEqual(["football", "partner"]);
  expect(filterHomeNews(posts, "all").length).toBe(3);
});
test("today's list stays separate from earlier seven-day content", () => {
  const result = splitHomeNews(posts, new Date("2026-11-06T14:00:00"));
  expect(result.today.map(post => post.id)).toEqual(["football", "partner"]);
  expect(result.earlier.map(post => post.id)).toEqual(["tennis"]);
  expect(splitHomeNews(filterHomeNews(posts, "tennis"), new Date("2026-11-06T14:00:00")).today.filter(post => !post.is_sponsored)).toHaveLength(0);
});
test("relative time shows two hours as 2 godz. temu", () => {
  expect(relativeNewsTime("2026-11-06T12:00:00Z", new Date("2026-11-06T14:00:00Z"))).toBe("2 godz. temu");
  expect(relativeNewsTime("2026-11-06T13:55:00Z", new Date("2026-11-06T14:00:00Z"))).toBe("5 min temu");
  expect(relativeNewsTime("2026-11-05T12:00:00Z", new Date("2026-11-06T14:00:00Z"))).toBe("wczoraj");
});
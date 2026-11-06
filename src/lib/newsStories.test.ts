import { describe, expect, test } from "bun:test";
import { latestNewsStories, newsStoryKeyword, parseReadNewsStories, saveReadNewsStory, loadReadNewsStories, NEWS_STORIES_READ_KEY } from "./newsStories";

describe("news stories rules", () => {
  test("shows exactly the 10 newest articles in descending date order", () => {
    const posts = Array.from({ length: 12 }, (_, i) => ({ id: String(i), title: "News", published_at: new Date(Date.UTC(2026, 10, i + 1)).toISOString() }));
    expect(latestNewsStories(posts).map(post => post.id)).toEqual(["11", "10", "9", "8", "7", "6", "5", "4", "3", "2"]);
  });
  test("keyword is one complete word from an editorial tag or name", () => {
    expect(newsStoryKeyword({ title: "Nowy sukces", tags: ["Real Madrid"] })).toBe("Madrid");
    expect(newsStoryKeyword({ title: "Dziś Lewandowski strzelił gola", tags: [] })).toBe("Lewandowski");
  });
  test("read article survives a storage round trip", () => {
    const store = new Map<string, string>();
    const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) } });
    try {
      saveReadNewsStory("article-42", new Set());
      expect(JSON.parse(store.get(NEWS_STORIES_READ_KEY) || "[]")).toEqual(["article-42"]);
      expect(loadReadNewsStories().has("article-42")).toBe(true);
      expect(loadReadNewsStories().has("article-43")).toBe(false);
    } finally {
      if (original) Object.defineProperty(globalThis, "localStorage", original);
      else Reflect.deleteProperty(globalThis, "localStorage");
    }
  });
  test("invalid stored data does not prevent reading", () => {
    expect([...parseReadNewsStories("broken")]).toEqual([]);
    expect([...parseReadNewsStories('["read", 123]')]).toEqual(["read"]);
  });
});
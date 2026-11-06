export const NEWS_STORIES_LIMIT = 10;
export const NEWS_STORIES_READ_KEY = "szortsy-read-news-stories";

type StoryCandidate = {
  id: string;
  title: string;
  tags?: string[] | null;
  published_at: string;
};

export const latestNewsStories = <T extends StoryCandidate>(posts: T[]): T[] =>
  [...posts]
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))
    .slice(0, NEWS_STORIES_LIMIT);

const words = (text: string): string[] => text.match(/[\p{L}][\p{L}\p{N}-]*/gu) || [];
const generic = new Set(["sport", "news", "wiadomości", "aktualności", "podsumowanie", "dnia", "piłka", "nożna"]);

/** Prefer an editorial tag, then a distinctive proper name from the headline. */
export const newsStoryKeyword = (post: Pick<StoryCandidate, "title" | "tags">): string => {
  for (const tag of post.tags || []) {
    const candidates = words(tag).filter(word => !generic.has(word.toLocaleLowerCase("pl")));
    if (candidates.length) return candidates[candidates.length - 1];
  }
  const titleWords = words(post.title);
  const name = titleWords.slice(1).find(word => /^\p{Lu}/u.test(word) && !generic.has(word.toLocaleLowerCase("pl")));
  return name || titleWords.find(word => !generic.has(word.toLocaleLowerCase("pl"))) || "News";
};

export const parseReadNewsStories = (value: string | null): Set<string> => {
  try {
    const parsed: unknown = JSON.parse(value || "[]");
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set();
  }
};

export const loadReadNewsStories = (): Set<string> => {
  try {
    return parseReadNewsStories(localStorage.getItem(NEWS_STORIES_READ_KEY));
  } catch {
    return new Set();
  }
};

export const saveReadNewsStory = (id: string, current: Set<string>): Set<string> => {
  const next = new Set([...loadReadNewsStories(), ...current, id]);
  try {
    localStorage.setItem(NEWS_STORIES_READ_KEY, JSON.stringify([...next]));
  } catch {
    // Reading and navigation still work when browser storage is unavailable.
  }
  return next;
};
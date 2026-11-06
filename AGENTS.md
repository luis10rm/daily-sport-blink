# Project conventions

- Keep homepage news-story selection, keyword extraction and localStorage parsing in `src/lib/newsStories.ts` so the ten-item and read-persistence rules are independently testable; run its tests with `bun test src/lib/newsStories.test.ts`.
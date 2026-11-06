# Project conventions

- Keep homepage news-story selection, keyword extraction and localStorage parsing in `src/lib/newsStories.ts` so the ten-item and read-persistence rules are independently testable; run its tests with `bun test src/lib/newsStories.test.ts`.
- Keep homepage day-block selection and display-type classification in `src/lib/homeDayBlock.ts`; briefing is a presentation type derived from existing summary markers so stored categories and article URLs stay unchanged. Run `bun test src/lib/homeDayBlock.test.ts`.
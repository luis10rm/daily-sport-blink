# Project conventions

- Keep Positive category icon defaults in `src/lib/positiveCategoryIcons.ts` and use `PositiveCategoryIcon` for public and admin previews so saved choices and fallbacks stay consistent without modifying category data.

- Keep homepage news-story selection, keyword extraction and localStorage parsing in `src/lib/newsStories.ts` so the ten-item and read-persistence rules are independently testable; run its tests with `bun test src/lib/newsStories.test.ts`.
- Keep homepage day-block selection and display-type classification in `src/lib/homeDayBlock.ts`; briefing is a presentation type derived from existing summary markers so stored categories and article URLs stay unchanged. Run `bun test src/lib/homeDayBlock.test.ts`.
- Use dedicated homepage feed cards so archive/category/article presentation stays unchanged; keep client filtering, day grouping and relative time in `src/lib/homeNewsFeed.ts`, tested with `bun test src/lib/homeNewsFeed.test.ts`. Retain sponsored posts through filters and earlier seven-day posts below today's list.
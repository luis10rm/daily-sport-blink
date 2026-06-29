## Pozostałe klikalne elementy bez fixu iOS double-tap

Audyt wykrył klikalne `<Link>` z `react-router-dom`, które wciąż mogą wymagać podwójnego tapnięcia na iPhonie (pattern: `<a href onClick onTouchEnd → navigate()` jeszcze nie zastosowany).

### High priority — widoczne na public feed / homepage / artykule
1. `src/components/recki/ReviewCard.tsx` — wszystkie warianty (`hero`, `default`, `compact`) — kafelki Tech na homepage i listingach.
2. `src/components/AuthorCard.tsx` — karta autora pod artykułem / w widgetach.
3. `src/components/AuthorProfileCard.tsx` — link do profilu autora.
4. `src/components/StoriesViewer.tsx` (linia 203) — CTA "Czytaj cały blink" w storiesach.
5. `src/components/WorldCupBadge.tsx` — złota plakietka "MŚ 2026" na kartach newsów (klikalna do hub).

### Medium priority — strefa Mundialu
6. `src/components/TodaysMatchesBanner.tsx` (l. 100) — link do `/mistrzostwa-swiata-2026`.
7. `src/components/worldcup/NextMatchCountdown.tsx` (l. 147) — link do `#terminarz`.
8. `src/components/worldcup/WorldCupMatchCenter.tsx` (l. 124) — link do hub w widgecie artykułu.
9. `src/components/worldcup/WorldCupStoryPanels.tsx` (l. 259) — CTA w panelu story.

### Low priority — strony (breadcrumby, mniej krytyczne)
10. `src/pages/BlinkPage.tsx` (l. 96, 168) — powrót do "/" i nawigacja w błędach.
11. `src/pages/CategoryPage.tsx` (l. 91) — breadcrumb "Strona główna".

### Plan zmian
Dla każdego komponentu z High/Medium stosujemy ten sam wzorzec, co w `Header.tsx` / `NewsCard.tsx`:
- Zamiana `<Link to=...>` → `<a href=... onClick={navigate} onTouchEnd={navigate} />`.
- `onClick` respektuje Cmd/Ctrl/Shift (nowa karta).
- `onTouchEnd` z `preventDefault()`.

W przypadku `ReviewCard`, `AuthorCard`, `AuthorProfileCard`, `WorldCupBadge` — wyciągnięcie pomocniczego hooka `useNavLink()` (już istnieje w `Header.tsx` / `ReckiHeader.tsx`) do `src/hooks/useNavLink.ts`, żeby uniknąć duplikacji w kolejnych komponentach.

### Pytanie
Czy iść w komplet (High + Medium + Low), czy ograniczyć do **High + Medium** (te realnie tapowane palcem)? Breadcrumby (Low) są rzadziej klikane, ale dla spójności też warto.
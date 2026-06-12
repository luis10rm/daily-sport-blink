# Plan: audyt i naprawa double-tap na iPhonie

## Co już ustaliłem
- `onTouchEnd` **nie jest dodany wszędzie** — występuje tylko w kilku miejscach krytycznych, m.in.:
  - `src/components/NewsCard.tsx`
  - `src/components/NewsOfTheDay.tsx`
  - `src/components/TodaysNewsBanner.tsx`
  - `src/components/PWAInstallBanner.tsx`
  - `src/pages/StartPage.tsx`
  - `src/pages/InstallPage.tsx`
  - viewerach stories (`StoriesViewer`, `WorldCupStoryPanels`) tylko do pauzowania
- Wiele ważnych mobilnych CTA nadal działa wyłącznie przez `Link` / `onClick` bez dotykowego fallbacku.

## Najbardziej podejrzane elementy
1. **`src/components/WorldCupHomeBanner.tsx`**
   - baner „MŚ 2026 LIVE — zobacz wyniki dnia” jest cały oparty o `Link`
   - brak `onTouchEnd`
   - to jest bardzo mocny kandydat do problemu na iPhonie

2. **`src/components/MatchTicker.tsx`**
   - górny ticker MŚ 2026 to też sam `Link`
   - brak `onTouchEnd`

3. **`src/components/Header.tsx` / `ThemeToggle.tsx`**
   - ikony w headerze działają przez `Link`/`Button`, ale bez dodatkowego touch fallbacku
   - jeśli użytkownik zgłasza problem „jak kiedyś”, header jest wart objęcia tą samą strategią

4. **Stories circles**
   - `src/components/DynamicStoriesCircle.tsx`
   - `src/components/worldcup/WorldCupStoryCircle.tsx`
   - oba mają tylko `onClick`

5. **`src/components/SponsorBanner.tsx`**
   - CTA i cała powierzchnia bannera opierają się na `onClick`/`window.open`
   - brak `onTouchEnd`

## Wniosek
To nie wygląda na problem typu „wszystko musi mieć `onTouchEnd`”, tylko raczej na to, że **część kluczowych elementów mobilnych nie dostała tego samego zabezpieczenia, które wcześniej dodawaliśmy do wybranych CTA**. Samo globalne dodanie `onTouchEnd` wszędzie byłoby ryzykowne i mogłoby dublować akcje.

## Proponowany zakres fixu
### 1) Ujednolicić mobilne CTA w najważniejszych komponentach
Dodać bezpieczny schemat `onTouchEnd` + `onClick` tam, gdzie dziś są tylko `Link`/`onClick`, zaczynając od:
- `src/components/WorldCupHomeBanner.tsx`
- `src/components/MatchTicker.tsx`
- `src/components/DynamicStoriesCircle.tsx`
- `src/components/worldcup/WorldCupStoryCircle.tsx`
- `src/components/SponsorBanner.tsx`
- opcjonalnie wybrane elementy z headera (`ThemeToggle`, główne linki), jeśli chcesz objąć to szerzej

### 2) Nie robić ślepego `onTouchEnd` na wszystkich elementach
Zamiast tego użyć spójnego wzorca tylko dla interakcji, które:
- nawigują,
- otwierają modal/story,
- otwierają link zewnętrzny,
- są zgłaszane jako wymagające drugiego tapnięcia.

### 3) Zachować istniejące mobile safeguards
Nie ruszać obecnych reguł typu:
- `touch-manipulation`
- `@media (hover: hover)`
bo one są poprawne i już pomagają ograniczać iOS hover/double-tap side effects.

## Techniczne detale
- Dla nawigacji wewnętrznej: najlepiej użyć `useNavigate()` i jednego handlera dotykowego, zamiast polegać wyłącznie na `Link`.
- Dla modali/stories: `onTouchEnd={(e) => { e.preventDefault(); action(); }}` + ochrona przed podwójnym wywołaniem.
- Dla linków zewnętrznych: `window.open(...)` w dotykowym handlerze, tak jak już robicie w części komponentów.
- Trzeba uważać na podwójne odpalenie `touchend` + `click`, więc fix powinien być zrobiony jednym wspólnym wzorcem, nie kopiuj-wklej bez guardów.

## Efekt po wdrożeniu
- najważniejsze mobilne CTA będą reagować na pierwszy tap na iPhonie,
- usuniemy niespójność między kartami/newsami a banerami/tickerem/stories,
- ograniczymy ryzyko nawrotu starego problemu w nowych komponentach.
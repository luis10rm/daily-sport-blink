## Cel
Wyróżnić newsy z kategorii **"Mistrzostwa świata w piłce nożnej 2026"** (slug: `mistrzostwa-swiata-w-pilce-noznej-2026`) wizualnym oznaczeniem — na kafelku na stronie głównej oraz na stronie artykułu `/blink/:slug`. Wzorujemy się na sprawdzonym pattern *Olympic theme*.

## Decyzje (potwierdzone)
- **Data startu MŚ:** 11.06.2026 (oficjalny start FIFA)
- **Etykieta badge'a:** „MŚ 2026"
- **Countdown:** tylko na stronie artykułu (kafelki zostają minimalistyczne)
- **Kolor:** pełny złoty (amber/gold)

## Koncept wizualny

**Badge na kafelku** (lewy górny róg, analogicznie do `Olimpijskie`):
- Ikona `Trophy` (lucide) + tekst „MŚ 2026"
- Tło: pełny złoty (`bg-amber-500/95`), tekst ciemny (`text-amber-950`) dla maksymalnego kontrastu
- Karta dostaje subtelną złotą ramkę + delikatny glow (klasa `.worldcup-card`)

**Ribbon na stronie artykułu `/blink/:slug`**:
- Nad tytułem wstążka: `Trophy` + „Mistrzostwa Świata 2026 • Start za X dni"
- Po starcie: ten sam komponent przełączy się na „NA ŻYWO" (przygotowanie pod fazę 2 użytkownika)
- Delikatny złoty akcent w sekcji meta kategorii

## Implementacja

### 1) `src/lib/worldCupTheme.ts` (nowy plik)
Analogicznie do `olympicTheme.ts`:
```ts
const WORLD_CUP_SLUGS = ["mistrzostwa-swiata-w-pilce-noznej-2026"];
const WORLD_CUP_START = new Date("2026-06-11T00:00:00Z");

export const isWorldCupCategory = (slug?: string | null): boolean
export const getWorldCupPhase = (): "pre" | "live" | "post"
export const getDaysUntilWorldCup = (): number
```
Liczone raz przy renderze, bez interwałów.

### 2) Tokeny w `src/index.css` + `tailwind.config.ts`
- Zmienne HSL: `--worldcup-gold`, `--worldcup-gold-glow`
- Klasa `.worldcup-card` — złota ramka 1px + glow shadow (tylko `@media (hover: hover)` dla intensywniejszego efektu hover, mobile bez)

### 3) `src/components/WorldCupBadge.tsx` (nowy, współdzielony)
Mały komponent: `Trophy` + „MŚ 2026" w złotym chipie. Używany w `NewsCard` i `NewsOfTheDay`.

### 4) `src/components/WorldCupRibbon.tsx` (nowy)
Wstążka nad tytułem na `BlinkPage` z countdownem („Start za X dni" / „NA ŻYWO" / brak gdy `post`).

### 5) `src/components/NewsCard.tsx` (edycja)
- Wyliczyć `isWorldCup` z `sportCategory?.slug || categorySlug`
- Dodać `<WorldCupBadge />` w lewym górnym rogu obrazka
- Dodać klasę `worldcup-card` na `<article>` gdy `isWorldCup`
- Olimpijski badge i WC badge to różne kategorie — brak konfliktu pozycyjnego

### 6) `src/components/NewsOfTheDay.tsx` (edycja)
Dodać ten sam badge w analogicznym miejscu (spójność z kafelkami).

### 7) `src/pages/BlinkPage.tsx` (edycja)
- Renderować `<WorldCupRibbon />` nad tytułem gdy `isWorldCupCategory(post.sport_category?.slug)`
- Lekki złoty akcent w meta kategorii (border-left lub tło chipa)

### 8) Memory
Dodać `mem://style/world-cup-2026-theme` opisujące mechanizm (slug, kolor, faza, lokalizacje użycia). Update `mem://index.md`.

## Co NIE wchodzi w tę iterację
- Globalne motywowanie layoutu (header/wallpaper/tło) — to faza 2
- Strona kategorii `/kategoria/mistrzostwa-swiata-w-pilce-noznej-2026` — można dorzucić mały hero później
- Real-time countdown z sekundami — wystarczy „za X dni" liczone przy renderze

## Pliki do utworzenia/edycji
- **Nowe:** `src/lib/worldCupTheme.ts`, `src/components/WorldCupBadge.tsx`, `src/components/WorldCupRibbon.tsx`, `mem://style/world-cup-2026-theme`
- **Edycja:** `src/components/NewsCard.tsx`, `src/components/NewsOfTheDay.tsx`, `src/pages/BlinkPage.tsx`, `src/index.css`, `tailwind.config.ts`, `mem://index.md`
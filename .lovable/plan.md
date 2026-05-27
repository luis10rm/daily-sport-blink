## Cel
Stworzyć dedykowaną stronę-hub MŚ 2026 (`/mistrzostwa-swiata-2026`) łączącą:
- **Live dane** z Football-Data.org (terminarz, wyniki, top strzelcy)
- **Agregację naszych postów** z kategorii `mistrzostwa-swiata-w-pilce-noznej-2026` (wszystkie, bez limitu 7 dni)

Plus wejścia z badge'a na kafelkach i bannera nad feedem.

## Architektura danych

**API:** Football-Data.org (free tier, 10 req/min, MŚ w darmowym pakiecie, competition code `WC`).

**Cache w bazie** — chronimy klucz i nie wybijamy limitu (10 req/min to mało):

```text
public.worldcup_cache
├── cache_key      text PRIMARY KEY    -- np. "matches", "scorers", "standings"
├── data           jsonb
├── fetched_at     timestamptz
└── expires_at     timestamptz
```
- RLS: `SELECT` dla anon/authenticated, `ALL` dla service_role
- Edge function jest jedynym writerem (przez service role)

**Edge function `worldcup-data`:**
- GET `?resource=matches|scorers|standings|teams`
- Sprawdza cache → jeśli świeży, zwraca; jeśli nie, fetch z API → zapis → zwrot
- TTL: 60s w trakcie meczu (live), 5 min poza, 1h dla `teams`
- Secret: `FOOTBALL_DATA_API_KEY` (poproszę o niego przy implementacji)
- CORS pełne, klient woła `supabase.functions.invoke('worldcup-data', { body: { resource: 'matches' }})`

## Strony i komponenty

### 1) `src/pages/WorldCup2026.tsx` (nowy, route `/mistrzostwa-swiata-2026`)

Sekcje od góry:

1. **Hero** — pełnoekranowy gradient złoto/granatowy, logo turnieju (Trophy + „Mistrzostwa Świata FIFA 2026"), countdown lub „NA ŻYWO" / „PO TURNIEJU" zależnie od fazy (z istniejącego `worldCupTheme.ts`)
2. **`<WorldCupMatchesWidget />`** — terminarz: 5 najbliższych nadchodzących + 5 ostatnio rozegranych; przy live mecz pulsujący czerwony „LIVE" + minuta gry
3. **`<WorldCupStandings />`** — tabele 12 grup (w fazie grupowej) lub drabinka 1/8, 1/4, 1/2, finał (w fazie pucharowej) — auto-przełączanie po dacie
4. **`<WorldCupTopScorers />`** — top 10 strzelców (mini-karty z flagą, drużyną, liczbą goli)
5. **`<WorldCupNewsAggregator />`** — wszystkie nasze posty z kategorii (slug: `mistrzostwa-swiata-w-pilce-noznej-2026`), sortowane od najnowszego, paginacja po 12 (bez 7-dniowego limitu), reużywamy `NewsCard`
6. **Footer-CTA** — „Czytaj wszystkie kategorie" + link do `/`

Pre-faza (przed 11.06.2026): sekcje 2-4 pokazują „Terminarz dostępny od…" / „Tabele dostępne po pierwszej kolejce" — wyświetlamy hero + sekcja 5 (nasze posty) jako główny content. Niczego nie ukrywamy nagle.

### 2) Hooks (`src/hooks/useWorldCupData.ts`)
- `useWorldCupMatches()` — React Query, staleTime 30s
- `useWorldCupScorers()` — staleTime 5min
- `useWorldCupStandings()` — staleTime 5min
- Wszystkie wołają edge function `worldcup-data`

### 3) `src/hooks/useWorldCupPosts.ts`
- Wszystkie posty z kategorii o slug `mistrzostwa-swiata-w-pilce-noznej-2026`
- Paginacja po 12, sort `published_at DESC`
- Bez 7-dniowego limitu (świadome odstępstwo od core rule — to strefa archiwalna+aktualna)

### 4) Linki wejściowe

- **`src/components/WorldCupBadge.tsx`** (edycja) — opakować w `<Link to="/mistrzostwa-swiata-2026">` + `stopPropagation` żeby klik w badge nie otwierał artykułu
- **`src/components/WorldCupHomeBanner.tsx`** (nowy) — pasek nad feedem na `/`:
  - Złoty gradient, Trophy + tekst dynamiczny:
    - Pre: „MŚ 2026 — start za X dni. Zobacz strefę turnieju →"
    - Live: „MŚ 2026 LIVE — zobacz wyniki dnia →" (+ kropka pulsująca)
    - Post: ukryty
  - Wstawiony w `src/pages/Index.tsx` nad listą kafelków
  - Zamykalny (localStorage `wc-banner-dismissed-{phase}`)

### 5) SEO
- `<SEO title="Mistrzostwa Świata 2026 — wyniki, tabele, terminarz | Szortsy" description="..." />`
- JSON-LD `SportsEvent` ze startDate `2026-06-11`, endDate `2026-07-19`, location US/CA/MX
- Dodanie do `public/sitemap.xml` (i edge function `sitemap` jeśli generuje dynamicznie)

### 6) `src/App.tsx` — nowy route
```tsx
<Route path="/mistrzostwa-swiata-2026" element={<WorldCup2026 />} />
```

## Bezpieczeństwo i limity API

Football-Data free = 10 req/min. Strategia:
- Edge function cachuje **per-resource**, więc 3 endpointy × ruch użytkowników = max ~3 req/min do upstream
- Jeśli kiedyś przekroczymy → upgrade do API-Football (osobna iteracja, plan zostawia miejsce)
- W trakcie meczów cron w Supabase co 60s odświeża cache w tle (opcjonalnie — w fazie 2)

## Pliki

**Nowe:**
- `src/pages/WorldCup2026.tsx`
- `src/components/worldcup/WorldCupHero.tsx`
- `src/components/worldcup/WorldCupMatchesWidget.tsx`
- `src/components/worldcup/WorldCupStandings.tsx`
- `src/components/worldcup/WorldCupTopScorers.tsx`
- `src/components/worldcup/WorldCupNewsAggregator.tsx`
- `src/components/WorldCupHomeBanner.tsx`
- `src/hooks/useWorldCupData.ts`
- `src/hooks/useWorldCupPosts.ts`
- `supabase/functions/worldcup-data/index.ts`
- Migration: tabela `worldcup_cache` + RLS + GRANT

**Edycja:**
- `src/App.tsx` (nowy route)
- `src/pages/Index.tsx` (banner nad feedem)
- `src/components/WorldCupBadge.tsx` (Link do hubu)
- `public/sitemap.xml` (+ funkcja `sitemap` jeśli dynamiczna)
- `mem://style/world-cup-2026-theme` (rozszerzenie o hub)
- `mem://index.md` (dopisać wpis o hubie)

## Czego NIE robimy w tej iteracji
- API-Football (płatne) — zostaje na później jeśli ruch uzasadni
- Cron-job odświeżający cache w tle — działa lazy, na żądanie (wystarczy na start)
- Powiadomienia push przed meczem Polski — osobna funkcjonalność
- Predykcje meczów / typer — osobny moduł
- Wallpaper/header theming na czas MŚ — faza 2 Twojego oryginalnego pomysłu

## Co trzeba ode mnie / od Ciebie przed startem
1. Założenie konta Football-Data.org (free, 30 sekund) → kopiujesz API key → poproszę przez secret prompt o `FOOTBALL_DATA_API_KEY`
2. Akceptacja planu → ruszam z migracją + edge function w pierwszej kolejności, potem frontend

## Kolejność wykonania
1. Migracja `worldcup_cache` + RLS + GRANT
2. Edge function `worldcup-data` (po dodaniu sekretu)
3. Hooks `useWorldCupData` + `useWorldCupPosts`
4. Strona `WorldCup2026.tsx` + komponenty sekcji
5. Banner na homepage + Link na badge
6. Route + SEO + sitemap
7. Memory + finalny test na preview

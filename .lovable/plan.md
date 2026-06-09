# Tryb Mundialowy 2026 — plan redesignu

Cel: między 11.06 a 19.07.2026 Szortsy wyglądają i działają jak dedykowany hub MŚ, ale po turnieju jednym przełącznikiem wraca normalny serwis.

## Plan API Football-Data — nie trzeba podbijać

Free tier daje 10 req/min na competition WC. Mamy już cache w `worldcup_cache` (matches 60s, standings/scorers 300s) → niezależnie od ruchu robimy max ~5 req/min. **Zostajemy na free**. Mecze dnia filtrujemy klientowo z istniejącego `matches` — bez nowych wywołań upstream.

## 1. Tournament Mode toggle (fundament)

- Nowy klucz w `settings`: `tournament_mode` = `off | worldcup_2026`.
- Hook `useTournamentMode()` czyta klucz + sprawdza datę (auto-off po 20.07).
- Wrapper `<TournamentTheme>` w `App.tsx` dodaje klasę `tournament-worldcup` do `<html>` — wszystkie style mundialowe są pod tą klasą i nie wpływają na resztę.
- Switch w admin Settings z preview daty wyłączenia.

## 2. Pełny re-skin pod `.tournament-worldcup`

W `src/index.css` blok nadpisujący tokens tylko gdy klasa aktywna:
- `--primary`: emerald → złoto `43 96% 56%`
- `--accent`: ziel. murawy `150 60% 25%`
- `--background` (dark): głębszy navy z ciepłym podtonem
- `--ring`, `--news-of-day`: dopasowane do złota
- nowy `--gradient-pitch` używany w hero/headerze

Logo: wariant `LogoWorldCup` (mały trofeum-akcent) przełączany w `Header.tsx`.
Tło: `WallpaperBackground` zyskuje wariant `worldcup` (subtelna murawa + reflektor, opacity ≤6%, wyłączone na mobile dla CWV).
Karty: wszystkie `NewsCard` w trybie turniejowym dostają delikatny złoty `ring-1`.

## 3. Live-pasek meczowy (sticky pod headerem)

`MatchTicker.tsx`:
- Czyta `useWorldCupMatches`, wybiera: trwający → następny dziś → najbliższy.
- Flagi + TLA, wynik / godzina PL, minuta, status LIVE (pulse).
- 36px desktop / 32px mobile, sticky pod `Header`, kryje się przy scroll-down.
- Klik → `/mistrzostwa-swiata-2026`.
- Renderowany tylko gdy tryb aktywny i są mecze ±2 dni.

## 4. „Dziś gra…" — banner mecze dnia (homepage)

`TodaysMatchesBanner.tsx` w `Index.tsx` **przed** `TodaysNewsBanner`:
- Karuzela: jeden mecz na slot (flagi 48px, godzina, stadion, grupa).
- Stany: pre-match (countdown), live (wynik + min), final (wynik + winner).
- Pusty stan: „Dziś bez meczu — zobacz tabele grup" → CTA do hubu.
- Obecny `WorldCupHomeBanner` przesuwamy niżej, by się nie dublować.

## 5. Widget „Mecz dnia" (drugi blok homepage)

`MatchOfTheDay.tsx` pod News of the Day:
- Heurystyka wybiera 1 mecz dnia (Polska > grupa śmierci > top teams).
- Pokazuje: ostatnie spotkania, nasz najnowszy blink z tagiem drużyny, CTA do hubu.
- Czysto klientowy, brak nowych endpointów.

## 6. Story „Strefa MŚ" — pinowany pierwszy bubble

W `StoriesRow.tsx`:
- `WorldCupStoryCircle` pinowany na pozycji 0, złoty pierścień z animacją.
- 4 ekrany: terminarz dnia, tabela grupy Polski, król strzelców, top artykuł MŚ.
- Dane z istniejących hooków `useWorldCup*`.
- Renderowany tylko gdy tournament mode on.

## 7. QA & rollout

- **09.06**: wszystko zmergeowane, `tournament_mode = off` na prod.
- **10.06 18:00**: włączenie flagi, smoke-test (desktop/mobile, dark/light, PWA), check cache hit-rate `worldcup_cache`.
- **Kill switch**: wyłączenie flagi w 5 s jeśli coś nie tak.
- **20.07**: auto-off przez datę + ręczne wyłączenie.

## Szczegóły techniczne

```
Pliki nowe:
  src/hooks/useTournamentMode.ts
  src/components/TournamentTheme.tsx
  src/components/MatchTicker.tsx
  src/components/TodaysMatchesBanner.tsx
  src/components/MatchOfTheDay.tsx
  src/components/worldcup/WorldCupStoryCircle.tsx
  src/components/worldcup/WorldCupStoryPanels.tsx
  src/components/LogoWorldCup.tsx

Pliki edytowane:
  src/index.css                       (blok .tournament-worldcup)
  src/App.tsx                         (TournamentTheme wrapper)
  src/components/Header.tsx           (warunkowe logo)
  src/components/WallpaperBackground.tsx (wariant worldcup)
  src/components/NewsCard.tsx         (warunkowy złoty ring)
  src/components/StoriesRow.tsx       (pinowany bubble)
  src/pages/Index.tsx                 (TodaysMatchesBanner + MatchOfTheDay)
  src/pages/admin/Settings.tsx        (switch trybu)

Migracja:
  INSERT INTO settings (key, value) VALUES ('tournament_mode','"off"')
  ON CONFLICT (key) DO NOTHING;

Edge function: worldcup-data bez zmian (cache wystarczy dla free tier).

Pamięć po wdrożeniu:
  update mem://style/world-cup-2026-theme + nowy mem://features/tournament-mode
```

## Świadomie pomijam (faza 2)

Maskotka, tabela typowań „Mój turniej", Match Center w blinkach, tryb „stadion nocą", push o golach, nowe endpointy Football-Data — nie zmieszczą się przed 11.06.

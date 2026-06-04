
## Cel

Skaner ma respektować, że niektóre źródła (np. Flashscore) mieszają na stronie startowej linki do artykułów i do stron meczów/wyników. Dodajemy filtr ścieżek per źródło i kierujemy Flashscore na właściwą sekcję redakcyjną.

## Zakres

### 1) Migracja DB — `news_sources`

Dodać kolumnę:
- `url_path_includes TEXT[] NULL` — lista fragmentów ścieżek, które muszą wystąpić w pathname linku, żeby został zaakceptowany przez skaner. NULL/[] = brak filtra (zachowanie jak dziś).

Przykład dla Flashscore: `['/wiadomosci/']`.

Nie ruszamy RLS ani policies (kolumna dziedziczy istniejące).

### 2) Update danych (osobny krok przez insert tool, po migracji)

Dla rekordu Flashscore w `news_sources`:
- `url` → `https://www.flashscore.pl/wiadomosci/`
- `url_path_includes` → `{/wiadomosci/}`

### 3) Edge function `scan-news-sources`

W miejscu, gdzie homepage'owe linki są filtrowane (po `firecrawlScrapeHomepageLinks` → zmienna `filtered`):

- Pobrać `source.url_path_includes` razem z resztą pól źródła.
- Po istniejącym filtrze dodać warstwę: jeśli `url_path_includes` jest niepustą tablicą, odrzucić linki, których `new URL(link).pathname` nie zawiera żadnego z tych fragmentów.
- Log diagnostyczny: `[scan] ${source.name} path_filtered=${linksAfter}/${linksBefore} (rules=${rules.join(',')})`.

Nie zmieniamy logiki dat ani semantic dedup.

### 4) UI — `src/pages/admin/SourcesList.tsx` (formularz źródła)

W formularzu edycji/dodawania źródła:
- Nowe pole "Ścieżki URL (filtr)" — input typu tag/chips lub textarea z linią per wartość.
- Helper: "Linki muszą zawierać przynajmniej jeden z tych fragmentów (np. `/wiadomosci/`, `/news/`). Puste = bez filtra."
- Walidacja: każdy fragment musi zaczynać się od `/`.
- Zapis do `news_sources.url_path_includes` jako `string[]` lub `null`, gdy puste.

### 5) Regeneracja typów

Po migracji `src/integrations/supabase/types.ts` zostanie odświeżony automatycznie — kod TS w edge function i UI używa nowego pola.

## Poza zakresem (świadomie)

- Brak `scan_url` (osobny URL do skanowania vs. wyświetlania) — nie potrzebujemy go, skoro `url` może wskazywać prosto na sekcję redakcyjną.
- Brak zmian w logice 24h, semantic dedup, `accepted_post_id`, bulk-prepare.
- Brak nowego trybu "treat_as_news=false" dla stron meczowych.

## Pliki

- `supabase/migrations/<timestamp>_news_sources_url_path_includes.sql` (nowy)
- `supabase/functions/scan-news-sources/index.ts` (rozszerzenie filtra linków + select pola)
- `src/pages/admin/SourcesList.tsx` (nowe pole formularza + obsługa zapisu)

## Test plan

1. Migracja przechodzi, kolumna widoczna w `news_sources`.
2. Update Flashscore: `url=/wiadomosci/`, `url_path_includes={/wiadomosci/}`.
3. Klik "Skanuj Flashscore" w `/admin/news-sources`:
   - W logach: `homepage_links=N filtered=M path_filtered=K/M`
   - `skipped_no_date` znacząco spada (artykuły mają `og:published_time`).
   - Pojawiają się nowe sugestie w `news_suggestions`.
4. Inne źródła (RMPL, sport.tvp itp.) bez `url_path_includes` działają jak dotąd (regresja zerowa).



## Diagnoza

Z logów widać: `RMF SPORT done: new=0 dup=0 skipped_old=15`. Wszystkie 15 kandydatów odrzucone jako stare/bez daty. Powody:

1. **Firecrawl Map zwraca evergreen / popularne URL-e**, nie najnowsze. Pierwsze 15 linków na liście to artykuły z 2008-2025 (Maradona, Bianchi, Radwańska itd.). To znana cecha `/v2/map` — ranking wg sygnałów linkowych, nie daty.
2. **`candidates.slice(0, 15)`** odcina pulę zanim w ogóle dotrzemy do dzisiejszych. Świeże newsy z dziś są dalej niż 15. miejsce.
3. WP Sport: większość trafień to `/zuzel/relacja-na-zywo/...` — strony bez `published_at` w meta, więc lecą w `skip (no publishedAt)`.
4. RMF zwraca też dziwne daty z przyszłości (2026-03-25 itd.) — to przez przesunięty zegar sandboxa, ale to niezależny problem.

## Rozwiązanie

Zmiana strategii discovery: zamiast brać pierwsze 15 z `Map`, **scrape'ujemy stronę główną źródła** i wyciągamy linki bezpośrednio z HTML (sekcja "najnowsze"), które są naturalnie świeże.

### Zmiany w `supabase/functions/scan-news-sources/index.ts`

1. **Nowa funkcja `firecrawlScrapeHomepageLinks(url)`** — scrape strony głównej z `formats: ["links", "rawHtml"]`, zwraca listę linków w kolejności występowania w HTML (czyli ~chronologicznie u większości serwisów newsowych).
2. **Hybrydowa strategia w pętli źródeł**:
   - Najpierw `scrapeHomepageLinks()` → daje świeże linki z headerów / list "najnowsze"
   - Fallback do `firecrawlMap()` jeśli homepage scrape zwróci <10 sensownych linków
3. **Zwiększenie puli kandydatów do scrape'owania metadanych**: zamiast `slice(0, 15)`, bierzemy `slice(0, 30)` i pętlę przerywamy po znalezieniu `maxPerSource` świeżych (czyli z ostatnich 24h). Nie marnujemy czasu jeśli już mamy 5 świeżych.
4. **Tolerancja dat z przyszłości** (≤ 7 dni do przodu) — żeby przesunięty zegar/strefa czasowa nie wycinał poprawnych newsów.
5. **Lepszy logging**: per-źródło raportować ile linków było analizowanych, ile miało datę, ile świeżych, ile bez daty.

### Zmiany w UI (`SuggestionsList.tsx`)

Po skanie pokażemy w toaście rozbicie per-źródło (`details`), żeby było widać który serwis zwrócił 0 z jakim powodem.

### Test po wdrożeniu

Klik "Skanuj wszystkie" → toast pokaże nowe + breakdown → sprawdzić `/admin/suggestions`.

### Plik do edycji

- `supabase/functions/scan-news-sources/index.ts` (główna zmiana — hybrydowy discovery)
- `src/pages/admin/SuggestionsList.tsx` (toast z details)


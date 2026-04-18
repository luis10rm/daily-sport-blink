

## Naprawa scan-news-sources — błędny parsing odpowiedzi Firecrawl

### Diagnoza (potwierdzona)

Test API Firecrawl pokazał:
- Endpoint `/v2/map` zwraca `links: [{url, title, description}, ...]` — **tablicę obiektów**, nie stringów
- Kod w `firecrawlMap()` robi `data.links || data.data?.links` i traktuje to jako `string[]`
- Filtr `isLikelyArticleUrl()` dostaje obiekty zamiast stringów → wszystko odrzuca → 0 kandydatów → 0 propozycji
- Brak błędów w logach, bo "technicznie" funkcja przeszła cały loop bez exception

Drugorzędnie: dużo wyników to URL-e sitemap.xml (`/sitemap-articles-XXXX.xml`) — trzeba je odfiltrować.

### Plan zmian (1 plik)

**`supabase/functions/scan-news-sources/index.ts`**

1. **Parser `firecrawlMap()`** — obsłuż obie formy odpowiedzi:
   - Jeśli element to obiekt → wyciągnij `.url`
   - Jeśli string → zostaw
   - Zwróć `string[]`
   - Zwiększ `limit` do `100` (więcej szans na świeże artykuły)

2. **`isLikelyArticleUrl()`** — dodaj filtry:
   - Wyklucz `.xml` (sitemapy)
   - Wyklucz ścieżki krótsze niż ~15 znaków bez slugu
   - Już jest `.xml` w wykluczeniach, ale linki kończą się np. `-2017.xml` — sprawdzić regex

3. **Lepsze logowanie diagnostyczne** — żeby następnym razem od razu widzieć problem:
   - `console.log` ile linków zwrócił Firecrawl (raw)
   - Ile przeszło filtr `isLikelyArticleUrl`
   - Ile było duplikatów (już istniejących w `news_suggestions`)
   - Ile poszło do scrape + AI

4. **Domyślnie pomiń sitemapy** w wynikach Firecrawl (`/sitemap`, `.xml`)

5. **Toast frontendowy** już pokazuje `new_suggestions` i `duplicates` — dodać do `details` per source: `total_links` (raw z Firecrawl) + `filtered` (po filtrze) — to już jest w `perSource`, tylko nieużywane w UI. Pozostawić bez zmian w UI.

### Rekomendacja dla użytkownika (poza kodem)

- **Flashscore** to portal z wynikami live, nie artykułami. Zamień na np. `https://sportowefakty.wp.pl`, `https://weszlo.com`, `https://www.meczyki.pl` — będą dawać więcej propozycji.

### Test po wdrożeniu

Po deploy: kliknij „Skanuj teraz" w `/admin/sources` → toast pokaże liczbę nowych propozycji → sprawdź `/admin/suggestions`.


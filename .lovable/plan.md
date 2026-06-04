## Diagnoza obecnego stanu

Na podstawie logów `scan-news-sources` z ostatnich uruchomień (źródło Interia):

```
[scan] Interia sport candidates=30
[scan] skip (no publishedAt): https://sport.interia.pl/tenis/turnieje
[scan] skip (no publishedAt): https://sport.interia.pl/pilka-nozna/euro
[scan] skip (no publishedAt): https://sport.interia.pl/tenis/profil-iga-swiatek,sppi,677871
... (×30)
[scan] Interia sport done: analyzed=30 new=0 dup=0 skipped_old=0 skipped_no_date=30
```

**Wynik: 0 nowych z 30 analizowanych = ~30 zmarnowanych wywołań Firecrawl / źródło / uruchomienie.**

### Pierwotne przyczyny

1. **Filtr `isLikelyArticleUrl` jest za luźny.** Przepuszcza strony kategorii (`/tenis/turnieje`, `/pilka-nozna/euro`), strony profili zawodników (`/tenis/profil-iga-swiatek,sppi,677871`) oraz strony tagów. Nie są to artykuły, więc nie mają `publishedAt` i lecą do kosza po pełnym Firecrawl scrape.
2. **Brak wczesnego przerwania.** Pętla analizuje wszystkie 30 kandydatów, nawet gdy 20 z rzędu nie ma daty — żadnego cut-offu.
3. **Sekwencyjne scrape'y meta** — 30× po kolei (~30–60s na źródło).
4. **Brak ścieżki RSS.** Interia, TVP Sport, Sport.pl, Przegląd Sportowy itd. mają oficjalne kanały RSS/Atom z gotowym `<pubDate>`, `<title>`, `<description>`, linkiem — bez Firecrawla, bez parsowania HTML, bez zgadywania daty.

## Co zrobimy (zakres zmian — wyłącznie edge function `scan-news-sources`)

### 1. RSS jako pierwsze źródło prawdy (największy efekt)
- Dodać pole `feed_url` w tabeli `news_sources` (opcjonalne) + UI w `SourcesList` do wpisania (na razie bez UI — tylko migracja kolumny; UI w kolejnym kroku).
- W skanerze: jeśli `feed_url` jest ustawiony → pobierz feed (`fetch` + parser XML), wyciągnij `link/title/description/pubDate/enclosure`. Brak Firecrawla na etapie discovery, mamy datę publikacji od ręki, filtr "ostatnie 24h" działa natychmiast.
- Tylko dla newsów, które przejdą filtr czasu i dedup po URL/tytule, robimy Firecrawl scrape (po obrazek/lead jeśli brak w RSS). Realnie: 5–10 wywołań Firecrawl/źródło zamiast 30.

### 2. Twardszy filtr "to artykuł, nie kategoria" (fallback dla źródeł bez RSS)
- Wymóg: ścieżka URL musi zawierać **wzorzec ID artykułu** typowy dla portali: `,nId,12345`, `,sppi,12345`, `-12345.html`, `/news/...-12345`, lub ścieżka z ≥3 segmentami i ostatnim segmentem ≥30 znaków zawierającym myślniki (slug artykułu).
- Czarna lista segmentów rozszerzona: `profil-`, `turnieje`, `wyniki`, `rozgrywki`, `liga-mistrzow`, `euro`, `mundial`, `bundesliga` itd. — to landingi kategorii, nie newsy.

### 3. Wczesne przerwanie pętli
- Jeśli pierwsze 10 kandydatów z rzędu nie ma daty publikacji → przerwij ten źródło, oznacz w logu `early_abort: bad_filter`. Oszczędza ~20 wywołań Firecrawl gdy filtr URL źle dobrał kandydatów.

### 4. Równoległe scrape'y meta (kontrolowany concurrency = 4)
- Zastąpić sekwencyjną pętlę `for ... await firecrawlScrapeMeta` puli z `Promise.all` po 4. Czas skanu źródła spada z ~60s do ~15s.

### 5. Statystyki efektywności w odpowiedzi
- Do zwracanego `details[]` dodać: `efficiency_pct = new / analyzed * 100`, `firecrawl_calls`, `used_rss: boolean`. Dzięki temu w UI `SourcesList` zobaczysz, które źródło marnuje budżet i które ma 0% trafień — szybka diagnoza.

## Zmiany w plikach

```text
supabase/migrations/<timestamp>_news_sources_feed_url.sql   (NEW)
  └─ ALTER TABLE news_sources ADD COLUMN feed_url text;

supabase/functions/scan-news-sources/index.ts                (EDIT)
  ├─ parseRssFeed(url)                — nowa funkcja, parser XML
  ├─ discoverArticles(source)         — wrapper: RSS jeśli feed_url, inaczej hybrid scrape
  ├─ isLikelyArticleUrl(...)          — zaostrzony regex + blacklist
  ├─ pętla po kandydatach             — concurrency 4 + early abort po 10 no-date
  └─ details[]                        — dorzucamy efficiency_pct, used_rss
```

## Czego NIE zmieniamy w tym kroku

- UI `SourcesList` (dodanie pola `feed_url` w formularzu) — proponuję jako kolejny krok po potwierdzeniu, że RSS faktycznie podnosi skuteczność.
- Cron scheduling, prompt AI scoringu, mechanizm dedup po tytule.
- Inne edge functions.

## Oczekiwany efekt

- **Interia z RSS**: ~10 kandydatów/scan, ~5–8 nowych propozycji (z datą), 0 niepotrzebnych Firecrawl scrape'ów na strony kategorii.
- **Czas skanu/źródło**: ~60s → ~15s.
- **Koszt Firecrawl**: ~70% mniej wywołań na uruchomienie.
- Logi i UI pokażą `efficiency_pct` zamiast tylko surowych liczników.

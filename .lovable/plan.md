
## Diagnoza efektywności (ostatni pełny skan, todayOnly=true)

| Źródło | filtered | analyzed | new | problem |
|---|---:|---:|---:|---|
| RMF SPORT | 35 | 5 | **5** | ✅ 100% – wzorzec |
| WP SPORT | 183 | 10 | 5 | połowa = `skipped_no_date` |
| TVP sport | 22 | 30 | 3 | 23× `skipped_old` – marnujemy Firecrawl |
| RMPL | 64 | 30 | 0 | 30× `skipped_old` – źródło rzadko publikuje newsy w stylu „Szortsy" |
| Flashscore | 52 | 10 | 0 | 10× `skipped_no_date` – brak `article:published_time` |
| Interia sport | 175 | 10 | 0 | 10× `skipped_no_date` – data renderowana JS |

**Wnioski:** dwie główne „dziury" to (1) brak wykrycia daty na Flashscore/Interia/część WP i (2) skanowanie starych artykułów w TVP/RMPL, co zżera limity Firecrawl bez efektu. RSS nie jest używany w żadnym źródle, choć wszystkie 6 portali je mają.

---

## Propozycja usprawnień (kolejność = priorytet)

### 1. Wpiąć RSS dla wszystkich źródeł (największy zysk)
Funkcja już obsługuje `feed_url` z RSS/Atom — wystarczy uzupełnić w DB. RSS daje pewną datę publikacji i ucina problem `skipped_no_date`.

Kandydaci do weryfikacji i wpisania:
- Interia sport → `https://sport.interia.pl/feed`
- RMF SPORT → `https://www.rmf24.pl/sport/feed`
- TVP sport → `https://sport.tvp.pl/rss.xml`
- WP SPORT → `https://sportowefakty.wp.pl/rss.xml`
- RMPL → `https://www.realmadryt.pl/rss/aktualnosci/`
- Flashscore → brak publicznego RSS, zostawiamy homepage + osobny fix dat (pkt 2).

**UI:** dodać pole „Feed URL (RSS)" w formularzu `SourcesList.tsx` (obok „Selektor CSS").
**DB:** kolumna `feed_url` już istnieje w typach? — sprawdzić; jeśli nie, migracja `alter table news_sources add column feed_url text`.

### 2. Lepsze wykrywanie daty PL w `firecrawlScrapeMeta`
Dla Flashscore/Interia (brak meta tagów) dodać fallbacki w kolejności:
1. URL slug zawiera `/YYYY/MM/DD/` lub `,YYYYMMDD,` → użyj jako data.
2. Pierwsze 2000 znaków `rawHtml`: regex polskich miesięcy (`5 czerwca 2026`, `wczoraj`, `dziś 14:32`) → mapowanie na ISO.
3. Heurystyka „artykuł z homepage" – jeżeli URL został znaleziony na świeżo zescrapowanej stronie głównej i nie ma daty, traktować jako „dziś" tylko gdy `trusted` ścieżka (jak Flashscore `/wiadomosci/`), żeby nie zalać śmieciami.

### 3. Sortowanie + early-abort dla `skipped_old`
Obecnie jest tylko early-abort dla `no_date`. Dodać identyczny dla `skipped_old`: gdy `EARLY_ABORT_OLD_STREAK = 8` z rzędu i `added=0` → przerwij. To natychmiast obetnie marnotrawstwo na RMPL/TVP (oszczędność ~30 wywołań Firecrawl/skan).

Dodatkowo, gdy źródło ma RSS – sortować `discovered` malejąco po `publishedAt` przed pętlą, żeby najnowsze leciały pierwsze.

### 4. Per-source `url_path_includes` dla Interia i RMPL
Filtr heurystyczny przepuszcza 175 (Interia) / 64 (RMPL) linków, ale dużo z nich to archiwum/tagi. Po szybkim oględzinach proponuję:
- Interia: `/news-` (artykuły mają w slugu `news-...,nId,XXXX`)
- RMPL: `/aktualnosci/`

To zmniejszy „filtered" do realnej puli newsów dnia i podniesie hit-rate AI scoringu.

### 5. Drobne porządki w logach/UI
- Log końcowy: dorzucić `early_abort` do toasta w `useNewsDiscovery.ts` (już zwracamy w details? – sprawdzić, dodać do UI).
- W tabeli źródeł pokazać „ostatni wynik" (np. `5 nowych / 10 analiz`) z `last_scan_stats` jsonb – pomaga adminowi widzieć, które źródło padło bez wchodzenia w logi.

---

## Pliki do zmiany

- `supabase/functions/scan-news-sources/index.ts` – pkt 2, 3 (date heuristics PL, sort, early-abort skipped_old).
- `src/pages/admin/SourcesList.tsx` + `src/hooks/useNewsDiscovery.ts` – pole `feed_url` w formie i edycji.
- Migracja (opcjonalnie) – kolumna `feed_url` + `last_scan_stats jsonb`.
- DB seed: ręczne UPDATE wpisujące `feed_url` dla 5 źródeł (po weryfikacji URL-i).

## Test po wdrożeniu

Klik „Skanuj wszystkie" powinien dać:
- Interia/RMF/TVP/WP/RMPL: `used_rss=true`, `skipped_no_date≈0`, `efficiency ≥ 60%`.
- Flashscore: `skipped_no_date < 50%` (dzięki heurystykom PL).
- TVP/RMPL: `firecrawl_calls` spadnie o ~60% dzięki early-abort.

## Zakres pominięty

- Nie ruszamy modelu AI, dedup semantycznego, ani logiki publikacji.
- Nie dodajemy nowych źródeł — najpierw uzdrowić obecne.

---

**Pytanie:** mam wdrożyć wszystko (1–5), czy zaczynamy od pkt 1+3 (najwyższy ROI, najmniej zmian) i resztę dorzucamy po pomiarach?

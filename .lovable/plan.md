## Problem

Flashscore zwraca `homepage_links=151 filtered=2 path_filtered=0/2` — filtr ścieżek nie ma czego filtrować, bo wcześniej heurystyka `isLikelyArticleUrl` odrzuca prawie wszystkie linki Flashscore:

- URL-e typu `/wiadomosci/tenis-french-open-wta-singiel-roland-garros-2026.../YaoGVABd/` lecą w `CATEGORY_BLACKLIST_RE` (zawierają `roland-garros`).
- ID artykułu (`YaoGVABd`) nie pasuje do `ARTICLE_ID_RE` (oczekuje formatu z przecinkiem + cyframi), slug w przedostatnim segmencie też nie łapie się na `hasLongSlug`.

## Fix

W `supabase/functions/scan-news-sources/index.ts`: jeśli źródło ma jawnie ustawione `url_path_includes`, ufamy temu filtrowi i pomijamy heurystyki (`isLikelyArticleUrl`, blacklisty kategorii, walidację slug/ID). Wymagamy tylko:

1. ten sam host co `source.url` i nie-asset (`sameHostAndNotAsset`)
2. `pathname` zawiera przynajmniej jeden fragment z `url_path_includes`

Dla źródeł bez `url_path_includes` zachowujemy obecne zachowanie (pełne heurystyki).

## Pliki

- `supabase/functions/scan-news-sources/index.ts` — zmiana logiki `filtered`, lepsze logi (`path_mode=trusted|heuristic`, ile linków przeszło).
- Deploy edge function.

## Test

Po deployu „Skanuj Flashscore" powinno dać `homepage_links=151 filtered=10-30 path_mode=trusted` i realne `analyzed/new` zamiast `discovered=0`.

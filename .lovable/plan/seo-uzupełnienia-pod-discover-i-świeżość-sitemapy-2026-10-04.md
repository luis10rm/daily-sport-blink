# SEO: uzupełnienia pod Discover i świeżość sitemapy

## Cel
Pomóc Google szybciej odbudować widoczność w Discover i karuzelach newsowych.

## Zmiany
1. **Duże podglądy zdjęć w Discover** – wszędzie, gdzie strona jest indeksowana, robots zmienia się z `index, follow` na `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`. Strony noindex zostają bez zmian.
2. **Świeże daty kategorii w sitemapie** – data aktualizacji kategorii (sport, Tech, Pozytywne) i strony głównej będzie datą najnowszego opublikowanego w niej wpisu, zamiast daty edycji samej kategorii. Dzięki temu Google widzi, że te strony codziennie się zmieniają.

## Po wdrożeniu (Ty)
Publikacja, potem w Search Console ręcznie „Poproś o zaindeksowanie” dla 5–10 najświeższych artykułów.

## Szczegóły techniczne
- `api/render.js`: domyślne `robots` (linia 67) i tagi z `force_index`/>=4 wpisów (linia 531) → wspólna stała `INDEX_ROBOTS`.
- `index.html`: meta robots z tą samą wartością (fallback dla SPA).
- `supabase/functions/sitemap/index.ts`: z już pobranych wpisów zbudować mapę `kategoria → max(published_at)` (sport po `sport_category_id`, pozytywne po `positive_category_id`, recenzje po `category_id` – dodać te kolumny do selectów); `lastmod` = max(najnowszy wpis, updated_at kategorii); `<lastmod>` dla `/`, `/tech`, `/pozytywne`. Bez zmiany adresów ani zakresu URL-i.
- Weryfikacja: surowy HTML `/` i artykułu (curl) oraz wywołanie funkcji sitemapy.

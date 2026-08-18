# Co zostało do zrobienia w SEO

Kroki 1–5 z roadmapy (World Cup CTR, meta patterns, noindex cienkich stron, sitemap, Discover/obrazy) są wdrożone. Sitemapa na `sitemap.szortsy.pl` już zawiera `/autor/*`, bez starych `/redakcja/*`. Zostały cztery luki.

## 1. Brakujące metadane SSR na trzech typach stron (krytyczne)

`/kategoria/{slug}`, `/autor/{slug}` i `/autorzy` nie mają w ogóle `head()` — Google widzi na nich globalny tytuł i opis z `__root`, bez canonical. To duplikaty tytułów w GSC i utrata CTR na kategoriach (piłka nożna, F1, tenis).

Dla każdej z tych tras: własny tytuł i opis (dla dynamicznych — z danych z loadera), `og:title`/`og:description`/`og:url`, self-referencing canonical. Do tego `CollectionPage` + breadcrumby dla kategorii i `Person`/`ProfilePage` dla autora (dziś schema Person leci tylko client-side, więc Google jej nie widzi).

## 2. Schema `Review` dla recenzji Tech (duży potencjał)

Artykuły Tech mają dziś tylko breadcrumby i FAQ. Brak `Review` z `itemReviewed` (Product) i `reviewRating` — to blokuje gwiazdki w wynikach wyszukiwania, czyli najtańszy wzrost CTR jaki mamy. Ocena jest już w bazie (`ScoreBadge`), więc wystarczy zmapować ją na `reviewRating` w JSON-LD trasy `/tech/{category}/{slug}`.

## 3. Odświeżenie `/llms.txt`

Plik ma nieaktualne dane: `/redakcja/{slug}` (dziś `/autor/{slug}`), `/tags` (dziś `/tagi`), canonical `https://www.szortsy.pl` zamiast `https://szortsy.pl`. Do poprawienia plus dopisanie huba MŚ i porównań Tech.

## 4. Domknięcie dwóch rzeczy odłożonych „na później"

- **301 dla duplikatów**: tabela `post_redirects` z narzędzia Duplikaty jest wypełniana, ale nic tych przekierowań nie obsługuje — stare adresy dają 404 zamiast 301. Można to obsłużyć bezpośrednio w SSR (trasa `/blink/{slug}` sprawdza tabelę i zwraca redirect), bez zewnętrznego workera.
- **Edge function `robots-meta`**: po migracji na SSR reguły noindex liczy już `head()` w trasach. Funkcja i podpięty do niej worker są zbędne — do usunięcia, żeby nie było dwóch źródeł prawdy.

## Kolejność

1 → 2 → 3 → 4. Punkt 1 i 2 to realny wpływ na kliknięcia; 3 i 4 to porządki. Mogę zrobić wszystko w jednym przebiegu albo zacząć od 1 i 2 i opublikować szybciej.

## Szczegóły techniczne

- Nowe `head()` w `src/routes/kategoria/$slug.tsx`, `src/routes/autor/$slug.tsx`, `src/routes/autorzy.tsx`, z loaderami przez `ensureQueryData` (wzór jak w `src/routes/blink/$slug.tsx`).
- Tytuły i opisy budowane przez istniejące `buildSeoTitle` / `buildSeoDescription` z `src/lib/seoTitle.ts`.
- JSON-LD przez `buildBreadcrumbList` z `src/lib/articleSchema.ts`; tam też nowy builder `buildReviewSchema`.
- Usunięcie client-side `SEO`/`getPersonSEO` z `src/pages/AuthorProfile.tsx` i `CategoryPage.tsx` po przeniesieniu do `head()`, żeby nie dublować skryptów.
- Punkt 4: obsługa `post_redirects` w loaderze `/blink/$slug` przez `redirect()` z `@tanstack/react-router`; usunięcie `supabase/functions/robots-meta`.

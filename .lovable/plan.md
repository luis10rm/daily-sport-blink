## Cel

Pokaż w liście propozycji od razu, że artykuł jest już opublikowany na stronie — bez uruchamiania flow przygotowania.

## Zmiany

### 1. `supabase/functions/scan-news-sources/index.ts`
- W preloadzie postów dodać `id, slug` obok `title, source_url`.
- Zbudować `postUrlMap: Map<normUrl, {id, slug, title}>` i `postTitleMap` z tym samym kontekstem.
- Przy wykryciu duplikatu (URL match lub jaccard ≥ 0.6) zapisać `accepted_post_id` = id najlepiej dopasowanego posta. Bez dodatkowych zapytań w pętli.

### 2. `src/hooks/useNewsDiscovery.ts`
- Nowy hook `useExistingPostsByUrls(urls: string[])` — jedno zapytanie `posts.select("id,slug,title,source_url").in("source_url", urls)`, zwraca `Map<articleUrl, {id,slug,title}>`. `enabled: urls.length > 0`.

### 3. `src/pages/admin/SuggestionsList.tsx`
- Po pobraniu sugestii: wywołać hook z listą `article_url`.
- Helper `getExistingPost(s)` → najpierw `existingMap.get(s.article_url)`, fallback przez `s.accepted_post_id` (jeśli scanner zapisał).
- Jeśli istnieje, renderuj na karcie:
  - zielony badge **"✅ Już na stronie"** (semantyczne tokeny — `bg-primary/15 text-primary border-primary/30`),
  - przycisk **"Otwórz na stronie"** linkujący do `/blink/{slug}` (target=_blank),
  - przyciski **"Przygotuj artykuł"** i checkbox bulk — `disabled` + tooltip "Ten artykuł jest już opublikowany". Zachowujemy "Mimo to przygotuj" w kebabie (na rzadkie przypadki).
- `selectHighScore()` i `toggleOne()` pomijają już-opublikowane.
- Nowy checkbox w pasku filtrów: **"Ukryj już opublikowane"** (default ON) — filtruje `suggestions` po stronie klienta, bez kasowania rekordów.

## Czego nie ruszam
- Schema bazy (`accepted_post_id` już istnieje), edge function `bulk-prepare-suggestions`, logika publikacji, progi podobieństwa.

## Efekt
Otwierasz listę → zielony badge i link do żywego artykułu od razu, bez wydłużania flow.

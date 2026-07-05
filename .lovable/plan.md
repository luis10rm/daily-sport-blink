## Cel
Uruchomić trzeci kanał obok Sport i Tech: **Pozytywne** — dobre wiadomości z kraju i ze świata. Funkcjonalność 1:1 z Sportem (feed, kategorie, story, archiwum, sugestie, tagi, admin, edge functions), własna tożsamość wizualna i komunikacyjna.

## Komunikacja i ton

- **Nazwa:** Pozytywne · slogan: „Dobre wiadomości z Polski i ze świata"
- **Ton głosu:** ciepły, ludzki, konkretny. Bez ironii, bez clickbaitu, bez sensacji, bez emoji w tytułach. Nagłówki pełne pozytywu ale rzeczowe („Uratowali 300 delfinów w Zatoce", nie „Nie uwierzysz co się stało…").
- **Reguła redakcyjna:** publikujemy tylko wiadomości o pozytywnym wydźwięku (postęp, pomoc, natura, nauka, sukcesy ludzi, wolontariat, dobre praktyki miast). Trudne tematy tylko jeśli mają realne, dobre zakończenie.
- **Mikrocopy:**
  - Homepage banner: „Dziś w Pozytywnych: X dobrych wiadomości"
  - Empty state: „Zbieramy dobre wiadomości. Wróć za chwilę."
  - Newsletter/social hook: „60 sekund. Lepszy dzień."

## Tożsamość wizualna (paleta „Świeża limonka")

Nowa klasa `mode-pozytywne` w `src/index.css` (analogicznie do `mode-recki`):

- **Akcent primary:** `#84cc16` (lime-500), hover `#65a30d`
- **Akcent świetlisty:** `#a3e635` (lime-400)
- **Powierzchnie light:** tło `#fefffb`, karty białe, delikatny gradient hero `linear-gradient(135deg, #ecfccb 0%, #f7fee7 100%)`
- **Dark mode:** tło `#0b1108` (bardzo ciemny oliwkowy), karty `#141c10`, akcent `#a3e635` z glow
- **Typografia:** ta sama Outfit (spójność brandu Szortsy)
- **Ikonografia headera:** `Sun` z lucide-react (limonkowy gradient jak Trophy/Cpu w Sport/Tech)

## Architektura danych

### 1. Migracja (schema)
- Dodać do `posts` kolumnę `channel text NOT NULL DEFAULT 'sport'` z CHECK `channel IN ('sport','positive')` — istniejące wiersze pozostają 'sport'.
- Dodać nullable `positive_category_id uuid` FK → nowa tabela `positive_categories`.
- Nowa tabela `positive_categories` (dokładny mirror `sport_categories`: `id, slug, name, icon_name, icon_url, bg_color, sort_order, is_active, created_at, updated_at`) + GRANT-y (`SELECT` dla `anon` — publiczne; pełen CRUD dla `authenticated` z RLS `is_admin_or_editor`; `ALL` dla `service_role`) + RLS.
- Indeks `posts(channel, published_at DESC)` pod feed.
- Rozszerzyć `sync_tags` i `sync_tags_for_row`, żeby liczyły tagi per kanał (dodać kolumnę `channel` do `tags` albo osobną tabelę `positive_tags`). **Decyzja:** dodać `channel` do `tags` z UNIQUE `(channel, name)` — mniej duplikacji kodu; migracja backfilluje istniejące na 'sport'.
- Seed 4-6 startowych kategorii pozytywnych: „Nauka", „Ludzie", „Natura", „Miasta", „Zdrowie", „Świat".

### 2. Kod (frontend + admin)

**Hooks (nowe pliki, mirror istniejących):**
- `src/hooks/usePositivePosts.tsx` — kopia `usePosts.tsx` z filtrem `channel='positive'`, join do `positive_categories`
- `src/hooks/usePositiveCategories.tsx` — mirror `useSportCategories.tsx`
- `useTags` rozszerzyć o parametr `channel`

**Strony publiczne (nowe):**
- `src/pages/PozytywneHome.tsx` — kopia `Index.tsx` z limonkowym designem, bez sekcji World Cup/Match, korzysta z `usePositivePosts`
- `src/pages/PozytywneCategoryPage.tsx` — mirror `CategoryPage.tsx`
- `src/pages/PozytywneBlinkPage.tsx` — mirror `BlinkPage.tsx` (albo wspólny `BlinkPage` z detekcją kanału po `post.channel` — **wybieram wspólny** żeby nie duplikować renderu artykułu, tylko nagłówek/footer/breadcrumb reagują na kanał)
- `src/pages/PozytywneArchive.tsx` — mirror `Archive.tsx`

**Komponenty (nowe, w `src/components/pozytywne/`):**
- `PozytywneHeader.tsx` (mirror `Header.tsx` + `ReckiHeader` — logo Sun, dropdown kategorii, ModeSwitcher rozszerzony)
- `PozytywneFooter.tsx`
- `PozytywneStoriesRow.tsx` (opcjonalnie później)

**ModeSwitcher (rozbudowa):**
Zamiast toggle 2-stanowego, dropdown „Kanał" z trzema opcjami: Sport (emerald/Trophy), Tech (fuchsia/Cpu), Pozytywne (lime/Sun). Aktywny stan podświetlony akcentem kanału.

**Routing (`src/App.tsx`):**
```
/pozytywne                           → PozytywneHome
/pozytywne/kategoria/:slug           → PozytywneHome (filter)
/pozytywne/:category/:slug           → BlinkPage (współdzielony)
/pozytywne/archiwum                  → PozytywneArchive
```
Slug artykułu w `posts` już unikalny; `BlinkPage` dobiera route breadcrumb/back-link po `post.channel`.

**Admin:**
- Sidebar `AdminLayout.tsx` — dodać sekcję „Pozytywne" z linkami:
  - `/admin/pozytywne` — `PositivePostsList` (mirror `PostsList` z filtrem `channel='positive'`)
  - `/admin/pozytywne/new` i `/:id/edit` — reused `PostEditor` z propem/query param `?channel=positive` (przełącza dropdown kategorii i zapisuje `channel`)
  - `/admin/pozytywne/kategorie` — `PositiveCategoriesList` + edytor (mirror `CategoriesList` + `CategoryEditor`)
  - `/admin/pozytywne/sugestie` — filtruje `news_suggestions` po nowej kolumnie `channel` (dodać ją w tej samej migracji)
- `PostEditor` – dodać selector kanału na górze (Sport/Pozytywne) domyślnie wg query param; ukryć pola sport-only (sport_category dropdown) gdy `channel='positive'`, pokazać dropdown `positive_categories`.
- Dashboard admina — dodać kafelek „Pozytywne" (licznik postów z ostatnich 7 dni).

**Edge functions:**
- `scan-news-sources` i `bulk-prepare-suggestions` — dodać parametr `channel`; `news_sources` też dostaje kolumnę `channel` (żeby scanner wiedział, do którego feedu wrzucać). Dla wersji MVP: w migracji dodać kolumnę i domyślnie 'sport'; admin może oznaczyć źródła jako 'positive'.
- `generate-article-image`, `generate-daily-summary`, `notify-google-index`, `sitemap`, `publish-to-social` — bez zmian schema, tylko sitemap dodaje ścieżki `/pozytywne/*`.

**SEO:**
- Osobny sitemap section w edge function `sitemap` dla `/pozytywne/*`.
- `SEO.tsx` — helper `getPositiveSEO()` z brand name „Szortsy Pozytywne".
- `robots.txt` bez zmian.

### 3. Zakres MVP w tej iteracji
- Migracja bazy (posts.channel, positive_categories, tags.channel, news_suggestions.channel, news_sources.channel, seed kategorii)
- ModeSwitcher 3-stanowy
- `/pozytywne` home + kategoria + archiwum + współdzielony BlinkPage z rozpoznawaniem kanału
- Admin: lista postów, edytor postów z selectorem kanału, lista+edytor kategorii pozytywnych, sugestie z filtrem kanału
- Skin `mode-pozytywne` w CSS (light + dark)
- Sitemap edge function rozszerzony o pozytywne

### 4. Poza zakresem tej iteracji (do zrobienia potem)
- Stories dla kanału Pozytywne (na start bez)
- Osobny Patron Bar / Wallpaper takeover per kanał
- Osobne analytics events per kanał (można dodać `channel` do payloadu w drugim kroku)
- Newsletter dedykowany

## Pliki

**Migracje:** 1 plik SQL (schema + seed kategorii).

**Nowe pliki kodu:**
- `src/hooks/usePositivePosts.tsx`
- `src/hooks/usePositiveCategories.tsx`
- `src/pages/PozytywneHome.tsx`
- `src/pages/PozytywneCategoryPage.tsx`
- `src/pages/PozytywneArchive.tsx`
- `src/components/pozytywne/PozytywneHeader.tsx`
- `src/components/pozytywne/PozytywneFooter.tsx`
- `src/pages/admin/PositivePostsList.tsx`
- `src/pages/admin/PositiveCategoriesList.tsx`
- `src/pages/admin/PositiveCategoryEditor.tsx`

**Modyfikacje:**
- `src/index.css` (skin `mode-pozytywne`)
- `src/App.tsx` (route’y)
- `src/components/recki/ModeSwitcher.tsx` → refactor na 3-stanowy dropdown (przenieść do `src/components/ChannelSwitcher.tsx`)
- `src/pages/BlinkPage.tsx` (routing back-link/breadcrumb per `post.channel`)
- `src/pages/admin/PostEditor.tsx` (selector kanału, warunkowy dropdown kategorii)
- `src/pages/admin/PostsList.tsx` (filtr `channel='sport'` żeby nie mieszać)
- `src/pages/admin/SuggestionsList.tsx` (filtr `channel`)
- `src/pages/admin/Dashboard.tsx` (kafelek Pozytywne)
- `src/components/admin/AdminLayout.tsx` (sekcja nav)
- `src/hooks/useTags.tsx` (parametr channel)
- `src/hooks/useSocialPosts.ts` — bez zmian
- `supabase/functions/sitemap/index.ts` (ścieżki pozytywne)
- `supabase/functions/scan-news-sources/index.ts` (channel na source)
- `supabase/functions/bulk-prepare-suggestions/index.ts` (channel)
- `src/integrations/supabase/types.ts` (auto-regen po migracji — nie edytujemy ręcznie)

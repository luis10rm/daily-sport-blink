## Bulk publish propozycji — wdrożenie

### Decyzje
- **Tryb zapisu:** od razu publish (`published_at = now()`).
- **Concurrency:** 3 równolegle (bezpiecznie dla Gemini rate-limit).
- **Obrazki:** bez AI w bulk — użyjemy `image_url` z propozycji lub fallback kategorii. Redaktor może dogenerować obrazek ręcznie w edytorze post-publish.

### Flow użytkownika
1. W `/admin/suggestions` przy każdej karcie pojawia się checkbox.
2. U góry — sticky pasek z licznikiem zaznaczonych: „Zaznacz wszystkie ze score ≥ 7", „Wyczyść zaznaczenie".
3. Przyciski akcji bulk: **„Opublikuj N zaznaczonych"** (primary) + **„Odrzuć N"** (outline).
4. Klik „Opublikuj N" → confirm dialog („Opublikujesz N artykułów od razu na stronie głównej. Kontynuować?") → wywołanie edge function.
5. Toast progresywny: „Przetwarzam 3/8…", potem „✅ Opublikowano 7 (1 błąd)".
6. Karty znikają z listy `pending` (status zmienia się na `published`).

### Edge function: `bulk-prepare-suggestions`
- Auth: JWT → `is_admin_or_editor`.
- Input: `{ suggestion_ids: string[] }` (Zod, max 20).
- Pobiera propozycje z DB (status `pending` lub `duplicate`).
- Przetwarza w batchach po 3 równolegle (`Promise.allSettled`):
  - Wywołuje wewnętrznie `extract-article` (reuse istniejącego — invoke przez supabase.functions.invoke z service role).
  - Z wyniku tworzy rekord w `posts`:
    - `title`, `excerpt`, `content`, `tags`, `category_id`, `image_url` (z propozycji lub null), `source_url` (z propozycji), `published_at = now()`, `created_by = user.id`.
    - `slug` generuje się automatycznie przez trigger.
  - Aktualizuje `news_suggestions`: `status = 'published'`, `accepted_post_id = nowyId`.
  - W przypadku błędu — `status` propozycji bez zmian, zwraca info do response.
- Response: `{ successful: [{suggestion_id, post_id, slug}], failed: [{suggestion_id, error}] }`.
- Po stronie klienta: invalidate query `news_suggestions` + `posts` + (opcjonalnie) trigger `notify-google-index` dla każdego nowego posta.

### Indeksowanie Google
Po sukcesie każdy nowy post zostanie wysłany do `notify-google-index` (fire-and-forget, jak w istniejącym single flow). Nie blokuje response.

### Obsługa błędów
- Timeout pojedynczej ekstrakcji (~50 s) → ten jeden artykuł leci do `failed`, reszta dalej.
- Limit Lovable AI (429) → retry 1× po 3 s, potem fail.
- Cała funkcja ma timeout ~120 s (max edge function); dla 20 artykułów x 50 s / 3 równolegle = ~330 s — **dlatego limit 6 sztuk per wywołanie** (6/3 × 50 s = 100 s, mieści się).

### Pliki do edycji / utworzenia
- nowy: `supabase/functions/bulk-prepare-suggestions/index.ts`
- `src/pages/admin/SuggestionsList.tsx` — checkboxy, sticky bar, mutacja
- nowy hook: `src/hooks/useBulkPrepareSuggestions.ts`

### Brak migracji DB
Nie potrzebujemy nowych kolumn — używamy istniejącego flow `published_at = now()` i `accepted_post_id`.

### Co później (poza tym tasku)
- Punkt 2 z poprzedniego planu (status draft + bulk publish z PostsList) — jeśli zmienisz zdanie i będziesz chciał tryb review.
- Auto-pilot dla score ≥ 9.
- Bulk push na FB.

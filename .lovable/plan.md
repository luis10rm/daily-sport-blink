
## Cel
W edytorze TECH (`/admin/recki/:id/edit`) dodać panel "Znajdź zdjęcia produktu w Google", który zwraca siatkę miniatur. Klik na miniaturę pobiera zdjęcie do bucketa `review-images` i dopina je do `gallery` (z opcją ustawienia jako główne ⭐ — już istnieje).

## Wymagane sekrety (jednorazowo)
Użytkownik musi założyć dwa klucze Google (darmowy tier: 100 zapytań/dobę):
- `GOOGLE_CSE_API_KEY` — z Google Cloud Console → Custom Search API
- `GOOGLE_CSE_CX` — ID wyszukiwarki z https://programmablesearchengine.google.com (z włączoną opcją "Image search" i "Search entire web")

Przed implementacją poproszę o nie przez `add_secret`. W chacie wyjaśnię krok po kroku gdzie je wziąć.

## Zakres zmian

### 1. Edge function `supabase/functions/search-product-images/index.ts` (nowa)
- Input: `{ query: string, num?: number }` (Zod walidacja, max 10).
- Wywołanie: `GET https://www.googleapis.com/customsearch/v1?key=...&cx=...&q=...&searchType=image&num=10&safe=active&imgSize=large`.
- Zwraca odfiltrowaną listę `{ url, thumbnail, width, height, source, title }`.
- CORS + verify JWT (admin/editor only — pobiera `user_roles`).
- Obsługa 429/403 (quota) z czytelnym komunikatem.

### 2. Edge function `supabase/functions/import-image-to-gallery/index.ts` (nowa)
- Input: `{ review_id: string, image_url: string }`.
- Pobiera zdjęcie serwerowo (omija CORS/hotlink), waliduje content-type (`image/*`) i rozmiar (<10 MB).
- Upload do bucketa `review-images` pod `reviews/{review_id}/google-{uuid}.{ext}`.
- Zwraca publiczny URL (signed URL jeśli bucket prywatny — obecnie `review-images` jest **private**, więc zwracamy długoterminowy signed URL, lub rozważymy upublicznienie — patrz pytanie poniżej w "Otwarte").
- Frontend dopisuje URL do `form.gallery` przez `setValue`.

### 3. UI w `src/pages/admin/ReviewEditor.tsx`
Nowa karta "Wyszukaj zdjęcia produktu w Google" tuż nad sekcją Galeria:
- Input `query` z pre-fillem `${product_brand} ${product_name}` (auto-aktualizacja przy edycji tych pól, dopóki user sam nie zmienił).
- Przycisk "Szukaj" → wywołuje `search-product-images`.
- Siatka 5 kolumn × 2 wiersze miniatur. Hover: powiększenie + źródło (domena).
- Klik na miniaturę: spinner → `import-image-to-gallery` → dopisanie do `gallery` + toast "Dodano do galerii".
- Już dodane URL-e wyszarzone z ✓.
- Disclaimer pod siatką: "Zdjęcia mogą podlegać prawom autorskim — sprawdź licencję przed publikacją."

### 4. Bezpieczeństwo / RLS
- Obie funkcje wymagają roli `admin` lub `editor` (sprawdzenie tokenu i `user_roles`).
- Bucket `review-images` pozostaje prywatny; w `ReviewCard` i `ReckiReview` zdjęcia z galerii już są pokazywane — sprawdzę czy to działa przez signed URL czy public. Jeśli przez public — przełączymy bucket na public (lub generujemy długie signed URL przy zapisie).

## Co bez zmian
- Schemat `reviews.gallery` (text[]).
- Sekcja "Zdjęcie główne" + przycisk ⭐ na miniaturze galerii.
- AI generator, ImageUploader.

## Otwarte do potwierdzenia (1 pytanie)
Bucket `review-images` jest obecnie **prywatny**. Żeby zdjęcia produktów działały bez kombinowania z odświeżaniem signed URL na stronie publicznej `/tech`, najczystsze jest upublicznienie tego bucketa (tak jak `post-images`). Czy mogę go przełączyć na public przy tej okazji? Jeśli nie — zostaję przy signed URL z długim TTL (1 rok, odnawiane przy odczycie).

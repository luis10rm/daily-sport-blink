## Plan: przejście z Google CSE na SerpApi (Google Images)

### 1. Sekret
- Wymagam od Ciebie klucza `SERPAPI_KEY` (przez `add_secret`).
- Klucz wygenerujesz na https://serpapi.com → Dashboard → Your Private API Key.
- Free plan: 100 zapytań/miesiąc — wystarcza na testy. Płatny od $75/mo (5k zapytań).

### 2. Edge function
Refaktor `supabase/functions/search-product-images/index.ts`:
- Usuwam wywołania do `customsearch.googleapis.com` oraz odwołania do `GOOGLE_CSE_API_KEY` / `GOOGLE_CSE_CX`.
- Nowe wywołanie:
  ```
  GET https://serpapi.com/search.json
    ?engine=google_images
    &q={query}
    &api_key={SERPAPI_KEY}
    &num=20
    &hl=pl
    &gl=pl
    &safe=active
  ```
- Mapuję `images_results[].original` → `imageUrl`, `images_results[].thumbnail` → `thumbnailUrl`, `images_results[].source` → `sourceDomain`, `images_results[].title` → `title`, plus `original_width`/`original_height`.
- Zachowuję istniejący kontrakt zwrotki (`{ images: [...] }`), żeby frontend `ReviewEditor.tsx` (modal „Szukaj zdjęć produktu") działał bez zmian.
- Obsługa błędów: 402 (quota) → komunikat „Wyczerpano limit SerpApi", 401 → „Nieprawidłowy klucz", inne → generyczny 502.
- Retry-once przy timeout (analogicznie jak w `generate-review`).

### 3. Czyszczenie
- Stare sekrety `GOOGLE_CSE_API_KEY` i `GOOGLE_CSE_CX` zostają w panelu (nieaktywne) — możesz je później ręcznie usunąć w Backend → Secrets. Nie kasuję ich automatycznie, żeby nic nie zepsuć w razie rollbacku.
- README/komentarze w funkcji aktualizuję na SerpApi.

### 4. Walidacja
- `curl_edge_functions` z testowym query („vivo x300 ultra") → sprawdzam, że wraca ≥10 obrazków z różnych domen.
- Manualny test w `ReviewEditor.tsx` → modal wyszukiwania pokazuje miniatury, klik dodaje URL do galerii.

### Co dostaniesz
- W edytorze TECH wyszukiwarka grafik wraca do pełnej funkcjonalności (cała sieć, nie tylko białe listy domen).
- Możliwość późniejszej łatwej zmiany dostawcy (cała logika w jednym pliku edge function).

Po akceptacji poproszę Cię o wklejenie `SERPAPI_KEY` w bezpiecznym formularzu.
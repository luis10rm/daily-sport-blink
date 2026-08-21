# Optymalizacja wagi grafik (obrazki, logo, OG)

## Co wykazał skan

Główny problem: obrazki artykułów są wrzucane i serwowane jako **surowe PNG-i w pełnej rozdzielczości**.

| Źródło | Stan obecny | Uwagi |
|---|---|---|
| `post-images` (70 plików) | **109 MB**, średnio **1,6 MB/plik**, 69/70 to PNG | największy problem |
| Największe pliki | 3,0 MB / 2,7 MB / 2,5 MB PNG | serwowane w kafelkach o szerokości ~380 px |
| `category-icons` (18) | 9,8 MB, średnio 544 kB PNG | ikonki rysowane w 32–40 px |
| `wallpapers` (2) | 4,0 MB, ~2 MB/plik | |
| Logo w headerze (`logo-icon.png`) | 2000×2000 px, 58 kB | renderowane w 28 px |
| `favicon.png` | 2000×2000 px, 58 kB | używane też jako ikona PWA 192 px |
| Domyślne grafiki kategorii | 47–156 kB WebP, 1200×672 (daily-summary 1920×1080) | jedyny w miarę zoptymalizowany zestaw |

Weryfikacja realnego zysku (na pliku 3,0 MB, przez transformację obrazów w backendzie):

- `width=400, q=65` → **66 kB** (WebP)
- `width=800, q=60` → **135 kB**
- `width=1200, q=70` → **220 kB**

Czyli **~95% redukcji** na obrazkach artykułów, bez zmiany plików w bazie i bez zmiany URL-i artykułów.

Dodatkowo: żaden `<img>` nie ma `srcset`/`sizes`, więc telefon pobiera wersję desktopową; obraz w `NewsOfTheDay` i `BlinkPage` jest LCP.

## Plan (kolejność wdrożenia)

### Etap 1 — Serwowanie: jeden helper + komponent obrazka (największy zysk, najmniejsze ryzyko)
1. Helper `src/lib/imageUrl.ts`: dla URL-i ze storage backendu przepisuje `/object/public/...` na endpoint transformacji z `width` i `quality`; obce URL-e (crest-y, zewnętrzne zdjęcia) i pliki lokalne zwraca bez zmian.
2. Komponent `src/components/OptimizedImage.tsx`: generuje `srcset` (400/800/1200/1600 w), przyjmuje `sizes`, ustawia `decoding="async"`, `loading`/`fetchpriority`, `width`/`height` (stały aspekt → zero CLS).
3. Podmiana w miejscach ruchu: `NewsCard`, `NewsOfTheDay`, `BlinkPage`, `CrossChannelStrip`, `ReviewCard` (wszystkie warianty), `StoriesViewer`/`StoriesCircle`, `AuthorCard`/`AuthorHero`, kafelki Pozytywne, `TodaysNewsBanner`.
4. LCP: hero (`NewsOfTheDay`, `BlinkPage`) dostaje `fetchpriority="high"` + `preload` w `<head>` wariantu mobilnego; pozostałe zostają `loading="lazy"`.

### Etap 2 — Wejście: kompresja przy uploadzie (żeby problem nie wracał)
5. `ImageUploader` / `WallpaperImageUploader` / `ImageCropModal`: przed uploadem downscale do maks. 1600 px szerokości i konwersja do WebP (`canvas.toBlob('image/webp', 0.8)`), limit wejścia zostaje 5 MB, ale na storage ląduje 100–250 kB.
6. `generate-article-image` i `generate-category-icon`: obrazek z AI zapisywany jako WebP (ikony dodatkowo skalowane do 256 px) zamiast pełnego PNG.

### Etap 3 — Statyczne grafiki i ikony
7. Rekompresja domyślnych grafik kategorii do 1600×896 q=72 (oczekiwane 47–156 kB → ~25–60 kB), `daily-summary` z 1920 px do 1600 px.
8. `logo-icon.png` / `logo-text.png` / `favicon.png`: warianty 256 px i 64 px (WebP dla UI, PNG tylko dla PWA/favicon) — z 58 kB do ~4–8 kB.
9. `og-image.png` → JPEG/WebP 1200×630 (46 kB → ~25 kB), z zachowaniem obecnych ścieżek dla scraperów.

### Etap 4 — Porządki i kontrola
10. Skrypt raportujący najcięższe pliki w storage (do panelu admina lub jako notatka), żeby wychwytywać regresje.
11 Weryfikacja po wdrożeniu: pomiar wagi strony głównej i `/blink/*` przed i po (transfer obrazów w KB) na mobile.

## Uwagi techniczne
- Nie zmieniamy plików już wgranych do storage ani URL-i artykułów — Etap 1 działa czysto po stronie odczytu (transformacja on-the-fly z cache CDN).
- Zewnętrzne obrazki (np. herby drużyn z API World Cup) nie przechodzą przez transformację; tam zostają `loading="lazy"` i stałe wymiary.
- Transformacja obrazów zwraca WebP tylko dla przeglądarek wysyłających `Accept: image/webp` — starsze klienty dostaną PNG/JPEG, więc nie ma ryzyka zepsutych obrazków.
- Stałe `width`/`height` w `OptimizedImage` poprawią też CLS, co jest osobnym plusem dla Core Web Vitals.

## Szacowany efekt
- Strona główna: spadek transferu obrazów o **80–90%**.
- Strona artykułu z obrazkiem AI: z ~2,5 MB do ~150–250 kB.
- Panel admina (listy z miniaturami): z kilku MB na widok do kilkuset kB.

# Krok 3 roadmapy SEO: Google Discover — obrazy i daty

Cel: spełnić dwa twarde wymagania Discovera — duże obrazy (min. 1200 px szerokości, licencja na duży podgląd) oraz poprawne, wiarygodne daty w danych strukturalnych. Dziś oba punkty mamy częściowo.

## Co wynika z audytu

- Artykuły sportowe (`/blink/:slug`) mają pełny `NewsArticle` z datami i obrazem 1200x675 — ale szerokość 1200 jest **zadeklarowana na sztywno**, niezależnie od faktycznego pliku. Jeśli realny obraz jest mniejszy, Google to wykryje i pominie duży podgląd.
- Artykuły Tech (`/tech/:kategoria/:slug`) i Pozytywne (`/pozytywne/:kategoria/:slug`) mają `og:image`, ale **nie mają JSON-LD z datami** (`datePublished` / `dateModified`) ani `Article`/`NewsArticle` — czyli praktycznie nie kwalifikują się do Discovera.
- CMS (uploader + kadrowanie) **nie waliduje szerokości** — kadrowanie zapisuje dokładnie tyle pikseli, ile wyciął użytkownik, więc łatwo wgrać obraz 800 px.
- Brak fallbacku: gdy artykuł nie ma obrazu, wchodzi ogólne `og-image.png` — dla Discovera to sygnał „brak unikalnego obrazu”.
- `og:image` jest ustawiony też w `__root.tsx`; podstrony go nadpisują, ale trzymanie go w korzeniu jest ryzykowne przy każdej nowej trasie bez własnego obrazu.

## Propozycja (kolejność = od największego efektu)

### 1. Daty i schema dla Tech i Pozytywne (największy zysk)
Dodać w `head()` obu tras JSON-LD:
- Tech: `Article` (recenzje/rankingi to nie news) + `BreadcrumbList`, z `datePublished`, `dateModified`, autorem, wydawcą, `image` jako `ImageObject`.
- Pozytywne: `NewsArticle` + `BreadcrumbList`, analogicznie.
Dodać też `article:published_time` / `article:modified_time` w OG, jak w `/blink`.

### 2. Uczciwe wymiary obrazu w schema
Zapisywać realne wymiary obrazu przy uploadzie (nowe kolumny `image_width`, `image_height`) i używać ich w `ImageObject` zamiast sztywnego 1200x675. Gdy wymiarów nie znamy — pominąć `width/height` (bezpieczniejsze niż kłamać).

### 3. Wymuszenie ≥1200 px w CMS-ie
- Uploader: odrzuca pliki źródłowe węższe niż 1200 px z jasnym komunikatem.
- Kadrowanie: wynikowy obraz skalowany w górę wyjściowo do 1200 px szerokości (bez upscalingu ponad źródło) i zapisywany jako JPEG 0.85 — plus blokada, jeśli wykadrowany obszar jest węższy niż 1200 px w źródle.
- Widoczna podpowiedź w edytorze: „Discover wymaga obrazu min. 1200 px szerokości”.

### 4. Higiena dateModified
Nie podbijać `dateModified` przy kosmetycznych zmianach: w schema używać `updated_at` tylko, gdy różni się od `published_at` o więcej niż kilka minut — inaczej podawać samą `datePublished`. Chroni przed sygnałem „ciągle podgrzewany news”.

### 5. Porządek w OG (nice to have)
Usunąć `og:image` / `twitter:image` z `__root.tsx` i zostawić je wyłącznie na trasach liściowych, gdzie mamy konkretny obraz; strona główna dostaje własny wpis.

### 6. Audyt zaległych treści
Raport w adminie (lub jednorazowy przegląd): artykuły z ostatnich 30 dni bez obrazu albo z obrazem węższym niż 1200 px — lista do ręcznego podmienienia. To ta część, która realnie odblokowuje Discovera dla już opublikowanych tekstów.

## Szczegóły techniczne

- Zmiany w `src/routes/tech/$category/$slug.tsx`, `src/routes/pozytywne/$category/$slug.tsx` (schema + OG czasu), `src/routes/blink/$slug.tsx` (wymiary, dateModified).
- Migracja: `posts.image_width`, `posts.image_height` (int, nullable) + odpowiedniki dla tabeli recenzji Tech; GRANT-y jak dla pozostałych kolumn (bez zmian w politykach).
- `src/components/admin/ImageUploader.tsx` + `ImageCropModal.tsx`: walidacja szerokości, skalowanie kanwy do 1200 px, zwracanie wymiarów do formularza.
- Helper `src/lib/articleSchema.ts` — wspólne budowanie JSON-LD dla trzech kanałów, żeby nie duplikować logiki.
- Widok audytu: prosta strona w adminie czytająca posty bez obrazu / z `image_width < 1200`.

## Zakres do potwierdzenia

Punkty 1-4 proponuję zrobić od razu (to sedno Discovera). Punkty 5-6 mogę zrobić w tej samej turze albo odłożyć.

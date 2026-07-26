## Cel

Dodać w panelu administracyjnym dedykowaną zakładkę **„Kategorie Tech"** do zarządzania kategoriami recenzji (tabela `review_categories`) — analogicznie do istniejących paneli Kategorii Sportowych i Kategorii Pozytywnych.

## Obecny stan

- Tabela `review_categories` już istnieje w bazie i ma wszystkie potrzebne pola: `id`, `name`, `slug`, `description`, `icon_url`, `color`, `sort_order`, `created_at`, `updated_at`.
- Polityki RLS i GRANT-y są już skonfigurowane: admin/redaktor może tworzyć / edytować / usuwać, wszyscy mogą widzieć.
- W frontendzie jest tylko hook `useReviewCategories` (pobieranie listy). Nie ma hooków do tworzenia, edycji, usuwania ani zmiany kolejności.
- W menu admina brak pozycji „Kategorie Tech".
- W `ReviewEditor.tsx` kategoria jest wybierana z selecta, ale nie ma szybkiego tworzenia kategorii z poziomu formularza (w przeciwieństwie do PostEditora dla Sportu).

## Plan wdrożenia

### 1. Rozszerzenie hooków kategorii Tech

W pliku `src/hooks/useReviews.tsx` dodać:
- `useReviewCategory(id)` — pobieranie jednej kategorii.
- `useCreateReviewCategory()` — tworzenie nowej kategorii.
- `useUpdateReviewCategory()` — aktualizacja kategorii.
- `useDeleteReviewCategory()` — usuwanie z walidacją, czy nie ma przypisanych recenzji.
- `useReorderReviewCategories()` — zmiana kolejności (analogicznie do sportowych).

### 2. Lista kategorii Tech

Nowy plik: `src/pages/admin/ReviewCategoriesList.tsx`
- Tabela z kolumnami: podgląd koloru, nazwa, slug, kolejność, akcje.
- Przyciski: edytuj, usuń.
- Przycisk „Nowa kategoria" w nagłówku.
- Drag-and-drop do zmiany kolejności (tak jak w `CategoriesList.tsx`).
- Dialog potwierdzenia usunięcia.

### 3. Edytor kategorii Tech

Nowy plik: `src/pages/admin/ReviewCategoryEditor.tsx`
- Formularz oparty na `react-hook-form` + `zod`:
  - Nazwa (wymagana)
  - Slug (wymagany, walidacja małe litery/cyfry/myślniki)
  - Opis (opcjonalny)
  - Kolor akcentu (input color + hex)
  - URL ikony (opcjonalny, tekstowy URL)
  - Kolejność (liczba całkowita)
- Tryb tworzenia i edycji (obsługa parametru `id`).
- Po zapisaniu przekierowanie z powrotem do listy.

### 4. Routing

W `src/App.tsx` dodać trasy pod `/admin/recki`:
- `/admin/recki/kategorie` → `ReviewCategoriesList`
- `/admin/recki/kategorie/new` → `ReviewCategoryEditor`
- `/admin/recki/kategorie/:id/edit` → `ReviewCategoryEditor`

### 5. Menu admina

W `src/components/admin/AdminLayout.tsx` dodać pozycję nawigacyjną **„Kategorie Tech"** pod istniejącym „Tech" (dostępna dla adminów i redaktorów, bo polityki RLS na to pozwalają).

### 6. Usprawnienie w edytorze recenzji (opcjonalnie, wykonać jeśli starczy zakresu)

W `src/pages/admin/ReviewEditor.tsx`:
- Po zapisaniu nowej kategorii odświeżać listę kategorii w selecta.
- Rozważyć mini przycisk „+" do szybkiego utworzenia kategorii bez opuszczania formularza (tak jak `QuickCategoryDialog` w PostEditorze).

## Co pozostaje bez zmian

- Nie zmieniamy struktury tabeli `review_categories` — wszystkie potrzebne kolumny i polityki już istnieją.
- Nie zmieniamy publicznych ścieżek URL kategorii Tech (`/tech/kategoria/:slug`).
- Nie zmieniamy sposobu przypisywania kategorii do recenzji — wciąż przez `category_id`.

## Kryteria akceptacji

- Admin/redaktor widzi w menu „Kategorie Tech".
- Może dodać, edytować, usunąć i zmienić kolejność kategorii.
- Kategoria jest od razu dostępna w selecta w `ReviewEditorze`.
- Usunięcie kategorii przypisanej do recenzji jest blokowane z czytelnym komunikatem.
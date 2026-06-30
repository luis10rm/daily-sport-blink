
## Cel
W edytorze recenzji/newsów TECH (`/admin/recki/:id/edit`) dodać możliwość ustawiania zdjęcia głównego jednym kliknięciem na dowolne zdjęcie z galerii — bez ponownego uploadowania.

## Zakres zmian

### 1. Karta „Galeria zdjęć" w `src/pages/admin/ReviewEditor.tsx`
Na każdym kafelku galerii dodajemy w lewym górnym rogu mały przycisk (ikona gwiazdki / „Ustaw jako główne"):
- Kliknięcie ustawia `cover_image_url` na URL tej miniatury.
- Aktywna miniatura (ta sama URL co `cover_image_url`) dostaje złoty ring + plakietkę „Główne".
- Toast: „Ustawiono jako zdjęcie główne".

Dodatkowo, dla wygody: jeśli `cover_image_url` jest puste i użytkownik kliknie miniaturę, działa to jak „ustaw jako główne".

### 2. Karta „Zdjęcie główne"
Pod istniejącym `ImageUploaderem` dodajemy podpowiedź: „Możesz też wybrać dowolne zdjęcie z galerii poniżej — kliknij ⭐ na miniaturze." (tylko gdy galeria zawiera ≥1 zdjęcie).

## Co zostaje bez zmian
- `ImageUploader` (wgrywanie / crop / URL) — działa tak jak teraz.
- Schemat bazy, AI generator, pole `gallery` w bazie — bez zmian.
- Sekcja sport — bez zmian (poza zakresem).

## Szczegóły techniczne
- Plik: `src/pages/admin/ReviewEditor.tsx` (sekcja `{/* Gallery */}`).
- Ikona: `Star` z `lucide-react` (już używany jest stack `lucide-react`).
- Stan: korzystamy z istniejącego `set("cover_image_url", url)`.
- Wskaźnik aktywnej miniatury: porównanie `url === form.cover_image_url`.

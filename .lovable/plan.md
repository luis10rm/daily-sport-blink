

## Możliwość ponownego kadrowania zdjęcia w tle autora

Aktualnie po wgraniu zdjęcia w tle (cover) widać tylko podgląd z przyciskiem usunięcia. Nie ma opcji ponownego kadrowania bez usuwania i wgrywania od nowa.

### Plan

Dodam przycisk "Kadruj" do widoku wgranego zdjęcia w `ImageUploader`. Po kliknięciu otworzy się modal kadrowania z aktualnym zdjęciem, a po zapisie nowy wykadrowany plik zostanie wgrany i zastąpi stary URL.

### Szczegóły techniczne

**Plik: `src/components/admin/ImageUploader.tsx`**

1. W sekcji `if (value)` (linie 117-136) — obok przycisku usuwania (X) dodam przycisk "Kadruj" (ikona `Crop`):
   - Kliknięcie ustawia `pendingImage` na aktualny `value` i otwiera `ImageCropModal`
   - Przycisk widoczny tylko gdy `enableCrop === true`

2. Przeniosę renderowanie `ImageCropModal` (linie 174-182) **poza** warunek `if (value)` / else, tak aby modal był dostępny zarówno przy nowym uploaderze, jak i przy ponownym kadrowaniu istniejącego zdjęcia. Aktualnie modal renderuje się tylko gdy `value` jest puste (w gałęzi `else`).

3. Import ikony `Crop` z `lucide-react`.

Efekt: przy wgranym zdjęciu cover pojawi się przycisk kadrowania, który otworzy znany już modal z `react-easy-crop`.


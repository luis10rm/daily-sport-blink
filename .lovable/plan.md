

# Generowanie logo Szortsy w wysokiej jakości

## Co zrobimy

Stworzymy backend function, która wygeneruje nowe logo Szortsy w wysokiej jakości przy użyciu modelu AI do generowania obrazów (`google/gemini-3-pro-image-preview` -- lepsza jakość). Wygenerowane logo zostanie zapisane w storage i podmienione w projekcie.

## Obecne logo

Aktualne `logo-seo.png` (512x512) przedstawia zielone "S" i napis "Szortsy" na białym tle. Wygląda na wygenerowane w niskiej jakości (rozmyte krawędzie, brak precyzji).

## Plan

### 1. Utworzenie edge function `generate-logo`

Funkcja wywoła model `google/gemini-3-pro-image-preview` z promptem opisującym logo Szortsy:
- Duża, dynamiczna litera **"S"** w kolorze szmaragdowym (#10b981)
- Pod nią tekst **"Szortsy"** w czystej, pogrubionej czcionce sans-serif
- Białe tło, minimalistyczny styl
- Rozdzielczość optymalizowana pod 512x512px
- Styl profesjonalny, czysty, nowoczesny

Wygenerowany obraz zostanie zwrócony jako base64.

### 2. Tymczasowa strona admina do generowania

Dodam przycisk w panelu admina (np. w Settings), który:
- Wywołuje edge function
- Wyświetla podgląd wygenerowanego logo
- Pozwala wygenerować ponownie, jeśli efekt nie jest zadowalający
- Po akceptacji zapisuje plik do storage

### 3. Zapisanie logo

Po akceptacji logo zostanie:
- Przesłane do storage (bucket `post-images` lub dedykowany)
- Można je pobrać i ręcznie podmienić plik `public/logo-seo.png`

## Szczegóły techniczne

### Edge function: `supabase/functions/generate-logo/index.ts`
- Autoryzacja: tylko admin
- Model: `google/gemini-3-pro-image-preview` (wyższa jakość)
- Prompt zoptymalizowany pod profesjonalne logo sportowe
- Zwraca base64 obrazu

### Komponent w Settings
- Przycisk "Generuj logo AI"
- Podgląd wygenerowanego logo
- Przyciski: "Użyj tego logo" / "Generuj ponownie"
- Zapis do storage po akceptacji

### Pliki do utworzenia/edycji
1. `supabase/functions/generate-logo/index.ts` -- nowa edge function
2. `src/pages/admin/Settings.tsx` -- dodanie sekcji generowania logo


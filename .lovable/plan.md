
Cel: Poprawić widoczność banera "TodaysNewsBanner" gdy aktywny jest wallpaper (kampania premium takeover).

Diagnoza problemu
Na screenshocie widać, że baner z liczbą newsów ("Przygotowaliśmy X gorących informacji...") ma bardzo przezroczyste tło (`from-primary/5 to-primary/10`), które praktycznie zlewa się z kolorowym tłem wallpapera F1. Tekst i data są ledwo widoczne na niebieskim tle reklamy.

Strategia naprawy
Wykorzystam istniejący kontekst `WallpaperContext` (już używany w `Index.tsx` i `SponsorBanner.tsx`), aby baner dynamicznie zmieniał swój wygląd w zależności od tego, czy wallpaper jest aktywny:

1. Zaimportuję `useWallpaperContext` w komponencie `TodaysNewsBanner`.
2. Gdy `isTakeoverActive === true`:
   - Zmienię tło z przezroczystego gradientu na nieprzezroczyste (`bg-card` lub `bg-background`).
   - Dodam mocniejszy cień/border, aby baner wyróżniał się na kolorowym tle.
   - Zachowam resztę stylów (animacje, gradient tekstu liczby).
3. Gdy `isTakeoverActive === false` (normalne tło strony):
   - Zostawię obecny, subtelny wygląd z przezroczystym gradientem.

Zmiany do wprowadzenia
Jeden plik: `src/components/TodaysNewsBanner.tsx`

Desktop (linie 114-143):
```tsx
// Przed (przezroczysty gradient):
className="... bg-gradient-to-r from-primary/5 to-primary/10 ..."

// Po (warunkowo nieprzezroczyste tło):
className={cn(
  "mb-6 rounded-xl py-4 px-6 animate-fade-in",
  isTakeoverActive 
    ? "bg-card border border-border shadow-lg" // Solidne tło przy wallpaperze
    : "border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10" // Subtelne przy normalnym tle
)}
```

Mobile (linie 90-110):
Analogiczna zmiana dla wersji mobilnej - chociaż wallpaper nie jest aktywny na małych ekranach, zachowuję spójność kodu.

Efekt wizualny
- Przy aktywnym wallpaperze: Baner ma białe/jasne tło (`bg-card`), wyraźną ramkę i cień - będzie czytelny na każdym kolorowym tle kampanii.
- Bez wallpapera: Zachowany obecny subtelny wygląd z przezroczystym gradientem, który ładnie wtapia się w standardowe tło strony.

Sekcja techniczna

Zmiany w kodzie:
1. Import: Dodać `import { useWallpaperContext } from "@/contexts/WallpaperContext";`
2. Hook: Dodać `const { isTakeoverActive } = useWallpaperContext();` w ciele komponentu
3. Klasy CSS: Użyć warunkowych klas dla sekcji desktop i mobile, zmieniając tło z przezroczystego na solidne gdy wallpaper jest aktywny

Wzorzec zastosowany w projekcie:
Ten sam wzorzec używany jest w `SponsorBanner.tsx` (linia 36-39), gdzie sprawdzany jest `isTakeoverActive` by zmienić renderowanie banera reklamowego. Dzięki temu zachowuję spójność architektury.

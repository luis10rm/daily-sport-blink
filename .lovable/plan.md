

# Naprawa podwójnego tapnięcia "Przeczytaj więcej" na mobile

## Problem
Na urządzeniach dotykowych (telefony, tablety) przeglądarka traktuje pierwszy tap jako "hover", a drugi jako "click". Dotyczy to dwóch elementów:

1. **Klasa `card-hover`** na karcie -- pierwszy tap wywołuje `-translate-y-1` i `shadow-lg`
2. **Style `hover:bg-primary hover:text-primary-foreground`** na przycisku -- pierwszy tap zmienia kolor przycisku

## Rozwiązanie
Ograniczyć efekty hover tylko do urządzeń z myszką/trackpadem za pomocą media query `@media (hover: hover)`.

## Zakres zmian

### 1. `src/index.css` -- klasa `.card-hover`
Zmiana:
```css
.card-hover:hover {
  @apply -translate-y-1 shadow-lg;
}
```
Na:
```css
@media (hover: hover) {
  .card-hover:hover {
    @apply -translate-y-1 shadow-lg;
  }
}
```

### 2. `src/components/NewsCard.tsx` -- przycisk "Przeczytaj więcej"
Zamiana klas `hover:bg-primary hover:text-primary-foreground` na wariant wspierający tylko prawdziwy hover. Najszybsze rozwiązanie: dodać do przycisku dodatkową klasę z media query, lub użyć Tailwind modyfikatora `@hover` (niedostępny domyślnie w Tailwind v3). Alternatywnie -- przenieść hover style przycisku do CSS z `@media (hover: hover)`, lub zastosować podejście z dedykowaną klasą.

Najprostsze podejście: dodać niestandardową klasę CSS w `index.css` dla przycisków CTA i owinąć hover style w `@media (hover: hover)`.

### 3. `src/components/NewsOfTheDay.tsx` -- ten sam przycisk
Sprawdzić czy ma hover style -- jeśli tak, zastosować analogiczną poprawkę.

## Efekt
- Na mobile: jeden tap = natychmiastowe otwarcie artykułu
- Na desktopie: hover efekty działają bez zmian (karta się unosi, przycisk zmienia kolor)

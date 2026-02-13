

# Ostateczna naprawa podwojnego klikania - usuniecie WSZYSTKICH tranzycji z CTA na mobile

## Przyczyna

Przyciski CTA w kartach newsow maja klase `transition-colors` oraz klasy hoverowe (`cta-hover`, `cta-notd-hover`, `cta-sponsored-hover`). Mimo ze hover jest w media query, iOS WebKit skanuje DOM i widzi, ze element MA zdefiniowane stany hover (przez klase CSS). Dodatkowo `transition-colors` na buttonie mowi przegladarce "ten element animuje zmiany" - co moze aktywowac logike sticky hover.

Baner dziala, bo jego przycisk NIE jest wewnatrz elementu `.card-hover` (article z grupa animacji).

## Rozwiazanie

Calkowicie usunac `transition-colors` z przyciskow CTA i zastosowac hover tylko przez media query w CSS - tak jak zrobilismy z `.card-hover`.

### 1. `src/components/NewsCard.tsx`

Usunac `transition-colors` z className przyciskow. Klasy `cta-hover` / `cta-sponsored-hover` zostaja (ich hover jest juz w media query).

```tsx
// Bylo:
"mt-auto inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer"

// Bedzie:
"mt-auto inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer"
```

### 2. `src/components/NewsOfTheDay.tsx`

Tak samo - usunac `transition-colors` z przyciskow CTA.

```tsx
// Bylo:
"... transition-colors cursor-pointer cta-notd-hover"

// Bedzie:
"... cursor-pointer cta-notd-hover"
```

### 3. `src/index.css` - dodac transition do klas hover w media query

Dodac `transition-colors` do regul `.cta-hover`, `.cta-sponsored-hover`, `.cta-notd-hover` wewnatrz media query, zeby na desktopie tranzycja dalej dzialala:

```css
@media (hover: hover) and (pointer: fine) {
  .cta-hover {
    transition: color 0.2s, background-color 0.2s;
  }
  .cta-hover:hover {
    @apply bg-primary text-primary-foreground;
  }

  .cta-sponsored-hover {
    transition: color 0.2s, background-color 0.2s, box-shadow 0.2s;
  }
  .cta-sponsored-hover:hover {
    @apply bg-primary/90 shadow-lg;
  }

  .cta-notd-hover {
    transition: filter 0.2s, box-shadow 0.2s;
  }
  .cta-notd-hover:hover {
    @apply shadow-lg brightness-110;
  }
}
```

## Pliki do edycji

| Plik | Zmiana |
|------|--------|
| `src/components/NewsCard.tsx` | Usunac `transition-colors` z przyciskow CTA |
| `src/components/NewsOfTheDay.tsx` | Usunac `transition-colors` z przyciskow CTA |
| `src/index.css` | Dodac `transition` do klas CTA wewnatrz media query |

## Logika

Na mobile: przycisk nie ma ZADNEJ tranzycji ani inline hovera - iOS nie ma czego przechwycic. Na desktopie: tranzycje i hovery dzialaja normalnie dzieki media query `(pointer: fine)`.

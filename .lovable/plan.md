

# Plan: Angażujące copy dla mobile TodaysNewsBanner

## Problem
Obecna wersja mobilna pokazuje suchy, mało angażujący tekst:
- "Dzisiaj: 5 newsów"

Podczas gdy desktop używa personalizowanych wariantów podkreślających wartość dla użytkownika:
- "Dzisiaj mamy dla Ciebie 5 starannie wybranych newsów sportowych"

## Rozwiązanie
Stworzymy dedykowane warianty tekstowe dla mobile - krótsze, ale równie angażujące i podkreślające ekskluzywność i personalizację treści.

## Proponowane warianty mobile

| Wariant | Tekst |
|---------|-------|
| 1 | **Wyselekcjonowane dla Ciebie** · 5 newsów |
| 2 | **Tylko najważniejsze** · 5 sportowych hitów |
| 3 | **Twój briefing** · 5 kluczowych newsów |
| 4 | **Starannie wybrane** · 5 informacji dnia |
| 5 | **Esencja sportu** · 5 must-read newsów |

## Zmiany wizualne

- Pogrubienie pierwszej części tekstu (wartość dla użytkownika)
- Większy, wyróżniony numerek z gradientem
- Subtelny separator (·) między elementami
- Data pozostaje jako element drugorzędny

## Zmieniony layout

```
┌─────────────────────────────────────────┐
│ 📰  Wyselekcjonowane dla Ciebie · 5     │
│     Piątek, 31 stycznia                 │
└─────────────────────────────────────────┘
```

---

## Szczegóły techniczne

### Nowe warianty mobile
```typescript
const mobileVariants = [
  { prefix: "Wyselekcjonowane dla Ciebie", suffix: "newsów" },
  { prefix: "Tylko najważniejsze", suffix: "sportowych hitów" },
  { prefix: "Twój briefing", suffix: "kluczowych newsów" },
  { prefix: "Starannie wybrane", suffix: "informacji dnia" },
  { prefix: "Esencja sportu", suffix: "must-read" },
];
```

### Plik do edycji
- `src/components/TodaysNewsBanner.tsx` - sekcja mobile (linie 92-116)

### Zmiany w strukturze JSX mobile
```tsx
<p className="text-sm text-foreground">
  <span className="font-semibold">{mobileVariant.prefix}</span>
  <span className="mx-1.5 text-muted-foreground">·</span>
  <span className="text-primary font-bold text-lg">{displayCount}</span>
  <span className="text-muted-foreground ml-1">{mobileVariant.suffix}</span>
</p>
```


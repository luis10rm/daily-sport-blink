

## Kompaktowy placeholder dla nieaktywnego slotu reklamowego

### Problem
Gdy slot środkowy nie ma przypisanego aktywnego banera, wyświetlany jest pełnowymiarowy placeholder (970x250px / 300x250px), który zajmuje nieproporcjonalnie dużo miejsca w stosunku do przekazywanej informacji "To miejsce może być Twoje".

### Rozwiązanie
Wprowadzić nowy prop `isPlaceholder` do komponentu SponsorBanner, który gdy ustawiony na `true`, automatycznie wyświetla kompaktową wersję "pill" zamiast pełnowymiarowego kontenera.

### Architektura

```text
PRZED (placeholder pełnowymiarowy):
┌──────────────────────────────────────────────────────┐
│ Partner Szortsy                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│                                                      │
│            Partner Szortsy                           │
│         To miejsce może być Twoje                    │  ~350px
│                                                      │
│                                                      │
├──────────────────────────────────────────────────────┤
│ [Zostań partnerem ↗]                                 │
└──────────────────────────────────────────────────────┘

PO (kompaktowy placeholder):
┌──────────────────────────────────────────────────────┐
│ Partner Szortsy · To miejsce może być Twoje ·        │  ~40px
│ [Zostań partnerem]                                   │
└──────────────────────────────────────────────────────┘
```

### Zmiany w plikach

**1. `src/components/SponsorBanner.tsx`**

Dodać nowy prop `isPlaceholder`:
```typescript
interface SponsorBannerProps {
  // ... existing props
  isPlaceholder?: boolean; // Render compact version for inactive slots
}
```

Dodać warunek wyświetlania kompaktowej wersji dla placeholdera (przed sprawdzeniem `hasImages`):
```typescript
// Compact version for placeholder (no active banner)
if (isPlaceholder) {
  return (
    <div className={cn("flex justify-center", className)}>
      <div className="inline-flex items-center gap-3 px-5 py-2.5 
                      rounded-full bg-muted/50 border border-border shadow-sm">
        <span className="text-xs font-medium text-muted-foreground">
          Partner Szortsy
        </span>
        <span className="text-xs text-muted-foreground/40">·</span>
        <span className="text-xs text-muted-foreground">
          {description || "To miejsce może być Twoje"}
        </span>
        {ctaText && (
          <>
            <span className="text-xs text-muted-foreground/40">·</span>
            <button onClick={handleClick} ...>
              {ctaText}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

**2. `src/pages/Index.tsx`**

Zmienić wywołanie placeholdera w slocie środkowym:
```typescript
// Linia 105-113 - zmiana z pełnowymiarowego na kompaktowy
} : (
  <SponsorBanner
    title="Partner Szortsy"
    description="To miejsce może być Twoje"
    ctaText="Zostań partnerem"
    ctaUrl="mailto:reklama@szortsy.pl"
    isPlaceholder={true}  // <-- nowy prop
    className="mb-10"
  />
)}
```

### Szczegóły techniczne

| Aspekt | Pełny placeholder | Kompaktowy placeholder |
|--------|------------------|----------------------|
| Wysokość | ~350px (desktop) | ~40px |
| Szerokość | 970px (fixed) | auto (content-based) |
| Struktura | Header + Content + CTA | Single pill |
| Układ | Pionowy | Poziomy inline |

### Efekt końcowy

Gdy slot środkowy nie ma aktywnego banera, zamiast dużego pustego kontenera wyświetli się dyskretny, kompaktowy element zachęcający do współpracy reklamowej - zajmujący ~10x mniej miejsca na stronie.


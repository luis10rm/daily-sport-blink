
# Plan: Dodanie klikalnych tagów w NewsOfTheDay

## Problem
W komponencie `NewsOfTheDay` tagi są renderowane jako statyczne elementy `<span>`, podczas gdy w `NewsCard` są one klikalnymi linkami prowadzącymi do stron tagów (`/tag/:slug`).

## Rozwiązanie
Zamiana `<span>` na `<Link>` z logiką identyczną jak w `NewsCard`.

## Zmiany w pliku `src/components/NewsOfTheDay.tsx`

### 1. Dodanie importu `generateSlug`
```tsx
import { cn, getSourceName, generateSlug } from "@/lib/utils";
```

### 2. Zamiana tagów na klikalne linki (linie 64-71)

**Było:**
```tsx
{post.tags.map((tag) => (
  <span
    key={tag}
    className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
  >
    {tag}
  </span>
))}
```

**Będzie:**
```tsx
{post.tags.map((tag) => (
  <Link
    key={tag}
    to={`/tag/${generateSlug(tag)}`}
    className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
  >
    {tag}
  </Link>
))}
```

## Efekt końcowy
- Tagi w "Wiadomość dnia" będą klikalne i prowadzić do odpowiednich stron tagów
- Efekt hover identyczny jak w `NewsCard` (zmiana koloru tła i tekstu)
- Spójne zachowanie tagów w całym serwisie

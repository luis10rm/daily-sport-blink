

## Poprawa CTA na stronie `/start`

### Feedback
- **Desktop**: Przycisk za nisko — dodać CTA też u góry
- **Mobile**: CTA powinno pływać (sticky na dole ekranu), a gdy użytkownik dotrze do końca strony, przycisk powinien być inline (nie zasłaniać treści)

### Zmiany w `src/pages/StartPage.tsx`

**1. Desktop — dodatkowe CTA w headerze**
- Pod nagłówkiem "Sportowe newsy. Inaczej." dodać mniejszy przycisk CTA `Sprawdzam →` widoczny tylko na desktop (`hidden sm:inline-flex`)
- Dolny przycisk zostaje bez zmian

**2. Mobile — sticky floating CTA**
- Dodać `useEffect` + `IntersectionObserver` śledzący dolny przycisk (ref)
- Gdy dolny przycisk jest poza viewport → pokazać sticky CTA (`fixed bottom-6 left-6 right-6 z-20`) z animacją fade-in
- Gdy dolny przycisk wchodzi w viewport → ukryć sticky CTA (żeby nie zasłaniał)
- Sticky CTA widoczny tylko na mobile (`sm:hidden`)
- Dodać lekki `backdrop-blur` i cień pod sticky CTA dla czytelności

### Szczegóły techniczne

```
Struktura:
┌─────────────────────────┐
│  [X]                    │  ← close button
│                         │
│  Witaj na Szortsy       │
│  Sportowe newsy. Inaczej│
│  [Sprawdzam →] (desktop)│  ← NOWY: sm:inline-flex
│                         │
│  ┌─ Feature 1 ─────┐   │
│  ├─ Feature 2 ─────┤   │
│  ├─ Feature 3 ─────┤   │
│  ├─ Feature 4 ─────┤   │
│  └─ Feature 5 ─────┘   │
│                         │
│  [Sprawdzam →] (inline) │  ← istniejący, z ref
│                         │
│  ┌──────────────────┐   │
│  │[Sprawdzam→] fixed│   │  ← NOWY: mobile sticky, znika
│  └──────────────────┘   │    gdy inline CTA widoczne
└─────────────────────────┘
```

**Implementacja IntersectionObserver:**
- `useRef` na dolnym przycisku inline
- `useState` `showFloatingCta` (domyślnie `true`)
- Observer: `isIntersecting` → `setShowFloatingCta(false)`, else `true`
- Floating button: `transition-all duration-300` + `opacity-0 translate-y-4` gdy ukryty
- Dodać `pb-20 sm:pb-0` do kontenera na mobile, żeby sticky CTA nie zasłaniał ostatniej sekcji


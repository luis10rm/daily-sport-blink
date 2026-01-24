
## Naprawa widoczności Wallpapera

### Problem
Wallpaper jest niewidoczny na stronie głównej, mimo że jest poprawnie aktywowany. Pojawia się tylko podczas "overscrollu", co oznacza, że jest ukryty pod głównym contentem.

### Przyczyna techniczna

| Element | Klasy CSS | Problem |
|---------|-----------|---------|
| Tło wallpapera | `fixed inset-0 -z-10` | z-index: -10 (najniżej) |
| Skrzydła wallpapera | `fixed z-0` | z-index: 0 |
| Główny kontener (Index.tsx) | `bg-background z-10` | **Nieprzezroczyste białe tło zasłania wszystko!** |

```text
OBECNY STAN:
┌────────────────────────────────────┐
│ ████████ BIAŁY KONTENER ████████  │  ← z-10, bg-background
│ ██████ (zasłania wszystko) ██████ │
└────────────────────────────────────┘
          ↓ (ukryty pod spodem)
┌────────────────────────────────────┐
│      WALLPAPER (niewidoczny)       │  ← z-0 / -z-10
└────────────────────────────────────┘
```

### Rozwiązanie

Gdy wallpaper jest aktywny, główny kontener strony musi być **przezroczysty**, aby tło wallpapera było widoczne. Dodatkowo trzeba poprawić z-index elementów.

### Zmiany w plikach

**1. `src/pages/Index.tsx`**

Zmiana warunkowego tła kontenera - gdy wallpaper aktywny, brak tła:

```tsx
// Przed (linia 42):
<div className="min-h-screen bg-background relative z-10">

// Po:
<div className={cn(
  "min-h-screen relative z-10",
  !isTakeoverActive && "bg-background"
)}>
```

Dodanie importu `cn`:
```tsx
import { cn } from "@/lib/utils";
```

**2. `src/components/WallpaperBackground.tsx`**

Poprawienie z-index dla lepszej czytelności i pewności działania:

```tsx
// Główne tło (linia 30):
// Przed: className="fixed inset-0 -z-10 pointer-events-none"
// Po:    className="fixed inset-0 z-0 pointer-events-none"

// Skrzydła (linie 53, 78):
// Przed: className="fixed top-0 left-0 bottom-0 cursor-pointer z-0"
// Po:    className="fixed top-0 left-0 bottom-0 cursor-pointer z-[1]"
```

**3. Opcjonalnie: `src/components/NewsCard.tsx`, `src/components/SponsorBanner.tsx`**

Upewnienie się, że karty postów i banery mają własne tło (zwykle mają `bg-card`), żeby były czytelne na tle wallpapera.

### Wizualizacja po naprawie

```text
PO NAPRAWIE (wallpaper aktywny):
┌─────────────────────────────────────────────────────────────────┐
│ ██████                                              ██████      │
│ ██ L ██   ┌──────────────────────────────┐         ██ R  ██     │
│ ██ E ██   │     CONTENT (przezroczysty   │         ██ I  ██     │
│ ██ F ██   │     kontener, karty z        │         ██ G  ██     │
│ ██ T ██   │     bg-card)                 │         ██ H  ██     │
│ ██████    └──────────────────────────────┘         ██ T  ██     │
│ ██████                                              ██████      │
│                  WALLPAPER BACKGROUND                           │
└─────────────────────────────────────────────────────────────────┘
  └──┬──┘                                              └──┬──┘
   z-[1]                                                z-[1]
   Klikalne                                             Klikalne
```

### Szczegóły techniczne

**Dlaczego to rozwiązanie działa:**

1. Kontener strony bez `bg-background` jest **przezroczysty** - widać przez niego wallpaper
2. Karty postów (`NewsCard`) i banery (`SponsorBanner`) zachowują własne tła (`bg-card`), więc treść jest czytelna
3. Header i footer mogą wymagać własnego tła, jeśli go nie mają
4. Z-index uporządkowany: wallpaper tło (z-0) → skrzydła (z-1) → content (z-10)

### Dodatkowa weryfikacja

Po wdrożeniu zmian sprawdzić:
- [ ] Wallpaper widoczny na ekranach >1280px
- [ ] Skrzydła klikalne (otwierają URL w nowej karcie)
- [ ] Karty postów czytelne (mają własne tło)
- [ ] Header widoczny i funkcjonalny
- [ ] Footer czytelny
- [ ] Na mobilnych/węższych ekranach standardowe białe tło (fallback)

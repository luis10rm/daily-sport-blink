
# Animacja paska feedbacku

## Cel
Zwiększyć widoczność i zachęcić do interakcji, zachowując minimalistyczny, skandynawski styl serwisu.

## Propozycje animacji

| Wariant | Opis | Zalety |
|---------|------|--------|
| **1. Pulse ikony** | Subtelne pulsowanie ikony MessageSquare | Delikatne, nie rozprasza |
| **2. Shimmer bordera** | Delikatna "fala świetlna" przesuwająca się po ramce | Eleganckie, premium feel |
| **3. Delayed fade-in** | Box pojawia się z opóźnieniem po załadowaniu strony | Przyciąga uwagę w odpowiednim momencie |
| **4. Gradient border** | Animowany gradient na ramce (szmaragd → przezroczysty) | Nowoczesne, zgodne z brand |

## Rekomendacja

**Wariant 4: Animowany gradient border** + **opóźniony fade-in**

Kombinacja dwóch efektów:
1. Box pojawia się z delikatnym opóźnieniem (~1.5s) po załadowaniu strony
2. Ramka ma subtelny, animowany gradient szmaragdowy, który "przesuwa się" wzdłuż bordera

Dlaczego ta kombinacja:
- Opóźnienie sprawia, że użytkownik najpierw zobaczy treść, potem feedback box "pojawi się" przyciągając wzrok
- Animowany gradient jest nowoczesny i pasuje do akcentu szmaragdowego
- Efekt zatrzymuje się po kilku sekundach, by nie irytować

---

## Szczegóły techniczne

### Zmiany w plikach

**1. `tailwind.config.ts`** - dodanie nowych keyframes

```typescript
keyframes: {
  // ... istniejące
  "shimmer-border": {
    "0%": { backgroundPosition: "200% 0" },
    "100%": { backgroundPosition: "-200% 0" },
  },
  "delayed-fade-in": {
    "0%, 50%": { opacity: "0", transform: "translateY(8px)" },
    "100%": { opacity: "1", transform: "translateY(0)" },
  },
},
animation: {
  // ... istniejące
  "shimmer-border": "shimmer-border 3s ease-in-out infinite",
  "delayed-fade-in": "delayed-fade-in 2s ease-out forwards",
}
```

**2. `src/components/FeedbackBox.tsx`** - zastosowanie animacji

```tsx
// Główny kontener z animacjami
<div className={cn(
  "relative flex items-start gap-3 rounded-lg px-4 py-3",
  "bg-muted/50",
  "animate-delayed-fade-in opacity-0",
  // Gradient border effect
  "before:absolute before:inset-0 before:rounded-lg before:p-[1px]",
  "before:bg-gradient-to-r before:from-transparent before:via-primary/40 before:to-transparent",
  "before:bg-[length:200%_100%] before:animate-shimmer-border",
  "before:-z-10",
  className
)}>
```

### Alternatywna wersja (prostsza - tylko pulse ikony)

Jeśli wolisz coś jeszcze subtelniejszego:

```tsx
<MessageSquare className="h-5 w-5 text-primary shrink-0 mt-0.5 animate-pulse" />
```

## Wizualizacja efektu

```text
┌─────────────────────────────────────────────────┐
│  [po 1.5s] Box fade-in ↓                        │
│                                                 │
│  ╔═══════════════════════════════════════════╗  │
│  ║ 💬  Czego Ci brakuje? Daj znać...  [Wyślij]║ │
│  ╚═══════════════════════════════════════════╝  │
│       ↑                                         │
│  Szmaragdowy gradient przesuwa się → po ramce   │
│  (3 sekundy pętla, subtelny efekt)              │
└─────────────────────────────────────────────────┘
```

## Efekt końcowy

- Użytkownik scrolluje stronę
- Po ~1.5s box feedbacku płynnie się pojawia
- Ramka ma delikatny, pulsujący gradient szmaragdowy
- Po kilku iteracjach animacja naturalnie się wycisza (lub można ją zatrzymać po X sekundach)

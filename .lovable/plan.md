

# Lepsze CTA briefingu w TodaysNewsBanner

## Problem

Obecny CTA "Zobacz dzienny briefing" to maly pasek na dole banera z ikona gazety i strzalka. Jest subtelny, wtapia sie w tlo i nie zacheca do klikniecia. Na desktop to maly pill-button, rowniez malo widoczny.

## Propozycja

### Mobile: Pelny przycisk CTA z gradientem

Zamiast subtelnego paska `bg-primary/10`, pelny przycisk z solidnym tlem primary, zaokraglony, wycentrowany, z wieksza czcionka i animacja pulse na strzalce:

```text
+---------------------------------------+
|  5  sportowych hitow                  |
|  Wtorek, 17 lutego                     |
|                                       |
|  [===== Zobacz briefing  ->  =====]  |  <-- pelny przycisk primary
+---------------------------------------+
```

Szczegoly:
- Przycisk jako osobny element wewnatrz banera (nie pasek na calej szerokosci)
- Solidne tlo `bg-primary` z `text-primary-foreground` (bialy tekst na zielonym)
- Zaokraglony (`rounded-lg`), z paddingiem `py-3 px-5`
- Ikona `ChevronRight` z animacja `animate-bounce` horyzontalnie (lub pulse)
- Marginesy dookola `mx-4 mb-4` zeby nie kleil sie do krawedzi
- `touch-manipulation` dla iOS

### Desktop: Wyrazniejszy przycisk

Zamiana subtelnego pill-outline na solidny przycisk primary:
- `bg-primary text-primary-foreground` zamiast `bg-primary/10 text-primary`
- Wiekszy padding i czcionka
- Hover: `hover:bg-primary/90` z lekkim scale

## Plik do edycji

| Plik | Zmiana |
|------|--------|
| `src/components/TodaysNewsBanner.tsx` | Zamiana subtelnego CTA na pelny, solidny przycisk primary (mobile: pelny blok, desktop: wiekszy pill) |

## Szczegoly techniczne

### Mobile CTA (linie 124-136)

Zamiana paska `bg-primary/10 border-t` na wycentrowany przycisk:

```tsx
<div className="px-4 pb-4 pt-1">
  <Link
    to={`/dzien/${todayStr}`}
    className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary py-3 text-sm font-bold text-primary-foreground touch-manipulation active:scale-[0.98] transition-transform"
  >
    <Newspaper className="h-4 w-4" />
    Zobacz dzienny briefing
    <ChevronRight className="h-4 w-4 animate-[pulse_2s_ease-in-out_infinite]" />
  </Link>
</div>
```

### Desktop CTA (linie 170-176)

Zamiana subtelnego pill na solidny:

```tsx
<Link
  to={`/dzien/${todayStr}`}
  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
>
  Zobacz briefing
  <ChevronRight className="h-3.5 w-3.5" />
</Link>
```

Brak nowych zaleznosci. Brak zmian w tailwind.config.ts.

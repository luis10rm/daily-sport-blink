
# Plan: Ulepszenie przewijania Stories Row

## Problem
Po zwiększeniu liczby kategorii sportowych, w sekcji Stories pojawia się brzydki systemowy scrollbar. Klasa `scrollbar-hide` nie jest zdefiniowana, więc scrollbar jest widoczny.

## Proponowane rozwiązanie

Wykorzystanie istniejącego komponentu **Carousel (Embla)** zamiast natywnego `overflow-x-auto`:
- Płynne, dotykowe przewijanie (drag & swipe)
- Brak widocznego scrollbara
- Delikatne strzałki nawigacji po bokach (tylko desktop, gdy jest więcej kategorii)
- Gradient "fade" na krawędziach sygnalizujący możliwość przewijania

## Wizualizacja

```text
Przed:
[●] [●] [●] [●] [●] [●] [●] [●] [●] [●] [●] [●]
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀  <- brzydki scrollbar

Po:
    ◀  [●] [●] [●] [●] [●] [●] [●] [●] ...fade  ▶
         płynne przewijanie dotykiem/myszką
```

## Zmiany do wprowadzenia

### 1. StoriesRow.tsx - Zamiana na Carousel

```typescript
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem,
  CarouselPrevious,
  CarouselNext 
} from "@/components/ui/carousel";

// W render:
<div className="relative group">
  <Carousel
    opts={{
      align: "start",
      dragFree: true,
      containScroll: "trimSnaps",
    }}
    className="w-full"
  >
    <CarouselContent className="-ml-2 md:-ml-3">
      {availableCategories.map((category) => (
        <CarouselItem 
          key={category.id} 
          className="basis-auto pl-2 md:pl-3"
        >
          <DynamicStoriesCircle ... />
        </CarouselItem>
      ))}
    </CarouselContent>
    
    {/* Strzałki nawigacji - tylko desktop */}
    <CarouselPrevious className="hidden md:flex -left-4 ..." />
    <CarouselNext className="hidden md:flex -right-4 ..." />
  </Carousel>
  
  {/* Gradient fade na prawej krawędzi */}
  <div className="absolute right-0 top-0 bottom-0 w-12 
    bg-gradient-to-l from-background to-transparent 
    pointer-events-none" />
</div>
```

### 2. Opcjonalnie: index.css - Dodanie scrollbar-hide jako backup

```css
@layer utilities {
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

## Zalety rozwiązania

| Aspekt | Korzyść |
|--------|---------|
| UX | Płynne przewijanie dotykiem i myszką (drag) |
| Wizualne | Brak brzydkiego scrollbara |
| Nawigacja | Strzałki dla użytkowników desktop |
| Feedback | Gradient sugeruje więcej treści |
| Spójność | Wykorzystanie istniejącego komponentu Carousel |

## Pliki do modyfikacji

| Plik | Zmiana |
|------|--------|
| `src/components/StoriesRow.tsx` | Zamiana div z overflow na Carousel |
| `src/index.css` | Dodanie utility `scrollbar-hide` (backup) |

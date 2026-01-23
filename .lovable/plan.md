
## Uproszczony Floating Indicator (Wariant C)

### Cel
Stworzyć precyzyjny wskaźnik, który:
- Pokazuje stałą liczbę newsów z dzisiaj (bez dynamicznego odliczania)
- Znika gdy użytkownik przewinie poniżej ostatniego newsa z dzisiaj
- Używa Intersection Observer do precyzyjnego wykrycia momentu ukrycia

### Jak to będzie wyglądać

```text
┌─────────────────────────────────────────────────────┐
│                                                     │
│   📰  5 newsów z dzisiaj        ▼ Scrolluj         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Zmiany względem obecnego wskaźnika:**
- Usunięty pasek postępu (Progress bar)
- Usunięte dynamiczne odliczanie "X więcej"
- Statyczny komunikat "X newsów z dzisiaj"
- Wskaźnik znika precyzyjnie gdy ostatni dzisiejszy news zniknie z ekranu

### Zasada działania

1. Na stronie Index.tsx identyfikujemy ostatnią kartę newsa z dzisiaj
2. Dodajemy do niej `ref` (marker)
3. ScrollProgress używa Intersection Observer na tym markerze
4. Gdy marker zniknie z viewport (użytkownik przewinął dalej) - wskaźnik się chowa

### Pliki do modyfikacji

#### 1. `src/components/ScrollProgress.tsx`
- Nowy interface props z `lastTodayRef`
- Usunięcie logiki estymacji scroll progress
- Intersection Observer do obserwacji ostatniego elementu
- Uproszczony UI bez paska postępu

#### 2. `src/pages/Index.tsx`  
- Identyfikacja ostatniego newsa z dzisiaj w liście `posts`
- Utworzenie `ref` dla tego elementu
- Przekazanie ref do ScrollProgress

#### 3. `src/components/NewsCard.tsx`
- Dodanie opcjonalnego `ref` (forwardRef) do komponenetu

---

### Szczegóły techniczne

**Modyfikacja NewsCard z forwardRef:**
```typescript
export const NewsCard = forwardRef<HTMLElement, NewsCardProps>(
  ({ title, excerpt, ... }, ref) => {
    return (
      <article ref={ref} ...>
        ...
      </article>
    );
  }
);
```

**Nowa logika ScrollProgress:**
```typescript
interface ScrollProgressProps {
  todaysCount: number;
  lastTodayRef: React.RefObject<HTMLElement>;
  className?: string;
}

// Intersection Observer
useEffect(() => {
  if (!lastTodayRef.current) return;
  
  const observer = new IntersectionObserver(
    ([entry]) => {
      // Ukryj gdy ostatni element z dzisiaj zniknie z viewport
      setIsVisible(entry.isIntersecting || entry.boundingClientRect.top > 0);
    },
    { threshold: 0 }
  );
  
  observer.observe(lastTodayRef.current);
  return () => observer.disconnect();
}, [lastTodayRef]);
```

**Identyfikacja ostatniego dzisiejszego newsa w Index.tsx:**
```typescript
const lastTodayRef = useRef<HTMLElement>(null);

// Sprawdź czy post jest z dzisiaj
const isToday = (dateString: string) => {
  const postDate = new Date(dateString);
  const today = new Date();
  return postDate.toDateString() === today.toDateString();
};

// Znajdź indeks ostatniego posta z dzisiaj
const lastTodayIndex = posts.reduce((lastIdx, post, idx) => 
  isToday(post.published_at) ? idx : lastIdx, -1);

// W JSX:
<NewsCard
  ref={index === lastTodayIndex ? lastTodayRef : undefined}
  ...
/>
```

### Efekt końcowy
Użytkownik zobaczy elegancki wskaźnik "5 newsów z dzisiaj" który:
- Nie myli się w liczeniu (stała wartość)
- Znika precyzyjnie gdy przejdzie poniżej sekcji dzisiejszych newsów
- Jest czytelny i nieinwazyjny

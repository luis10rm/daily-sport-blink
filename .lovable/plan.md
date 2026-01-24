

## Personalizowany komunikat o dzisiejszych newsach

### Cel
Zamiana sztywnego nagłówka "Dzisiejsze wiadomości" na dynamiczny, ciepły komunikat informujący użytkownika ile newsów zostało dla niego przygotowanych danego dnia.

### Projekt UI

**Sekcja powitalna na stronie głównej:**

```text
┌─────────────────────────────────────────────────────────────────┐
│  🗞️  Dzisiaj mamy dla Ciebie                                   │
│                                                                 │
│      ████  12  ████                                             │
│                                                                 │
│  starannie wybranych newsów sportowych                          │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  Przygotowaliśmy je z myślą o Tobie • Piątek, 24 stycznia       │
└─────────────────────────────────────────────────────────────────┘
```

### Warianty komunikatów

System będzie losowo wybierać jeden z wariantów przy każdym odświeżeniu:

| Wariant | Tekst |
|---------|-------|
| 1 | "Dzisiaj mamy dla Ciebie **X** starannie wybranych newsów sportowych" |
| 2 | "Przygotowaliśmy **X** gorących informacji ze świata sportu" |
| 3 | "Twoja codzienna dawka sportu: **X** newsów z ostatnich 24h" |
| 4 | "Specjalnie dla Ciebie: **X** najciekawszych wydarzeń sportowych" |
| 5 | "**X** powodów, żeby zostać na dłużej - sprawdź co się dzieje w sporcie" |

### Architektura rozwiązania

#### Nowy komponent: `src/components/TodaysNewsBanner.tsx`

```tsx
interface TodaysNewsBannerProps {
  count: number;
  isLoading?: boolean;
}
```

Funkcjonalności:
- Wyświetla dynamiczną liczbę newsów z animacją "count up"
- Losuje wariant komunikatu przy montowaniu
- Pokazuje aktualną datę w formacie "Piątek, 24 stycznia"
- Subtelna animacja wejścia (fade + slide)
- Responsywny design (kompaktowy na mobile)

#### Zmiany w `src/pages/Index.tsx`

Zamiana sekcji (linie 69-76):
```tsx
// Stare:
<section className="mb-10">
  <h1>Dzisiejsze wiadomości</h1>
  <p>Najważniejsze wydarzenia sportowe z ostatnich 24 godzin</p>
</section>

// Nowe:
<TodaysNewsBanner 
  count={todaysPosts.length} 
  isLoading={postsLoading} 
/>
```

### Szczegóły implementacji

#### Animacja liczby (count-up effect)

```tsx
// Animacja od 0 do docelowej wartości
const [displayCount, setDisplayCount] = useState(0);

useEffect(() => {
  if (count === 0) return;
  
  const duration = 1000; // 1 sekunda
  const steps = 20;
  const increment = count / steps;
  let current = 0;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= count) {
      setDisplayCount(count);
      clearInterval(timer);
    } else {
      setDisplayCount(Math.floor(current));
    }
  }, duration / steps);
  
  return () => clearInterval(timer);
}, [count]);
```

#### Warianty tekstów

```tsx
const variants = [
  { before: "Dzisiaj mamy dla Ciebie", after: "starannie wybranych newsów sportowych" },
  { before: "Przygotowaliśmy", after: "gorących informacji ze świata sportu" },
  { before: "Twoja codzienna dawka sportu:", after: "newsów z ostatnich 24h" },
  { before: "Specjalnie dla Ciebie:", after: "najciekawszych wydarzeń sportowych" },
];

// Losowanie przy montowaniu
const [variant] = useState(() => variants[Math.floor(Math.random() * variants.length)]);
```

#### Formatowanie daty

```tsx
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const formattedDate = format(new Date(), "EEEE, d MMMM", { locale: pl });
// Wynik: "piątek, 24 stycznia"
```

### Stylizacja

```text
┌─────────────────────────────────────────────────────────────────┐
│  DESKTOP                                                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ bg-gradient-to-r from-primary/5 to-primary/10             │  │
│  │ border border-primary/20 rounded-2xl                       │  │
│  │ p-8 text-center                                           │  │
│  │                                                           │  │
│  │ [Newspaper icon] Dzisiaj mamy dla Ciebie                  │  │
│  │                                                           │  │
│  │        ██ 12 ██  (duża liczba, gradient text)            │  │
│  │                                                           │  │
│  │ starannie wybranych newsów sportowych                     │  │
│  │                                                           │  │
│  │ ───────────────────────────────────────                   │  │
│  │ Przygotowaliśmy je z myślą o Tobie • Piątek, 24 stycznia  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────┐
│  MOBILE (kompaktowy)        │
│  ┌───────────────────────┐  │
│  │ p-4                   │  │
│  │                       │  │
│  │ Dzisiaj: 12 newsów   │  │
│  │ Piątek, 24 stycznia   │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### Aktualizacja ScrollProgress

Uproszczenie komunikatu w pływającym wskaźniku - usunięcie duplikacji:

```tsx
// Było: "5 newsów z dzisiaj • Scrolluj"
// Będzie: "Jeszcze 3 do przeczytania • Scrolluj"
```

Opcjonalnie: dodanie progress bara pokazującego ile newsów użytkownik już "minął".

### Obsługa przypadków brzegowych

| Przypadek | Zachowanie |
|-----------|------------|
| 0 newsów | "Dzisiaj jeszcze nie dodaliśmy newsów - wróć później!" |
| 1 news | "Mamy dla Ciebie 1 news sportowy" (odmiana) |
| Ładowanie | Skeleton z pulsującą animacją |

### Podsumowanie zmian

| Plik | Zmiana |
|------|--------|
| `src/components/TodaysNewsBanner.tsx` | Nowy komponent z dynamicznym komunikatem |
| `src/pages/Index.tsx` | Zamiana statycznej sekcji na TodaysNewsBanner |
| `src/components/ScrollProgress.tsx` | Opcjonalna aktualizacja komunikatu |

### Efekt końcowy

Użytkownik wchodzi na stronę i widzi personalizowany, ciepły komunikat:

> 🗞️ **Dzisiaj mamy dla Ciebie**
> 
> **12**
> 
> starannie wybranych newsów sportowych
> 
> *Przygotowaliśmy je z myślą o Tobie • Piątek, 24 stycznia*

To buduje relację z użytkownikiem i zachęca do scrollowania i czytania.


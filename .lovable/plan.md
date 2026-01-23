
## Zmiana logiki wskaźnika ScrollProgress

### Cel
Wskaźnik ma pokazywać ile pozostało newsów **z bieżącego dnia** do przeczytania, zamiast wszystkich newsów na stronie.

### Zmiany

#### 1. Nowy hook do pobierania newsów z dzisiaj
Dodamy hook `useTodaysPosts` w `src/hooks/usePosts.tsx`:
- Filtruje posty po `published_at` z zakresu dzisiejszego dnia (od 00:00 do 23:59)
- Zwraca liczbę postów z dzisiaj

#### 2. Modyfikacja komponentu ScrollProgress
Plik: `src/components/ScrollProgress.tsx`

Zmiany w props:
```typescript
interface ScrollProgressProps {
  todaysCount: number;  // liczba newsów z dzisiaj
  className?: string;
}
```

Zmiany w treści komunikatu:
```typescript
// Było:
"{remainingCount} newsów więcej"

// Będzie:
"{remainingCount} newsów więcej z dzisiaj"
```

#### 3. Aktualizacja strony głównej Index.tsx
- Użycie nowego hooka `useTodaysPosts` 
- Przekazanie liczby dzisiejszych newsów do `ScrollProgress`

### Szczegóły techniczne

**Hook useTodaysPosts:**
```typescript
export const useTodaysPosts = () => {
  return useQuery({
    queryKey: ["posts", "today"],
    queryFn: async () => {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .gte("published_at", startOfDay)
        .lte("published_at", endOfDay)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as Post[];
    },
  });
};
```

**Zmiana komunikatu w ScrollProgress:**
- Z: `{remainingCount} {remainingCount === 1 ? "news" : "newsów"} więcej`
- Na: `{remainingCount} {remainingCount === 1 ? "news" : "newsów"} więcej z dzisiaj`

### Pliki do modyfikacji
1. `src/hooks/usePosts.tsx` - dodanie hooka `useTodaysPosts`
2. `src/components/ScrollProgress.tsx` - zmiana props i komunikatu
3. `src/pages/Index.tsx` - użycie nowego hooka

### Efekt końcowy
Użytkownik zobaczy: "3 newsy więcej z dzisiaj" - informując go dokładnie ile świeżych wiadomości z bieżącego dnia pozostało do przejrzenia.

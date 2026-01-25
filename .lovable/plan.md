
# Plan: Ograniczenie postów do 7 dni + Strona Archiwum

## Zakres zmian

### 1. Modyfikacja `usePostsFeed` - ograniczenie do 7 dni
Zmiana hooka pobierającego posty na stronę główną, aby filtrował tylko posty z ostatnich 7 dni.

### 2. Nowy hook `useArchivedPosts`
Hook z paginacją i filtrami do pobierania starszych postów.

### 3. Nowa strona `/archiwum`
Strona z listą wszystkich historycznych postów, filtrami po kategorii i dacie.

### 4. Link do archiwum w nawigacji
Dodanie linku "Archiwum" w Header i na końcu strony głównej.

---

## Sekcja techniczna

### Zmiana 1: `src/hooks/usePosts.tsx`

```typescript
// usePostsFeed - dodanie filtra 7 dni (linie 144-169)
export const usePostsFeed = () => {
  return useQuery({
    queryKey: ["posts", "feed"],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("is_news_of_day", false)
        .gte("published_at", sevenDaysAgo)  // NOWY FILTR
        .order("published_at", { ascending: false });

      if (error) throw error;
      // ... reszta logiki sponsored
    },
  });
};

// NOWY HOOK - useArchivedPosts
export const useArchivedPosts = (filters?: {
  categoryId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ["posts", "archive", filters],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      
      let query = supabase
        .from("posts")
        .select(POST_SELECT)
        .lt("published_at", sevenDaysAgo)  // Starsze niż 7 dni
        .order("published_at", { ascending: false });

      if (filters?.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }
      if (filters?.startDate) {
        query = query.gte("published_at", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("published_at", filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Post[];
    },
  });
};
```

### Zmiana 2: Nowa strona `src/pages/Archive.tsx`

```typescript
import { useState } from "react";
import { Header } from "@/components/Header";
import { NewsCard } from "@/components/NewsCard";
import { useArchivedPosts } from "@/hooks/usePosts";
import { useSportCategories } from "@/hooks/useSportCategories";
import { Select } from "@/components/ui/select";
import { Archive as ArchiveIcon } from "lucide-react";

const Archive = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>();
  const { data: posts = [], isLoading } = useArchivedPosts({ 
    categoryId: categoryFilter 
  });
  const { data: categories = [] } = useSportCategories();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 md:py-10">
        <div className="flex items-center gap-3 mb-8">
          <ArchiveIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Archiwum</h1>
        </div>
        
        {/* Filtry */}
        <div className="flex gap-4 mb-6">
          <Select 
            value={categoryFilter} 
            onValueChange={setCategoryFilter}
            placeholder="Wszystkie kategorie"
          >
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Lista postów */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <NewsCard key={post.id} {...post} delay={index * 50} />
          ))}
        </div>

        {posts.length === 0 && !isLoading && (
          <p className="text-center text-muted-foreground py-12">
            Brak archiwalnych postów
          </p>
        )}
      </main>
    </div>
  );
};

export default Archive;
```

### Zmiana 3: `src/components/Header.tsx` - dodanie linku

```typescript
<nav className="flex items-center gap-4">
  <Link 
    to="/archiwum" 
    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
  >
    <Archive className="h-4 w-4" />
    <span className="hidden sm:inline">Archiwum</span>
  </Link>
  <Link 
    to="/autorzy" 
    ...
  />
</nav>
```

### Zmiana 4: `src/pages/Index.tsx` - link na dole strony

Po gridzie z postami, przed footer:

```typescript
{posts.length > 0 && (
  <div className="text-center mt-8">
    <Link 
      to="/archiwum"
      className="inline-flex items-center gap-2 text-primary hover:underline"
    >
      <Archive className="h-4 w-4" />
      Zobacz starsze artykuły w Archiwum
    </Link>
  </div>
)}
```

### Zmiana 5: `src/App.tsx` - nowa trasa

```typescript
import Archive from "./pages/Archive";

// W Routes:
<Route path="/archiwum" element={<Archive />} />
```

---

## Pliki do utworzenia/modyfikacji

| Plik | Akcja |
|------|-------|
| `src/hooks/usePosts.tsx` | Modyfikacja usePostsFeed + nowy useArchivedPosts |
| `src/pages/Archive.tsx` | Nowa strona archiwum |
| `src/components/Header.tsx` | Dodanie linku do archiwum |
| `src/pages/Index.tsx` | Link "Zobacz starsze artykuły" |
| `src/App.tsx` | Nowa trasa /archiwum |

## Efekt końcowy

- Strona główna pokazuje tylko posty z **ostatnich 7 dni**
- Nowa strona `/archiwum` zawiera wszystkie **starsze posty**
- Możliwość filtrowania archiwum po kategorii sportowej
- Łatwa nawigacja między stroną główną a archiwum

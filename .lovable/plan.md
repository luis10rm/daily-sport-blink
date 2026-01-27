
# Plan: Optymalizacja LCP (Largest Contentful Paint)

## Problem

Na stronach tagów i kategorii głównym elementem LCP jest obrazek w pierwszym `NewsCard`. Obecnie:
- Wszystkie obrazki ładują się jednocześnie (brak lazy loading)
- Brak priorytetu dla pierwszego obrazka
- Brak preconnect do domen ze źródłami
- Kaskada zapytań API: najpierw tag, potem posty (sekwencyjnie)
- Animacja `animate-fade-in` opóźnia wizualne pojawienie się treści

## Rozwiązanie

Zoptymalizujemy LCP poprzez:
1. Lazy loading dla obrazków poza viewport
2. Wysoki priorytet dla pierwszego obrazka
3. Preconnect do popularnych domen źródłowych
4. Usunięcie animacji dla pierwszego elementu

## Wizualne zmiany

Brak zmian wizualnych - optymalizacje są "pod maską".

## Oczekiwany efekt

```text
PRZED:
┌─────────────────────────────────────────┐
│  [Ładowanie]  [Ładowanie]  [Ładowanie]  │  ← Wszystko naraz
│  [Ładowanie]  [Ładowanie]  [Ładowanie]  │
│  [Ładowanie]  [Ładowanie]  [Ładowanie]  │
└─────────────────────────────────────────┘

PO:
┌─────────────────────────────────────────┐
│  [Gotowe✓]    [Lazy]       [Lazy]       │  ← Pierwszy priorytetowo
│  [Lazy]       [Lazy]       [Lazy]       │  ← Reszta lazy
│  [Lazy]       [Lazy]       [Lazy]       │
└─────────────────────────────────────────┘
```

---

## Sekcja techniczna

### 1. Preconnect do popularnych domen źródłowych

Dodanie w `index.html` dyrektyw preconnect dla najczęstszych źródeł obrazków:

```html
<!-- Preconnect do popularnych źródeł obrazków -->
<link rel="preconnect" href="https://meczyki.pl" />
<link rel="preconnect" href="https://sportowefakty.wp.pl" />
<link rel="preconnect" href="https://ocdn.eu" />
<link rel="dns-prefetch" href="https://meczyki.pl" />
<link rel="dns-prefetch" href="https://sportowefakty.wp.pl" />
<link rel="dns-prefetch" href="https://ocdn.eu" />
```

### 2. Modyfikacja NewsCard - lazy loading i priority

Dodanie nowych propsów do `NewsCard`:

```typescript
interface NewsCardProps {
  // ... istniejące propsy
  loading?: "lazy" | "eager";      // Domyślnie "lazy"
  fetchPriority?: "high" | "auto"; // Domyślnie "auto"
  disableAnimation?: boolean;      // Dla pierwszego elementu
}
```

Zmiana w img:

```typescript
<img
  src={getCategoryImage(...)}
  alt={title}
  loading={loading}
  // @ts-ignore - fetchpriority jest w HTML spec ale nie w React types
  fetchpriority={fetchPriority}
  className={cn(
    "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
  )}
/>
```

### 3. Modyfikacja article - warunkowa animacja

```typescript
<article
  className={cn(
    "group relative flex flex-col overflow-hidden rounded-xl border bg-card card-hover",
    !disableAnimation && "opacity-0 animate-fade-in",
    // ...
  )}
  style={!disableAnimation ? { animationDelay: `${delay}ms` } : undefined}
>
```

### 4. Aktualizacja stron (TagPage, CategoryPage, Index)

Przekazanie odpowiednich propsów do pierwszego elementu:

```typescript
{posts.map((post, index) => (
  <NewsCard
    key={post.id}
    // ... inne propsy
    loading={index === 0 ? "eager" : "lazy"}
    fetchPriority={index === 0 ? "high" : "auto"}
    disableAnimation={index === 0}
    delay={index === 0 ? 0 : index * 50}
  />
))}
```

### 5. Optymalizacja kaskady API (TagPage)

Obecnie:
```typescript
// Sekwencyjne zapytania
const { data: tag } = useTagBySlug(slug);
const { data: posts } = usePostsByTag(tag?.name); // czeka na tag
```

Rozwiązanie - równoległe zapytania z bezpośrednim wyszukiwaniem po slug:

```typescript
// Nowy hook - pobiera posty bezpośrednio po slug tagu
export const usePostsByTagSlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["posts", "tagSlug", slug],
    queryFn: async () => {
      // Najpierw pobierz tag
      const { data: tag } = await supabase
        .from("tags")
        .select("name")
        .eq("slug", slug)
        .single();
      
      if (!tag) return [];
      
      // Następnie pobierz posty
      const { data, error } = await supabase
        .from("posts")
        .select(POST_SELECT)
        .contains("tags", [tag.name])
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as Post[];
    },
    enabled: !!slug,
  });
};
```

Alternatywnie możemy użyć `Promise.all` w TagPage:

```typescript
// Równoległe zapytania
const tagQuery = useTagBySlug(slug);
const postsQuery = useQuery({
  queryKey: ["posts", "tag", slug],
  queryFn: async () => {
    // Bezpośrednie zapytanie bez czekania na tag
    const { data: tagData } = await supabase
      .from("tags")
      .select("name")
      .eq("slug", slug)
      .single();
    
    if (!tagData) return [];
    
    const { data } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .contains("tags", [tagData.name])
      .order("published_at", { ascending: false });
    
    return data || [];
  },
  enabled: !!slug,
});
```

---

## Pliki do modyfikacji

| Plik | Zmiana |
|------|--------|
| `index.html` | Dodanie preconnect i dns-prefetch |
| `src/components/NewsCard.tsx` | Nowe propsy: loading, fetchPriority, disableAnimation |
| `src/pages/TagPage.tsx` | Przekazanie propsów LCP do pierwszego elementu |
| `src/pages/CategoryPage.tsx` | Przekazanie propsów LCP do pierwszego elementu |
| `src/pages/Index.tsx` | Przekazanie propsów LCP do pierwszego elementu |
| `src/hooks/useTags.tsx` | Opcjonalnie: nowy hook usePostsByTagSlug |

---

## Metryki sukcesu

| Metryka | Przed | Cel |
|---------|-------|-----|
| LCP | ~3-4s (zewnętrzne obrazy) | <2.5s |
| Lazy loaded images | 0 | Wszystkie poza pierwszym |
| Preconnect | 0 | 3+ domeny |
| Animacja pierwszego elementu | 100ms delay | 0ms |

---

## Dodatkowe rozważania (poza zakresem)

Dla jeszcze lepszego LCP można w przyszłości:
1. **Proxy obrazków** - cache'owanie zewnętrznych obrazów w Storage
2. **Placeholder blur** - wyświetlanie rozmytego placeholdera podczas ładowania
3. **Obrazy w formacie WebP/AVIF** - konwersja przy upload

Te rozwiązania wymagają większych zmian infrastruktury i mogą być wdrożone w kolejnej iteracji.

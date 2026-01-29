
# Unikalna grafika dla artykułów "Podsumowanie Dnia"

## Cel
Artykuły z podsumowaniem dnia powinny mieć charakterystyczną, wyróżniającą się grafikę - inną niż standardowe grafiki kategorii sportowych.

---

## Rozwiązanie

### 1. Nowa grafika w projekcie
Dodamy nową grafikę `/images/categories/daily-summary.webp` (lub podobną) - wyróżniającą się wizualnie, np.:
- Kolaż sportowy / mozaika
- Gradient z ikoną kalendarza/zegara
- Stylizowany napis "Podsumowanie dnia"

**Opcja A**: Użyjesz własnej grafiki (prześlij plik, a ja go dodam do projektu)  
**Opcja B**: Wygeneruję grafikę za pomocą AI (Gemini Image)

### 2. Wykrywanie artykułu "podsumowanie dnia"
Posty z podsumowaniem mają charakterystyczną cechę:
- `source_url` = `https://daily-sport-blink.lovable.app/podsumowanie`
- lub tag `"podsumowanie dnia"` w tablicy `tags`

Wykorzystamy to do automatycznego przypisania unikalnej grafiki.

### 3. Aktualizacja logiki obrazków

#### Plik: `src/config/categoryImages.ts`
```typescript
export const categoryDefaultImages: Record<string, string> = {
  football: "/images/categories/football.webp",
  basketball: "/images/categories/basketball.webp",
  // ... inne kategorie
  "daily-summary": "/images/categories/daily-summary.webp", // NOWA
  other: "/images/categories/other.webp",
  default: "/images/categories/other.webp",
};

// Nowa funkcja lub rozszerzenie istniejącej
export const getPostImage = (
  post: {
    image_url?: string | null;
    source_url?: string;
    tags?: string[] | null;
    sport_category?: { slug: string } | null;
  }
): string => {
  // 1. Jeśli ma własny obrazek - użyj go
  if (post.image_url) return post.image_url;
  
  // 2. Sprawdź czy to podsumowanie dnia
  const isSummary = 
    post.source_url?.includes("/podsumowanie") ||
    post.tags?.includes("podsumowanie dnia");
  
  if (isSummary) {
    return categoryDefaultImages["daily-summary"];
  }
  
  // 3. Domyślna grafika kategorii
  const slug = post.sport_category?.slug || "other";
  return categoryDefaultImages[slug] || categoryDefaultImages.other;
};
```

### 4. Aktualizacja komponentów używających obrazków

#### `src/components/NewsCard.tsx`
Zmiana z:
```tsx
src={getCategoryImage(categorySlug, imageUrl, sportCategory?.slug)}
```
Na:
```tsx
src={getPostImage({ 
  image_url: imageUrl, 
  source_url: sourceUrl,
  tags,
  sport_category: sportCategory 
})}
```

Trzeba dodać `sourceUrl` i `tags` do wywołania.

#### `src/components/NewsOfTheDay.tsx` (jeśli istnieje)
Analogiczna zmiana.

### 5. Automatyczne ustawienie grafiki w PostEditor
Przy generowaniu podsumowania (prefill) możemy od razu ustawić `image_url` na grafikę podsumowania:

```typescript
// W useEffect dla prefillData
if (prefillData) {
  // ... existing code
  form.setValue("image_url", "/images/categories/daily-summary.webp");
}
```

---

## Zakres zmian

| Plik | Zmiana |
|------|--------|
| `public/images/categories/daily-summary.webp` | **NOWY** - unikalna grafika |
| `src/config/categoryImages.ts` | Dodanie `daily-summary` + funkcja `getPostImage()` |
| `src/components/NewsCard.tsx` | Użycie `getPostImage()` zamiast `getCategoryImage()` |
| `src/pages/admin/PostEditor.tsx` | Auto-ustawienie grafiki przy prefill podsumowania |

---

## Pytanie do Ciebie

Wolisz:
1. **Własna grafika** - prześlij plik, a ja go dodam
2. **Wygenerowana przez AI** - opiszesz styl, a ja wygeneruję grafikę przez Gemini Image
3. **Placeholder** - na razie użyjemy prostego gradientu/placeholder, a grafikę dodasz później

---

## Efekt końcowy

- Artykuły "Podsumowanie dnia" automatycznie wyświetlają unikalną grafikę
- Wyróżniają się wizualnie na liście newsów
- Redaktor może nadal nadpisać grafikę własnym obrazkiem w edytorze
- System działa automatycznie - bez dodatkowej pracy przy każdym podsumowaniu

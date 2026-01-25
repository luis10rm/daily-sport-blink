
# Plan: Dynamiczne Stories dla wszystkich kategorii sportowych

## Problem
Komponent Stories używa 6 zakodowanych kategorii (`football`, `basketball`, `tennis`, `f1`, `mma`, `other`), podczas gdy w bazie danych masz 9 dynamicznych kategorii (w tym "Skoki Narciarskie", "Łyżwiarstwo"). Wszystkie kategorie nierozpoznane przez statyczny kod trafiają do "Inne".

## Rozwiązanie
Przepisanie Stories na dynamiczny system bazujący na tabeli `sport_categories`, analogicznie do tego jak działa `DynamicSportIcon`.

## Zmiany

### 1. Nowy komponent `DynamicStoriesCircle`
Zamieni statyczny `StoriesCircle` na wersję obsługującą dane z bazy:
- Pobiera ikonę (Lucide lub custom URL) z `sport_category`
- Używa koloru tła (`bg_color`) do gradientu pierścienia
- Wyświetla nazwę kategorii z bazy zamiast statycznych tłumaczeń

### 2. Przepisanie `StoriesRow`
- Grupowanie postów po `category_id` (UUID) zamiast po slug
- Wyświetlanie kółek dla KAŻDEJ kategorii która ma posty z ostatnich 7 dni
- Sortowanie według `sort_order` z tabeli kategorii

### 3. Aktualizacja `StoriesViewer`
- Przyjmowanie pełnych danych kategorii (nazwa, ikona, kolor) zamiast statycznego typu
- Dynamiczne wyświetlanie nagłówka z właściwą nazwą i ikoną

### 4. Konfiguracja obrazów tła
Rozszerzenie `categoryImages.ts` o obsługę dynamicznych kategorii - użycie domyślnego obrazu gdy brak dedykowanego.

## Sekcja techniczna

### Nowe interfejsy

```typescript
// Dynamiczna kategoria dla Stories
interface StoryCategoryData {
  id: string;
  slug: string;
  name: string;
  iconName?: string | null;
  iconUrl?: string | null;
  bgColor: string;
  sortOrder: number;
}

// Post w Stories
interface StoryPost {
  id: string;
  title: string;
  excerpt: string;
  categoryId: string;
  publishedAt: string;
  sourceUrl: string;
  imageUrl?: string;
  tags?: string[];
}
```

### Nowy `DynamicStoriesCircle.tsx`

```typescript
interface DynamicStoriesCircleProps {
  category: StoryCategoryData;
  hasUnread: boolean;
  onClick: () => void;
}

export const DynamicStoriesCircle = ({ category, hasUnread, onClick }) => {
  // Renderuje ikonę Lucide lub custom URL
  // Gradient pierścienia z category.bgColor
  // Nazwa z category.name
};
```

### Przepisany `StoriesRow.tsx`

```typescript
export const StoriesRow = () => {
  const { data: recentPosts = [] } = useRecentPosts();
  const { data: allCategories = [] } = useSportCategories();
  
  // Grupowanie po category_id
  const postsByCategory = useMemo(() => {
    const grouped: Record<string, StoryPost[]> = {};
    recentPosts.forEach(post => {
      const catId = post.sport_category?.id;
      if (catId) {
        if (!grouped[catId]) grouped[catId] = [];
        grouped[catId].push(mapPostToStory(post));
      }
    });
    return grouped;
  }, [recentPosts]);

  // Kategorie z postami, posortowane
  const availableCategories = useMemo(() => 
    allCategories
      .filter(cat => postsByCategory[cat.id]?.length > 0)
      .sort((a, b) => a.sort_order - b.sort_order)
  , [allCategories, postsByCategory]);

  return (
    <>
      <div className="flex gap-4">
        {availableCategories.map(category => (
          <DynamicStoriesCircle
            key={category.id}
            category={category}
            hasUnread={true}
            onClick={() => setActiveCategory(category)}
          />
        ))}
      </div>
      {activeCategory && (
        <StoriesViewer
          posts={postsByCategory[activeCategory.id]}
          category={activeCategory}
          onClose={handleClose}
        />
      )}
    </>
  );
};
```

### Zaktualizowany `StoriesViewer.tsx`

```typescript
interface StoriesViewerProps {
  posts: StoryPost[];
  category: StoryCategoryData;  // Zamiast SportCategory
  onClose: () => void;
}

// W nagłówku:
<p className="text-white font-medium">{category.name}</p>
// Zamiast getSportLabel(category)
```

### Pliki do modyfikacji/utworzenia

| Plik | Akcja |
|------|-------|
| `src/components/DynamicStoriesCircle.tsx` | Utworzenie |
| `src/components/StoriesRow.tsx` | Przepisanie na dynamiczny system |
| `src/components/StoriesViewer.tsx` | Aktualizacja interfejsu i nagłówka |
| `src/config/categoryImages.ts` | Rozszerzenie o fallback dla nieznanych kategorii |

### Efekt końcowy
Po zmianach Stories będą wyświetlać dedykowane kółko dla KAŻDEJ kategorii która ma posty z ostatnich 7 dni - w tym "Skoki Narciarskie", "Łyżwiarstwo" itd. Każde kółko będzie miało właściwą ikonę i kolor z bazy danych.


# Naprawa linkowania w Stories dla postów z treścią wewnętrzną

## Problem

Gdy użytkownik klika "Czytaj więcej" w Stories dla kategorii "Podsumowanie", przycisk kieruje do technicznego URL `https://szortsy.pl/podsumowanie/` zamiast do właściwej strony artykułu `/blink/:slug`.

## Przyczyna

1. Interfejs `StoryPost` w `StoriesRow.tsx` nie zawiera pól `slug` ani `content`
2. Funkcja `mapPostToStory` nie przekazuje tych danych z bazy
3. Komponent `StoriesViewer` zawsze używa `sourceUrl` jako linku zewnętrznego (z `target="_blank"`)

Dla porównania - `NewsCard` i `NewsOfTheDay` poprawnie sprawdzają czy post ma `content` i odpowiednio wybierają między linkiem wewnętrznym `/blink/:slug` a zewnętrznym `sourceUrl`.

## Rozwiązanie

### Krok 1: Rozszerzenie interfejsu StoryPost

Dodanie pól `slug` i `hasContent` do interfejsu `StoryPost`:

```typescript
export interface StoryPost {
  id: string;
  slug: string;           // ← NOWE
  title: string;
  excerpt: string;
  categoryId: string;
  publishedAt: string;
  sourceUrl: string;
  imageUrl?: string;
  tags?: string[];
  hasContent?: boolean;   // ← NOWE
}
```

### Krok 2: Aktualizacja mapowania postów

Funkcja `mapPostToStory` będzie przekazywać nowe pola:

```typescript
const mapPostToStory = (post: Post): StoryPost => ({
  id: post.id,
  slug: post.slug,                        // ← NOWE
  title: post.title,
  excerpt: post.excerpt,
  categoryId: post.sport_category?.id || "",
  publishedAt: post.published_at,
  sourceUrl: post.source_url,
  imageUrl: post.image_url || undefined,
  tags: post.tags || [],
  hasContent: Boolean(post.content),      // ← NOWE
});
```

### Krok 3: Aktualizacja StoriesViewer

Zmiana logiki przycisku "Czytaj więcej" - analogicznie do NewsCard:

```
Jeśli post ma content:
  → Link wewnętrzny do /blink/:slug (bez ikony ExternalLink)
  
W przeciwnym razie:
  → Link zewnętrzny do sourceUrl (z ikoną ExternalLink, target="_blank")
```

## Pliki do modyfikacji

1. **`src/components/StoriesRow.tsx`**
   - Rozszerzenie interfejsu `StoryPost` o `slug` i `hasContent`
   - Aktualizacja funkcji `mapPostToStory`

2. **`src/components/StoriesViewer.tsx`**
   - Import `Link` z `react-router-dom`
   - Warunkowe renderowanie przycisku (wewnętrzny vs zewnętrzny link)

## Efekt końcowy

Po wdrożeniu zmian, kliknięcie "Czytaj więcej" w Stories dla podsumowania dnia przekieruje użytkownika do strony `/blink/podsumowanie-102-alcaraz-krolem-ao-horror-legii-dramat-realu-8cf20d11` zamiast do pustego URL `/podsumowanie/`.

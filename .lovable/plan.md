

# Naprawa problemu z obrazkiem dla "Podsumowania Dnia"

## Problem

Przy publikacji postów typu "Podsumowanie dnia" na Facebooka, Make.com zwraca błąd:
> "Invalid URL in parameter 'url'"

### Przyczyna

```text
Post image_url:           /images/categories/daily-summary.webp  ← RELATYWNY!
Kategoria slug:           podsumowanie-dnia
Kategoria social_image_url: null
Fallback mapa szuka:      categoryDefaultImages["podsumowanie-dnia"]  ← NIE ISTNIEJE

Wynik wysłany do Make:    /images/categories/daily-summary.webp  ← NIEPRAWIDŁOWY URL
```

Facebook wymaga pełnego URL zaczynającego się od `https://`.

## Rozwiązanie

Naprawić logikę w funkcji Edge `publish-to-social`:

1. **Dodać konwersję relatywnych URL na absolutne** - jeśli `post.image_url` zaczyna się od `/`, dodać domenę
2. **Dodać klucz `podsumowanie-dnia`** do mapy `categoryDefaultImages` jako fallback

## Zmiany w kodzie

**Plik:** `supabase/functions/publish-to-social/index.ts`

### Zmiana 1: Dodanie klucza do mapy fallbacków (linie 20-29)

```typescript
const categoryDefaultImages: Record<string, string> = {
  football: "https://daily-sport-blink.lovable.app/images/categories/football.webp",
  basketball: "https://daily-sport-blink.lovable.app/images/categories/basketball.webp",
  tennis: "https://daily-sport-blink.lovable.app/images/categories/tennis.webp",
  f1: "https://daily-sport-blink.lovable.app/images/categories/f1.webp",
  mma: "https://daily-sport-blink.lovable.app/images/categories/mma.webp",
  "daily-summary": "https://daily-sport-blink.lovable.app/images/categories/daily-summary.webp",
  "podsumowanie-dnia": "https://daily-sport-blink.lovable.app/images/categories/daily-summary.webp",  // DODANE
  other: "https://daily-sport-blink.lovable.app/images/categories/other.webp",
};
```

### Zmiana 2: Konwersja relatywnych URL (linie 274-281)

```typescript
// Image priority: 1. post.image_url, 2. category.social_image_url, 3. static fallback
let postImage = post.image_url;

// Konwersja relatywnego URL na absolutny
if (postImage && postImage.startsWith("/")) {
  postImage = `https://daily-sport-blink.lovable.app${postImage}`;
}

if (!postImage && categoryInfo?.social_image_url) {
  postImage = categoryInfo.social_image_url;
}
if (!postImage) {
  postImage = categoryDefaultImages[categorySlugForImage] || categoryDefaultImages.other;
}
```

## Efekt

| Przed | Po |
|-------|-----|
| `/images/categories/daily-summary.webp` | `https://daily-sport-blink.lovable.app/images/categories/daily-summary.webp` |

Make.com otrzyma prawidłowy, pełny URL który Facebook może pobrać.


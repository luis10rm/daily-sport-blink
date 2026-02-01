
# Plan: Aktualizacja domeny na szortsy.pl

## Zakres zmian

Nowa domena **szortsy.pl** została podpięta. Trzeba zaktualizować wszystkie miejsca z hardcoded URL-em starej domeny, aby zapewnić poprawne indeksowanie przez wyszukiwarki.

## Pliki do modyfikacji

| Plik | Zmiany |
|------|--------|
| `index.html` | Meta tagi OG, Twitter Card, canonical URL |
| `src/components/SEO.tsx` | Stałe SITE_URL i SITE_NAME |
| `src/pages/BlinkPage.tsx` | Fallback URL i document title |
| `supabase/functions/sitemap/index.ts` | SITE_URL w generatorze sitemapy |
| `src/pages/admin/PostEditor.tsx` | URL dla postów z podsumowaniem |
| `public/sitemap.xml` | Usunięcie - plik statyczny jest zbędny (mamy dynamiczną sitemapę) |

## Szczegóły zmian

### 1. index.html
```html
<!-- PRZED -->
<meta property="og:url" content="https://daily-sport-blink.lovable.app" />
<meta property="og:image" content="https://daily-sport-blink.lovable.app/og-image.png" />
<meta name="twitter:image" content="https://daily-sport-blink.lovable.app/og-image.png" />
<link rel="canonical" href="https://daily-sport-blink.lovable.app" />

<!-- PO -->
<meta property="og:url" content="https://szortsy.pl" />
<meta property="og:image" content="https://szortsy.pl/og-image.png" />
<meta name="twitter:image" content="https://szortsy.pl/og-image.png" />
<link rel="canonical" href="https://szortsy.pl" />
```

### 2. src/components/SEO.tsx
```typescript
// PRZED
const SITE_URL = "https://daily-sport-blink.lovable.app";
const SITE_NAME = "Daily Sport Blink";

// PO
const SITE_URL = "https://szortsy.pl";
const SITE_NAME = "Szortsy";
```

### 3. src/pages/BlinkPage.tsx
```typescript
// PRZED
return import.meta.env.VITE_SITE_URL || "https://daily-sport-blink.lovable.app";
// ...
useDocumentTitle(post?.title ? `${post.title} | Daily Sport Blink` : "Daily Sport Blink");

// PO
return import.meta.env.VITE_SITE_URL || "https://szortsy.pl";
// ...
useDocumentTitle(post?.title ? `${post.title} | Szortsy` : "Szortsy");
```

### 4. supabase/functions/sitemap/index.ts
```typescript
// PRZED
const SITE_URL = "https://daily-sport-blink.lovable.app";

// PO
const SITE_URL = "https://szortsy.pl";
```

### 5. src/pages/admin/PostEditor.tsx
```typescript
// PRZED
form.setValue("source_url", "https://daily-sport-blink.lovable.app/podsumowanie");

// PO
form.setValue("source_url", "https://szortsy.pl/podsumowanie");
```

### 6. public/sitemap.xml
Ten plik statyczny jest niepotrzebny - mamy dynamiczną sitemapę generowaną przez Edge Function. Usunięcie zapobiegnie konfliktom i nieaktualnym danym.

## Wpływ na SEO

| Element | Korzyść |
|---------|---------|
| Canonical URLs | Prawidłowe wskazanie głównej wersji strony |
| Open Graph | Poprawne podglądy w social media |
| JSON-LD Schema | Spójny branding "Szortsy" w wynikach wyszukiwania |
| Sitemap | Wszystkie URL-e wskazują na nową domenę |
| Google News | Prawidłowa identyfikacja wydawcy |

## Po wdrożeniu

1. **Google Search Console** - dodaj nową właściwość dla szortsy.pl
2. **Przekierowanie 301** - skonfiguruj w ustawieniach domeny przekierowanie z daily-sport-blink.lovable.app na szortsy.pl (jeśli jeszcze nie zrobione)
3. **Zgłoś sitemapę** - w GSC dodaj adres dynamicznej sitemapy

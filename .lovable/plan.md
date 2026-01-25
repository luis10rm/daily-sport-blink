
# Strategia SEO dla Szortsy

## Filozofia podejścia

Szortsy to **agregator newsów sportowych**, nie portal z własnymi artykułami. Zamiast walczyć o pozycjonowanie pojedynczych newsów, stawiamy na:

1. **SEO "przy okazji"** - mechanizmy, które działają automatycznie bez dodatkowej pracy redakcji
2. **Strony kategorii** - nowe strony `/kategoria/:slug` które zbierają ruch długookresowy
3. **Structured data** - Google News i rich snippets

---

## Zmiany do wdrożenia

### 1. Poprawione meta tagi w `index.html`

Aktualizacja statycznych meta tagów z brandingiem Szortsy:

| Element | Przed | Po |
|---------|-------|-----|
| Title | "Lovable App" | "Szortsy - Wiadomości sportowe krótko i na temat" |
| Description | "Lovable Generated Project" | "Najważniejsze wiadomości ze świata sportu w 60 słowach. Piłka nożna, koszykówka, F1, tenis, MMA i więcej. Codziennie." |
| og:image | Lovable logo | Dedykowana grafika OG |
| lang | "en" | "pl" |

### 2. Dynamiczne tytuły stron (hook `useDocumentTitle`)

Nowy hook automatycznie ustawiający tytuł strony:

```
/                    → "Szortsy - Wiadomości sportowe"
/archiwum            → "Archiwum | Szortsy"
/autorzy             → "Nasi autorzy | Szortsy"
/autor/jan-kowalski  → "Jan Kowalski | Szortsy"
/kategoria/football  → "Piłka nożna | Szortsy"
```

### 3. Nowe strony kategorii `/kategoria/:slug`

Dedykowane strony dla każdej kategorii sportowej z:
- Pełną listą postów z danej kategorii (7 dni + link do archiwum)
- Unikalnym tytułem i opisem dla SEO
- Możliwością pozycjonowania na frazy typu "wiadomości piłka nożna"

**URL struktura:**
```
/kategoria/football      → Piłka nożna
/kategoria/basketball    → Koszykówka
/kategoria/f1            → Formuła 1
/kategoria/mma           → MMA
```

### 4. Automatyczny sitemap.xml

Statyczny plik sitemap z głównymi stronami + dynamiczne strony kategorii:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://daily-sport-blink.lovable.app/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://daily-sport-blink.lovable.app/archiwum</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://daily-sport-blink.lovable.app/autorzy</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://daily-sport-blink.lovable.app/kategoria/football</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <!-- pozostałe kategorie -->
</urlset>
```

### 5. Schema.org JSON-LD (structured data)

Dodanie structured data na stronę główną i kategorie:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Szortsy",
  "description": "Wiadomości sportowe krótko i na temat",
  "url": "https://daily-sport-blink.lovable.app",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://daily-sport-blink.lovable.app/archiwum?q={search_term_string}"
  }
}
```

Dla strony kategorii - `ItemList` z newsami:

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Wiadomości - Piłka nożna",
  "itemListElement": [
    {
      "@type": "NewsArticle",
      "headline": "Tytuł newsa",
      "datePublished": "2026-01-25",
      "author": { "@type": "Person", "name": "Jan Kowalski" }
    }
  ]
}
```

---

## Zmiany "przy okazji" (zero dodatkowej pracy)

| Mechanizm | Jak działa |
|-----------|------------|
| Dynamiczne title | Hook automatycznie ustawia tytuł na podstawie aktualnej strony |
| Linki do kategorii | Ikona kategorii na NewsCard staje się linkiem do `/kategoria/:slug` |
| Breadcrumbs | Automatyczne okruszki: "Strona główna > Piłka nożna > Archiwum" |
| Canonical URLs | Zapobiega duplikacji treści między stronami |

---

## Sekcja techniczna

### Nowe pliki do utworzenia

| Plik | Opis |
|------|------|
| `src/hooks/useDocumentTitle.ts` | Hook do dynamicznego ustawiania tytułu |
| `src/pages/CategoryPage.tsx` | Strona kategorii `/kategoria/:slug` |
| `src/components/SEO.tsx` | Komponent z JSON-LD structured data |
| `public/sitemap.xml` | Mapa strony dla wyszukiwarek |

### Pliki do modyfikacji

| Plik | Zmiana |
|------|--------|
| `index.html` | Meta tagi, lang="pl", OG image |
| `public/robots.txt` | Dodanie linku do sitemap |
| `src/App.tsx` | Nowa trasa `/kategoria/:slug` |
| `src/pages/Index.tsx` | Dodanie hook `useDocumentTitle` + SEO component |
| `src/pages/Archive.tsx` | Hook `useDocumentTitle` |
| `src/pages/AuthorsPage.tsx` | Hook `useDocumentTitle` |
| `src/pages/AuthorProfile.tsx` | Hook `useDocumentTitle` z nazwą autora |
| `src/components/NewsCard.tsx` | Ikona kategorii jako link do strony kategorii |
| `src/components/Header.tsx` | Dropdown z kategoriami w nawigacji |

### Hook useDocumentTitle

```typescript
import { useEffect } from "react";

export const useDocumentTitle = (title: string, suffix = "Szortsy") => {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${suffix}` : suffix;
    document.title = fullTitle;
    
    // Update OG title meta tag
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", fullTitle);
  }, [title, suffix]);
};
```

### Komponent SEO z JSON-LD

```typescript
import { useEffect } from "react";

interface SEOProps {
  type: "website" | "itemList" | "person";
  data: Record<string, any>;
}

export const SEO = ({ type, data }: SEOProps) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": type === "itemList" ? "ItemList" : type === "person" ? "Person" : "WebSite",
      ...data,
    });
    script.id = "seo-structured-data";
    
    // Remove old script if exists
    const existing = document.getElementById("seo-structured-data");
    if (existing) existing.remove();
    
    document.head.appendChild(script);
    
    return () => script.remove();
  }, [type, data]);
  
  return null;
};
```

### Strona kategorii (CategoryPage.tsx)

Nowa strona wyświetlająca posty z konkretnej kategorii:
- Pobiera posty przez `usePostsByCategory(slug)`
- Ustawia dynamiczny tytuł przez `useDocumentTitle(categoryName)`
- Renderuje JSON-LD z listą newsów
- Linki do archiwum danej kategorii

---

## Efekt końcowy

1. **Lepsze indeksowanie** - Google zna strukturę strony przez sitemap
2. **Rich snippets** - Structured data zwiększa CTR w wynikach wyszukiwania
3. **Strony kategorii** - Nowe punkty wejścia dla ruchu organicznego
4. **Social sharing** - Poprawne podglądy przy udostępnianiu linków
5. **Zero dodatkowej pracy** - Wszystko dzieje się automatycznie przy publikacji postów

---

## Priorytet wdrożenia

1. **Natychmiastowe** - Poprawka `index.html` (meta tagi, język)
2. **Wysokie** - Hook `useDocumentTitle` + zastosowanie na wszystkich stronach
3. **Średnie** - Strony kategorii + nawigacja
4. **Niskie** - Structured data JSON-LD + sitemap

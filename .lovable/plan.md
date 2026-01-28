

# Plan: Dedykowane strony blinków + AI Content Generation

## Cel

1. Utworzenie dedykowanych stron dla każdego blinka pod `/blink/:id` z pełnym JSON-LD NewsArticle
2. Rozszerzenie "Generuj AI" o tworzenie unikatowej pełnej treści artykułu
3. Osobny, edytowalny prompt dla generowania treści (oddzielny od ekstrakcji metadanych)

## Jak to będzie działać?

```text
OBECNIE:
┌─────────────────┐     ┌──────────────────┐
│ Wklej URL       │────▶│ AI generuje:     │
│ + kliknij AI    │     │ - tytuł          │
└─────────────────┘     │ - excerpt        │
                        │ - kategoria      │
                        │ - tagi           │
                        └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │ Karta z linkiem  │
                        │ do źródła        │
                        └──────────────────┘

PO ZMIANACH:
┌─────────────────┐     ┌──────────────────┐
│ Wklej URL       │────▶│ AI generuje:     │
│ + kliknij AI    │     │ - tytuł          │
└─────────────────┘     │ - excerpt        │
                        │ - kategoria      │
                        │ - tagi           │
                        │ - PEŁNA TREŚĆ ✨ │
                        └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │ Dedykowana strona│
                        │ /blink/:id       │
                        │ + pełny JSON-LD  │
                        └──────────────────┘
```

---

## 1. Nowa strona: BlinkPage (`/blink/:id`)

Dedykowana strona artykułu zawierająca:
- Pełną treść blinka (pole `content`)
- Kompletny JSON-LD NewsArticle zgodny ze schematem eksperta
- Link do źródła z `isBasedOn`
- Linki do autora i kategorii

```text
┌─────────────────────────────────────────────────────────────┐
│  [Logo] Daily Sport Blink              [Kategorie] [Menu]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🏈 PIŁKA NOŻNA                              28 stycznia    │
│                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  TYTUŁ ARTYKUŁU Z KEYWORDEM                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                             │
│  [ Obrazek 16:9 - min 1200px szerokości ]                   │
│                                                             │
│  Pełna treść artykułu wygenerowana przez AI...              │
│  Lorem ipsum dolor sit amet, consectetur adipiscing elit.   │
│  Sed do eiusmod tempor incididunt ut labore et dolore.      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📰 Źródło: sportowefakty.wp.pl                      │    │
│  │    [Przeczytaj oryginalny artykuł →]                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌──────────────────────────┐                               │
│  │ 👤 Jan Kowalski          │                               │
│  │    Redaktor sportowy     │                               │
│  └──────────────────────────┘                               │
│                                                             │
│  #Lewandowski  #Transfery  #LaLiga                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. JSON-LD zgodny ze schematem eksperta

Na stronie `/blink/:id` wstrzykiwany będzie pełny schemat:

```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://daily-sport-blink.lovable.app/blink/abc123"
  },
  "headline": "Lewandowski wraca do formy - 2 gole w meczu z Valencią",
  "description": "Polski napastnik strzelił 2 bramki i zaliczył asystę...",
  "image": {
    "@type": "ImageObject",
    "url": "https://...",
    "width": 1200,
    "height": 675
  },
  "datePublished": "2026-01-28T10:30:00Z",
  "dateModified": "2026-01-28T11:00:00Z",
  "author": {
    "@type": "Person",
    "name": "Jan Kowalski",
    "url": "https://daily-sport-blink.lovable.app/redakcja/jan-kowalski"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Daily Sport Blink",
    "logo": {
      "@type": "ImageObject",
      "url": "https://daily-sport-blink.lovable.app/logo-seo.png"
    }
  },
  "isBasedOn": "https://sportowefakty.wp.pl/...",
  "articleSection": "Piłka nożna",
  "keywords": ["Lewandowski", "Barcelona", "LaLiga"]
}
```

---

## 3. Rozszerzenie Edge Function o generowanie treści

Aktualizacja `extract-article` aby generowała również pełną treść:

```typescript
// Nowe pole w odpowiedzi AI
content: {
  type: "string",
  description: "Pełna, unikatowa treść artykułu (300-500 słów, po polsku)"
}
```

**Dwa oddzielne prompty:**
- `article_extraction_prompt` - obecny, do metadanych (tytuł, excerpt, tagi)
- `article_content_prompt` - **NOWY**, do generowania pełnej treści

---

## 4. Nowy prompt w Settings

Dodanie drugiego edytowalnego promptu:

```text
┌─────────────────────────────────────────────────────────────┐
│ Ustawienia AI                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📝 Prompt ekstrakcji metadanych                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Jesteś asystentem redakcji sportowej...                 │ │
│ │ Wygeneruj tytuł, excerpt, kategorię i tagi...           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ✨ Prompt generowania treści (NOWY)                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Na podstawie oryginalnego artykułu napisz unikatową,    │ │
│ │ skróconą wersję newsa sportowego. Treść musi być:       │ │
│ │ - 300-500 słów                                          │ │
│ │ - Napisana prostym językiem                             │ │
│ │ - Zawierać kluczowe fakty                               │ │
│ │ - Mieć angażujący ton                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Zapisz zmiany]  [Przywróć domyślne]                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Aktualizacja NewsCard

Zmiana linku "Przeczytaj więcej":
- Jeśli post ma `content` → link do `/blink/:id` (wewnętrzny)
- Jeśli brak `content` → link do `source_url` (zewnętrzny, jak teraz)

---

## Zmiany techniczne

### Nowe pliki

| Plik | Opis |
|------|------|
| `src/pages/BlinkPage.tsx` | Strona dedykowana dla pojedynczego blinka |

### Modyfikowane pliki

| Plik | Zmiana |
|------|--------|
| `src/App.tsx` | Dodanie route `/blink/:id` |
| `src/components/SEO.tsx` | Aktualizacja `mainEntityOfPage` na URL blinka, zmiana `/autor/` na `/redakcja/`, publisher name na "Daily Sport Blink" |
| `src/components/NewsCard.tsx` | Warunkowe linkowanie do `/blink/:id` lub zewnętrznego URL |
| `supabase/functions/extract-article/index.ts` | Dodanie generowania `content` z osobnym promptem |
| `src/hooks/useSettings.ts` | Nowy hook `useContentPrompt` dla drugiego promptu |
| `src/pages/admin/Settings.tsx` | Sekcja dla nowego promptu |
| `src/hooks/usePosts.tsx` | Hook `usePostBySlug` lub `usePostById` dla strony blinka |

### Migracja bazy danych

Dodanie nowego ustawienia w tabeli `settings`:

```sql
INSERT INTO settings (key, value)
VALUES ('article_content_prompt', 'Na podstawie oryginalnego artykułu...')
ON CONFLICT (key) DO NOTHING;
```

---

## Przepływ użytkownika (po zmianach)

1. **Admin** wkleja URL źródła w edytorze posta
2. Klika **"Generuj AI"**
3. AI generuje:
   - Tytuł, excerpt, kategoria, tagi (jak dotychczas)
   - **NOWE:** Pełna, unikatowa treść artykułu (300-500 słów)
4. Post zapisywany z polem `content`
5. Na froncie karta linkuje do `/blink/:id`
6. Strona `/blink/:id` wyświetla pełny artykuł z poprawnym JSON-LD
7. Google indeksuje stronę jako pełnoprawny `NewsArticle`

---

## Korzyści

| Aspekt | Przed | Po |
|--------|-------|-----|
| Dedykowane URL | Brak | `/blink/:id` dla każdego artykułu |
| JSON-LD `mainEntityOfPage` | Strona główna | Konkretny URL artykułu |
| Unikatowa treść | Tylko excerpt | Pełny artykuł 300-500 słów |
| Kontrola nad AI | 1 prompt | 2 osobne prompty (metadane + treść) |
| Google Discover | Niskie szanse | Wysokie szanse (pełna treść + 1200px obrazy) |

---

## Uwagi dotyczące rekomendacji eksperta

1. **`/redakcja/:slug`** - zmienię ścieżkę autora z `/autor/` na `/redakcja/`
2. **Publisher name** - zmienię z "Szortsy" na "Daily Sport Blink"
3. **`logo-seo.png`** - przygotuję ścieżkę, ale plik trzeba będzie wgrać ręcznie (1200x630px)
4. **Keywords jako array** - zmienię z `join(", ")` na tablicę
5. **`articleSection`** - używam nazwy kategorii


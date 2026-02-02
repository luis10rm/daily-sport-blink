
# Wewnętrzne linkowanie AI w generowanych artykułach

## Cel

Gdy AI generuje treść artykułu, system automatycznie pobierze powiązane artykuły z tej samej kategorii i przekaże je do AI, które wstawi 1-2 naturalne linki wewnętrzne do treści.

## Korzyści SEO

- Poprawa link juice między stronami
- Zwiększenie czasu spędzonego na stronie
- Lepsza indeksacja przez roboty Google
- Kontekstowe powiązania tematyczne

## Zmiany do wykonania

### 1. Edge Function: `supabase/functions/extract-article/index.ts`

Po ekstrakcji metadanych (krok 1, linia ~496), ale przed generowaniem treści (krok 2, linia ~498), dodanie zapytania do bazy po powiązane artykuły:

```text
// Po linii 496 (po extractedMetadata):

// Pobierz powiązane artykuły z tej samej kategorii
const { data: relatedPosts } = await supabase
  .from("posts")
  .select("id, title, slug, sport_category:category_id(slug)")
  .eq("sport_category.slug", extractedMetadata.category)
  .order("published_at", { ascending: false })
  .limit(10);

// Przygotuj kontekst do linkowania
const relatedContext = relatedPosts
  ?.map(p => `- "${p.title}" → /blink/${p.slug}`)
  .join("\n") || "";
```

Następnie zmodyfikowanie wiadomości do AI (linia ~509-511):

```text
// Było:
content: `Tytuł: ${extractedMetadata.title}\n\nOryginalny artykuł:\n${articleText}`

// Będzie:
content: `Tytuł: ${extractedMetadata.title}

POWIĄZANE ARTYKUŁY NA STRONIE (do linkowania wewnętrznego):
${relatedContext || "Brak powiązanych artykułów."}

Oryginalny artykuł:
${articleText}`
```

### 2. Aktualizacja promptu treści

W pliku `src/pages/admin/Settings.tsx` (lub bezpośrednio w edge function) rozszerzenie `DEFAULT_CONTENT_PROMPT` o instrukcje linkowania:

```text
LINKOWANIE WEWNĘTRZNE (SEO):
- Na końcu artykułu dodaj sekcję "Przeczytaj również" z 1-2 linkami
- Format linku: <a href="/blink/slug-artykulu">tekst kotwicy</a>
- Linkuj TYLKO jeśli temat jest rzeczywiście powiązany
- Jeśli brak powiązanych artykułów - nie dodawaj sekcji
```

### 3. Schemat narzędzia AI (tool)

Rozszerzenie schematu funkcji `generate_article_content` o opcjonalne pole linków:

```json
{
  "properties": {
    "content": { "type": "string", "description": "..." },
    "internal_links": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "url": { "type": "string" },
          "anchor_text": { "type": "string" }
        }
      },
      "description": "1-2 linki wewnętrzne do powiązanych artykułów"
    }
  }
}
```

AI zwróci linki strukturalnie, a edge function doda je na końcu treści w sekcji "Przeczytaj również".

## Przepływ danych

```text
1. Użytkownik wkleja URL źródłowy
2. Edge function ekstrahuję metadane (tytuł, kategoria, tagi)
3. → NOWE: Zapytanie do bazy o 10 ostatnich artykułów z tej kategorii
4. Edge function wysyła do AI: oryginalny tekst + lista powiązanych artykułów
5. AI generuje treść z naturalnie wplecionymi linkami
6. Rezultat wraca do formularza PostEditor
```

## Przykład wygenerowanej treści

```html
<p>Robert Lewandowski zdobył kolejne dwa gole...</p>

<p>Trener <strong>Hansi Flick</strong> był zadowolony z postawy...</p>

<p><strong>Przeczytaj również:</strong></p>
<ul>
  <li><a href="/blink/fc-barcelona-liderem-la-liga-abc123">FC Barcelona liderem La Liga po zwycięstwie</a></li>
  <li><a href="/blink/lewandowski-najlepszym-strzelcem-def456">Lewandowski najlepszym strzelcem sezonu</a></li>
</ul>
```

## Alternatywne podejście: Linki w tekście

Zamiast sekcji na końcu, AI może wplatać linki naturalnie w treść:

```html
<p>To już trzeci mecz z rzędu, w którym Polak trafia do siatki. 
Jak pisaliśmy wcześniej, <a href="/blink/lewandowski-forma-abc123">forma 
Lewandowskiego w ostatnich tygodniach jest fenomenalna</a>.</p>
```

## Szczegóły techniczne

| Element | Wartość |
|---------|---------|
| Liczba pobieranych artykułów | 10 (ostatnie z kategorii) |
| Liczba linków do wstawienia | 1-2 |
| Format linku | `/blink/:slug` |
| Fallback gdy brak artykułów | Brak sekcji "Przeczytaj również" |

## Modyfikowane pliki

| Plik | Zmiana |
|------|--------|
| `supabase/functions/extract-article/index.ts` | Dodanie zapytania do bazy + rozszerzenie kontekstu AI |
| `src/pages/admin/Settings.tsx` | Aktualizacja DEFAULT_CONTENT_PROMPT o instrukcje linkowania |


# Plan: Ostrzeżenie o niewystarczającej treści do ekstrakcji

## Zidentyfikowany problem

Firecrawl działa poprawnie (fallback się uruchamia), ale weszło.com zwraca zbyt mało treści nawet po renderowaniu JavaScript (301 znaków zamiast potrzebnych kilku tysięcy). 

AI nie ma wystarczających danych i "halucynuje" - generuje artykuł o zupełnie innym temacie (Rashford zamiast Lewandowski) na podstawie fragmentów innych artykułów widocznych na stronie.

## Rozwiązanie

Dodać walidację jakości ekstrakcji z informacją zwrotną dla użytkownika:

```text
AKTUALNIE:
Firecrawl → 301 znaków → AI halucynuje → zły artykuł

PO ZMIANIE:
Firecrawl → 301 znaków → wykrycie problemu → ostrzeżenie dla użytkownika + opcjonalnie kontynuacja
```

---

## Szczegóły techniczne

### 1. Edge Function - zwracanie metadanych o ekstrakcji

**Plik:** `supabase/functions/extract-article/index.ts`

Dodać do odpowiedzi informacje o jakości ekstrakcji:

```typescript
const result = {
  ...extractedMetadata,
  content: generatedContent,
  og_image: ogImage,
  // NOWE: metadane o ekstrakcji
  extraction_info: {
    original_text_length: originalTextLength,   // przed Firecrawl
    final_text_length: articleText.length,      // po Firecrawl (lub bez)
    used_firecrawl: usedFirecrawl,              // czy użyto fallback
    quality_warning: articleText.length < 500,  // ostrzeżenie o niskiej jakości
  }
};
```

### 2. Frontend - wyświetlanie ostrzeżenia

**Plik:** `src/pages/admin/PostEditor.tsx`

Zmienić `handleAIExtract` aby pokazywał ostrzeżenie:

```typescript
const extractedData = await extractArticle.mutateAsync(sourceUrl);

// Sprawdź jakość ekstrakcji
if (extractedData.extraction_info?.quality_warning) {
  const textLength = extractedData.extraction_info.final_text_length;
  const usedFirecrawl = extractedData.extraction_info.used_firecrawl;
  
  toast.warning(
    `Strona zwróciła mało treści (${textLength} znaków).
     ${usedFirecrawl ? 'Użyto Firecrawl do renderowania JS.' : ''}
     Wygenerowana treść może być niedokładna - sprawdź przed publikacją!`,
    { duration: 8000 }
  );
} else {
  toast.success("Formularz wypełniony przez AI!");
}
```

### 3. Dodatkowa opcja - próg minimalnej jakości

Można też całkowicie zablokować generowanie gdy tekst jest za krótki:

```typescript
const ABSOLUTE_MIN_TEXT = 200;

if (articleText.length < ABSOLUTE_MIN_TEXT) {
  return new Response(
    JSON.stringify({ 
      error: `Strona zwróciła tylko ${articleText.length} znaków - za mało do wygenerowania artykułu. Spróbuj wkleić treść ręcznie.`,
      extraction_failed: true,
      text_length: articleText.length
    }),
    { status: 400, headers: corsHeaders }
  );
}
```

---

## Podsumowanie zmian

| Plik | Zmiana |
|------|--------|
| `supabase/functions/extract-article/index.ts` | Dodanie `extraction_info` do odpowiedzi + opcjonalnie blokada przy zbyt krótkiej treści |
| `src/pages/admin/PostEditor.tsx` | Wyświetlanie ostrzeżenia toast gdy jakość ekstrakcji jest niska |

## Rekomendacja

Sugeruję implementację **obu mechanizmów**:
1. **Ostrzeżenie** gdy tekst ma 200-500 znaków (pozwala kontynuować, ale ostrzega)
2. **Blokada** gdy tekst ma < 200 znaków (zbyt mało danych, lepiej nie generować)

Dzięki temu użytkownik będzie wiedział o problemie zamiast otrzymywać halucynujące treści.


# Plan: Dokończenie implementacji ostrzeżeń o niewystarczającej treści

## Zidentyfikowany problem

Poprzednie zmiany były **niekompletne**. Fallback do Firecrawl działa, ale:
1. Edge function **NIE zwraca** `extraction_info` z metadanymi o ekstrakcji
2. Edge function **NIE blokuje** generowania przy za krótkiej treści (< 200 znaków)
3. Frontend **NIE sprawdza** ostrzeżeń i zawsze pokazuje `toast.success`

Logi potwierdzają: Firecrawl zwraca tylko 301 znaków dla weszło.com - za mało do poprawnej ekstrakcji.

---

## Zmiany do wprowadzenia

### 1. Edge Function (`supabase/functions/extract-article/index.ts`)

**A) Dodać śledzenie zmiennych:**
```typescript
// Na początku przetwarzania (przed linią 316)
const originalTextLength = articleText.length;
let usedFirecrawl = false;
```

**B) Ustawić flagę przy użyciu Firecrawl:**
```typescript
// W bloku Firecrawl (linia ~347)
usedFirecrawl = true;
```

**C) Dodać blokadę dla minimalnej długości:**
```typescript
// Po bloku Firecrawl (przed linią 361)
const ABSOLUTE_MIN_TEXT = 200;
if (articleText.length < ABSOLUTE_MIN_TEXT) {
  console.error(`Text too short for AI generation: ${articleText.length} chars`);
  return new Response(
    JSON.stringify({ 
      error: `Strona zwróciła tylko ${articleText.length} znaków - za mało do wygenerowania artykułu.`,
      extraction_failed: true,
      text_length: articleText.length,
      used_firecrawl: usedFirecrawl
    }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

**D) Dodać `extraction_info` do odpowiedzi:**
```typescript
// Zmienić result (linia 539-543)
const result = {
  ...extractedMetadata,
  content: generatedContent,
  og_image: ogImage,
  extraction_info: {
    original_text_length: originalTextLength,
    final_text_length: articleText.length,
    used_firecrawl: usedFirecrawl,
    quality_warning: articleText.length < 500,
  }
};
```

### 2. Frontend (`src/pages/admin/PostEditor.tsx`)

**Zmienić `handleAIExtract` (linie 286-325):**
```typescript
try {
  const extractedData = await extractArticle.mutateAsync(sourceUrl);
  
  // Sprawdź jakość ekstrakcji
  const extractionInfo = extractedData.extraction_info;
  
  if (extractionInfo?.quality_warning) {
    toast.warning(
      `Strona zwróciła mało treści (${extractionInfo.final_text_length} znaków).` +
      (extractionInfo.used_firecrawl ? ' Użyto renderowania JavaScript.' : '') +
      ' Sprawdź wygenerowaną treść przed publikacją!',
      { duration: 8000 }
    );
  } else {
    toast.success("Formularz wypełniony przez AI!");
  }
  
  // ... reszta kodu wypełniania formularza
} catch (error) {
  // Błędy są obsługiwane przez hook useExtractArticle
}
```

---

## Diagram przepływu po zmianach

```text
URL źródłowy
    ↓
fetch(url) → HTML
    ↓
extractTextFromHtml() → tekst (np. 32 znaki)
    ↓
[SPRAWDZENIE] tekst < 100 znaków?
    ↓ TAK
Firecrawl scrape → tekst (np. 301 znaków)
    ↓
[SPRAWDZENIE] tekst < 200 znaków?
    ↓ TAK → BLOKADA + error response "Za mało znaków"
    ↓ NIE
[SPRAWDZENIE] tekst < 500 znaków?
    ↓ TAK → quality_warning = true
    ↓
Generuj AI + zwróć extraction_info
    ↓
Frontend: 
  - quality_warning? → toast.warning
  - nie? → toast.success
```

---

## Oczekiwane zachowanie

| Tekst | Firecrawl | Blokada? | Toast |
|-------|-----------|----------|-------|
| 32 znaki → 301 znaków | Tak | **TAK (< 200)** | `error: Za mało znaków` |
| 50 znaków → 450 znaków | Tak | Nie | `warning: Mało treści` |
| 2000+ znaków | Nie | Nie | `success: Wypełniono` |

---

## Podsumowanie zmian

| Plik | Zmiana |
|------|--------|
| `supabase/functions/extract-article/index.ts` | Blokada < 200 znaków, dodanie `extraction_info` do odpowiedzi |
| `src/pages/admin/PostEditor.tsx` | Wyświetlanie ostrzeżenia/błędu na podstawie `extraction_info` |

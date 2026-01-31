
# Plan: Naprawa publikacji podsumowania dnia

## Zidentyfikowany problem

Gdy użytkownik generuje "Podsumowanie dnia" i próbuje je opublikować, przycisk "Zapisz" nie reaguje. To dlatego, że:

1. **Wyścig warunków (race condition)** - `useEffect` wypełniający formularz uruchamia się zanim kategorie sportowe (`sportCategories`) załadują się z bazy danych
2. **`category_id` pozostaje puste** - warunek `if (otherCategory)` nie ustawia kategorii, bo `sportCategories` jest jeszcze `undefined`
3. **Cicha walidacja** - formularz nie przechodzi walidacji Zod (pole `category_id` wymaga min. 1 znaku), ale nie ma widocznego komunikatu błędu

## Dowody

- Schema wymaga: `category_id: z.string().min(1, "Wybierz kategorię")`
- Default value to: `category_id: ""`
- UseEffect sprawdza `if (otherCategory)` ale nie obsługuje przypadku gdy `sportCategories` jest niezaładowane
- Toast pokazuje "Formularz wypełniony..." nawet gdy kategoria NIE została ustawiona

## Rozwiązanie

### 1. Poczekaj na załadowanie kategorii przed wypełnieniem formularza

Dodać warunek sprawdzający czy kategorie są załadowane:

```typescript
useEffect(() => {
  // Poczekaj aż kategorie się załadują
  if (!sportCategories || isLoadingCategories) return;
  
  if (prefillData && !isEditing) {
    // ... wypełnianie pól ...
    
    const otherCategory = sportCategories.find((cat) => cat.slug === "other");
    if (otherCategory) {
      form.setValue("category_id", otherCategory.id);
    } else {
      // Fallback - użyj pierwszej dostępnej kategorii
      if (sportCategories.length > 0) {
        form.setValue("category_id", sportCategories[0].id);
      }
    }
    
    toast.info("Formularz wypełniony danymi z generatora podsumowania");
  }
}, [prefillData, isEditing, sportCategories, isLoadingCategories, form]);
```

### 2. Dodaj debugowanie błędów formularza

Dodać wyświetlanie błędów walidacji przy przycisku submit:

```typescript
{Object.keys(form.formState.errors).length > 0 && (
  <div className="text-sm text-destructive space-y-1">
    {Object.entries(form.formState.errors).map(([key, error]) => (
      <p key={key}>• {error?.message || `Błąd w polu ${key}`}</p>
    ))}
  </div>
)}
```

### 3. Zmienić zależności useEffect

Dodać `isLoadingCategories` do dependencies aby ponownie uruchomić effect gdy kategorie się załadują.

## Pliki do modyfikacji

| Plik | Zmiana |
|------|--------|
| `src/pages/admin/PostEditor.tsx` | Naprawić useEffect + dodać debugowanie błędów |

## Sekcja techniczna

### Kod przed zmianą (linie 118-143)
```typescript
useEffect(() => {
  if (prefillData && !isEditing) {
    // ...
    const otherCategory = sportCategories?.find((cat) => cat.slug === "other");
    if (otherCategory) {
      form.setValue("category_id", otherCategory.id);
    }
    toast.info("Formularz wypełniony...");
  }
}, [prefillData, isEditing, sportCategories, form]);
```

### Kod po zmianie
```typescript
useEffect(() => {
  // Poczekaj aż kategorie się załadują
  if (!sportCategories || sportCategories.length === 0) return;
  
  if (prefillData && !isEditing) {
    if (prefillData.title) form.setValue("title", prefillData.title);
    if (prefillData.excerpt) form.setValue("excerpt", prefillData.excerpt);
    if (prefillData.content) {
      const normalizedContent = normalizeMarkdownInHtml(prefillData.content);
      form.setValue("content", normalizedContent);
    }
    if (prefillData.tags) form.setValue("tags", prefillData.tags);
    
    form.setValue("source_url", "https://daily-sport-blink.lovable.app/podsumowanie");
    form.setValue("image_url", "/images/categories/daily-summary.webp");
    
    // Znajdź kategorię "other" lub użyj pierwszej dostępnej
    const otherCategory = sportCategories.find((cat) => cat.slug === "other");
    const categoryToUse = otherCategory || sportCategories[0];
    if (categoryToUse) {
      form.setValue("category_id", categoryToUse.id);
    }
    
    toast.info("Formularz wypełniony danymi z generatora podsumowania");
  }
}, [prefillData, isEditing, sportCategories, form]);
```

### Dodanie sekcji błędów (przed przyciskiem submit)
```tsx
{Object.keys(form.formState.errors).length > 0 && (
  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive space-y-1 mb-4">
    <p className="font-medium">Popraw błędy przed zapisaniem:</p>
    {Object.entries(form.formState.errors).map(([key, error]) => (
      <p key={key}>• {String(error?.message) || `Błąd w polu ${key}`}</p>
    ))}
  </div>
)}
```

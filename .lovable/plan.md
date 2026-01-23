

## Naprawa problemu z Click Tagami DoubleClick

### Problem
URL-e DoubleClick zawierające makra GDPR (np. `${GDPR}`, `${GDPR_CONSENT_755}`) powodują, że:
- Podgląd banera w panelu admina przestaje działać
- Baner nie wyświetla się na stronie głównej

### Przyczyna
1. Walidacja Zod (`z.string().url()`) może odrzucać URL z makrami jako niepoprawny
2. Znaki `${...}` mogą powodować problemy z parsowaniem w React/JSX

### Rozwiązanie

#### 1. Zmiana walidacji Click Tag w formularzu
Zamiast `.url()` użyjemy bardziej elastycznej walidacji:
- Sprawdzamy czy zaczyna się od `http://` lub `https://`
- Akceptujemy makra reklamowe jak `${GDPR}`

**Plik:** `src/pages/admin/BannerEditor.tsx`
```typescript
// Zamiast:
click_tag: z.string().url("Podaj poprawny URL"),

// Użyjemy:
click_tag: z.string()
  .min(1, "URL przekierowania jest wymagany")
  .refine(
    (val) => val.startsWith("http://") || val.startsWith("https://"),
    "URL musi zaczynać się od http:// lub https://"
  ),
```

#### 2. Analogiczna zmiana dla Impression Tag
```typescript
// Zamiast:
impression_tag: z.string().url("Podaj poprawny URL").optional().or(z.literal("")),

// Użyjemy:
impression_tag: z.string()
  .refine(
    (val) => !val || val.startsWith("http://") || val.startsWith("https://"),
    "URL musi zaczynać się od http:// lub https://"
  )
  .optional()
  .or(z.literal("")),
```

### Pliki do modyfikacji
- `src/pages/admin/BannerEditor.tsx` - schemat walidacji (linie 75-76)

### Dlaczego to zadziała
- Makra DoubleClick (`${GDPR}`) są poprawną częścią URL w kontekście reklam
- Przeglądarka prawidłowo obsługuje takie URL-e w atrybucie `href`
- Walidacja nadal sprawdza czy to jest URL (zaczyna się od http/https)

### Weryfikacja po wdrożeniu
1. Wklej pełny Click Tag DoubleClick w edytorze banera
2. Formularz powinien się zapisać bez błędów
3. Baner powinien wyświetlić się na stronie głównej
4. Kliknięcie w baner powinno przekierować do URL DoubleClick


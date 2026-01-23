
## Naprawa problemu z click_tag zawierającym makra DoubleClick

### Problem
URL w polu `click_tag` zawierający makra reklamowe `${GDPR}` powoduje zniknięcie banera z podglądu. React interpretuje znaki `${}` jako template literals w JSX, co powoduje błąd renderowania.

### Rozwiązanie
Zastosować escape'owanie URL przed przekazaniem do atrybutu `href` w komponencie `SponsorBanner`. Makra DoubleClick muszą pozostać niezmienione (bez enkodowania), ale muszą być bezpiecznie traktowane jako plain string.

### Zmiany w pliku

**`src/components/SponsorBanner.tsx`**

1. Dodać sanityzację URL na początku komponentu:
   ```typescript
   // Ensure ctaUrl is treated as plain string, not template literal
   const safeCtaUrl = ctaUrl ? String(ctaUrl) : "#";
   ```

2. Użyć `safeCtaUrl` zamiast `ctaUrl` we wszystkich miejscach w komponencie (linie 68, 150, 178, 206, 236)

### Alternatywnie - głębsza przyczyna

Jeśli problem leży w `react-hook-form` i `form.watch()`:

**`src/pages/admin/BannerEditor.tsx`**

1. Dodać bezpieczne pobieranie wartości:
   ```typescript
   const watchedValues = form.watch();
   
   // Ensure URLs are safe strings
   const safeClickTag = watchedValues.click_tag 
     ? String(watchedValues.click_tag) 
     : "#";
   ```

2. Przekazać do SponsorBanner:
   ```tsx
   <SponsorBanner
     ctaUrl={safeClickTag}
     ...
   />
   ```

### Efekt końcowy
Banery z makrami DoubleClick (np. `${GDPR}`, `${GDPR_CONSENT_755}`) będą poprawnie wyświetlane zarówno w podglądzie edytora jak i na stronie głównej.

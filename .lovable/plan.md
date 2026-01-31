
# Plan: Wdrożenie Google Analytics 4

## Wymagania wstępne

Przed wdrożeniem będziesz potrzebować:
1. **Konto Google Analytics** - jeśli nie masz, załóż na [analytics.google.com](https://analytics.google.com)
2. **Measurement ID** - identyfikator w formacie `G-XXXXXXXXXX`, który otrzymasz po utworzeniu "strumienia danych" (Data Stream) dla strony web

---

## Zakres wdrożenia

| Element | Opis |
|---------|------|
| Skrypt GA4 | Dodanie gtag.js do `index.html` |
| Page view tracking | Automatyczne śledzenie zmian tras w React Router |
| Komponent Analytics | Hook do śledzenia nawigacji w SPA |

---

## 1. Dodanie skryptu GA4 do index.html

Skrypt Google Analytics zostanie dodany do sekcji `<head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## 2. Komponent do śledzenia nawigacji SPA

Ponieważ aplikacja używa React Router (SPA), standardowy skrypt GA4 zarejestruje tylko pierwsze załadowanie strony. Aby śledzić nawigację między podstronami, utworzę hook `useAnalytics`:

**Nowy plik: `src/hooks/useAnalytics.ts`**
```tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const useAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
    }
  }, [location]);
};
```

## 3. Integracja z aplikacją

**Nowy komponent: `src/components/Analytics.tsx`**
```tsx
import { useAnalytics } from '@/hooks/useAnalytics';

export const Analytics = () => {
  useAnalytics();
  return null;
};
```

**Aktualizacja `src/App.tsx`**:
```tsx
import { Analytics } from "@/components/Analytics";

// Wewnątrz BrowserRouter:
<BrowserRouter>
  <Analytics />
  <ConditionalWallpaper />
  <Routes>
    ...
  </Routes>
</BrowserRouter>
```

---

## Pliki do utworzenia
- `src/hooks/useAnalytics.ts` - hook do śledzenia page views
- `src/components/Analytics.tsx` - komponent integrujący hook

## Pliki do edycji
- `index.html` - dodanie skryptu GA4
- `src/App.tsx` - dodanie komponentu Analytics

---

## Uwagi dotyczące RODO/GDPR

Google Analytics wymaga zgody użytkownika na śledzenie (cookie consent). Możliwe podejścia:

1. **Bez consent banner** - GA4 będzie działać, ale może naruszać GDPR dla użytkowników z UE
2. **Z consent banner** (zalecane) - dodanie bannera do wyrażenia zgody przed załadowaniem GA

Jeśli chcesz, mogę również przygotować prosty baner cookie consent.

---

## Co musisz zrobić

1. Utwórz konto Google Analytics 4 (jeśli nie masz)
2. Skopiuj Measurement ID (`G-XXXXXXXXXX`)
3. Po zatwierdzeniu planu podam Ci miejsce gdzie wkleić ID

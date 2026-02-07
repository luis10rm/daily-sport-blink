

# Audyt i naprawa śledzenia GA4

## Problem
GA4 przestał rejestrować ruch od ~2 lutego, mimo że realna liczba odwiedzin rośnie (potwierdzone przez wbudowaną analitykę: 239 visitors 6 lutego). To oznacza problem z implementacją trackingu, nie ze spadkiem ruchu.

## Przyczyna (najprawdopodobniej)
Podwójne wysyłanie zdarzeń `page_view`:
1. `gtag('config', 'G-T27C4HS75K')` w `index.html` automatycznie wysyla page_view
2. Hook `useAnalytics` wysyla DRUGI page_view przy kazdej nawigacji

GA4 moze to interpretowac jako anomalie i filtrowac dane.

## Zmiany

### 1. Naprawa podwojnego page_view w `index.html`

Dodanie `send_page_view: false` do konfiguracji GA4, aby wylaczyc automatyczny page_view (bo SPA hook go obsluguje):

```javascript
gtag('config', 'G-T27C4HS75K', { send_page_view: false });
```

### 2. Dodanie debugowania GA4 w `useAnalytics.ts`

Dodanie logowania w trybie development, aby mozna bylo potwierdzic, ze eventy sa wysylane:

```typescript
useEffect(() => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_title: document.title,
    });
    
    if (import.meta.env.DEV) {
      console.log('[GA4] page_view:', location.pathname);
    }
  } else if (import.meta.env.DEV) {
    console.warn('[GA4] gtag not loaded');
  }
}, [location]);
```

### 3. Dodanie GA4 Debug panel w admin Dashboard

Mala sekcja w Dashboard, ktora pokazuje:
- Czy `window.gtag` jest dostepny
- Ile page_view eventow zostalo wyslanych w biezacej sesji
- Ostatni wyslany event

To pozwoli adminowi szybko zweryfikowac, ze GA4 dziala poprawnie bez otwierania GA4 dashboardu.

## Pliki do zmiany
1. `index.html` -- dodanie `send_page_view: false`
2. `src/hooks/useAnalytics.ts` -- dodanie debug logowania
3. `src/pages/admin/Dashboard.tsx` -- dodanie sekcji GA4 debug (opcjonalnie)

## Po wdrozeniu - weryfikacja
1. Otworz strone w trybie incognito
2. Sprawdz w konsoli przegladarki czy `[GA4] page_view` sie loguje
3. W GA4 Real-Time sprawdz czy uzytkownicy sa widoczni
4. Porownaj dane Lovable Analytics vs GA4 przez nastepne 24h


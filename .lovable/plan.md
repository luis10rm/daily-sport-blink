
## Dodanie strony /news/* z noindex

### Cel
Artykuły pod ścieżką `/news/*` zostały przeniesione na `/blink/*`. Google może wciąż mieć zaindeksowane stare adresy `/news/*`. Potrzebujemy strony, która:
- Dodaje meta tag `<meta name="robots" content="noindex, follow">` (by Google wyindeksował stare URL-e)
- Informuje użytkownika, że artykuł został przeniesiony
- Linkuje do strony głównej (sygnał SEO "follow")

Uwaga: HTTP 410 jest niemożliwe w React SPA — status zawsze będzie 200. Noindex w meta tagu jest właściwym rozwiązaniem po stronie aplikacji.

### Plan implementacji

**1. Nowy plik: `src/pages/NewsGone.tsx`**

Strona wyświetlana dla wszystkich ścieżek `/news/*`:
- Ustawia `<meta name="robots" content="noindex, follow">` przez `useEffect`
- Wyświetla komunikat "Ten artykuł został przeniesiony" z linkiem do strony głównej i archiwum
- Używa istniejących komponentów: `Header`, `Footer`, `Button`
- Wygląd podobny do `NotFound.tsx`, ale z innym tekstem i ikoną (np. `MoveRight` lub `Archive`)

**2. Aktualizacja `src/App.tsx`**

Dodanie trasy przed `<Route path="*">`:
```tsx
<Route path="/news/*" element={<NewsGone />} />
```

### Technical details

Meta tag zostanie ustawiony przez `useEffect` bezpośrednio w `<head>` dokumentu i wyczyszczony przy odmontowaniu komponentu (żeby nie wpłynąć na inne strony). Użyjemy też istniejącego hooka `useSEOMeta` z opcją `robots: "noindex, follow"` — jest już zaimplementowany w `src/hooks/useSEOMeta.ts`.

### Pliki do zmiany
- **Nowy** `src/pages/NewsGone.tsx` — komponent strony
- **Edytowany** `src/App.tsx` — dodanie trasy `/news/*`

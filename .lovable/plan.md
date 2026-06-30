## Co ustaliłem

- Baza: **9 opublikowanych wpisów** (`status='published'`, 7 recenzji + 2 newsy).
- RLS publiczne (`Anyone can view published reviews`) działa poprawnie — nie filtruje nic dodatkowo.
- Hook `usePublishedReviews()` na `/tech` nie filtruje po kategorii ani typie — pobiera wszystkie 9.
- Test Playwrightem na świeżej sesji (`http://localhost:8080/tech`): renderuje się **9 kart `<article>`** z poprawnymi tytułami. Layout: 1 hero + 3 compact w sidebarze + 5 w siatce „Wszystko z Tech".

Czyli z punktu widzenia kodu i danych — wszystkie 9 wpisów jest dostępnych i renderowanych. Skoro u Ciebie pokazuje się mniej, problem leży **po stronie cache klienta**.

## Najbardziej prawdopodobna przyczyna

Wyłączyliśmy ostatnio PWA (`selfDestroying: true`), ale przeglądarki, które już zarejestrowały starego Service Workera, **wciąż serwują zcacheowaną starszą wersję listy** (np. sprzed publikacji ostatnich wpisów) dopóki SW się nie zderegistruje. Workbox `selfDestroying` deregistruje się dopiero po pełnym przeładowaniu strony przez użytkownika — a `usePublishedReviews` ma w React Query cache, więc nawet po deregistracji pierwszy render może pokazać stare dane z IndexedDB.

Dodatkowo żadne z zapytań do `reviews` nie ma realtime subscription ani `staleTime: 0`, więc widok nie odświeża się sam po publikacji w adminie.

## Plan działania

1. **Twarda weryfikacja u Ciebie (bez zmian w kodzie)**
   - Otwórz `/tech` w trybie incognito / innej przeglądarce. Jeśli widzisz 9 — to potwierdza, że problem to stale cache w Twojej głównej przeglądarce.
   - W DevTools → Application → Service Workers → „Unregister", potem hard refresh.

2. **Jeśli incognito też pokazuje mniej** — wykonam dalszą diagnostykę:
   - Sprawdzę, czy któreś wpisy mają `published_at` w przyszłości w Twojej strefie (RLS porównuje z `now()` UTC) lub czy ostatnio coś zostało odpublikowane.
   - Dodam tymczasowy log liczby pobranych wpisów w `ReckiHome`.

3. **Niezależnie od diagnozy — utwardzenie cache (proponowane drobne zmiany w `src/hooks/useReviews.tsx`):**
   - Ustawienie `staleTime: 60_000` + `refetchOnWindowFocus: true` dla `usePublishedReviews`, aby powrót do karty zawsze odświeżał listę.
   - Dodanie realtime subscription na tabeli `reviews` (analogicznie do `useTournamentMode`), żeby publikacja w adminie natychmiast pojawiała się publicznie bez ręcznego odświeżania.
   - Dodanie w `ReckiHome` małego nagłówka „X artykułów" (widoczny licznik) — łatwo będzie wzrokowo wyłapać rozjazd w przyszłości.

4. **Sprzątanie po starym Service Workerze** (na wszelki wypadek, dla użytkowników którzy weszli na stronę gdy PWA było aktywne):
   - Dodanie w `src/pwa/registerSW.ts` jawnego `navigator.serviceWorker.getRegistrations()` + `unregister()` przy starcie aplikacji, żeby przyspieszyć deregistrację u istniejących użytkowników.

## Pytanie do Ciebie przed implementacją

Najpierw potrzebuję jednej informacji: **sprawdź w incognito stronę `/tech` i powiedz, ile kart widzisz**. To rozstrzygnie, czy ruszamy z pkt 3+4 (cache), czy szukać głębiej (pkt 2).
## Problem

W Tech kafelki artykułów zachowują się różnie:

- `variant="mini"` (kafelki w sidebarze hero na `/tech`) — **cały kafelek jest `<a>`** z `useNavLink`, który ma `onTouchEnd` z `preventDefault()` + `navigate()`. Na mobile oznacza to, że samo dotknięcie (nawet przy próbie przewijania) natychmiast przenosi na artykuł. Brak w ogóle przycisku „Czytaj więcej".
- `variant="compact"` — kafelek nie jest linkiem, ale ma mały link „Czytaj" (`text-sm`, bez wyraźnego pola dotyku).
- `variant="default"` i `"hero"` — mają już przycisk „Czytaj więcej", kafelek nie jest klikalny.

## Rozwiązanie

**1. Kafelek przestaje być klikalny (`mini`)**
- Zamienić zewnętrzny `<a>` na `<article>` — obraz, kategoria i tytuł stają się nieklikalne.
- Dodać na dole kafelka przycisk „Czytaj więcej" jako jedyny element nawigujący.
- Zachować efekt hover na obrazku/tytule tylko na urządzeniach z myszką (`@media (hover: hover)` przez `group-hover` na desktopie), żeby na mobile nic nie sugerowało klikalności całego kafelka.

**2. Usunąć „instant redirect" z dotknięcia**
- W przyciskach Tech nie używać `onTouchEnd` z `preventDefault()`. Zamiast tego zwykły `onClick` + `touch-manipulation` — nawigacja odpala się dopiero po pełnym tapie (touchstart + touchend na tym samym elemencie), więc przewijanie palcem po kafelku już nie przenosi na artykuł.
- Zrobić to lokalnie dla kart Tech (nowy mały helper albo opcja w `useNavLink`), żeby nie zmieniać zachowania kart sportowych w tym kroku.

**3. Poprawa UX samego przycisku „Czytaj więcej"**
- Minimalna wysokość dotyku **44 px** (`min-h-11`), pełna szerokość na mobile w wariantach `mini` i `default`, wyśrodkowany tekst.
- Spójna stylistyka Tech (fuksja): wypełniony `bg-fuchsia-600` dla `hero`, obrysowany (outline) dla `default`/`mini` — jedna wyraźna hierarchia.
- Stan aktywny (`active:scale-[0.98]`), widoczny `focus-visible:ring` dla dostępności i klawiatury.
- `aria-label` z tytułem artykułu (np. „Czytaj więcej: {tytuł}") — samo „Czytaj więcej" jest nieinformatywne dla czytników ekranu i wielokrotnie powtórzone na stronie.
- Ikona strzałki przesuwa się w prawo tylko na hover z myszką.
- `variant="compact"` — powiększyć „Czytaj" do tego samego, wyraźnego pola dotyku.

**4. Weryfikacja**
- Test Playwright w widoku 393×852: sprawdzić, że tap na obrazku/tytule kafelka `mini` **nie** zmienia URL, a tap na „Czytaj więcej" prowadzi na `/tech/{kategoria}/{slug}`; zrzut ekranu kafelków.

## Szczegóły techniczne

- Pliki: `src/components/recki/ReviewCard.tsx` (główna zmiana), ewentualnie `src/hooks/useNavLink.ts` (opcjonalny wariant bez `onTouchEnd`).
- Bez zmian w danych, hookach recenzji i routingu — wyłącznie warstwa prezentacji i obsługa zdarzeń w karcie.

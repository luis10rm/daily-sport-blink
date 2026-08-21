# Dlaczego strona ładuje się bez stylów (jak na zrzutach)

## Co ustaliłem (na żywo, na szortsy.pl)

- Aktualne pliki ładują się poprawnie: `/assets/index-D-quGcAf.css` → 200 `text/css`, JS → 200 `application/javascript`.
- Ale **nieistniejący plik zasobu zwraca 200 z HTML-em**: `/assets/index-DEADBEEF.css` → `200 text/html`.
  Powód: w `vercel.json` reguła `rewrite` dla `/(.*)` przechwytuje wszystko, także `/assets/*`.
- HTML strony jest cache'owany na krawędzi (`x-vercel-cache: HIT`, `age: 7312`, przez worker `szortsy-edge-proxy`).

To daje dokładnie objaw ze zrzutów: przeglądarka (szczególnie iOS Safari / wejście z Messages) trzyma **stary index.html**,
prosi o **stare hashe** plików CSS/JS, dostaje w odpowiedzi HTML ze statusem 200 — więc CSS jest cicho odrzucany
(brak Tailwinda → domyślny serif, niebieskie linki, ogromne logo), a błąd nigdy nie eskaluje do 404, który wymusiłby przeładowanie.

## Co naprawiamy

1. **Zasoby nie mogą wpadać w SPA fallback**
   Przebudowa `vercel.json`: rewrite tylko dla ścieżek nawigacyjnych, z wyłączeniem `/assets/*` oraz plików z rozszerzeniem
   (`.css`, `.js`, `.png`, `.svg`, `.webp`, `.woff2`, `.xml`, `.txt`, `.json`).
   Efekt: brakujący plik = prawdziwy 404, a nie fałszywy HTML.

2. **Poprawne nagłówki cache**
   - `/assets/*` → `Cache-Control: public, max-age=31536000, immutable` (bezpieczne, bo hashowane).
   - HTML (`/`, `/index.html`) → `Cache-Control: no-store` (lub `max-age=0, must-revalidate` + `s-maxage=0`),
     żeby krawędź i przeglądarka nie podawały starego dokumentu z odwołaniami do usuniętych hashy.

3. **Sieć bezpieczeństwa w kliencie (samonaprawa)**
   Mały skrypt w `index.html`: jeśli po załadowaniu dokumentu główny arkusz stylów nie został zastosowany
   (brak `document.styleSheets` z naszego `/assets/*.css`) lub `onerror` na `<script type=module>`,
   wykonaj **jednorazowe** twarde przeładowanie z parametrem cache-bust (flaga w `sessionStorage`, żeby nie było pętli).
   To ratuje użytkowników, którzy już mają zapisany stary HTML.

4. **Weryfikacja**
   - `curl` na nieistniejący `/assets/x.css` → oczekiwane 404, nie 200 text/html.
   - Sprawdzenie nagłówków HTML i `/assets/*` po publikacji.
   - Test w Chromium/WebKit (mobile 390 px) na czystym i „zatrutym” cache.

## Uwaga o warstwie Cloudflare

Odpowiedź niesie `x-debug-worker: szortsy-edge-proxy` — jeśli ten worker cache'uje HTML,
same nagłówki z Vercela mogą nie wystarczyć. Po wdrożeniu punktów 1–3 zmierzę `age`/`cf-cache-status`
dla HTML i jeśli nadal będzie podawany z cache, przygotuję poprawkę w workerze (bypass cache dla dokumentów HTML).

## Szczegóły techniczne

- Pliki: `vercel.json` (rewrites + headers), `index.html` (inline guard, ~20 linii).
- Bez zmian w logice aplikacji, routingu, sitemapie ani w service workerze (`sw.js` jest już „self-destroying” i działa poprawnie).

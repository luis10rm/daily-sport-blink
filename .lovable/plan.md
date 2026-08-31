# Diagnoza GSC + plan naprawy Core Web Vitals

## Co pokazują dane z Search Console (1–28.08 vs 4–31.07)

| Metryka | Lipiec | Sierpień | Zmiana |
|---|---|---|---|
| Kliknięcia | 1 176 | 639 | -46% |
| Wyświetlenia | 616 319 | 60 262 | -90% |
| CTR | 0,19% | 1,06% | +5,5x |
| Średnia pozycja | 10,0 | 10,9 | -0,9 |

Interpretacja: spadek wyświetleń jest 10x większy niż spadek kliknięć, a CTR wzrósł ponad pięciokrotnie. To profil utraty jednej wielkiej powierzchni z masowymi wyświetleniami i prawie zerowym CTR (typowo: szerokie zapytania wokół wielkiego wydarzenia), a nie profil kary czy blokady indeksowania. Ruch "zwykły" spadł znacznie łagodniej.

Stan techniczny strony głównej według Google: "Submitted and indexed", robots ALLOWED, page fetch SUCCESSFUL, ostatni crawl 31.08.2026, kanoniczny URL wybrany prawidłowo. Nie ma dowodu na problem indeksowania strony głównej.

Czego te dane nie mówią: nie wiem, ile z 30 publikowanych dziennie artykułów faktycznie wchodzi do indeksu, ile jest w stanie "Crawled – currently not indexed" i jak wygląda pokrycie sitemapy. To wymaga danych, o które proszę niżej.

## Dane, o które proszę (żeby nie zgadywać)

Z panelu Search Console:
1. Raport Strony (Indeksowanie) — liczby dla: "Zaindeksowane", "Przeskanowana – obecnie niezaindeksowana", "Wykryta – obecnie niezaindeksowana", "Duplikat, Google wybrał inny URL".
2. Sitemapy — dla `https://sitemap.szortsy.pl/`: liczba wykrytych URL i data ostatniego odczytu.
3. Wyniki > Skuteczność z filtrem typu wyszukiwania **Wiadomości** oraz zakładka **Discover** (jeśli jest) — porównanie lipiec vs sierpień.
4. Statystyki indeksowania (Ustawienia > Statystyki indeksowania) — średni czas odpowiedzi i liczba żądań na dzień.

Bez punktu 3 nie da się rozstrzygnąć, czy 550 tys. utraconych wyświetleń to Discover/Wiadomości wokół mundialu, czy zwykłe wyniki wyszukiwania — a to zmienia całą strategię naprawy.

## Core Web Vitals: 34 mobile / 37 desktop

Znalezione w kodzie przyczyny, które to tłumaczą:

1. Wszystkie strony publiczne (`Index`, `BlinkPage`, `ReckiHome`, `ReckiReview`, `WorldCup2026`, `PozytywneHome` itd.) są importowane statycznie w `src/App.tsx` — jeden ogromny bundle główny na każde wejście. Tylko panel admina jest lazy.
2. Brak `manualChunks` w `vite.config.ts` — Tiptap, Embla, react-easy-crop, recharts, date-fns lądują w jednej paczce.
3. W `<head>` `index.html` blokująco startują GA4 i Meta Pixel przed treścią — bezpośrednio uderza w LCP/TBT na mobile.
4. CSS jest w całości inline'owany do HTML (plugin `inline-production-css`) — chroni przed awarią stylów, ale powiększa dokument i opóźnia pierwszy render.
5. Fonty Google wciąż w ścieżce krytycznej.

## Plan działania

**Etap 1 — rozstrzygnięcie przyczyny spadku (bez zmian w kodzie)**
Analiza danych z punktów 1–4 powyżej i jednoznaczna odpowiedź: utrata popytu eventowego vs problem indeksowania nowych artykułów. Dopiero potem decyzja o dalszych krokach SEO.

**Etap 2 — wydajność (niezależnie od SEO, warto zrobić)**
- Lazy-load stron publicznych w `App.tsx` z sensownym fallbackiem (bez migania), zostawiając `Index` w bundlu wejściowym.
- `manualChunks` w `vite.config.ts`: `react-vendor`, `editor` (Tiptap), `ui`, `charts`.
- GA4 i Meta Pixel przenieść na ładowanie po interakcji lub po `load` (opóźnienie ~2–3 s), zamiast blokującego `<head>`.
- CSS: zamiast pełnego inline'a — inline tylko krytycznego arkusza, resztę jako `<link>` z zachowanym zabezpieczeniem przeciw brakującym stylom.
- `font-display: swap` + preload wyłącznie użytego wariantu Outfit.

Cel: mobile LCP < 2,5 s i wynik PSI mobile w przedziale 60–75. Wynik "100" przy pełnym SPA + reklamach + pikselach nie jest realny i nie jest potrzebny.

**Etap 3 — SEO zależne od wyniku etapu 1**
Jeśli dane pokażą dużo "Crawled – currently not indexed": wzmocnienie linkowania wewnętrznego do świeżych artykułów, ograniczenie cienkich stron w sitemapie i weryfikacja, czy SSR z `api/render.js` faktycznie wykonuje się dla wszystkich ścieżek artykułów.

## Uwaga

Core Web Vitals to czynnik rankingowy o małej wadze — nie wyjaśnia spadku wyświetleń o 90%. Naprawa wydajności poprawi konwersję i doświadczenie użytkownika, ale nie należy jej traktować jako lekarstwa na ten spadek.

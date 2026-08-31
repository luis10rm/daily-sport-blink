# Recenzje miejsc (Podróże): skalowanie zdjęć + blok „Informacje praktyczne”

Zgadzam się z obiema obserwacjami. Recenzja hotelu to inny typ treści niż recenzja sprzętu — czytelnik szuka konkretów (ceny, dojazd, udogodnienia) i zdjęć w naturalnych proporcjach.

## 1. Naprawa skalowania zdjęć

Obecnie galeria wymusza kwadrat (`aspect-square`, `object-cover`), więc zdjęcia pionowe z telefonu są mocno przycinane, a okładka nie ma zarezerwowanych proporcji (skacze layout przy ładowaniu).

- Galeria: zamiast twardego kwadratu — układ masonry/kolumnowy zachowujący naturalne proporcje każdego zdjęcia (2 kolumny mobile, 3 desktop), bez przycinania.
- Okładka: stała rezerwacja proporcji 16:9 z `object-cover` i pozycją „center” — koniec przeskoku layoutu (CLS), spójna wysokość na wszystkich artykułach.
- Zdjęcia pionowe: limit wysokości, żeby nie zajmowały całego ekranu na mobile.
- Lightbox: pełne zdjęcie bez przycięcia + nawigacja strzałkami/swipe i licznik „3 / 12”.
- Podpisy zdjęć (opcjonalne pole) — przydatne w recenzjach miejsc („widok z balkonu”, „sala zabaw”).

## 2. Nowy blok „Informacje praktyczne”

Karta pod werdyktem (lub nad treścią) z uporządkowanymi faktami, wypełniana w panelu:

- Lokalizacja / adres + link do map
- Ceny (np. „od X zł/noc”, parking, dodatki)
- Sezon / kiedy jechać
- Dla kogo (rodziny z niemowlakiem, pary, aktywni)
- Udogodnienia — lista tagów (basen, sala zabaw, wyżywienie, plaża 500 m)
- Dojazd (samochód/pociąg, czas)
- Strona obiektu (link `rel="nofollow noopener"`)

Blok pojawia się tylko wtedy, gdy pola są wypełnione, więc recenzje sprzętu wyglądają jak dziś. Na mobile: dwie kolumny „etykieta / wartość”, na desktopie: 2–3 kolumny.

## 3. Panel admina

- Nowa sekcja „Informacje praktyczne” w edytorze recenzji — pola tekstowe + lista udogodnień (dodaj/usuń/przestaw).
- Generowanie AI: prompt dla kategorii Podróże wypełnia te pola automatycznie z materiału źródłowego (do weryfikacji przez redakcję).

## 4. SEO

- JSON-LD `Review` z `itemReviewed` typu `Hotel`/`LocalBusiness` (nazwa, adres, geo jeśli podane) + istniejący `FAQPage`.
- Alt-teksty zdjęć galerii z nazwy obiektu zamiast „Zdjęcie 1”.

## Szczegóły techniczne

- Migracja: `reviews.practical_info` (JSONB, domyślnie `{}`) — trzymamy elastycznie: `{address, map_url, price_from, parking, season, best_for, amenities: [], travel, website}`. Alternatywnie `gallery_captions` (JSONB) na podpisy.
- `src/pages/ReckiReview.tsx`: nowy komponent `PracticalInfo.tsx`, przebudowa galerii (CSS columns / grid z `auto-rows`), okładka w `aspect-[16/9]`, rozbudowa lightboxa.
- `src/components/OptimizedImage.tsx` bez zmian API — dodajemy tylko właściwe `sizes`/proporcje w miejscach użycia.
- `useReviews.tsx`: typ `practical_info` w interfejsie; `ReviewEditor.tsx`: formularz + zapis pola.
- Weryfikacja: Playwright — zrzuty artykułu 390px i 1280px przed/po.

## Kolejność

1. Migracja + typy
2. Blok „Informacje praktyczne” (front + panel)
3. Poprawki galerii, okładki i lightboxa
4. JSON-LD Hotel/LocalBusiness

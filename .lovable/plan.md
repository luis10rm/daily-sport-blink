# Diagnoza spadku w Google — wnioski z eksportów Coverage

## Co dokładnie pokazują Twoje pliki

Indeksacja (wszystkie znane strony):

| Data | Zaindeksowane | Niezaindeksowane | Wyświetlenia/dzień |
|---|---|---|---|
| 18.08 | 7 183 | 4 455 | 1 673 |
| 19.08 | 7 183 | 4 455 | 1 514 |
| 20.08 | 7 183 | 4 455 | 888 |
| **21.08** | **7 183** | **4 455** | **57** |
| 28.08 | 7 131 | 4 577 | 44 |

To jest kluczowa obserwacja: **liczba zaindeksowanych stron nie spadła**. 21.08 wyświetlenia runęły o ~97% z dnia na dzień, przy praktycznie niezmienionym indeksie. To wyklucza hipotezę "Google nas nie indeksuje" i wyklucza "koniec mundialu" (wygaszanie eventu jest stopniowe, nie z dnia na dzień o 97%).

Strony są w indeksie, ale przestały być pokazywane w wynikach. Taki profil ma zwykle jedną z trzech przyczyn:
1. działanie ręczne lub automatyczne filtrowanie za zasady dot. treści (przy 30 publikacjach dziennie generowanych przez AI to realna hipoteza — polityka „scaled content abuse"),
2. aktualizacja algorytmu (core / spam update) wdrożona ok. 20–21.08,
3. sygnał techniczny wysłany do Google dokładnie w tych dniach.

Danych z Search Console, które mam, **nie wystarczy, by wskazać którą** — i nie zamierzam zgadywać.

Drugi wątek, niezależny od spadku, ale poważny — jakość indeksu:

| Powód nieindeksowania | Liczba stron |
|---|---|
| Crawled – currently not indexed | 2 369 |
| Excluded by ‘noindex’ tag | 1 283 |
| Duplicate, Google chose different canonical | 641 |
| Duplicate without user-selected canonical | 115 |
| Alternate page with proper canonical | 74 |
| Page with redirect | 35 |

Z sitemapy (1 714 URL) zaindeksowanych jest 1 301, a 152 to „Crawled – not indexed". Ale w skali całej witryny Google zna 11 708 URL-i — czyli **ok. 10 tys. adresów poza sitemapą**. To rozjazd, który sam w sobie rozmywa crawl budget i mnoży duplikaty.

## Czego potrzebuję, żeby domknąć diagnozę

Trzy rzeczy z panelu Search Console (screeny wystarczą):
1. **Bezpieczeństwo i działania ręczne** — czy jest jakikolwiek wpis. To rozstrzyga hipotezę nr 1 w jednej sekundzie.
2. **Skuteczność → typ wyszukiwania: Wiadomości** oraz zakładka **Discover** — porównanie 1–20.08 vs 21–31.08. Jeśli cały ubytek siedzi w Wiadomościach/Discover, to inny scenariusz niż spadek w zwykłym wyszukiwaniu.
3. **Ustawienia → Statystyki indeksowania** — czy liczba żądań Googlebota też spadła po 20.08.

Dodatkowo powiedz mi, czy 20–21.08 działo się coś poza kodem: zmiana hostingu/DNS, przepięcie domeny, zmiana w Cloudflare, publikacja dużej partii treści.

## Plan działania

**Etap 1 — rozstrzygnięcie przyczyny załamania z 21.08 (bez zmian w kodzie)**
Po otrzymaniu trzech powyższych danych wskażę przyczynę i dopiero wtedy zaproponuję naprawę. Jeśli to działanie ręczne — plan naprawczy treści i wniosek o ponowne rozpatrzenie. Jeśli algorytm — plan podnoszenia jakości. Jeśli technika — konkretna poprawka.

**Etap 2 — porządek w indeksie (do zrobienia niezależnie)**
- Ustalić, skąd bierze się ~10 tys. URL-i spoza sitemapy, i albo dodać je do sitemapy, albo odciąć (canonical / noindex / usunięcie linków).
- 641 stron z „Google wybrał inny kanoniczny" — przejrzeć próbkę i naprawić wskazania kanoniczne; narzędzie „Duplikaty" już mamy, trzeba je na tym puścić.
- 1 283 stron z `noindex` — potwierdzić, że to wyłącznie strony celowo wyłączone (tagi < 4 artykuły, `/dzien/*`, `/archiwum`, `/tagi`), a nie przypadkowe artykuły.
- 2 369 „Crawled – not indexed" — sprawdzić próbkę pod kątem cienkiej/powtarzalnej treści.

**Etap 3 — wydajność (Core Web Vitals 34/37)**
Znalezione w kodzie przyczyny: wszystkie strony publiczne ładowane w jednej wielkiej paczce (`src/App.tsx` — lazy tylko panel admina), brak podziału paczek w `vite.config.ts`, GA4 i Meta Pixel startujące blokująco w `<head>`, pełny CSS wklejony do HTML, fonty w ścieżce krytycznej. Naprawa: lazy-load stron publicznych, podział paczek, odroczenie skryptów śledzących, inline tylko krytycznego CSS.

Uwaga: to warto zrobić dla użytkowników, ale **Core Web Vitals nie tłumaczy spadku o 97% w jeden dzień**. Nie traktujmy tego jako lekarstwa na obecny problem.

## Kolejność

Nie zaczynam Etapu 2 ani 3, dopóki nie wiemy, co się stało 21.08 — inaczej możemy tygodniami optymalizować coś, co nie jest przyczyną.

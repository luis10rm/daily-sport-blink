# Plan: diagnoza i naprawa spadku kliknięć z Google

## Co już wiadomo z Search Console

- Strona główna `https://szortsy.pl` jest według Google: `Submitted and indexed`.
- Google może pobrać stronę: `page_fetch_state = SUCCESSFUL`, ostatni crawl: `2026-08-24`.
- Robots dla strony głównej: `ALLOWED`, canonical wybrany przez Google: `https://szortsy.pl`.
- Spadek jest realny w danych GSC: po 20.08 następuje nagłe załamanie dziennych wyświetleń i kliknięć:
  - 18.08: 10 klików / 1673 wyświetlenia
  - 19.08: 14 klików / 1514 wyświetleń
  - 20.08: 10 klików / 888 wyświetleń
  - 21.08: 0 klików / 57 wyświetleń
  - 22.08: 1 klik / 44 wyświetlenia
  - 23.08: 2 kliki / 59 wyświetleń
- Live check potwierdził, że `https://szortsy.pl/`, `robots.txt`, `https://sitemap.szortsy.pl/` i przykładowy artykuł zwracają HTTP 200.

Wniosek: to nie wygląda jak zwykły koniec Mundialu. Wygląda jak techniczna utrata widoczności większości URL-i od okolic 21.08, mimo że homepage nadal jest w indeksie.

## Cel

Ustalić, czy Google przestał widzieć artykuły przez problem techniczny po ostatnich zmianach, a następnie naprawić tylko potwierdzone przyczyny.

## Plan działań

### 1. Porównać, co dokładnie zniknęło z wyników

Sprawdzę w Search Console dane dzienne i listę stron dla okresów:

- przed spadkiem: 15.08–20.08,
- po spadku: 21.08–23.08,
- jeśli GSC udostępnia już nowsze dane: 24.08–25.08.

Porównam:

- czy spadły wszystkie strony, czy tylko `/blink/*`,
- czy strona główna nadal ma wyświetlenia,
- czy Tech/Pozytywne/sport zachowują się inaczej,
- czy zniknęły zapytania newsowe, brandowe czy konkretne artykuły.

### 2. Sprawdzić sitemapę jako głównego podejrzanego

Ponieważ główna sitemapa działa przez `https://sitemap.szortsy.pl/`, sprawdzę jej mechanizm i zgodność z aktualnymi trasami.

Do sprawdzenia:

- czy sitemap zawiera aktualne, indeksowalne URL-e artykułów,
- czy nie zawiera URL-i z `noindex`, duplikatów lub błędnych ścieżek,
- czy `/autor/` zastąpiło wszędzie stare `/redakcja/`,
- czy Tech i Pozytywne są w sitemapie,
- czy `<news:news>` jest generowany tylko dla artykułów sportowych młodszych niż 2 dni,
- czy `<lastmod>` nie jest ustawiany masowo na aktualną datę generowania, bo to może wyglądać dla Google jak fałszywa zmiana wszystkich URL-i.

Jeśli potwierdzi się problem z `lastmod`, usunę fallback oparty o bieżącą datę i zostawię `lastmod` tylko tam, gdzie mamy prawdziwy timestamp konkretnej treści.

### 3. Sprawdzić meta robots i canonical dla kluczowych typów stron

Zweryfikuję initial HTML, czyli to, co Google dostaje bez czekania na JavaScript:

- `/`,
- kilka świeżych `/blink/*`,
- `/tech`,
- `/pozytywne`,
- `/archiwum`,
- `/tagi`,
- wybrane `/tag/*`,
- wybrane `/kategoria/*`.

Szukam szczególnie:

- przypadkowego `noindex`,
- canonical wskazującego z artykułu na homepage albo inną stronę,
- brakujących lub błędnych meta tagów po stronie serwera/edge,
- rozjazdu między tym, co widzi użytkownik, a tym, co widzi crawler.

### 4. Sprawdzić routing i przekierowania po zmianach Vercel / sitemap / autorzy

Zweryfikuję konfigurację routingu:

- `vercel.json`,
- funkcję sitemap,
- przekierowania `/redakcja/* -> /autor/*`,
- fallback SPA,
- obsługę subdomeny `sitemap.szortsy.pl`.

Celem jest wykluczenie sytuacji, w której Googlebot dostaje inny status, inny HTML lub błędny fallback niż zwykły użytkownik.

### 5. Naprawić potwierdzone problemy

W zależności od wyniku diagnozy wykonam tylko potrzebne zmiany, np.:

- korekta sitemap generatora,
- usunięcie fałszywego masowego `lastmod`,
- poprawka `news:news`,
- korekta robots/canonical dla konkretnych szablonów,
- korekta routing/redirect rules,
- usunięcie URL-i `noindex` z sitemap.

### 6. Walidacja po poprawkach

Po zmianach sprawdzę:

- live HTTP statusy,
- `robots.txt`,
- sitemap XML,
- initial HTML kluczowych stron,
- przykładowe artykuły w Search Console URL Inspection, jeśli potrzebne.

Na końcu przygotuję krótką listę: co było przyczyną, co zostało naprawione i co trzeba obserwować przez kolejne 48–72h, bo GSC raportuje dane z opóźnieniem.

## Najbardziej prawdopodobne hipotezy do potwierdzenia

1. Problem w sitemapie lub sygnałach świeżości, szczególnie masowe `lastmod` ustawione na datę generowania.
2. Błąd w meta robots/canonical dla artykułów lub wybranych sekcji.
3. Problem routingowy po zmianach Vercel/sitemap subdomain, widoczny głównie dla crawlerów.
4. Mniejsza, ale możliwa hipoteza: GSC jeszcze nie ma pełnych danych za ostatnie dni — to nie tłumaczy jednak tak ostrego spadku 21–23.08.

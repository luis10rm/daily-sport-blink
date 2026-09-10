# SEO: stan obecny i kolejne kroki

## Co pokazują dane (sprawdzone dzisiaj)

- Search Console (11.08–07.09): 247 kliknięć, 25 102 wyświetleń. Poprzednie 28 dni: 1 165 kliknięć i 398 301 wyświetleń. Spadek wyświetleń to ~94%.
- Strona główna jest zaindeksowana, robots pozwala na indeksowanie, ostatni crawl dziś o 09:22 — czyli to nie blokada indeksowania.
- Widoczność opiera się na kilku pojedynczych newsach; brak szerokiej powierzchni wyświetleń, którą mieliśmy wcześniej (najpewniej Discover / karuzele newsowe).

## Co jest technicznie zepsute (potwierdzone na żywej stronie)

1. Artykuł `/blink/...` — działa dobrze: Google dostaje tytuł, opis i pełną treść w pierwszej odpowiedzi.
2. Strona główna — dostaje poprawny tytuł, ale obszar treści jest **pusty**: lista 30 najnowszych newsów nie trafia do odpowiedzi, choć kod ją przewiduje.
3. Strona kategorii (`/kategoria/pilka-nozna`) — odpowiada tytułem „Kategoria nie znaleziona”, czyli serwer nie odnajduje kategorii w bazie i oddaje Google stronę-błąd zamiast listy artykułów.
4. Nagłówki: odpowiedź jest oznaczona jako nieprzechowywalna (`no-store`), a mimo tego pośrednik oddawał wersję sprzed ~9 godzin — warto to uporządkować, żeby świeże newsy nie utykały w cache.

To dokładnie te strony, z których Google zbiera świeże newsy do karuzel i Discover — jeśli widzi na nich pustkę albo komunikat o błędzie, przestaje traktować serwis jako źródło newsów.

## Plan naprawy

### Krok 1 — diagnoza dwóch niedziałających ścieżek (najpierw, bez zmian na produkcji)
- Sprawdzić, dlaczego renderowanie po stronie serwera nie widzi danych: czy klucze dostępu do bazy są ustawione w środowisku hostingu, oraz czy awaryjny klucz zapisany w kodzie jest w ogóle poprawny (wygląda na uszkodzony).
- Sprawdzić, jaki adres faktycznie dochodzi do renderującej funkcji (podejrzenie: pośrednik nie przekazuje ścieżki tak, jak zakłada kod).
- Wynik diagnozy decyduje o kształcie kroku 2 — nie chcę zgadywać przyczyny.

### Krok 2 — naprawa treści dla Google na stronach zbiorczych
- Strona główna i strony kategorii oddają w pierwszej odpowiedzi listę najnowszych artykułów (nagłówek, linki, daty, zajawki).
- Gdy pobranie danych się nie uda, strona **nie** oddaje komunikatu „nie znaleziono” — zwraca neutralny tytuł i pozwala aplikacji dorenderować treść. Fałszywy błąd jest gorszy niż brak treści.
- Objąć tym samym mechanizmem `/tech`, `/pozytywne` i ich kategorie — dziś dostają tylko tytuł i opis, bez listy.
- Ustawić spójne, krótkie buforowanie (kilka minut) zamiast sprzecznych nagłówków.

### Krok 3 — weryfikacja po wdrożeniu
- Pobrać na żywo `/`, `/kategoria/...`, `/tech`, `/pozytywne`, jeden artykuł z każdego kanału i potwierdzić obecność treści oraz linków w surowej odpowiedzi.
- Sprawdzić, czy sitemapa oddaje aktualne daty i czy najnowsze artykuły są w niej obecne.
- Poprosić o ponowne pobranie kilku kluczowych adresów w Search Console; efekt widoczny zwykle po 3–10 dniach.

### Krok 4 — szybkość strony (osobny etap, po naprawie treści)
- Wyniki wydajności 34/37 realnie ograniczają szanse w Discover i na mobile.
- Zakres: dzielenie kodu stron (dziś wszystkie strony ładują się jednym pakietem), odłożenie skryptów analitycznych, przegląd wczytywania fontów i największego obrazu na stronie.
- Robimy to po kroku 2, żeby nie mieszać dwóch źródeł zmian w danych.

## Szczegóły techniczne

- `api/render.js`: gałąź `path === "/"` zawsze buduje `listBody`, a żywa odpowiedź ma `<div id="root"></div>` — czyli `meta.content` jest puste, co wskazuje na inną wartość `path` niż zakładana albo na wyjątek w `fetchRows`.
- Awaryjny `BACKEND_ANON_KEY` w `api/render.js` ma zniekształcony payload (`"iss":"HS256"`), więc bez zmiennych środowiskowych każde zapytanie PostgREST zwróci 401.
- `fetchOne` zwraca `undefined` przy błędzie i `null` przy braku wiersza; gałąź kategorii traktuje `null` jako „nie znaleziono” i wystawia noindexowy komunikat — trzeba rozdzielić błąd od faktycznego 404.
- Nagłówki: funkcja ustawia `s-maxage=300`, a warstwa brzegowa (`x-debug-worker: szortsy-edge-proxy`) nadpisuje je na `no-store` przy `age` ~32000 s. Wymaga uzgodnienia jednej polityki.
- Skanery SEO w projekcie są przestarzałe (ostatnie uruchomienie w maju), więc ich brak zgłoszeń nie jest dowodem poprawności — po wdrożeniu warto odpalić ponowne skanowanie.

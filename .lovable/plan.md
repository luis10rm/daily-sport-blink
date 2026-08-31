# Usunięcie pustej przestrzeni pod „Tematem dnia” w Tech

## Cel
Wypełnić wolny obszar pod głównym artykułem użyteczną treścią, zachowując czytelny układ na telefonach.

## Plan zmian
1. Przebudować sekcję otwierającą Tech na desktopie na dwa niezależne pionowe obszary:
   - lewa kolumna (2/3 szerokości): „Temat dnia”, a bezpośrednio pod nim widget „Jakiej recenzji szukasz?”;
   - prawa kolumna (1/3 szerokości): trzy dodatkowe kafelki artykułów.
2. Usunąć obecną osobną instancję widgetu spod całej siatki, aby nie powstał duplikat ani dodatkowy odstęp.
3. Na mobile zachować naturalną kolejność: „Temat dnia” → reklama mobilna → dodatkowe artykuły → widget ankiety, z równymi odstępami i bez pustych miejsc.
4. Sprawdzić stronę Tech w szerokości desktopowej i mobilnej, zwracając uwagę na brak pustej przestrzeni, brak duplikacji widgetu oraz poprawne ułożenie reklam.

## Szczegóły techniczne
Zmiana będzie ograniczona do kompozycji strony `ReckiHome`; nie zmieni działania ankiety, danych artykułów ani panelu administracyjnego.
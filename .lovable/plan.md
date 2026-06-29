## Problem

Na `/tech` (ReckiHome) sekcja hero używa siatki 2-kolumnowej z `items-stretch`. Lewa kolumna ma 1 kartę hero (tylko obraz 16:9 z tekstem w overlay), prawa ma 3 ułożone pionowo karty. Wrapper `h-full [&>a]:h-full` rozciąga kartę hero do wysokości prawej kolumny, ale jej zawartość (image 16:9) zachowuje proporcje — pod spodem zostaje pusty ciemny prostokąt tła karty. To jest „dziwna lewa kolumna" ze screena.

## Naprawa

Dwie zmiany, obie w warstwie prezentacyjnej:

1. **`src/components/recki/ReviewCard.tsx` — wariant `hero`**: przebudować na układ kolumnowy `flex flex-col h-full`:
   - górą obraz 16:9 z badge'em ocen (bez overlay tekstu),
   - pod spodem `flex-1` blok z kategorią, tytułem (text-2xl) i excerpt,
   - dzięki `flex-1` body wypełnia pozostałą wysokość, gdy karta jest rozciągnięta przez grid.

2. **`src/pages/ReckiHome.tsx`**: uprościć wrapper hero — usunąć hacki `[&>a]:h-full [&>a]:flex [&>a]:flex-col` (karta sama się rozciąga przez `h-full` w komponencie). Zachować `items-stretch` na gridzie, żeby obie kolumny miały tę samą wysokość bez dziur.

Efekt: brak pustego ciemnego pasa pod obrazem hero; lewa kolumna wygląda jak pełnoprawna karta z obrazem + tekstem dopasowanym do wysokości stosu 3 kart po prawej.

## Co NIE zmieniam

- Logika danych, breakpointy, kolory/tokeny, warianty `default`/`compact`, banery i sticky mobile — bez zmian.

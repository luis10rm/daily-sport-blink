## Dlaczego powstaje dziura

Sekcja hero na `/tech` to grid 2-kolumnowy z `items-stretch`:
- **Lewa kolumna**: 1 karta hero (`ReviewCard variant="hero"`)
- **Prawa kolumna**: 3 karty ułożone pionowo z `gap-4`

`items-stretch` wymusza, by **lewa karta miała tę samą wysokość co cała prawa kolumna** (3 karty + 2 gapy ≈ 900px). Karta hero ma w środku: obraz `aspect-[16/9]` (sztywne ~440px) + krótki blok tekstu (~150px). Reszta (~300px) to puste `flex-1` w kolorze `bg-card`, które na tle ciemnego motywu wygląda jak „dziura". Excerpt jest krótki, więc nic tej przestrzeni nie wypełnia.

To nie jest bug CSS — to świadome rozciąganie karty do wysokości sąsiada, ale wizualnie wygląda fatalnie.

## Rozwiązanie

Przebudowuję wariant hero karty na **immersyjny obraz pełnowymiarowy z overlay tekstu** — wzorzec znany z onet.pl / theverge.com:

1. **`ReviewCard` variant `hero`** — zamiast `flex-col` (obraz nad tekstem) używam `absolute inset-0` dla obrazu + gradient overlay od dołu + tekst pozycjonowany `absolute bottom-0`. Cała karta to jeden duży kafel, obraz wypełnia 100% wysokości (object-cover), tekst leży na nim. Brak pustego `flex-1`.

2. **`ReckiHome` sekcja hero** — zachowuję `items-stretch` (bo teraz to działa na naszą korzyść: obraz wypełnia dowolną wysokość). Dodatkowo daję karcie hero `min-h-[480px]`, żeby na desktopie nie była zbyt płaska, gdy w prawej kolumnie są mniej niż 3 karty.

3. **Mobile** — na <`lg` grid składa się do jednej kolumny i hero przestaje rozciągać, więc dodaję `aspect-[16/10]` jako fallback wysokości.

### Co się zmienia wizualnie

- Hero: duży, immersyjny obraz z tytułem białym tekstem na gradiencie czarnym (bottom→top). Score badge w prawym górnym rogu (bez zmian).
- Prawa kolumna: bez zmian — 3 karty standard.
- Reszta strony bez zmian.

## Zakres zmian

- `src/components/recki/ReviewCard.tsx` — przepisanie wariantu `hero` (overlay layout).
- `src/pages/ReckiHome.tsx` — dodanie `min-h-[480px]` na karcie hero, drobny porządek w gridzie.

Bez zmian w bazie danych, hookach, innych komponentach.

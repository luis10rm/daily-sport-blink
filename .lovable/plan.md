## Diagnoza

Tak — masz rację. W `src/components/Header.tsx` i `src/components/recki/ReckiHeader.tsx` używane są standardowe `<Link>` z React Router. To dokładnie ten sam wzorzec, który wcześniej naprawialiśmy w `NewsCard`, `NewsOfTheDay` i `TodaysNewsBanner`, gdzie iOS Safari wymagał podwójnego tapnięcia (first tap = focus, second = click).

Elementy w nagłówku z tym problemem:
- **Header (Sport)**: logo `Link to="/"`, `Archiwum`, `Autorzy`, pozycje w dropdownie `Kategorie` (`Link to="/kategoria/:slug"`)
- **ReckiHeader (Tech)**: logo `Link to="/tech"`, pozycje w dropdownie kategorii
- **ModeSwitcher**: pigułka `Sport` ↔ `Tech`

Działają od pierwszego tapnięcia (bo używają natywnych mechanizmów): `ThemeToggle` (button), trigger dropdownu (Radix), `MatchTicker` (już ma `onTouchEnd` + `navigate`).

## Plan naprawy

Zastosować ten sam, sprawdzony wzorzec co w `NewsCard`/`NewsOfTheDay`/`TodaysNewsBanner`:

1. **`src/components/Header.tsx`** — zamienić `Link` na `<a href>` + `onClick` + `onTouchEnd` wywołujące `navigate()` z `useNavigate()`:
   - logo `/`
   - `Archiwum` → `/archiwum`
   - `Autorzy` → `/autorzy`
   - elementy `DropdownMenuItem asChild` → `Link` (kategorie). Trzymamy `asChild`, ale w środku `<a>` z handlerami.

2. **`src/components/recki/ReckiHeader.tsx`** — to samo dla:
   - logo `/tech`
   - elementy dropdownu kategorii Tech (`/tech/kategoria/:slug`)

3. **`src/components/recki/ModeSwitcher.tsx`** — przepisać oba warianty pigułki (Sport ↔ Tech) na `<a>` + `onClick`/`onTouchEnd` + `navigate()`.

W każdym przypadku:
- zachować `href` (SEO, prawe kliknięcie „otwórz w nowej karcie", Cmd/Ctrl+klik)
- w `onTouchEnd`: `e.preventDefault()` + `navigate(path)`
- w `onClick`: jeśli nie modyfikator (`metaKey`/`ctrlKey`/`shiftKey`) → `e.preventDefault()` + `navigate(path)`
- pozostawić wszystkie istniejące klasy CSS bez zmian
- nie ruszać `ontouchstart=""` w `index.html` ani globalnej reguły `touch-action: manipulation`

## Czego NIE zmieniam

- `ThemeToggle` (czysty button — działa)
- triggery `DropdownMenu` (Radix obsługuje touch poprawnie)
- `MatchTicker` (już ma wzorzec)
- żadnej logiki biznesowej / danych

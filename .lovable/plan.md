## Dlaczego obecny układ zawodzi

Hero (lewa kolumna, 1/2) + 3 standardowe karty (prawa, 1/2) z `items-stretch` wymusza, by hero miał wysokość 3 kart pionowo (~900px). Hero z obrazem 16:9 + krótki tekst nie wypełnia tej wysokości — stąd "dziura" lub (po ostatniej zmianie) sztucznie rozciągnięty obraz, który nie wygląda jak hero portalu tylko jak baner.

## Nowy układ (wybór B)

```text
┌──────────────────────────────────────────┬───────────────┐
│                                          │ [img] tytuł   │
│        HERO 2/3 szerokości               │       kategoria│
│        obraz 16:9 + meta + tytuł         ├───────────────┤
│        + excerpt POD obrazem             │ [img] tytuł   │
│        (klasyczny układ kolumnowy)       │       kategoria│
│                                          ├───────────────┤
│                                          │ [img] tytuł   │
│                                          │       kategoria│
└──────────────────────────────────────────┴───────────────┘
```

Hero jest wizualnie **najszerszy** (dominuje horyzontalnie), a sidebar to wąska lista 3 kompaktowych pozycji, która naturalnie dopasowuje się do wysokości hero. Zero dziur, zero rozciągania obrazu.

## Zmiany

### `src/pages/ReckiHome.tsx` — sekcja hero
- Grid: `lg:grid-cols-3` zamiast `lg:grid-cols-2`.
- Hero: `lg:col-span-2` (2/3 szerokości).
- Sidebar: `lg:col-span-1`, `flex flex-col gap-3`, 3 karty `variant="compact"`.
- Usuwam `items-stretch` i `min-h-[480px]` — niepotrzebne.

### `src/components/recki/ReviewCard.tsx` — wariant `hero`
Wracam do klasycznego układu kolumnowego (obraz nad tekstem), bo teraz hero nie musi już udawać pełnej wysokości — sidebar dopasuje się do niego:
- `flex flex-col`, obraz `aspect-[16/9]` na górze (object-cover, naturalne proporcje).
- Pod obrazem: kategoria (badge magenta), duży tytuł (text-2xl md:text-3xl), excerpt (line-clamp-3), opcjonalnie meta (data/autor).
- Score badge w prawym górnym rogu obrazu (jak teraz).
- Usuwam `absolute inset-0` overlay, `min-h-[480px]`, `aspect-[16/10]` fallback — wszystko zbędne.

### Wariant `compact` w sidebarze
Już istnieje (`variant="compact"`: miniatura 64×64 + tytuł 2 linie + kategoria + score). Używam go bez zmian. Ewentualnie powiększę miniaturę do 80×80 dla lepszej wagi wizualnej obok hero.

## Mobile

Na `<lg` grid składa się do jednej kolumny: hero (pełna szerokość), pod nim 3 compact-karty jedna pod drugą — naturalna lista. Bez specjalnych breakpointów.

## Zakres

- `src/pages/ReckiHome.tsx` — przebudowa sekcji hero (grid 3 kolumn).
- `src/components/recki/ReviewCard.tsx` — uproszczenie wariantu `hero` z powrotem do układu kolumnowego, drobne tuning wariantu `compact`.

Bez zmian w bazie, hookach, innych komponentach.

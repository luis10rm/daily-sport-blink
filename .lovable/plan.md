## Problem

Obecnie baner ma jeden `position` (np. `home_top`) i jeden flag `show_on_tech`. To działa dla par 1:1 (sport→tech), ale:
- nie pozwala zaemitować jednego banera w kilku slotach jednocześnie (np. tylko Sport top + Tech middle),
- `show_on_tech` jest sztywno powiązany ze slotem-odpowiednikiem,
- trudno rozszerzyć o kolejne sekcje (np. przyszły hub MŚ, archiwum).

## Rozwiązanie: pole `sections` (multi-select) zamiast pojedynczego flag

Każdy baner zyskuje listę sekcji, w których ma się emitować. Domyślnie `['sport']` (zachowanie wsteczne).

### Model danych

Dodaj kolumnę do `banners`:
- `sections text[] not null default '{sport}'` — np. `{sport,tech}`.
- Migracja danych: dla istniejących wierszy z `show_on_tech=true` → `sections = {sport,tech}`, reszta `{sport}`.
- `show_on_tech` zostaje jeszcze przez jeden cykl jako fallback, potem do usunięcia.

`position` pozostaje bez zmian — jeden slot na baner (np. `home_top`). Jeśli ktoś chce wstawić ten sam kreatyw w innym slocie, robi duplikat (UX prosty: przycisk "Duplikuj").

### Mapowanie slotów między sekcjami

Tabela równoważności (już istnieje w kodzie jako `TECH_SPORT_EQUIVALENT`) zostaje, ale w obie strony:

```
home_top         ↔ recki_home_top
home_middle      ↔ recki_home_middle
home_bottom      ↔ recki_home_bottom
article_top      ↔ recki_article_top
article_bottom   ↔ recki_article_bottom
sticky_mobile    ↔ recki_sticky_mobile
```

Sloty bez odpowiednika (np. `worldcup_*`) zostają mono-sekcyjne.

### Logika pobierania (`useActiveBannerForDevice`)

Hook dostaje aktualną sekcję z kontekstu (`sport` | `tech`) — odczytujemy z `ModeContext` / ścieżki URL. Query:

1. Wylicz kandydatów: właściwy `position` + jego cross-section equivalent.
2. Pobierz wszystkie aktywne banery z tych pozycji.
3. Filtruj po `sections @> '{<aktualna_sekcja>}'`.
4. Filtruj daty + grafikę + `target_device` (jak dziś).
5. Losuj jeden.

To pozwala: baner w slocie sportowym `home_top` z `sections={sport,tech}` zostaje wyemitowany zarówno na `/` jak i na `/tech`. Baner w `recki_home_top` z `sections={tech}` tylko na `/tech`.

### Panel admina (`BannerEditor.tsx`)

Zamiast Switcha "Wyświetlaj też w sekcji Tech":
- **Checkbox group "Sekcje emisji"**: ☑ Sport, ☑ Tech (przyszłe: Hub MŚ).
- Walidacja: min. 1 sekcja.
- Pomocniczy tekst: "Baner pojawi się w odpowiadającym slocie w każdej zaznaczonej sekcji."
- Lista banerów (`BannersList`): kolumna "Sekcje" z badge'ami (Sport / Tech).
- Filtr "Sekcja" w widoku listy.

### Targetowanie urządzeń — bez zmian

`target_device` (`all`/`desktop`/`mobile`) zostaje ortogonalne. Macierz: sekcje × urządzenia daje 4 kombinacje (Sport desktop, Sport mobile, Tech desktop, Tech mobile) z jednego rekordu.

### Detekcja aktualnej sekcji

W `ReckiHome`/`ReckiReview`/`ReckiCategory` zapytania o sloty `recki_*` jawnie przekazują `section: 'tech'`. W sportowych — `'sport'`. Bez globalnego stanu — prościej i pewniej.

## Plan wdrożenia

1. **Migracja DB**: dodaj `sections text[]`, backfill na podstawie `show_on_tech`, indeks GIN dla szybkiego `@>`.
2. **`useBanners.tsx`**: rozszerz `Banner` o `sections`, `useActiveBannerForDevice(position, device, section)` o nowy parametr i filtr `.contains('sections', [section])`.
3. **`BannerEditor.tsx`**: zamień Switch na grupę checkboxów `sections` z Zod walidacją min(1).
4. **`BannersList`** (admin): kolumna "Sekcje" + filtr.
5. **Strony tech**: przekaż `section: 'tech'` do hooka we wszystkich miejscach (`ReckiHome`, `ReckiReview`, `ReckiCategory`).
6. **Strony sport**: przekaż `section: 'sport'` (lub default).
7. **Deprecation**: zostaw `show_on_tech` jako read-only przez 1 wersję, potem migracja usuwająca kolumnę.

## Co to daje użytkownikowi

- Jeden baner emitowany w Sport + Tech jednocześnie (checkboxy zamiast pojedynczego switcha).
- Łatwe rozszerzenie na kolejne sekcje (dodanie wartości do listy).
- Czysty model: "baner ma jeden slot, ale może żyć w wielu sekcjach".

## Pytanie otwarte

Czy zostawiamy regułę "jeden baner = jeden slot" (różne sloty = duplikat), czy chcesz iść dalej i pozwolić wybierać też wiele slotów dla jednego rekordu (np. emisja w `home_top` i `home_middle` z tego samego wiersza)? Druga opcja komplikuje rotację i statystyki — rekomenduję pierwszą + przycisk "Duplikuj baner".
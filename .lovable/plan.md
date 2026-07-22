# Fix: ChannelSwitcher overflows on mobile

## Problem

Na mobile trzy widoczne taby (Sport · Tech · Pozytywne) + logo kanału + Kategorie + ThemeToggle nie mieszczą się w headerze — switcher wylewa się poza prawą krawędź (widać na screenie: aktywny "Pozytywne" wystaje poza ekran, a duplikat ikony `Sun` z ThemeToggle ląduje w czarnym marginesie safe-area).

Trzy taby w headerze to za dużo real-estate na <400px. Musimy pogodzić dwa cele:
- świadomość istnienia Tech/Pozytywne w każdej sesji (cel Cross-promocji),
- brak overflow i brak konkurencji z logo kanału / Kategorie.

## Rozwiązanie: kompaktowy switcher na mobile, pełne taby na desktop

**Mobile (`< sm`, ~<640px):** `ChannelSwitcher` renderuje tylko aktywny kanał jako pełną pigułkę (ikona + etykieta w kolorze kanału) + 2 małe ikonowe pigułki nieaktywnych kanałów (bez tekstu, tylko `Icon`, `aria-label`). Całość ~ 3 razy węższa niż obecnie, mieści się obok Kategorii i ThemeToggle.

**Desktop (`≥ sm`):** bez zmian — trzy pełne taby z ikoną + etykietą, tak jak dziś.

Dodatkowo w `PozytywneHeader` (i analogicznie w `Header` sportowym oraz `ReckiHeader`, jeśli mają ten sam problem) — ukrywamy podtytuł kanału na mobile już jest (`hidden sm:block`), zostawiamy. Przycisk "Kategorie" na mobile pokazuje tylko chevron (bez słowa) — już tak działa. Nic więcej nie ruszamy w headerach.

## Wizualizacja (mobile)

```text
[LogoKanału]        [⌄ Kategorie] [● Pozytywne] [🏆] [💻] [🌗]
                                  aktywny        idle idle theme
```

- aktywny: pełna pigułka z kolorem kanału i etykietą
- idle: kwadratowe/okrągłe ikonowe pigułki 28×28, tylko ikona, `aria-label` z pełną nazwą, dyskretny hover w kolorze kanału

## Zakres techniczny

Pliki do zmiany:
- `src/components/ChannelSwitcher.tsx` — dodać wariant mobile:
  - dla `key === active` render jak dziś (pełny label),
  - dla idle na mobile: pojedyncza ikona bez tekstu, klasy `p-1.5` zamiast `px-2.5 py-1.5`, `aria-label={c.label}`,
  - kontrola breakpointem CSS: klasy `sm:inline-flex` / `sm:hidden` na labelach, żeby zachować SSR-safe render bez `useEffect`.
- Brak zmian w `Header.tsx`, `PozytywneHeader.tsx`, `ReckiHeader.tsx` — kontrakt komponentu ten sam.
- Brak zmian w `CrossChannelStrip` i w feedzie.

## Poza zakresem

- Nie przenosimy switchera do dolnej nawigacji ani do menu hamburgera — celowo trzymamy widoczność wszystkich 3 kanałów w headerze, po prostu w wersji ikonowej dla idle.
- Nie zmieniamy detekcji kanału ani hrefów.

## Weryfikacja

Po wdrożeniu sprawdzam headera na widoku 375px (iPhone SE) w preview_ui mobile — logo kanału, Kategorie, kompaktowy switcher i ThemeToggle mają się mieścić w jednej linii bez overflow, aktywny kanał wyraźnie oznaczony kolorem.

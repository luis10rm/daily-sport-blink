# Mocniejszy kontrast tekstu w trybie jasnym (murawa)

## Problem
Pasy murawy w trybie jasnym (`hsl(140 45% 78%)` / `hsl(140 50% 68%)`) są wciąż zbyt ciemne/nasycone względem domyślnego tekstu, przez co treść leżąca bezpośrednio na tle (nagłówki sekcji, opisy, muted text) słabo się czyta.

## Zmiany w `src/index.css`

1. **Rozjaśnienie i zmniejszenie nasycenia pasów murawy (light mode)**
   - Pasy: `hsl(140 35% 90%)` ↔ `hsl(140 40% 84%)` — czytelny efekt koszenia, ale tło zbliżone jasnością do białego.
   - Reflektor złoty u góry: obniżenie alpha z `0.18` do `0.10`, żeby nie „mleczył" górnej części strony.

2. **Wymuszenie ciemniejszego tekstu w trybie turniejowym (light)**
   W bloku `.tournament-worldcup` dodanie:
   - `--foreground: 150 40% 8%` (bardzo ciemna zieleń zamiast domyślnej)
   - `--muted-foreground: 150 20% 28%` — ciemniejszy muted, czytelny na zieleni

3. **Karty jako wyraźne, jasne powierzchnie**
   - `--card: 0 0% 100%` w `.tournament-worldcup` (light), żeby karty były czysto białe i mocno odcinały się od murawy — tekst w kartach zawsze na białym.

## Bez zmian
- Tryb ciemny i stadium night (kontrast tam jest OK).
- Złote akcenty, ring kart, logika komponentów.

## Weryfikacja
Podgląd w trybie jasnym (desktop + 390×844): czytelność nagłówków na tle, kontrast muted textu, wygląd kart.
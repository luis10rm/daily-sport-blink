## Problem
Na `/recki` widać murawę w pasach — to globalny background z `.tournament-worldcup` (ustawiony na `<html>` dla trybu MŚ). `.mode-recki` definiuje własne tło, ale tournament-worldcup ma silniejszą specyficzność dla `body` i wygrywa, więc gradient recków nigdy się nie pokazuje.

## Rozwiązanie

### 1. Neutralizacja tła mundialowego na trybie recki
W `src/index.css` dodać reguły, które na `.mode-recki` (nawet jeśli równocześnie jest `.tournament-worldcup`) wyłączają pasy murawy i ustawiają jednolite, minimalistyczne tło.

### 2. Nowe tło — minimalistyczne, modernistyczne
Inspiracja: OneTech / Linear / Vercel.

**Light mode:**
- Baza: prawie biała (`hsl(300 20% 99%)`), bez gradientów radialnych pasujących do sportu.
- Jedna delikatna mgła magenta w prawym górnym rogu (bardzo subtelna, ~5% opacity) — sygnatura brandu Recki, nie dekoracja.
- `background-attachment: fixed`, brak pasów, brak powtórzeń.

**Dark mode:**
- Baza: głęboki neutralny grafit z lekko magentowym podtonem (`hsl(290 15% 7%)`).
- Jedna mgła magenta w rogu (~12% opacity).
- Bez gradientów liniowych, bez tekstur.

### 3. Header/Footer/Cards
- Header recki: usunąć `bg-card/60` z gradientem murawowym pod spodem; ustawić `bg-background/80` z `backdrop-blur` żeby zlał się z nowym tłem.
- Karty recenzji (`ReviewCard`) zostają na `bg-card` — kontrastują z prawie-białym tłem przez minimalny border, bez cieni.

### 4. Pewność izolacji
Dodać `html.mode-recki body { background-image: none !important; background-color: hsl(var(--background)); }` plus warstwa pseudo-element `::before` z mgłą magenta (`position: fixed; inset: 0; z-index: -1; pointer-events: none`). To gwarantuje, że tournament-worldcup i ewentualny stadium-night nie przebiją się przez tło recków.

## Pliki do zmiany
- `src/index.css` — sekcja `.mode-recki` (rewrite tła + override tournament).
- `src/components/recki/ReckiHeader.tsx` — drobny tweak tła headera.

## Wyłączone z zakresu
Pasek PatronBar, banery, kolory primary/accent (zostają magenta/róż jak w poprzedniej iteracji).

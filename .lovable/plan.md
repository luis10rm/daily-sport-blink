# Klikalny ribbon „MŚ 2026 • NA ŻYWO" + brak double-tap

## Problem
Ribbon na `/blink/:slug` („Mistrzostwa Świata 2026 • NA ŻYWO") wygląda jak baner, ale jest zwykłym `<div>` — nic się nie dzieje po dotknięciu. Naturalna ścieżka to hub `/mistrzostwa-swiata-2026` (tam, gdzie prowadzą wszystkie inne elementy MŚ: TodaysMatchesBanner, MatchTicker, WorldCupHomeBanner, MatchOfTheDay, WorldCupBadge).

Drugi wymóg: brak „double-tap" — efekty hover na iOS aktywują się przy pierwszym dotknięciu zamiast nawigować. Trzeba tego uniknąć tu i we wszystkich nowych elementach.

## Zmiana
Plik: `src/components/WorldCupRibbon.tsx`

1. Zamiana zewnętrznego `<div>` na `<Link to="/mistrzostwa-swiata-2026">` z react-router-dom.
2. Dodać `ArrowRight` po prawej (jak w `WorldCupHomeBanner`) + `aria-label` „Przejdź do strefy MŚ 2026".
3. W fazie `live` strzałka + tekst; w fazie `pre` analogicznie. Faza `post` dalej `null`.

## Reguła „no double-tap" (dla tego i każdego nowego klikalnego elementu)
- Klasa `touch-manipulation` na elemencie interaktywnym.
- Hover tylko przez `@media (hover: hover)` — w Tailwind używać `[@media(hover:hover)]:hover:...` zamiast samego `hover:...` na efektach kolor/tło, które na iOS „zjadają" pierwszy tap.
- Bez `transform`/`scale` na hover na mobile (na desktopie OK pod `@media (hover: hover)`).
- Cały klikalny obszar to JEDEN `<Link>`/`<button>` — nie zagnieżdżamy stopPropagation hacków.
- Bez `onMouseEnter` triggerujących stan, który blokuje nawigację.

Zastosować to konkretnie w ribbonie: `touch-manipulation`, hover na border/tło tylko pod `[@media(hover:hover)]:hover:...`, `transition-colors` bez `scale`.

## Poza zakresem
- Nie ruszam `BlinkPage.tsx`, logiki fazy MŚ, dat ani backendu.
- Audyt istniejących elementów pod kątem double-tap — tylko jeśli poprosisz osobno.

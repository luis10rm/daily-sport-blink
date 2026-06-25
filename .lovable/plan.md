## Cel
Dodać dedykowany, premium widget odliczania do najbliższego meczu MŚ 2026 w hubie `/mistrzostwa-swiata-2026`.

## Nowy komponent: `src/components/worldcup/NextMatchCountdown.tsx`

Duża, wyrazista karta odliczania z 4 kafelkami (dni / godz / min / sek).

**Logika wyboru meczu** (reużycie wzoru z `MatchTicker`):
- Jeśli jest mecz LIVE → karta pokazuje status LIVE (czerwony puls, wynik, minuta), bez countdownu.
- W przeciwnym razie najbliższy nadchodzący (`SCHEDULED`/`TIMED`) wg `utcDate`.
- Brak nadchodzącego → komponent zwraca `null`.

**Hook countdown**:
- Wyekstrahować `useCountdown(iso)` i `formatCountdown` z `MatchTicker.tsx` do nowego pliku `src/hooks/useCountdown.ts` (shared). MatchTicker importuje stamtąd — zero zmiany zachowania.
- Dodatkowo `splitCountdown(ms) → { d, h, m, s }` do renderu 4 kafelków.

**Render karty** (tylko prezentacja, semantic tokens / amber accent):
- Wrapper: `rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-background p-5 md:p-7 mb-10`.
- Nagłówek: `Trophy` + label `Następny mecz` lub `Trwa mecz` (LIVE).
- Linia drużyn: crest + nazwa (`tla` na mobile, `shortName` na md+) z `vs` lub wynikiem na środku.
- Pod spodem: 4 kafelki countdown `grid grid-cols-4 gap-2 md:gap-3` — każdy `rounded-xl bg-amber-500/10 border border-amber-500/20 py-3 text-center` z dużą cyfrą (`text-3xl md:text-4xl font-bold tabular-nums text-amber-500`) i etykietą (`text-[10px] uppercase tracking-wider text-muted-foreground`).
- Stopka: data + godzina kick-offu (`fmtKickoff`) + grupa/runda jeśli dostępna (`m.group`/`m.stage`).
- W trybie LIVE: zamiast countdownu — duży wynik `text-5xl font-bold tabular-nums` i pulsujący znacznik `minute'`.

**Mobile / hover**:
- `touch-manipulation`, brak hover-only states.
- Karta nie jest klikalna (info-only) — link „Pełny terminarz" jako `<Link>` w stopce do `#terminarz` (zakotwiczenie do `WorldCupMatchesWidget`).

## Integracja
- `src/pages/WorldCup2026.tsx`: zamontować `<NextMatchCountdown />` **bezpośrednio pod `<WorldCupHero />`**, przed `<WorldCupMatchesWidget />`.
- `MatchTicker.tsx`: zaktualizować importy hooka countdown z nowej lokalizacji (`@/hooks/useCountdown`). Logika bez zmian.

## Out of scope
- Brak zmian w Hero (zostaje "za X dni" w fazie pre).
- Brak nowego renderu w innych widokach.
- Bez nowych zależności.

## Weryfikacja
- Build OK, typy OK.
- Wizualnie w `/mistrzostwa-swiata-2026`: pod hero pojawia się karta `Polska — Argentyna · za 3d 04h 12m 35s`.
- W przypadku LIVE: karta pokazuje wynik bez countdownu.
- Sekundy tykają co 1s gdy <1h do meczu (pause przy ukrytej karcie).

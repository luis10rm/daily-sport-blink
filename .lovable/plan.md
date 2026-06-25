## Cel
Na istniejącym pasku `MatchTicker` (sticky pod headerem) obok godziny następnego meczu dopisać licznik odliczający czas do kick-offu. Brak nowych widgetów, brak zmian w innych komponentach.

## Zakres zmian — wyłącznie `src/components/MatchTicker.tsx`

1. **Nowy hook `useCountdown(iso)`** (lokalny, w pliku):
   - `setInterval` co 60s (a gdy < 1h — co 1s, żeby końcówka tykała żywo).
   - Zwraca `{ days, hours, minutes, seconds, totalMs }`.
   - Cleanup na unmount; pause gdy `document.hidden`.

2. **Funkcja `formatCountdown(ms)`** zwracająca krótki napis PL:
   - `> 24h` → `za 3d 4h`
   - `1h–24h` → `za 5h 22m`
   - `1–60 min` → `za 14 min`
   - `< 60 s` → `za chwilę`
   - `≤ 0` i status nadal `TIMED/SCHEDULED` → `lada moment`

3. **Render**: obok obecnej godziny (linia 87) dodać małą pigułkę:
   ```
   19:00 · za 2h 14m
   ```
   - Tylko gdy `!live && !finished && !hasScore`.
   - Klasy: `text-[11px] md:text-xs font-medium text-amber-700 dark:text-amber-400 tabular-nums whitespace-nowrap`.
   - Na mobile (`sm:hidden` dla godziny pozostawić) — countdown widoczny zawsze, godzinę chować przy bardzo wąskich ekranach jeśli się nie mieści (klasa `hidden xs:inline` nie istnieje w Tailwind, więc po prostu kompaktowy zapis `19:00·2h14m` na <380px przez `text-[10px]`).

4. **Live**: gdy mecz IN_PLAY — countdown nieaktywny, zachowujemy obecny wynik + minutę.

## Out of scope
- Brak osobnego widgetu na homepage / w hubie.
- Brak zmian w `MatchOfTheDay`, `TodaysMatchesBanner`, `WorldCupHero`.
- Bez nowych zależności (czysty `useState` + `useEffect`).

## Weryfikacja
- Build pass.
- Wizualnie w preview: ticker pokazuje `PL — ARG  19:00 · za 2h 14m`.
- Po przejściu meczu w LIVE countdown znika, pojawia się wynik (już zaimplementowane).

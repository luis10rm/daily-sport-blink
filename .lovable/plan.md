## Cel
Na `/mistrzostwa-swiata-2026` w miejsce dominującej sekcji „Tabele grup" wchodzi **drabinka pucharowa** (od 1/16 do finału). Tabele grup pozostają dostępne jako zwijany akordeon poniżej — jako archiwum fazy grupowej.

## Zmiany w UI

1. **Nowy komponent `WorldCupBracket.tsx`** (`src/components/worldcup/`)
   - Renderuje 5 kolumn: `1/16` (16 meczów), `1/8` (8), `Ćwierćfinały` (4), `Półfinały` (2), `Finał` + mecz o 3. miejsce.
   - Layout: poziomy scroll (`overflow-x-auto snap-x`) na wszystkich rozmiarach, minimalna szerokość kolumny 220 px, odstępy pionowe skalowane per runda (mecze wyżej w drabince są centrowane względem par z rundy niższej — CSS grid + `margin-block: auto`, bez rysowania linii łączących w MVP; zamiast linii cienki myślnik `→` między kolumnami).
   - Karta meczu: dwie drużyny (flaga + TLA + wynik), status (SCHEDULED / LIVE z pulsującą kropką / FINISHED), data i godzina po polsku. Bez rywala → placeholder „TBD" i tło `bg-card/30`.
   - Highlight: karta LIVE ma bursztynową obwódkę i lekki glow (`shadow-[0_0_0_1px_hsl(45_100%_50%/.5)]`), FINISHED — subtelnie przygaszona z zielonym paskiem „KONIEC".
   - Nagłówek sekcji: „Drabinka pucharowa" + krótki opis: „Faza pucharowa Mistrzostw Świata 2026 — od 1/16 do finału."

2. **Grupowanie danych z API** (w komponencie, `useMemo`)
   - Źródło: istniejący `useWorldCupMatches()` → `FDMatch[]`.
   - Filtr: `stage ∈ { 'LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL' }` (football-data.org). Fallback: wszystko z `stage` nie zawierającym „GROUP".
   - Sort w kolumnie: po `utcDate` rosnąco.
   - Empty state (przed startem knockoutu): karta „Drabinka pojawi się po zakończeniu fazy grupowej (18 czerwca)."

3. **Refaktor `WorldCup2026.tsx`**
   - Kolejność sekcji: Hero → NextMatchCountdown → **WorldCupBracket** (nowa, główny akcent) → WorldCupMatchesWidget (terminarz/wyniki bez zmian) → **Accordion „Tabele grup"** (zwinięty domyślnie) opakowujący istniejący `WorldCupStandings` → WorldCupTopScorers → WorldCupNewsAggregator.
   - Accordion: shadcn `Accordion` (`type="single" collapsible`), trigger „Tabele fazy grupowej" + podtytuł „Archiwum — grupy A–L".

4. **Bez zmian w danych / edge functions.** `worldcup-data` już zwraca `matches` z polem `stage`, którego używamy do budowy drabinki.

## Techniczne szczegóły

- Nowe pliki: `src/components/worldcup/WorldCupBracket.tsx`.
- Edytowany: `src/pages/WorldCup2026.tsx` (import Accordion z `@/components/ui/accordion`, przetasowanie sekcji, opakowanie `WorldCupStandings`).
- Bez zmian: `WorldCupStandings.tsx` (używany wewnątrz accordion), `useWorldCupData.ts`, edge function `worldcup-data`, cache.
- Style: paleta bursztynu (`amber-500`) spójna z resztą hubu, brak nowych fontów, brak nowych zależności.

## Poza zakresem MVP
- Rysowanie łączących linii SVG między parami (można dodać później).
- Interaktywne rozwijanie karty meczu do składów / strzelców.
- Predykcje użytkowników / typer.
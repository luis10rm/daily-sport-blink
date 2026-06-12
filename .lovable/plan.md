## Cel
Naprawić błąd, przez który posty z kategorii Mistrzostw Świata pokazują krótki przebłysk treści, a potem pustą stronę.

## Co wdrożę
1. Uodpornię komponent `WorldCupMatchCenter` na niepełne dane z API meczów i z tagów posta.
2. Zablokuję możliwość wywalenia całej strony artykułu, jeśli dane meczu są niepełne lub niepasujące.
3. Zweryfikuję, że posty mundialowe dalej pokazują Match Center tam, gdzie dane są poprawne, a w pozostałych przypadkach po prostu go ukrywają zamiast crashować widok.

## Zakres zmian
- `src/components/worldcup/WorldCupMatchCenter.tsx`
- ewentualnie drobne zabezpieczenie w `src/pages/BlinkPage.tsx` tylko jeśli będzie potrzebne do bezpiecznego renderu

## Szczegóły techniczne
- `normalize(...)` zostanie zmienione na null-safe, żeby nie wywoływać `.toLowerCase()` na `null` lub `undefined`.
- Przed dopasowaniem drużyn odfiltruję puste i niepoprawne tagi.
- Dopasowanie drużyn będzie działało także wtedy, gdy `team.name`, `shortName` albo `tla` są brakujące.
- Jeśli po filtracji nie da się wiarygodnie wskazać meczu, komponent zwróci `null` zamiast wysadzać cały render artykułu.

## Efekt
Posty z kategorii MŚ 2026 przestaną znikać po załadowaniu; artykuł będzie się normalnie renderował, a Match Center pokaże się tylko wtedy, gdy dane są bezpieczne i kompletne.